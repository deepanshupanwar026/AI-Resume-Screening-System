const registerForm =
    document.getElementById("registerForm");

const registerButton =
    document.getElementById("registerButton");

const registerMessage =
    document.getElementById("registerMessage");


registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            document.getElementById("name")
                .value
                .trim();

        const email =
            document.getElementById("email")
                .value
                .trim();

        const password =
            document.getElementById("password")
                .value;

        const confirmPassword =
            document.getElementById("confirmPassword")
                .value;


        registerMessage.textContent = "";

        registerMessage.className =
            "auth-message";


        /* ---------------------------------
           CHECK PASSWORDS
        --------------------------------- */

        if (password !== confirmPassword) {

            registerMessage.textContent =
                "Passwords do not match.";

            registerMessage.className =
                "auth-message error";

            return;
        }


        if (password.length < 6) {

            registerMessage.textContent =
                "Password must be at least 6 characters.";

            registerMessage.className =
                "auth-message error";

            return;
        }


        /* ---------------------------------
           DISABLE BUTTON
        --------------------------------- */

        registerButton.disabled = true;

        registerButton.innerHTML =
            "Creating Account...";


        try {

            /* -----------------------------
               SEND DATA TO FLASK
            ----------------------------- */

            const response =
                await fetch(
                    "/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name: name,

                            email: email,

                            password: password

                        })
                    }
                );


            const data =
                await response.json();


            /* -----------------------------
               ERROR
            ----------------------------- */

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Registration failed."
                );

            }


            /* -----------------------------
               SUCCESS
            ----------------------------- */

            registerMessage.textContent =
                "Account created successfully! Redirecting...";

            registerMessage.className =
                "auth-message success";


            setTimeout(
                function () {

                    window.location.href =
                        "/login.html";

                },
                1000
            );


        }

        catch (error) {

            registerMessage.textContent =
                error.message;

            registerMessage.className =
                "auth-message error";


            registerButton.disabled = false;

            registerButton.innerHTML =
                'Create Account <span>→</span>';

        }

    }
);