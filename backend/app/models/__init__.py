from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- Models ---
class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    profile_photo_url: Optional[str] = None
    role: Optional[str] = "interviewer"
    analysis_mode: Optional[str] = "cloud"
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    analysis_mode: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(User):
    password: str

class Meeting(BaseModel):
    id: str
    creator_username: str
    candidate_email: Optional[str] = None
    interviewer_email: Optional[str] = None
    interviewer_name: Optional[str] = None
    created_at: Optional[datetime]
    active: bool
    duration: Optional[int] = None  # Duration in minutes, None = infinity

class Session(BaseModel):
    session_id: str
    username: str
    role: str
    expires_at: datetime

class CodeLoginRequest(BaseModel):
    code: str

class CreateMeetingRequest(BaseModel):
    pass 

class CandidateJoinRequest(BaseModel):
    name: str

class MeetingSummary(Meeting):
    candidates: list[str] = []

class ResumeData(BaseModel):
    summary: Optional[str] = None
    personal_info: Optional[dict] = None
    experience: Optional[list[dict]] = None
    skills_soft: Optional[list[str]] = None
    skills_hard: Optional[list[str]] = None
    projects: Optional[list[dict]] = None
    achievements: Optional[list[str]] = None
    certifications: Optional[list[str]] = None
    education: Optional[list[dict]] = None
    links: Optional[dict] = None
    others: Optional[dict] = None

