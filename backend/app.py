from datetime import datetime
import os
import sys
import uuid

from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory,
    session,
    redirect,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# =========================================================
# PROJECT PATHS
# =========================================================

PROJECT_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

sys.path.insert(0, PROJECT_FOLDER)


# =========================================================
# EXISTING ML / NLP MODULES
# =========================================================

from src.resume_parser import extract_text_from_pdf
from src.text_preprocessing import preprocess_text
from src.skill_extractor import extract_skills, compare_skills
from src.rag_pipeline import generate_rag_analysis
# =========================================================
# FOLDERS
# =========================================================

FRONTEND_FOLDER = os.path.join(PROJECT_FOLDER, "frontend")
UPLOAD_FOLDER = os.path.join(PROJECT_FOLDER, "uploads")
PROFILE_FOLDER = os.path.join(UPLOAD_FOLDER, "profiles")
DATABASE_FOLDER = os.path.join(PROJECT_FOLDER, "database")

for folder in (
    UPLOAD_FOLDER,
    PROFILE_FOLDER,
    DATABASE_FOLDER,
):
    os.makedirs(folder, exist_ok=True)


# =========================================================
# FLASK APP
# =========================================================
app = Flask(
    __name__,
    static_folder=FRONTEND_FOLDER,
    static_url_path=""
)

app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

app.secret_key = os.environ.get(
    "SECRET_KEY",
    "resume-screening-dev-secret-key"
)

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///"
    + os.path.join(DATABASE_FOLDER, "recruitment.db")
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# =========================================================
# DATABASE MODELS
# =========================================================

class Recruiter(db.Model):
    __tablename__ = "recruiters"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        nullable=False,
        unique=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    company_name = db.Column(
        db.String(150),
        nullable=True
    )

    profile_photo = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    status = db.Column(
        db.String(30),
        default="Active"
    )

    recruiter_id = db.Column(
        db.Integer,
        db.ForeignKey("recruiters.id"),
        nullable=False
    )

    recruiter = db.relationship(
        "Recruiter",
        backref=db.backref("jobs", lazy=True)
    )


class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.Integer, primary_key=True)

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id"),
        nullable=False
    )

    candidate_name = db.Column(
        db.String(255),
        nullable=False
    )

    resume_filename = db.Column(
        db.String(255),
        nullable=False
    )

    resume_path = db.Column(
        db.String(500),
        nullable=True
    )

    text_length = db.Column(
        db.Integer,
        default=0
    )

    skills = db.Column(
        db.Text,
        nullable=True
    )

    matched_skills = db.Column(
        db.Text,
        nullable=True
    )

    missing_skills = db.Column(
        db.Text,
        nullable=True
    )

    skill_match_score = db.Column(
        db.Float,
        default=0
    )

    similarity_score = db.Column(
        db.Float,
        default=0
    )

    overall_score = db.Column(
        db.Float,
        default=0
    )

    ai_analysis = db.Column(
    db.Text,
    nullable=True
    )

    rank = db.Column(
        db.Integer,
        default=0
    )

    recommendation = db.Column(
        db.String(50),
        default="Low Match"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    job = db.relationship(
        "Job",
        backref=db.backref("candidates", lazy=True)
    )


# =========================================================
# HELPER FUNCTIONS
# =========================================================

ALLOWED_PROFILE_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


def recruiter_from_session():
    recruiter_id = session.get("recruiter_id")

    if not recruiter_id:
        return None

    return db.session.get(
        Recruiter,
        recruiter_id
    )


def recruiter_data(recruiter):
    return {
        "id": recruiter.id,
        "name": recruiter.name,
        "email": recruiter.email,
        "company_name": recruiter.company_name or "",
        "profile_photo": recruiter.profile_photo or "",
    }


def job_to_dict(job):
    candidates = job.candidates or []

    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "status": job.status or "Active",
        "created_at": (
            job.created_at.isoformat()
            if job.created_at
            else None
        ),
        "candidate_count": len(candidates),
        "recommended_count": sum(
            1
            for candidate in candidates
            if candidate.recommendation == "Recommended"
        ),
    }


