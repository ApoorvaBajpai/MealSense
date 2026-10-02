# MealSense: Product Prioritization & Decision Matrix

## 1. Prioritization Framework: RICE Scoring

To transition MealSense from an engineering prototype to a high-impact, PM-led product, features were evaluated across four quantitative criteria:
- **Reach (R)**: Number of users impacted per month (Students: 450; Kitchen: 6; Admin: 3). Scaled 1–10.
- **Impact (I)**: Contribution to North Star metric (Avoidable Food Waste Reduction) and User Trust (3 = Massive, 2 = High, 1 = Medium, 0.5 = Low).
- **Confidence (C)**: User research validation and technical feasibility (1.0 = High confidence, 0.8 = Medium, 0.5 = Low).
- **Effort (E)**: Engineering days required.

$$\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$$

---

## 2. RICE Evaluation Table

| Feature / Initiative | Reach (1-10) | Impact (0.5-3) | Confidence | Effort (Days) | RICE Score | Priority |
|---|---|---|---|---|---|---|
| **1-Tap Student Intent Decision Card** | 10 | 3.0 | 1.0 | 2 | **15.0** | **P0** |
| **Kitchen Decision-First Card (`Expected + Buffer`)** | 8 | 3.0 | 1.0 | 2.5 | **9.6** | **P0** |
| **Kitchen Adjustment Logging with Reason** | 8 | 2.5 | 1.0 | 2 | **10.0** | **P0** |
| **Post-Meal 60-Sec Outcome Wizard** | 8 | 3.0 | 1.0 | 2 | **12.0** | **P0** |
| **Baseline Period Comparison & Defensible Savings** | 7 | 2.5 | 1.0 | 2.5 | **7.0** | **P0** |
| **Guided 60-Sec Evaluator Demo Walkthrough** | 9 | 2.5 | 0.9 | 2 | **10.1** | **P0** |
| **Student "My Impact" Personal Feedback** | 10 | 2.0 | 0.85 | 2 | **8.5** | **P1** |
| **Deterministic Operational Insights (Admin)** | 6 | 2.0 | 0.9 | 2 | **5.4** | **P1** |
| **Product Event Taxonomy & Funnels** | 8 | 1.5 | 1.0 | 2 | **6.0** | **P1** |
| **A/B Experimentation Engine (3 tests)** | 8 | 2.0 | 0.85 | 2.5 | **5.4** | **P1** |
| **Institutional ROI & SaaS Calculator** | 6 | 1.5 | 0.8 | 1.5 | **4.8** | **P1** |
| **Human-Readable Monthly Mess Audit Report** | 6 | 2.0 | 0.9 | 2 | **5.4** | **P1** |
| **Tiered Cold-Start Model Selector** | 7 | 1.5 | 0.9 | 1.5 | **6.3** | **P1** |
| *Deep Learning Transformers for Menu Text* | 4 | 0.5 | 0.4 | 14 | **0.06** | **P3 (Deprioritized)** |
| *Automated SMS / Push Gateway Infrastructure* | 7 | 1.0 | 0.7 | 8 | **0.61** | **P2 (Deferred)** |
| *Individual Student Meal Swipes / RFID POS* | 5 | 0.5 | 0.5 | 20 | **0.06** | **Won't Have** |

---

## 3. MoSCoW Feature Categorization

### Must-Have (P0) — Required for Production Decision Loop
1. **One-Tap Student Response**: Ultra-fast `[ 🍽️ I'm eating ]` / `[ 🚫 Skip ]` cards with real-time countdown.
2. **Decision-First Kitchen Recommendation**: Explicit math: `Expected Turnout + Safety Buffer = Cook Quantity`.
3. **Adjustment Logging**: Capture overrides with validated operational reasons to understand chef mental models.
4. **Post-Meal Outcome Audit**: 60-second logging of actual headcount, unserved tray food, plate waste, and shortage flag.
5. **Baseline Comparison Engine**: Defensible "Estimated Savings vs. Baseline" with transparent methodology.
6. **Guided Demo Walkthrough**: Interactive, step-by-step evaluator tour demonstrating the complete closed loop in 60 seconds.

### Should-Have (P1) — Drives Engagement & Institutional Scalability
1. **Student "My Impact"**: Show personal response rate, meals skipped, and kilograms of food diverted.
2. **Product Analytics & Funnel Tracking**: Measure view-to-response conversion and kitchen decision friction.
3. **A/B Experimentation**: Live tests on Value Prop wording, Button labels, and Impact feedback.
4. **Deterministic Insights**: Rule-based operational observations for administrators.
5. **Interactive ROI & SaaS Calculator**: Scenario financial forecasting for multi-hostel university rollouts.
6. **Human-Readable Monthly Audit Report**: One-click printable PDF/CSV report for mess committee meetings.

### Could-Have (P2) — Post-Launch Enhancements
1. Multi-hostel aggregate benchmark view for university campus directors.
2. Automated weekly WhatsApp summary digests for wardens.
3. Cold-start historical weather integration.

### Won't-Have (P3 / Deprioritized) — Deliberate Non-Goals
1. **Deep Learning / LLM Menu Interpreters**: Freezing advanced ML to prevent black-box opacity.
2. **Hardware Integrations (Smart Scales / Turnstiles)**: Eliminates hardware procurement and maintenance barriers.
3. **Per-meal financial penalties for students**: Preserves zero-trust privacy and psychological safety.

---

## 4. Strategic Rationale for Freezing ML Feature Work

A key product management finding from user discovery: **The bottleneck to food waste reduction is NOT prediction error ($\text{MAE}=6\text{ vs }7$); it is decision trust and closed-loop compliance.**
- If a kitchen staff member distrusts an ultra-complex neural network, they will add a $+50$ portion safety buffer, rendering the ML useless.
- Conversely, an explainable baseline model combined with an explicit, trusted safety buffer and 80% conformal coverage achieves immediate 20%+ waste reduction.
- Therefore, engineering bandwidth was strictly allocated to **decision UX, audit verification, and product analytics**.
