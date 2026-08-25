def calculate_overall_score(similarity_score, skill_match_score,
                            similarity_weight=0.60,
                            skill_weight=0.40):

    overall_score = (
        similarity_score * similarity_weight
        + skill_match_score * skill_weight
    )

    return overall_score


def rank_candidates(candidates):
    return sorted(
        candidates,
        key=lambda candidate: candidate["overall_score"],
        reverse=True
    )

def get_recommendation(
    overall_score,
    highly_recommended_threshold=90,
    recommended_threshold=75,
    consider_threshold=60
):
    if overall_score >= highly_recommended_threshold:
        return "Highly Recommended"

    elif overall_score >= recommended_threshold:
        return "Recommended"

    elif overall_score >= consider_threshold:
        return "Consider"

    else:
        return "Low Match"