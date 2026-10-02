# MealSense: Problem Statement & Product Thesis

## 1. Executive Summary

Institutional dining facilities—university hostels, college dining halls, corporate cafeterias, and hospital messes—operate in an environment of extreme demand uncertainty. Kitchen supervisors and head chefs must commit to food preparation quantities hours before knowing how many diners will actually attend.

Preparing too much food leads to massive financial waste, organic waste in landfills, and greenhouse gas emissions. Preparing too little food leads to immediate food shortages, student frustration, and cafeteria disruptions.

MealSense resolves this tension not through isolated machine learning predictions, but through a **closed-loop decision system** that connects lightweight student intent, calibrated demand forecasting, kitchen preparation decisions, and post-meal waste audits.

---

## 2. The Core Problem

### 2.1 The Information Asymmetry
- **Kitchen Staff** must finalize procurement and cooking quantities 2 to 4 hours before service begins (10:00 AM for Lunch; 5:00 PM for Dinner).
- **Students** often decide whether to eat at the mess 30 to 90 minutes before meal service, based on class schedules, off-campus plans, campus events, or menu preferences.
- Because there is no low-friction communication channel, kitchens rely on static rules of thumb (e.g., "always cook for 80% of registered students").

### 2.2 Operational Consequences
| Failure Mode | Root Cause | Realized Impact |
|---|---|---|
| **Systematic Overproduction** | Fear of food shortage (the "never run out" mandate) | 15%–25% of cooked food goes unserved; ₹25,000–₹50,000 avoidable food cost per month per 500 residents. |
| **Shortages & Chaos** | Unexpected exam schedules, rainy days, or unpredicted spikes | Students turned away or fed emergency substitutions (instant noodles, plain rice), damaging student trust. |
| **Silent Plate Waste** | Fixed portioning and unpalatable or repetitive dishes | Unmeasured organic waste scraped into trash bins without feedback to recipe planners. |
| **Lack of Accountability** | No measurement of actual attendance vs. preparation | Waste is treated as an inevitable cost of institutional living rather than an optimizable operational metric. |

---

## 3. Product Thesis

> **Product Thesis**:  
> By pairing a 1-tap student meal intent mechanism with a conformal demand forecast, kitchens can safely reduce safety buffers by 30%–50% without increasing student shortage rates.  
> The resulting closed-loop workflow:
> **Student Intent → Demand Forecast → Kitchen Preparation Decision → Actual Attendance & Waste Audit → Forecast Evaluation → Continuous Decision Improvement.**

### The Four Core Questions MealSense Answers
1. **Student**: *"Should I eat this meal?"* (Fast, one-tap choice with visible impact).
2. **Kitchen Staff**: *"How much should I cook right now?"* (Decision-first recommendation with transparent buffer arithmetic).
3. **Administrator / Warden**: *"Is our dining operation improving over time?"* (Defensible waste metrics, trends vs. audited baseline, and financial savings).
4. **The System**: *"What did we learn from this meal to improve the next forecast?"* (Automated residual evaluation, calibration updates, and deterministic insights).

---

## 4. Strategic Guardrails

- **Primary Outcome (North Star)**: Avoidable Food Waste per Meal Served ($\text{kg} / \text{meal}$).
- **Non-Negotiable Guardrail**: Food Shortage Rate must remain strictly below $0.5\%$ of meals served.
- **Privacy Guardrail**: Zero individual student tracking exposed to kitchen cooks or administrators; all decision-making operates on cryptographically anonymous aggregates.
