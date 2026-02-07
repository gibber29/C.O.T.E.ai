import os
import json
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from dotenv import load_dotenv

load_dotenv(override=True)

# --- CONFIG ---
CHROMA_PATH = "./chroma_db"
LOCAL_EMBEDDINGS = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: print(f"⚠️ API Limit hit (Flashcards). Retrying in {retry_state.next_action.sleep} seconds...")
)
def generate_ai_response(messages):
    try:
        return llm.invoke(messages)
    except Exception as e:
        print(f"DEBUG: API call failed with error: {str(e)}")
        raise e

FLASHCARD_SYSTEM_PROMPT = """
You are an expert educational content creator. Your goal is to extract the main topics from a provided text and create concise, high-impact revision summaries for each topic.

Rules for your response:
1. **Comprehensive Extraction**: Identify **all distinct core topics, sections, or concepts** discussed in the provided text. Do not limit yourself to a fixed number; if the text covers 10 concepts, list all 10.
2. **Conciseness**: Each summary MUST be short and power-packed (max 120 words per topic).
3. **Format**: Return a JSON object with a list called "flashcards". Each item should have:
   - "topic": The name of the concept or section heading (In English).
   - "summary": The concise revision notes for that topic.
4. **Style**: Use bullet points and bold text for key terms within the summary.
5. **JSON ONLY**: Your entire response MUST be a valid JSON object. Do not include any markdown formatting like ```json ... ``` tags.
6. **Language Rule**: The summary must be written in the **Target Language** specified (English, Hindi, Telugu, or Hinglish).
   - If **Hindi** or **Telugu** is selected: Use **Native Scripture** (Devanagari/Telugu). Keep technical terms in English.
   - If **Hinglish** is selected: Use **English alphabets (Roman script)** for the entire summary. The sentences should use **Hindi for explanation and grammar**, but keep all **technical terms intact in English**.
     - **Example**: "Neural Network ek layered architecture hai jo data patterns ko identify karne mein help karta hai."
   - If **English** is selected: The entire summary must be in **English**.
   - Technical terms should never be translated.
"""

def generate_flashcards(session_id: str, language: str = "english"):
    """
    Generates topic-wise revision summaries from the ingested materials of a session.
    """
    cache_name = f"flashcards_v7_{language.lower()}.json"
    flashcard_cache_path = os.path.join("uploads", session_id, cache_name)
    
    # Check if already generated for this language
    if os.path.exists(flashcard_cache_path):
        try:
            with open(flashcard_cache_path, "r") as f:
                return json.load(f)["flashcards"]
        except Exception as e:
            print(f"⚠️ Error reading flashcard cache: {e}")

    # 1. Connect to DB
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=LOCAL_EMBEDDINGS,
        collection_name="hackathon_collection"
    )

    # 2. Retrieve all unique chunks for this session
    print(f"🔍 Retrieving material for {language} flashcards in session: {session_id}")
    results = db.get(
        where={"session_id": session_id},
        include=["documents"]
    )
    
    docs = results.get("documents", [])
    if not docs:
        print(f"⚠️ No documents found for session {session_id}")
        return []

    # Combine docs (Increase limit to cover more material)
    full_context = "\n\n".join(docs[:40]) 

    # 3. Generate with AI
    lang_instruction = f"Output language: {language}. Remember: technical terms in English, explanations in {language}."
    prompt = f"Extract topics and generate revision flashcards from this text:\n\n{full_context}\n\n{lang_instruction}"
    
    messages = [
        SystemMessage(content=FLASHCARD_SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ]

    print(f"🪄 Generating {language} flashcards via AI for session {session_id}...")
    response = generate_ai_response(messages)
    
    try:
        # Clean response if AI adds markdown
        clean_content = response.content.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_content)
        
        # Cache for future use
        os.makedirs(os.path.dirname(flashcard_cache_path), exist_ok=True)
        with open(flashcard_cache_path, "w") as f:
            json.dump(data, f)
            
        return data.get("flashcards", [])
    except Exception as e:
        print(f"❌ Failed to parse {language} flashcard JSON: {e}")
        print(f"RAW CONTENT: {response.content}")
        return []

if __name__ == "__main__":
    # Test logic
    # print(generate_flashcards("test_session"))
    pass
