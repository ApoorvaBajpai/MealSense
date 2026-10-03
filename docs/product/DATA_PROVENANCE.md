# MealSense: Data Provenance & Metric Traceability

> **Technical & Product Management Governance Standard**  
> Every metric, trend point, and insight displayed in MealSense is traceable to an active record, audited calculation, baseline period, or explicitly labeled simulation.

---

## 1. Core Principles of Data Provenance

1. **Zero Fake Fallbacks**: If operational records are missing or insufficient (e.g., zero closed meals or an empty calendar bucket), engines return `null` or `{ provenance: 'insufficient_data' }`. The UI renders `—` ("Insufficient data") rather than drawing an unearned plausible number.
2. **Strict Mode Isolation**: Demo records (`demoDataProvider`) and Live records (`liveDataProvider`) are completely decoupled in storage and state. Mutations in Demo Mode never contaminate Live operational logs.
3. **Calculation Single Source of Truth**: All dashboards (Student, Kitchen, Admin) compute metrics through the central `MetricEngine`, `TrendEngine`, `FunnelEngine`, and `InsightEngine` rather than hardcoding presentation values.

---

## 2. Provenance Taxonomy

| Provenance Tag | Source / Generator | Meaning & Usage | UI Badge / Label |
|---|---|---|---|
| `demo` | `demo-seed.js` | Seeded 35-day institutional dining dataset for evaluator review | `Demo Mode • Sample Data` |
| `live_operational` | `live-provider.js` | User-submitted meal, intent, decision, or outcome in Live Mode | `Live Mode • Local Operational Records` |
| `live_baseline` | User-defined facility baseline | Pre-implementation facility audit record entered in Live Mode | `Audited Baseline` |
| `derived` | `MetricEngine`, `TrendEngine` | Dynamically calculated from closed dining outcome records | `Calculated from logged decisions` |
| `insufficient_data` | `TrendEngine`, `BaselineEngine` | Fewer than the required number of records exist for statistical validity | `— (Insufficient data)` |
| `simulated_benchmark` | `experiment-engine.js` | Seeded A/B test results for feature demonstration | `Simulated Demo Benchmark` |

---

## 3. Mathematical Formula Traceability

### 3.1 North Star Metric: Avoidable Food Waste per Meal
$$\text{Avoidable Waste / Meal (kg)} = \frac{\sum_{i \in \text{Closed}} \text{unserved\_waste\_kg}_i}{\sum_{i \in \text{Closed}} \text{actual\_diners}_i}$$
- **Operational Scope**: Focuses strictly on **unserved / avoidable kitchen surplus per diner**. This represents the direct overproduction that MealSense's forecasting and prep targets control.
- **Secondary Metric (Plate Waste)**: Customer plate scrapings ($\sum \text{plate\_waste\_kg} / \sum \text{actual\_diners}$) are tracked and audited separately in post-meal audits, as customer scrapings reflect portion sizing and recipe preferences rather than kitchen production over-preparation.

### 3.2 Kitchen Overproduction Rate
$$\text{Overproduction Rate (\%)} = \frac{\sum_{i} \max(\text{prepared\_servings}_i - \text{actual\_diners}_i, 0)}{\sum_{i} \text{prepared\_servings}_i} \times 100$$

### 3.3 Guardrail Metric: Shortage Frequency
$$\text{Shortage Rate (\%)} = \frac{\sum_{i} \mathbb{I}(\text{ran\_short}_i = \text{true})}{\text{Total Closed Meals}} \times 100$$
- **Target Constraint**: Must remain strictly $< 0.5\%$.

### 3.4 Forecast Accuracy: Trailing Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |\text{forecast\_prediction}_i - \text{actual\_diners}_i|$$

### 3.5 Defensible Financial Savings vs Baseline
$$\text{Savings (₹)} = (\text{Baseline Overprod \%} - \text{Current Overprod \%}) \times \text{Cooked Servings} \times \text{Raw Portion Cost}$$
- *Baseline Parameters*: August 1–31, 2026 pre-implementation period ($6.10\%$ overproduction rate, ₹42.00 raw portion cost).

---

## 4. Cold-Start Model Progression

MealSense structures forecasting progression transparently rather than claiming an unearned statistical guarantee:

| Stage | Data Threshold | Model Version | Prediction Logic | Interval Specification |
|---|---|---|---|---|
| **Phase 1** | $0 \le N < 6$ meals | `v0-naive` | $75\%$ of registered facility capacity | Heuristic interval ($\pm 5\%$ capacity) |
| **Phase 2** | $6 \le N < 20$ meals | `v1-intent` | Linear intent model: $0.95 N_{\text{eat}} + 0.04 N_{\text{skip}} + \hat{p}_{\text{unresp}} N_{\text{unresp}}$ | $80\%$ target prediction interval (Historical variance) |
| **Phase 3** | $N \ge 20$ meals | `v2-calibrated` | Day-of-week + meal-type stratified regression | Locally calibrated split-conformal prediction intervals |

---

## 5. Statistical Insight Verification

All automated operational claims in `InsightEngine` are calculated directly from sample statistics:
1. **Friday Dinner Variance**:
   $$\text{Variance Ratio} = \frac{s_{\text{Friday Dinner}}^2}{s_{\text{Weekday Dinner}}^2}$$
   Emitted only if $s_{\text{Fri}} > 1.25 \times s_{\text{Weekday}}$ with at least 2 Friday dinners and 3 weekday dinners audited.
2. **High-Preference Dish Plate Waste**:
   $$\text{Waste Reduction} = \frac{\bar{w}_{\text{other}} - \bar{w}_{\text{high\_pref}}}{\bar{w}_{\text{other}}} \times 100$$
   Emitted only when high-preference dishes (e.g., Paneer, Dal Makhani) demonstrate lower customer plate waste than the general menu rotation.
