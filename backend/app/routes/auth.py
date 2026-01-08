
from fastapi import APIRouter, HTTPException, Depends, status, Response, Cookie, UploadFile, File, Request, Form
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()
from pydantic import BaseModel as PydanticBaseModel
import string
import random
import random
from datetime import datetime
import shutil
import os
import json
import sqlite3
import asyncio

from core.database import (
    get_db_connection, 
    create_session, 
    verify_password, 
    get_password_hash
)
from core.dependencies import get_current_user, get_current_interviewer
from models import (
    User, UserInDB, UserCreate, Token, 
    Meeting, CodeLoginRequest, CandidateJoinRequest, CreateMeetingRequest,
    MeetingSummary, UserUpdate, PasswordChange
)

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, response: Response):
    conn = get_db_connection()
    try:
        existing_user = conn.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_password = get_password_hash(user.password)
        conn.execute(
            "INSERT INTO users (username, email, full_name, hashed_password) VALUES (?, ?, ?, ?)",
            (user.username, user.email, user.full_name, hashed_password)
        )
        conn.commit()
    finally:
        conn.close()
    
    # Create Session
    session_id, expires_at = create_session(user.username, "interviewer")
    
    # Set Cookie
    response.set_cookie(
        key="access_token",
        value=session_id,
        httponly=True,
        # secure=True, # Requires HTTPS, enabled for prod/dev-ssl
        samesite="lax",
        expires=expires_at
    )
    
    return {"access_token": session_id, "token_type": "bearer"}

