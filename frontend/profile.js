// =========================================================
// PROFILE PAGE
// =========================================================

console.log("PROFILE.JS RUNNING");

// ---------------------------------------------------------
// HTML ELEMENTS
// ---------------------------------------------------------

const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const companyInput = document.getElementById("companyName");

const profilePhotoInput =
    document.getElementById("profilePhoto");

const profilePreview =
    document.getElementById("profileAvatar");

const avatarPlaceholder =
    document.getElementById("avatarPlaceholder");

const saveButton =
    document.getElementById("saveProfileButton");

const profileMessage =
    document.getElementById("profileMessage");

const photoName =
    document.getElementById("photoName");

const photoCompany =
    document.getElementById("photoCompany");


// =========================================================
// LOAD CURRENT RECRUITER
// =========================================================

async function loadProfile() {

    try {

        const response = await fetch("/me", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin"
        });

        const data = await response.json();

        console.log("PROFILE DATA:", data);

        if (!response.ok || !data.authenticated) {

            window.location.href = "/login.html";
            return;
        }

        const recruiter = data.recruiter;

        console.log("RECRUITER:", recruiter);


        // -------------------------------------------------
        // FILL FORM
        // -------------------------------------------------

        if (nameInput) {
            nameInput.value = recruiter.name || "";
        }

        if (emailInput) {
            emailInput.value = recruiter.email || "";
        }

        if (companyInput) {
            companyInput.value =
                recruiter.company_name || "";
        }


        // -------------------------------------------------
        // DISPLAY NAME
        // -------------------------------------------------

        if (photoName) {
            photoName.textContent =
                recruiter.name || "Recruiter";
        }


        // -------------------------------------------------
        // DISPLAY COMPANY
        // -------------------------------------------------

        if (photoCompany) {
            photoCompany.textContent =
                recruiter.company_name || "Company";
        }


        // -------------------------------------------------
        // DISPLAY PROFILE PHOTO
        // -------------------------------------------------

        if (
            recruiter.profile_photo &&
            profilePreview
        ) {

            profilePreview.src =
                recruiter.profile_photo +
                "?v=" +
                Date.now();

            profilePreview.style.display = "block";

            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = "none";
            }

        } else {

            showAvatarPlaceholder(recruiter.name);
        }

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showMessage(
            "Unable to load profile.",
            "error"
        );
    }
}


// =========================================================
// AVATAR PLACEHOLDER
// =========================================================

function showAvatarPlaceholder(name) {

    if (profilePreview) {
        profilePreview.style.display = "none";
    }

    if (avatarPlaceholder) {

        avatarPlaceholder.style.display = "flex";

        const firstLetter =
            (name || "R")
                .trim()
                .charAt(0)
                .toUpperCase();

        avatarPlaceholder.textContent =
            firstLetter;
    }
}

// PHOTO PREVIEW

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            if (!file) {
                return;
            }


            // -------------------------------------------------
            // CHECK IMAGE
            // -------------------------------------------------

            if (!file.type.startsWith("image/")) {

                showMessage(
                    "Please select an image file.",
                    "error"
                );

                this.value = "";

                return;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                showMessage(
                    "Profile photo must be smaller than 5 MB.",
                    "error"
                );

                this.value = "";

                return;
            }


            // -------------------------------------------------
            // SHOW PREVIEW
            // -------------------------------------------------

            const reader =
                new FileReader();

            reader.onload =
                function (event) {

                    if (profilePreview) {

                        profilePreview.src =
                            event.target.result;

                        profilePreview.style.display =
                            "block";
                    }

                    if (avatarPlaceholder) {

                        avatarPlaceholder.style.display =
                            "none";
                    }
                };

            reader.readAsDataURL(file);
        }
    );
}


// =========================================================
// UPDATE PROFILE
// =========================================================

