from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from typing import Dict, List
from core.dependencies import get_current_user_ws
from core.database import get_db_connection
from models import User
from datetime import datetime

router = APIRouter()

# --- Connection Manager ---
# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # Room ID -> List of WebSockets
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str) -> bool:
        """Connect a websocket to a room. Returns False if room is full (2 max)."""
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        
        # Enforce 2-person limit
        if len(self.rooms[room_id]) >= 2:
            await websocket.accept()
            await websocket.send_json({"type": "error", "message": "Room is full. Maximum 2 participants allowed."})
            await websocket.close(code=4003, reason="Room full")
            print(f"[SIGNALING] Rejected connection to room '{room_id}' - room is full (2 max)")
            return False
        
        await websocket.accept()
        self.rooms[room_id].append(websocket)
        print(f"[SIGNALING] Client connected to room '{room_id}'. Total clients in room: {len(self.rooms[room_id])}")
        print(f"[SIGNALING] All active rooms: {list(self.rooms.keys())}")
        return True

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            if websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        print(f"[SIGNALING] Client disconnected from room '{room_id}'")

    async def broadcast_to_others(self, message: dict, sender: WebSocket, room_id: str):
        if room_id in self.rooms:
            other_clients = [c for c in self.rooms[room_id] if c != sender]
            print(f"[SIGNALING] Broadcasting '{message.get('type')}' to {len(other_clients)} other client(s) in room '{room_id}'")
            for connection in other_clients:
                try:
                    await connection.send_json(message)
                    print(f"[SIGNALING] Successfully sent to a peer")
                except Exception as e:
                    print(f"[SIGNALING] Failed to send to peer: {e}")
        else:
            print(f"[SIGNALING] Room '{room_id}' not found for broadcast!")

manager = ConnectionManager()

# --- Routes ---

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user: User = Depends(get_current_user_ws)):
    # Normalize room_id to lowercase for consistency
    room_id = room_id.lower()
    print(f"[SIGNALING] New WebSocket connection attempt for room: '{room_id}' by user: {user.username} ({user.role})")
    
    # --- Authorization Check ---
    conn = get_db_connection()
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (room_id,)).fetchone()
    conn.close()
    
    if not meeting:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Meeting not found")
        return

    is_authorized = False
    if user.role == "interviewer":
        if meeting["creator_username"] == user.username:
            is_authorized = True
    elif user.role == "candidate":
        # Check if this is the candidate for this meeting
        if meeting["candidate_email"] and meeting["candidate_email"] == user.email:
            is_authorized = True
        # If no candidate assigned yet, and this is a registered candidate, assign them
        elif not meeting["candidate_email"] and user.email:
            conn = get_db_connection()
            conn.execute("UPDATE meetings SET candidate_email = ? WHERE id = ?", (user.email, room_id))
            conn.commit()
            conn.close()
            is_authorized = True
            print(f"[SIGNALING] Assigned candidate {user.email} to meeting {room_id}")
        # Or if logged in via code (guest)
        elif user.username == f"candidate_{room_id}":
            is_authorized = True

    if not is_authorized:
        print(f"[SIGNALING] Authorization failed for user {user.username} in room {room_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not authorized for this meeting")
        return

    conn = get_db_connection()
    conn.execute("INSERT OR IGNORE INTO candidates (meeting_id, name, joined_at) VALUES (?, ?, ?)", 
                 (room_id, user.full_name or user.username, datetime.utcnow()))
    conn.commit()
    conn.close()

    # Try to connect - will be rejected if room is full
    connected = await manager.connect(websocket, room_id)
    if not connected:
        return  # Connection was rejected (room full)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get('type', 'unknown')
            print(f"[SIGNALING] Received '{msg_type}' in room '{room_id}'")
            await manager.broadcast_to_others(data, websocket, room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        
        # Track leave time if candidate
        if user.role == "candidate":
            conn = get_db_connection()
            # Update the latest entry for this candidate in this meeting
            conn.execute("""
                UPDATE candidates 
                SET left_at = ? 
                WHERE id = (
                    SELECT id FROM candidates 
                    WHERE meeting_id = ? AND name = ? 
                    ORDER BY id DESC LIMIT 1
                )
            """, (datetime.utcnow(), room_id, user.full_name or user.username))
            conn.commit()
            conn.close()
            print(f"[SIGNALING] Tracked candidate disconnect for {user.username}")

        # Notify others that peer left
        await manager.broadcast_to_others({"type": "peer_left"}, websocket, room_id)

