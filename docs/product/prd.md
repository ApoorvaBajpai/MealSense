# MealSense: Product Requirements Document (PRD)

**Document Version**: 2.0 (Product Management Upgrade)  
**Author**: Lead Product Manager  
**Status**: Ready for Production Execution  
**Target Release**: Q4 Institutional Deployment  

---

## 1. Problem & Context

Institutional kitchens prepare hundreds of meals daily under acute demand uncertainty. Cooks systematically overprepare by 15%–25% to protect themselves against student food shortage reprimands. This results in significant financial waste (₹25,000–₹50,000 monthly per 500-resident hall) and hundreds of kilograms of avoidable organic food waste sent to municipal landfills.

Meanwhile, students have no low-friction mechanism to signal attendance in advance, and administrators lack verified operational data to measure progress or justify sustainability investments.

---

## 2. Target Users & Personas

1. **Resident Student (Aarav Sharma)**: Needs to signal Eat/Skip in $< 3$ seconds, view menus, and see the collective positive impact of responding.
2. **Kitchen Staff / Head Chef (Chef Rajesh Kumar)**: Needs an explicit, transparent preparation recommendation with a safety buffer before lighting the stoves, and a fast 60-second outcome recording tool.
3. **Dining Administrator / Warden (Dr. V. K. Verma)**: Needs executive oversight on food waste per meal, overproduction rates, baseline comparison savings, and compliance reports for mess committee meetings.

---

## 3. Goals & Non-Goals

### Goals
- **G-1**: Deliver a closed-loop decision workflow: Student Intent → Forecast → Preparation Decision → Outcome Logging → Residual Feedback.
- **G-2**: Enable one-tap student meal intention submission in $< 3$ seconds with 0 learning curve.
- **G-3**: Provide kitchen cooks with a decision-ready recommendation: `Expected Turnout + Safety Buffer = Recommended Servings`.
- **G-4**: Measure and log actual headcount, tray waste, and plate scrapings in $< 60$ seconds post-meal.
- **G-5**: Provide administrators with defensible baseline comparisons, trend analytics, and deterministic operational insights.
- **G-6**: Enforce strict zero-trust student privacy: kitchen only sees trigger-aggregated headcounts.

### Non-Goals
- **NG-1**: We are NOT building an ERP procurement or recipe nutrition database.
- **NG-2**: We are NOT installing biometric turnstiles, smart cameras, or custom hardware scales.
- **NG-3**: We are NOT pursuing hyper-complex deep learning models at the expense of transparent explainability and cold-start robustness.
- **NG-4**: We are NOT individualizing meal billing deductions or financial penalties for missing meals in this phase.

---

## 4. Success Metrics & Guardrails

### 4.1 North Star Metric
- **Avoidable Food Waste per Meal Served**:
  $$\text{Waste per Meal} = \frac{\text{Avoidable Unserved Waste (kg)}}{\text{Actual Meals Served}}$$
  *Target*: Reduce from baseline $0.23\text{ kg/meal}$ to $\le 0.17\text{ kg/meal}$ (a $22\%$–$26\%$ reduction).

### 4.2 Non-Negotiable Guardrail Metric
- **Shortage Rate**:
  $$\text{Shortage Rate} = \frac{\text{Meals with Ran Short = True}}{\text{Total Meals Served}} \times 100$$
  *Guardrail Target*: Strictly $< 0.5\%$. Any decision rule or algorithm revision that increases shortages is immediately aborted.

### 4.3 Key Supporting Metrics
- **Student On-Time Response Rate**: $> 70\%$ of active residents responding before meal cutoff.
- **Kitchen Recommendation Acceptance Rate**: $> 80\%$ of recommendations adopted without manual override.
- **Forecast Accuracy (MAE)**: Trailing MAE $\le 8.0$ heads on registered population of 450.
- **Conformal Interval Coverage**: Realized attendance falling within the $[lower, upper]$ band $\ge 80\%$ of the time.
- **Estimated Savings vs. Baseline**: Quantified against audited pre-implementation baseline period.

---

## 5. User Stories

### Student User Stories
- **US-S1**: As a student, I want to see today's meal dishes and serving window immediately upon opening the app, so I know what is cooking.
- **US-S2**: As a student, I want to confirm "I'm eating" or "Skip" in a single tap before the countdown timer expires, so my response is included in the kitchen's order.
- **US-S3**: As a student, I want to toggle "Away Mode" for multi-day trips so all meals during my absence are automatically marked as Skip.
- **US-S4**: As a student, I want to view "My Impact" to see how many meals I've responded to on-time and estimated kilograms of food prevented from landfill.
- **US-S5**: As a student, I want the assurance that my individual choices are strictly anonymous and invisible to kitchen cooks or college staff.

### Kitchen Staff User Stories
- **US-K1**: As a head cook, I want to see the decision-first preparation recommendation prominently displayed (`Expected + Buffer = Recommended`), so I can immediately know how many portions to cook.
- **US-K2**: As a head cook, I want to adjust the recommended quantity and log an operational reason (e.g., festival, rain, shortage history) if I need to override the recommendation.
- **US-K3**: As a head cook, I want to view an expandable explainability section that explains why the model predicted this number in plain operational terms.
- **US-K4**: As a head cook, I want to log realized headcount, tray waste, and plate waste in a fast 3-step modal after meal service ends.
- **US-K5**: As a head cook, I want to publish upcoming menus and adjust cutoff deadlines directly from my dashboard.

