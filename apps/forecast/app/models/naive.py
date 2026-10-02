from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from .base import BaseForecaster

class NaivePreviousDayForecaster(BaseForecaster):
    """v0-naive: Baseline model using the most recent observed meal of the same type."""

    def __init__(self):
        self._last_count = None
        self._last_rate = 0.75

    @property
    def name(self) -> str:
        return "v0-naive"

    def fit(self, history: pd.DataFrame) -> "NaivePreviousDayForecaster":
        if not history.empty and "actual_count" in history.columns:
            sorted_history = history.sort_values("meal_date", ascending=True)
            last_row = sorted_history.iloc[-1]
            self._last_count = float(last_row["actual_count"])
            if "registered_snapshot" in last_row and last_row["registered_snapshot"] > 0:
                self._last_rate = self._last_count / last_row["registered_snapshot"]
        return self

    def predict(self, target: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        registered = target.get("registered_snapshot", 450)
        if self._last_count is not None:
            pred = self._last_rate * registered
            return pred, {"baseline_type": "previous_meal", "prior_rate": round(self._last_rate, 4)}
        # Default prior if zero history
        return registered * 0.75, {"baseline_type": "default_prior", "prior_rate": 0.75}


class WeeklyMeanForecaster(BaseForecaster):
    """v0-weekly: Baseline model using trailing 4-week mean for the same meal type and weekday."""

    def __init__(self, trailing_weeks: int = 4):
        self.trailing_weeks = trailing_weeks
        self._weekday_rates: Dict[int, float] = {}

    @property
    def name(self) -> str:
        return "v0-weekly"

    def fit(self, history: pd.DataFrame) -> "WeeklyMeanForecaster":
        if not history.empty and "actual_count" in history.columns and "weekday" in history.columns:
            # Group by weekday and calculate mean rate
            history_copy = history.copy()
            history_copy["rate"] = history_copy["actual_count"] / history_copy["registered_snapshot"].clip(lower=1)
            # Take last N occurrences per weekday
            recent = history_copy.groupby("weekday").tail(self.trailing_weeks)
            self._weekday_rates = recent.groupby("weekday")["rate"].mean().to_dict()
        return self

    def predict(self, target: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        weekday = target.get("weekday", 0)
        registered = target.get("registered_snapshot", 450)
        rate = self._weekday_rates.get(weekday, 0.75)
        pred = rate * registered
        return pred, {"baseline_type": "weekly_mean", "weekday": weekday, "trailing_mean_rate": round(rate, 4)}
