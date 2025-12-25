import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv()

async def list_models():
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("No API key found")
            return
            
        client = genai.Client(api_key=api_key)
        # The new SDK might use sync or async. The previous code used client.aio.live.connect
        # But list_models is typically sync or async.
        # Let's try standard sync iteration if possible, or async.
        # Actually client.models.list() returns an iterator in v0.
        # Let's check safely.
        
        print("Listing models...")
        # Note: In new google-genai SDK, it might be client.models.list()
        for m in client.models.list():
            if "gemini" in m.name:
                print(f"- {m.name}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
