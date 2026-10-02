# MealSense: User Personas

Detailed user personas developed from primary field interviews across 3 campus dining halls and 16 user sessions.

---

## Persona 1: The Resident Student

### **Aarav Sharma (20, 3rd Year B.Tech Resident)**
- **Role**: On-Campus Hostel Resident
- **Context**: Resides in Block A; pays a mandatory per-semester mess advance fee.
- **Tech Affinity**: High (Smartphone native, uses WhatsApp, Swiggy, UPI daily).

### Core Goals & Jobs to be Done
- Decide quickly whether mess food is appealing today or if he should order out with friends.
- Communicate non-attendance in under 5 seconds without tedious forms or mandatory justifications.
- Feel that his feedback and preferences actually influence mess menu quality.

### Primary Pain Points
- **Friction**: *"I'm rushing between labs; if an app asks for 4 steps to say I'm not eating, I just won't bother."*
- **Unclear Value**: *"Why should I tell them? They cook too much anyway, and my fee doesn't change."*
- **Fear of Punishment**: Worries that skipping meals might result in losing meal rights or being reprimanded.

### Behavioral Triggers & Solution Fit
- Needs a **one-tap interaction** directly from notification or mobile browser.
- Requires instant feedback showing **My Impact** (kilograms of food prevented from landfill).
- Guaranteed privacy: kitchen cooks never see his personal eating habits.

---

## Persona 2: The Kitchen Head Cook

### **Chef Rajesh Kumar (48, Mess Head Cook & Inventory Planner)**
- **Role**: Mess Production Supervisor
- **Context**: Responsible for preparing 3 meals daily for 450 residents with a 6-person kitchen team.
- **Tech Affinity**: Moderate (Uses WhatsApp for personal chat; prefers large buttons, clear numbers, and physical registers).

### Core Goals & Jobs to be Done
- Determine the exact batch size (in kg and servings) to put into the cauldrons by 10:30 AM for Lunch and 5:30 PM for Dinner.
- **Never run out of food** during serving hours (shortages lead to student protests and disciplinary hearings with the warden).
- Minimize physical waste clearance at the end of the shift.

### Primary Pain Points
- **Attendance Uncertainty**: Attendance fluctuates wildly between 280 and 430 students depending on exams, weather, and dish popularity.
- **Black-box Distrust**: Skeptical of complex AI dashboards with confusing confidence intervals or decimal probabilities.
- **Accountability Fear**: Hesitant to cut cooking quantities unless backed by an explicit safety buffer.

### Behavioral Triggers & Solution Fit
- Needs a **Decision-First Recommendation** with explicit, simple arithmetic:  
  `348 expected turnout + 14 safety buffer = 362 servings to prepare`.
- Needs a single-tap `[ Use Recommendation ]` button with optional `[ Adjust Quantity ]` tracking override reasons.
- 60-second end-of-meal outcome logging for actual headcount, tray surplus, and waste.

---

## Persona 3: The Warden / Dining Administrator

### **Dr. V. K. Verma (54, Chief Warden & Mess Committee Chairman)**
- **Role**: Institutional Administrator
- **Context**: Oversees hostel finances, student welfare, vendor contracts, and sustainability mandates.
- **Tech Affinity**: Moderate-High (Uses desktop browser, Excel, PDF reports, email).

### Core Goals & Jobs to be Done
- Demonstrate fiscal responsibility and reduce monthly food subsidy deficits.
- Maintain student satisfaction and prevent dining complaints.
- Report audited food sustainability and ESG compliance metrics to university leadership.

### Primary Pain Points
- **No Operational Visibility**: No baseline data on how much food is cooked vs. consumed vs. thrown away.
- **Inability to Attribute Savings**: Raw contractor invoices fluctuate with wholesale grain prices, masking operational waste changes.
- **Time Poverty**: Has only 10 minutes per month to review dining operations; needs high-signal executive summaries rather than raw logs.

### Behavioral Triggers & Solution Fit
- Executive Dashboard highlighting the **North Star Metric: Avoidable Food Waste per Meal Served** and **Shortage Guardrail**.
- **Like-for-like Baseline Comparison** that contrasts current operations against historical baseline periods.
- One-click **Monthly Mess Audit Report** exportable to CSV and clean printable format for Food Committee meetings.
