from datasets import load_dataset, Dataset
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
import pandas as pd
import json
import torch

'''
potential categories of prompts:
- creative writing
- closed QA
- open-ended QA
- summarization
- classification
- brainstorming

BERT trained on prompt taxonomy from databricks dolly
'''

# load jsonl file
def load_data(training_data):
    data = []
    with open("databricks-dolly.jsonl", "r") as f:
        for line in f:
            entry = json.loads(line)
            if "prompt" in entry and "response" in entry:
                data.append({
                    "prompt": entry["prompt"],
                    "response": entry["response"]
                })


df = pd.read_csv("prompt_taxonomy.csv")
label_list = df["tag"].unique().tolist()
label_to_id = {label: i for i, label in enumerate(label_list)}
df["label"] = df["tag"].map(label_to_id)

ds = load_dataset("10k_prompts_ranked", split="train")

# convert to Hugging Face Dataset
dataset = Dataset.from_pandas(df)

# tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
def preprocess(batch):
    return tokenizer(batch["prompt"], truncation=True, padding="max_length")

tokenized_dataset = dataset.map(preprocess, batched=True)
tokenized_dataset = tokenized_dataset.train_test_split(test_size=0.2)

# model
model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=len(label_list))

# trainer
training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
    tokenizer=tokenizer
)

trainer.train()
trainer.evaluate()