if (profileForm) {

    profileForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log("PROFILE FORM SUBMITTED");


            // -------------------------------------------------
            // VALIDATE NAME
            // -------------------------------------------------

            if (!nameInput.value.trim()) {

                showMessage(
                    "Please enter your full name.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // DISABLE BUTTON
            // -------------------------------------------------

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving...";

            profileMessage.textContent = "";


            try {

                // -------------------------------------------------
                // CREATE FORMDATA
                // -------------------------------------------------

                const formData =
                    new FormData();


                // Backend expects "name"
                formData.append(
                    "name",
                    nameInput.value.trim()
                );


                // Backend expects "company_name"
                formData.append(
                    "company_name",
                    companyInput.value.trim()
                );


                // Backend expects "profile_photo"
                if (
                    profilePhotoInput &&
                    profilePhotoInput.files.length > 0
                ) {

                    formData.append(
                        "profile_photo",
                        profilePhotoInput.files[0]
                    );
                }


                console.log(
                    "Sending profile update..."
                );


                // -------------------------------------------------
                // SEND TO FLASK
                // -------------------------------------------------

                const response =
                    await fetch(
                        "/profile/update",
                        {
                            method: "POST",

                            body: formData,

                            credentials:
                                "same-origin"
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "UPDATE RESPONSE:",
                    data
                );


                // -------------------------------------------------
                // CHECK RESPONSE
                // -------------------------------------------------

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Profile update failed."
                    );
                }


                // -------------------------------------------------
                // GET UPDATED RECRUITER
                // -------------------------------------------------

                const recruiter =
                    data.recruiter;


                // -------------------------------------------------
                // UPDATE FORM
                // -------------------------------------------------

                if (nameInput) {
                    nameInput.value =
                        recruiter.name || "";
                }

                if (companyInput) {
                    companyInput.value =
                        recruiter.company_name || "";
                }

                if (emailInput) {
                    emailInput.value =
                        recruiter.email || "";
                }


                // -------------------------------------------------
                // UPDATE NAME
                // -------------------------------------------------

                if (photoName) {

                    photoName.textContent =
                        recruiter.name ||
                        "Recruiter";
                }


                // -------------------------------------------------
                // UPDATE COMPANY
                // -------------------------------------------------

                if (photoCompany) {

                    photoCompany.textContent =
                        recruiter.company_name ||
                        "Company";
                }


                // -------------------------------------------------
                // UPDATE PHOTO
                // -------------------------------------------------

                if (
                    profilePreview &&
                    recruiter.profile_photo
                ) {

                    profilePreview.src =
                        recruiter.profile_photo +
                        "?v=" +
                        Date.now();

                    profilePreview.style.display =
                        "block";

                    if (avatarPlaceholder) {
                        avatarPlaceholder.style.display =
                            "none";
                    }
                }


                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                showMessage(
                    "Profile updated successfully!",
                    "success"
                );


                // Clear selected file
                if (profilePhotoInput) {
                    profilePhotoInput.value = "";
                }


                // Reload dashboard data if user returns
                console.log(
                    "PROFILE UPDATE SUCCESSFUL"
                );

            }

            catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to update profile.",
                    "error"
                );
            }


            finally {

                saveButton.disabled = false;

                saveButton.textContent =
                    "Save Changes";
            }

        }
    );
}


// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(
    message,
    type
) {

    if (!profileMessage) {
        return;
    }

    profileMessage.textContent =
        message;

    profileMessage.className =
        "message " +
        type;
}
// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );

            if (!confirmed) {
                return;
            }


            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging out...";


            try {

                const response =
                    await fetch(
                        "/logout",
                        {
                            method: "POST",

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Unable to logout."
                    );

                }


                window.location.href =
                    "/login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to logout."
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Logout";
            }

        }
    );

}



// =========================================================
// DELETE ACCOUNT
// =========================================================

const deleteAccountButton =
    document.getElementById(
        "deleteAccountButton"
    );


if (deleteAccountButton) {

    deleteAccountButton.addEventListener(
        "click",
        async function () {


            const firstConfirmation =
                confirm(
                    "Are you sure you want to permanently delete your account?\n\nYour profile and jobs will be deleted."
                );


            if (!firstConfirmation) {
                return;
            }


            const secondConfirmation =
                confirm(
                    "This action cannot be undone.\n\nDo you really want to delete your account?"
                );


            if (!secondConfirmation) {
                return;
            }


            deleteAccountButton.disabled = true;

            deleteAccountButton.textContent =
                "Deleting Account...";


            try {

                const response =
                    await fetch(
                        "/delete-account",
                        {
                            method: "POST",

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Unable to delete account."
                    );

                }


                alert(
                    "Your account has been deleted successfully."
                );


                window.location.href =
                    "/register.html";


            } catch (error) {

                console.error(
                    "Delete account error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to delete account."
                );


                deleteAccountButton.disabled =
                    false;

                deleteAccountButton.textContent =
                    "Delete Account";
            }

        }
    );

}

// =========================================================
// START
// =========================================================

loadProfile();