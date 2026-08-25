from src.similarity import calculate_similarity


resume = """
Python developer with experience in SQL,
Pandas and Machine Learning.
"""

job_description = """
Looking for a Python developer with experience
in SQL, Pandas, NumPy and Machine Learning.
"""


similarity = calculate_similarity(
    resume,
    job_description
)

similarity_percentage = similarity * 100

print("Similarity Score:", similarity_percentage, "%")