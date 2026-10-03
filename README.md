# MealSense: Demand Forecasting & Food-Waste Reduction for Institutional Dining

> **End-to-End Product Prototype & Product Management Case Study**  
> Connecting lightweight student meal intent, historical operational data, and kitchen preparation decisions to systematically eliminate avoidable food waste in institutional dining halls.

---

### Product Loop
$$\text{Student Intent} \longrightarrow \text{Demand Forecast} \longrightarrow \text{Kitchen Decision} \longrightarrow \text{Actual Outcome} \longrightarrow \text{Waste Measurement} \longrightarrow \text{Continuous Insights}$$

while holding the **food shortage rate strictly within an explicit guardrail ($< 0.5\%$)**.

---

## 🎯 Executive Overview & Product Thesis

**MealSense is an end-to-end product prototype for institutional dining operations.** It demonstrates how student meal intent can become an operational demand signal, how kitchens can act on that signal, and how post-meal outcomes can close the measurement loop.

Institutional dining facilities face a classic operational mismatch: kitchen staff must prepare bulk food hours before knowing actual attendance. Preparing too much creates direct financial loss and organic waste; preparing too little risks food shortages and student reprimands.

**MealSense addresses the root cause of overproduction: uncertainty and asymmetric risk.** Rather than treating food waste as a pure theoretical machine learning problem, MealSense designs a closed human decision loop:
1. **Lightweight Student Signal**: Students signal intent in 1 tap ($< 3\text{s}$ latency) before the preparation cutoff.
2. **Target Demand Forecast**: Calibrated uncertainty intervals ($80\%$ target prediction interval) replace unassisted gut-feel guesswork.
3. **Decision-First Kitchen UX**: Recommends an exact cooking quantity (`Expected Turnout + Safety Buffer = Servings`) while logging adjustment reasons.
4. **Post-Meal Waste Auditing**: Simple 60-second outcome capture logs actual attendance, unserved tray waste, plate scrapings, and shortage status.
5. **Continuous Insights & Defensible Savings**: A centralized Metrics Engine aggregates trends, conversion funnels, and defensible savings against an audited baseline.

---

## ⚙️ Target Architecture: One Product, Two Data Modes

A core product-engineering principle of MealSense is **data-mode credibility**: Demo Mode and Live Mode share the exact same UI components, state machine, and calculation layer.

```
                         MealSense UI
                              │
                     Data Provider Layer
                    ┌─────────┴─────────┐
             DEMO PROVIDER        LIVE PROVIDER
             (Seeded Records)     (Real Records)
                    └─────────┬─────────┘
                        Metrics Engine
                              │
          ┌───────────────────┼───────────────────┐
        Trends             Funnels             Insights
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                      Dashboards / Reports
```

- **Demo Mode (Seeded Sandbox)**: Preloaded with 35+ days of operational history (90+ meal services across breakfast, lunch, and dinner), pre-implementation baseline, telemetry event stream, and clearly labeled simulated A/B test benchmarks for evaluator walkthroughs.
- **Live Mode (Clean Operational State)**: Browser-local operational records via Local Storage. Displays authentic empty states rather than fake KPIs or fabricated trends when no data has been entered. Production cloud backend and campus SSO are documented migration targets.
- **Zero Contamination**: Demo mutations are session-isolated and can be restored at any time via **"Reset Demo"**. Live mode never reads demo data; demo mode never mutates live storage.

---

## 🚀 Explore MealSense: Evaluator Quickstart

### 1. Run the Local Web Server
```powershell
# From the mealsense repository root:
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Navigate to **`http://localhost:3000/`** in your browser.

