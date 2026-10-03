/**
 * MealSense Metric Definitions & Provenance Standards
 * Canonical formulas, units, and provenance standards.
 */

export const PROVENANCE = {
  DEMO: 'demo_seeded',
  LIVE: 'live_measured',
  DERIVED: 'calculated_derived',
  SCENARIO: 'scenario_estimate',
  BASELINE: 'baseline_reference'
};

export const METRIC_DEFINITIONS = {
  AVOIDABLE_WASTE_PER_MEAL: {
    key: 'wastePerMealKg',
    name: 'Avoidable Food Waste per Meal',
    unit: 'kg / meal served',
    role: 'North Star Metric',
    formula: 'Sum(unserved_waste_kg) / Sum(actual_attendance)',
    description: 'Average unserved tray surplus food generated per student who attended meal service.'
  },
  OVERPRODUCTION_RATE: {
    key: 'overproductionRate',
    name: 'Kitchen Overproduction Rate',
    unit: '%',
    role: 'Operational Metric',
    formula: 'Max(prepared_servings - actual_attendance, 0) / prepared_servings × 100',
    description: 'Percentage of prepared servings cooked beyond realized diner attendance.'
  },
  SHORTAGE_RATE: {
    key: 'shortageRate',
    name: 'Shortage Frequency Rate',
    unit: '%',
    role: 'Inviolable Guardrail Metric',
    target: '< 0.5%',
    formula: 'Count(meals with ran_short = true) / Total meals served × 100',
    description: 'Frequency of meal services experiencing food shortage. Must remain strictly below 0.5%.'
  },
  FORECAST_MAE: {
    key: 'forecastMae',
    name: 'Forecast Error (MAE)',
    unit: 'heads',
    role: 'Forecast Calibration Metric',
    formula: 'Mean(|prediction - actual_attendance|)',
    description: 'Mean absolute difference between predicted headcount and realized attendance.'
  },
  ON_TIME_RESPONSE_RATE: {
    key: 'onTimeResponseRate',
    name: 'Student On-Time Response Rate',
    unit: '%',
    role: 'Input Participation Metric',
    formula: '(n_eat + n_skip before cutoff) / registered_snapshot × 100',
    description: 'Percentage of eligible residents submitting their meal intent prior to kitchen cutoff deadline.'
  },
  ESTIMATED_SAVINGS: {
    key: 'estimatedMonthlySavings',
    name: 'Estimated Savings vs. Baseline',
    unit: 'INR (₹)',
    role: 'Business Impact Scenario Metric',
    formula: '(baseline_overproduction_rate - current_overproduction_rate) / 100 × total_cooked_servings × cost_per_serving',
    description: 'Calculated savings based on excess preparation avoided relative to historical pre-implementation baseline period.'
  }
};
