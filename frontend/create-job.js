// =========================================================
// CREATE JOB PAGE
// =========================================================

console.log("CREATE-JOB.JS RUNNING");


// =========================================================
// ELEMENTS
// =========================================================

const createJobForm =
    document.getElementById("createJobForm");

const createJobButton =
    document.getElementById("createJobButton");

const jobMessage =
    document.getElementById("jobMessage");

const themeToggle =
    document.getElementById("themeToggle");

const navProfileAvatar =
    document.getElementById("navProfileAvatar");

const navProfileName =
    document.getElementById("navProfileName");

const navCompanyName =
    document.getElementById("navCompanyName");


// =========================================================
// THEME
// =========================================================

function applyTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add(
            "dark-theme"
        );

        if (themeToggle) {

            themeToggle.textContent = "☀";

        }

    } else {

        document.body.classList.remove(
            "dark-theme"
        );

        if (themeToggle) {

            themeToggle.textContent = "☾";

        }

    }

}


// =========================================================
// LOAD SAVED THEME
// =========================================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem("theme");

    if (savedTheme === "dark") {

        applyTheme("dark");

    } else {

        applyTheme("light");

    }

}


// =========================================================
// THEME BUTTON
// =========================================================

if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        function () {

            const isDark =
                document.body.classList.contains(
                    "dark-theme"
                );

            const newTheme =
                isDark
                    ? "light"
                    : "dark";

            localStorage.setItem(
                "theme",
                newTheme
            );

            applyTheme(newTheme);

        }
    );

}


// =========================================================
// LOAD RECRUITER PROFILE
// =========================================================

async function loadRecruiterProfile() {

    try {

        const response =
            await fetch(
                "/me",
                {
                    method: "GET",
                    credentials: "same-origin"
                }
            );


        const data =
            await response.json();


        console.log(
            "PROFILE DATA:",
            data
        );


        // -----------------------------------------------
        // NOT LOGGED IN
        // -----------------------------------------------

        if (!data.authenticated) {

            window.location.href =
                "/login.html";

            return;

        }


        const recruiter =
            data.recruiter;


        // -----------------------------------------------
        // NAME
        // -----------------------------------------------

        if (navProfileName) {

            navProfileName.textContent =
                recruiter.name ||
                "Recruiter";

        }


        // -----------------------------------------------
        // COMPANY
        // -----------------------------------------------

        if (navCompanyName) {

            navCompanyName.textContent =
                recruiter.company_name ||
                "Company";

        }


        // -----------------------------------------------
        // PROFILE PHOTO
        // -----------------------------------------------

        if (
            navProfileAvatar &&
            recruiter.profile_photo
        ) {

            navProfileAvatar.innerHTML = "";

            const image =
                document.createElement("img");

            image.src =
                recruiter.profile_photo;

            image.alt =
                "Profile photo";

            navProfileAvatar.appendChild(
                image
            );

        } else if (navProfileAvatar) {

            // First letter if no photo

            const name =
                recruiter.name ||
                "R";

            navProfileAvatar.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


// =========================================================
// CREATE JOB
// =========================================================

if (createJobForm) {

    createJobForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const jobTitle =
                document
                    .getElementById("jobTitle")
                    .value
                    .trim();


            const jobDescription =
                document
                    .getElementById("jobDescription")
                    .value
                    .trim();


            // ---------------------------------------------
            // RESET MESSAGE
            // ---------------------------------------------

            jobMessage.textContent = "";

            jobMessage.className =
                "job-message";


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (
                !jobTitle ||
                !jobDescription
            ) {

                jobMessage.textContent =
                    "Please enter the job title and job description.";

                jobMessage.className =
                    "job-message error";

                return;

            }


            // ---------------------------------------------
            // DISABLE BUTTON
            // ---------------------------------------------

            createJobButton.disabled =
                true;

            createJobButton.innerHTML =
                "Creating Job...";


            try {

                // -----------------------------------------
                // SEND TO FLASK
                // -----------------------------------------

                const response =
                    await fetch(
                        "/jobs",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body:
                                JSON.stringify({

                                    job_title:
                                        jobTitle,

                                    job_description:
                                        jobDescription

                                })
                        }
                    );


                // -----------------------------------------
                // CHECK CONTENT TYPE
                // -----------------------------------------

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
                        "Server returned:",
                        text
                    );

                    throw new Error(
                        "Server returned an invalid response."
                    );

                }


                // -----------------------------------------
                // JSON
                // -----------------------------------------

                const data =
                    await response.json();


                console.log(
                    "Created Job:",
                    data
                );


                // -----------------------------------------
                // ERROR
                // -----------------------------------------

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to create job."
                    );

                }


                // -----------------------------------------
                // SUCCESS
                // -----------------------------------------

                jobMessage.textContent =
                    "Job created successfully!";

                jobMessage.className =
                    "job-message success";


                createJobForm.reset();


                // -----------------------------------------
                // GO TO JOBS AFTER SUCCESS
                // -----------------------------------------

                setTimeout(
                    function () {

                        window.location.href =
                            "/jobs.html";

                    },
                    900
                );

            }


            catch (error) {

                console.error(
                    "Create job error:",
                    error
                );


                jobMessage.textContent =
                    error.message ||
                    "Unable to create job.";

                jobMessage.className =
                    "job-message error";

            }


            finally {

                createJobButton.disabled =
                    false;

                createJobButton.innerHTML =
                    'Create Job <span>→</span>';

            }

        }
    );

}


// =========================================================
// INITIALIZE
// =========================================================

loadTheme();

loadRecruiterProfile();