"""Regression tests for low-cost single-variant Test Mode.

Run from backend/: poetry run pytest tests/test_test_mode.py -q
"""
import pytest

from llm import Llm
from routes.generate_code import ModelSelectionStage


@pytest.mark.asyncio
async def test_single_openai_variant():
    async def report_error(message: str) -> None:
        raise AssertionError(message)

    models = await ModelSelectionStage(report_error).select_models(
        generation_type="create", input_mode="text",
        openai_api_key="test-key", anthropic_api_key="test-key",
        test_mode=True, test_model="openai",
    )
    assert models == [Llm.GPT_5_4_MINI_LOW]


@pytest.mark.asyncio
async def test_single_anthropic_variant():
    async def report_error(message: str) -> None:
        raise AssertionError(message)

    models = await ModelSelectionStage(report_error).select_models(
        generation_type="create", input_mode="text",
        openai_api_key=None, anthropic_api_key="test-key",
        test_mode=True, test_model="anthropic",
    )
    assert models == [Llm.CLAUDE_SONNET_4_6]


@pytest.mark.asyncio
async def test_missing_selected_key_fails_without_fallback():
    messages: list[str] = []

    async def report_error(message: str) -> None:
        messages.append(message)

    models = await ModelSelectionStage(report_error).select_models(
        generation_type="create", input_mode="text",
        openai_api_key=None, anthropic_api_key="test-key",
        test_mode=True, test_model="openai",
    )
    assert models == []
    assert any("openai API key" in m for m in messages)
