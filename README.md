# MealSense: Institutional Dining & Food Waste Prevention Platform

> **Product Management Case Study & Closed-Loop Dining Intelligence System**  
> Built for university hostels, college dining halls, corporate cafeterias, and institutional messes.

---

## 🎯 Executive Summary & Product Thesis

Institutional kitchens decide how much food to prepare hours before knowing actual attendance. Preparing too much creates financial and environmental waste; preparing too little causes food shortages and student dissatisfaction.

**MealSense is NOT built around how complex the forecasting model is.** It is optimized around a closed human decision loop:

$$\text{Student Participation} \longrightarrow \text{Forecast Reliability} \longrightarrow \text{Kitchen Decision Quality} \longrightarrow \text{Lower Avoidable Waste}$$

while holding **food shortage rate strictly within an explicit guardrail ($< 0.5\%$)**.

```
                       [ 1. Student Meal Intent ]
                         1-Tap Eat / Skip (< 3s)
                                    │
                                    ▼
                     [ 2. Conformal Demand Forecast ]
                       80% Nominal Turnout Interval
                                    │
                                    ▼
                 [ 3. Recommended Preparation Quantity ]
                     Turnout + Buffer = Cook Target
                                    │
                                    ▼
                       [ 4. Kitchen Prep Decision ]
                     Use Recommendation vs. Override
                                    │
                                    ▼
                   [ 5. Post-Meal Outcome & Waste Log ]
                     Headcount, Tray Waste, Plate Scrapings
                                    │
                                    ▼
                     [ 6. Residual Model Feedback ]
                     Continuous Learning & Calibration
```

---

## 🏛️ The Six PM Capabilities Demonstrated

1. **Problem Discovery**: 16 field user interviews across 3 university dining halls validating that the structural driver of overproduction is the chef's fear of food shortage reprimands.
2. **Product Strategy**: A clear North Star metric (**Avoidable Food Waste per Meal Served**), non-negotiable guardrail (**Shortage Rate $< 0.5\%$**), and phased roadmap (Phases 0 to 5).
3. **Decision-Oriented UX**:
   - **Student**: One-tap Eat/Skip intent decision with instant **"My Impact"** feedback.
   - **Kitchen Staff**: Decision-first card (`Expected Turnout + Safety Buffer = Servings`) with mandatory override reason tracking.
   - **Administrator**: Executive KPI dashboard, like-for-like baseline comparisons, and deterministic operational insights.
4. **Measurement & Telemetry**: Product event taxonomy tracking conversion funnels, response latency, and retention.
5. **A/B Experimentation**: Evidence-driven testing across value proposition messaging, button verbs, and impact retention.
6. **Defensible Business Impact**: Defensible baseline methodology, auditable savings vs. pre-implementation periods, and an institutional SaaS ROI framework ($8.08\times$ ROI).

---

## 🚀 Experience the 60-Second Guided PM Walkthrough

MealSense includes an interactive, step-by-step evaluator tour that guides hiring managers and evaluators through the complete closed-loop cycle without needing database configuration:

1. **Start the Local Production Server**:
   ```powershell
   # In the mealsense project directory:
   powershell -ExecutionPolicy Bypass -File .\serve.ps1
   ```
2. **Open in Browser**: Navigate to **`http://localhost:3000/`**.
3. **Launch the Tour**: Click **"🚀 Start 60-Second Guided Tour"** on the welcome portal.
4. **Follow the 5 Interactive Stages**:
   - **Stage 1 (Student)**: Aarav Sharma submits intent in 1 tap (`[ 🍽️ Eating ]`); inspect "My Impact".
   - **Stage 2 (Kitchen)**: Live intent syncs into Chef Rajesh's demand forecast (`348 expected + 14 buffer = 362 servings`).
   - **Stage 3 (Kitchen Decision)**: Chef accepts the recommendation (or overrides it with a documented operational reason).
   - **Stage 4 (Outcome Audit)**: Kitchen completes the 60-second wizard: headcount, tray surplus, plate waste, and shortage verification.
   - **Stage 5 (Admin Impact)**: Dr. Verma reviews the North Star metric (Avoidable Waste ↓21.7%), defensible savings (₹28,400/mo), deterministic insights, and exports the Monthly Mess Report.

---

## 👤 Evaluation Roles & Demo Sandbox

For targeted inspection of specific roles, three dedicated demo logins are available:

| Role | Persona & Name | Key Focus | Quick Demo ID |
|---|---|---|---|
| **Student** | **Aarav Sharma** (UG Resident) | 1-Tap Eat/Skip, countdown timer, My Impact card | `student_testid` |
| **Kitchen Staff** | **Chef Rajesh Kumar** (Head Cook) | Decision-first prep card, buffer slider, outcome wizard | `staff_testid` |
| **Administrator** | **Dr. V. K. Verma** (Chief Warden) | Executive impact, baseline comparison, insights, SaaS ROI | `admin_testid` |

*Password for all demo accounts: `demo`*

> **Clean Operational Slate**: Real registrations via **"Register Clean Slate"** load an empty operational database with zero dummy records.

---

## 📊 Core Metric Register & Principles

