from pathlib import Path
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import json

# load env vars from root if available, otherwise fallback to local
root_env = Path(__file__).parent.parent / ".env"
test_env = Path(__file__).parent.parent / "test_dir" / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
elif test_env.exists():
    load_dotenv(dotenv_path=test_env)
else:
    load_dotenv()


class CodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(description="This is code. NOTHING ELSE!")


class ValidationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    report: List[str] = Field(
        description="This is a list of what is wrong or what should be improved on. If there is nothing leave blank.",
        default=[],
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str
    user_feedback: str


class AIService:
    def __init__(self):
        self.client = AsyncDedalus()
        self.runner = DedalusRunner(self.client)

    async def firmware_generator(self, spec: str) -> str:
        """
        Generates firmware code based on the specification.
        Uses research tools to find relevant libraries/datasheets.
        """
        print(f"\n[Tool: Generator] Researching and generating for: {spec}...")
        try:
            # Explicitly request ESP32Servo.h to avoid standard Servo.h errors on ESP32
            result = await self.runner.run(
                input=f"Generate firmware code for: {spec}. Use Arduino.h. If using a servo, USE <ESP32Servo.h>. NO STATICS/CONST in global scope. always detach at the start of setup and reattach.",
                model="openai/gpt-5.2",
                response_format=CodeResponse,
            )

            # Robust parsing of the final output
            raw = result.final_output
            if isinstance(raw, str):
                try:
                    data = json.loads(raw)
                    return data.get("code", raw)
                except Exception:
                    return raw
            return getattr(raw, "code", str(raw))
        except Exception as e:
            print(f"\n[Tool: Generator] ERROR: {e}")
            raise e

    async def firmware_validator(self, code: str, original_request: str) -> dict:
        """
        Validates generated code against the original request.
        """
        print(f"\n[Tool: Validator] Checking code against: {original_request}...")
        try:
            result = await self.runner.run(
                input=f"Verify this code against: '{original_request}'. Check pins for esp-wroom-32. Return empty report [] if PASS.\nCode:\n{code}",
                model="xai/grok-4-1-fast-reasoning",
                mcp_servers=["kuax/dedalus_server"],
                response_format=ValidationResult,
            )

            raw = result.final_output
            if isinstance(raw, str):
                try:
                    return json.loads(raw)
                except Exception:
                    return {"report": [raw]}
            if hasattr(raw, "model_dump"):
                return raw.model_dump()
            return (
                {"report": []} if "PASS" in str(raw).upper() else {"report": [str(raw)]}
            )
        except Exception as e:
            print(f"\n[Tool: Validator] ERROR: {e}")
            raise e

    async def run_pipeline(
        self, prompt: str, history: Optional[List[Dict[str, str]]] = None
    ) -> UserResponse:
        """
        Runs the full firmware generation and validation pipeline.
        """
        if history is None:
            history = []

        history.append({"role": "user", "content": prompt})

        instructions = """You are a firmware coordinator for esp-wroom-32.
        SEQUENCE:
        1. Verify pins using 'get_doc' tools.
        2. Call firmware_generator.
        3. Call firmware_validator.
        4. If validator report is NOT empty, call firmware_generator ONCE more to fix.
        5. If validator report IS empty (pass), IMMEDIATELY stop and return success result.
        """

        try:
            result = await self.runner.run(
                messages=history,
                instructions=instructions,
                model="openai/gpt-4o-mini",
                mcp_servers=["kuax/dedalus_server"],
                tools=[self.firmware_generator, self.firmware_validator],
                response_format=UserResponse,
            )

            # result.final_output might be many things depending on runner state
            output_raw = result.final_output

            # Convert to dict for flexibility
            if isinstance(output_raw, str):
                try:
                    output = json.loads(output_raw)
                except Exception:
                    # Fallback if it's plain text (not expected with response_format)
                    output = {"code": "", "user_feedback": output_raw}
            elif hasattr(output_raw, "model_dump"):
                output = output_raw.model_dump()
            else:
                # Fallback for unexpected types
                output = dict(output_raw)

            # transform code to fit the multi-tasking main.cpp structure
            print(f"final: {output}")

            code = output.get("code", "")
            if code:
                output["code"] = code.replace(
                    "void loop()", "void ai_test_loop()"
                ).replace("void setup()", "void ai_test_setup()")

            return output
        except Exception as e:
            error_msg = str(e)
            if "<!DOCTYPE html>" in error_msg:
                error_msg = "AI Service is temporarily unavailable (500 Error)."
            print(f"Pipeline Error: {error_msg}")
            raise Exception(error_msg)

    async def save_code(self, code: str, path: str = "./firmware/src/ai.cpp"):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(code)
        print(f"Code saved to {path}")
