from src.skill_extractor import extract_skills, compare_skills


job_description = """
We are looking for a Python developer with
Python, SQL, Pandas, Django and React skills.
"""

resume_text = """
Experienced developer with Python, SQL,
Pandas and Django experience.
"""


required_skills = extract_skills(job_description)
candidate_skills = extract_skills(resume_text)

matched_skills, missing_skills, score = compare_skills(
    required_skills,
    candidate_skills
)

print("Required Skills:", required_skills)
print("Candidate Skills:", candidate_skills)
print("Matched Skills:", matched_skills)
print("Missing Skills:", missing_skills)
print("Skill Match Score:", score)