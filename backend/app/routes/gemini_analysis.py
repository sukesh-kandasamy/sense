"""
Gemini Live API Integration for Real-time Emotion Analysis

This module provides WebSocket endpoints for:
1. Receiving candidate video/audio streams
2. Analyzing emotions using Gemini Live API
3. Broadcasting insights to interviewers
"""

import os
import json
import asyncio
import base64
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# --- Gemini Configuration ---
GOOGLE_API_KEY = "AIzaSyCrrM7-ZbirYUSmUTC0Lvm0P0niskY8O3c"
MODEL = "gemini-2.5-flash"  # Using Gemini 2.5 Flash


EMOTION_SYSTEM_PROMPT = """
Role: You are "Sense," a real-time AI copilot for professional interviewers. 
Objective: Monitor the candidate's video/audio to provide behavioral intelligence and security (proctoring) alerts.

**Input Analysis:**
1. Monitor candidate sentiment and vocal confidence.
2. **Eye Movement & Screen Focus (CRITICAL):** 
   - Detect if the candidate's eyes are focused on the laptop/computer screen (normal behavior).
   - Flag if the candidate is looking AWAY from the screen (left, right, up, down, or off-camera).
   - Check for frequent eye movements that suggest reading from another source or distraction.
   - If eyes are consistently not focused on the screen, add "looking_away_from_screen" to proctoring_alerts.
3. Watch for proctoring anomalies (proxy test-takers, external devices, suspicious behavior).
4. Evaluate rapport (engagement with the interviewer).

**JSON Output Schema:**
{
  "dominant_state": "confident | anxious | neutral | hesitant | enthusiastic",
  "engagement_score": 0-10,
  "eye_focus": "on_screen | looking_left | looking_right | looking_up | looking_down | off_camera",
  "proctoring_alerts": ["list of suspicious behaviors or empty"],
  "smart_nudge": {
    "action": "Short coaching tip (max 8 words)",
    "priority": "low | medium | high"
  },
  "technical_capture": [
    {"topic": "string", "sentiment": "positive | negative | neutral"}
  ],
  "pacing": "slow | normal | fast",
  "insight": "One sentence on why the candidate is feeling this way right now."
}

**Instructions:**
- If the candidate's eyes are NOT focused on the screen, add "looking_away_from_screen" to proctoring_alerts and set smart_nudge priority to HIGH.
- If proctoring_alerts are detected, set smart_nudge priority to HIGH.
- Keep the smart_nudge actionable (e.g., "Candidate looking away; verify focus").
- Focus on the *shift* in emotion rather than just the current state.
- Respond ONLY with valid JSON (no markdown, no explanation).
"""


