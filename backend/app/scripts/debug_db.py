import sqlite3

def check_db():
    try:
        conn = sqlite3.connect("d:/codes/selsoft-hackathon/backend/app/users.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row['name'] for row in cursor.fetchall()]
        print("Tables:", tables)
        
        if 'sessions' not in tables:
            print("ERROR: sessions table missing!")
        else:
            print("sessions table exists.")
            # Check columns
            cursor.execute("PRAGMA table_info(sessions);")
            columns = [row['name'] for row in cursor.fetchall()]
            print("Sessions columns:", columns)
            
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    check_db()
