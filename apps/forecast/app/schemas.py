from typing import Literal, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from uuid import UUID

ForecastStage = Literal["history_only", "with_intent"]
ConfidenceLevel = Literal["low", "medium", "high"]

class PredictRequest(BaseModel):
    meal_id: UUID
    stage: ForecastStage
    model_version: Optional[str] = None
    safety_buffer: float = Field(default=0.5, ge=0.0, le=1.0)

class PredictResponse(BaseModel):
    meal_id: UUID
    stage: ForecastStage
    predicted: int
    lower: int
    upper: int
    confidence: ConfidenceLevel
    confidence_reason: str
    model_version: str
    features: Dict[str, Any]
    suggested_servings: int
    safety_buffer_used: float

class BacktestRequest(BaseModel):
    hostel_id: UUID
    model_version: Optional[str] = "v1-intent"
    window_days: int = Field(default=60, ge=14, le=365)
    meal_type: Optional[str] = None

class BacktestResponse(BaseModel):
    model_version: str
    hostel_id: UUID
    meal_type: Optional[str]
    window: str
    mae: float
    mape: float
    bias: float
    coverage: float
    n: int

class ModelInfo(BaseModel):
    version: str
    description: str
    status: Literal["shadow", "champion", "retired"]

class CalibrationStatus(BaseModel):
    hostel_id: UUID
    meal_type: str
    stage: ForecastStage
    sample_size: int
    q_lo: float
    q_hi: float
    coverage_estimate: float
