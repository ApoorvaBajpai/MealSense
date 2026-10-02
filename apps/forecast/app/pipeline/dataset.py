from typing import Dict, Any, List
import pandas as pd
import numpy as np
from datetime import date, timedelta, datetime

def generate_synthetic_historical_meals(
    hostel_id: str,
    n_days: int = 60,
    registered: int = 450,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generates synthetic historical meal dataset with known ground truth parameters:
      a (eat show-up) = 0.95
      b (skip show-up) = 0.04
      c (non-responder show-up) = 0.72
    Used for automated tests, standalone execution, and calibration verification.
    """
    rng = np.random.default_rng(seed)
    base_date = date.today() - timedelta(days=n_days)
    records = []

    meal_types = ["breakfast", "lunch", "dinner"]
    meal_weights = {"breakfast": 0.65, "lunch": 0.82, "dinner": 0.76}

    for day_offset in range(n_days):
        current_date = base_date + timedelta(days=day_offset)
        weekday = current_date.weekday()

        # Exam flag every 30 days
        is_exam = (day_offset % 30) in [25, 26, 27]
        impact = "lower" if is_exam else "neutral"

        for m_type in meal_types:
            starts_at = datetime.combine(current_date, datetime.min.time()) + timedelta(hours=12)

            # Response propensity (60% - 85% respond)
            response_propensity = rng.uniform(0.60, 0.85)
            n_responded = int(registered * response_propensity)

            # Base meal appetite
            base_rate = meal_weights[m_type]
            if is_exam:
                base_rate *= 0.88

            # Eaters vs skippers
            n_eat = int(n_responded * base_rate)
            n_skip = n_responded - n_eat
            n_unresponded = registered - n_responded

            # Known ground truth formula with slight noise:
            # actual = a * n_eat + b * n_skip + c * n_unresponded + noise
            true_a = 0.95
            true_b = 0.04
            true_c = 0.72

            expected_attendance = (true_a * n_eat) + (true_b * n_skip) + (true_c * n_unresponded)
            noise = rng.normal(0, 5.0)
            actual_count = int(np.clip(round(expected_attendance + noise), 0, registered * 1.05))

            records.append({
                "meal_id": f"syn-{day_offset}-{m_type}",
                "hostel_id": hostel_id,
                "meal_date": current_date.isoformat(),
                "meal_type": m_type,
                "starts_at": starts_at.isoformat(),
                "weekday": weekday,
                "registered_snapshot": registered,
                "n_eat": n_eat,
                "n_skip": n_skip,
                "n_unresponded": n_unresponded,
                "actual_count": actual_count,
                "calendar_impact": impact,
                "status": "closed",
            })

    return pd.DataFrame(records)
