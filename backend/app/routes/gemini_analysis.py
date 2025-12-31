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
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from core.dependencies import get_current_user_ws
from core.database import get_db_connection
from models import User
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# --- Gemini Configuration ---
GOOGLE_API_KEY = "AIzaSyCrrM7-ZbirYUSmUTC0Lvm0P0niskY8O3c"
MODEL = "gemini-2.5-flash"  # Using Gemini 2.5 Flash


EMOTION_SYSTEM_PROMPT = """
Role: You are "Sense," a real-time sentiment detection AI for video interviews.
Objective: Analyze candidate emotions during video interviews to provide interviewer guidance and improve candidate experience.

**Real-Time Sentiment Analysis:**
1. **Emotional State Detection:** Identify the candidate's current emotional state from facial expressions and body language.
2. **Confidence Assessment:** Evaluate vocal confidence, clarity, and speech patterns.
3. **Engagement Level:** Measure how engaged and responsive the candidate is during the conversation.
4. **Stress Indicators:** Detect signs of nervousness, anxiety, or discomfort that may affect performance.
5. **Communication Quality:** Assess clarity, articulation, and conversational flow.

**JSON Output Schema:**
{
  "dominant_emotion": "confident | nervous | calm | enthusiastic | hesitant | focused | stressed",
  "confidence_level": 0-100,
  "engagement_score": 0-10,
  "stress_level": "low | moderate | high",
  "communication_clarity": "clear | moderate | unclear",
  "facial_expression": "smiling | neutral | tense | thoughtful | concerned",
  "body_language": "open | closed | fidgeting | relaxed | leaning_in",
  "vocal_tone": "steady | shaky | enthusiastic | monotone | warm",
  "smart_nudge": {
    "action": "Short coaching tip for interviewer (max 10 words)",
    "priority": "low | medium | high"
  },
  "candidate_insight": "One sentence describing the candidate's current emotional state and what might be causing it.",
  "interviewer_tip": "Actionable suggestion for the interviewer to improve the conversation flow."
}

**Guidance for Interviewers:**
- Provide real-time coaching tips to help interviewers adapt their approach.
- Suggest when to slow down, offer encouragement, or change topics.
- Highlight positive moments (enthusiasm, confidence spikes) to build rapport.

**Candidate Experience Insights:**
- Track emotional journey throughout the interview.
- Identify moments of peak stress or confidence.
- Provide data to help improve future interview experiences.

**Instructions:**
- Focus on detecting emotional SHIFTS rather than just static states.
- Prioritize actionable insights that help interviewers in real-time.
- Be empathetic - the goal is to help both parties have a better experience.
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
                from datetime import datetime, timezone, timedelta
                
                # Get IST timestamp (UTC+5:30)
                ist = timezone(timedelta(hours=5, minutes=30))
                ist_timestamp = datetime.now(ist).strftime('%Y-%m-%d %H:%M:%S')
                
                conn = get_db_connection()
                conn.execute(
                    "INSERT INTO insights (meeting_id, timestamp, emotion_json, smart_nudge) VALUES (?, ?, ?, ?)",
                    (room_id, ist_timestamp, json.dumps(emotion_data), emotion_data.get("smart_nudge", ""))
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
            # Map new schema fields to old ones
            if "dominant_emotion" in emotion_data:
                emotion_data["primary"] = emotion_data["dominant_emotion"]
            elif "dominant_state" in emotion_data:
                emotion_data["primary"] = emotion_data["dominant_state"]
            
            # Handle smart_nudge as object or string
            if isinstance(emotion_data.get("smart_nudge"), dict):
                nudge_obj = emotion_data["smart_nudge"]
                emotion_data["smart_nudge"] = nudge_obj.get("action", "")
                emotion_data["smart_nudge_priority"] = nudge_obj.get("priority", "low")
            
            # Map candidate_insight to insight for backward compatibility
            if "candidate_insight" in emotion_data and "insight" not in emotion_data:
                emotion_data["insight"] = emotion_data["candidate_insight"]
            
            # Map confidence_level to confidence for backward compatibility
            if "confidence_level" in emotion_data:
                emotion_data["confidence"] = emotion_data["confidence_level"]
            elif "confidence" not in emotion_data:
                emotion_data["confidence"] = emotion_data.get("engagement_score", 7) * 10
            
            print(f"[GEMINI] ✓ Sentiment: {emotion_data.get('primary')} | Confidence: {emotion_data.get('confidence')}% | Priority: {emotion_data.get('smart_nudge_priority', 'N/A')}")
            return emotion_data
            
        except Exception as e:
            print(f"[GEMINI] ✗ Analysis failed: {e}")
            return self._generate_mock_emotion()
    
    def _generate_mock_emotion(self) -> dict:
        """Generate mock emotion data for testing without API key."""
        import random
        
        emotions = ["confident", "nervous", "calm", "enthusiastic", "hesitant", "focused", "stressed"]
        dominant_emotion = random.choice(emotions)
        
        nudges = {
            "nervous": {"action": "Slow down and offer reassurance", "priority": "medium"},
            "hesitant": {"action": "Rephrase or simplify your question", "priority": "medium"},
            "confident": {"action": "Challenge with a follow-up question", "priority": "low"},
            "calm": {"action": "Good pace, continue as is", "priority": "low"},
            "enthusiastic": {"action": "Build on their energy", "priority": "low"},
            "focused": {"action": "Let them complete their thought", "priority": "low"},
            "stressed": {"action": "Take a brief pause or change topic", "priority": "high"}
        }
        
        stress_levels = ["low", "moderate", "high"]
        facial_expressions = ["smiling", "neutral", "tense", "thoughtful", "concerned"]
        body_languages = ["open", "closed", "fidgeting", "relaxed", "leaning_in"]
        vocal_tones = ["steady", "shaky", "enthusiastic", "monotone", "warm"]
        
        confidence = random.randint(40, 95)
        engagement = random.randint(4, 10)
        
        return {
            "primary": dominant_emotion,
            "dominant_emotion": dominant_emotion,
            "confidence_level": confidence,
            "confidence": confidence,
            "engagement_score": engagement,
            "stress_level": random.choice(stress_levels),
            "communication_clarity": random.choice(["clear", "moderate", "unclear"]),
            "facial_expression": random.choice(facial_expressions),
            "body_language": random.choice(body_languages),
            "vocal_tone": random.choice(vocal_tones),
            "smart_nudge": nudges.get(dominant_emotion, {"action": "", "priority": "low"}).get("action", ""),
            "smart_nudge_priority": nudges.get(dominant_emotion, {"action": "", "priority": "low"}).get("priority", "low"),
            "candidate_insight": "Mock data - Set GOOGLE_API_KEY for real sentiment analysis",
            "insight": "Mock data - Set GOOGLE_API_KEY for real sentiment analysis",
            "interviewer_tip": "Consider the candidate's comfort level and adjust accordingly",
        }


# Global manager instance
emotion_manager = EmotionAnalysisManager()


# --- WebSocket Endpoints ---

@router.websocket("/ws/emotion/{room_id}")
async def emotion_analysis_endpoint(websocket: WebSocket, room_id: str, user: User = Depends(get_current_user_ws)):
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
    
    # --- Authorization Check ---
    is_authorized = False
    if user.role == "candidate":
        conn = get_db_connection()
        meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (room_id,)).fetchone()
        conn.close()
        
        # Check if meeting exists and user is the candidate
        if meeting:
            if meeting["candidate_email"] == user.email:
                is_authorized = True
            elif user.username == f"candidate_{room_id}":
                is_authorized = True
    
    if not is_authorized:
        print(f"[EMOTION] Unauthorized candidate access attempt for room {room_id} by {user.username}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # --- Check if analysis is enabled (local mode = skip analysis) ---
    conn = get_db_connection()
    meeting = conn.execute("SELECT creator_username FROM meetings WHERE id = ?", (room_id,)).fetchone()
    if meeting:
        creator = conn.execute("SELECT analysis_mode FROM users WHERE username = ?", (meeting["creator_username"],)).fetchone()
        if creator and creator["analysis_mode"] == "local":
            print(f"[EMOTION] Skipping analysis for room '{room_id}' - Local mode enabled by interviewer")
            conn.close()
            await emotion_manager.connect_candidate(websocket, room_id)
            # Keep connection alive but don't process analysis
            try:
                while True:
                    data = await websocket.receive_json()
                    if data.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                emotion_manager.disconnect_candidate(room_id)
            return
    conn.close()

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
async def insights_endpoint(websocket: WebSocket, room_id: str, user: User = Depends(get_current_user_ws)):
    """
    WebSocket endpoint for interviewers to receive real-time emotion insights.
    
    Sends messages in format:
    {
        "type": "emotion_update",
        "emotion": { ... emotion data ... }
    }
    """
    room_id = room_id.lower()
    
    # --- Authorization Check ---
    is_authorized = False
    if user.role == "interviewer":
        conn = get_db_connection()
        meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (room_id,)).fetchone()
        conn.close()
        
        # Check if meeting exists and user is the creator
        if meeting and meeting["creator_username"] == user.username:
            is_authorized = True
            
    if not is_authorized:
        print(f"[EMOTION] Unauthorized interviewer access attempt for room {room_id} by {user.username}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

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


# --- HTTP Endpoint for Direct Gemini Analysis ---
from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    frame: str  # Base64 encoded image
    frames_count: Optional[int] = 1
    audio: Optional[str] = None

@router.post("/analyze")
async def analyze_frame(request: AnalyzeRequest):
    """
    HTTP endpoint for analyzing a single frame via Gemini API.
    Used by the Gemini docs page for demonstration.
    """
    try:
        emotion_data = await emotion_manager.analyze_multimodal(
            room_id="docs-demo",
            frame_data=request.frame,
            audio_data=request.audio
        )
        
        if emotion_data:
            return {
                "success": True,
                "emotion_data": emotion_data,
                "frames_analyzed": request.frames_count
            }
        else:
            return {
                "success": False,
                "error": "Analysis returned no data",
                "emotion_data": emotion_manager._generate_mock_emotion()
            }
            
    except Exception as e:
        print(f"[GEMINI] Analyze endpoint error: {e}")
        return {
            "success": False,
            "error": str(e),
            "emotion_data": emotion_manager._generate_mock_emotion()
        }