class EmotionAnalysisManager:
    """Manages emotion analysis sessions and WebSocket connections."""
    
    def __init__(self):
        # Room ID -> List of interviewer WebSockets (for broadcasting insights)
        self.interviewer_connections: Dict[str, List[WebSocket]] = {}
        # Room ID -> Candidate WebSocket
        self.candidate_connections: Dict[str, WebSocket] = {}
        # Room ID -> Latest emotion data
        self.latest_emotions: Dict[str, dict] = {}
        # Gemini client (initialized lazily)
        self._genai_client = None
    
    @property
    def genai_client(self):
        """Lazy initialization of Gemini client."""
        if self._genai_client is None and GOOGLE_API_KEY:
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=GOOGLE_API_KEY)
                print("[GEMINI] Client initialized successfully")
            except Exception as e:
                print(f"[GEMINI] Failed to initialize client: {e}")
        return self._genai_client
    
    async def connect_interviewer(self, websocket: WebSocket, room_id: str):
        """Connect an interviewer to receive emotion insights."""
        await websocket.accept()
        if room_id not in self.interviewer_connections:
            self.interviewer_connections[room_id] = []
        self.interviewer_connections[room_id].append(websocket)
        print(f"[EMOTION] Interviewer connected to room '{room_id}'. Total: {len(self.interviewer_connections[room_id])}")
        
        # Send latest emotion data if available
        if room_id in self.latest_emotions:
            await websocket.send_json({
                "type": "emotion_update",
                "emotion": self.latest_emotions[room_id]
            })
    
    async def connect_candidate(self, websocket: WebSocket, room_id: str):
        """Connect a candidate to send video/audio for analysis."""
        await websocket.accept()
        self.candidate_connections[room_id] = websocket
        print(f"[EMOTION] Candidate connected for analysis in room '{room_id}'")
    
    def disconnect_interviewer(self, websocket: WebSocket, room_id: str):
        """Disconnect an interviewer."""
        if room_id in self.interviewer_connections:
            if websocket in self.interviewer_connections[room_id]:
                self.interviewer_connections[room_id].remove(websocket)
            if not self.interviewer_connections[room_id]:
                del self.interviewer_connections[room_id]
        print(f"[EMOTION] Interviewer disconnected from room '{room_id}'")
    
    def disconnect_candidate(self, room_id: str):
        """Disconnect a candidate."""
        if room_id in self.candidate_connections:
            del self.candidate_connections[room_id]
        print(f"[EMOTION] Candidate disconnected from room '{room_id}'")
    
    async def broadcast_to_interviewers(self, room_id: str, emotion_data: dict):
        """Broadcast emotion update to all connected interviewers in a room."""
        self.latest_emotions[room_id] = emotion_data
        
        if room_id in self.interviewer_connections:
            # Save to Database (Sync for simplicity, consider async for prod)
            try:
                from core.database import get_db_connection
                conn = get_db_connection()
                conn.execute(
                    "INSERT INTO insights (meeting_id, emotion_json, smart_nudge) VALUES (?, ?, ?)",
                    (room_id, json.dumps(emotion_data), emotion_data.get("smart_nudge", ""))
                )
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[EMOTION] DB Save Error: {e}")

            message = {"type": "emotion_update", "emotion": emotion_data}
            disconnected = []
            
            for ws in self.interviewer_connections[room_id]:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    print(f"[EMOTION] Failed to send to interviewer: {e}")
                    disconnected.append(ws)
            
            # Clean up disconnected sockets
            for ws in disconnected:
                self.disconnect_interviewer(ws, room_id)
    
    async def analyze_multimodal(self, room_id: str, frame_data: str, audio_data: Optional[str] = None) -> Optional[dict]:
        """
        Analyze video frame and 7-second audio segment using Gemini API.
        
        Args:
            room_id: The interview room ID
            frame_data: Base64 encoded JPEG image (representative frame)
            audio_data: Base64 encoded WAV audio (7 seconds of audio)
        """
        if not self.genai_client:
            print("[GEMINI] No API key configured, using mock data")
            return self._generate_mock_emotion()
        
        try:
            from google.genai import types
            
            print(f"[GEMINI] Processing 7-second segment for room '{room_id}'...")
            
            # Remove data URL prefix from video if present
            if frame_data.startswith("data:image"):
                frame_data = frame_data.split(",")[1]
            image_bytes = base64.b64decode(frame_data)
            print(f"[GEMINI] Video frame: {len(image_bytes)} bytes")
            
            contents_list = [
                types.Part(text=EMOTION_SYSTEM_PROMPT),
                types.Part(
                    inline_data=types.Blob(
                        mime_type="image/jpeg",
                        data=image_bytes
                    )
                )
            ]

            # Add audio if provided (7 seconds of captured audio)
            if audio_data:
                # Remove data URL prefix from audio if present
                if audio_data.startswith("data:audio"):
                    audio_data = audio_data.split(",")[1]
                audio_bytes = base64.b64decode(audio_data)
                print(f"[GEMINI] Audio segment: {len(audio_bytes)} bytes (~7 seconds)")
                
                contents_list.append(
                    types.Part(
                        inline_data=types.Blob(
                            mime_type="audio/wav",
                            data=audio_bytes
                        )
                    )
                )
            
            contents_list.append(types.Part(text="Analyze this 7-second interview segment."))

            response = await asyncio.to_thread(
                self.genai_client.models.generate_content,
                model=MODEL,
                contents=[types.Content(parts=contents_list)]
            )
            
            # Parse the response
            response_text = response.text.strip()
            
            # Clean up response (remove markdown code blocks if present)
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                if lines[0].startswith("```"): lines = lines[1:]
                if lines[-1].startswith("```"): lines = lines[:-1]
                response_text = "\n".join(lines)
            
            emotion_data = json.loads(response_text)
            
            # Normalize response to ensure backward compatibility
            # Map new schema fields to old ones if needed
            if "dominant_state" in emotion_data and "primary" not in emotion_data:
                emotion_data["primary"] = emotion_data["dominant_state"]
            
            # Handle smart_nudge as object or string
            if isinstance(emotion_data.get("smart_nudge"), dict):
                nudge_obj = emotion_data["smart_nudge"]
                emotion_data["smart_nudge"] = nudge_obj.get("action", "")
                emotion_data["smart_nudge_priority"] = nudge_obj.get("priority", "low")
            
            # Map technical_capture to topic_tags for backward compatibility
            if "technical_capture" in emotion_data and "topic_tags" not in emotion_data:
                emotion_data["topic_tags"] = emotion_data["technical_capture"]
            
            # Add default values
            if "heartRate" not in emotion_data: emotion_data["heartRate"] = 72
            if "blinkRate" not in emotion_data: emotion_data["blinkRate"] = 15
            if "confidence" not in emotion_data: emotion_data["confidence"] = emotion_data.get("engagement_score", 7) * 10
            
            print(f"[GEMINI] ✓ Analysis complete: {emotion_data.get('primary', emotion_data.get('dominant_state'))} | Priority: {emotion_data.get('smart_nudge_priority', 'N/A')}")
            return emotion_data
            
        except Exception as e:
            print(f"[GEMINI] ✗ Analysis failed: {e}")
            return self._generate_mock_emotion()
    
    def _generate_mock_emotion(self) -> dict:
        """Generate mock emotion data for testing without API key."""
        import random
        
        states = ["confident", "anxious", "neutral", "hesitant", "enthusiastic"]
        dominant_state = random.choice(states)
        
        nudges = {
            "anxious": {"action": "Slow down; give them space", "priority": "medium"},
            "hesitant": {"action": "Rephrase your question", "priority": "medium"},
            "confident": {"action": "Push with a harder question", "priority": "low"},
            "neutral": {"action": "", "priority": "low"},
            "enthusiastic": {"action": "Build on their energy", "priority": "low"}
        }

        topics = [
            {"topic": "React", "sentiment": "positive"},
            {"topic": "System Design", "sentiment": "neutral"},
            {"topic": "Python", "sentiment": "positive"}
        ]
        
        # Convert to legacy format for frontend compatibility
        return {
            "primary": dominant_state,  # Map dominant_state to primary for backward compatibility
            "dominant_state": dominant_state,
            "confidence": random.randint(60, 95),
            "engagement_score": random.randint(5, 10),
            "proctoring_alerts": [],
            "smart_nudge": nudges.get(dominant_state, {"action": "", "priority": "low"}).get("action", ""),
            "smart_nudge_priority": nudges.get(dominant_state, {"action": "", "priority": "low"}).get("priority", "low"),
            "topic_tags": random.sample(topics, k=random.randint(0, 2)) if random.random() > 0.5 else [],
            "technical_capture": random.sample(topics, k=random.randint(0, 2)) if random.random() > 0.5 else [],
            "pacing": random.choice(["slow", "normal", "fast"]),
            "insight": "Mock data - Set GOOGLE_API_KEY for real analysis",
            "heartRate": random.randint(65, 85),
            "blinkRate": random.randint(12, 20),
        }


