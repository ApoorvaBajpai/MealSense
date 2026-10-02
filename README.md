# MealSense

> **Production-Grade Institutional Dining & Mess Food Waste Reduction Platform**  
> Built for university hostels, college dining halls, corporate cafeterias, and institutional messes.

---

## 🏛️ Real-World Production Architecture

MealSense is designed for **actual production deployment** across dining facilities:

1. **First-Time Evaluator Demo Accounts**:
   - For anyone opening the platform for the first time, three dedicated demo IDs are available:
     - `student_testid` (Resident Student: Aarav Sharma)
     - `staff_testid` (Kitchen Chef: Chef Rajesh Kumar)
     - `admin_testid` (Warden / Administrator: Dr. V. K. Verma)
   - These demo accounts preload a rich sample dataset (published meals, intent responses, attendance history, Conformal prediction intervals, and waste records) so evaluators can immediately envision and test the platform.

2. **Clean Operational Slate for Real Registrations**:
   - When real users register via **"Register New Account"**, the system creates a completely **clean operational slate with strictly zero dummy data**.
   - Meal menus start empty until the kitchen chef clicks **"➕ Publish New Meal"** to publish menus for their specific hostel.
   - All login fields are empty by default with autofill disabled.

3. **Strict Role Locking**:
   - When a user logs in, they are locked exclusively into their authorized dashboard.
   - There are **no role-switcher buttons** while logged in.
   - To access a different account or role, the user **must explicitly click "Log Out"**.

4. **Zero-Trust Student Privacy (DPDP Compliant)**:
   - Students' individual Eat / Skip meal choices are **strictly invisible** to kitchen cooks and administrators.
   - The kitchen receives and plans based **only** on trigger-maintained anonymous intent aggregates (`n_eat`, `n_skip`, `n_late`).
   - Server-enforced cutoff times: responses after the cutoff deadline are automatically flagged as late and excluded from kitchen cook targets.

5. **Dynamic Meal Publishing & Kitchen Operations**:
   - Kitchen staff can click **"➕ Publish New Meal"** to publish daily dishes, set custom meal serving windows, and configure cutoff times.
   - Real-time intent updates: Live counts of students eating vs. skipping.
   - Recommended cooking quantity calculation with safety buffer slider based on the registered hostel capacity.
   - 3-step outcome wizard to log actual headcount, cooked servings, and food waste ($kg$) with automatic meal closure.

6. **Warden & Mess Administration**:
   - View the active registered resident and staff roster.
   - Configure mess parameters (seating capacity, calibrated $kg$ per serving, raw material cost per serving in ₹).
   - Export full mess audit reports (JSON) for mess committee meetings.

7. **Design Aesthetic: Warm Beige & Espresso Brown**:
   - Elegant palette inspired by natural linen, warm parchment, toasted grains, warm caramel, and roasted espresso.
   - Accessible touch targets ($\ge 48\text{px}$) with instant optimistic state updates and live countdown timers.

---

## 📁 Repository Layout

```
mealsense/
├── apps/
│   ├── web/                                          # Production Web Application (HTML / Vanilla CSS / ES Modules)
│   │   ├── index.html                                # Production entry with live operations bar
│   │   ├── styles/
│   │   │   ├── design-tokens.css                     # Warm beige, linen & espresso design tokens
│   │   │   ├── main.css                              # Framework, navigation & auth styling
│   │   │   ├── student.css                           # Mobile-first meal cards & one-tap toggles
│   │   │   ├── kitchen.css                           # RangeBar, buffer slider, outcome wizard
│   │   │   └── admin.css                             # KPI grid, roster table, waste charts
│   │   └── js/
│   │       ├── auth.js                               # Real user registration & SHA-256 password hashing
│   │       ├── store.js                              # Central reactive store with strict session guards
│   │       ├── api.js                                # Business rules, cutoffs, outcome logging
│   │       ├── analytics.js                          # Telemetry event tracker
│   │       └── components/
│   │           ├── auth-view.js                      # Real registration & login views
│   │           ├── student-view.js                   # Resident Student PWA view
│   │           ├── kitchen-view.js                   # Kitchen Operations & Meal Publishing
│   │           └── admin-view.js                     # Warden / Admin Intelligence & Roster
│   └── forecast/                                     # FastAPI ML Forecasting Service (Python 3.12)
│       ├── app/
│       │   ├── models/                               # v0-naive, v0-weekly, v1-weighted, v1-intent (NNLS)
│       │   ├── intervals/conformal.py                # Split conformal prediction engine
│       │   ├── evaluation/backtest.py                # Walk-forward rolling-origin backtester
│       │   └── main.py                               # FastAPI endpoints (/v1/predict, /v1/backtest)
│       ├── tests/                                    # Pytest suite
│       └── Dockerfile
├── supabase/
│   ├── migrations/                                   # 5 PostgreSQL migrations (schema, triggers, RPCs, views, RLS)
│   ├── tests/rls_matrix.test.sql                     # pgTAP automated security tests
│   └── seed/seed.sql                                 # Reference database seed data
└── docs/
    ├── product/metric-dictionary.md                  # Canonical formulas, kg vs servings
    └── adr/0001-supabase-and-rls-data-layer.md       # Architecture Decision Record
```

---

## 🚀 Running the Local Production Web Server

```powershell
# In the mealsense project directory:
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Open **`http://localhost:3000/`** in any browser.