def candidate_to_dict(candidate):
    return {
        "id": candidate.id,
        "candidate": candidate.candidate_name,
        "resume_filename": candidate.resume_filename,
        "resume_url": (
            f"/uploads/{os.path.basename(candidate.resume_path)}"
            if candidate.resume_path
            else ""
        ),
        "skills": (
            candidate.skills.split(", ")
            if candidate.skills
            else []
        ),
        "matched_skills": (
            candidate.matched_skills.split(", ")
            if candidate.matched_skills
            else []
        ),
        "missing_skills": (
            candidate.missing_skills.split(", ")
            if candidate.missing_skills
            else []
        ),
        "skill_match_score": candidate.skill_match_score or 0,
        "similarity_score": candidate.similarity_score or 0,
        "overall_score": candidate.overall_score or 0,
        "ai_analysis": candidate.ai_analysis,
        "rank": candidate.rank or 0,
        "recommendation": candidate.recommendation or "Low Match",
        "text_length": candidate.text_length or 0,
        "created_at": (
            candidate.created_at.isoformat()
            if candidate.created_at
            else None
        ),
    }


def owns_job(job, recruiter_id):
    return (
        job is not None
        and job.recruiter_id == recruiter_id
    )


# =========================================================
# PAGE ROUTES
# =========================================================

@app.route("/")
def home():
    if session.get("recruiter_id"):
        return redirect("/dashboard.html")

    return redirect("/login.html")


@app.route("/login.html")
def login_page():
    if session.get("recruiter_id"):
        return redirect("/dashboard.html")

    return send_from_directory(
        FRONTEND_FOLDER,
        "login.html"
    )


@app.route("/register.html")
def register_page():
    if session.get("recruiter_id"):
        return redirect("/dashboard.html")

    return send_from_directory(
        FRONTEND_FOLDER,
        "register.html"
    )


@app.route("/dashboard.html")
def dashboard_page():
    if not session.get("recruiter_id"):
        return redirect("/login.html")

    return send_from_directory(
        FRONTEND_FOLDER,
        "dashboard.html"
    )



# =========================================================
# MY JOBS PAGE
# =========================================================

@app.route("/jobs.html")
def jobs_page():

    return send_from_directory(
        FRONTEND_FOLDER,
        "jobs.html"
    )


# =========================================================
# CANDIDATES PAGE
# =========================================================

@app.route("/candidates.html")
def candidates_page():

    return send_from_directory(
        FRONTEND_FOLDER,
        "candidates.html"
    )


@app.route("/create-job.html")
def create_job_page():
    if not session.get("recruiter_id"):
        return redirect("/login.html")

    return send_from_directory(
        FRONTEND_FOLDER,
        "create-job.html"
    )


@app.route("/screening.html")
def screening_page():
    if not session.get("recruiter_id"):
        return redirect("/login.html")

    return send_from_directory(
        FRONTEND_FOLDER,
        "screening.html"
    )


# =========================================================
# UPLOADED FILES
# =========================================================

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )


# =========================================================
# REGISTER
# =========================================================

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json(silent=True) or {}

        name = str(
            data.get("name", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip().lower()

        password = data.get(
            "password",
            ""
        )

        company_name = str(
            data.get("company_name", "")
        ).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Name is required."
            }), 400

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required."
            }), 400

        if not password:
            return jsonify({
                "success": False,
                "message": "Password is required."
            }), 400

        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters."
            }), 400

        if Recruiter.query.filter_by(email=email).first():
            return jsonify({
                "success": False,
                "message": "Email already registered."
            }), 409

        recruiter = Recruiter(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            company_name=company_name or None
        )

        db.session.add(recruiter)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Recruiter registered successfully!",
            "recruiter": recruiter_data(recruiter)
        }), 201

    except Exception as error:
        db.session.rollback()
        app.logger.exception("Registration error")

        return jsonify({
            "success": False,
            "message": f"Registration failed: {error}"
        }), 500


# =========================================================
# LOGIN
# =========================================================

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True) or {}

        email = str(
            data.get("email", "")
        ).strip().lower()

        password = data.get(
            "password",
            ""
        )

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required."
            }), 400

        recruiter = Recruiter.query.filter_by(
            email=email
        ).first()

        if not recruiter or not check_password_hash(
            recruiter.password_hash,
            password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        session.clear()
        session["recruiter_id"] = recruiter.id

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "recruiter": recruiter_data(recruiter)
        })

    except Exception as error:
        app.logger.exception("Login error")

        return jsonify({
            "success": False,
            "message": f"Login failed: {error}"
        }), 500


# =========================================================
# LOGOUT
# =========================================================

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out successfully."
    })


# =========================================================
# CURRENT RECRUITER
# =========================================================

@app.route("/me", methods=["GET"])
def current_recruiter():
    recruiter = recruiter_from_session()

    if not recruiter:
        session.clear()

        return jsonify({
            "authenticated": False
        })

    return jsonify({
        "authenticated": True,
        "recruiter": recruiter_data(recruiter)
    })


