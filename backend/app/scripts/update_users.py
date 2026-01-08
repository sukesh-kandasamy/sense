import sys
import os
import sqlite3
from passlib.context import CryptContext

# Add parent directory to path to import core if needed, but we can just use passlib directly here 
# since we saw the config in reset_db.py
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

DB_NAME = "users.db"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def update_users():
    conn = sqlite3.connect(DB_NAME)
    print("Updating users...")

    # Mapping of old_email -> new_details
    # Structure: old_email: (new_email, new_password, new_name)
    updates = {
        "sukesh.1814@gmail.com": ("tom.cruise@sense.com", "tomcruise123", "Tom Cruise"),
        "sukesh.kandasamy@gmail.com": ("trishna.krishnan@sense.com", "trisha123", "Trishna Krishnan")
    }

    for old_email, (new_email, new_password, new_name) in updates.items():
        # Check if user exists
        cursor = conn.execute("SELECT * FROM users WHERE email = ? OR username = ?", (old_email, old_email))
        user = cursor.fetchone()
        
        if user:
            print(f"Found user: {old_email}. Updating to {new_email}...")
            hashed_pw = pwd_context.hash(new_password)
            
            # Update username (if it matches email), email, full_name, password
            # We assume username == email in this system mostly
            conn.execute(
                """
                UPDATE users 
                SET username = ?, email = ?, full_name = ?, hashed_password = ? 
                WHERE email = ? OR username = ?
                """,
                (new_email, new_email, new_name, hashed_pw, old_email, old_email)
            )
            print("Updated.")
        else:
            print(f"User {old_email} not found. Creating new...")
            hashed_pw = pwd_context.hash(new_password)
            
            # Check if new email already exists to avoid unique constraint error
            check_new = conn.execute("SELECT * FROM users WHERE email = ?", (new_email,)).fetchone()
            if not check_new:
                conn.execute(
                    "INSERT INTO users (username, email, full_name, hashed_password) VALUES (?, ?, ?, ?)",
                    (new_email, new_email, new_name, hashed_pw)
                )
                print("Created.")
            else:
                print(f"User {new_email} already exists. Skipping creation.")

    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    update_users()
