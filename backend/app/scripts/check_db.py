from core.database import get_db_connection
try:
    conn = get_db_connection()
    conn.row_factory = None
    print("--- ALL MEETINGS ---")
    rows = conn.execute("SELECT id, creator_username, active, recording_url FROM meetings").fetchall()
    for r in rows:
        print(r)
    conn.close()
except Exception as e:
    print(e)