# =========================================================
# UPDATE RECRUITER PROFILE
# =========================================================

@app.route("/profile/update", methods=["POST"])
def update_profile():
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    try:
        name = request.form.get(
            "name",
            ""
        ).strip()

        company_name = request.form.get(
            "company_name",
            ""
        ).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Recruiter name is required."
            }), 400

        recruiter.name = name
        recruiter.company_name = company_name or None

        profile_photo = request.files.get(
            "profile_photo"
        )

        if profile_photo and profile_photo.filename:
            extension = (
                os.path.splitext(
                    profile_photo.filename
                )[1]
                .lower()
                .lstrip(".")
            )

            if extension not in ALLOWED_PROFILE_EXTENSIONS:
                return jsonify({
                    "success": False,
                    "message": "Profile photo must be PNG, JPG, JPEG or WEBP."
                }), 400

            filename = (
                f"recruiter_{recruiter.id}_"
                f"{uuid.uuid4().hex}.{extension}"
            )

            profile_photo.save(
                os.path.join(
                    PROFILE_FOLDER,
                    filename
                )
            )

            recruiter.profile_photo = (
                f"/uploads/profiles/{filename}"
            )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully.",
            "recruiter": recruiter_data(recruiter)
        })

    except Exception as error:
        db.session.rollback()
        app.logger.exception("Profile update error")

        return jsonify({
            "success": False,
            "message": f"Profile update failed: {error}"
        }), 500

# =========================================================
# LOGOUT
# =========================================================




# =========================================================
# DELETE RECRUITER ACCOUNT
# =========================================================

@app.route("/delete-account", methods=["POST"])
def delete_account():

    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "You are not logged in."
        }), 401

    try:

        recruiter_id = recruiter.id

        # -------------------------------------------------
        # DELETE JOBS CREATED BY THIS RECRUITER
        # -------------------------------------------------

        Job.query.filter_by(
            recruiter_id=recruiter_id
        ).delete(
            synchronize_session=False
        )

        # -------------------------------------------------
        # DELETE RECRUITER
        # -------------------------------------------------

        db.session.delete(recruiter)

        db.session.commit()

        # -------------------------------------------------
        # CLEAR LOGIN SESSION
        # -------------------------------------------------

        session.clear()

        return jsonify({
            "success": True,
            "message": "Account deleted successfully."
        })

    except Exception as error:

        db.session.rollback()

        app.logger.exception(
            "Account deletion failed"
        )

        return jsonify({
            "success": False,
            "message": "Unable to delete account."
        }), 500
# =========================================================
# DASHBOARD
# =========================================================

@app.route("/dashboard", methods=["GET"])
def dashboard():
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    jobs = (
        Job.query
        .filter_by(recruiter_id=recruiter.id)
        .order_by(Job.created_at.desc())
        .all()
    )

    all_candidates = (
        Candidate.query
        .join(Job)
        .filter(
            Job.recruiter_id == recruiter.id
        )
        .all()
    )

    return jsonify({
        "success": True,
        "recruiter": recruiter_data(recruiter),
        "statistics": {
            "total_jobs": len(jobs),
            "active_jobs": sum(
                1
                for job in jobs
                if (job.status or "Active") == "Active"
            ),
            "total_candidates": len(all_candidates),
            "shortlisted_candidates": sum(
                1
                for candidate in all_candidates
                if candidate.recommendation == "Recommended"
            )
        },
        "jobs": [
            job_to_dict(job)
            for job in jobs
        ]
    })


# =========================================================
# CREATE JOB
# =========================================================

@app.route("/jobs", methods=["POST"])
def create_job():
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json(silent=True) or {}

    title = str(
        data.get("job_title", "")
    ).strip()

    description = str(
        data.get("job_description", "")
    ).strip()

    if not title:
        return jsonify({
            "success": False,
            "message": "Job title is required."
        }), 400

    if not description:
        return jsonify({
            "success": False,
            "message": "Job description is required."
        }), 400

    job = Job(
        recruiter_id=recruiter.id,
        title=title,
        description=description,
        status="Active"
    )

    db.session.add(job)
    db.session.commit()

    required_skills = extract_skills(
        preprocess_text(description)
    )

    return jsonify({
        "success": True,
        "message": "Job created successfully!",
        "job": {
            "id": job.id,
            "recruiter_id": job.recruiter_id,
            "job_title": job.title,
            "job_description": job.description,
            "required_skills": required_skills,
            "status": job.status
        }
    }), 201

# =========================================================
# DELETE JOB
# =========================================================

