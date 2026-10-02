# MealSense: Metrics & Measurement Architecture

## 1. Principles of Measurement

1. **Explicit Separation of Three Attendance Concepts**:
   - **Predicted Attendance**: Statistical point projection and coverage interval before meal service.
   - **Confirmed Intent**: Stated preference from active students ($n_{\text{eat}}, n_{\text{skip}}$) aggregated before cutoff.
   - **Actual Attendance**: Headcount recorded during meal service (`actual_count`).
   These three are **never** combined in a single column or conflated in formulas.

2. **Causation vs. Correlation Integrity**:
   - If student response rate rises from 45% to 75% while waste falls by 22%, the platform describes this as an **observed operational relationship** unless a randomized controlled trial (A/B experiment) establishes direct causality.
   - Financial savings are strictly termed **Estimated Savings vs. Baseline**, never unverified "Avoided Costs".

3. **Labeling Estimates**:
   - All savings, cost avoided, and projection metrics must be clearly flagged in the UI as **Estimates** with accessible definition tooltips explaining the baseline period and formula.

---

## 2. Metric Hierarchy

```
                            [ North Star Metric ]
                    Avoidable Food Waste per Meal Served
                               (kg / meal)
                                    ▲
        ┌───────────────────────────┴───────────────────────────┐
        │                                                       │
 [ Operational Guardrail ]                             [ Business Outcome ]
      Shortage Rate                               Estimated Savings vs Baseline
      (< 0.5% meals)                                         (₹ / mo)
        ▲                                                       ▲
        │                                                       │
 ┌──────┴───────────────┐                                ┌──────┴───────────────┐
 │ Kitchen Decision     │                                │ Forecast Accuracy    │
 │ - Acceptance Rate    │                                │ - MAE                │
 │ - Overproduction %   │                                │ - Bias               │
 │ - Outcome Log Rate   │                                │ - Conformal Coverage │
 └──────────────────────┘                                └──────────────────────┘
        ▲                                                       ▲
        └───────────────────────────┬───────────────────────────┘
                                    │
                            [ Input Metrics ]
                        - Student Response Rate
                        - On-Time Response Rate
                        - Weekly Active Students
```

---

## 3. Metric Register

### 3.1 North Star Metric
- **Metric**: Avoidable Food Waste per Meal Served
- **Formula**:
  $$\text{Waste per Meal} = \frac{\sum \text{unserved\_waste\_kg}}{\text{actual\_count}}$$
- **Canonical Unit**: $\text{kg} / \text{meal served}$
- **Target**: $\le 0.17\text{ kg/meal}$ (Baseline: $0.23\text{ kg/meal}$, target reduction $\ge 22\%$).

### 3.2 Guardrail Metric
- **Metric**: Shortage Rate
- **Formula**:
  $$\text{Shortage Rate} = \frac{\sum (\text{ran\_short} = \text{true})}{\text{Total Meals Served}} \times 100$$
  - **Threshold**: $< 0.5\%$ of all meals.
  - **Action Rule**: If shortage rate exceeds 0.5% in any 14-day window, automated safety buffer $\beta$ is automatically incremented.

### 3.3 Input Metrics
| Metric | Formula | Purpose | Target |
|---|---|---|---|
| **Student Response Rate** | $(n_{\text{eat}} + n_{\text{skip}}) / \text{registered}$ | Measures resident engagement | $\ge 75\%$ |
| **On-Time Response Rate** | $(n_{\text{eat}} + n_{\text{skip}}) / (n_{\text{eat}} + n_{\text{skip}} + n_{\text{late}})$ | Measures timely intent availability | $\ge 90\%$ |
| **Weekly Active Students (WAS)** | Distinct students responding $\ge 1$ time in 7 days | Evaluates active cohort retention | $\ge 85\%$ |

### 3.4 Forecast Quality Metrics
| Metric | Formula | Purpose | Target |
|---|---|---|---|
| **Mean Absolute Error (MAE)** | $\frac{1}{N} \sum |\text{predicted}_i - \text{actual}_i|$ | Measures absolute prediction accuracy | $\le 8.0$ heads |
| **Forecast Bias** | $\frac{1}{N} \sum (\text{predicted}_i - \text{actual}_i)$ | Detects systematic over/under-cooking drift | $-2.0 \le \text{Bias} \le +2.0$ |
| **Conformal Coverage** | $\% \text{ meals where } \text{actual} \in [\text{lower}, \text{upper}]$ | Verifies prediction interval calibration | $80\% \pm 5\%$ |

### 3.5 Kitchen Operational Decision Metrics
| Metric | Formula | Purpose | Target |
|---|---|---|---|
| **Recommendation Acceptance Rate** | $\% \text{ meals where kitchen used recommended servings without override}$ | Measures cook trust in the algorithm | $\ge 80\%$ |
| **Average Kitchen Adjustment** | $\text{selected\_quantity} - \text{recommended\_quantity}$ | Measures directional chef skepticism | $\le +10$ servings |
| **Outcome Logging Compliance** | $\% \text{ closed meals with completed headcount and waste records}$ | Ensures audit loop data integrity | $\ge 95\%$ |
| **Overproduction Rate** | $(\text{prepared} - \text{actual}) / \text{prepared} \times 100$ | Measures excess food cooked | $\le 4.5\%$ |

---

## 4. Cost & Savings Methodology: "Estimated Savings vs Baseline"

### 4.1 Why "Avoided Cost" Was Renamed
Historical industry metrics often claimed arbitrary "Avoided Costs" based on assumed fixed dollar amounts per plate. These figures fail audit scrutiny because they neglect pre-implementation conditions and baseline food inflation. MealSense enforces **Estimated Savings vs. Baseline**.

### 4.2 Baseline Data Model (`baseline_periods`)
```sql
CREATE TABLE baseline_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    baseline_type VARCHAR(50) NOT NULL, -- e.g., 'pre_implementation_audit'
    baseline_waste_per_meal NUMERIC(6,4) NOT NULL, -- e.g., 0.2300 kg/meal
    baseline_overproduction_rate NUMERIC(5,2) NOT NULL, -- e.g., 6.10%
    baseline_shortage_rate NUMERIC(5,2) NOT NULL, -- e.g., 0.40%
    baseline_cost_per_serving NUMERIC(8,2) NOT NULL, -- e.g., 42.00 INR
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Like-for-Like Calculation Formula
$$\Delta \text{Overproduction Servings} = (\text{Baseline Overproduction Rate} - \text{Current Overproduction Rate}) \times \text{Total Prepared Servings}$$

$$\text{Estimated Monthly Savings} = \Delta \text{Overproduction Servings} \times \text{Facility Cost per Serving}$$

### 4.4 UI Transparency Standard
Every savings figure displayed in MealSense includes an info badge stating:  
> *"Estimated Savings vs. Baseline: Calculated as the reduction in overprepared servings relative to the pre-implementation baseline period (August 1–31, 2026 @ 6.1% overproduction) multiplied by the facility calibrated cost of ₹42.00/serving. Estimates for operational decision support."*
