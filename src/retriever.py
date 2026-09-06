import numpy as np


def retrieve_similar_chunks(index, query_embedding, chunks, top_k=3):
    query_embedding = np.array([query_embedding]).astype("float32")

    distances, indices = index.search(query_embedding, top_k)

    results = []

    for distance, index_position in zip(distances[0], indices[0]):
        if index_position != -1 and index_position < len(chunks):
            results.append({
                "chunk": chunks[index_position],
                "distance": float(distance)
            })

    return results
