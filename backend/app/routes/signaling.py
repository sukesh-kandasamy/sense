from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter()

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
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    # Normalize room_id to lowercase for consistency
    room_id = room_id.lower()
    print(f"[SIGNALING] New WebSocket connection attempt for room: '{room_id}'")
    
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
        # Notify others that peer left
        await manager.broadcast_to_others({"type": "peer_left"}, websocket, room_id)

