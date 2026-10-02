# ADR 0001: Database-Enforced Business Rules and Zero-Trust RLS Data Layer

## Status
Accepted

## Context
In institutional dining facilities (university hostels, corporate messes), food waste is driven by headcount uncertainty. Implementing an attendance-intent app introduces high-stakes operational and privacy risks:
1. **Hostile Environment & Social Stigma**: If students believe that mess managers or peer students can see whether an individual skipped meals, adoption collapses due to fear of stigma or surveillance.
2. **Client-Side Vulnerabilities**: Client-clock spoofing or mobile app manipulation could allow students to submit changes after kitchen preparation has started, destroying kitchen trust in the intent signal.
3. **Operational Drift**: Application servers and API layers often duplicate or inconsistently enforce cutoff deadlines, rate limits, and status workflows.

## Decision
We enforce all core business rules, privacy barriers, and lifecycle state machines **directly inside PostgreSQL using Row Level Security (RLS), security-definer RPCs, and database triggers**:

1. **Deny-by-Default Row Level Security**:
   - `meal_responses` has an RLS policy that permits `SELECT` strictly where `user_id = auth.uid()`.
   - Neither kitchen staff nor administrators have read access to `meal_responses`.
   - Kitchen and administrative dashboards read exclusively from `meal_intent_counts`, a trigger-maintained aggregate table that exposes only `(n_eat, n_skip, n_late)` without any user foreign keys.

2. **Immutable Append-Only Log**:
   - Every response change writes to `response_log`, capturing behavioral drift while preventing client alteration.

3. **Server-Enforced Cutoff via Security Definer RPC**:
   - `submit_response()` verifies `clock_timestamp()` on the database host against `meals.response_cutoff` and `meals.ends_at`. The client timestamp is never trusted.
   - Late responses submitted after cutoff are automatically tagged with `is_late = true` and counted in `n_late`, ensuring they never inflate preparation targets.

4. **Canonical Units Standardization**:
   - Preparation is strictly tracked in discrete integer `servings`.
   - Food waste is strictly tracked in `kg` (using calibrated kitchen scales).
   - Conversions use a per-hostel calibrated parameter `kg_per_serving`.

## Consequences
- **Positive**:
  - Zero possibility of data leaks exposing individual meal attendance to mess operators, verifiable by automated pgTAP unit tests.
  - Client state tampering is impossible; database rejects out-of-order transitions.
  - Eliminates thousands of lines of API CRUD boilerplate; enables direct, high-performance realtime subscriptions via Supabase.
- **Negative**:
  - Requires maintaining SQL migration files and writing stored procedures (PL/pgSQL) for multi-table writes.
  - Local testing requires a PostgreSQL instance with the pgTAP extension.
