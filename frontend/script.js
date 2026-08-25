const screenButton =
    document.getElementById("screenButton");

const resultsContainer =
    document.getElementById("results");

const totalCandidatesElement =
    document.getElementById("totalCandidates");

const topSimilarityElement =
    document.getElementById("topSimilarity");

const topSkillMatchElement =
    document.getElementById("topSkillMatch");

const topOverallElement =
    document.getElementById("topOverall");


/*
=====================================================
STORE RESULTS
=====================================================
*/

let allCandidates = [];


/*
=====================================================
SCREEN RESUMES
=====================================================
*/

screenButton.addEventListener(
    "click",
    async function () {

        const jobDescription =
            document
                .getElementById("jobDescription")
                .value;

        const resumeFiles =
            document
                .getElementById("resumeFiles")
                .files;


        /*
        -----------------------------------------------
        VALIDATION
        -----------------------------------------------
        */

        if (!jobDescription.trim()) {

            alert(
                "Please enter a Job Description."
            );

            return;
        }


        if (resumeFiles.length === 0) {

            alert(
                "Please upload at least one resume."
            );

            return;
        }


        /*
        -----------------------------------------------
        FORM DATA
        -----------------------------------------------
        */

        const formData =
            new FormData();


        formData.append(
            "job_description",
            jobDescription
        );


        for (
            let i = 0;
            i < resumeFiles.length;
            i++
        ) {

            formData.append(
                "resumes",
                resumeFiles[i]
            );
        }


        /*
        -----------------------------------------------
        LOADING
        -----------------------------------------------
        */

        screenButton.disabled = true;

        screenButton.textContent =
            "Screening...";


        try {

            /*
            -------------------------------------------
            SEND TO FLASK
            -------------------------------------------
            */

            const response =
                await fetch(
                    "/screen",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Server returned an error."
                );
            }


            const data =
                await response.json();


            console.log(
                "Flask response:",
                data
            );


            /*
            -------------------------------------------
            SAVE RESULTS
            -------------------------------------------
            */

            allCandidates =
                data.results || [];


            /*
            -------------------------------------------
            UPDATE SCORE CARDS
            -------------------------------------------
            */

            updateScoreCards(
                allCandidates
            );


            /*
            -------------------------------------------
            DISPLAY RESULTS
            -------------------------------------------
            */

            displayCandidates(
                allCandidates
            );


            screenButton.textContent =
                "Screening Complete";


        } catch (error) {

            console.error(
                "Screening error:",
                error
            );


            alert(
                "Something went wrong while screening resumes."
            );


            screenButton.textContent =
                "Screen Resumes";


        } finally {

            screenButton.disabled =
                false;
        }

    }
);


/*
=====================================================
SCORE CARDS
=====================================================
*/

function updateScoreCards(
    results
) {

    if (
        !results ||
        results.length === 0
    ) {

        return;
    }


    totalCandidatesElement.textContent =
        results.length;


    const topSimilarity =
        Math.max(
            ...results.map(
                candidate =>
                    candidate.similarity_score
            )
        );


    const topSkillMatch =
        Math.max(
            ...results.map(
                candidate =>
                    candidate.skill_match_score
            )
        );


    const topOverall =
        Math.max(
            ...results.map(
                candidate =>
                    candidate.overall_score
            )
        );


    topSimilarityElement.textContent =
        topSimilarity.toFixed(2) + "%";


    topSkillMatchElement.textContent =
        topSkillMatch.toFixed(2) + "%";


    topOverallElement.textContent =
        topOverall.toFixed(2) + "%";
}


/*
=====================================================
DISPLAY CANDIDATES
=====================================================
*/

function displayCandidates(
    results
) {

    resultsContainer.innerHTML = "";


    /*
    -----------------------------------------------
    HEADING
    -----------------------------------------------
    */

    const heading =
        document.createElement("h2");

    heading.className =
        "results-heading";

    heading.textContent =
        "Candidate Results";


    resultsContainer.appendChild(
        heading
    );


    /*
    -----------------------------------------------
    SEARCH + FILTER
    -----------------------------------------------
    */

    const toolbar =
        document.createElement("div");

    toolbar.className =
        "results-toolbar";


    toolbar.innerHTML = `

        <input
            type="text"
            id="candidateSearch"
            placeholder="🔍 Search candidates..."
        >


        <select
            id="recommendationFilter"
        >

            <option value="all">
                All Recommendations
            </option>

            <option value="Recommended">
                🟢 Recommended
            </option>

            <option value="Consider">
                🟡 Consider
            </option>

            <option value="Low Match">
                🔴 Low Match
            </option>

        </select>

    `;


    resultsContainer.appendChild(
        toolbar
    );


    /*
    -----------------------------------------------
    CARD AREA
    -----------------------------------------------
    */

    const cardsContainer =
        document.createElement("div");

    cardsContainer.id =
        "candidateCards";


    resultsContainer.appendChild(
        cardsContainer
    );


    /*
    -----------------------------------------------
    RENDER
    -----------------------------------------------
    */

    renderCandidateCards(
        results
    );


    /*
    -----------------------------------------------
    SEARCH
    -----------------------------------------------
    */

    const searchInput =
        document.getElementById(
            "candidateSearch"
        );


    searchInput.addEventListener(
        "input",
        applyFilters
    );


    /*
    -----------------------------------------------
    FILTER
    -----------------------------------------------
    */

    const filter =
        document.getElementById(
            "recommendationFilter"
        );


    filter.addEventListener(
        "change",
        applyFilters
    );
}


