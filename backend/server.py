from typing import Tuple, List
import shutil
import subprocess
import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from ai_service import AIService

app = FastAPI()
ai_service = AIService()

# configuration
PROJECT_ROOT = Path(__file__).parent.parent
FIRMWARE_DIR = PROJECT_ROOT / "firmware"
BACKEND_DIR = PROJECT_ROOT / "backend"
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


class GenerateResponse(BaseModel):
    variables: List[Tuple[str, str]]
    code: str
    feedback: str


@app.post("/generate", response_model=GenerateResponse)
async def generate_firmware(request: GenerateRequest):
    print(f"Received request: {request}")

    try:
        # 1. Run pipeline
        pipeline_result = await ai_service.run_pipeline(request.prompt, history=[])
        final_code = pipeline_result["code"]
        feedback = pipeline_result["user_feedback"]

        if not final_code:
            raise HTTPException(status_code=500, detail="No code generated.")

        # 2. save code
        try:
            await ai_service.save_code(final_code, str(FIRMWARE_SRC))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save code: {e}")

        # 3. compile firmware
        print("compiling")
        variables = []
        try:
            varsRaw = subprocess.run(
                ["python", "./backend/generate_variable_glue.py"],
                cwd=str(PROJECT_ROOT),
                capture_output=True,
                text=True,
                check=True,
            )
            if varsRaw.stdout.strip():
                variables = [a.split(",") for a in varsRaw.stdout.split()]
            print(variables)
            _result = subprocess.run(
                ["pio", "run"],
                cwd=str(FIRMWARE_DIR),
                capture_output=True,
                text=True,
                check=True,
            )
            print("compilation success")

            # Start static server on port 8000
            try:
                subprocess.Popen(
                    ["python", "-m", "http.server", "8000"],
                    cwd=str(BACKEND_DIR),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else e.stdout
            raise HTTPException(
                status_code=500, detail=f"Compilation Failed: {error_msg}"
            )

        # 4. copy binary
        if not FIRMWARE_BIN.exists():
            print("no firmware bin")
            raise HTTPException(
                status_code=500, detail="Firmware binary not found after compilation."
            )

        shutil.copy(FIRMWARE_BIN, STATIC_FIRMWARE_BIN)

        # get local ip
        import socket

        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("10.255.255.255", 1))
            IP = s.getsockname()[0]
        except Exception:
            IP = "127.0.0.1"
        finally:
            s.close()

        firmware_url = f"http://{IP}:8000/static/firmware.bin"
        ota_url = f"http://{request.esp_ip}/ota/update?url={firmware_url}"

        print("flashing")
        try:
            response = requests.get(ota_url, timeout=30)
            if response.status_code != 200:
                print(f"OTA Trigger Failed: {response.text}")
                # We can still return the code even if OTA fails?
                # Let's just log and continue for now or raise if strict.
        except Exception as e:
            print(f"Failed to contact ESP32: {str(e)}")

        # Finally return the success result
        return GenerateResponse(variables=variables, code=final_code, feedback=feedback)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Unexpected server error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
