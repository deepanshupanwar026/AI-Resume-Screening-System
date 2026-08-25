console.log(" NEW AUTH.JS IS RUNNING");
// =========================================================
// RECRUITER LOGIN
// =========================================================

const loginForm =
    document.getElementById("loginForm");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");


// =========================================================
// LOGIN FORM
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log("🔥 LOGIN BUTTON CLICKED");

            const email =
                document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document.getElementById("password")
                    .value;


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter email and password.";

                loginMessage.className =
                    "auth-message error";

                return;
            }


            loginButton.disabled = true;

            loginButton.innerHTML =
                "Signing in...";


            loginMessage.textContent = "";


            try {

                // =================================================
                // SEND LOGIN REQUEST
                // =================================================

                const response =
                    await fetch(
                        "/login",
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


// =================================================
// READ SERVER RESPONSE
// =================================================

const responseText =
    await response.text();

console.log(
    "LOGIN HTTP STATUS:",
    response.status
);

console.log(
    "LOGIN SERVER RESPONSE:",
    responseText
);


let data;

try {

    data = JSON.parse(
        responseText
    );

} catch (error) {

    console.error(
        "SERVER RETURNED NON-JSON:",
        responseText
    );

    throw new Error(
        "Flask returned HTML instead of JSON. Check the terminal."
    );
}

                // =================================================
                // LOGIN ERROR
                // =================================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Invalid email or password."
                    );

                }


                // =================================================
                // LOGIN SUCCESS
                // =================================================

                loginMessage.textContent =
                    "Login successful! Redirecting...";

                loginMessage.className =
                    "auth-message success";


                console.log(
                    "Recruiter logged in:",
                    data.recruiter
                );


                // =================================================
                // OPEN DASHBOARD
                // =================================================

                setTimeout(
                    function () {

                        window.location.href =
                            "/dashboard.html";

                    },
                    500
                );

            }


            // =================================================
            // CATCH ERROR
            // =================================================

            catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                loginMessage.textContent =
                    error.message ||
                    "Unable to login.";

                loginMessage.className =
                    "auth-message error";


                loginButton.disabled =
                    false;

                loginButton.innerHTML =
                    'Sign In <span>→</span>';

            }

        }
    );

}