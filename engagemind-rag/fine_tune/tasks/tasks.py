import logging
import os
import time
from pathlib import Path
from typing import List

import pymongo
import torch
from bson import ObjectId
from datasets import Dataset
from peft import LoraConfig, get_peft_model
from transformers import (
    DataCollatorForLanguageModeling,
    GPT2LMHeadModel,
    GPT2Tokenizer,
    Trainer,
    TrainingArguments,
)

from fine_tune.celery_config import app as celery_app


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/demo_db")
mongo_client = pymongo.MongoClient(mongo_url)
db_name = mongo_url.rsplit("/", 1)[-1] or "demo_db"
db = mongo_client[db_name]
model_collection = db["models"]


def _json_safe(value):
    """Convert nested values to JSON-serializable primitives."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    if isinstance(value, (bytes, bytearray)):
        return bytes(value).decode("utf-8", errors="ignore")
    return value


def _normalize_dataset_texts(dataset_texts: List[str]) -> List[str]:
    cleaned: List[str] = []

    for item in dataset_texts or []:
        if item is None:
            continue
        if isinstance(item, (bytes, bytearray)):
            text = bytes(item).decode("utf-8", errors="ignore")
        else:
            text = str(item)
        text = text.strip()
        if text:
            cleaned.append(text)

    return cleaned


@celery_app.task(bind=True, name="fine_tune.gpt2_lora")
def fine_tune_gpt2_lora(self, user_id: str, dataset_texts: list, output_dir: str):
    """Fine-tune GPT-2 with LoRA on user-specific dataset."""
    try:
        logger.info("[FINE-TUNE] Starting GPT-2 LoRA fine-tuning for user %s", user_id)
        os.makedirs(output_dir, exist_ok=True)

        cleaned_texts = _normalize_dataset_texts(dataset_texts)
        if not cleaned_texts:
            raise ValueError("No valid training samples found in uploaded documents.")

        self.update_state(state="PROGRESS", meta={"message": "Preparing tokenizer and model"})
        tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        model = GPT2LMHeadModel.from_pretrained("gpt2")
        model.config.pad_token_id = tokenizer.pad_token_id

        self.update_state(state="PROGRESS", meta={"message": "Tokenizing training corpus"})
        dataset = Dataset.from_dict({"text": cleaned_texts})

        def tokenize_function(examples):
            tokenized = tokenizer(
                examples["text"],
                truncation=True,
                max_length=256,
                padding="max_length",
            )
            tokenized["labels"] = tokenized["input_ids"].copy()
            return tokenized

        tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=["text"])
        tokenized_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=["c_attn", "c_proj"],
        )
        model = get_peft_model(model, lora_config)

        use_cuda = torch.cuda.is_available()
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=1,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=1,
            learning_rate=3e-4,
            fp16=use_cuda,
            logging_steps=1,
            save_strategy="epoch",
            save_total_limit=1,
            report_to="none",
            dataloader_pin_memory=use_cuda,
            remove_unused_columns=False,
        )

        data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=data_collator,
        )

        self.update_state(state="PROGRESS", meta={"message": "Training in progress"})
        trainer.train()

        self.update_state(state="PROGRESS", meta={"message": "Saving adapter artifacts"})
        model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)

        artifact_files = sorted(
            p.name for p in Path(output_dir).iterdir() if p.is_file()
        )
        completed_at = int(time.time())
        metadata = {
            "user_id": user_id,
            "model_type": "gpt2-lora",
            "output_dir": output_dir,
            "trained_samples": len(cleaned_texts),
            "artifact_files": artifact_files,
            "completed_at": completed_at,
        }

        insert_doc = dict(metadata)
        insert_result = model_collection.insert_one(insert_doc)
        metadata["model_id"] = str(insert_result.inserted_id)
        logger.info("[FINE-TUNE] Completed GPT-2 LoRA fine-tuning for user %s", user_id)
        return _json_safe(metadata)

    except Exception as e:
        logger.exception("[FINE-TUNE] Error during fine-tuning for user %s: %s", user_id, e)
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise
