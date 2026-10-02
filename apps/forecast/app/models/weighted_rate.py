from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from .base import BaseForecaster

class WeightedRateForecaster(BaseForecaster):
    """
    v1-weighted-rate: Default history-only forecasting model.
    Blends exponentially weighted same-weekday historical rates with recent trends
    and adjusts for scheduled calendar anomalies (exams, holidays).
    """

    def __init__(self, alpha: float = 0.35):
        self.alpha = alpha
        self._weekday_rates: Dict[int, float] = {}
        self._overall_recent_rate: float = 0.75
        self._calendar_multipliers = {
            "lower": 0.88,
            "neutral": 1.00,
            "higher": 1.08,
            "unknown": 1.00,
        }

    @property
    def name(self) -> str:
        return "v1-weighted-rate"

    def fit(self, history: pd.DataFrame) -> "WeightedRateForecaster":
        if history.empty or "actual_count" not in history.columns:
            return self

        df = history.sort_values("meal_date").copy()
        df["rate"] = df["actual_count"] / df["registered_snapshot"].clip(lower=1)

        # 1. Exponential moving average over recent meals
        df["ewm_rate"] = df["rate"].ewm(alpha=self.alpha).mean()
        self._overall_recent_rate = float(df["ewm_rate"].iloc[-1])

        # 2. Weekday-specific rates
        weekday_grouped = df.groupby("weekday")
        for wd, group in weekday_grouped:
            ewm_val = group["rate"].ewm(alpha=self.alpha).mean().iloc[-1]
            self._weekday_rates[int(wd)] = float(ewm_val)

        return self

    def predict(self, target: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        weekday = target.get("weekday", 0)
        registered = target.get("registered_snapshot", 450)
        calendar_impact = target.get("calendar_impact", "neutral")

        # Blend: 70% weekday rate, 30% recent global trend
        weekday_rate = self._weekday_rates.get(weekday, self._overall_recent_rate)
        blended_rate = 0.70 * weekday_rate + 0.30 * self._overall_recent_rate

        # Apply calendar adjustment factor
        multiplier = self._calendar_multipliers.get(calendar_impact, 1.00)
        final_rate = np.clip(blended_rate * multiplier, 0.05, 1.05)

        predicted_headcount = final_rate * registered

        features = {
            "model": self.name,
            "blended_base_rate": round(float(blended_rate), 4),
            "weekday_rate": round(float(weekday_rate), 4),
            "recent_trend_rate": round(float(self._overall_recent_rate), 4),
            "calendar_impact": calendar_impact,
            "calendar_multiplier": multiplier,
            "final_rate": round(float(final_rate), 4),
        }

        return predicted_headcount, features
