import re

def clean_text(text: str) -> str:
    """
    Cleans and normalizes extracted document text.
    """
    text = re.sub(r'\(cid:127\)', '•', text)
    text = re.sub(r'\(cid:\d+\)', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

if __name__ == "__main__":
    sample = """
    (cid:127)  This is  a  test.

    With extra spaces.
    """

    print(clean_text(sample))
