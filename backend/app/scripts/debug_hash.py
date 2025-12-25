from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password = "sample@123"

try:
    print(f"Hashing password: '{password}' (len={len(password)})")
    hash_ = pwd_context.hash(password)
    print(f"Hash: {hash_}")
except Exception as e:
    print(f"Error: {e}")
