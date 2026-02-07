import asyncio
import json
from pathlib import Path
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict
from typing import List

# Load environment variables
load_dotenv()

SESSION_FILE = Path(__file__).parent / "firmware_session.json"


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


def load_history() -> list[dict]:
    if SESSION_FILE.exists():
        try:
            return json.loads(SESSION_FILE.read_text())
        except Exception:
            return []
    return []


def save_history(messages: list[dict]):
    SESSION_FILE.write_text(json.dumps(messages, indent=2))


async def main():
    # Initialize the Dedalus client and runner
    client = AsyncDedalus()
    runner = DedalusRunner(client)

    # Session management
    history = load_history()

    # Load existing firmware context - TARGET USER_APP.CPP
    firmware_path = Path(__file__).parent.parent / "firmware" / "src" / "user_app.cpp"
    try:
        current_firmware = firmware_path.read_text()
        print(f"Loaded existing user firmware from {firmware_path}")
    except Exception as e:
        print(f"Warning: Could not read firmware file: {e}")
        current_firmware = "// No existing firmware found."

    print("--- Firmware Generation & Validation Pipeline ---")
    print("Type your firmware request (e.g., 'Blink LED on ESP32'). 'exit' to quit.\n")

    # Define tools within main to access 'runner'
    async def firmware_generator(spec: str) -> str:
        """
        Generates firmware code based on the specification.
        Uses research tools to find relevant libraries/datasheets.
        """
        print(f"\n[Tool: Generator] Researching and generating for: {spec}...")
        try:
            prompt = f"""
Generate STRICTLY COMPLIANT C++ code for 'src/user_app.cpp'.

CRITICAL INSTRUCTIONS (FAILURE TO FOLLOW WILL BREAK THE BUILD):
1.  **DO NOT** generate `void setup()` or `void loop()`. These functions ALREADY EXIST in `main.cpp`.
2.  **YOU MUST IMPLEMENT**: `void userAppSetup()` and `void userAppLoop()`.
3.  **YOU MUST DEFINE**: A global boolean `bool isUserAppActive = false;` (This is required by the linker).
4.  **Header**: Include `#include "user_app.h"`.

Logic Requirement:
-   In `userAppLoop()`, check `if (!isUserAppActive) {{ digitalWrite(2, LOW); return; }}` at the start.
-   Implement the requested logic: {spec}

Current User Firmware (for reference):
{current_firmware}
"""
            result = await runner.run(
                input=prompt,
                model="xai/grok-code-fast-1",
                mcp_servers=["tsion/exa", "windsor/brave-search-mcp"],
                response_format=CodeResponse,
            )
            print(f"[Tool: Generator] Code generated: {result.final_output[:50]}...")
            return result.final_output
        except Exception as e:
            print(f"\n[Tool: Generator] ERROR: {e}")
            raise e

    async def firmware_validator(code: str, original_request: str) -> str:
        """
        Validates generated code against the original request.
        """
        print(f"\n[Tool: Validator] Checking code against: {original_request}...")
        try:
            prompt = f"""
Validate this firmware code against the request: '{original_request}'.
Build Safety Checks:
1.  Does it define `void userAppSetup()`? (Required)
2.  Does it define `void userAppLoop()`? (Required)
3.  Does it define `bool isUserAppActive = false;`? (Required)
4.  Does it **AVOID** defining `void setup()` or `void loop()`? (Critical - defining these will break the build)

Code:
{code}
"""
            result = await runner.run(
                input=prompt,
                model="xai/grok-4-1-fast-reasoning",
                response_format=ValidationResult,
            )
            print(
                f"[Tool: Validator] Validation complete: {result.final_output[:50]}..."
            )
            return result.final_output
        except Exception as e:
            print(f"\n[Tool: Validator] ERROR: {e}")
            raise e

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit"]:
                break
            if user_input.lower() == "clear":
                history = []
                save_history(history)
                print("Session cleared.\n")
                continue

            # Append user message
            history.append({"role": "user", "content": user_input})

            print("\nAssistant: ", end="", flush=True)

            # Execution with orchestration using 'instructions'
            response_stream = runner.run(
                messages=history,
                instructions="You are a firmware coordinator. For any firmware request, first use firmware_generator to create the code, then use firmware_validator to verify it. Pass the original user request to both tools as needed. Finally, present the code and the validation result to the user.",
                model="openai/gpt-4o-mini",
                tools=[firmware_generator, firmware_validator],
                stream=True,
                response_format=UserResponse,
            )

            full_response = ""
            async for chunk in response_stream:
                if hasattr(chunk, "choices") and chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        content = delta.content
                        full_response += content
                        print(content, end="", flush=True)

            print("\n")
            history.append({"role": "assistant", "content": full_response})
            save_history(history)

            # Attempt to save the code to main.cpp
            try:
                # Clean up potential markdown formatting if the model wraps json in ```json ... ```
                cleaned_response = full_response
                
                # First, try to find JSON block
                if "```json" in cleaned_response:
                    try:
                       parts = cleaned_response.split("```json")
                       if len(parts) > 1:
                           potential_json = parts[1].split("```")[0].strip()
                           json.loads(potential_json) # Test parse
                           cleaned_response = potential_json
                    except:
                        pass # proceed with raw
                
                response_data = {}
                try:
                    response_data = json.loads(cleaned_response.strip())
                except json.JSONDecodeError:
                    # Fallback: maybe the model just returned the code directly or wrapped it in cpp blocks
                     print(f"\n[System] Warning: Could not parse response as JSON. Checking for C++ code blocks...")
                     if "```cpp" in cleaned_response:
                        code_part = cleaned_response.split("```cpp")[1].split("```")[0].strip()
                        response_data = {"code": code_part}
                     elif "```c++" in cleaned_response:
                        code_part = cleaned_response.split("```c++")[1].split("```")[0].strip()
                        response_data = {"code": code_part}
                     else:
                        # Assumption: The whole response might be code if it looks like C++
                        if "#include" in cleaned_response or "void userApp" in cleaned_response:
                            response_data = {"code": cleaned_response}
                
                if "code" in response_data and response_data["code"]:
                    final_code = response_data["code"]
                    
                    print(f"\n[System] Post-processing code to ensure compliance...")
                    # 1. Ensure header include
                    if '#include "user_app.h"' not in final_code:
                        final_code = '#include "user_app.h"\n' + final_code
                    
                    # 2. Fix setup() -> userAppSetup()
                    if "void setup()" in final_code:
                        print("[System] Auto-fixing: renaming setup() to userAppSetup()")
                        final_code = final_code.replace("void setup()", "void userAppSetup()")
                    
                    # 3. Fix loop() -> userAppLoop()
                    if "void loop()" in final_code:
                        print("[System] Auto-fixing: renaming loop() to userAppLoop()")
                        final_code = final_code.replace("void loop()", "void userAppLoop()")
                        
                    # 4. Ensure global flag exists
                    if "bool isUserAppActive" not in final_code:
                        print("[System] Auto-fixing: injecting isUserAppActive flag")
                        final_code = final_code.replace('#include "user_app.h"', '#include "user_app.h"\n\n// Auto-injected global flag\nbool isUserAppActive = false;')
                        
                    print(f"\n[System] Saving generated code to {firmware_path}...")
                    firmware_path.write_text(final_code)
                    print("[System] Save successful!")
                else:
                    print("[System] No code found to save.")

            except Exception as e:
                print(f"\n[System] Error saving file: {e}")

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())
