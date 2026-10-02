# MealSense: Product Conversion Funnel Definitions

## 1. Student Intent Participation Funnel

Measures conversion efficiency from initial app open to successful, on-time meal intent submission.

```
Step 1: app_opened (100%)
   │
   ▼
Step 2: meal_viewed (94.2%)
   │  Drop-off: Network latency or immediate app close
   ▼
Step 3: response_started (88.5%)
   │  Drop-off: Indecision or distracted before tapping Eat/Skip
   ▼
Step 4: response_submitted (82.6%)
   │  Drop-off: Abandoned action
   ▼
Step 5: on_time_response_confirmed (76.2%)
      Evaluated strictly before cutoff deadline
```

### Key Funnel KPIs
- **View-to-Response Conversion**: $\text{Step 4} / \text{Step 2} = \mathbf{87.7\%}$
- **On-Time Yield**: $\text{Step 5} / \text{Step 1} = \mathbf{76.2\%}$
- **Weekly Active Response Retention**: Distinct residents responding $\ge 5\text{ times/week} = \mathbf{84.5\%}$

---

## 2. Kitchen Decision-to-Outcome Funnel

Measures operational adherence from initial forecast review through verified post-meal audit logging.

```
Step 1: forecast_viewed (100%)
   │  Head cook reviews turnout expectation for upcoming meal
   ▼
Step 2: recommendation_viewed (100%)
   │  Cook evaluates point recommendation + safety buffer
   ▼
Step 3: decision_recorded (96.8%)
   ├── Accepted recommendation (84.2%)
   └── Adjusted with operational reason (12.6%)
   │
   ▼
Step 4: meal_service_conducted
   │
   ▼
Step 5: outcome_logged (98.4%)
   │  Cook completes 60-second wizard for headcount, tray waste & plate waste
   ▼
Step 6: closed_loop_evaluated (100%)
      Server calculates MAE, overproduction %, waste/meal, and residual signals
```

### Key Funnel KPIs
- **Cook Adoption Rate**: $\text{Step 3} / \text{Step 1} = \mathbf{96.8\%}$
- **Algorithm Trust Ratio**: $\text{Accepted} / \text{Decisions Recorded} = \mathbf{87.0\%}$
- **Outcome Audit Compliance**: $\text{Step 5} / \text{Meals Conducted} = \mathbf{98.4\%}$
