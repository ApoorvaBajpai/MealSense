from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
from ..models.base import BaseForecaster
from ..intervals.conformal import ConformalIntervalCalibrator

class WalkForwardBacktester:
    """
    Rolling-origin walk-forward backtest evaluator.
    Strictly prevents temporal leakage: for any meal evaluated at step t,
    only meals closed strictly prior to t are provided to model.fit().
    """

    def __init__(self, calibrator: ConformalIntervalCalibrator = None):
        self.calibrator = calibrator or ConformalIntervalCalibrator(target_coverage=0.80)

    def run_backtest(
        self,
        model: BaseForecaster,
        meals_df: pd.DataFrame,
        window_size: int = 60,
    ) -> Dict[str, Any]:
        """
        Executes rolling-origin backtest.
        meals_df must contain:
          ['meal_id', 'meal_date', 'starts_at', 'actual_count', 'registered_snapshot',
           'n_eat', 'n_skip', 'weekday', 'calendar_impact']
        """
        df = meals_df.sort_values("starts_at").reset_index(drop=True)
        n_total = len(df)

        if n_total < 10:
            return {
                "error": "Insufficient history for backtesting (minimum 10 meals)",
                "n": n_total,
                "mae": 0.0,
                "mape": 0.0,
                "bias": 0.0,
                "coverage": 0.0,
            }

        start_idx = max(5, n_total - window_size)

        errors: List[float] = []
        pct_errors: List[float] = []
        covered_list: List[bool] = []
        residuals_history: List[float] = []

        # Warm up initial residuals from earliest points
        for i in range(start_idx):
            act = float(df.iloc[i]["actual_count"])
            reg = float(df.iloc[i]["registered_snapshot"])
            # simple benchmark residual
            residuals_history.append((act - (0.75 * reg)) / max(1.0, reg))

        for step in range(start_idx, n_total):
            # Point-in-time slice: ONLY data prior to step
            training_slice = df.iloc[:step].copy()
            target_row = df.iloc[step].to_dict()

            # Train on point-in-time history
            model.fit(training_slice)

            # Predict
            pred, _ = model.predict(target_row)
            actual = float(target_row["actual_count"])
            registered = int(target_row["registered_snapshot"])

            # Compute intervals with historical residuals
            lower, upper, _, _, _ = self.calibrator.compute_intervals(
                predicted_headcount=pred,
                registered_snapshot=registered,
                residuals=residuals_history[-30:],  # last 30 residuals
                response_rate=(target_row.get("n_eat", 0) + target_row.get("n_skip", 0)) / max(1, registered),
            )

            # Evaluate metrics
            err = actual - pred
            errors.append(err)
            pct_errors.append(abs(err) / max(1.0, actual) * 100.0)
            is_covered = (actual >= lower) and (actual <= upper)
            covered_list.append(is_covered)

            # Update residuals for future steps
            residuals_history.append((actual - pred) / max(1.0, registered))

        n_eval = len(errors)
        mae = float(np.mean(np.abs(errors))) if n_eval > 0 else 0.0
        rmse = float(np.sqrt(np.mean(np.square(errors)))) if n_eval > 0 else 0.0
        mape = float(np.mean(pct_errors)) if n_eval > 0 else 0.0
        bias = float(np.mean(errors)) if n_eval > 0 else 0.0
        coverage = float(np.mean(covered_list) * 100.0) if n_eval > 0 else 0.0

        return {
            "model_version": model.name,
            "n": n_eval,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "bias": round(bias, 2),
            "coverage": round(coverage, 1),
        }
