/**
 * MealSense Automated Test Suite
 * Covers Unit Tests (MetricEngine, BaselineEngine, TrendEngine, FunnelEngine, InsightEngine, ExperimentEngine)
 * and Full Closed-Loop Integration Test:
 * Student Eat -> Intent Count -> Forecast -> Kitchen Decision -> Outcome -> Metric Engine -> Admin View
 */

import { MetricEngine } from '../metrics/metric-engine.js';
import { BaselineEngine } from '../metrics/baseline-engine.js';
import { TrendEngine } from '../metrics/trend-engine.js';
import { FunnelEngine } from '../metrics/funnel-engine.js';
import { InsightEngine } from '../metrics/insight-engine.js';
import { ExperimentEngine } from '../metrics/experiment-engine.js';
import { LiveDataProvider } from '../data/live/live-provider.js';
import { demoDataProvider } from '../data/demo/demo-provider.js';

// Minimal Assertion Helper
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertClose(actual, expected, delta = 0.01, message) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`${message || 'Assertion failed'}: expected close to ${expected} (±${delta}), got ${actual}`);
  }
}

// Mock Data Provider for isolated unit tests
class MockDataProvider {
  constructor(options = {}) {
    this.mode = options.mode || 'live';
    this.facility = options.facility || { name: 'Test Hostel', registeredCount: 400 };
    this.baseline = options.baseline !== undefined ? options.baseline : null;
    this.meals = options.meals || [];
    this.outcomes = options.outcomes || {};
    this.predictions = options.predictions || {};
    this.kitchenDecisions = options.kitchenDecisions || {};
    this.intentCounts = options.intentCounts || {};
    this.events = options.events || [];
    this.experiments = options.experiments || [];
  }

  getFacility() { return this.facility; }
  getBaseline() { return this.baseline; }
  getMeals() { return this.meals; }
  getMeal(id) { return this.meals.find(m => m.id === id) || null; }
  getAllOutcomes() { return this.outcomes; }
  getOutcomes(id) { return this.outcomes[id] || null; }
  getAllPredictions() { return this.predictions; }
  getPredictions(id) { return this.predictions[id] || null; }
  getAllKitchenDecisions() { return this.kitchenDecisions; }
  getKitchenDecisions(id) { return this.kitchenDecisions[id] || null; }
  getAllIntentCounts() { return this.intentCounts; }
  getIntentCounts(id) { return this.intentCounts[id] || { nEat: 0, nSkip: 0, nLate: 0 }; }
  getEvents() { return this.events; }
  getExperiments() { return this.experiments; }
}

export async function runAllTests() {
  const suites = [
    { name: 'Unit: MetricEngine - Clean Empty State (0 meals)', fn: testMetricEngineEmptyState },
    { name: 'Unit: MetricEngine - Single Meal Scenarios & Edge Cases', fn: testMetricEngineSingleMealScenarios },
    { name: 'Unit: MetricEngine - Shortage vs No Shortage Guardrail', fn: testMetricEngineShortageGuardrail },
    { name: 'Unit: MetricEngine - Forecast MAE & Directional Bias', fn: testMetricEngineMaeAndBias },
    { name: 'Unit: BaselineEngine - Missing Baseline Graceful Handling', fn: testBaselineEngineMissingBaseline },
    { name: 'Unit: BaselineEngine - Real Baseline Calculations & Savings', fn: testBaselineEngineCalculations },
    { name: 'Unit: TrendEngine - Zero Fallbacks & Missing Data Null Handling', fn: testTrendEngineZeroFallbacks },
    { name: 'Unit: TrendEngine - True Calendar Bucketing (No Midpoint)', fn: testTrendEngineTrueBucketing },
    { name: 'Unit: FunnelEngine - Telemetry Derived Student & Kitchen Funnels', fn: testFunnelEngineTelemetry },
    { name: 'Unit: InsightEngine - Friday Variance & Dish Waste Statistics', fn: testInsightEngineStatistics },
    { name: 'Unit: ExperimentEngine - Simulated Benchmark Disclosures', fn: testExperimentEngineBenchmarks },
    { name: 'Integration: Closed-Loop Lifecycle (Student -> Kitchen -> Outcome -> Admin)', fn: testClosedLoopIntegration }
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    const start = performance.now();
    try {
      await suite.fn();
      const duration = (performance.now() - start).toFixed(1);
      results.push({ name: suite.name, status: 'PASSED', duration: `${duration}ms` });
      passed++;
    } catch (err) {
      const duration = (performance.now() - start).toFixed(1);
      results.push({ name: suite.name, status: 'FAILED', duration: `${duration}ms`, error: err.message });
      failed++;
    }
  }

  return {
    total: suites.length,
    passed,
    failed,
    results
  };
}

