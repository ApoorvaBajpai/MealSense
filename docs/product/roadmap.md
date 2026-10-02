# MealSense: Product Roadmap (Phases 0 – 5)

## Roadmap Overview

MealSense follows a structured six-phase progression designed to validate product-market fit in institutional dining before scaling commercially.

```
Phase 0           Phase 1          Phase 2          Phase 3          Phase 4          Phase 5
Discovery   ──►   Core Loop  ──►   Measurement──►   Engagement ──►   Intelligence─►   SaaS Scale
(Interviews)      (Intent+Dec)     (Baselines)      (Impact+A/B)     (Insights)       (Enterprise)
```

---

## Detailed Roadmap Phases

### Phase 0: Problem Discovery & User Validation (Completed)
- **Duration**: 2 Weeks
- **Core Scope**:
  - 16 Field interviews with Students, Kitchen Staff, and Wardens.
  - Shadowing head chefs during 10:00 AM – 1:30 PM lunch preparation shifts.
  - Review of physical kitchen ration registers and municipal disposal logs.
- **Key Deliverables**:
  - `docs/product/user-research.md` (Interview synthesis & 6 core findings).
  - Personas (`docs/product/personas.md`) and Job Stories (`docs/product/jtbd.md`).
  - Validation of the "Never Run Out" structural driver of overproduction.
- **Risk Gate / Exit Criteria**:
  - Verified that students will respond if interaction is $\le 1$ tap; verified cooks will accept a recommendation if buffer is transparent.

---

### Phase 1: The Core Closed Decision Loop (Completed)
- **Duration**: 3 Weeks
- **Core Scope**:
  - One-tap Student Eat/Skip mobile interface with live countdown timers.
  - Decision-first Kitchen card: `Expected Turnout + Safety Buffer = Recommended Servings`.
  - Kitchen adjustment override logging with mandatory operational reasons.
  - 60-second post-meal outcome logging (attendance, prepared servings, unserved tray kg, plate waste kg, shortage flag).
  - Automated calculation of MAE and overproduction on meal closure.
- **Key Deliverables**:
  - `apps/web/js/components/student-view.js`
  - `apps/web/js/components/kitchen-view.js`
  - Zero-trust student privacy aggregate triggers.
- **Risk Gate / Exit Criteria**:
  - Closed-loop cycle demonstrated: Student Intent $\to$ Forecast $\to$ Kitchen Prep $\to$ Outcome $\to$ Metrics update. Zero student identities leaked to kitchen view.

---

### Phase 2: Measurement & Baseline Comparison (Completed)
- **Duration**: 2 Weeks
- **Core Scope**:
  - Formal `baseline_periods` data model and audit history.
  - Rename "Avoided Cost" to defensible **"Estimated Savings vs. Baseline"**.
  - Multi-timeframe trend analysis (7d / 30d / 90d) for waste per meal, forecast MAE, and response rates.
  - Causation vs. correlation standards in documentation and UI definition panels.
- **Key Deliverables**:
  - `docs/product/metrics.md` and `docs/product/metric-dictionary.md`.
  - Admin baseline comparison banner and executive KPI hierarchy.
- **Risk Gate / Exit Criteria**:
  - All financial savings clearly identified as baseline estimates with auditable calculation steps.

---

### Phase 3: Engagement & Evidence-Driven Experimentation (Completed)
- **Duration**: 2 Weeks
- **Core Scope**:
  - Student **"My Impact"** dashboard (meals responded, on-time %, kg food diverted, 4-week trend).
  - In-app experiment engine for randomized A/B cohort assignment.
  - Execution of 3 experiments: Value Proposition framing, Button wording, and Impact feedback retention.
  - Full product telemetry event taxonomy and conversion funnel metrics.
- **Key Deliverables**:
  - `docs/product/experimentation.md`
  - Interactive Admin Analytics & Funnels dashboard.
- **Risk Gate / Exit Criteria**:
  - Student on-time response rate sustained $\ge 70\%$; statistically significant $+7.8\%$ improvement in Variant B value prop.

---

### Phase 4: Operational Intelligence & Explainability (Current Phase)
- **Duration**: 3 Weeks
- **Core Scope**:
  - Deterministic operational insights engine (Friday evening variance, high-protein menu scrapings reduction, early response correlations).
  - Menu intelligence with automated small-group privacy and sample-size suppression rules ($N < 5$).
  - Human-readable Monthly Mess Audit Report generator (printable PDF preview and CSV export).
  - Cold-start model selector (Phase 1 Naive $\to$ Phase 2 Weighted $\to$ Phase 3 NNLS $\to$ Phase 4 Contextual).
- **Key Deliverables**:
  - `apps/forecast/app/models/model_selector.py`
  - Admin Deterministic Insights tab and Monthly Report modal.
- **Risk Gate / Exit Criteria**:
  - Zero hallucinations or black-box claims; all operational insights backed by deterministic logic and empirical kitchen data.

---

### Phase 5: Commercialization & Multi-Hostel Scale (Q1 Next Year)
- **Duration**: 6 Weeks
- **Core Scope**:
  - Self-serve facility onboarding wizard (seating capacity, meal schedules, serving weight calibration, cost per serving).
  - Multi-hostel campus benchmarking for university directors.
  - Institutional SaaS pricing validation (₹8/resident/month subscription model).
  - Interactive ROI calculator for mess contractor procurement pitches.
- **Key Deliverables**:
  - `docs/product/business-model.md`
  - Self-serve facility registration workflow and contract calculators.
- **Risk Gate / Exit Criteria**:
  - 3 contracted institutional dining facilities operating live with positive net ROI multiples ($\ge 4\times$).
