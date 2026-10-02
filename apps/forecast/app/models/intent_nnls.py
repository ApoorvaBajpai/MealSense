from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from scipy.optimize import nnls
from .base import BaseForecaster

class IntentNNLSForecaster(BaseForecaster):
    """
    v1-intent: Intent-adjusted forecasting using Non-Negative Least Squares.
    Estimates empirical conversion rates:
      Actual ≈ a * n_eat + b * n_skip + c * n_unresponded
    where:
      a = probability that a student who confirmed 'eat' actually shows up (expected ~0.90-0.98)
      b = probability that a student who confirmed 'skip' unexpectedly shows up (expected ~0.02-0.08)
      c = probability that a non-responding student shows up (expected ~0.60-0.80)
    """

    def __init__(self, min_sample_size: int = 20):
        self.min_sample_size = min_sample_size
        # Defaults (priors)
        self.a: float = 0.94
        self.b: float = 0.04
        self.c: float = 0.72
        self.is_fitted: bool = False
        self.n_samples: int = 0

    @property
    def name(self) -> str:
        return "v1-intent"

    def fit(self, history: pd.DataFrame) -> "IntentNNLSForecaster":
        """Fit NNLS coefficients on historical closed meals with verified intent counts."""
        if history.empty:
            return self

        # Filter rows that have intent counts and actual counts
        valid_rows = history.dropna(subset=["actual_count", "n_eat", "n_skip", "registered_snapshot"]).copy()
        valid_rows = valid_rows[valid_rows["registered_snapshot"] > 0]

        self.n_samples = len(valid_rows)
        if self.n_samples < self.min_sample_size:
            # Fall back to prior rates, updating c with historical average
            if not valid_rows.empty:
                self.c = float(np.clip(valid_rows["actual_count"].sum() / valid_rows["registered_snapshot"].sum(), 0.50, 0.85))
            return self

        # Feature matrix X: [n_eat, n_skip, n_unresponded]
        valid_rows["n_unresponded"] = (valid_rows["registered_snapshot"] - valid_rows["n_eat"] - valid_rows["n_skip"]).clip(lower=0)
        
        X = valid_rows[["n_eat", "n_skip", "n_unresponded"]].values.astype(float)
        y = valid_rows["actual_count"].values.astype(float)

        # Solve non-negative least squares
        weights, _ = nnls(X, y)

        # Regularize and constrain within realistic behavioral bounds
        # a in [0.75, 1.00], b in [0.00, 0.20], c in [0.40, 0.95]
        self.a = float(np.clip(weights[0], 0.75, 1.00))
        self.b = float(np.clip(weights[1], 0.00, 0.20))
        self.c = float(np.clip(weights[2], 0.40, 0.95))
        self.is_fitted = True

        return self

    def predict(self, target: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        registered = int(target.get("registered_snapshot", 450))
        n_eat = int(target.get("n_eat", 0))
        n_skip = int(target.get("n_skip", 0))
        n_unresponded = max(0, registered - n_eat - n_skip)

        # Intent formula
        expected_headcount = (self.a * n_eat) + (self.b * n_skip) + (self.c * n_unresponded)

        # Bound prediction between 0 and 105% of registered population
        bounded_headcount = float(np.clip(expected_headcount, 0, registered * 1.05))

        response_rate = (n_eat + n_skip) / max(1, registered)

        features = {
            "model": self.name,
            "fitted_on_samples": self.n_samples,
            "coef_eat_a": round(self.a, 3),
            "coef_skip_b": round(self.b, 3),
            "coef_unresponded_c": round(self.c, 3),
            "n_eat": n_eat,
            "n_skip": n_skip,
            "n_unresponded": n_unresponded,
            "response_rate": round(float(response_rate), 4),
            "intent_impact_vs_unresponded": round(float((self.a - self.c) * n_eat + (self.b - self.c) * n_skip), 1),
        }

        return bounded_headcount, features