// --- Test Implementations ---

function testMetricEngineEmptyState() {
  const engine = new MetricEngine();
  const provider = new MockDataProvider({
    meals: [],
    outcomes: {}
  });

  const summary = engine.calculateSummary(provider);
  assertEqual(summary.hasData, false, 'Empty state hasData should be false');
  assertEqual(summary.totalMealsClosed, 0, 'totalMealsClosed should be 0');
  assertEqual(summary.wastePerMealKg, 0.0, 'wastePerMealKg should be 0.0');
  assertEqual(summary.overproductionRate, 0.0, 'overproductionRate should be 0.0');
  assertEqual(summary.shortagesCount, 0, 'shortagesCount should be 0');
  assertEqual(summary.forecastMae, 0.0, 'forecastMae should be 0.0');
}

function testMetricEngineSingleMealScenarios() {
  const engine = new MetricEngine();

  // Scenario A: 1 Meal, Prediction = Actual
  const providerA = new MockDataProvider({
    meals: [{ id: 'm1', name: 'Meal 1', status: 'closed' }],
    outcomes: {
      m1: { mealId: 'm1', actualCount: 300, preparedServings: 320, unservedKg: 6.0, uneatenKg: 3.0, ranShort: false }
    },
    predictions: {
      m1: { prediction: 300 }
    }
  });

  const summaryA = engine.calculateSummary(providerA);
  assertEqual(summaryA.hasData, true, 'hasData should be true');
  assertEqual(summaryA.totalMealsClosed, 1, '1 meal closed');
  assertEqual(summaryA.totalActualAttendance, 300, '300 diners');
  assertEqual(summaryA.wastePerMealKg, 0.02, '6.0 kg / 300 diners = 0.02 kg/meal');
  assertEqual(summaryA.overproductionRate, 6.3, '20 / 320 = 6.25% rounded to 6.3%');
  assertEqual(summaryA.forecastMae, 0.0, 'MAE = |300 - 300| = 0.0');
  assertEqual(summaryA.forecastBias, 0.0, 'Bias = 0.0');

  // Scenario B: Zero Attendance Edge Case
  const providerB = new MockDataProvider({
    meals: [{ id: 'm2', status: 'closed' }],
    outcomes: {
      m2: { mealId: 'm2', actualCount: 0, preparedServings: 100, unservedKg: 20.0, uneatenKg: 0, ranShort: false }
    }
  });
  const summaryB = engine.calculateSummary(providerB);
  assertEqual(summaryB.wastePerMealKg, 0.0, 'Division by zero attendance safely yields 0.0');

  // Scenario C: Zero Prepared Servings Edge Case
  const providerC = new MockDataProvider({
    meals: [{ id: 'm3', status: 'closed' }],
    outcomes: {
      m3: { mealId: 'm3', actualCount: 0, preparedServings: 0, unservedKg: 0, uneatenKg: 0, ranShort: false }
    }
  });
  const summaryC = engine.calculateSummary(providerC);
  assertEqual(summaryC.overproductionRate, 0.0, 'Zero prepared servings safely yields 0.0% overproduction');
}

