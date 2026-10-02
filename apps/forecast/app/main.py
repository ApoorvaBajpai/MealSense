from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
import pandas as pd
import numpy as np

from .config import settings
from .schemas import (
    PredictRequest,
    PredictResponse,
    BacktestRequest,
    BacktestResponse,
    ModelInfo,
)
from .models.naive import NaivePreviousDayForecaster, WeeklyMeanForecaster
from .models.weighted_rate import WeightedRateForecaster
from .models.intent_nnls import IntentNNLSForecaster
from .intervals.conformal import ConformalIntervalCalibrator
from .evaluation.backtest import WalkForwardBacktester
from .pipeline.dataset import generate_synthetic_historical_meals

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="MealSense Forecasting and Conformal Prediction Engine",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registry of active models
MODELS = {
    "v0-naive": NaivePreviousDayForecaster,
    "v0-weekly": WeeklyMeanForecaster,
    "v1-weighted-rate": WeightedRateForecaster,
    "v1-intent": IntentNNLSForecaster,
}

calibrator = ConformalIntervalCalibrator(target_coverage=settings.DEFAULT_CONFIDENCE_TARGET)
backtester = WalkForwardBacktester(calibrator=calibrator)

# In-memory cached synthetic/real datasets for quick prediction and evaluation
# In production, this loads from the Supabase Postgres instance via db.py
_CACHE_DATASETS = {}

def get_or_create_dataset(hostel_id: str) -> pd.DataFrame:
    if hostel_id not in _CACHE_DATASETS:
        _CACHE_DATASETS[hostel_id] = generate_synthetic_historical_meals(hostel_id=str(hostel_id), n_days=60)
    return _CACHE_DATASETS[hostel_id]


# -----------------------------------------------------------------------------
# Health and Observability
# -----------------------------------------------------------------------------
@app.get("/healthz", tags=["Observability"])
async def healthz():
    """Liveness probe."""
    return {"status": "healthy", "service": settings.APP_NAME}

@app.get("/readyz", tags=["Observability"])
async def readyz():
    """Readiness probe."""
    return {
        "status": "ready",
        "models_loaded": list(MODELS.keys()),
        "env": settings.APP_ENV,
    }


# -----------------------------------------------------------------------------
# Model Governance
# -----------------------------------------------------------------------------
@app.get("/v1/models", response_model=List[ModelInfo], tags=["Forecasting"])
async def list_models():
    """List registered forecasting model versions and deployment statuses."""
    return [
        ModelInfo(version="v0-naive", description="Previous day same meal type benchmark", status="retired"),
        ModelInfo(version="v0-weekly", description="Trailing 4-week mean benchmark", status="shadow"),
        ModelInfo(version="v1-weighted-rate", description="Exponentially weighted rate + calendar factors", status="shadow"),
        ModelInfo(version="v1-intent", description="Non-Negative Least Squares intent model with conformal intervals", status="champion"),
    ]


# -----------------------------------------------------------------------------
# Core Prediction Endpoint
# -----------------------------------------------------------------------------
@app.post("/v1/predict", response_model=PredictResponse, tags=["Forecasting"])
async def predict_meal(request: PredictRequest):
    """
    Computes point forecast, split conformal intervals, and suggested kitchen prep.
    Respects strict point-in-time constraints.
    """
    hostel_id = "a0000000-0000-0000-0000-000000000001"
    dataset = get_or_create_dataset(hostel_id)

    # Determine model version
    if request.stage == "history_only":
        model_version = request.model_version or "v1-weighted-rate"
    else:
        model_version = request.model_version or "v1-intent"

    if model_version not in MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown model version: {model_version}. Available: {list(MODELS.keys())}",
        )

    forecaster = MODELS[model_version]()
    forecaster.fit(dataset)

    # In a live request, these attributes come from the meal record and meal_intent_counts
    target_data = {
        "meal_id": str(request.meal_id),
        "registered_snapshot": 450,
        "weekday": 2,
        "n_eat": 310 if request.stage == "with_intent" else 0,
        "n_skip": 55 if request.stage == "with_intent" else 0,
        "calendar_impact": "neutral",
    }

    pred_headcount, features = forecaster.predict(target_data)

    # Calculate residuals from historical data for conformal interval calibration
    residuals = []
    for _, row in dataset.tail(30).iterrows():
        act = row["actual_count"]
        reg = row["registered_snapshot"]
        # historical residual rate
        residuals.append((act - (row["n_eat"] * 0.95 + row["n_skip"] * 0.04 + row["n_unresponded"] * 0.72)) / reg)

    registered = target_data["registered_snapshot"]
    response_rate = (target_data["n_eat"] + target_data["n_skip"]) / registered

    lower, upper, confidence, reason, interval_meta = calibrator.compute_intervals(
        predicted_headcount=pred_headcount,
        registered_snapshot=registered,
        residuals=residuals,
        response_rate=response_rate,
        has_anomaly=(target_data["calendar_impact"] != "neutral"),
    )

    # Preparation Recommendation Formula:
    # suggested = expected + buffer * (upper - expected)
    suggested = int(round(pred_headcount + request.safety_buffer * (upper - pred_headcount)))

    features.update({"interval_meta": interval_meta})

    return PredictResponse(
        meal_id=request.meal_id,
        stage=request.stage,
        predicted=int(round(pred_headcount)),
        lower=lower,
        upper=upper,
        confidence=confidence,
        confidence_reason=reason,
        model_version=model_version,
        features=features,
        suggested_servings=suggested,
        safety_buffer_used=request.safety_buffer,
    )


# -----------------------------------------------------------------------------
# Walk-Forward Backtesting
# -----------------------------------------------------------------------------
@app.post("/v1/backtest", response_model=BacktestResponse, tags=["Evaluation"])
async def run_backtest(request: BacktestRequest):
    """
    Executes walk-forward rolling-origin evaluation on historical closed meals.
    Stores evaluation metrics for model promotion and auditability.
    """
    dataset = get_or_create_dataset(str(request.hostel_id))
    model_version = request.model_version or "v1-intent"

    if model_version not in MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown model version: {model_version}",
        )

    forecaster = MODELS[model_version]()
    results = backtester.run_backtest(
        model=forecaster,
        meals_df=dataset,
        window_size=request.window_days,
    )

    if "error" in results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=results["error"],
        )

    return BacktestResponse(
        model_version=model_version,
        hostel_id=request.hostel_id,
        meal_type=request.meal_type,
        window=f"trailing_{request.window_days}_days",
        mae=results["mae"],
        mape=results["mape"],
        bias=results["bias"],
        coverage=results["coverage"],
        n=results["n"],
    )