### 2. Interactive 60-Second Guided Tour
Click **"🚀 Start 60-Second Guided Tour"** on the welcome portal to walk through all 5 stages of the closed loop:
1. **Student Intent**: Aarav Sharma logs intent in 1 tap (`[ 🍽️ Eating ]`); inspect data-derived "My Impact".
2. **Forecast Refresh**: Intent automatically updates Chef Rajesh's demand forecast (`348 expected + 14 buffer = 362 servings`).
3. **Kitchen Decision**: Review the recommendation, adjust buffers, or record operational overrides.
4. **Outcome Audit**: Complete the post-meal wizard: headcount, tray surplus, plate waste, and shortage verification.
5. **Admin Impact**: Review the North Star metric (Avoidable Waste ↓21.7%), defensible savings, deterministic insights, and export the Monthly Mess Report.

### 3. Dedicated Role Entry Points & Deep Links

| Role | Persona & Name | Focus Area | Deep Link | Quick Login ID |
|---|---|---|---|---|
| **Student** | **Aarav Sharma** | One-tap intent & data-derived My Impact | `?mode=demo&role=student` | `student_testid` |
| **Kitchen** | **Chef Rajesh Kumar** | Intent-weighted demand forecast (80% target interval), override reasons & outcomes | `?mode=demo&role=kitchen` | `staff_testid` |
| **Admin** | **Dr. V. K. Verma** | Executive KPIs, trends, funnels & SaaS ROI | `?mode=demo&role=admin` | `admin_testid` |

*Password for all demo accounts: `demo`*

---

## 📊 Core Metrics & Defensible Measurement

All metrics are calculated dynamically by `apps/web/js/metrics/metric-engine.js` across active provider records:

### 1. North Star Metric: Avoidable Waste / Meal
$$\text{Avoidable Waste / Meal} = \frac{\sum \text{unserved\_waste\_kg}}{\sum \text{actual\_diners\_served}}$$
- **Operational Scope**: Focuses strictly on **unserved / avoidable kitchen surplus per diner**. This represents the direct overproduction that MealSense's forecasting and prep targets control.
- **Secondary Metric (Plate Waste)**: Customer plate scrapings ($\sum \text{plate\_waste\_kg} / \sum \text{actual\_diners}$) are tracked and audited separately in post-meal audits, as customer scrapings reflect portion sizing and recipe preferences rather than kitchen production over-preparation.
- **Demo Performance**: $0.180\text{ kg/meal}$ (Reduced by **$21.7\%$** from $0.230\text{ kg/meal}$ baseline).

### 2. Non-Negotiable Guardrail: Shortage Rate
$$\text{Shortage Rate} = \frac{\text{Meals with Shortage}}{\text{Total Meals Served}} \times 100 < \mathbf{0.5\%}$$
- **Demo Performance**: **$0.0\%$ Shortage Frequency** (Zero shortages logged across monitored services).

### 3. Kitchen Overproduction Rate
$$\text{Overproduction Rate} = \frac{\max(\text{prepared} - \text{actual}, 0)}{\text{prepared}} \times 100$$
- **Demo Performance**: $4.20\%$ (Reduced from $6.10\%$ baseline).

### 4. Defensible Savings Methodology
To withstand administrative and financial scrutiny, MealSense uses **"Estimated Savings vs. Baseline"** instead of arbitrary claims:
$$\text{Estimated Savings} = (\text{Baseline Overprod \%} - \text{Current Overprod \%}) \times \text{Cooked Servings} \times \text{Raw Portion Cost}$$
*Reference Baseline Period: August 1–31, 2026 (Unassisted cooking @ ₹42.00/serving raw portion cost).*

---

## 🧪 Product Experiments & Evidence Standards

MealSense strictly separates experiment design from empirical findings. Simulated demonstration results are explicitly badged to maintain product credibility:

| Experiment ID | Test Name & Hypothesis | Primary Metric | Guardrail | Status | Evidence Classification |
|---|---|---|---|---|---|
| **EXP-01** | **Value Prop Framing**: Social-proof framing increases on-time response rate | On-Time Response % | Response Latency | Concluded | <span class="badge">Simulated Demo Benchmark</span> |
| **EXP-02** | **Intent Button Wording**: Concise action verbs reduce decision latency | View-to-Response % | Intent Accuracy | Concluded | <span class="badge">Simulated Demo Benchmark</span> |
| **EXP-03** | **My Impact Feedback**: Personal food-saved metric increases Week-2 retention | 14-Day Retention % | Survey Fatigue | Concluded | <span class="badge">Simulated Demo Benchmark</span> |

