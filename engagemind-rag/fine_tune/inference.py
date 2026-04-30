import logging
import os
import time
from pathlib import Path
from typing import Dict, Optional, Tuple

import torch
from peft import PeftModel
from transformers import GPT2LMHeadModel, GPT2Tokenizer


logger = logging.getLogger(__name__)

MAX_INPUT_TOKENS = 256
MAX_NEW_TOKENS = 120

_MODEL_CACHE: Dict[str, Dict[str, object]] = {}


def _models_root() -> Path:
    return Path(__file__).resolve().parent.parent / "models"


def _resolve_adapter_dir(user_id: str) -> Path:
    return _models_root() / user_id / "gpt2-lora"


def _path_within_root(root: Path, target: Path) -> bool:
    root_real = Path(os.path.realpath(root))
    target_real = Path(os.path.realpath(target))
    try:
        return os.path.commonpath([str(root_real), str(target_real)]) == str(root_real)
    except ValueError:
        return False


def check_adapter_availability(user_id: str, db) -> dict:
    output_dir = _resolve_adapter_dir(user_id)
    models_root = _models_root()

    if not _path_within_root(models_root, output_dir):
        return {
            "available": False,
            "reason": "Adapter path is outside the models directory.",
        }

    if not output_dir.exists():
        return {
            "available": False,
            "reason": "No trained GPT-2 LoRA adapter found for this user.",
        }

    has_adapter_weights = (output_dir / "adapter_model.bin").exists() or (
        output_dir / "adapter_model.safetensors"
    ).exists()
    if not (output_dir / "adapter_config.json").exists() or not has_adapter_weights:
        return {
            "available": False,
            "reason": "Adapter files are incomplete.",
        }

    tokenizer_files = ["tokenizer.json", "vocab.json", "merges.txt"]
    if not any((output_dir / name).exists() for name in tokenizer_files):
        return {
            "available": False,
            "reason": "Tokenizer files are missing.",
        }

    model_doc = db.models.find_one(
        {"user_id": user_id, "model_type": "gpt2-lora"},
        sort=[("completed_at", -1), ("_id", -1)],
    )
    if not model_doc:
        return {
            "available": False,
            "reason": "No fine-tune metadata exists for this adapter.",
        }

    recorded_dir = model_doc.get("output_dir")
    if recorded_dir:
        recorded_dir_path = Path(os.path.realpath(recorded_dir))
        if recorded_dir_path != Path(os.path.realpath(output_dir)):
            return {
                "available": False,
                "reason": "Fine-tune metadata does not match adapter location.",
            }

    return {
        "available": True,
        "model_id": str(model_doc.get("_id")),
        "output_dir": str(output_dir),
        "completed_at": model_doc.get("completed_at"),
    }


def _load_adapter(output_dir: str) -> Tuple[GPT2LMHeadModel, GPT2Tokenizer, torch.device]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dtype = torch.float16

    tokenizer = GPT2Tokenizer.from_pretrained(output_dir)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    base_model = GPT2LMHeadModel.from_pretrained(
        "gpt2",
        dtype=dtype,
        low_cpu_mem_usage=True,
    )
    base_model.config.pad_token_id = tokenizer.pad_token_id

    model = PeftModel.from_pretrained(base_model, output_dir)
    model.eval()
    model.to(device)

    return model, tokenizer, device


def _get_cached_model(user_id: str, model_id: str, output_dir: str) -> Optional[Tuple[GPT2LMHeadModel, GPT2Tokenizer, torch.device]]:
    cached = _MODEL_CACHE.get(user_id)
    if not cached:
        return None

    if cached.get("model_id") != model_id or cached.get("output_dir") != output_dir:
        return None

    model = cached.get("model")
    tokenizer = cached.get("tokenizer")
    device = cached.get("device")

    if not model or not tokenizer or not device:
        return None

    return model, tokenizer, device


def _set_cache(user_id: str, model_id: str, output_dir: str, model, tokenizer, device) -> None:
    _MODEL_CACHE[user_id] = {
        "model": model,
        "tokenizer": tokenizer,
        "device": device,
        "model_id": model_id,
        "output_dir": output_dir,
        "loaded_at": int(time.time()),
    }


def _build_prompt(message: str) -> str:
    cleaned = (message or "").strip()
    return f"User: {cleaned}\nAssistant:"


def _extract_assistant_answer(decoded: str, prompt: str) -> str:
    if decoded.startswith(prompt):
        text = decoded[len(prompt):].strip()
    else:
        text = decoded.strip()

    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if line.startswith("Assistant:"):
            line = line[len("Assistant:"):].strip()
            if lines:
                break
        elif line.startswith("User:"):
            break

        if line:
            lines.append(line)

    return " ".join(lines).strip()


def generate_lora_response(user_id: str, message: str, db, status: Optional[dict] = None) -> Tuple[str, dict]:
    status = status or check_adapter_availability(user_id, db)
    if not status.get("available"):
        reason = status.get("reason") or "GPT-2 LoRA adapter unavailable."
        raise RuntimeError(reason)

    output_dir = status["output_dir"]
    model_id = status["model_id"]

    cached = _get_cached_model(user_id, model_id, output_dir)
    if cached:
        model, tokenizer, device = cached
    else:
        model, tokenizer, device = _load_adapter(output_dir)
        _set_cache(user_id, model_id, output_dir, model, tokenizer, device)

    prompt = _build_prompt(message)
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_INPUT_TOKENS,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        generated = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(generated[0], skip_special_tokens=True)
    answer = _extract_assistant_answer(decoded, prompt)

    if not answer:
        answer = "I'm not sure how to respond to that."

    return answer, status
