# MealSense: Prototype Scope, Boundaries & Limitations

> **Product Management Transparency Disclosure**  
> MealSense is an interactive portfolio prototype designed to demonstrate closed-loop product strategy, metrics architecture, and kitchen operations. It is not an enterprise production deployment.

### Current Prototype Limitations
- **Browser-local authentication**: User accounts and session state reside in browser `localStorage`.
- **Browser-local operational records**: Meals, intents, decisions, outcomes, and audit logs are stored locally.
- **Intent-weighted prototype model**: Demand forecasting uses an intent-weighted linear heuristic with empirical variance bands.
- **Target prediction intervals**: Displayed bounds are 80% target prediction intervals, not statistically validated finite-sample conformal coverage.
- **Simulated demo experiments**: A/B testing metrics and p-values are synthetic demonstration benchmarks.
- **Scenario cost savings**: Avoidable savings represent scenario estimates based on unserved portions avoided, not audited accounting savings.
- **Non-causal correlation**: Causal impact of student intent signals on kitchen downsizing has not been experimentally isolated.
- **Production prerequisites**: Institutional deployment requires backend database persistence, enterprise SSO (SAML/OIDC), server-side authorization, immutable audit infrastructure, and continuous model drift monitoring.

---

## 1. Storage & Persistence Boundary

- **Current Prototype Implementation**:
  - Live and Demo states are persisted locally in the client browser using `window.localStorage`.
  - While this enables zero-latency offline evaluation and private local testing, records do not synchronize across different devices or browsers.
- **Enterprise Production Architecture**:
  - PostgreSQL database with Row-Level Security (RLS).
  - Microservices communicating via REST / GraphQL API endpoints.
  - Event streaming via Apache Kafka / AWS Kinesis for real-time kitchen tablet push updates.

---

## 2. Authentication & Identity Boundary

- **Current Prototype Implementation**:
  - Client-side authentication via `localStorage` and `crypto.subtle.digest('SHA-256')`.
  - Seeded test accounts (`student_testid`, `staff_testid`, `admin_testid`) provided for evaluation walkthroughs.
- **Enterprise Production Architecture**:
  - Institutional Single Sign-On (SSO) via SAML 2.0 / OIDC (Google Workspace, Microsoft Entra ID).
  - Secure, HTTP-only JWT session cookies with rotating refresh tokens.
  - Role-based access control (RBAC) enforced server-side on every API request.

---

## 3. Forecasting & Uncertainty Interval Boundary

- **Current Prototype Implementation**:
  - Cold-start progression begins with `v0-naive` (75% baseline attendance heuristic) for 0–5 meals.
  - Progresses to `v1-intent` (intent-weighted linear model with empirical variance bands) for 6+ meals.
  - Displayed uncertainty interval is an **80% Target Prediction Interval** derived from sample standard errors.
- **Enterprise Production Architecture**:
  - Non-conformity score quantile calibration across 100+ historical services per meal type.
  - Split-conformal prediction providing finite-sample distribution-free validity guarantees.
  - Auto-regressive features incorporating weather forecasts, academic calendar exam dates, and festival holidays.

---

## 4. Experimentation & A/B Testing Boundary

- **Current Prototype Implementation**:
  - Experiment results for EXP-01, EXP-02, and EXP-03 are **Simulated Demo Benchmarks** seeded with statistically plausible cohorts.
  - Demonstrates experiment design, metric tracking, guardrails, and decision frameworks for PM evaluation.
- **Enterprise Production Architecture**:
  - Client-side randomized user hashing ($H(\text{student\_id} + \text{salt}) \pmod{100}$) with server-side cohort verification.
  - Real-time sequential hypothesis testing (e.g., mSPRT) with automated guardrail safety shut-offs.

---

## 5. North Star Metric Scope Boundary

- **Avoidable Waste per Meal**:
  - Defined as $\sum \text{unserved\_waste\_kg} / \sum \text{actual\_diners}$.
  - Excludes customer plate waste (food scraped from trays by students).
  - **Rationale**: MealSense's core value proposition is preventing kitchen overproduction before it is cooked. Portion size adjustments and recipe preferences are tracked as secondary insights rather than the primary demand forecasting optimization target.