function testMetricEngineShortageGuardrail() {
  const engine = new MetricEngine();

  // 1 shortage out of 4 meals = 25.0%
  const provider = new MockDataProvider({
    outcomes: {
      m1: { mealId: 'm1', actualCount: 300, preparedServings: 300, unservedKg: 1, ranShort: false },
      m2: { mealId: 'm2', actualCount: 320, preparedServings: 300, unservedKg: 0, ranShort: true },
      m3: { mealId: 'm3', actualCount: 290, preparedServings: 300, unservedKg: 2, ranShort: false },
      m4: { mealId: 'm4', actualCount: 280, preparedServings: 300, unservedKg: 4, ranShort: false }
    }
  });

  const summary = engine.calculateSummary(provider);
  assertEqual(summary.shortagesCount, 1, '1 shortage count');
  assertEqual(summary.shortageRate, 25.0, 'Shortage rate 25.0%');
}

function testMetricEngineMaeAndBias() {
  const engine = new MetricEngine();

  // Meal 1: Pred 320, Actual 300 (Overpredicted +20)
  // Meal 2: Pred 280, Actual 290 (Underpredicted -10)
  // MAE = (20 + 10) / 2 = 15.0
  // Bias = (20 - 10) / 2 = +5.0
  const provider = new MockDataProvider({
    outcomes: {
      m1: { mealId: 'm1', actualCount: 300, preparedServings: 330, unservedKg: 5, ranShort: false },
      m2: { mealId: 'm2', actualCount: 290, preparedServings: 290, unservedKg: 1, ranShort: false }
    },
    predictions: {
      m1: { prediction: 320 },
      m2: { prediction: 280 }
    }
  });

  const summary = engine.calculateSummary(provider);
  assertEqual(summary.forecastMae, 15.0, 'MAE should be 15.0');
  assertEqual(summary.forecastBias, 5.0, 'Bias should be +5.0');
}

function testBaselineEngineMissingBaseline() {
  const engine = new BaselineEngine();
  const metricEngine = new MetricEngine();
  const provider = new MockDataProvider({
    baseline: null,
    outcomes: {
      m1: { mealId: 'm1', actualCount: 300, preparedServings: 320, unservedKg: 6, ranShort: false }
    }
  });

  const summary = metricEngine.calculateSummary(provider);
  const comparison = engine.compare(null, summary, provider.getFacility());
  assertEqual(comparison.hasBaseline, false, 'hasBaseline should be false when baseline is null');
}

function testBaselineEngineCalculations() {
  const engine = new BaselineEngine();
  const metricEngine = new MetricEngine();
  const baseline = {
    period: 'Aug 1-31',
    wastePerMealKg: 0.230,
    overproductionRate: 6.10,
    forecastMae: 8.6,
    shortageRate: 0.40,
    costPerServing: 42.00
  };

  const provider = new MockDataProvider({
    baseline,
    meals: [{ id: 'm1', status: 'closed' }],
    outcomes: {
      m1: { mealId: 'm1', actualCount: 300, preparedServings: 310, unservedKg: 54.0, ranShort: false }
    }
  });

  const summary = metricEngine.calculateSummary(provider);
  const comparison = engine.compare(baseline, summary, provider.getFacility());
  assertEqual(comparison.hasBaseline, true, 'hasBaseline should be true');
  assertEqual(comparison.wastePerMeal.current, 0.180, 'Waste per meal is 0.180 kg');
  assertEqual(comparison.wastePerMeal.reductionPct, 21.7, 'Waste reduction is 21.7%');
  assertEqual(typeof comparison.savings.observedAvoidedPlates, 'number', 'Observed avoided plates is numeric');
}

