import pytest
import pandas as pd
import numpy as np
from app.models.intent_nnls import IntentNNLSForecaster
from app.models.weighted_rate import WeightedRateForecaster
from app.models.naive import NaivePreviousDayForecaster, WeeklyMeanForecaster

def test_intent_nnls_monotonicity():
    """Monotonicity test: More skips MUST NEVER increase the predicted attendance."""
    model = IntentNNLSForecaster()
    registered = 500

    target_baseline = {"registered_snapshot": registered, "n_eat": 300, "n_skip": 50}
    pred_baseline, _ = model.predict(target_baseline)

    # 50 more students change from unresponded to skip
    target_more_skips = {"registered_snapshot": registered, "n_eat": 300, "n_skip": 100}
    pred_more_skips, _ = model.predict(target_more_skips)

    assert pred_more_skips <= pred_baseline, "Forecast increased despite more students skipping!"

def test_intent_nnls_bounds():
    """Bounds test: 0 <= pred <= 1.05 * registered."""
    model = IntentNNLSForecaster()
    registered = 400

    # Extreme case: everyone eats
    pred_all_eat, _ = model.predict({"registered_snapshot": registered, "n_eat": registered, "n_skip": 0})
    assert 0 <= pred_all_eat <= registered * 1.05

    # Extreme case: everyone skips
    pred_all_skip, _ = model.predict({"registered_snapshot": registered, "n_eat": 0, "n_skip": registered})
    assert 0 <= pred_all_skip <= registered * 1.05

def test_degradation_on_empty_history():
    """Models must gracefully degrade with default priors when history is empty."""
    models = [
        NaivePreviousDayForecaster(),
        WeeklyMeanForecaster(),
        WeightedRateForecaster(),
        IntentNNLSForecaster(),
    ]
    empty_df = pd.DataFrame()
    target = {"registered_snapshot": 450, "weekday": 1, "n_eat": 200, "n_skip": 50}

    for m in models:
        m.fit(empty_df)
        pred, features = m.predict(target)
        assert pred > 0, f"{m.name} failed on empty history"
        assert isinstance(features, dict)
