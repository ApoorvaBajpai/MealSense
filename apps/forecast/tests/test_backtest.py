import pytest
from app.evaluation.backtest import WalkForwardBacktester
from app.models.intent_nnls import IntentNNLSForecaster
from app.models.weighted_rate import WeightedRateForecaster
from app.pipeline.dataset import generate_synthetic_historical_meals

def test_walk_forward_evaluation_improves_with_intent():
    """Verify that with-intent model achieves lower MAE than weighted-rate on synthetic intent data."""
    dataset = generate_synthetic_historical_meals(hostel_id="test-hostel", n_days=60, seed=42)
    backtester = WalkForwardBacktester()

    res_history = backtester.run_backtest(WeightedRateForecaster(), dataset, window_size=30)
    res_intent = backtester.run_backtest(IntentNNLSForecaster(), dataset, window_size=30)

    assert res_history["n"] == 30
    assert res_intent["n"] == 30
    # Intent model should significantly outperform history-only on this dataset
    assert res_intent["mae"] < res_history["mae"]
    assert res_intent["coverage"] >= 65.0  # Realized coverage in target range
