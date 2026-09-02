def chunk_text(text, chunk_size=500, overlap=100):
    chunks = []

    if len(text) <= chunk_size:
        return [text.strip()] if text.strip() else []

    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        if chunk.strip():
            chunks.append(chunk.strip())

        if end >= len(text):
            break

        start += chunk_size - overlap

    return chunks