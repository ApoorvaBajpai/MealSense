import pytest
import numpy as np
from app.intervals.conformal import ConformalIntervalCalibrator

def test_conformal_interval_coverage_on_known_residuals():
    """Verify that split conformal calibrator produces lower <= upper and sensible bounds."""
    calibrator = ConformalIntervalCalibrator(target_coverage=0.80)
    rng = np.random.default_rng(42)

    # 50 simulated residuals centered at 0 with 2% std dev
    residuals = list(rng.normal(0, 0.02, size=50))
    registered = 500
    pred = 350.0

    lower, upper, confidence, reason, meta = calibrator.compute_intervals(
        predicted_headcount=pred,
        registered_snapshot=registered,
        residuals=residuals,
        response_rate=0.75,
    )

    assert lower <= pred <= upper, f"Interval [{lower}, {upper}] does not bracket point estimate {pred}"
    assert upper <= registered * 1.05
    assert confidence in ["medium", "high"]
    assert meta["target_coverage"] == 0.80

def test_conformal_fallback_on_sparse_history():
    """When residuals < 15, fallback to binomial standard deviation and force low confidence."""
    calibrator = ConformalIntervalCalibrator(target_coverage=0.80)
    sparse_residuals = [0.01, -0.02, 0.005]  # only 3 residuals

    lower, upper, confidence, reason, meta = calibrator.compute_intervals(
        predicted_headcount=300.0,
        registered_snapshot=400,
        residuals=sparse_residuals,
    )

    assert confidence == "low"
    assert "only 3 historical meals available" in reason
    assert meta["method"] == "fallback_binomial"
