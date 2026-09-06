// =========================================================
// GET JOB ID FROM URL
// =========================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const jobId =
    urlParams.get(
        "job_id"
    );


// =========================================================
// ELEMENTS
// =========================================================

const jobTitle =
    document.getElementById(
        "jobTitle"
    );


const jobDescription =
    document.getElementById(
        "jobDescription"
    );


const resumeFiles =
    document.getElementById(
        "resumeFiles"
    );
const fileCount =
    document.getElementById("fileCount");

resumeFiles.addEventListener("change", function () {

    const count = resumeFiles.files.length;

    fileCount.textContent =
        count === 0
            ? "No resumes selected"
            : `✓ ${count} resume${count > 1 ? "s" : ""} selected`;

});

const screenButton =
    document.getElementById(
        "screenButton"
    );


const resultsContainer =
    document.getElementById(
        "results"
    );


// =========================================================
// CHECK JOB ID
// =========================================================

if (!jobId) {

    jobTitle.textContent =
        "No Job Selected";

    jobDescription.textContent =
        "Please select a job from your dashboard.";

    screenButton.disabled = true;

}


// =========================================================
// LOAD JOB
// =========================================================

async function loadJob() {

    if (!jobId) {
        return;
    }


    try {

        const response =
            await fetch(
                `/jobs/${jobId}/candidates`
            );


        const data =
            await response.json();


        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load job."
            );

        }


        jobTitle.textContent =
            data.job.title;


        jobDescription.textContent =
            data.job.description;


    }

    catch (error) {

        console.error(
            error
        );

        jobTitle.textContent =
            "Unable to load job";

        jobDescription.textContent =
            error.message;

    }

}


// =========================================================
// SCREEN RESUMES
// =========================================================

