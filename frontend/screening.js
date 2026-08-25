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


// =========================================================
// DISPLAY RESULTS
// =========================================================

// =========================================================
// DISPLAY BEAUTIFUL RESULTS
// =========================================================

function displayResults(results) {

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


        <div class="results-count">
            ${results.length}
            Candidate${results.length === 1 ? "" : "s"}
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

                            <div class="candidate-rank">

                                RANK #
                                ${candidate.rank || index + 1}

                            </div>


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
