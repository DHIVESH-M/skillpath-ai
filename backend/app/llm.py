import os, json, re
from dotenv import load_dotenv
load_dotenv()
_client = None
def _get():
    global _client
    if _client is None and os.getenv("GEMINI_API_KEY"):
        from google import genai
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client

def ask_json(prompt: str, fallback):
    """Ask Gemini for JSON. Returns (data, used_ai). Falls back deterministically on any failure."""
    c = _get()
    if not c: return fallback, False
    try:
        r = c.models.generate_content(model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"), contents=prompt,
                                      config={"response_mime_type": "application/json"})
        return json.loads(re.sub(r"^```json|```$", "", r.text.strip())), True
    except Exception as e:
        print("Gemini error:", e)
        return fallback, False
