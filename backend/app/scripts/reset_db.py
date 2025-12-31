import sqlite3
from passlib.context import CryptContext

DB_NAME = "users.db"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def reset():
    try:
        conn = get_db_connection()
        print("Dropping tables...")
        conn.execute("DROP TABLE IF EXISTS insights")
        conn.execute("DROP TABLE IF EXISTS sessions")
        conn.execute("DROP TABLE IF EXISTS candidates")
        conn.execute("DROP TABLE IF EXISTS meetings")
        conn.execute("DROP TABLE IF EXISTS users")
        conn.commit()
        conn.close()

        print("Re-creating tables...")
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
        
        # Meetings Table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                creator_username TEXT,
                candidate_email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                active INTEGER DEFAULT 1,
                duration INTEGER,
                recording_url TEXT,
                interviewer_joined INTEGER DEFAULT 0,
                FOREIGN KEY(creator_username) REFERENCES users(username)
            )
        ''')
        
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
        
        # Insights Table (for emotion analysis history)
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
        
        conn.commit()
        
        # Seed default user
        print("Seeding data...")
        seed_email = "sukesh.kandasamy@gmail.com"
        seed_password = "sample@123"
        
        hashed_pw = pwd_context.hash(seed_password)
        conn.execute(
            "INSERT INTO users (username, email, full_name, hashed_password) VALUES (?, ?, ?, ?)",
            (seed_email, seed_email, "Sukesh Kandasamy", hashed_pw)
        )

        conn.commit()
        conn.close()
        print("✓ Database reset complete.")
        print(f"  - Created tables: users, meetings, candidates, sessions, insights")
        print(f"  - Seeded user: {seed_email}")
        
    except Exception as e:
        print(f"✗ Error resetting DB: {e}")

if __name__ == "__main__":
    reset()

