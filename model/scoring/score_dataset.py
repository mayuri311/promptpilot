import json
import time

'''
instead of pasting the classifier dataset through chat
this script will use a prompt rubric that evaluates points like clarity, context, constraints
of a prompt.
the resulting dataset will then be used to create a model
'''

with open("databricks-dolly-15k.json", "r") as f:
    data = [json.loads(line) for line in f]

scoring_categories = ["clarity", "context", "goal-orientie"]