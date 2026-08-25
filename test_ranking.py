from src.ranking import get_recommendation


scores = [92, 81, 65, 45]

for score in scores:
    recommendation = get_recommendation(score)

    print(score, "% ->", recommendation)