@app.route(
    "/jobs/<int:job_id>",
    methods=["DELETE"]
)
def delete_job(job_id):

    recruiter_id = session.get(
        "recruiter_id"
    )

    if not recruiter_id:

        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401


    # -----------------------------------------------------
    # FIND JOB
    # -----------------------------------------------------

    job = db.session.get(
        Job,
        job_id
    )


    if not job:

        return jsonify({
            "success": False,
            "message": "Job not found."
        }), 404


    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if job.recruiter_id != recruiter_id:

        return jsonify({
            "success": False,
            "message":
                "You do not have permission to delete this job."
        }), 403


    try:

        # -------------------------------------------------
        # DELETE SCREENED CANDIDATES FIRST
        # -------------------------------------------------

        Candidate.query.filter_by(
            job_id=job.id
        ).delete(
            synchronize_session=False
        )


        # -------------------------------------------------
        # DELETE JOB
        # -------------------------------------------------

        db.session.delete(
            job
        )

        db.session.commit()


        return jsonify({

            "success": True,

            "message":
                "Job deleted successfully."

        })


    except Exception as error:

        db.session.rollback()

        app.logger.exception(
            "Job deletion failed"
        )

        return jsonify({

            "success": False,

            "message":
                f"Unable to delete job: {error}"

        }), 500

# =========================================================
# GET RECRUITER JOBS
# =========================================================

@app.route("/jobs", methods=["GET"])
def get_jobs():
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    jobs = (
        Job.query
        .filter_by(recruiter_id=recruiter.id)
        .order_by(Job.created_at.desc())
        .all()
    )

    return jsonify({
        "success": True,
        "jobs": [
            job_to_dict(job)
            for job in jobs
        ]
    })


# =========================================================
# SCREEN RESUMES
# =========================================================

@app.route("/screen", methods=["POST"])
def screen_resumes():
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    job_id = request.form.get("job_id")
    job = None

    if job_id:
        try:
            job_id = int(job_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Invalid job ID."
            }), 400

        job = db.session.get(Job, job_id)

        if not job:
            return jsonify({
                "success": False,
                "message": "Job not found."
            }), 404

        if not owns_job(job, recruiter.id):
            return jsonify({
                "success": False,
                "message": "You do not have access to this job."
            }), 403

        job_description = job.description

    else:
        job_description = request.form.get(
            "job_description",
            ""
        ).strip()

        if not job_description:
            return jsonify({
                "success": False,
                "message": "Please select a job or enter a job description."
            }), 400

        job_title = request.form.get(
            "job_title",
            "Resume Screening Job"
        ).strip()

        job = Job(
            recruiter_id=recruiter.id,
            title=job_title,
            description=job_description,
            status="Active"
        )

        db.session.add(job)
        db.session.commit()

    resumes = request.files.getlist("resumes")

    if not resumes:
        return jsonify({
            "success": False,
            "message": "Please upload at least one resume."
        }), 400

    # Remove previous results for the same job.
    Candidate.query.filter_by(
        job_id=job.id
    ).delete(
        synchronize_session=False
    )

    db.session.commit()

    clean_job_description = preprocess_text(
        job_description
    )

    required_skills = extract_skills(
        clean_job_description
    )

    results = []
    candidate_texts = []

    for resume in resumes:
        if not resume or not resume.filename:
            continue

        original_filename = secure_filename(
            resume.filename
        )

        if not original_filename:
            continue

        unique_filename = (
            f"{uuid.uuid4().hex}_"
            f"{original_filename}"
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            unique_filename
        )

        resume.save(file_path)

        try:
            resume_text = extract_text_from_pdf(
                file_path
            )
        except Exception as error:
            app.logger.warning(
                "PDF extraction failed for %s: %s",
                original_filename,
                error
            )
            resume_text = ""

        clean_text = preprocess_text(
            resume_text
        )
        rag_analysis = generate_rag_analysis(
           resume_text,
           job_description
        )

        candidate_texts.append(
            clean_text
        )

        candidate_skills = extract_skills(
            clean_text
        )

        (
            matched_skills,
            missing_skills,
            skill_match_score
        ) = compare_skills(
            required_skills,
            candidate_skills
        )

        results.append({
            "candidate": original_filename,
            "ai_analysis": rag_analysis,
            "skills": candidate_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "skill_match_score": round(
                skill_match_score,
                2
            ),
            "similarity_score": 0.0,
            "overall_score": 0.0,
            "text_length": len(resume_text),
            "clean_text_preview": clean_text[:200],
            "resume_path": file_path
        })

    if not results:
        return jsonify({
            "success": False,
            "message": "No valid resume files were uploaded."
        }), 400

    # =====================================================
    # TF-IDF SIMILARITY
    # =====================================================

    documents = [
        clean_job_description
    ] + candidate_texts

    if (
        len(documents) > 1
        and all(
            text.strip()
            for text in documents
        )
    ):
        try:
            vectorizer = TfidfVectorizer()
            matrix = vectorizer.fit_transform(documents)
            job_vector = matrix[0]

            for index, result in enumerate(results):
                similarity = cosine_similarity(
                    job_vector,
                    matrix[index + 1]
                )[0][0]

                result["similarity_score"] = round(
                    similarity * 100,
                    2
                )

        except Exception as error:
            app.logger.warning(
                "TF-IDF error: %s",
                error
            )

    # =====================================================
    # FINAL SCORE + RECOMMENDATION
    # =====================================================

    for result in results:
        overall_score = (
            0.5 * result["similarity_score"]
            + 0.5 * result["skill_match_score"]
        )

        result["overall_score"] = round(
            overall_score,
            2
        )

    results.sort(
        key=lambda item: item["overall_score"],
        reverse=True
    )

    for rank, result in enumerate(
        results,
        start=1
    ):
        result["rank"] = rank

        if result["overall_score"] >= 70:
            result["recommendation"] = "Recommended"
        elif result["overall_score"] >= 50:
            result["recommendation"] = "Consider"
        else:
            result["recommendation"] = "Low Match"

    # =====================================================
    # SAVE SCREENING RESULTS
    # =====================================================

    for result in results:
        candidate = Candidate(
            job_id=job.id,
            candidate_name=result["candidate"],
            resume_filename=result["candidate"],
            resume_path=result["resume_path"],
            text_length=result["text_length"],
            skills=", ".join(result["skills"]),
            matched_skills=", ".join(
                result["matched_skills"]
            ),
            missing_skills=", ".join(
                result["missing_skills"]
            ),
            skill_match_score=result["skill_match_score"],
            similarity_score=result["similarity_score"],
            overall_score=result["overall_score"],
            ai_analysis=result["ai_analysis"],
            rank=result["rank"],
            recommendation=result["recommendation"]
        )

        db.session.add(candidate)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Resume screening successful!",
        "job_id": job.id,
        "job_title": job.title,
        "required_skills": required_skills,
        "resume_count": len(results),
        "results": results
    })


