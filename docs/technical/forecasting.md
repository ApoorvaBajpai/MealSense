# MealSense: Forecasting Strategy, Conformal Intervals & Explainability

## 1. Cold-Start Model Progression

Institutional kitchens face a cold-start dilemma: a newly onboarded mess hall has zero historical attendance logs, while an established hall has years of seasonal trends. MealSense addresses this with a **4-Phase Tiered Model Selector**:

```
[ Phase 1: Zero History (Day 1 - 7) ]
  Model: v0-naive-intent
  Formula: 0.95 * n_eat + 0.05 * n_skip + 0.75 * n_unresponded
       │
       ▼ (History >= 7 meals)
[ Phase 2: Early History (Day 8 - 21) ]
  Model: v0-weekly-weighted
  Formula: Weighted historical day-of-week rate + Intent deltas
       │
       ▼ (History >= 21 meals)
[ Phase 3: Calibrated Intent (Day 22 - 90) ]
  Model: v1-intent (NNLS with Non-Negativity Constraints)
  Weights: α * n_eat + β * n_skip + γ * n_unresponded (optimized via residual minimization)
       │
       ▼ (History >= 90 meals)
[ Phase 4: Facility-Contextual (Mature Facility) ]
  Model: v2-contextual (NNLS + Day of Week + Weather + Menu Palatability Scores)
```

---

## 2. Split Conformal Prediction Engine

Point forecasts fail in operations because kitchens require uncertainty bounds. Traditional Gaussian confidence intervals assume normality, which fails during dining anomalies (e.g., midterm exams).

MealSense uses **Distribution-Free Split Conformal Prediction**:
1. Calibrate on the last $N = 30$ walk-forward residual errors:
   $$e_i = | \text{actual}_i - \hat{y}_i |$$
2. Compute the $(1 - \alpha)$-th quantile of residuals $q_{1-\alpha}$ where $\alpha = 0.20$ for an $80\%$ nominal coverage band:
   $$q = \text{Quantile}(e, \lceil (N+1)(1-\alpha) \rceil / N)$$
3. The valid prediction interval is:
   $$[ \text{lower}, \text{upper} ] = [ \max(0, \hat{y} - q), \min(\text{capacity}, \hat{y} + q) ]$$

---

## 3. Deterministic Explainability Layer

To prevent black-box distrust, MealSense generates deterministic, plain-language explanations:
- *Condition 1*: If $n_{\text{eat}} / \text{registered} > 0.70$:
  `"High student engagement: Over 70% of residents submitted intent, reducing uncertainty margin by 30%."`
- *Condition 2*: If $\text{meal\_type} = \text{'dinner'}$ AND $\text{day\_of\_week} = \text{'Friday'}$:
  `"Friday dinner pattern: Historical weekend departures reduce baseline participation by ~18%."`
- *Condition 3*: If $\text{actual} > \hat{y} \times 1.10$:
  `"Post-meal feedback: Realized attendance was 10% above projection; reviewing unresponded show-up rates."`
