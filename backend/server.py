
import os
import shutil
import subprocess
import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from backend.ai_service import AIService

app = FastAPI()
ai_service = AIService()

# configuration
PROJECT_ROOT = Path(__file__).parent.parent
FIRMWARE_DIR = PROJECT_ROOT / "firmware"
FIRMWARE_SRC = FIRMWARE_DIR / "src" / "ai.cpp"
BUILD_DIR = FIRMWARE_DIR / ".pio" / "build" / "esp32dev"
FIRMWARE_BIN = BUILD_DIR / "firmware.bin"
STATIC_DIR = Path(__file__).parent / "static"
STATIC_FIRMWARE_BIN = STATIC_DIR / "firmware.bin"

# ensure static dir exists
STATIC_DIR.mkdir(exist_ok=True)

# mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class GenerateRequest(BaseModel):
    prompt: str
    esp_ip: str

@app.post("/generate")
async def generate_firmware(request: GenerateRequest):
    print(f"Received request: {request}")
    
    # 1. generate code
    try:
        code = await ai_service.process_request(request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")



    if "void loop()" in code:
        code = code.replace("void loop()", "void ai_test_loop()")
    if "void setup()" in code:
        code = code.replace("void setup()", "void ai_test_setup()")

        
    try:
        FIRMWARE_SRC.write_text(code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write code to file: {str(e)}")

    # 3. compile firmware
    print("Compiling firmware...")
    try:
        # Run pio run in the firmware directory
        # We need to ensure 'pio' is in the path or use the full path if known.
        # Assuming 'pio' is available in the shell environment.
        result = subprocess.run(
            ["pio", "run"], 
            cwd=str(FIRMWARE_DIR),
            capture_output=True,
            text=True,
            check=True
        )
        print("Compilation successful.")
    except subprocess.CalledProcessError as e:
        print(f"Compilation Failed: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Compilation Failed: {e.stderr}")

    # 4. copy binary
    if not FIRMWARE_BIN.exists():
        raise HTTPException(status_code=500, detail="Firmware binary not found after compilation.")
    
    shutil.copy(FIRMWARE_BIN, STATIC_FIRMWARE_BIN)
    print(f"Firmware copied to {STATIC_FIRMWARE_BIN}")

    # 5. trigger ota
    # get local ip
    
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
        
    firmware_url = f"http://{IP}:8001/static/firmware.bin"
    ota_url = f"http://{request.esp_ip}/ota/update?url={firmware_url}"
    
    print(f"Triggering OTA at: {ota_url}")
    
    try:
        response = requests.get(ota_url, timeout=30) # Using GET as per main.cpp lines 215/216
        if response.status_code == 200:
            return {"status": "success", "message": "OTA Update Triggered"}
        else:
             raise HTTPException(status_code=500, detail=f"OTA Trigger Failed: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to contact ESP32: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