screenButton.addEventListener(
    "click",
    async function() {

        const files =
            resumeFiles.files;


        if (!files.length) {

            alert(
                "Please upload at least one PDF resume."
            );

            return;

        }


        // -----------------------------------------
        // CREATE FORM DATA
        // -----------------------------------------

        const formData =
            new FormData();


        formData.append(
            "job_id",
            jobId
        );


        // -----------------------------------------
        // ADD RESUMES
        // -----------------------------------------

        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            formData.append(
                "resumes",
                files[i]
            );

        }


        // -----------------------------------------
        // BUTTON
        // -----------------------------------------

        screenButton.disabled =
            true;

        screenButton.textContent =
            "Screening Resumes...";


        resultsContainer.innerHTML = `

            <div class="loading">

                <h3>
                    AI is screening candidates...
                </h3>

                <p>
                    Extracting skills and calculating
                    similarity scores.
                </p>

            </div>

        `;


        try {

            // -------------------------------------
            // SEND TO FLASK
            // -------------------------------------

            const response =
                await fetch(
                    "/screen",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (response.status === 401) {

                window.location.href =
                    "/login.html";

                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Screening failed."
                );

            }

            // -------------------------------------
            // DISPLAY RESULTS
            // -------------------------------------

            displayResults(
                data.results
            );


        }

        catch (error) {

            console.error(
                error
            );


            resultsContainer.innerHTML = `

                <div class="error-message">

                    <h3>
                        Screening failed
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }


        finally {

            screenButton.disabled =
                false;

            screenButton.textContent =
                "Screen Resumes";

        }

    }
);
function formatAIAnalysis(text) {

    if (!text) {
        return "<p>AI analysis not available.</p>";
    }

    let safeText = escapeHTML(text);

    safeText = safeText
        .replace(
            /^### (.*)$/gm,
            "<h5>$1</h5>"
        )

        .replace(
            /^\* (.*)$/gm,
            "<li>$1</li>"
        )

        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )

        .replace(
            /(<li>.*<\/li>)/gs,
            "<ul>$1</ul>"
        )

        .replace(
            /\n/g,
            "<br>"
        );

    return safeText;
}


// =========================================================
// DISPLAY RESULTS
// =========================================================

// =========================================================
// DISPLAY BEAUTIFUL RESULTS
// =========================================================

function displayResults(results) {

    console.log(
        "FULL RESULTS:",
        results
    );

    console.log(
        "FIRST CANDIDATE:",
        JSON.stringify(results[0], null, 2)
    );

    resultsContainer.innerHTML = "";


    // -------------------------------------------------------
    // NO RESULTS
    // -------------------------------------------------------

    if (!results || !results.length) {

        resultsContainer.innerHTML = `

            <div class="empty-results">

                <div class="empty-icon">
                    ✨
                </div>

                <h3>
                    No candidates found
                </h3>

                <p>
                    Upload candidate resumes to begin screening.
                </p>

            </div>

        `;

        return;
    }


    // -------------------------------------------------------
    // RESULTS HEADER
    // -------------------------------------------------------

    const resultsHeader =
        document.createElement("div");

    resultsHeader.className =
        "results-header";


    resultsHeader.innerHTML = `

        <div>

            <span class="results-label">
                AI ANALYSIS
            </span>

            <h2>
                Candidate Results
            </h2>

            <p>
                Candidates ranked according to their
                compatibility with this job.
            </p>

        </div>


    `;


    resultsContainer.appendChild(
        resultsHeader
    );


    // -------------------------------------------------------
    // CREATE CANDIDATE CARDS
    // -------------------------------------------------------

    results.forEach(
        function(candidate, index) {

            const card =
                document.createElement("div");


            card.className =
                "candidate-card";


            // -----------------------------------------------
            // SCORES
            // -----------------------------------------------

            const similarity =
                Number(
                    candidate.similarity_score || 0
                );


            const skillMatch =
                Number(
                    candidate.skill_match_score || 0
                );


            const overall =
                Number(
                    candidate.overall_score || 0
                );


            // -----------------------------------------------
            // RECOMMENDATION
            // -----------------------------------------------

            let recommendation =
                candidate.recommendation ||
                "Low Match";


            let badgeClass =
                "badge-low";


            if (
                recommendation ===
                "Recommended"
            ) {

                badgeClass =
                    "badge-recommended";

            }

            else if (
                recommendation ===
                "Consider"
            ) {

                badgeClass =
                    "badge-consider";

            }


            // -----------------------------------------------
            // CANDIDATE NAME
            // -----------------------------------------------

            const candidateName =
                candidate.candidate ||
                "Candidate";


            const avatarLetter =
                candidateName
                    .replace(".pdf", "")
                    .charAt(0)
                    .toUpperCase();


            // -----------------------------------------------
            // MATCHED SKILLS
            // -----------------------------------------------

            const matchedSkills =
                Array.isArray(
                    candidate.matched_skills
                )
                    ? candidate.matched_skills
                    : [];


            const matchedSkillsHTML =
                matchedSkills.length

                    ?

                    matchedSkills
                        .map(
                            function(skill) {

                                return `

                                    <span
                                        class="
                                            skill-chip
                                            matched-chip
                                        "
                                    >
                                        ✓
                                        ${escapeHTML(skill)}
                                    </span>

                                `;

                            }
                        )
                        .join("")

                    :

                    `
                        <span class="no-skills">
                            No matching skills
                        </span>
                    `;


            // -----------------------------------------------
            // MISSING SKILLS
            // -----------------------------------------------

            const missingSkills =
                Array.isArray(
                    candidate.missing_skills
                )
                    ? candidate.missing_skills
                    : [];


            const missingSkillsHTML =
                missingSkills.length

                    ?

                    missingSkills
                        .map(
                            function(skill) {

                                return `

                                    <span
                                        class="
                                            skill-chip
                                            missing-chip
                                        "
                                    >
                                        +
                                        ${escapeHTML(skill)}
                                    </span>

                                `;

                            }
                        )
                        .join("")

                    :

                    `
                        <span class="no-skills">
                            No missing skills
                        </span>
                    `;


            // -----------------------------------------------
            // CARD HTML
            // -----------------------------------------------

            card.innerHTML = `

                <!-- =========================================
                     CANDIDATE HEADER
                ========================================== -->

                <div class="candidate-header">


                    <div class="candidate-identity">


                        <div class="candidate-avatar">

                            ${escapeHTML(
                                avatarLetter
                            )}

                        </div>


                        <div>
                                <span class="candidate-rank">
                                    Rank #${candidate.rank || index + 1}
                                </span>


                            <h3>

                                ${escapeHTML(
                                    candidateName
                                )}

                            </h3>


                            <p class="candidate-subtitle">

                                AI resume analysis completed

                            </p>

                        </div>

                    </div>


                    <div
                        class="
                            recommendation-badge
                            ${badgeClass}
                        "
                    >

                        ${escapeHTML(
                            recommendation
                        )}

                    </div>

                </div>


                <!-- =========================================
                     SCORE CARDS
                ========================================== -->

                <div class="candidate-score-grid">


                    <!-- OVERALL -->

                    <div class="
                        candidate-score
                        overall-score-card
                    ">

                        <div class="score-icon">
                            ★
                        </div>


                        <div class="score-content">

                            <span>
                                Overall Score
                            </span>


                            <strong>
                                ${overall.toFixed(2)}%
                            </strong>

                        </div>


                        <div class="score-progress">

                            <div
                                class="score-progress-bar"
                                style="
                                    width:
                                    ${Math.min(
                                        Math.max(
                                            overall,
                                            0
                                        ),
                                        100
                                    )}%;
                                "
                            ></div>

                        </div>

                    </div>


                    <!-- SIMILARITY -->

                    <div class="candidate-score">

                        <div class="score-icon">
                            ◈
                        </div>


                        <div class="score-content">

                            <span>
                                Resume Similarity
                            </span>


                            <strong>
                                ${similarity.toFixed(2)}%
                            </strong>

                        </div>


                        <div class="score-progress">

                            <div
                                class="score-progress-bar"
                                style="
                                    width:
                                    ${Math.min(
                                        Math.max(
                                            similarity,
                                            0
                                        ),
                                        100
                                    )}%;
                                "
                            ></div>

                        </div>

                    </div>


                    <!-- SKILL MATCH -->

                    <div class="candidate-score">

                        <div class="score-icon">
                            ✓
                        </div>


                        <div class="score-content">

                            <span>
                                Skill Match
                            </span>


                            <strong>
                                ${skillMatch.toFixed(2)}%
                            </strong>

                        </div>


                        <div class="score-progress">

                            <div
                                class="score-progress-bar"
                                style="
                                    width:
                                    ${Math.min(
                                        Math.max(
                                            skillMatch,
                                            0
                                        ),
                                        100
                                    )}%;
                                "
                            ></div>

                        </div>

                    </div>

                </div>


                <!-- =========================================
                     SKILLS
                ========================================== -->

                <div class="skills-grid">


                    <!-- MATCHED -->

                    <div class="
                        skills-section
                        matched-section
                    ">

                        <div class="
                            skills-section-header
                        ">

                            <div class="
                                skills-section-icon
                                matched-icon
                            ">
                                ✓
                            </div>


                            <div>

                                <h4>
                                    Matched Skills
                                </h4>

                                <span>
                                    Skills found in resume
                                </span>

                            </div>

                        </div>


                        <div class="skills-list">

                            ${matchedSkillsHTML}

                        </div>

                    </div>


                    <!-- MISSING -->

                    <div class="
                        skills-section
                        missing-section
                    ">

                        <div class="
                            skills-section-header
                        ">

                            <div class="
                                skills-section-icon
                                missing-icon
                            ">
                                !
                            </div>


                            <div>

                                <h4>
                                    Missing Skills
                                </h4>

                                <span>
                                    Skills to consider
                                </span>

                            </div>

                        </div>


                        <div class="skills-list">

                            ${missingSkillsHTML}

                        </div>

                    </div>

                </div>
                 <!-- =========================================
                     AI ANALYSIS
                ========================================== -->

                <div class="ai-analysis-section">

                    <div class="ai-analysis-header">
                        <h4> AI Analysis</h4>
                    </div>

                    <div class="ai-analysis-content">
                       ${formatAIAnalysis(candidate.ai_analysis)}
                    </div>

                </div>
    <!-- =========================================
     INTERVIEW QUESTIONS
========================================== -->

<div class="interview-questions-section">

    <div class="interview-questions-header">
        <div>
            <h4> Interview Preparation</h4>
            <span>Generate questions based on this candidate</span>
        </div>

<button
    type="button"
    class="generate-questions-btn"
    onclick="generateInterviewQuestions(${candidate.id}, this)"
>
    <span class="button-label">
        Generate Interview Questions
    </span>
</button>
    </div>

    <div
        class="interview-questions-content"
        id="interview-questions-${candidate.id}"
    >
        <p class="interview-placeholder">
            Click the button to generate personalized interview questions.
        </p>
    </div>

</div>
                <!-- =========================================
                     FOOTER
                ========================================== -->

                <div class="candidate-footer">

                    <span>
                        AI-powered candidate screening
                    </span>


                    <span>

                        ${
                            overall >= 70
                                ? "Strong Match"
                                : overall >= 40
                                    ? "Review Recommended"
                                    : "Needs Further Review"
                        }

                    </span>

                </div>

            `;


            resultsContainer.appendChild(
                card
            );

        }
    );

}
// =========================================================
// GENERATE INTERVIEW QUESTIONS
// =========================================================

async function generateInterviewQuestions(
    candidateId,
    button
) {

    console.log(
        "Generating interview questions for candidate:",
        candidateId
    );

    const questionsContainer =
        document.getElementById(
            `interview-questions-${candidateId}`
        );

    if (!questionsContainer) {
        console.error(
            "Interview questions container not found."
        );
        return;
    }

    button.disabled = true;
    button.textContent = "Generating Questions...";

    questionsContainer.innerHTML = `
        <div class="interview-loading">
            <p>
                🤖 Gemini is preparing personalized interview questions...
            </p>
        </div>
    `;

    try {

        const response = await fetch(
            `/candidates/${candidateId}/interview-questions`,
            {
                method: "POST"
            }
        );

        const responseText =
            await response.text();

        let data;

        try {

            data = JSON.parse(responseText);

        } catch (parseError) {

            console.error(
                "Server returned non-JSON response:",
                responseText
            );

            throw new Error(
                `Server returned ${response.status} instead of JSON.`
            );
        }

        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to generate interview questions."
            );
        }

        questionsContainer.innerHTML =
            formatInterviewQuestions(
                data.questions
            );

        button.textContent =
            "Regenerate Questions";

    } catch (error) {

        console.error(
            "Interview question generation failed:",
            error
        );

        questionsContainer.innerHTML = `
            <div class="error-message">
                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;

        button.textContent =
            "Generate Interview Questions";

    } finally {

        button.disabled = false;

    }
}


