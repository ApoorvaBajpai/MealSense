from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import pandas as pd

class BaseForecaster(ABC):
    """Abstract base class for all attendance forecasting models."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def fit(self, history: pd.DataFrame) -> "BaseForecaster":
        """
        Train or calibrate on closed historical meals.
        history must strictly exclude any records at or after target meal cutoff.
        """
        pass

    @abstractmethod
    def predict(self, target: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        """
        Produce a point estimate of attendance.
        Returns: (predicted_headcount, features_dict_for_explainability)
        """
        pass
