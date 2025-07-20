import openai
import json
import time

'''
instead of pasting the classifier dataset through chat
this script will use a prompt rubric that evaluates points like clarity, context, constraints
of a prompt.
the resulting dataset will then be used to create a model
'''


def load_dataset(data):
    with open("databricks-dolly-15k.json", "r") as f:
        dataset = [json.loads(line) for line in f]

    scoring_categories = ["clarity", "context", "goal-oriented", "constrains"]
    return dataset, scoring_categories

def make_eval_prompt(prompt_text, prompt_type):
    return f"""
    You are a prompt quality evaluator. Use the rubric below to assign scores
    between 0 (very poor) and 1 (excellent) to the given prompt.

    Prompt type: {prompt_type}

    Rubric:
    1. Clarity: Is the prompt clear and unambiguous?
    2. Context: Does the prompt provide sufficient background for a good response?
    3. Goal-oriented: Does the prompt have a clear goal and is actionable?
    4. Constraints: Does the prompt specify any output constraints?

    Respond in this JSON format:
    {{
        "clarity": float,
        "context": float,
        "goal-oriented": float,
        "constraints": float
    }}

    Prompt:
    \"\"\"{prompt_text}\"\"\"
    """

# need to pick which model that handles long inputs
def get_scores(prompt, prompt_type):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a prompt quality scorer."},
                {"role": "user", "content": make_eval_prompt(prompt, prompt_type)}
            ],
            temperature=0.2
        )
        content = response["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as e:
        print("Error:", e)
        return None

def process_dataset(dataset):
    scored_dataset = []
    for i, item in enumerate(dataset):
        print(f"Processing item {i+1}/{len(dataset)}")
        scores = get_scores(item["prompt"], item["type"])
        if scores:
            item.update(scores)
            scored_dataset.append(item)
        time.sleep(1)  # to avoid hitting rate limits

if __name__ == "__main__":
    dataset = load_dataset("databricks-dolly-15k.json")


# okay still need to figure out how to get categories from existing dataset
# and feed it back as input to the prompt rubric
# and need to figure out if i want to switch prompts for each category
    