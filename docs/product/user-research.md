# MealSense: User Research & Field Discovery Synthesis

## 1. Research Overview

- **Sample Size**: 16 structured interviews conducted across 3 university dining halls (Tagore Hostel, Sarojini Hall, Ramanujan Complex).
- **Participants**:
  - **9 Resident Students** (Freshmen to PhD candidates; mix of regular diners and frequent skippers).
  - **4 Kitchen Staff & Supervisors** (2 Head Chefs, 1 Store In-charge, 1 Mess Contractor).
  - **3 Institutional Administrators** (2 Wardens, 1 Campus Sustainability Officer).
- **Methodology**: 30-minute semi-structured interviews, observational workflow shadowing during lunch preparation (10:00 AM – 1:30 PM), and review of physical kitchen logbooks.

---

## 2. Research Questions

1. How is meal attendance currently estimated before cooking?
2. How often do students skip meals, and do they currently have any way to communicate it?
3. What specific operational factors cause the kitchen to overprepare or run short?
4. How is waste measured and disposed of today?
5. Who owns the final preparation decision, and who is held accountable when food is wasted?
6. What incentives or UI affordances would motivate students to respond consistently on time?
7. What information does kitchen staff require to trust an automated preparation recommendation?
8. What evidence would justify an administrator paying for a SaaS dining intelligence platform?

---

## 3. Participants Matrix

| ID | Role | Facility | Key Demographic / Background |
|---|---|---|---|
| P-01 | Student (UG 2nd Yr) | Tagore Hostel | Eats 80% meals in mess; skips weekend breakfasts |
| P-02 | Student (UG 4th Yr) | Tagore Hostel | Frequently orders online; rarely attends dinner |
| P-03 | Student (PG 1st Yr) | Sarojini Hall | Strict vegetarian; cares about food waste & composting |
| P-04 | Student (UG 3rd Yr) | Ramanujan Complex | Active sports team member; irregular meal hours |
| P-05 | Student (UG 1st Yr) | Sarojini Hall | Never misses a meal; notices recurring food shortages on Biryani days |
| P-06 | Student (UG 3rd Yr) | Tagore Hostel | Mess committee student representative |
| P-07 | Student (PG 2nd Yr) | Ramanujan Complex | Lab researcher; misses lunch during experiments |
| P-08 | Student (UG 2nd Yr) | Sarojini Hall | Health conscious; skips heavy carbohydrate dinners |
| P-09 | Student (UG 4th Yr) | Tagore Hostel | Prepares for entrance exams; irregular dining patterns |
| P-10 | Head Chef | Tagore Hostel | 18 years in institutional catering; cooks for 480 students |
| P-11 | Kitchen Storekeeper | Sarojini Hall | Manages dry rations and daily issue registers |
| P-12 | Assistant Cook | Ramanujan Complex | Manages roti preparation and cauldron boiling |
| P-13 | Mess Contractor | Central Dining | Commercial vendor operating on a per-plate contract |
| P-14 | Chief Warden | Tagore Hostel | Senior Professor; balances mess committee budget |
| P-15 | Associate Warden | Sarojini Hall | Oversees dining discipline and health standards |
| P-16 | Sustainability Officer | Campus Operations | Tracks campus municipal waste diversion and ESG metrics |

---

## 4. Key Findings & Insights

### Finding 1: The "Never Run Out" Mandate Creates Structural Overproduction
- **Observation**: Head cooks face zero penalties for throwing away unserved rice or dal at the end of a shift, but face severe reprimands and student protests if food runs out 15 minutes before closing.
- **Quote (P-10, Head Chef)**:  
  *"If I throw away 10 kilos of rice, nobody says anything—it's written off as routine. But if three boys don't get dal at 1:45 PM, they complain to the Warden, and I receive a memo. Why would I take the risk of cooking less?"*
- **Design Implication**: The system must provide an explicit, adjustable **Safety Buffer** and highlight that the lower bound has conformal coverage.

### Finding 2: Student Intent Has Extreme Signal Value but Zero Tolerance for Friction
- **Observation**: 7 of 9 students know whether they will attend a meal at least 2 hours in advance. However, existing paper registers or multi-step Google Forms had less than 8% participation.
- **Quote (P-01, Student)**:  
  *"If you give me a notification where I can just tap 'Eating' or 'Skip' without opening five pages, I'll do it every single day. Make it as quick as marking an alarm."*
- **Design Implication**: The student interaction must be **one tap**, take less than 3 seconds, and be supported by instant feedback.

### Finding 3: Kitchen Staff Distrust Probabilities but Understand Transparent Arithmetic
- **Observation**: Showing kitchen staff statistical terms like $p$-values, confidence coefficients, or standard deviations created confusion and suspicion.
- **Quote (P-13, Contractor)**:  
  *"Don't tell me there is an 80% confidence level of 348 people. Tell me: 318 students clicked yes, we expect 30 others based on past Tuesdays, and add 14 for safety. That makes 362. That I can follow."*
- **Design Implication**: Surface the recommendation as transparent operational arithmetic:  
  $$\text{Expected Attendance} + \text{Buffer} = \text{Recommended Cook Quantity}$$
  Keep advanced ML internals tucked into an expandable secondary section.

### Finding 4: Food Waste Is Completely Unmeasured Today
- **Observation**: In all 3 halls, waste was dumped directly into municipal bins or wet-waste drums without ever being weighed or categorized. Cooks could only guess whether waste was 5 kg or 50 kg.
- **Quote (P-16, Sustainability Officer)**:  
  *"We claim our campus is green, but we have literally zero data on dining hall waste tonnage. We cannot improve what we do not measure."*
- **Design Implication**: Build a 3-step outcome recording wizard that separates **Unserved Tray Waste** (kitchen overproduction) from **Plate Scrapings** (portioning/recipe issues).

### Finding 5: Cost Claims Without Baselines Trigger Immediate Executive Skepticism
- **Observation**: Wardens immediately questioned abstract claims like "MealSense saved ₹1,00,000 this month."
- **Quote (P-14, Chief Warden)**:  
  *"Where did that ₹1 lakh number come from? Vegetable prices went down 10% last month anyway. Unless you compare against an audited pre-implementation baseline, the finance auditor will reject it."*
- **Design Implication**: Replace all "Avoided Cost" language with **"Estimated Savings vs. Baseline"**, explicitly document the baseline methodology, and provide an info panel explaining the math.

---

## 5. Opportunity Areas & Product Decisions

| Discovered Problem | Opportunity Area | Resulting Product Decision |
|---|---|---|
| Cooks inflate batches to avoid shortage | Safe recommendation with controllable buffer | Built decision-first card with default buffer $+14$ and slider override |
| High student drop-off on complex forms | Zero-friction student intent | Implemented one-tap `[ I'm eating ]` / `[ Skip ]` meal cards with live countdown |
| Skepticism of AI black-box numbers | Transparent formula explainability | Plain-language breakdown: confirmed eaters + non-responder baseline + safety buffer |
| Unmeasured food waste | Lightweight post-meal logging | 60-second outcome modal logging headcount, tray surplus, plate waste, and shortage flag |
| Doubts about financial savings figures | Defensible baseline measurement framework | Added formal `baseline_periods` comparison table with defensible per-serving calculations |
| Privacy concerns regarding student habits | DPDP zero-trust architecture | Cooks only receive aggregate counts ($n_{\text{eat}}, n_{\text{skip}}$); individual records are private |
