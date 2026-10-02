# MealSense: Technical Data Model & Schema Specification

## 1. Core Relational Entities

### 1.1 Facilities & Members
```sql
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    capacity INT NOT NULL DEFAULT 450,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',
    default_serving_kg NUMERIC(4,3) DEFAULT 0.350,
    default_cost_per_serving NUMERIC(8,2) DEFAULT 42.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE facility_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'kitchen', 'admin')),
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Meals & Student Intent
```sql
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    meal_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
    name VARCHAR(150) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    response_cutoff TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- 'published', 'closed'
    registered_snapshot INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Zero-Trust Student Responses (RLS Protected)
CREATE TABLE meal_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    response VARCHAR(10) NOT NULL CHECK (response IN ('eat', 'skip')),
    source VARCHAR(20) NOT NULL DEFAULT 'manual', -- 'manual', 'bulk', 'away'
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (meal_id, user_id)
);

-- Trigger-Maintained Anonymous Aggregates (Readable by Kitchen)
CREATE TABLE meal_intent_counts (
    meal_id UUID PRIMARY KEY REFERENCES meals(id),
    n_eat INT NOT NULL DEFAULT 0,
    n_skip INT NOT NULL DEFAULT 0,
    n_late INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Kitchen Decisions & Post-Meal Outcomes
```sql
-- Kitchen Decision Audit Log
CREATE TABLE kitchen_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id),
    recommended_quantity INT NOT NULL,
    selected_quantity INT NOT NULL,
    adjustment_amount INT NOT NULL DEFAULT 0,
    adjustment_reason VARCHAR(100), -- 'higher_expected', 'previous_shortage', 'special_event', 'weather', 'other'
    adjusted_by UUID NOT NULL REFERENCES auth.users(id),
    adjusted_at TIMESTAMPTZ DEFAULT now()
);

-- Realized Operational Outcomes
CREATE TABLE meal_outcomes (
    meal_id UUID PRIMARY KEY REFERENCES meals(id),
    actual_attendance INT NOT NULL,
    prepared_quantity INT NOT NULL,
    unserved_waste_kg NUMERIC(6,3) NOT NULL,
    plate_waste_kg NUMERIC(6,3) NOT NULL,
    surplus_disposition VARCHAR(30) NOT NULL, -- 'discarded', 'donated', 'refrigerated'
    shortage BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    recorded_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Baseline Periods & Experiment Framework
```sql
CREATE TABLE baseline_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    baseline_type VARCHAR(50) NOT NULL,
    baseline_waste_per_meal NUMERIC(6,4) NOT NULL,
    baseline_overproduction_rate NUMERIC(5,2) NOT NULL,
    baseline_shortage_rate NUMERIC(5,2) NOT NULL,
    baseline_cost_per_serving NUMERIC(8,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE experiments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    primary_metric VARCHAR(100) NOT NULL,
    guardrail_metric VARCHAR(100) NOT NULL,
    winner_variant VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id VARCHAR(50) NOT NULL REFERENCES experiments(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    variant VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (experiment_id, user_id)
);
```
