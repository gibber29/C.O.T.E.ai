import streamlit as st
import os
import shutil
from ingestion_pipeline import ingest_directory
from retrieval_service import get_doubt_assistant_response
from flashcard_service import generate_flashcards
import assessment_service

st.set_page_config(page_title="C.O.T.E.ai - Study Assistant", page_icon="🎓")

st.title("🎓 C.O.T.E.ai - Study Assistant")
st.markdown("### Classroom of the Elite AI")

# Sidebar for session management
with st.sidebar:
    st.header("Settings")
    session_id = st.text_input("Session ID / Class Name", value="default_class")
    language = st.selectbox("Language", ["english", "hindi", "telugu"])
    
    st.divider()
    st.markdown("#### Upload Materials")
    uploaded_files = st.file_uploader("Upload PDFs", type="pdf", accept_multiple_files=True)
    
    if st.button("Process Documents"):
        if uploaded_files:
            upload_root = "uploads"
            session_dir = os.path.join(upload_root, session_id)
            os.makedirs(session_dir, exist_ok=True)
            
            for uploaded_file in uploaded_files:
                file_path = os.path.join(session_dir, uploaded_file.name)
                with open(file_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                    
            with st.spinner("Ingesting documents..."):
                ingest_directory(session_dir)
            st.success("Documents processed successfully!")
        else:
            st.warning("Please upload files first.")

# Tabs for different features
tab1, tab2, tab3 = st.tabs(["🤖 Doubt Assistant", "🃏 Flashcards", "📊 Progress"])

with tab1:
    st.header("Chat with your materials")
    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt := st.chat_input("Ask a doubt..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                response = get_doubt_assistant_response(prompt, session_id, language)
            st.markdown(response)
            st.session_state.messages.append({"role": "assistant", "content": response})

with tab2:
    st.header("Revision Flashcards")
    if st.button("Generate/Refresh Flashcards"):
        with st.spinner("Generating flashcards..."):
            cards = generate_flashcards(session_id, language)
            if cards:
                for card in cards:
                    with st.expander(f"📌 {card['topic']}"):
                        st.markdown(card['summary'])
            else:
                st.info("No materials found in this session. Please upload and process documents first.")

with tab3:
    st.header("Learning Progress")
    progress = assessment_service.get_progress(session_id)
    col1, col2 = st.columns(2)
    col1.metric("Current XP", f"{progress.get('xp', 0)} XP")
    col2.metric("Unlocked Level", f"Level {progress.get('unlocked_level', 1)}")
    
    if progress.get("mistakes"):
        st.subheader("Recent Mistakes")
        for mistake in progress["mistakes"]:
            st.info(f"**Q:** {mistake.get('question')}\n\n**A:** {mistake.get('correct_answer')}")
