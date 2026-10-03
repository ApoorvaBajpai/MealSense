/**
 * MealSense Demo Baseline Reference
 * Audited 30-day pre-implementation reference period (August 1 - August 31, 2026)
 */

export const DEMO_BASELINE = {
  id: 'base-aug-2026',
  name: 'Pre-Implementation Historical Baseline (August 2026)',
  facilityId: 'demo-facility-ramanujan',
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  wastePerMealKg: 0.230,           // 0.230 kg/meal unserved waste
  overproductionRate: 6.10,        // 6.10% overprepared servings
  shortageRate: 0.40,              // 0.40% shortage frequency
  forecastMae: 8.60,               // 8.6 heads baseline error
  onTimeResponseRate: 24.5,        // 24.5% baseline participation
  costPerServing: 42.00,           // INR 42.00 per serving
  mealsServed: 38400,
  totalWasteKg: 8832.0,
  provenance: 'baseline_reference'
};