/*
=====================================================
RENDER CANDIDATE CARDS
=====================================================
*/

function renderCandidateCards(
    results
) {

    const cardsContainer =
        document.getElementById(
            "candidateCards"
        );


    cardsContainer.innerHTML = "";


    if (
        !results ||
        results.length === 0
    ) {

        cardsContainer.innerHTML = `

            <div class="no-results">

                No candidates found.

            </div>

        `;

        return;
    }


    results.forEach(
        (
            candidate,
            index
        ) => {

            const card =
                createCandidateCard(
                    candidate,
                    index
                );


            /*
            -----------------------------------------
            STAGGER ANIMATION
            -----------------------------------------
            */

            card.style.animationDelay =
                `${index * 0.12}s`;


            cardsContainer.appendChild(
                card
            );

        }
    );
}


/*
=====================================================
CREATE CANDIDATE CARD
=====================================================
*/

function createCandidateCard(
    candidate,
    index
) {

    const card =
        document.createElement("div");


    card.className =
        "candidate-card";


    /*
    -----------------------------------------------
    BADGE
    -----------------------------------------------
    */

    let badgeClass =
        "badge-low";


    if (
        candidate.recommendation ===
        "Recommended"
    ) {

        badgeClass =
            "badge-recommended";

    } else if (
        candidate.recommendation ===
        "Consider"
    ) {

        badgeClass =
            "badge-consider";
    }


    /*
    -----------------------------------------------
    MATCHED SKILLS
    -----------------------------------------------
    */

    const matchedSkills =
        candidate.matched_skills
            .map(
                skill => `

                    <span class="skill matched">
                        ${skill}
                    </span>

                `
            )
            .join("");


    /*
    -----------------------------------------------
    MISSING SKILLS
    -----------------------------------------------
    */

    const missingSkills =
        candidate.missing_skills
            .map(
                skill => `

                    <span class="skill missing">
                        ${skill}
                    </span>

                `
            )
            .join("");


    /*
    -----------------------------------------------
    CARD
    -----------------------------------------------
    */

    card.innerHTML = `

        <div class="candidate-header">

            <div>

                <div class="candidate-rank">
                    #${candidate.rank}
                </div>

                <h3>
                    ${formatCandidateName(
                        candidate.candidate
                    )}
                </h3>

            </div>


            <span
                class="
                    recommendation-badge
                    ${badgeClass}
                "
            >
                ${candidate.recommendation}
            </span>

        </div>


        <!-- SCORE GRID -->

        <div class="score-grid">


            <!-- OVERALL -->

            <div class="candidate-score">

                <span>
                    Overall Score
                </span>

                <strong>
                    ${candidate.overall_score.toFixed(2)}%
                </strong>

                <div class="score-progress">

                    <div
                        class="score-progress-bar"
                        style="
                            width:
                            ${candidate.overall_score}%;
                        "
                    ></div>

                </div>

            </div>


            <!-- SIMILARITY -->

            <div class="candidate-score">

                <span>
                    Resume Similarity
                </span>

                <strong>
                    ${candidate.similarity_score.toFixed(2)}%
                </strong>

                <div class="score-progress">

                    <div
                        class="score-progress-bar"
                        style="
                            width:
                            ${candidate.similarity_score}%;
                        "
                    ></div>

                </div>

            </div>


            <!-- SKILL MATCH -->

            <div class="candidate-score">

                <span>
                    Skill Match
                </span>

                <strong>
                    ${candidate.skill_match_score.toFixed(2)}%
                </strong>

                <div class="score-progress">

                    <div
                        class="score-progress-bar"
                        style="
                            width:
                            ${candidate.skill_match_score}%;
                        "
                    ></div>

                </div>

            </div>

        </div>


        <!-- MATCHED SKILLS -->

        <div class="skills-section">

            <h4>
                ✓ Matched Skills
            </h4>

            <div class="skills-list">

                ${
                    matchedSkills ||
                    '<span class="no-skills">No matching skills found</span>'
                }

            </div>

        </div>


        <!-- MISSING SKILLS -->

        <div class="skills-section">

            <h4>
                × Missing Skills
            </h4>

            <div class="skills-list">

                ${
                    missingSkills ||
                    '<span class="no-skills">No missing skills</span>'
                }

            </div>

        </div>

    `;


    return card;
}


/*
=====================================================
SEARCH + FILTER
=====================================================
*/

function applyFilters() {

    const searchInput =
        document.getElementById(
            "candidateSearch"
        );


    const filter =
        document.getElementById(
            "recommendationFilter"
        );


    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedRecommendation =
        filter.value;


    const filteredResults =
        allCandidates.filter(
            candidate => {

                /*
                -------------------------------------
                SEARCH
                -------------------------------------
                */

                const candidateName =
                    candidate.candidate
                        .toLowerCase();


                const matchesSearch =
                    candidateName.includes(
                        searchTerm
                    );


                /*
                -------------------------------------
                RECOMMENDATION
                -------------------------------------
                */

                const matchesRecommendation =
                    selectedRecommendation ===
                    "all"
                    ||
                    candidate.recommendation ===
                    selectedRecommendation;


                return (
                    matchesSearch &&
                    matchesRecommendation
                );

            }
        );


    renderCandidateCards(
        filteredResults
    );
}


/*
=====================================================
FORMAT NAME
=====================================================
*/

function formatCandidateName(
    filename
) {

    return filename
        .replace(
            ".pdf",
            ""
        )
        .replace(
            /candidate/gi,
            "Candidate "
        )
        .replace(
            /(\d+)/,
            "$1"
        );
}