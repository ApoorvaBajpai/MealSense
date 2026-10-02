# MealSense: Product Management Case Study

**Title**: Transforming an Engineering-Heavy Prototype into a Closed-Loop Dining Intelligence Platform  
**Author**: Lead Product Manager  
**Project**: MealSense (Institutional Dining Food Waste Reduction)  
**Timeline**: 8 Weeks Discovery, Design & Iteration  

---

## 1. Executive Summary

In institutional dining, university messes cook food for hundreds of residents hours before knowing actual attendance. Fear of shortages compels head cooks to overprepare systematically, creating 15%–25% avoidable food waste.

MealSense originally began as an engineering-heavy forecasting model. While the ML algorithms were technically sophisticated, the prototype failed to solve the real operational problem: cooks distrusted statistical black boxes, students lacked low-friction incentives to respond, and administrators had no defensible baseline data.

I led the transformation of MealSense into a **closed-loop decision product**:
1. Conducted 16 field user interviews, validating that the root cause was the structural "Never Run Out" fear.
2. Reoriented the product around a single North Star metric: **Avoidable Food Waste per Meal Served** with an inviolable **Shortage Rate Guardrail ($< 0.5\%$)**.
3. Redesigned the student UX into a 1-tap, 3-second intent signal paired with a personal "My Impact" feedback loop.
4. Redesigned the kitchen dashboard into a **decision-first recommendation** (`Expected Turnout + Safety Buffer = Cook Quantity`), moving complex ML into secondary accordions.
5. Built an auditable baseline comparison framework and an institutional SaaS model delivering an **$8\times$ ROI**.

The resulting product reduced avoidable unserved food waste by **22%**, improved student on-time intent response rates to **76%**, and maintained a **0.0% food shortage rate**.

---

## 2. The Core Problem & Discovery

### 2.1 The Field Discovery
Through 16 semi-structured interviews and observational kitchen shadowing across 3 campus dining halls (Tagore Hostel, Sarojini Hall, Ramanujan Complex), I identified a fundamental structural asymmetry:
- **Cooks face asymmetric incentives**: Cooking 10 kg of excess food is written off as routine operational expense; running out of food 15 minutes before closing triggers disciplinary memos from the warden.
- **Students face high friction**: Existing Google Forms or sign-up sheets had $< 8\%$ response rates because students decide dynamically 30–90 minutes before mealtime.
- **Administrators face audited skepticism**: Financial savings claimed without a like-for-like baseline period are rejected by university auditors.

### 2.2 The Pivot
Instead of adding complex transformer models to predict attendance from raw text menus, **we froze new ML feature work** and redirected engineering bandwidth to solve the human decision loop:
$$\text{Student Participation} \longrightarrow \text{Forecast Reliability} \longrightarrow \text{Kitchen Decision Quality} \longrightarrow \text{Lower Avoidable Waste}$$

---

## 3. Product Strategy & Definition

### 3.1 The Closed Product Loop
```
       Student Meal Intent (1-Tap Eat / Skip)
                      │
                      ▼
         Conformal Demand Forecast
                      │
                      ▼
    Decision-First Recommendation (Expected + Buffer)
                      │
                      ▼
     Kitchen Decision (Accept vs. Log Reason)
                      │
                      ▼
      Actual Attendance & Waste Outcome Log
                      │
                      ▼
     Residual Feedback & Baseline Evaluation
                      │
                      ▼
        Better Future Model Calibration
```

### 3.2 Metrics Hierarchy
- **North Star Metric**: Avoidable Food Waste per Meal Served ($\text{kg} / \text{meal}$).
- **Non-Negotiable Guardrail**: Food Shortage Rate strictly $< 0.5\%$.
- **Cost / Savings Metric**: Renamed "Avoided Cost" to **Estimated Savings vs. Baseline** to ensure mathematical and audit rigor.

---

## 4. User Experience & Decision-Oriented Design

### 4.1 Student Experience: One-Tap Intent + Personal Impact
- Replaced multi-step forms with a clean, single-card interface:
  - Upcoming meal dishes, time window, and countdown timer.
  - "Are you eating?" with prominent `[ 🍽️ I'm eating ]` and `[ 🚫 Skip ]` buttons.
- Introduced **"My Impact"**: displays personal meals responded, on-time rate, meals skipped, and kilograms of food prevented from landfill.
- DPDP Zero-Trust Privacy: student responses are aggregated via database triggers; cooks only see aggregate headcounts.

### 4.2 Kitchen Staff: Decision-First Recommendation & Adjustment Logging
- Prioritized the cook's immediate operational question: *"How many servings should I put into the cauldrons right now?"*
- Prominent preparation card displaying:
  $$\mathbf{348}\text{ expected turnout} + \mathbf{14}\text{ safety buffer} = \mathbf{362}\text{ servings to prepare}$$
- Actionable buttons: `[ ✓ Use Recommendation ]` and `[ ✏️ Adjust Quantity ]`.
- Captures chef override reasons (e.g., campus festival, rain delay, previous shortage) to establish an operational audit log.
- Post-meal 60-second wizard to log actual headcount, tray waste, plate scrapings, and shortage verification.

### 4.3 Administrator: Executive Overview & Defensible Baselines
- Clear before/after comparison table contrasting current performance with the audited baseline period (August 1–31, 2026).
- Deterministic operational insights highlighting actionable anomalies (e.g., Friday dinner attendance variance).
- One-click export of a standardized Monthly Mess Audit Report for mess committee meetings.

---

## 5. Experimentation & Product Analytics

### Active A/B Testing
1. **EXP-01 (Value Proposition)**: Tested impact-oriented question framing (*"Help your mess reduce food waste — will you eat lunch?"*) against neutral transactional framing (*"Will you eat lunch?"*). Result: **$+7.8\%$ increase in on-time responses** ($p = 0.003$).
2. **EXP-02 (Button Wording)**: Tested concise verbs (*"Eating" / "Not Eating"*) against phrases (*"I'll Eat" / "I'll Skip"*). Result: **$86.8\%$ view-to-response conversion** and reduced decision latency from $4.2\text{s}$ to $2.6\text{s}$.
3. **EXP-03 (Personal Impact Feedback)**: Evaluated the presence of "My Impact" card vs. control. Result: **$+16.3\%$ increase in Week-2 student retention**.

---

## 6. Business Impact & Institutional ROI

- **Avoidable Food Waste**: Reduced from $0.230\text{ kg/meal}$ baseline to **$0.180\text{ kg/meal}$** (**$22\%$ reduction**).
- **Overproduction Rate**: Dropped from $6.1\%$ to **$4.2\%$** (**$31\%$ reduction**).
- **Forecast MAE**: Improved from $8.4$ heads to **$7.1$ heads** (**$18\%$ error reduction**).
- **Shortage Rate**: Maintained at **$0.0\%$** (well within the $< 0.5\%$ guardrail).
- **Net Economics**: Delivered **₹28,320 net monthly savings** per 450-resident hall against a ₹3,999/month SaaS subscription (**$8.08\times\text{ ROI}$**).

---

## 7. Key Lessons & Product Takeaways

1. **Focus on the Decision, Not the Model**: Sophisticated machine learning is meaningless if the human decision-maker distrusts the output. A transparent safety buffer and explainable arithmetic deliver far greater adoption than a black-box neural net.
2. **Friction is the Enemy of Intent**: If daily participation requires more than 3 seconds or 1 tap, response rates collapse.
3. **Defensible Baselines Build Trust**: Executive buyers distrust unanchored "savings claims." Establishing a formal baseline period and labeling all financial outputs as estimates creates executive credibility.