@router.post("/login")
async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        conn = get_db_connection()
        user_row = conn.execute("SELECT * FROM users WHERE username = ?", (form_data.username,)).fetchone()
        conn.close()
        
        if not user_row:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        user = UserInDB(**dict(user_row))
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        # Create Session
        session_id, expires_at = create_session(user.username, "interviewer")
        
        # Set Cookie
        response.set_cookie(
            key="access_token",
            value=session_id,
            httponly=True,
            samesite="lax",
            expires=expires_at
        )
        return {"message": "Login successful"}
    except Exception as e:
        import traceback
        traceback.print_exc() # Print to server logs
        raise HTTPException(status_code=400, detail=f"Login Failed: {str(e)}")

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    # In a real app, delete session from DB using the cookie value.
    # For now, just clearing the cookie effectively logs them out client-side.
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/users/me", response_model=User)
async def update_user_me(user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    
    # Build update query dynamically
    fields = []
    values = []
    
    if user_update.full_name is not None:
        fields.append("full_name = ?")
        values.append(user_update.full_name)
    
    if user_update.profile_photo_url is not None:
        fields.append("profile_photo_url = ?")
        values.append(user_update.profile_photo_url)

    if user_update.analysis_mode is not None:
        fields.append("analysis_mode = ?")
        values.append(user_update.analysis_mode)
        
    if not fields:
        conn.close()
        return current_user
        
    values.append(current_user.username)
    query = f"UPDATE users SET {', '.join(fields)} WHERE username = ?"
    
    conn.execute(query, tuple(values))
    conn.commit()
    
    # Fetch updated user
    updated_row = conn.execute("SELECT * FROM users WHERE username = ?", (current_user.username,)).fetchone()
    conn.close()
    
    return UserInDB(**dict(updated_row))

    return UserInDB(**dict(updated_row))

@router.post("/users/me/photo")
async def upload_photo(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    file_extension = file.filename.split(".")[-1]
    if file_extension.lower() not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")

    filename = f"{current_user.username}_{int(datetime.now().timestamp())}.{file_extension}"
    
    # Ensure profile directory exists
    os.makedirs("uploads/profile", exist_ok=True)
    
    file_path = f"uploads/profile/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Construct URL (Assuming served from /uploads)
    # Ideally should use a proper base URL from config
    photo_url = f"/uploads/profile/{filename}"
    
    conn = get_db_connection()
    conn.execute("UPDATE users SET profile_photo_url = ? WHERE username = ?", (photo_url, current_user.username))
    conn.commit()
    conn.close()
    
    return {"profile_photo_url": photo_url}

@router.post("/change-password")
async def change_password(pwd_change: PasswordChange, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE username = ?", (current_user.username,)).fetchone()
    
    user_in_db = UserInDB(**dict(user_row))
    
    if not verify_password(pwd_change.old_password, user_in_db.hashed_password):
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    new_hashed_password = get_password_hash(pwd_change.new_password)
    
    conn.execute("UPDATE users SET hashed_password = ? WHERE username = ?", (new_hashed_password, current_user.username))
    conn.commit()
    conn.close()
    
    return {"message": "Password updated successfully"}

@router.post("/candidate-login")
async def login_candidate(login_request: CodeLoginRequest, response: Response):
    conn = get_db_connection()
    # Normalize code to lowercase
    code = login_request.code.lower()
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ? AND active = 1", (code,)).fetchone()
    conn.close()

    if not meeting:
        raise HTTPException(status_code=400, detail="Invalid or Expired Meeting ID")
    
    username = f"candidate_{code}"
    
    # Create Session
    session_id, expires_at = create_session(username, "candidate")
    
    # Set Cookie
    response.set_cookie(
        key="access_token",
        value=session_id,
        httponly=True,
        # secure=True,
        samesite="lax",
        expires=expires_at
    )

    return {"message": "Login successful"}

class CreateMeetingRequest(PydanticBaseModel):
    candidate_email: str  # Required - must be a registered user
    id: Optional[str] = None  # Optional custom meeting ID
    duration: Optional[int] = None  # Duration in minutes, None = infinity

@router.post("/meetings", response_model=Meeting)
async def create_meeting(request: CreateMeetingRequest, current_user: User = Depends(get_current_interviewer)):
    # Validate candidate email exists in database
    conn = get_db_connection()
    candidate = conn.execute("SELECT username, email FROM users WHERE email = ?", (request.candidate_email.lower(),)).fetchone()
    
    if not candidate:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not registered. They must create an account first.")
    
    # Use provided ID or generate one
    if request.id:
        meeting_id = request.id.lower()
    else:
        # Simple ID generation: 8 chars alphanumeric
        meeting_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    duration = request.duration
    
    conn.execute(
        "INSERT INTO meetings (id, creator_username, candidate_email, duration) VALUES (?, ?, ?, ?)",
        (meeting_id, current_user.username, request.candidate_email.lower(), duration)
    )
    conn.commit()
    conn.close()
    
    return Meeting(id=meeting_id, creator_username=current_user.username, active=True, created_at=datetime.utcnow(), duration=duration)

class DeleteMeetingsRequest(PydanticBaseModel):
    ids: list[str]

@router.post("/meetings/delete")
async def delete_meetings(request: DeleteMeetingsRequest, current_user: User = Depends(get_current_interviewer)):
    if not request.ids:
        return {"message": "No meetings selected"}
        
    conn = get_db_connection()
    # Create placeholders for the list of IDs
    placeholders = ', '.join('?' for _ in request.ids)
    
    # Ensure users can only delete their own meetings
    query = f"DELETE FROM meetings WHERE id IN ({placeholders}) AND creator_username = ?"
    params = request.ids + [current_user.username]
    
    cursor = conn.execute(query, params)
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    return {"message": f"Successfully deleted {deleted_count} meetings", "deleted_count": deleted_count}

@router.delete("/meetings/{meeting_id}")
async def delete_single_meeting(meeting_id: str, current_user: User = Depends(get_current_interviewer)):
    """Delete a single meeting by ID."""
    conn = get_db_connection()
    
    # Ensure user can only delete their own meeting
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ? AND creator_username = ?", 
                           (meeting_id.lower(), current_user.username)).fetchone()
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found or access denied")
    
    conn.execute("DELETE FROM meetings WHERE id = ?", (meeting_id.lower(),))
    conn.commit()
    conn.close()
    
    return {"message": "Meeting deleted successfully"}

@router.get("/meetings", response_model=list[MeetingSummary])
async def get_meetings(
    limit: int = 5,
    offset: int = 0,
    current_user: User = Depends(get_current_interviewer)
):
    conn = get_db_connection()
    meetings_rows = conn.execute(
        "SELECT * FROM meetings WHERE creator_username = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", 
        (current_user.username, limit, offset)
    ).fetchall()
    
    results = []
    for row in meetings_rows:
        meeting_dict = dict(row)
        # Fetch candidates
        candidates_rows = conn.execute(
            "SELECT name FROM candidates WHERE meeting_id = ?", 
            (meeting_dict['id'],)
        ).fetchall()
        candidates = [c['name'] for c in candidates_rows]
        
        meeting_dict['candidates'] = candidates
        # boolean conversion for sqlite integer
        meeting_dict['active'] = bool(meeting_dict['active'])
        
        # Ensure duration is present (handle NULLs from DB)
        if 'duration' not in meeting_dict or meeting_dict['duration'] is None:
             meeting_dict['duration'] = None

        # Fetch candidate profile details using candidate_email
        if meeting_dict.get('candidate_email'):
            candidate_user = conn.execute(
                "SELECT full_name, profile_photo_url FROM users WHERE email = ?", 
                (meeting_dict['candidate_email'],)
            ).fetchone()
            if candidate_user:
                meeting_dict['candidate_name'] = candidate_user['full_name']
                meeting_dict['candidate_profile_photo_url'] = candidate_user['profile_photo_url']


        results.append(MeetingSummary(**meeting_dict))
    
    conn.close()
    return results

@router.get("/candidate/meetings")
async def get_candidate_meetings(current_user: User = Depends(get_current_user)):
    """Get all meetings scheduled for the current candidate (by email)."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    
    # Find meetings where this user's email is the candidate_email
    meetings_rows = conn.execute(
        """SELECT m.*, u.full_name as interviewer_name, u.email as interviewer_email 
           FROM meetings m 
           LEFT JOIN users u ON m.creator_username = u.username 
           WHERE m.candidate_email = ? AND m.active = 1
           ORDER BY m.created_at DESC""", 
        (current_user.email.lower(),)
    ).fetchall()
    
    results = []
    for row in meetings_rows:
        meeting_dict = dict(row)
        meeting_dict['active'] = bool(meeting_dict.get('active', 1))
        results.append(meeting_dict)
    
    conn.close()
    return results

@router.post("/meetings/{meeting_id}/join")
async def join_meeting(meeting_id: str, join_req: CandidateJoinRequest, current_user: User = Depends(get_current_user)):
    # Verify meeting exists
    conn = get_db_connection()
    meeting_id = meeting_id.lower() # Normalize
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ? AND active = 1", (meeting_id,)).fetchone()
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if interviewer has joined first
    if not meeting['interviewer_joined']:
        conn.close()
        raise HTTPException(status_code=403, detail="Please wait for the interviewer to start the session")

    # Store candidate info
    conn.execute(
        "INSERT INTO candidates (meeting_id, name) VALUES (?, ?)",
        (meeting_id, join_req.name)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Joined successfully"}


@router.post("/meetings/{meeting_id}/end")
async def end_meeting(meeting_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    meeting_id = meeting_id.lower() # Normalize
    # Check if meeting exists and belongs to user
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if meeting['creator_username'] != current_user.username:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to end this meeting")
    
    # Calculate duration if started_at is set
    duration_minutes = None
    ended_at = datetime.utcnow()
    
    if meeting['started_at']:
        try:
            started_time = datetime.fromisoformat(str(meeting['started_at']).replace(' ', 'T'))
            elapsed_seconds = (ended_at - started_time).total_seconds()
            duration_minutes = int(elapsed_seconds / 60)  # Convert to minutes
        except Exception as e:
            print(f"[Meeting] Failed to calculate duration: {e}")
        
    conn.execute(
        "UPDATE meetings SET active = 0, ended_at = ?, duration = ? WHERE id = ?", 
        (ended_at, duration_minutes, meeting_id)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Meeting ended successfully", "duration_minutes": duration_minutes}

@router.get("/meetings/{meeting_id}", response_model=Meeting)
async def get_meeting_details(meeting_id: str):
    conn = get_db_connection()
    meeting_id = meeting_id.lower() # Normalize
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    conn.close()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    meeting_dict = dict(meeting)
    meeting_dict['active'] = bool(meeting_dict['active'])
    meeting_dict['interviewer_joined'] = bool(meeting_dict.get('interviewer_joined', 0))
    return Meeting(**meeting_dict)

class UpdateMeetingRequest(PydanticBaseModel):
    duration: Optional[int] = None  # Duration in minutes, None = infinity

@router.patch("/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, update_req: UpdateMeetingRequest, current_user: User = Depends(get_current_interviewer)):
    conn = get_db_connection()
    meeting_id = meeting_id.lower()
    
    # Check if meeting exists and belongs to user
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if meeting['creator_username'] != current_user.username:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to modify this meeting")
    
    # Update duration
    conn.execute("UPDATE meetings SET duration = ? WHERE id = ?", (update_req.duration, meeting_id))
    conn.commit()
    conn.close()
    
    return {"message": "Meeting updated successfully", "duration": update_req.duration}

@router.post("/meetings/{meeting_id}/start")
async def start_meeting(meeting_id: str, current_user: User = Depends(get_current_interviewer)):
    """Mark meeting as started and record the start time for timing verification"""
    conn = get_db_connection()
    meeting_id = meeting_id.lower()
    
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting['creator_username'] != current_user.username:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Set started_at to current time and mark interviewer as joined
    conn.execute("UPDATE meetings SET started_at = ?, interviewer_joined = 1 WHERE id = ?", (datetime.utcnow(), meeting_id))
    conn.commit()
    conn.close()
    
    return {"message": "Meeting started", "started_at": datetime.utcnow().isoformat()}

@router.get("/meetings/{meeting_id}/remaining-time")
async def get_remaining_time(meeting_id: str):
    """Get remaining time for a meeting based on server-side calculation"""
    conn = get_db_connection()
    meeting_id = meeting_id.lower()
    
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    conn.close()
    
    duration = meeting['duration']
    started_at = meeting['started_at']
    
    # If no duration set (infinity), return null
    if duration is None:
        return {"remaining_seconds": None, "is_expired": False}
    
    # If not started yet, return full duration
    if started_at is None:
        return {"remaining_seconds": duration * 60, "is_expired": False}
    
    # Calculate remaining time
    started_time = datetime.fromisoformat(str(started_at).replace(' ', 'T'))
    elapsed = (datetime.utcnow() - started_time).total_seconds()
    remaining = max(0, (duration * 60) - elapsed)
    
    return {
        "remaining_seconds": int(remaining),
        "is_expired": remaining <= 0,
        "duration_minutes": duration,
        "started_at": started_at
    }

@router.post("/meetings/{meeting_id}/recording")
async def upload_recording(meeting_id: str, duration: float = Form(None), file: UploadFile = File(...)):
    """Upload meeting recording from frontend"""
    meeting_id = meeting_id.lower()
    
    # Ensure recording directory exists
    recording_dir = "uploads/recordings"
    if not os.path.exists(recording_dir):
        os.makedirs(recording_dir)
        
    filename = f"{meeting_id}_{int(datetime.now().timestamp())}.webm"
    file_path = f"{recording_dir}/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    recording_url = f"/{file_path}" # Relative URL
    
    conn = get_db_connection()
    conn.execute(
        "UPDATE meetings SET recording_url = ?, video_duration_seconds = ?, ended_at = ?, active = 0 WHERE id = ?", 
        (recording_url, int(duration) if duration else None, datetime.utcnow(), meeting_id)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Recording uploaded", "url": recording_url}

@router.get("/meetings/{meeting_id}/stream")
async def stream_recording(meeting_id: str, request: Request):
    """Stream meeting recording with Range request support for chunked delivery"""
    meeting_id = meeting_id.lower()
    
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row  # Add row_factory for dict-like access
    meeting = conn.execute("SELECT recording_url FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    conn.close()
    
    print(f"[STREAM] Meeting ID: {meeting_id}, Recording URL: {meeting['recording_url'] if meeting else 'NOT FOUND'}")
    
    if not meeting or not meeting['recording_url']:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # Get the file path (remove leading slash if present)
    file_path = meeting['recording_url'].lstrip('/')
    
    print(f"[STREAM] Looking for file: {file_path}, Exists: {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Recording file not found on disk")
    
    file_size = os.path.getsize(file_path)
    
    # Parse Range header
    range_header = request.headers.get("Range")
    
    if range_header:
        # Parse "bytes=start-end" format
        range_str = range_header.replace("bytes=", "")
        parts = range_str.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1
        
        # Limit chunk size to 5MB for smoother streaming
        chunk_size = 5 * 1024 * 1024  # 5MB
        if end - start > chunk_size:
            end = start + chunk_size - 1
        
        content_length = end - start + 1
        
        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk = f.read(min(8192, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        
        return StreamingResponse(
            iter_file(),
            status_code=206,
            media_type="video/webm",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
            }
        )
    else:
        # No Range header - return first chunk or full file for small files
        def iter_full():
            with open(file_path, "rb") as f:
                while chunk := f.read(8192):
                    yield chunk
        
        return StreamingResponse(
            iter_full(),
            media_type="video/webm",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            }
        )

@router.post("/meetings/{meeting_id}/analyze")
async def analyze_meeting(meeting_id: str, current_user: User = Depends(get_current_user)):
    """
    Triggers a one-time AI analysis of the meeting.
    Returns the summary and score.
    """
    meeting_id = meeting_id.lower()
    conn = get_db_connection()
    
    # 1. Check meeting existence and permissions
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    if not meeting:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if meeting["creator_username"] != current_user.username:
         conn.close()
         raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Check if already analyzed. 
    is_analyzed = False
    try:
        is_analyzed = meeting["is_analyzed"]
    except:
        pass

    if is_analyzed:
        try:
            summary_row = conn.execute("SELECT * FROM meeting_summaries WHERE meeting_id = ?", (meeting_id,)).fetchone()
            if summary_row:
                conn.close()
                return {
                    "summary": summary_row["summary"],
                    "overall_score": summary_row["overall_score"]
                }
        except:
             pass

    # 3. Fetch Insights for Context
    insights_rows = conn.execute("SELECT * FROM insights WHERE meeting_id = ? ORDER BY relative_seconds ASC", (meeting_id,)).fetchall()
    
    if not insights_rows:
        conn.close()
        return {
            "summary": "No sufficient data to analyze.",
            "overall_score": 0
        }

    # Construct context string
    timeline_str = "Timeline of detected emotions:\n"
    total_confidence = 0
    valid_confidence_count = 0
    
    for row in insights_rows:
        try:
            sec = row['relative_seconds']
            if not row['emotion_json']: continue
            data = json.loads(row['emotion_json'])
            emotion = data.get('dominant_emotion') or data.get('primary', 'neutral')
            conf = data.get('confidence') or data.get('confident_meter', 0)
            
            timeline_str += f"T+{sec}s: Emotion={emotion}, Confidence={conf}%\n"
            
            total_confidence += int(conf)
            valid_confidence_count += 1
        except:
             pass

    # 4. Gemini Call
    from routes.gemini_analysis import emotion_manager
    if not emotion_manager.genai_client:
         conn.close()
         raise HTTPException(status_code=503, detail="AI Service unavailable")

    prompt = f"""
    You are an expert HR Interviewer. Analyze the following candidate emotion timeline:
    
    {timeline_str[-5000:]} 
    
    (Note: showing last ~150 entries max to fit context)

    Task:
    1. Provide a concise PROFESSIONAL SUMMARY (40-50 words) of the candidate's behavioral performance. Focus on their emotional stability, confidence trends, and overall engagement.
    2. Provide an OVERALL SCORE (0-100) based on confidence levels and positive/neutral emotion frequency. 
    
    Return JSON ONLY:
    {{
        "summary": "The candidate demonstrated...",
        "overall_score": 85
    }}
    """
    
    try:
        from google.genai import types
        response = await asyncio.to_thread(
             emotion_manager.genai_client.models.generate_content,
             model="gemini-2.5-flash",
             contents=[types.Content(parts=[types.Part(text=prompt)])]
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = response_text.strip("`").replace("json\n", "")
            
        result = json.loads(response_text)
        
        summary_text = result.get("summary", "Analysis unavailable.")
        score = result.get("overall_score", 0)
        
        # 5. Save to DB
        conn.execute("INSERT INTO meeting_summaries (meeting_id, summary, overall_score) VALUES (?, ?, ?)", 
                     (meeting_id, summary_text, score))
        try:
            conn.execute("UPDATE meetings SET is_analyzed = 1 WHERE id = ?", (meeting_id,))
        except:
            pass
            
        conn.commit()
        conn.close()
        
        return result

    except Exception as e:
        print(f"Analysis Error: {e}")
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/meetings/{meeting_id}/report")
async def get_meeting_report(meeting_id: str, current_user: User = Depends(get_current_user)):
    """Get full meeting report including recording and insights"""
    meeting_id = meeting_id.lower()
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    
    print(f"[DEBUG] Fetching report for meeting_id: {meeting_id}")
    
    # Get Meeting
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    if not meeting:
        print(f"[DEBUG] Meeting not found in DB: {meeting_id}")
        # Debug: list all meetings
        all_meetings = conn.execute("SELECT id FROM meetings").fetchall()
        print(f"[DEBUG] Available meetings: {[m['id'] for m in all_meetings]}")
        
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Create meeting dict first
    meeting_dict = dict(meeting)
    
    # Get reliable candidate and interviewer names from users table
    candidate_name = None
    interviewer_name = None
    
    # Get candidate info from users table using candidate_email
    if meeting_dict.get('candidate_email'):
        candidate_user_row = conn.execute(
            "SELECT full_name, profile_photo_url, resume_url FROM users WHERE email = ?", 
            (meeting_dict['candidate_email'],)
        ).fetchone()
        if candidate_user_row:
            candidate_user = dict(candidate_user_row)
            candidate_name = candidate_user['full_name']
            if candidate_user.get('profile_photo_url'):
                meeting_dict['candidate_photo'] = candidate_user['profile_photo_url']
            if candidate_user.get('resume_url'):
                meeting_dict['resume_url'] = candidate_user['resume_url']
    
    # Get interviewer info from users table using creator_username
    if meeting_dict.get('creator_username'):
        interviewer_user_row = conn.execute(
            "SELECT full_name FROM users WHERE username = ?", 
            (meeting_dict['creator_username'],)
        ).fetchone()
        if interviewer_user_row:
            interviewer_name = interviewer_user_row['full_name']
    
    # Set reliable names
    meeting_dict['candidate_name'] = candidate_name
    meeting_dict['interviewer_name'] = interviewer_name
    
    # Get Candidate Session Duration from candidates table (for joined_at/left_at tracking)
    candidates = conn.execute("SELECT name, joined_at, left_at FROM candidates WHERE meeting_id = ?", (meeting_id,)).fetchall()
    
    # Calculate Candidate Session Duration
    candidate_duration_seconds = 0
    if candidates:
        # Sum of all sessions for this candidate
        for c in candidates:
            if c['joined_at'] and c['left_at']:
                try:
                    start = datetime.fromisoformat(str(c['joined_at']).replace(' ', 'T'))
                    end = datetime.fromisoformat(str(c['left_at']).replace(' ', 'T'))
                    candidate_duration_seconds += (end - start).total_seconds()
                except ValueError:
                    pass
    
    meeting_dict['candidate_duration_seconds'] = int(candidate_duration_seconds) if candidate_duration_seconds > 0 else None
    
    # Get Insights
    insights = conn.execute(
        "SELECT * FROM insights WHERE meeting_id = ? ORDER BY timestamp ASC", 
        (meeting_id,)
    ).fetchall()
    
    insight_list = []
    for row in insights:
        item = dict(row)
        try:
            item['emotion_data'] = json.loads(item['emotion_json'])
        except:
            item['emotion_data'] = {}
        del item['emotion_json'] # Remove raw string
        insight_list.append(item)
        
    # Get Analysis (Summary & Score)
    analysis = None
    try:
        print("Executing....")
        summary_row = conn.execute("SELECT summary, overall_score FROM meeting_summaries WHERE meeting_id = ?", (meeting_id,)).fetchone()
        print(summary_row)
        if summary_row:
            analysis = {
                "summary": summary_row["summary"],
                "overall_score": summary_row["overall_score"]
            }
    except Exception as e:
        print(f"[ERROR] Failed to fetch analysis: {e}")

    conn.close()
    
    return {
        "meeting": meeting_dict,
        "insights": insight_list,
        "analysis": analysis
    }

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


async def parse_resume_with_gemini(content: bytes, mime_type: str) -> dict:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=GOOGLE_API_KEY)
        
        prompt = """
        Analyze this resume/CV and extract structured data in the following JSON format.
        
        Requirements:
        1. summary: A concise summary of the candidate's profile (max 50 words).
        2. personal_info: object with name, email, phone, location, etc.
        3. experience: array of work experience objects (job_title, company, duration, description).
        4. skills_soft: array of soft skills.
        5. skills_hard: array of hard/technical skills.
        6. projects: array of project objects (title, description, tech_stack).
        7. education: array of education objects (degree, institution, year).
        8. achievements: array of strings.
        9. links: object with portfolio, linkedin, instagram, etc (only if present) (want to start with https://).
        10.certificates: array of certificate objects (title, description, tech_stack).
        
        Response Format:
        {
            "summary": "...",
            "personal_info": {},
            "experience": [],
            "skills_soft": [],
            "skills_hard": [],
            "projects": [],
            "achievements": [],
            "education": [],
            "links": {},
            "certificates": {}
        }
        """
        
        def call_gemini():
            return client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(parts=[
                        types.Part.from_bytes(data=content, mime_type=mime_type),
                        types.Part.from_text(text=prompt)
                    ])
                ],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )

        response = await asyncio.to_thread(call_gemini)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Parsing Error: {e}")
        return {}

async def validate_resume_with_gemini(content: bytes, mime_type: str) -> bool:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=GOOGLE_API_KEY)
        
        prompt = "Analyze this document. Determine if it is a Resume or CV. Respond with JSON: {\"is_resume\": true/false}."
        
        def call_gemini():
            return client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(parts=[
                        types.Part.from_bytes(data=content, mime_type=mime_type),
                        types.Part.from_text(text=prompt)
                    ])
                ],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )

        response = await asyncio.to_thread(call_gemini)
        data = json.loads(response.text)
        return data.get("is_resume", False)
    except Exception as e:
        print(f"Gemini Validation Error: {e}")
        return False

@router.post("/users/me/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    
    # Determine mime type
    mime_type = file.content_type or "application/pdf"
    
    # Validate
    is_valid = await validate_resume_with_gemini(content, mime_type)
    
    if not is_valid:
        raise HTTPException(
            status_code=400, 
            detail="The uploaded file does not appear to be a valid Resume/CV. Please upload a valid resume."
        )
        
    # Save File
    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{current_user.username}_{int(datetime.now().timestamp())}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
        
    resume_url = f"/uploads/resumes/{filename}"
    
    # Parse Data
    parsed_data = await parse_resume_with_gemini(content, mime_type)
    
    # DB Update (User Table)
    conn = get_db_connection()
    conn.execute(
        "UPDATE users SET resume_url = ?, resume_filename = ? WHERE username = ?", 
        (resume_url, file.filename, current_user.username)
    )
    
    # DB Upsert (Resume Data Table)
    # Check if entry exists
    existing = conn.execute("SELECT id FROM resume_data WHERE user_email = ?", (current_user.email,)).fetchone()
    
    raw_json = json.dumps(parsed_data)
    
    if existing:
        conn.execute("""
            UPDATE resume_data SET 
                summary=?, personal_info=?, experience=?, skills_soft=?, skills_hard=?, 
                projects=?, achievements=?, certificates=?, education=?, links=?, raw_json=?, updated_at=?
            WHERE user_email=?
        """, (
            parsed_data.get('summary'),
            json.dumps(parsed_data.get('personal_info')),
            json.dumps(parsed_data.get('experience')),
            json.dumps(parsed_data.get('skills_soft')),
            json.dumps(parsed_data.get('skills_hard')),
            json.dumps(parsed_data.get('projects')),
            json.dumps(parsed_data.get('achievements')),
            json.dumps(parsed_data.get('certificates')),
            json.dumps(parsed_data.get('education')),
            json.dumps(parsed_data.get('links')),
            raw_json,
            datetime.utcnow(),
            current_user.email
        ))
    else:
        conn.execute("""
            INSERT INTO resume_data (
                user_email, summary, personal_info, experience, skills_soft, skills_hard, 
                projects, achievements, certificates, education, links, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            current_user.email,
            parsed_data.get('summary'),
            json.dumps(parsed_data.get('personal_info')),
            json.dumps(parsed_data.get('experience')),
            json.dumps(parsed_data.get('skills_soft')),
            json.dumps(parsed_data.get('skills_hard')),
            json.dumps(parsed_data.get('projects')),
            json.dumps(parsed_data.get('achievements')),
            json.dumps(parsed_data.get('certificates')),
            json.dumps(parsed_data.get('education')),
            json.dumps(parsed_data.get('links')),
            raw_json
        ))
    
    conn.commit()
    conn.close()
    
    return {
        "message": "Resume uploaded and processed successfully", 
        "resume_url": resume_url,
        "filename": file.filename,
        "summary": parsed_data.get('summary')
    }

@router.get("/users/{email}/resume-data")
async def get_resume_data(email: str, current_user: User = Depends(get_current_user)):
    # Security: Allow if asking for self OR if interviewer
    is_self = (current_user.email == email)
    is_interviewer = (current_user.role == "interviewer")
    
    if not (is_self or is_interviewer):
        raise HTTPException(status_code=403, detail="Not authorized to view this resume data")

    conn = get_db_connection()
    row = conn.execute("SELECT * FROM resume_data WHERE user_email = ?", (email,)).fetchone()
    conn.close()
    
    if not row:
        return {} # Return empty if no data yet
        
    data = dict(row)
    
    # Parse JSON fields
    json_fields = ['personal_info', 'experience', 'skills_soft', 'skills_hard', 'projects', 'achievements', 'certificates', 'education', 'links']
    for field in json_fields:
        try:
            if data.get(field):
                data[field] = json.loads(data[field])
        except:
            data[field] = None
            
    return data

