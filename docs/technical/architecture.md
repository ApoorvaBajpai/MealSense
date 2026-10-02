# MealSense: Technical System Architecture

## 1. High-Level Architecture Overview

MealSense is an end-to-end institutional dining platform composed of three primary layers:
1. **Client Layer (Mobile Web PWA)**: Vanilla JavaScript, ES Modules, and responsive design tokens running natively on mobile and desktop browsers with zero app-store download friction.
2. **Persistence & Security Layer (PostgreSQL / Supabase)**: Row-Level Security (RLS) policies enforcing zero-trust privacy, trigger-maintained real-time counters, and append-only audit logs.
3. **Forecasting Service (FastAPI / Python)**: Walk-forward statistical engine, Non-Negative Least Squares (NNLS), Split Conformal Prediction intervals, and tiered cold-start selectors.

```
       [ Resident Student Mobile PWA ]        [ Kitchen Staff / Admin Dashboard ]
                      │                                        │
                      │ HTTPS                                  │ HTTPS
                      ▼                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │            MealSense Web Service (HTTP/PWA)            │
             │           Reactive Store & Local Storage Sync          │
             └────────────────────────────────────────────────────────┘
                      │                                        ▲
                      │ SQL / RLS Policies                     │ Telemetry & Updates
                      ▼                                        │
             ┌────────────────────────────────────────────────────────┐
             │       PostgreSQL Database Layer (RLS & Triggers)       │
             │  - meals, meal_responses (Private)                     │
             │  - meal_intent_counts (Trigger-Maintained Aggregate)   │
             │  - kitchen_decisions, meal_outcomes                    │
             │  - baseline_periods, experiments, audits               │
             └────────────────────────────────────────────────────────┘
                      ▲                                        │
                      │ Historical Turnout & Signals           │ Training Snapshots
                      ▼                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │           FastAPI Machine Learning Service             │
             │  - Cold-Start Selector (v0-naive ──► v1-intent)        │
             │  - Conformal Prediction Engine (80% Coverage Band)     │
             │  - Deterministic Explainability Generator              │
             └────────────────────────────────────────────────────────┘
```

---

## 2. Zero-Trust Student Privacy Architecture

A foundational product requirement is DPDP (Digital Personal Data Protection) compliance. Under no circumstances should kitchen cooks or mess contractors see an individual student's Eat or Skip history.

- **Private Ingestion**: Students submit intents to `meal_responses`, protected by strict RLS:
  `user_id = auth.uid()`
- **Server Trigger Aggregation**: A database trigger updates `meal_intent_counts`:
  `UPDATE meal_intent_counts SET n_eat = n_eat + 1 WHERE meal_id = ...`
- **Kitchen Read Boundary**: Kitchen staff accounts are granted `SELECT` permission **exclusively on `meal_intent_counts`**, guaranteeing cryptographic isolation.
