from src.document_chunker import chunk_text
from src.embeddings import generate_embeddings
from src.vector_store import create_vector_store
from src.retriever import retrieve_similar_chunks
from src.prompts import (
    candidate_analysis_prompt,
    interview_questions_prompt
)
from src.llm_client import ask_llm


def generate_rag_analysis(resume_text, job_description, top_k=3):
    chunks = chunk_text(resume_text)

    chunk_embeddings = generate_embeddings(chunks)

    index = create_vector_store(chunk_embeddings)

    query_embedding = generate_embeddings([job_description])[0]

    retrieved_chunks = retrieve_similar_chunks(
        index,
        query_embedding,
        chunks,
        top_k=top_k
    )

    context = "\n\n".join(
        result["chunk"] for result in retrieved_chunks
    )

    prompt = candidate_analysis_prompt(
        context,
        job_description
    )

    return ask_llm(prompt)


def generate_interview_questions(resume_text, job_description, top_k=3):
    chunks = chunk_text(resume_text)

    if not chunks:
        return "Insufficient resume information to generate interview questions."

    chunk_embeddings = generate_embeddings(chunks)

    index = create_vector_store(chunk_embeddings)

    query_embedding = generate_embeddings([job_description])[0]

    retrieved_chunks = retrieve_similar_chunks(
        index,
        query_embedding,
        chunks,
        top_k=top_k
    )

    context = "\n\n".join(
        result["chunk"] for result in retrieved_chunks
    )

    prompt = interview_questions_prompt(
        context,
        job_description
    )

    return ask_llm(prompt)