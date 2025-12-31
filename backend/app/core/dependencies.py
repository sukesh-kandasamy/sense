from fastapi import HTTPException, status, Cookie, Depends
from typing import Optional
from core.database import get_session_user_from_db, get_db_connection
from models import User, UserInDB

async def get_current_user(access_token: Optional[str] = Cookie(None)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not access_token:
        raise credentials_exception
        
    session = get_session_user_from_db(access_token)
    if not session:
        raise credentials_exception
        
    username = session['username']
    role = session['role']
    
    # Fetch user from database (both candidates and interviewers)
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user_row is None:
        # For session-only users (e.g., candidates joining via access code without account)
        if role == 'candidate':
            return User(username=username, full_name="Candidate", role="candidate")
        raise credentials_exception
    
    user = UserInDB(**dict(user_row))
    # Role comes from database, not session (database is source of truth)
    return user

async def get_current_interviewer(current_user: User = Depends(get_current_user)):
    if current_user.role != 'interviewer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    return current_user

from fastapi import WebSocket, WebSocketDisconnect

async def get_current_user_ws(
    websocket: WebSocket,
    access_token: Optional[str] = Cookie(None)
) -> User:
    """
    WebSocket-specific dependency to authenticate users via Cookie or Query Param.
    """
    # 1. Try Cookie (Browser default)
    # 2. Try Query Param (for tools/clients that can't set cookies easily)
    token = access_token or websocket.query_params.get("token")
    
    if not token:
        # Close with Policy Violation
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        raise WebSocketDisconnect()

    session = get_session_user_from_db(token)
    if not session:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid session")
        raise WebSocketDisconnect()
        
    username = session['username']
    role = session['role']
    
    # Fetch user details
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user_row is None:
        if role == 'candidate':
             return User(username=username, full_name="Candidate", role="candidate")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
        raise WebSocketDisconnect()
    
    return UserInDB(**dict(user_row))
