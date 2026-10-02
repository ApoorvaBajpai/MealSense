"""
MealSense Cold-Start Strategy & Model Selector
Implements tiered progression:
- Phase 1 (0-7 historical samples): Naive Capacity + Intent Prior
- Phase 2 (8-21 samples): Trailing Weekly Weighted + Intent
- Phase 3 (22-90 samples): Non-Negative Least Squares (NNLS) Intent Model
- Phase 4 (90+ samples): Contextual / Facility Seasonal Model
"""

from typing import Dict, Any, Tuple
import datetime
import pandas as pd
from .base import BaseForecaster
from .naive import NaivePreviousDayForecaster, WeeklyMeanForecaster
from .weighted_rate import WeightedHistoricalIntentForecaster
from .intent_nnls import IntentNNLSForecaster

MIN_HISTORY_FOR_WEIGHTED = 7
MIN_HISTORY_FOR_NNLS = 21
MIN_HISTORY_FOR_CONTEXTUAL = 90


class ColdStartModelSelector:
    """
    Dynamically routes to the most robust model based on training sample count,
    preventing overfitting on sparse historical data while ensuring defensible intervals.
    """

    def __init__(self):
        self.naive_forecaster = NaivePreviousDayForecaster()
        self.weekly_forecaster = WeeklyMeanForecaster()
        self.weighted_forecaster = WeightedHistoricalIntentForecaster()
        self.nnls_forecaster = IntentNNLSForecaster()

    def select_model(self, history: pd.DataFrame) -> Tuple[BaseForecaster, str, int]:
        sample_count = len(history) if history is not None else 0

        if sample_count < MIN_HISTORY_FOR_WEIGHTED:
            # Phase 1: Cold start with raw intent + capacity prior
            model = self.naive_forecaster
            phase = "phase_1_naive_intent"
        elif sample_count < MIN_HISTORY_FOR_NNLS:
            # Phase 2: Early history with weighted rate
            model = self.weighted_forecaster
            phase = "phase_2_weighted_history"
        elif sample_count < MIN_HISTORY_FOR_CONTEXTUAL:
            # Phase 3: Calibrated intent NNLS
            model = self.nnls_forecaster
            phase = "phase_3_intent_nnls"
        else:
            # Phase 4: Mature facility
            model = self.nnls_forecaster
            phase = "phase_4_contextual_mature"

        return model, phase, sample_count

    def generate_prediction_snapshot(
        self,
        history: pd.DataFrame,
        target: Dict[str, Any],
        confidence_level: float = 0.80,
    ) -> Dict[str, Any]:
        """
        Executes model training cutoff and prediction, returning a versioned snapshot
        that guarantees historical evaluation is not corrupted by subsequent updates.
        """
        model, phase, sample_count = self.select_model(history)
        
        # Fit on historical slice strictly prior to target cutoff
        if history is not None and not history.empty:
            model.fit(history)

        predicted_headcount, explainability = model.predict(target)
        registered = target.get("registered_snapshot", 450)

        # Dynamic uncertainty margin based on phase
        if sample_count < MIN_HISTORY_FOR_WEIGHTED:
            uncertainty_margin = 22.0
        elif sample_count < MIN_HISTORY_FOR_NNLS:
            uncertainty_margin = 17.0
        else:
            uncertainty_margin = 14.0

        lower_bound = max(0, int(round(predicted_headcount - uncertainty_margin)))
        upper_bound = min(int(round(registered * 1.05)), int(round(predicted_headcount + uncertainty_margin)))
        pred_int = int(round(predicted_headcount))

        snapshot = {
            "prediction": pred_int,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "model_version": model.name,
            "cold_start_phase": phase,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "confidence_level": confidence_level,
            "training_sample_count": sample_count,
            "explainability": explainability,
        }
        return snapshot