# =========================================================
# GET CANDIDATES FOR A JOB
# =========================================================

@app.route(
    "/jobs/<int:job_id>/candidates",
    methods=["GET"]
)
def get_job_candidates(job_id):
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    job = db.session.get(
        Job,
        job_id
    )

    if not job:
        return jsonify({
            "success": False,
            "message": "Job not found."
        }), 404

    if not owns_job(job, recruiter.id):
        return jsonify({
            "success": False,
            "message": "You do not have access to this job."
        }), 403

    candidates = (
        Candidate.query
        .filter_by(job_id=job.id)
        .order_by(Candidate.rank.asc())
        .all()
    )

    return jsonify({
        "success": True,
        "job": {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "status": job.status
        },
        "candidates": [
            candidate_to_dict(candidate)
            for candidate in candidates
        ]
    })


# =========================================================
# GET SINGLE CANDIDATE
# =========================================================

@app.route(
    "/candidates/<int:candidate_id>",
    methods=["GET"]
)
def get_candidate(candidate_id):
    recruiter = recruiter_from_session()

    if not recruiter:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    candidate = db.session.get(
        Candidate,
        candidate_id
    )

    if not candidate:
        return jsonify({
            "success": False,
            "message": "Candidate not found."
        }), 404

    if (
        not candidate.job
        or candidate.job.recruiter_id != recruiter.id
    ):
        return jsonify({
            "success": False,
            "message": "You do not have access to this candidate."
        }), 403

    return jsonify({
        "success": True,
        "candidate": candidate_to_dict(candidate)
    })


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/health")
def health():
    return jsonify({
        "success": True,
        "message": "Resume Screening API is running."
    })


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

with app.app_context():
    db.create_all()

    columns = db.session.execute(
        db.text("PRAGMA table_info(candidates)")
    ).fetchall()

    column_names = {column[1] for column in columns}

    if "ai_analysis" not in column_names:
        db.session.execute(
            db.text("ALTER TABLE candidates ADD COLUMN ai_analysis TEXT")
        )
        db.session.commit()

# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    app.run(
        debug=True
    )