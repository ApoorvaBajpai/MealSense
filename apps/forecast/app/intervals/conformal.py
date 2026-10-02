from typing import List, Tuple, Dict, Any, Literal
import numpy as np

ConfidenceLevel = Literal["low", "medium", "high"]

class ConformalIntervalCalibrator:
    """
    Split Conformal Prediction Interval Calibrator.
    Computes distribution-free calibrated prediction intervals based on
    rolling walk-forward residuals on the attendance rate scale.
    """

    def __init__(self, target_coverage: float = 0.80, min_history_size: int = 15):
        self.target_coverage = target_coverage
        self.min_history_size = min_history_size
        # Quantile levels for 80% two-sided interval: [0.10, 0.90]
        alpha = 1.0 - target_coverage
        self.q_bottom = alpha / 2.0  # 0.10
        self.q_top = 1.0 - (alpha / 2.0)  # 0.90

    def compute_intervals(
        self,
        predicted_headcount: float,
        registered_snapshot: int,
        residuals: List[float],  # List of (actual_count - predicted_count) / registered_snapshot
        response_rate: float = 0.0,
        has_anomaly: bool = False,
    ) -> Tuple[int, int, ConfidenceLevel, str, Dict[str, Any]]:
        """
        Returns:
            lower_bound (int),
            upper_bound (int),
            confidence_level ("low" | "medium" | "high"),
            confidence_reason (str),
            metadata (dict)
        """
        if registered_snapshot <= 0:
            return int(predicted_headcount), int(predicted_headcount), "low", "Invalid registered student count", {}

        n_residuals = len(residuals)

        # Fallback if sparse residual history
        if n_residuals < self.min_history_size:
            # Conservative binomial standard error fallback
            p = max(0.1, min(0.9, predicted_headcount / registered_snapshot))
            std_err = np.sqrt((p * (1.0 - p)) / max(10, registered_snapshot))
            # 80% normal z-score ≈ 1.282, plus a safety margin
            margin_rate = max(0.08, 1.282 * std_err + 0.04)

            q_lo = -margin_rate
            q_hi = margin_rate

            lower = int(np.clip(predicted_headcount + (q_lo * registered_snapshot), 0, registered_snapshot * 1.05))
            upper = int(np.clip(predicted_headcount + (q_hi * registered_snapshot), lower, registered_snapshot * 1.05))

            reason = f"Low confidence: only {n_residuals} historical meals available (minimum {self.min_history_size} required)"
            return lower, upper, "low", reason, {
                "method": "fallback_binomial",
                "sample_size": n_residuals,
                "margin_rate": round(float(margin_rate), 4),
            }

        # Conformal quantile estimation
        sorted_residuals = np.sort(residuals)
        q_lo = float(np.percentile(sorted_residuals, self.q_bottom * 100))
        q_hi = float(np.percentile(sorted_residuals, self.q_top * 100))

        raw_lower = predicted_headcount + (q_lo * registered_snapshot)
        raw_upper = predicted_headcount + (q_hi * registered_snapshot)

        lower = int(np.clip(raw_lower, 0, registered_snapshot * 1.05))
        upper = int(np.clip(raw_upper, lower, registered_snapshot * 1.05))

        # Evaluate relative interval width
        interval_width = upper - lower
        relative_width = interval_width / max(1.0, predicted_headcount)

        # Section 6.5 Confidence Label logic
        if n_residuals < 14 or relative_width >= 0.20 or has_anomaly:
            confidence: ConfidenceLevel = "low"
            if has_anomaly:
                reason = "Low confidence: scheduled anomaly (exam/event) in effect"
            elif relative_width >= 0.20:
                reason = f"Low confidence: wide uncertainty band ({round(relative_width * 100, 1)}% relative width)"
            else:
                reason = f"Low confidence: limited sample size ({n_residuals} meals)"
        elif relative_width >= 0.10:
            confidence = "medium"
            reason = f"Medium confidence: {round(relative_width * 100, 1)}% prediction interval band"
        else:
            if response_rate >= 0.50:
                confidence = "high"
                reason = f"High confidence: tight interval ({round(relative_width * 100, 1)}% width) with {round(response_rate * 100, 1)}% student response"
            else:
                confidence = "medium"
                reason = f"Medium confidence: tight interval but response rate is {round(response_rate * 100, 1)}%"

        metadata = {
            "method": "split_conformal",
            "sample_size": n_residuals,
            "q_lo_rate": round(q_lo, 4),
            "q_hi_rate": round(q_hi, 4),
            "relative_width": round(float(relative_width), 4),
            "target_coverage": self.target_coverage,
        }

        return lower, upper, confidence, reason, metadata