// =========================================================
// FORMAT INTERVIEW QUESTIONS
// =========================================================

function formatInterviewQuestions(text) {

    if (!text) {

        return `
            <p>
                No interview questions were generated.
            </p>
        `;

    }

    const safeText =
        escapeHTML(text);

    const lines =
        safeText.split("\n");

    let html = "";

    let questionNumber = 0;

    lines.forEach(function(line) {

        const trimmed =
            line.trim();

        if (!trimmed) {
            return;
        }

        // Section headings
        if (
            trimmed.startsWith("**") &&
            trimmed.endsWith("**")
        ) {

            const heading =
                trimmed.replace(
                    /\*\*/g,
                    ""
                );

            html += `
                <h5>
                    ${heading}
                </h5>
            `;

            return;
        }

        // Numbered questions
        const questionMatch =
            trimmed.match(
                /^\d+\.\s*(.*)$/
            );

        if (questionMatch) {

            questionNumber++;

            html += `
                <div class="interview-question">

                    <span class="question-number">
                        ${questionNumber}
                    </span>

                    <span class="question-text">
                        ${questionMatch[1]}
                    </span>

                </div>
            `;

            return;
        }

        // Other text
        html += `
            <p>
                ${trimmed}
            </p>
        `;

    });

    return html;
}

// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// LOAD
// =========================================================

loadJob();

// =========================================================
// LOAD RECRUITER PROFILE
// =========================================================

async function loadRecruiterProfile() {

    try {

        const response = await fetch("/me");

        const data = await response.json();

        if (!data.authenticated) {
            return;
        }

        const recruiter = data.recruiter;

        const avatar =
            document.getElementById("navProfileAvatar");

        const name =
            document.getElementById("navProfileName");

        const company =
            document.getElementById("navCompanyName");


        if (name) {
            name.textContent =
                recruiter.name || "Recruiter";
        }

        if (company) {
            company.textContent =
                recruiter.company_name || "Company";
        }


        if (
            avatar &&
            recruiter.profile_photo
        ) {

            avatar.innerHTML = `
                <img
                    src="${recruiter.profile_photo}?v=${Date.now()}"
                    alt="Profile"
                >
            `;

            avatar.classList.add("has-photo");
        }

    }

    catch (error) {

        console.error(
            "Unable to load recruiter profile:",
            error
        );

    }
}


loadRecruiterProfile();