function testTrendEngineZeroFallbacks() {
  const engine = new TrendEngine();

  // Empty provider: trend values MUST be empty or null, never 7.0 or 75.0!
  const provider = new MockDataProvider({
    meals: [],
    outcomes: {},
    predictions: {}
  });

  const trendMae = engine.getSeries('forecastMae', '30d', provider);
  assertEqual(trendMae.hasData, false, 'forecastMae on empty data hasData is false');
  assertEqual(trendMae.values.length, 0, 'empty values array');

  const trendResp = engine.getSeries('responseRate', '30d', provider);
  assertEqual(trendResp.hasData, false, 'responseRate on empty data hasData is false');
  assertEqual(trendResp.values.length, 0, 'empty values array');
}

function testTrendEngineTrueBucketing() {
  const engine = new TrendEngine();

  // Test 90-day calendar bucketing across 3 true monthly buckets
  const now = new Date();
  const provider = new MockDataProvider({
    baseline: { wastePerMealKg: 0.230 },
    meals: [
      { id: 'm1', status: 'closed', mealDate: now.toISOString().split('T')[0] }
    ],
    outcomes: {
      m1: { mealId: 'm1', actualCount: 300, preparedServings: 310, unservedKg: 54.0, ranShort: false }
    }
  });

  const trend90d = engine.getSeries('wastePerMeal', '90d', provider);
  assertEqual(trend90d.labels.length, 3, '90d trend should have 3 calendar month labels');
  // Middle month has no meals seeded: MUST return null, NOT synthetic (baseline + current) / 2
  assertEqual(trend90d.values[1], null, 'Empty middle calendar month must be null (no synthetic midpoint)');
}

function testFunnelEngineTelemetry() {
  const engine = new FunnelEngine();
  const provider = new MockDataProvider({
    events: [
      { event_name: 'student.meal_viewed' },
      { event_name: 'student.meal_viewed' },
      { event_name: 'student.response_started' },
      { event_name: 'student.response_submitted', payload: { is_late: false } },
      { event_name: 'kitchen.forecast_viewed' },
      { event_name: 'kitchen.recommendation_reviewed' },
      { event_name: 'kitchen.recommendation_accepted' }
    ]
  });

  const studentFunnel = engine.getStudentFunnel(provider);
  assertEqual(studentFunnel.steps[0].count, 2, '2 meal views');
  assertEqual(studentFunnel.steps[1].count, 1, '1 response started');
  assertEqual(studentFunnel.steps[2].count, 1, '1 response submitted');

  const kitchenFunnel = engine.getKitchenFunnel(provider);
  assertEqual(kitchenFunnel.steps[0].count, 1, '1 forecast viewed');
  assertEqual(kitchenFunnel.steps[2].count, 1, '1 decision recorded');
}

function testInsightEngineStatistics() {
  const engine = new InsightEngine();
  const metricEngine = new MetricEngine();
  const baselineEngine = new BaselineEngine();

  // Provider with insufficient meals: should return empty or null insights
  const emptyProvider = new MockDataProvider({ outcomes: {} });
  const emptySummary = metricEngine.calculateSummary(emptyProvider);
  const emptyInsights = engine.generateInsights(emptyProvider, emptySummary, null);
  assertEqual(emptyInsights.length, 0, 'No insights emitted without sufficient data');

  demoDataProvider.resetDemo();
  const demoSummary = metricEngine.calculateSummary(demoDataProvider);
  const demoBaselineComp = baselineEngine.compare(demoDataProvider.getBaseline(), demoSummary, demoDataProvider.getFacility());
  const demoInsights = engine.generateInsights(demoDataProvider, demoSummary, demoBaselineComp);
  assert(demoInsights.length >= 2, 'Demo mode should generate at least 2 statistical insights');
  if (!demoInsights.some(i => i.id === 'ins-friday-variance')) {
    throw new Error('Got insights: ' + JSON.stringify(demoInsights.map(i => i.id)));
  }
  assert(demoInsights.some(i => i.id === 'ins-waste-reduction'), 'Avoidable waste reduction insight generated');
}