# Global manager instance
emotion_manager = EmotionAnalysisManager()


# --- WebSocket Endpoints ---

@router.websocket("/ws/emotion/{room_id}")
async def emotion_analysis_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for candidates to send video/audio for emotion analysis.
    
    Expected message format:
    {
        "type": "multimodal_frame",
        "video": "base64...",
        "audio": "base64..." (optional)
    }
    """
    room_id = room_id.lower()
    await emotion_manager.connect_candidate(websocket, room_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "multimodal_frame":
                video_data = data.get("video")
                audio_data = data.get("audio")
                
                if video_data:
                    # Analyze the frame + audio
                    emotion_result = await emotion_manager.analyze_multimodal(room_id, video_data, audio_data)
                    
                    if emotion_result:
                        await emotion_manager.broadcast_to_interviewers(room_id, emotion_result)
            
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        emotion_manager.disconnect_candidate(room_id)
    except Exception as e:
        print(f"[EMOTION] Error in candidate connection: {e}")
        emotion_manager.disconnect_candidate(room_id)



@router.websocket("/ws/insights/{room_id}")
async def insights_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for interviewers to receive real-time emotion insights.
    
    Sends messages in format:
    {
        "type": "emotion_update",
        "emotion": { ... emotion data ... }
    }
    """
    room_id = room_id.lower()
    await emotion_manager.connect_interviewer(websocket, room_id)
    
    try:
        while True:
            # Keep connection alive, handle pings
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        emotion_manager.disconnect_interviewer(websocket, room_id)
    except Exception as e:
        print(f"[EMOTION] Error in interviewer connection: {e}")
        emotion_manager.disconnect_interviewer(websocket, room_id)


@router.get("/emotion/status")
async def emotion_status():
    """Check the status of the emotion analysis service."""
    return {
        "service": "gemini_emotion_analysis",
        "api_configured": GOOGLE_API_KEY is not None,
        "model": MODEL,
        "active_rooms": list(emotion_manager.candidate_connections.keys()),
        "interviewer_connections": {
            room: len(connections) 
            for room, connections in emotion_manager.interviewer_connections.items()
        }
    }
