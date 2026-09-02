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