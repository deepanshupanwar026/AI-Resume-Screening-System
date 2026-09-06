def candidate_analysis_prompt(resume_text, job_description):
    return f"""
You are an AI assistant helping a recruiter analyze a candidate for a job.

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{resume_text}

Analyze the candidate using ONLY the information provided above.

Provide:
1. Candidate summary
2. Matching skills
3. Missing or weak skills
4. Relevant experience
5. Overall suitability
6. Short explanation for the recruiter

IMPORTANT RULES:
- Do not invent skills, experience, education, projects, or qualifications.
- Do not assume information that is not present.
- If evidence is insufficient, clearly say "Insufficient evidence".
- Keep the analysis professional and concise.
"""


# =========================================
# INTERVIEW QUESTION GENERATION
# =========================================

def interview_questions_prompt(resume_context, job_description):
    return f"""
You are an AI assistant helping a recruiter prepare interview questions
for a candidate.

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME CONTEXT:
{resume_context}

Generate interview questions that are specifically relevant to this
candidate and this job.

Provide:
1. Technical questions based on the required skills.
2. Project-based questions based on the candidate's resume.
3. Questions about relevant experience mentioned in the resume.
4. Questions targeting important skills from the job description.
5. Questions about missing or weak required skills when appropriate.

IMPORTANT RULES:
- Generate questions only from the information provided above.
- Do not assume the candidate has experience that is not mentioned.
- Do not invent projects, skills, technologies, or experience.
- Keep the questions relevant to the job description.
- Avoid generic questions when a candidate-specific question can be generated.
- Generate 8 to 10 questions.
"""