// =========================================================
// MY JOBS
// =========================================================

const jobsContainer =
    document.getElementById(
        "jobsContainer"
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

            return;
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


        const photo =
            document.getElementById(
                "navProfilePhoto"
            );


        if (recruiter.profile_photo) {

            photo.src =
                recruiter.profile_photo;

        }

    }

    catch (error) {

        console.error(
            "Recruiter loading error:",
            error
        );

    }

}


// =========================================================
// LOAD JOBS
// =========================================================

async function loadJobs() {

    jobsContainer.innerHTML = `
        <div class="loading">
            Loading jobs...
        </div>
    `;


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


        displayJobs(
            data.jobs || []
        );

    }

    catch (error) {

        console.error(
            "Jobs error:",
            error
        );


        jobsContainer.innerHTML = `

            <div class="empty-state">

                <div class="icon">
                    ⚠️
                </div>

                <h2>
                    Something went wrong
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    class="view-button"
                    onclick="loadJobs()"
                >
                    Try Again
                </button>

            </div>

        `;

    }

}


// =========================================================
// DISPLAY JOBS
// =========================================================

function displayJobs(jobs) {

    if (!jobs.length) {

        jobsContainer.innerHTML = `

            <div class="empty-state">

                <div class="icon">
                    💼
                </div>

                <h2>
                    No jobs yet
                </h2>

                <p>
                    Create your first job
                    to start screening candidates.
                </p>

            </div>

        `;

        return;
    }


    jobsContainer.innerHTML = "";


    jobs.forEach(
        function(job) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "job-card";


            const candidateCount =
                job.candidate_count || 0;


            card.innerHTML = `

                <div class="job-top">

                    <div class="job-icon">
                        💼
                    </div>

                    <span class="status">
                        ${escapeHTML(
                            job.status ||
                            "Active"
                        )}
                    </span>

                </div>


                <h3>
                    ${escapeHTML(
                        job.title ||
                        "Untitled Job"
                    )}
                </h3>


                <p class="job-description">

                    Recruitment position
                    created for candidate
                    screening.

                </p>


                <div class="job-stats">

                    <div class="job-stat">

                        <span>
                            Candidates
                        </span>

                        <strong>
                            ${candidateCount}
                        </strong>

                    </div>


                    <div class="job-stat">

                        <span>
                            Created
                        </span>

                        <strong>
                            ${formatDate(
                                job.created_at
                            )}
                        </strong>

                    </div>

                </div>


                <div class="job-actions">

                    <button
                        class="view-button"
                        data-job-id="${job.id}"
                    >
                        View Candidates →
                    </button>


                    <button
                        class="delete-button"
                        data-job-id="${job.id}"
                    >
                        Delete
                    </button>

                </div>

            `;


            jobsContainer.appendChild(
                card
            );

        }
    );


    attachJobEvents();

}


// =========================================================
// BUTTON EVENTS
// =========================================================

function attachJobEvents() {


    document
        .querySelectorAll(
            ".view-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        const jobId =
                            this.dataset.jobId;


                        window.location.href =
                            "/candidates.html?job_id=" +
                            encodeURIComponent(
                                jobId
                            );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    async function() {

                        const jobId =
                            this.dataset.jobId;


                        const confirmed =
                            confirm(
                                "Delete this job and all its screened candidates?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        await deleteJob(
                            jobId
                        );

                    }
                );

            }
        );

}


// =========================================================
// DELETE JOB
// =========================================================

async function deleteJob(
    jobId
) {

    try {

        const response =
            await fetch(
                `/jobs/${jobId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to delete job."
            );

        }


        alert(
            "Job deleted successfully."
        );


        await loadJobs();

    }

    catch (error) {

        console.error(
            "Delete job error:",
            error
        );


        alert(
            error.message
        );

    }

}


// =========================================================
// DATE
// =========================================================

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
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
// START
// =========================================================

loadRecruiter();

loadJobs();