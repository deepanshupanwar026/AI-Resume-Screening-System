// =========================================================
// AI RESUME SCREENING SYSTEM
// RECRUITER DASHBOARD
// =========================================================


// =========================================================
// THEME
// =========================================================

const themeToggle =
    document.getElementById("themeToggle");


function applyTheme() {

    const savedTheme =
        localStorage.getItem("dashboardTheme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        if (themeToggle) {
            themeToggle.textContent = "☀";
        }

    } else {

        document.body.classList.remove("dark");

        if (themeToggle) {
            themeToggle.textContent = "☾";
        }

    }

}


// =========================================================
// THEME TOGGLE
// =========================================================

if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        function () {

            document.body.classList.toggle("dark");


            const dark =
                document.body.classList.contains("dark");


            localStorage.setItem(
                "dashboardTheme",
                dark ? "dark" : "light"
            );


            themeToggle.textContent =
                dark ? "☀" : "☾";

        }
    );

}


applyTheme();


// =========================================================
// LOAD DASHBOARD
// =========================================================

async function loadDashboard() {

    try {

        const response =
    await fetch("/dashboard");


// Check what Flask actually returned
const contentType =
    response.headers.get(
        "content-type"
    );


if (
    !contentType ||
    !contentType.includes(
        "application/json"
    )
) {

    const text =
        await response.text();

    console.error(
        "Expected JSON but Flask returned:",
        text
    );


    throw new Error(
        "Dashboard API returned HTML instead of JSON. Check the /dashboard Flask route."
    );

}


const data =
    await response.json();

        // -------------------------------------------------
        // LOGIN CHECK
        // -------------------------------------------------

        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;

        }


        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        if (!data.success) {

            showDashboardError(
                data.message ||
                "Unable to load dashboard."
            );

            return;

        }


        // =================================================
        // RECRUITER INFORMATION
        // =================================================

        const recruiter =
            data.recruiter || {};


        const name =
            recruiter.name ||
            "Recruiter";


        const company =
            recruiter.company_name ||
            "Company";


        const email =
            recruiter.email ||
            "";


        // =================================================
        // RECRUITER NAME
        // =================================================

        setText(
            "navRecruiterName",
            name
        );


        setText(
            "heroName",
            name
        );


        setText(
            "heroProfileName",
            name
        );


        // =================================================
        // COMPANY
        // =================================================

        setText(
            "navCompanyName",
            company
        );


        setText(
            "heroCompany",
            company
        );


        setText(
            "heroProfileCompany",
            company
        );


        // =================================================
        // EMAIL
        // =================================================

        setText(
            "heroEmail",
            email
        );


        // =================================================
        // PROFILE PHOTO
        // =================================================

        let photo =
            recruiter.profile_photo;


        if (!photo) {

            photo =
                "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(name) +
                "&background=6857e8&color=ffffff&size=256";

        }


        setImage(
            "navProfilePhoto",
            photo
        );


        setImage(
            "heroProfilePhoto",
            photo
        );


        // =================================================
        // STATISTICS
        // =================================================

        const stats =
            data.statistics || {};


        setText(
            "totalJobs",
            stats.total_jobs || 0
        );


        setText(
            "activeJobs",
            stats.active_jobs || 0
        );


        setText(
            "totalCandidates",
            stats.total_candidates || 0
        );


        setText(
            "shortlistedCandidates",
            stats.shortlisted_candidates || 0
        );


        // =================================================
        // JOBS
        // =================================================

        displayJobs(
            data.jobs || []
        );


    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        showDashboardError(
            "Unable to connect to the server."
        );

    }

}


// =========================================================
// DISPLAY JOBS
// =========================================================

function displayJobs(jobs) {

    const container =
        document.getElementById(
            "jobsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    // =====================================================
    // NO JOBS
    // =====================================================

    if (!jobs.length) {

        container.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">
                    💼
                </div>

                <h3>
                    No jobs created yet
                </h3>

                <p>
                    Create your first job to
                    start screening candidates.
                </p>

                <a
                    href="create-job.html"
                    class="primary-button"
                >
                    Create Your First Job →
                </a>

            </div>

        `;

        return;

    }


    // =====================================================
    // CREATE JOB CARDS
    // =====================================================

    jobs.forEach(
        function (job, index) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "job-card";


            card.style.animationDelay =
                `${index * 0.08}s`;


            const status =
                job.status ||
                "Active";


            const candidateCount =
                job.candidate_count ||
                0;


            const createdDate =
                formatDate(
                    job.created_at
                );


            const jobTitle =
                job.title ||
                "Untitled Job";


            card.innerHTML = `

                <div class="job-card-top">

                    <div class="job-symbol">
                        💼
                    </div>

                    <span class="status-badge">
                        ${escapeHTML(status)}
                    </span>

                </div>


                <h3>
                    ${escapeHTML(jobTitle)}
                </h3>


                <p class="job-card-description">

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
                            ${createdDate}
                        </strong>

                    </div>

                </div>


                <button
                    type="button"
                    class="view-job-button"
                    data-job-id="${job.id}"
                >

                    View Candidates →

                </button>

            `;


            container.appendChild(
                card
            );

        }
    );


    // =====================================================
    // VIEW CANDIDATES BUTTONS
    // =====================================================

    document
        .querySelectorAll(
            ".view-job-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const jobId =
                            this.dataset.jobId;


                        openScreening(
                            jobId
                        );

                    }
                );

            }
        );

}


// =========================================================
// OPEN SCREENING PAGE
// =========================================================

function openScreening(jobId) {

    // -----------------------------------------------------
    // Make sure a job ID exists
    // -----------------------------------------------------

    if (!jobId) {

        console.error(
            "No job ID provided."
        );

        alert(
            "Unable to open this job. Job ID is missing."
        );

        return;

    }


    // -----------------------------------------------------
    // Create screening URL
    // -----------------------------------------------------

    const screeningURL =
        "/screening.html?job_id=" +
        encodeURIComponent(jobId);


    // -----------------------------------------------------
    // Navigate
    // -----------------------------------------------------

    window.location.href =
        screeningURL;

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

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
// SET TEXT SAFELY
// =========================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


// =========================================================
// SET IMAGE SAFELY
// =========================================================

function setImage(
    elementId,
    imageURL
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.src =
            imageURL;

    }

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(value) {

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
// DASHBOARD ERROR
// =========================================================

function showDashboardError(
    message
) {

    const container =
        document.getElementById(
            "jobsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-card">

            <div class="empty-icon">
                ⚠️
            </div>

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="primary-button"
                onclick="loadDashboard()"
            >

                Try Again

            </button>

        </div>

    `;

}


// =========================================================
// START DASHBOARD
// =========================================================

loadDashboard();