*Note: In Live Mode, experiment variant toggles are restricted to maintain randomized assignment integrity.*

---

## 🔒 Privacy-Conscious Design & Prototype Authentication

- **Small-Group Suppression Rule**: Aggregate views automatically suppress intent or dietary breakdowns for groups where $N < 5$ to prevent student re-identification.
- **Aggregated Intent Signals**: Kitchen staff and administrators only see trigger-maintained anonymous totals (`n_eat`, `n_skip`, `n_late`).
- **Prototype Authentication Disclosure**: Local browser authentication is implemented via Local Storage and client-side SHA-256 for portfolio evaluation.
- **Production Path**: In institutional deployment, authentication migrates to campus SSO (Google Workspace / Microsoft Entra ID / SAML) with server-side JWT verification and PostgreSQL Row-Level Security (RLS).

---

## 📁 Repository Documentation Index

Comprehensive product management documentation is curated in `docs/`:

```
mealsense/
├── docs/
│   ├── product/
│   │   ├── problem-statement.md      # Asymmetric risk, user discovery & thesis
│   │   ├── user-research.md          # 16 Field interviews synthesis & 6 core findings
│   │   ├── personas.md               # Student, Kitchen Staff, and Administrator personas
│   │   ├── jtbd.md                   # Jobs-to-be-Done framework and job stories
│   │   ├── competitive-analysis.md   # MealSense vs. Gut Feel vs. Turnstiles vs. Winnow
│   │   ├── prd.md                    # Product Requirements Document (PRD v2.0)
│   │   ├── metrics.md                # North Star, guardrail, and baseline definitions
│   │   ├── metric-dictionary.md      # SQL formulations, units, and edge-case handling
│   │   ├── prioritization.md         # RICE scoring and MoSCoW feature roadmap
│   │   ├── experimentation.md        # A/B testing designs and simulated benchmarks
│   │   ├── roadmap.md                # Phased delivery from Phase 0 to Phase 5
│   │   ├── business-model.md         # SaaS pricing tiers, unit economics & ROI model
│   │   └── case-study.md             # Complete PM portfolio narrative
│   │
│   ├── design/
│   │   ├── user-flows.md             # Interaction flows for Student, Kitchen, and Admin
│   │   ├── usability-testing.md      # Usability benchmarks, completion times, SUS scores
│   │   └── design-decisions.md       # Warm Linen & Espresso design rationale
│   │
│   ├── analytics/
│   │   ├── event-taxonomy.md         # Structured telemetry events and schemas
│   │   └── funnel-definitions.md     # Student participation and kitchen decision funnels
│   │
│   └── technical/
│       ├── architecture.md           # One product, two modes data architecture
│       ├── forecasting.md            # Conformal prediction engine & cold-start progression
│       └── data-model.md             # PostgreSQL schema (baselines, decisions, outcomes)
```

---

## 🎨 Design System: Warm Linen & Espresso

MealSense rejects cold, sterile enterprise aesthetics in favor of an inviting culinary design system:
- **Linen & Warm Parchment (`#f6f3ed`)**: Soft background reducing eye fatigue in dorm rooms and bright kitchen offices.
- **Roasted Espresso (`#2c1f17`)**: High-contrast, grounded typographic anchor.
- **Terracotta & Caramel (`#b85d38`, `#9c4b28`)**: Warm culinary tones evoking roasted grains and dining warmth.
- **Sage Olive (`#2e6b48`) & Crimson (`#b33927`)**: Accessible indicators for positive attendance confirmations and shortage warnings.
