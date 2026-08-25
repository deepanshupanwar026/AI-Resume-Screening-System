// =========================================================
// CANDIDATES PAGE
// =========================================================

const jobSelector =
    document.getElementById(
        "jobSelector"
    );

const candidatesContainer =
    document.getElementById(
        "candidatesContainer"
    );

const selectedJob =
    document.getElementById(
        "selectedJob"
    );

const selectedJobTitle =
    document.getElementById(
        "selectedJobTitle"
    );

const selectedJobDescription =
    document.getElementById(
        "selectedJobDescription"
    );


// =========================================================
// GET JOB FROM URL
// =========================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const urlJobId =
    urlParams.get(
        "job_id"
    );


// =========================================================
// LOAD RECRUITER
// =========================================================

async function loadRecruiter() {

    try {

        const response =
            await fetch("/me");

        const data =
            await response.json();


        if (!data.authenticated) {

            window.location.href =
                "/login.html";

            return false;
        }


        const recruiter =
            data.recruiter;


        document.getElementById(
            "navRecruiterName"
        ).textContent =
            recruiter.name || "Recruiter";


        document.getElementById(
            "navCompanyName"
        ).textContent =
            recruiter.company_name ||
            "Company";


        if (recruiter.profile_photo) {

            document.getElementById(
                "navProfilePhoto"
            ).src =
                recruiter.profile_photo;

        }


        return true;

    }

    catch (error) {

        console.error(
            error
        );

        return false;

    }

}


// =========================================================
// LOAD JOBS
// =========================================================

async function loadJobs() {

    try {

        const response =
            await fetch("/jobs");


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
                "Unable to load jobs."
            );

        }


        const jobs =
            data.jobs || [];


        jobSelector.innerHTML = "";


        if (!jobs.length) {

            jobSelector.innerHTML = `

                <option value="">
                    No jobs available
                </option>

            `;


            candidatesContainer.innerHTML = `

                <div class="empty-state">

                    <h2>
                        No jobs available
                    </h2>

                    <p>
                        Create a job first
                        to screen candidates.
                    </p>

                </div>

            `;

            return;

        }


        jobs.forEach(
            function(job) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    job.id;


                option.textContent =
                    `${job.title} (${job.candidate_count || 0} candidates)`;


                jobSelector.appendChild(
                    option
                );

            }
        );


        // -----------------------------------------------------
        // USE JOB FROM URL IF AVAILABLE
        // -----------------------------------------------------

        if (
            urlJobId &&
            jobs.some(
                job =>
                    String(job.id) ===
                    String(urlJobId)
            )
        ) {

            jobSelector.value =
                urlJobId;

        }


        await loadCandidates(
            jobSelector.value
        );

    }

    catch (error) {

        console.error(
            "Jobs loading error:",
            error
        );


        candidatesContainer.innerHTML = `

            <div class="empty-state">

                <h2>
                    Unable to load jobs
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


// =========================================================
// JOB SELECTOR
// =========================================================

jobSelector.addEventListener(
    "change",
    function() {

        const jobId =
            this.value;


        if (jobId) {

            window.history.replaceState(
                {},
                "",
                `/candidates.html?job_id=${encodeURIComponent(jobId)}`
            );


            loadCandidates(
                jobId
            );

        }

    }
);


// =========================================================
// LOAD CANDIDATES FOR SELECTED JOB
// =========================================================

async function loadCandidates(
    jobId
) {

    if (!jobId) {
        return;
    }


    candidatesContainer.innerHTML = `

        <div class="loading">
            Loading candidates...
        </div>

    `;


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
                "Unable to load candidates."
            );

        }


        selectedJob.style.display =
            "block";


        selectedJobTitle.textContent =
            data.job.title;


        selectedJobDescription.textContent =
            `${data.candidates.length} candidate(s) screened for this job.`;


        displayCandidates(
            data.candidates || []
        );

    }

    catch (error) {

        console.error(
            "Candidates error:",
            error
        );


        candidatesContainer.innerHTML = `

            <div class="empty-state">

                <h2>
                    Unable to load candidates
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


// =========================================================
// DISPLAY CANDIDATES
// =========================================================

function displayCandidates(
    candidates
) {

    if (!candidates.length) {

        candidatesContainer.innerHTML = `

            <div class="empty-state">

                <div style="font-size:42px;">
                    👤
                </div>

                <h2>
                    No candidates yet
                </h2>

                <p>
                    No resumes have been screened
                    for this job yet.
                </p>

            </div>

        `;

        return;

    }


    candidatesContainer.innerHTML =
        "";


    candidates.forEach(
        function(candidate) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "candidate-card";


            const recommendation =
                candidate.recommendation ||
                "Low Match";


            const recommendationClass =
                recommendation ===
                "Recommended"

                    ? "recommended"

                    : recommendation ===
                      "Consider"

                        ? "consider"

                        : "low-match";


            const matchedSkills =
                candidate.matched_skills ||
                [];


            const missingSkills =
                candidate.missing_skills ||
                [];


            card.innerHTML = `

                <div class="candidate-top">

                    <div>

                        <h3 class="candidate-name">

                            ${escapeHTML(
                                candidate.resume_filename ||
                                candidate.candidate ||
                                "Candidate"
                            )}

                        </h3>

                        <div class="candidate-rank">

                            Rank #${candidate.rank || "—"}

                        </div>

                    </div>


                    <span
                        class="recommendation ${recommendationClass}"
                    >

                        ${escapeHTML(
                            recommendation
                        )}

                    </span>

                </div>


                <div class="scores">

                    <div class="score">

                        <span>
                            Overall Score
                        </span>

                        <strong>
                            ${formatScore(
                                candidate.overall_score
                            )}%
                        </strong>

                    </div>


                    <div class="score">

                        <span>
                            Skill Match
                        </span>

                        <strong>
                            ${formatScore(
                                candidate.skill_match_score
                            )}%
                        </strong>

                    </div>


                    <div class="score">

                        <span>
                            Similarity
                        </span>

                        <strong>
                            ${formatScore(
                                candidate.similarity_score
                            )}%
                        </strong>

                    </div>

                </div>


                <div class="skills-title">
                    MATCHED SKILLS
                </div>


                <div class="skill-list">

                    ${
                        matchedSkills.length

                        ? matchedSkills
                            .map(
                                skill => `
                                    <span class="skill">
                                        ${escapeHTML(
                                            skill
                                        )}
                                    </span>
                                `
                            )
                            .join("")

                        : `
                            <span>
                                No matched skills
                            </span>
                        `
                    }

                </div>


                <div class="skills-title">
                    MISSING SKILLS
                </div>


                <div class="skill-list">

                    ${
                        missingSkills.length

                        ? missingSkills
                            .map(
                                skill => `
                                    <span
                                        class="skill missing"
                                    >
                                        ${escapeHTML(
                                            skill
                                        )}
                                    </span>
                                `
                            )
                            .join("")

                        : `
                            <span>
                                No missing skills
                            </span>
                        `
                    }

                </div>


                <div class="candidate-actions">

                    ${
                        candidate.resume_url

                        ? `
                            <a
                                class="candidate-button"
                                href="${candidate.resume_url}"
                                target="_blank"
                            >
                                View Resume →
                            </a>
                        `

                        : ""
                    }

                </div>

            `;


            candidatesContainer.appendChild(
                card
            );

        }
    );

}


// =========================================================
// SCORE
// =========================================================

function formatScore(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "0.00";

    }


    return number.toFixed(2);

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
// START
// =========================================================

(async function() {

    const authenticated =
        await loadRecruiter();


    if (!authenticated) {
        return;
    }


    await loadJobs();

})();