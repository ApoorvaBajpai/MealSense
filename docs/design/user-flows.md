# MealSense: User Flows & Interaction Architecture

## 1. Student Interaction Flow

```
[ App Opened ]
      │
      ▼
[ View Active Meal Card ]
  - Check Menu Dishes & Serving Window
  - Observe Live Cutoff Countdown Timer
      │
      ▼
[ One-Tap Decision ]
  ├── Click [ 🍽️ I'm eating ] ────► Instant Optimistic State (Green)
  │                                   ├── Telemetry: response_submitted
  │                                   └── Kitchen Aggregate: n_eat + 1
  └── Click [ 🚫 Skip ]        ────► Instant Optimistic State (Neutral)
                                      ├── Telemetry: response_submitted
                                      └── Kitchen Aggregate: n_skip + 1
      │
      ▼
[ View "My Impact" Feedback ]
  - On-time response rate progress
  - Estimated food saved (kg)
  - 4-week participation trend
```

---

## 2. Kitchen Staff Decision & Outcome Flow

```
[ Kitchen Dashboard Opened ]
      │
      ▼
[ Decision-First Card Displayed ]
  - Expected Turnout: 348
  - Likely Range: 334–362 (80% Conformal)
  - Recommended Prep: 362 Servings (348 + 14 buffer)
      │
      ├───────────────────────────────────────────┐
      ▼                                           ▼
[ Click "Use Recommendation" ]          [ Click "Adjust Quantity" ]
  - Records Decision:                           - Enter New Cook Target
    selected_quantity = 362                     - Select Mandatory Reason:
    adjustment = 0 servings                       (Turnout, Shortage, Festival, Weather)
  - Cook Target Locked                          - Records Decision with Reason
      │                                           │
      └─────────────────────┬─────────────────────┘
                            │
                            ▼
               [ Meal Service Conducted ]
                            │
                            ▼
               [ Post-Meal Outcome Wizard ]
                 1. Actual Headcount (e.g. 345)
                 2. Prepared Servings (e.g. 355)
                 3. Surplus Disposition (Donated vs Discarded)
                 4. Unserved Tray Waste kg (e.g. 2.8 kg)
                 5. Plate Scrapings kg (e.g. 4.2 kg)
                 6. Ran Short Checkbox (Guardrail Flag)
                            │
                            ▼
               [ Closed Meal & Server Calculation ]
                 - Error (MAE) calculated
                 - Overproduction rate calculated
                 - Savings vs Baseline updated
                 - Model residual stored
```

---

## 3. Administrator Oversight & Insights Flow

```
[ Admin Dashboard Opened ]
      │
      ▼
[ Executive Overview ]
  - North Star: Avoidable Waste / Meal (0.18 kg, ↓22%)
  - Guardrail: Shortage Rate (0.0%, Target < 0.5%)
  - Estimated Savings vs Baseline: ₹28,400/mo (Defensible Methodology)
      │
      ├──────────────────────────┼──────────────────────────┐
      ▼                          ▼                          ▼
[ 7d/30d/90d Trends ]    [ Deterministic Insights ]  [ Monthly Mess Report ]
  - Waste per meal         - Problem meal types        - Summary audit table
  - Forecast MAE           - Friday variance           - Guardrail verification
  - Response rates         - Menu opportunities        - One-click PDF / CSV
```
