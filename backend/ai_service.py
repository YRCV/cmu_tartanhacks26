
import json
import asyncio
from pathlib import Path
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict
from typing import List

# load env vars
env_path = Path(__file__).parent.parent / "test_dir" / ".env"
load_dotenv(dotenv_path=env_path)

class CodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(description="This is code. NOTHING ELSE!")

class ValidationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    report: List[str] = Field(
        description="This is a list of what is wrong or what should be improved on. If there is nothing leave blank.",
        default=[],
    )

class AIService:
    def __init__(self):
        self.client = None
        self.runner = None

    async def ensure_runner(self):
        if not self.client:
            self.client = AsyncDedalus()
            self.runner = DedalusRunner(self.client)

    async def generate_firmware(self, spec: str) -> str:
        """
        Generates firmware code based on the specification.
        """
        await self.ensure_runner()
        print(f"\n[Tool: Generator] Researching and generating for: {spec}...")
        try:
            result = await self.runner.run(
                input=f"Generate firmware code for the following specification. Do not forget to include standard libaries like Arduino.h. If you use LED_BUILTIN, please #define LED_BUILTIN 2 at the top of the file as it is not defined for this board. Ensure it includes comments and error handling.\nSpec: {spec}",
                model="openai/gpt-5.2",
                # mcp_servers=["tsion/exa", "windsor/brave-search-mcp"],
                response_format=CodeResponse,
            )
            print(f"[Tool: Generator] Code generated...")
            # Handle potential string return
            if isinstance(result.final_output, str):
                 try:
                     return json.loads(result.final_output)['code']
                 except:
                     return result.final_output
            return result.final_output.code
        except Exception as e:
            print(f"\n[Tool: Generator] ERROR: {e}")
            raise e

    async def validate_firmware(self, code: str, original_request: str) -> str:
        """
        Validates generated code against the original request.
        """
        await self.ensure_runner()
        print(f"\n[Tool: Validator] Checking code against: {original_request}...")
        try:
            result = await self.runner.run(
                input=f"Validate this firmware code against the request: '{original_request}'.\nCheck logic and security. Check syntax with the cpp_syntax_checker mcp. Return 'PASS' or a report.\nCode:\n{code}",
                model="xai/grok-4-1-fast-reasoning",
                mcp_servers=["kuax/dedalus_server"],
                response_format=ValidationResult,
            )
            print(f"[Tool: Validator] Validation complete...")
            if isinstance(result.final_output, str):
                 return result.final_output
            return result.final_output
        except Exception as e:
            print(f"\n[Tool: Validator] ERROR: {e}")
            raise e

    async def process_request(self, prompt: str) -> str:
        """
        Orchestrates the generation and validation process.
        Returns the final valid C++ code string.
        """
        await self.ensure_runner()
        
        # tools wrapper
        async def firmware_generator(spec: str) -> str:
            return await self.generate_firmware(spec)

        async def firmware_validator(code: str, original_request: str) -> str:
            return await self.validate_firmware(code, original_request)

        # orchestration logic

        history = [{"role": "user", "content": prompt}]
        
        # response format
        class PipelineResponse(BaseModel):
            code: str = Field(description="The final validated C++ code.")

        print(f"Starting AI pipeline for: {prompt}")

        try:
            # execute pipeline
            # Using openai/gpt-4o-mini might be too weak for complex orchestration + json enforcement sometimes.
            # But let's stick to it for now.

            result = await self.runner.run(
                messages=history,
                instructions="You are a firmware coordinator. 1. Generate code using firmware_generator. 2. Validate it using firmware_validator. 3. If validation fails, regenerate/fix. 4. Return Final Validated Code. IMPORTANT: The generated code MUST check `extern volatile bool shouldStop;` periodically and return if true. Ensure LED_BUILTIN is defined as 2 if used.",
                model="openai/gpt-4o-mini",
                tools=[firmware_generator, firmware_validator],
                response_format=PipelineResponse
            )
            
            output = result.final_output
            print(f"Pipeline Result Type: {type(output)}")
            
            if isinstance(output, str):
                # If it's a string, try to parse it as JSON if it looks like it, 
                # or just return it if it looks like code.
                if output.strip().startswith("{"):
                    try:
                        return json.loads(output)['code']
                    except:
                        pass
                return output
            
            return output.code

        except Exception as e:
            print(f"Pipeline Error: {e}")
            raise e
