SKILLS = [
    "python",
    "java",
    "c++",
    "c#",
    "sql",
    "html",
    "css",
    "javascript",
    "react",
    "react.js",
    "node.js",
    "django",
    "flask",
    "machine learning",
    "deep learning",
    "tensorflow",
    "pytorch",
    "pandas",
    "numpy",
    "scikit-learn",
    "power bi",
    "excel",
    "aws",
    "git"
]


def extract_skills(text):
    text = text.lower()

    found_skills = []

    for skill in SKILLS:
        if skill in text:
            found_skills.append(skill)

    return found_skills

def compare_skills(required_skills, candidate_skills):
    required_set = set(required_skills)
    candidate_set = set(candidate_skills)

    matched_skills = required_set.intersection(candidate_set)
    missing_skills = required_set.difference(candidate_set)

    if len(required_set) > 0:
        skill_match_score = (len(matched_skills) / len(required_set)) * 100
    else:
        skill_match_score = 0

    return (
        sorted(matched_skills),
        sorted(missing_skills),
        skill_match_score
    )