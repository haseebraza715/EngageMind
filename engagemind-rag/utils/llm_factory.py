"""
Provider-aware chat model factory.

Keeps embeddings on Mistral while allowing chat generation to switch between:
- Mistral (`ChatMistralAI`)
- OpenRouter via OpenAI-compatible API (`ChatOpenAI`)
"""

import logging
import os
from typing import Optional

from langchain_mistralai.chat_models import ChatMistralAI

logger = logging.getLogger(__name__)


def _read_env(name: str, default: str = "") -> str:
    value = os.getenv(name, default)
    return (value or "").strip().strip('"').strip("'")


def _read_temperature() -> float:
    raw = _read_env("CHAT_TEMPERATURE", "0.1")
    try:
        value = float(raw)
        if value < 0:
            return 0.0
        if value > 2:
            return 2.0
        return value
    except ValueError:
        logger.warning("Invalid CHAT_TEMPERATURE='%s'; using 0.1", raw)
        return 0.1


def create_chat_llm(
    *,
    purpose: str = "chat",
    mistral_api_key: Optional[str] = None,
):
    """
    Build an LLM for chat/title tasks based on environment config.

    Env vars:
    - CHAT_PROVIDER: `mistral` (default) or `openrouter`
    - CHAT_TEMPERATURE: optional, default `0.1`

    Mistral mode:
    - MISTRAL_CHAT_MODEL (default `mistral-small`)
    - MISTRAL_TITLE_MODEL (default uses MISTRAL_CHAT_MODEL)

    OpenRouter mode:
    - OPENROUTER_API_KEY (required)
    - OPENROUTER_BASE_URL (default `https://openrouter.ai/api/v1`)
    - OPENROUTER_CHAT_MODEL (default `qwen/qwen3-next-80b-a3b-instruct:free`)
    - OPENROUTER_TITLE_MODEL (default uses OPENROUTER_CHAT_MODEL)
    - OPENROUTER_HTTP_REFERER or OPENROUTER_SITE_URL (optional)
    - OPENROUTER_APP_NAME or OPENROUTER_SITE_NAME (optional, sent as X-OpenRouter-Title)
    """
    provider = _read_env("CHAT_PROVIDER", "mistral").lower()
    temperature = _read_temperature()

    if provider == "mistral":
        mistral_key = (mistral_api_key or _read_env("MISTRAL_API_KEY")).strip()
        if not mistral_key:
            raise RuntimeError("MISTRAL_API_KEY must be set when CHAT_PROVIDER=mistral.")

        chat_model = _read_env("MISTRAL_CHAT_MODEL", "mistral-small")
        title_model = _read_env("MISTRAL_TITLE_MODEL", chat_model)
        model_name = title_model if purpose == "title" else chat_model
        llm = ChatMistralAI(
            mistral_api_key=mistral_key,
            model=model_name,
            temperature=temperature,
        )
        setattr(llm, "_engagemind_provider", "mistral")
        setattr(llm, "_engagemind_model", model_name)
        return llm

    if provider == "openrouter":
        openrouter_key = _read_env("OPENROUTER_API_KEY")
        if not openrouter_key:
            raise RuntimeError("OPENROUTER_API_KEY must be set when CHAT_PROVIDER=openrouter.")

        try:
            from langchain_openai import ChatOpenAI
        except ImportError as exc:
            raise RuntimeError(
                "langchain-openai is required for CHAT_PROVIDER=openrouter. "
                "Run: pip install -r requirements.txt"
            ) from exc

        chat_model = _read_env(
            "OPENROUTER_CHAT_MODEL",
            "qwen/qwen3-next-80b-a3b-instruct:free",
        )
        title_model = _read_env("OPENROUTER_TITLE_MODEL", chat_model)
        model_name = title_model if purpose == "title" else chat_model

        headers = {}
        referer = _read_env("OPENROUTER_HTTP_REFERER") or _read_env("OPENROUTER_SITE_URL")
        app_name = _read_env("OPENROUTER_APP_NAME") or _read_env("OPENROUTER_SITE_NAME")
        if referer:
            headers["HTTP-Referer"] = referer
        if app_name:
            headers["X-OpenRouter-Title"] = app_name

        llm = ChatOpenAI(
            api_key=openrouter_key,
            base_url=_read_env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            model=model_name,
            temperature=temperature,
            default_headers=headers or None,
        )
        setattr(llm, "_engagemind_provider", "openrouter")
        setattr(llm, "_engagemind_model", model_name)
        return llm

    raise ValueError(
        f"Unsupported CHAT_PROVIDER='{provider}'. Use 'mistral' or 'openrouter'."
    )
