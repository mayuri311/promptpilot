import random
import numpy as np
from datasets import load_dataset, Dataset
from transformers import DebertaV2TokenizerFast, DebertaV2ForSequenceClassification, Trainer, TrainingArguments, set_seed
from sklearn.metrics import accuracy_score, f1_score
import pandas as pd
import json
import argparse
import torch
import torch.nn.functional as F

'''
potential categories of prompts:
- creative writing
- closed QA
- open-ended QA
- summarization
- classification
- brainstorming

BERT trained on prompt taxonomy from databricks dolly.
input representation for single string input: "INSTRUCTION: <instruction> CATEGORY: <category>"

need to make a config.json for data_file, model_name, num_epochs, batch_size, output_dir

things i could add:
- reccomended datasources the user can get context for the llm
'''

SEED = 42
set_seed(SEED)
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


# load jsonl file
def load_data(training_data):
    print("loading dataset")
    data = []
    with open(training_data, "r") as f:
        for line in f:
            item = json.loads(line)
            instruction = item["instruction"]
            category = item["category"]
            data.append({"text": instruction, "label": category})

    # convert data to pd df and encode labels
    df = pd.DataFrame(data)
    label_list = df["label"].unique().tolist()
    label_to_id = {label: i for i, label in enumerate(label_list)}
    with open("./debert_prompt_taxonomy/label_to_id.json", "w") as f:
            json.dump(label_to_id, f)
    df["labels"] = df["label"].map(label_to_id)

    # convert to hugging face dataset
    dataset = Dataset.from_pandas(df[["text", "labels"]])
    dataset = dataset.train_test_split(test_size=0.2)

    return dataset, label_list


def load_setup_training(dataset, label_list, model_name):    
    tokenizer = DebertaV2TokenizerFast.from_pretrained(model_name)

    def tokenize_func(example):
        return tokenizer(example["text"], truncation=True, padding="max_length", max_length=512)

    print("tokenizing dataset")
    tokenized_dataset = dataset.map(tokenize_func, batched=True)
    tokenized_dataset = tokenized_dataset.remove_columns(["text"])  # only keep token ids + labels
    tokenized_dataset.set_format("torch")

    model = DebertaV2ForSequenceClassification.from_pretrained(model_name, num_labels=len(label_list))

    # trainer
    training_args = TrainingArguments(
        output_dir="./debert_prompt_taxonomy",
        eval_strategy="epoch",
        save_strategy="epoch",
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=6,
        weight_decay=0.05,
        learning_rate=1e-5,
        logging_dir="./debert_prompt_taxonomy/logs",
        logging_steps=10,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        save_total_limit=2,
        seed=SEED
    )
    print("training args set")

    return model, tokenizer, tokenized_dataset, training_args

# inference
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = logits.argmax(axis=1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds, average="weighted")
    }

def classify_prompt(prompt_text, model, tokenizer):
    with open("./debert_prompt_taxonomy/label_to_id.json") as f:
        label_to_id = json.load(f)
    id_to_label = {v: k for k, v in label_to_id.items()}
    inputs = tokenizer(prompt_text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = F.softmax(logits, dim=1)
        predicted_class_id = logits.argmax().item()
        confidence = probs[0, predicted_class_id].item()
    return id_to_label[predicted_class_id], confidence

if __name__ == "__main__":
    # check terminal flag if training or loading model
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", action="store_true", help="Train the model from scratch")
    args = parser.parse_args()

    dataset, label_list = load_data("databricks-dolly-15k.jsonl")
    model_name = "microsoft/deberta-v3-base"

    if args.train:
        model, tokenizer, tokenized_dataset, training_args = load_setup_training(dataset, label_list, model_name)
        print("intiializing trainer")
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset["train"],
            eval_dataset=tokenized_dataset["test"],
            tokenizer=tokenizer,
            compute_metrics = compute_metrics
        )
    
        print("begin training")
        trainer.train()
        print("training complete")
        trainer.save_model("./debert_prompt_taxonomy")
        print("\n✅ Model saved to: ./debert_prompt_taxonomy")
    else:
        print("Loading trained model")
        tokenizer = DebertaV2TokenizerFast.from_pretrained(model_name)
        model = DebertaV2ForSequenceClassification.from_pretrained("./debert_prompt_taxonomy")
        model.eval()

        # cli prompt classification evaluation loop
        while True:
            prompt = input("Type a prompt to classify (or 'exit'): ")
            if prompt.lower() == "exit":
                break
            pred, confidence = classify_prompt(prompt, model, tokenizer)
            print(f"📌 Predicted Prompt Tag: {pred} ({confidence * 100:.2f}% confidence)")