### Administrator User Stories
- **US-A1**: As a warden, I want an executive dashboard displaying the North Star metric, shortage guardrail, and baseline comparison figures.
- **US-A2**: As a warden, I want to examine 7-day, 30-day, and 90-day trends for waste, forecast MAE, and student response rates.
- **US-A3**: As a warden, I want deterministic operational insights that alert me to systemic patterns (e.g., high Friday dinner variance or menu-specific waste).
- **US-A4**: As a warden, I want to generate and export a standardized Monthly Mess Audit Report (CSV / printable format) for mess committee meetings.
- **US-A5**: As a warden, I want an interactive ROI & SaaS calculator to model scenario savings for additional campus halls.

---

## 6. Functional Requirements

### 6.1 Student Experience (`apps/web/js/components/student-view.js`)
- **FR-S1 One-Tap Intent**: Prominent, accessible buttons (`[ 🍽️ I'm eating ]` and `[ 🚫 Skip ]`) with instant optimistic UI update.
- **FR-S2 Dynamic Countdown**: Live countdown timer updating every second showing time remaining before kitchen cutoff.
- **FR-S3 Value Proposition Messaging**: Clear banner explaining why student response matters ("Your response helps the kitchen prepare closer to actual demand").
- **FR-S4 My Impact Dashboard**: Display personal metrics: Total responses, On-time response rate (%), Meals skipped, and Estimated food avoided (kg).
- **FR-S5 Away Mode**: Modal allowing selection of From Date and To Date, marking all overlapping meals as `skip`.
- **FR-S6 Privacy & Export**: DPDP self-service drawer to export personal JSON data or anonymize account.

### 6.2 Kitchen Experience (`apps/web/js/components/kitchen-view.js`)
- **FR-K1 Decision-First Card**: Prominently display:
  - Expected Attendance (point prediction)
  - Likely Range ($80\%$ Conformal Interval)
  - **RECOMMENDED PREPARATION: X servings**
  - Explicit formula: `Predicted + Buffer = Recommended`
- **FR-K2 Primary Action Buttons**: `[ ✓ Use Recommendation ]` and `[ ✏️ Adjust Quantity ]`.
- **FR-K3 Decision Logging**: When quantity is adjusted, capture `selected_quantity`, `adjustment_amount`, and `adjustment_reason` (Higher expected turnout, Previous shortage, Special event, Weather change, Other).
- **FR-K4 Expandable Advanced Details**: Accordion containing Conformal range visualization, historical MAE, and participation breakdown.
- **FR-K5 Deterministic Explanations**: Plain-English signal cards explaining shifts in prediction.
- **FR-K6 Outcome Recording Wizard**: 3-step modal capturing headcount, prepared servings, surplus disposition (discarded, refrigerated, donated), unserved kg, plate kg, and shortage flag.

### 6.3 Admin Experience (`apps/web/js/components/admin-view.js`)
- **FR-A1 Executive KPI Grid**: North Star (Avoidable Food Waste/meal), Overproduction Rate, Forecast MAE, Shortage Guardrail, and Estimated Savings vs. Baseline.
- **FR-A2 Baseline Comparison View**: Tabular comparison of Baseline Period vs. Current Period like-for-like metrics.
- **FR-A3 Trend Analysis**: Multi-timeframe selector (7d / 30d / 90d) for operational trends.
- **FR-A4 Deterministic Insights**: Automated rule-based observations highlighting actionable dining anomalies.
- **FR-A5 Monthly Mess Report**: Formatted operational report modal with print/PDF preview and CSV export.
- **FR-A6 Interactive ROI Calculator**: Parametric sliders for residents, meals/day, cost/serving, waste/meal, and SaaS subscription tier.
- **FR-A7 Product Analytics & Experimentation**: Visual representation of Student and Kitchen funnels and active A/B test results.

---

## 7. Edge Cases & Handling

1. **Cutoff Passed While Student Viewing**:
   - The UI automatically flags response as late. Response is accepted for student record but excluded from the kitchen cook order.
2. **Zero Realized Attendance (Mess Boycott / Strike)**:
   - System records 0 attendance without divide-by-zero errors; flags meal as an anomaly to prevent corrupting training samples.
3. **Small-Group Breakdown Exposure**:
   - Any sub-group aggregate with $< 5$ responses is suppressed and displays "Insufficient data to protect anonymity".
4. **Offline / Flaky Network Connection**:
   - Local state persists optimistically; retry queue syncs when connectivity resumes.

---

## 8. Privacy, Data Governance & Security

- **DPDP Act (India) Compliance**:
  - Individual student responses are stored with strict Row-Level Security (RLS).
  - Kitchen and Admin roles only have access to aggregated table views (`meal_intent_counts`).
  - No geolocation, personal contacts, or camera permissions requested.
  - User self-service data export and account anonymization tools provided.

---

## 9. Rollout Strategy & Risk Mitigation

- **Phase 1 (Pilot)**: Single dining hall (Tagore Hostel, 450 residents) for 4 weeks. Establish baseline in Week 1–2; deploy Student + Kitchen app in Week 3–4.
- **Phase 2 (Expansion)**: 3 campus dining halls. Enable multi-hall admin benchmarking and automated monthly reports.
- **Phase 3 (Enterprise SaaS)**: Multi-institution rollout with automated tenant provisioning and custom baseline calibration.
