# Dedalus Labs SDK

Intelligent model handoff SDK that automatically routes tasks to the most appropriate LLM based on complexity.

## Features

- **Intelligent Handoffs**: Automatically route subtasks to specialized models (e.g., GPT-5.2 for reasoning, GPT-5-Codex for code).
- **Streaming Support**: Real-time response streaming for improved user experience.
- **Complexity Analysis**: Automatically scores prompts based on length and semantic complexity.
- **Dynamic Routing**: Routes simple queries to faster/cheaper models and complex queries to more powerful models.
- **Extensible**: easy to add new model providers (e.g. OpenAI, Anthropic, local models).

## Installation

```bash
pip install .
```

## Usage

```python
import asyncio
from dedalus import AsyncDedalus, OpenAIProvider, DedalusLabsProvider

async def main():
    # Initialize with desired models
    # You can use direct OpenAI providers or Dedalus Labs providers
    low_cost = OpenAIProvider(model="gpt-4o-mini")
    high_power = DedalusLabsProvider(model="anthropic/claude-3-5-sonnet")

    # Create the client
    client = AsyncDedalus(low_model=low_cost, high_model=high_power)

    # Generate response - automatically routes!
    response = await client.generate("Explain the theory of relativity.")
    print(response)

if __name__ == "__main__":
    asyncio.run(main())
```

## Examples

To run the provided examples, you can use the following command from the root directory:

```bash
python examples/simple_usage.py
```

## Structure

- `src/dedalus/complexity.py`: Logic for analyzing prompt complexity.
- `src/dedalus/router.py`: Logic for selecting models based on scores.
- `src/dedalus/models.py`: Abstract base class and concrete implementations for LLMs.
