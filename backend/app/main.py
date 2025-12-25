from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.auth import router as auth_router
from routes.signaling import router as signaling_router
from routes.gemini_analysis import router as gemini_router
from core.database import init_db, seed_db

# Initialize Database on startup
init_db()
seed_db()

app = FastAPI(title="sense")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*", # Allow all origins temporarily
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(signaling_router, tags=["Signaling"])
app.include_router(gemini_router, tags=["Gemini Analysis"])
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Video Interview Platform API is running"}

if __name__ == "__main__":
    import uvicorn
    # Check for SSL files to run in secure mode (needed for camera/mic)
    import os
    if os.path.exists("certs/key.pem") and os.path.exists("certs/cert.pem"):
        print("Starting in SSL mode on port 8443...")
        uvicorn.run("main:app", host="0.0.0.0", port=8443, ssl_keyfile="certs/key.pem", ssl_certfile="certs/cert.pem", reload=True)
    else:
        print("Warning: SSL keys not found. Camera/Mic might not work on remote devices.")
        print("Starting in HTTP mode on port 8000...")
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
