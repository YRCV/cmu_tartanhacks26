import json
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
            result = await runner.run(
                input=f"Generate firmware code for the following specification. Do not forget to include standard libaries like Arduino.h. Ensure it includes comments and error handling.\nSpec: {spec}",
                model="openai/gpt-5.2",
                # mcp_servers=["tsion/exa", "windsor/brave-search-mcp"],
                response_format=CodeResponse,
            )
            print(f"[Tool: Generator] Code generated: {result.final_output}...")
            return result.final_output
        except Exception as e:
            print(f"\n[Tool: Generator] ERROR: {e}")
            raise e

    async def firmware_validator(code: str, original_request: str) -> str:
        """
        Validates generated code against the original request.
        """
        print(f"\n[Tool: Validator] Checking code against: {original_request}...")
        # print(code)   
        try:
            result = await runner.run(
                input=f"Validate this firmware code against the request: '{original_request}'.\nCheck logic and security. Check syntax with the cpp_syntax_checker mcp. Return 'PASS' or a report.\nCode:\n{code}",
                model="xai/grok-4-1-fast-reasoning",
                mcp_servers=["kuax/dedalus_server"],
                response_format=ValidationResult,
            )
            print(
                f"[Tool: Validator] Validation complete: {result.final_output}..."
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
                instructions="You are a firmware coordinator for esp-wroom-32. For any firmware request, first use firmware_generator to create the code, then use firmware_validator to verify it, if there are any errors then rerun the pipeline. Pass the original user request to both tools as needed. Finally, present the code and the validation result to the user.",
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
            json_response = json.loads(full_response)
            if json_response["code"]:
                code = (
                    json_response["code"]
                    .replace("void loop()", "void ai_test_loop()")
                    .replace("void setup()", "void ai_test_setup()")
                )
                open("./firmware/src/ai.cpp", "w").write(code )

            print("\n")
            history.append({"role": "assistant", "content": full_response})
            save_history(history)

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())