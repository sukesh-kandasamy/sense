from fastapi import APIRouter, HTTPException, Depends, status, Response, Cookie, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
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
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Construct URL (Assuming served from /uploads)
    # Ideally should use a proper base URL from config
    photo_url = f"/uploads/{filename}"
    
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
    id: Optional[str] = None  # Optional custom meeting ID
    duration: Optional[int] = None  # Duration in minutes, None = infinity

@router.post("/meetings", response_model=Meeting)
async def create_meeting(request: CreateMeetingRequest = None, current_user: User = Depends(get_current_interviewer)):
    # Use provided ID or generate one
    if request and request.id:
        meeting_id = request.id.lower()
    else:
        # Simple ID generation: 8 chars alphanumeric
        meeting_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    duration = request.duration if request else None
    
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO meetings (id, creator_username, duration) VALUES (?, ?, ?)",
        (meeting_id, current_user.username, duration)
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


        results.append(MeetingSummary(**meeting_dict))
    
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

    # Store candidate info
    conn.execute(
        "INSERT INTO candidates (meeting_id, name) VALUES (?, ?)",
        (meeting_id, join_req.name)
    )
    conn.commit()
    conn.close()
    

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
        
    conn.execute("UPDATE meetings SET active = 0 WHERE id = ?", (meeting_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Meeting ended successfully"}

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
    
    # Set started_at to current time
    conn.execute("UPDATE meetings SET started_at = ? WHERE id = ?", (datetime.utcnow(), meeting_id))
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
async def upload_recording(meeting_id: str, file: UploadFile = File(...)):
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
        "UPDATE meetings SET recording_url = ?, ended_at = ?, active = 0 WHERE id = ?", 
        (recording_url, datetime.utcnow(), meeting_id)
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

@router.get("/meetings/{meeting_id}/report")
async def get_meeting_report(meeting_id: str):
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
        
    # Get Candidate Name
    candidates = conn.execute("SELECT name FROM candidates WHERE meeting_id = ?", (meeting_id,)).fetchall()
    candidate_names = [c['name'] for c in candidates]
    
    if not candidate_names:
        # Fallback: Check if a candidate user exists for this meeting (username pattern: candidate_{meeting_id})
        candidate_row = conn.execute("SELECT full_name, resume_url FROM users WHERE username = ?", (f"candidate_{meeting_id}",)).fetchone()
        if candidate_row:
             candidate_user = dict(candidate_row)
             if candidate_user['full_name']:
                 candidate_names.append(candidate_user['full_name'])
             if candidate_user['resume_url']:
                 # Add resume URL to meeting dict (assuming single candidate for now or just attaching to meeting)
                 meeting_dict['resume_url'] = candidate_user['resume_url']
    
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
        
    conn.close()
    
    meeting_dict = dict(meeting)
    meeting_dict['candidates'] = candidate_names
    
    return {
        "meeting": meeting_dict,
        "insights": insight_list
    }

GOOGLE_API_KEY = "AIzaSyCrrM7-ZbirYUSmUTC0Lvm0P0niskY8O3c"

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
        
    # Save
    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{current_user.username}_{int(datetime.now().timestamp())}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
        
    resume_url = f"/uploads/resumes/{filename}"
    
    # DB update
    conn = get_db_connection()
    conn.execute(
        "UPDATE users SET resume_url = ?, resume_filename = ? WHERE username = ?", 
        (resume_url, file.filename, current_user.username)
    )
    conn.commit()
    conn.close()
    
    return {
        "message": "Resume uploaded successfully", 
        "resume_url": resume_url,
        "filename": file.filename
    }
