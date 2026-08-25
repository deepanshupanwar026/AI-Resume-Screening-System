import os

from src.resume_parser import extract_text_from_pdf
from src.text_preprocessing import preprocess_text
from src.skill_extractor import extract_skills, compare_skills
from src.similarity import calculate_similarity
from src.ranking import calculate_overall_score, get_recommendation, rank_candidates


RESUME_FOLDER = "data/sample_resumes"

job_description = """
Looking for a Python developer with experience in
Python, SQL, Pandas, NumPy, Machine Learning and Django.
"""


candidates = []


for filename in os.listdir(RESUME_FOLDER):

    if filename.endswith(".pdf") and filename.startswith("candidate"):

        pdf_path = os.path.join(RESUME_FOLDER, filename)

        # 1. Extract resume text
        resume_text = extract_text_from_pdf(pdf_path)

        # 2. Preprocess text
        clean_resume = preprocess_text(resume_text)
        clean_job_description = preprocess_text(job_description)

        # 3. Extract skills
        candidate_skills = extract_skills(clean_resume)
        required_skills = extract_skills(clean_job_description)

        # 4. Compare skills
        matched_skills, missing_skills, skill_match_score = compare_skills(
            required_skills,
            candidate_skills
        )

        # 5. Calculate similarity
        similarity = calculate_similarity(
            clean_resume,
            clean_job_description
        )

        similarity_score = similarity * 100

        # 6. Calculate overall score
        overall_score = calculate_overall_score(
            similarity_score,
            skill_match_score
        )

        # 7. Recommendation
        recommendation = get_recommendation(overall_score)

        # 8. Store candidate result
        candidates.append({
            "candidate_name": filename.replace(".pdf", ""),
            "candidate_skills": candidate_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "similarity_score": similarity_score,
            "skill_match_score": skill_match_score,
            "overall_score": overall_score,
            "recommendation": recommendation
        })


# Rank candidates
ranked_candidates = rank_candidates(candidates)


print("\n===== CANDIDATE RANKING =====")

for rank, candidate in enumerate(ranked_candidates, start=1):

    print(f"\nRank: {rank}")
    print("Candidate:", candidate["candidate_name"])
    print("Similarity Score:", round(candidate["similarity_score"], 2), "%")
    print("Skill Match Score:", round(candidate["skill_match_score"], 2), "%")
    print("Overall Score:", round(candidate["overall_score"], 2), "%")
    print("Matched Skills:", candidate["matched_skills"])
    print("Missing Skills:", candidate["missing_skills"])
    print("Recommendation:", candidate["recommendation"])