### The North Star Metric
$$\text{Avoidable Food Waste per Meal Served} = \frac{\sum \text{unserved\_waste\_kg}}{\text{actual\_diners\_served}}$$
- **Current Performance**: $0.180\text{ kg/meal}$ (Reduced by **$21.7\%$** from the $0.230\text{ kg/meal}$ baseline).

### The Inviolable Guardrail
$$\text{Shortage Rate} = \frac{\text{Meals with Food Shortage}}{\text{Total Meals Served}} \times 100 < \mathbf{0.5\%}$$
- **Current Performance**: **$0.0\%$ Shortage Frequency** across all monitored services.

### Defensible Baseline Methodology
- MealSense explicitly replaced arbitrary "Avoided Cost" figures with **"Estimated Savings vs. Baseline"**.
- Savings are calculated against an audited pre-implementation baseline period (August 1–31, 2026 @ 6.1% overproduction):
  $$\text{Monthly Savings} = (\text{Baseline Overprod \%} - \text{Current Overprod \%}) \times \text{Cooked Servings} \times ₹42.00/\text{serving}$$

---

## 🧪 Product Experiments (A/B Testing)

| Experiment ID | Test Description | Control (A) | Treatment (B) | Measured Impact | Decision |
|---|---|---|---|---|---|
| **EXP-01** | Value Proposition Framing | "Will you eat lunch?" | "Help your mess reduce food waste — will you eat lunch?" | **+7.8%** On-Time Intent ($p = 0.003$) | Promoted Treatment B |
| **EXP-02** | Intent Button Verbs | "I'll Eat" / "I'll Skip" | "Eating" / "Not Eating" | **86.8%** Conversion ($2.6\text{s}$ latency) | Promoted Treatment B |
| **EXP-03** | Personal Impact Feedback | Standard Meal Card | Standard + "My Impact" card | **+16.3%** Week-2 Retention | Integrated into core UX |

---

## 📁 Repository Documentation Index

All product management artifacts are curated in `docs/`:

```
mealsense/
├── docs/
│   ├── product/
│   │   ├── problem-statement.md      # Problem discovery, asymmetric incentives & thesis
│   │   ├── user-research.md          # 16 Field interviews synthesis & 6 core findings
│   │   ├── personas.md               # Student, Kitchen Staff, and Warden detailed personas
│   │   ├── jtbd.md                   # Job stories for each role (Situation, Motivation, Outcome)
│   │   ├── competitive-analysis.md   # MealSense vs. Gut Feel vs. RFID Turnstiles vs. Winnow
│   │   ├── prd.md                    # Full Product Requirements Document (PRD v2.0)
│   │   ├── metrics.md                # North Star, guardrails, and baseline calculation logic
│   │   ├── metric-dictionary.md      # SQL implementations, edge cases, and unit standards
│   │   ├── prioritization.md         # RICE scoring framework and MoSCoW prioritization
│   │   ├── experimentation.md        # A/B test designs, sample sizes, and empirical results
│   │   ├── roadmap.md                # Phased roadmap from Phase 0 (Discovery) to Phase 5 (SaaS)
│   │   ├── business-model.md         # SaaS pricing tiers, unit economics & institutional ROI
│   │   └── case-study.md             # The complete portfolio PM case study narrative
│   │
│   ├── design/
│   │   ├── user-flows.md             # Interaction diagrams for Student, Kitchen, and Admin
│   │   ├── usability-testing.md      # Usability benchmarks, completion times, and SUS scores
│   │   └── design-decisions.md       # Design tokens, Warm Linen & Espresso aesthetic rationale
│   │
│   ├── analytics/
│   │   ├── event-taxonomy.md         # Full telemetry event taxonomy and payload schemas
│   │   └── funnel-definitions.md     # Student participation and kitchen decision funnels
│   │
│   └── technical/
│       ├── architecture.md           # Zero-trust privacy, client/server, and RLS policies
│       ├── forecasting.md            # Conformal prediction engine & cold-start progression
│       └── data-model.md             # PostgreSQL schema (baselines, decisions, outcomes)
```

---

## 🔒 Data Privacy & DPDP Compliance

- **Zero-Trust Student Privacy**: Individual student Eat/Skip responses are cryptographically isolated via PostgreSQL Row-Level Security (RLS). Kitchen staff and administrators only see trigger-maintained anonymous totals (`n_eat`, `n_skip`).
- **Small-Group Suppression Rule**: Any breakdown with $< 5$ responses is automatically suppressed in administrative views.
- **DPDP Rights**: Students can export their full data ledger (JSON) or anonymize their account in one tap.

---

## 🎨 Design System: Warm Linen & Espresso

MealSense rejects cold, sterile corporate themes in favor of an artisanal culinary palette:
- **Linen & Warm Parchment (`#f6f3ed`)**: Reduces eye fatigue for dorm rooms and bright kitchen offices.
- **Roasted Espresso (`#2c1f17`)**: High-contrast, grounded typographic anchor.
- **Terracotta & Caramel Accent (`#b85d38`, `#9c4b28`)**: Warm culinary tones evoking roasted grains and comfort.
- **Sage Olive (`#2e6b48`) & Crimson (`#b33927`)**: Functional indicators for confirmed attendance and shortage alerts.
