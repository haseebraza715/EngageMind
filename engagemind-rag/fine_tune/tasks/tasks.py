import logging
from celery import shared_task
from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer, TrainingArguments
from peft import LoraConfig, get_peft_model
from datasets import Dataset
import torch
import pymongo
from bson import Binary
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
db = mongo_client["demo_db"] 
model_collection = db["models"]

@shared_task(bind=True)
def fine_tune_gpt2_lora(self, user_id: str, dataset_texts: list, output_dir: str):
    """Fine-tune GPT-2 with LoRA on user-specific dataset."""
    try:
        logger.info(f"[FINE-TUNE] Starting GPT-2 LoRA fine-tuning for user {user_id}")

        tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        model = GPT2LMHeadModel.from_pretrained("gpt2")

        dataset = Dataset.from_dict({"text": dataset_texts})
        def tokenize_function(examples):
            return tokenizer(examples["text"], truncation=True, max_length=128, padding="max_length")
        tokenized_dataset = dataset.map(tokenize_function, batched=True)
        tokenized_dataset.set_format("torch", columns=["input_ids", "attention_mask"])

        # Configure LoRA
        lora_config = LoraConfig(
            r=16,  # Rank of LoRA matrices
            lora_alpha=32,  # Scaling factor
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=["c_attn", "c_proj"]  # Target attention and projection layers
        )
        model = get_peft_model(model, lora_config)

        # Define training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=4,
            gradient_accumulation_steps=2,
            learning_rate=3e-4,
            fp16=True,  # Mixed precision for GPU efficiency
            logging_steps=10,
            save_steps=100,
            save_total_limit=2,
            report_to="none",
        )

        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
        )

        # Update task state for progress
        self.update_state(state="PROGRESS", meta={"status": "Training started"})

        # Train the model
        trainer.train()

        # Save the fine-tuned model
        model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)

        # Store model metadata in MongoDB
        with open(os.path.join(output_dir, "adapter_model.bin"), "rb") as f:
            model_binary = Binary(f.read())
        model_collection.insert_one({
            "user_id": user_id,
            "model_type": "gpt2-lora",
            "output_dir": output_dir,
            "model_binary": model_binary,
            "timestamp": int(time.time())
        })

        logger.info(f"[FINE-TUNE] Completed GPT-2 LoRA fine-tuning for user {user_id}")
        return {"status": "success", "output_dir": output_dir}

    except Exception as e:
        logger.exception(f"[FINE-TUNE] Error during fine-tuning for user {user_id}: {e}")
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise