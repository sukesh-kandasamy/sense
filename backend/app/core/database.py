import sqlite3
import random
import string
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from .config import DB_NAME

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# --- Database Helpers ---
def get_db_connection():
    # Because we are in core/, we might need to adjust DB path if we want strictly relative
    # but "users.db" usually implies current working directory of the process (app root)
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Users Table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            hashed_password TEXT,
            profile_photo_url TEXT,
            analysis_mode TEXT DEFAULT 'cloud',
            disabled INTEGER DEFAULT 0
        )
    ''')
    
    # Simple migration check for existing dbs (safe for this hackathon context)
    try:
        conn.execute("ALTER TABLE users ADD COLUMN profile_photo_url TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists

    try:
        conn.execute("ALTER TABLE users ADD COLUMN analysis_mode TEXT DEFAULT 'cloud'")
    except sqlite3.OperationalError:
        pass # Column likely exists
    # Meetings Table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            creator_username TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1,
            duration INTEGER,
            FOREIGN KEY(creator_username) REFERENCES users(username)
        )
    ''')
    
    # Migration for existing dbs - add duration column
    try:
        conn.execute("ALTER TABLE meetings ADD COLUMN duration INTEGER")
    except sqlite3.OperationalError:
        pass  # Column likely exists
    
    # Migration for existing dbs - add started_at column
    try:
        conn.execute("ALTER TABLE meetings ADD COLUMN started_at TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column likely exists
    # Candidates Table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id TEXT,
            name TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(meeting_id) REFERENCES meetings(id)
        )
    ''')
    # Sessions Table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            username TEXT,
            role TEXT,
            expires_at TIMESTAMP
        )
    ''')

    # Insights Table - NEW
    conn.execute('''
        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            emotion_json TEXT,
            smart_nudge TEXT,
            FOREIGN KEY(meeting_id) REFERENCES meetings(id)
        )
    ''')
    
    # Resume Data Table - NEW (for parsed resume content)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS resume_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT UNIQUE,
            summary TEXT,
            personal_info TEXT,          -- JSON
            skills_soft TEXT,            -- JSON array
            skills_hard TEXT,            -- JSON array
            projects TEXT,               -- JSON array
            achievements TEXT,           -- JSON array
            certifications TEXT,         -- JSON array
            education TEXT,              -- JSON array
            links TEXT,                  -- JSON (portfolio, linkedin, instagram)
            others TEXT,                 -- JSON
            raw_json TEXT,               -- Full parsed data as JSON backup
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_email) REFERENCES users(email)
        )
    ''')

    # Migration for Recording and Ended At
    try:
        conn.execute("ALTER TABLE meetings ADD COLUMN recording_url TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists
        
    try:
        conn.execute("ALTER TABLE meetings ADD COLUMN ended_at TIMESTAMP")
    except sqlite3.OperationalError:
        pass # Column likely exists

    try:
        conn.execute("ALTER TABLE meetings ADD COLUMN candidate_email TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists

    try:
        conn.execute("ALTER TABLE resume_data ADD COLUMN experience TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists

    conn.commit()
    conn.close()

def seed_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Specific user to seed
    seed_email = "sukesh.kandasamy@gmail.com"
    seed_password = "sample@123"
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (seed_email,))
    if cursor.fetchone() is None:
        print(f"Seeding user: {seed_email}")
        hashed_pw = pwd_context.hash(seed_password)
        cursor.execute(
            "INSERT INTO users (username, email, full_name, hashed_password) VALUES (?, ?, ?, ?)",
            (seed_email, seed_email, "Sukesh Kandasamy", hashed_pw)
        )
        conn.commit()
    conn.close()

# --- Session Helpers ---
def create_session(username: str, role: str):
    session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    # 30 Days Expiry
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO sessions (session_id, username, role, expires_at) VALUES (?, ?, ?, ?)",
        (session_id, username, role, expires_at.isoformat())
    )
    conn.commit()
    conn.close()
    return session_id, expires_at


def get_session_user_from_db(session_id: str):
    conn = get_db_connection()
    session = conn.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    
    if not session:
        conn.close()
        return None
    
    # Check expiration
    expires_at_str = session['expires_at']
    try:
        # Parse ISO format. 
        # Note: In SQLite it's stored as text. 
        # If no timezone info in DB string, assume UTC or handling might be needed.
        # create_session uses .isoformat() which includes offset if timezone aware.
        # but create_session used datetime.now(timezone.utc), so it should be fine.
        
        expires_at = datetime.fromisoformat(expires_at_str)
        if expires_at.tzinfo is None:
             # Fallback if stored without tz (shouldn't happen with current create_session, but good for safety)
             expires_at = expires_at.replace(tzinfo=timezone.utc)
             
        if datetime.now(timezone.utc) > expires_at:
            # Expired
            conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            conn.commit()
            conn.close()
            return None
            
    except ValueError:
        # Invalid date format, invalidate session
        conn.close()
        return None

    conn.close()
    return session

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
