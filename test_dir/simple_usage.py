import asyncio
import json
from pathlib import Path
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

# Load environment variables (OPENAI_API_KEY, DEDALUS_API_KEY, etc.)
load_dotenv()

SESSION_FILE = Path(__file__).parent / "session.json"


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

    # Session management dictionary
    sessions: dict[str, list[dict]] = {"default": load_history()}
    session_id = "default"

    print("--- Dedalus Intelligent Handoff & Session Demo ---")
    print("Models: gpt-5-mini, gpt-5-codex, gpt-5.2")
    print("Commands: 'exit' to quit, 'clear' to reset session.\n")

    if sessions[session_id]:
        print(
            f"Resuming session '{session_id}' with {len(sessions[session_id])} messages.\n"
        )

    while True:
        try:
            # Take input from the user
            user_input = input("You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit"]:
                break
            if user_input.lower() == "clear":
                sessions[session_id] = []
                save_history(sessions[session_id])
                print("Session cleared.\n")
                continue

            # Append user message to history
            sessions[session_id].append({"role": "user", "content": user_input})
            history = sessions[session_id]

            print("\nAssistant: ", end="", flush=True)

            # Use Intelligent Handoffs and Session Management
            response_stream = runner.run(
                messages=history,
                model=["gpt-5-mini", "gpt-5-codex", "gpt-5.2"],
                mcp_servers=[
                    "tsion/exa",  # Semantic search engine
                    "windsor/brave-search-mcp",  # Privacy-focused web search
                ],
                stream=True,
            )

            full_response = ""
            async for chunk in response_stream:
                if hasattr(chunk, "choices") and chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        content = delta.content
                        full_response += content
                        print(content, end="", flush=True)

            # Save assistant response
            sessions[session_id].append({"role": "assistant", "content": full_response})
            save_history(sessions[session_id])
            print("\n")

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())