function testExperimentEngineBenchmarks() {
  const engine = new ExperimentEngine();
  const experiments = engine.getExperiments(demoDataProvider);

  assertEqual(experiments.length, 3, 'Should define 3 standard product experiments');
  assert(experiments.every(exp => exp.result.badgeLabel === 'Simulated Demo Benchmark'), 'All demo experiments must be explicitly classified as Simulated Demo Benchmark');
}

async function testClosedLoopIntegration() {
  // Backup any existing live user state so test execution is strictly isolated and non-destructive
  const LIVE_KEYS = [
    'mealsense_live_meals_v2',
    'mealsense_live_intents_v2',
    'mealsense_live_outcomes_v2',
    'mealsense_live_decisions_v2',
    'mealsense_live_predictions_v2',
    'mealsense_live_events_v2',
    'mealsense_live_facility_v2',
    'mealsense_live_baseline_v2',
    'mealsense_live_audits_v2'
  ];

  const backup = {};
  LIVE_KEYS.forEach(k => {
    backup[k] = localStorage.getItem(k);
    localStorage.removeItem(k);
  });

  try {
    const liveProvider = new LiveDataProvider();
    liveProvider.clearAll();

    // 1. Publish Meal with future cutoff
    const today = new Date().toISOString().split('T')[0];
    const meal = liveProvider.createMeal({
      mealDate: today,
      type: 'lunch',
      name: 'Integration Test Thali',
      items: ['Paneer Makhani', 'Jeera Rice', 'Tandoori Roti'],
      startTime: '12:30',
      endTime: '14:30',
      cutoffTime: '23:59'
    });
    assert(meal && meal.id, 'Meal successfully created');

    // 2. Student Submits Intent On-Time
    const respResult = liveProvider.submitResponse(meal.id, 'eat', 'integration_test');
    assertEqual(respResult.success, true, 'Intent response submitted successfully');
    assertEqual(respResult.isLate, false, 'Response is on-time');
    const intent = liveProvider.getIntentCounts(meal.id);
    assertEqual(intent.nEat, 1, 'Intent count incremented to 1');

    // 3. Kitchen Forecast Check
    const pred = liveProvider.getPredictions(meal.id);
    assert(pred && typeof pred.prediction === 'number', 'Prediction snapshot generated');
    assertEqual(pred.modelVersion, 'v0-naive', 'First live meal has cold-start v0-naive model');

    // 4. Kitchen Decision
    const decision = liveProvider.recordKitchenDecision(meal.id, {
      recommendedQuantity: pred.prediction,
      selectedQuantity: pred.prediction + 10,
      adjustmentAmount: 10,
      adjustmentReason: 'expected_guest_group',
      adjustedBy: 'Chef Tester'
    });
    assertEqual(decision.adjustmentAmount, 10, 'Adjustment recorded');

    // 5. Post-Meal Outcome Audit
    const outcome = liveProvider.recordOutcomes(meal.id, {
      actualCount: 310,
      preparedServings: 320,
      unservedKg: 4.5,
      uneatenKg: 2.1,
      ranShort: false,
      surplusDisposition: 'refrigerated'
    });
    assertEqual(outcome.actualCount, 310, 'Outcome recorded');

    // 6. Metrics Engine Evaluation
    const metricEngine = new MetricEngine();
    const summary = metricEngine.calculateSummary(liveProvider);
    assertEqual(summary.hasData, true, 'Summary now has data');
    assertEqual(summary.totalMealsClosed, 1, '1 meal closed');
    assertEqual(summary.totalActualAttendance, 310, '310 diners');
    assertEqual(summary.shortagesCount, 0, '0 shortages');
    assertEqual(summary.wastePerMealKg, Number((4.5 / 310).toFixed(3)), 'Avoidable waste correctly calculated');
  } finally {
    // Restore user's real live state
    LIVE_KEYS.forEach(k => {
      if (backup[k] !== null && backup[k] !== undefined) {
        localStorage.setItem(k, backup[k]);
      } else {
        localStorage.removeItem(k);
      }
    });
  }
}
