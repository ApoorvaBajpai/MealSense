# MealSense: Intent-Weighted Demand Forecasting & Calibration Roadmap

> **Engineering & Product Specification**  
> Operational demand forecasting combining advance student signals with historical attendance, targeting transparent kitchen prep recommendations and calibrated uncertainty bounds.

---

## 1. Problem: Operational Uncertainty & Asymmetric Risk

Institutional kitchens prepare hundreds of meals hours before service begins. Chefs face severe asymmetric risk:
- **Under-preparation penalty (High)**: Running short of food during a dining service creates immediate operational failure, resident complaints, and administrative intervention.
- **Over-preparation penalty (Hidden)**: Preparing excessive food wastes institutional budget and edible food, but is quietly discarded into wet waste bins without immediate operational panic.

Because the penalty for running short is visible and acute, chefs add large, unassisted safety buffers (+15% to +30%), driving structural overproduction. MealSense transforms this dynamic by replacing gut-feel buffers with an **intent-weighted demand forecast** and an **explicit safety buffer** tied to an evaluated shortage guardrail ($< 0.5\%$).

---

## 2. Forecast Inputs & Telemetry Signals

For every meal service, the forecasting layer ingests five core inputs:
1. **Advance Intent Breakdown**:
   - $n_{\text{eat}}$: Count of verified student "Eat" responses submitted before the cutoff.
   - $n_{\text{skip}}$: Count of verified student "Skip" responses confirmed before the cutoff.
   - $n_{\text{late}}$: Count of late submissions received after the preparation cutoff.
2. **Eligible Dining Population**:
   - $N_{\text{registered}}$: Active registered student enrollment for the hostel or mess hall.
   - $n_{\text{unresponded}} = \max(0, N_{\text{registered}} - n_{\text{eat}} - n_{\text{skip}} - n_{\text{late}})$.
3. **Calendar & Service Context**:
   - `meal_type`: Breakfast, Lunch, or Dinner (each exhibiting distinct attendance baselines).
   - `day_of_week`: Day attributes (e.g., Friday dinner departures).
4. **Historical Service Outcomes**:
   - Walk-forward logs of actual attendance ($\text{actual}_i$) and prepared quantities ($\text{prepared}_i$).
5. **Kitchen Preparation Lead Time**:
   - Cutoff window enforced 2–3 hours prior to service to lock student inputs before batch cooking starts.

---

## 3. v0 Cold-Start Model (0–5 Historical Meals)

When an institutional mess hall is first onboarded, there is no historical attendance log to train statistical regression weights. MealSense uses a transparent, deterministic heuristic:

$$\hat{y}_{v0} = \text{round}\left( 0.75 \times N_{\text{registered}} \right)$$

- **Interval Bounds**:
  - $\text{lowerBound} = \text{round}\left( 0.70 \times N_{\text{registered}} \right)$
  - $\text{upperBound} = \text{round}\left( 0.80 \times N_{\text{registered}} \right)$
  - **Interval Target**: $80\%$ nominal target band ($\pm 5\%$ heuristic spread).
- **Safety Buffer**:
  - Automatically targets $\text{upperBound}$ so early kitchen operations prioritize zero shortages while collecting training records.

---

## 4. v1 Intent-Weighted Operational Model (6+ Historical Meals)

Once at least 6 historical services are logged, the forecast transitions to `v1-intent`. This model combines verified student intent with empirically estimated show-up probabilities:

$$\hat{y}_{v1} = \alpha \cdot n_{\text{eat}} + \beta \cdot n_{\text{skip}} + \gamma \cdot n_{\text{unresponded}}$$

- **Empirical Show-Up Parameters**:
  - $\alpha \approx 0.96$: High fidelity show-up rate among students who explicitly confirmed intent to eat.
  - $\beta \approx 0.04$: Low false-positive show-up rate among students who explicitly confirmed skip.
  - $\gamma \approx 0.65$: Baseline participation rate of the unresponded cohort, conditioned on meal type and day of week.
- **Decision Formula**:
  $$\text{Recommended Preparation} = \hat{y}_{v1} + \text{Safety Buffer}$$
  Where the safety buffer is sized to match the upper bound of the target prediction interval, ensuring shortage rates remain below $0.5\%$.

---

## 5. Prediction Interval Methodology

Point forecasts provide single numbers, but kitchen production requires a bounded range to manage operational volatility:

- **Target Coverage**: $80\%$ target prediction interval ($\alpha = 0.20$).
- **Variance Modeling**:
  $$\text{lowerBound} = \max(0, \hat{y} - \delta), \quad \text{upperBound} = \min(N_{\text{registered}}, \hat{y} + \delta)$$
  Where $\delta$ reflects historical residual variance ($1.28 \times \text{MAE}_{\text{historical}}$).
- **Kitchen Actionability**:
  Rather than presenting complex confidence intervals, the UI displays:
  - **Expected Turnout**: 348 diners
  - **Target Prediction Interval**: 334–362 attendees
  - **Safety Buffer**: +14 servings
  - **Recommended Cooking Target**: 362 servings

---

## 6. Current Prototype Limitations

1. **Local Storage Execution**: The current web application runs the intent-weighted heuristic entirely client-side using stored provider records.
2. **Target vs. Calibrated Intervals**: Prediction intervals represent target prediction intervals derived from sample error spreads rather than formally proven conformal coverage guarantees.
3. **Static Model Coefficients**: The $\alpha, \beta, \gamma$ coefficients use robust institutional defaults rather than live gradient-optimized parameters.
4. **Independent Service Evaluation**: Meal-to-meal correlation (e.g., heavy lunch suppressing dinner turnout) is not yet modeled.

---

## 7. Future Conformal Calibration Roadmap

To transition from the current intent-weighted prototype to a mathematically rigorous enterprise forecasting engine, MealSense outlines a 4-phase maturity progression:

```
[ Phase 0: Cold-Start Heuristic (0–5 meals) ]
  • Fixed 75% attendance heuristic with ±5% heuristic spread
       │
       ▼
[ Phase 1: Intent-Weighted Forecast (6–20 meals) ]  <-- CURRENT PROTOTYPE
  • Intent-weighted linear show-up formula with empirical target intervals
       │
       ▼
[ Phase 2: Residual-Calibrated Intervals (20–50 meals) ]
  • Stratified non-conformity residuals by meal type (Breakfast vs Lunch vs Dinner)
  • Rolling walk-forward evaluation of empirical coverage
       │
       ▼
[ Phase 3: Split-Conformal Prediction Engine (50+ meals) ]
  • Distribution-free finite-sample coverage validity:
    Compute non-conformity scores R_i = |y_i - \hat{y}_i|
    Set quantile q = Quantile(R, \lceil (N+1)(1 - \alpha) \rceil / N)
    Construct [ \hat{y} - q, \hat{y} + q ] guaranteeing \ge 80% coverage
  • Covariate shift adaptation for exam weeks, holidays, and weather anomalies
```
