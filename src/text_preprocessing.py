import re

def convert_to_lowercase(text):
    return text.lower()


def remove_extra_whitespace(text):
    return " ".join(text.split())


def remove_unnecessary_characters(text):
    text = re.sub(r"[^a-zA-Z0-9\s+#.-]", "", text)
    text = re.sub(r"#{2,}", "", text)
    return text

def preprocess_text(text):
    text = convert_to_lowercase(text)
    text = remove_unnecessary_characters(text)
    text = remove_extra_whitespace(text)
    
    return text