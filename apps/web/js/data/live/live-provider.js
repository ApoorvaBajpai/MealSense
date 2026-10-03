/**
 * MealSense Live Data Provider
 * First-class provider implementing the DataProvider interface for LIVE MODE.
 * Operates on real operational records (clean slate for newly registered facilities).
 * Never injects seeded dummy data into live mode.
 */

const LIVE_MEALS_KEY = 'mealsense_live_meals_v2';
const LIVE_INTENT_KEY = 'mealsense_live_intents_v2';
const LIVE_OUTCOMES_KEY = 'mealsense_live_outcomes_v2';
const LIVE_DECISIONS_KEY = 'mealsense_live_decisions_v2';
const LIVE_PREDICTIONS_KEY = 'mealsense_live_predictions_v2';
const LIVE_EVENTS_KEY = 'mealsense_live_events_v2';
const LIVE_AUDIT_KEY = 'mealsense_live_audits_v2';
const LIVE_BASELINE_KEY = 'mealsense_live_baseline_v2';
const LIVE_FACILITY_KEY = 'mealsense_live_facility_v2';

export class LiveDataProvider {
  constructor() {
    this.mode = 'live';
    this.loadState();
  }

  loadState() {
    this.facility = this._load(LIVE_FACILITY_KEY, {
      id: 'live-facility-default',
      name: 'Main Campus Dining Hall',
      timezone: 'Asia/Kolkata',
      registeredCount: 0,
      kgPerServing: 0.350,
      costPerServing: 42.00,
      mealsPerDay: 3,
      saasPlanCostPerMonth: 3999,
      provenance: 'live_configured'
    });
    this.baseline = this._load(LIVE_BASELINE_KEY, null); // Null until facility sets a baseline!
    this.meals = this._load(LIVE_MEALS_KEY, []);
    this.intentCounts = this._load(LIVE_INTENT_KEY, {});
    this.predictions = this._load(LIVE_PREDICTIONS_KEY, {});
    this.kitchenDecisions = this._load(LIVE_DECISIONS_KEY, {});
    this.outcomes = this._load(LIVE_OUTCOMES_KEY, {});
    this.events = this._load(LIVE_EVENTS_KEY, []);
    this.auditLogs = this._load(LIVE_AUDIT_KEY, []);
  }

  clearAll() {
    this.meals = [];
    this.intentCounts = {};
    this.predictions = {};
    this.kitchenDecisions = {};
    this.outcomes = {};
    this.events = [];
    this.auditLogs = [];
    this.baseline = null;
    [
      LIVE_MEALS_KEY,
      LIVE_INTENT_KEY,
      LIVE_OUTCOMES_KEY,
      LIVE_DECISIONS_KEY,
      LIVE_PREDICTIONS_KEY,
      LIVE_EVENTS_KEY,
      LIVE_AUDIT_KEY,
      LIVE_BASELINE_KEY
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  }

  _load(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(`Error loading key ${key}`, e);
    }
    return fallback;
  }

  _save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error saving key ${key}`, e);
    }
  }

  // --- Data Provider Interface Queries ---

  getFacility() {
    return { ...this.facility, provenance: 'live_operational' };
  }

  setFacility(facilityData) {
    this.facility = { ...this.facility, ...facilityData, provenance: 'live_operational' };
    this._save(LIVE_FACILITY_KEY, this.facility);
  }

  getBaseline() {
    return this.baseline ? { ...this.baseline, provenance: 'live_baseline' } : null;
  }

  setBaseline(baselineData) {
    this.baseline = { ...baselineData, provenance: 'live_baseline' };
    this._save(LIVE_BASELINE_KEY, this.baseline);
  }

  getMeals() {
    return [...this.meals];
  }

  getMeal(mealId) {
    return this.meals.find(m => m.id === mealId) || null;
  }

  getIntentCounts(mealId) {
    return this.intentCounts[mealId] || { nEat: 0, nSkip: 0, nLate: 0 };
  }

  getAllIntentCounts() {
    return { ...this.intentCounts };
  }

  getPredictions(mealId) {
    return this.predictions[mealId] || null;
  }

  getAllPredictions() {
    return { ...this.predictions };
  }

  getKitchenDecisions(mealId) {
    return this.kitchenDecisions[mealId] || null;
  }

  getAllKitchenDecisions() {
    return { ...this.kitchenDecisions };
  }

  getOutcomes(mealId) {
    return this.outcomes[mealId] || null;
  }

  getAllOutcomes() {
    return { ...this.outcomes };
  }

  getEvents() {
    return [...this.events];
  }

  getExperiments() {
    // In live mode, experiments are not seeded with fake test results
    return [];
  }

  getStudentResponses() {
    // Collect from actual real meals
    return this.meals
      .filter(m => m.myResponse)
      .map(m => ({ mealId: m.id, date: m.mealDate, response: m.myResponse, isLate: false }));
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }

  // --- Data Provider Mutations ---

  submitResponse(mealId, response, source = 'manual') {
    const meal = this.getMeal(mealId);
    if (!meal) throw new Error('Meal not found');

    const now = new Date();
    const cutoff = new Date(meal.responseCutoff);
    const isLate = now > cutoff;
    const prev = meal.myResponse;

    meal.myResponse = response;

    const counts = this.intentCounts[mealId] || { nEat: 0, nSkip: 0, nLate: 0 };
    if (!isLate) {
      if (prev === 'eat') counts.nEat = Math.max(0, counts.nEat - 1);
      if (prev === 'skip') counts.nSkip = Math.max(0, counts.nSkip - 1);

      if (response === 'eat') counts.nEat += 1;
      if (response === 'skip') counts.nSkip += 1;
    } else {
      counts.nLate += 1;
    }

    this.intentCounts[mealId] = counts;
    this._save(LIVE_MEALS_KEY, this.meals);
    this._save(LIVE_INTENT_KEY, this.intentCounts);

    this.logEvent(isLate ? 'student.response_late' : 'student.response_submitted', {
      meal_id: mealId,
      response,
      source,
      is_late: isLate
    });

    return { success: true, isLate, counts };
  }

  recordKitchenDecision(mealId, decisionData) {
    const decision = {
      mealId,
      recommendedQuantity: decisionData.recommendedQuantity,
      selectedQuantity: decisionData.selectedQuantity,
      adjustmentAmount: decisionData.adjustmentAmount || 0,
      adjustmentReason: decisionData.adjustmentReason || 'accepted_recommendation',
      adjustedBy: decisionData.adjustedBy || 'Live Kitchen Staff',
      adjustedAt: new Date().toISOString(),
      provenance: 'live_decision'
    };

    this.kitchenDecisions[mealId] = decision;
    this._save(LIVE_DECISIONS_KEY, this.kitchenDecisions);
    this.logEvent(decision.adjustmentAmount === 0 ? 'kitchen.recommendation_accepted' : 'kitchen.recommendation_adjusted', decision);
    return decision;
  }

  recordOutcomes(mealId, outcomesData) {
    const meal = this.getMeal(mealId);
    if (meal) meal.status = 'closed';

    const outcome = {
      mealId,
      actualCount: Number(outcomesData.actualCount),
      preparedServings: Number(outcomesData.preparedServings),
      surplusDisposition: outcomesData.surplusDisposition || 'refrigerated',
      unservedKg: Number(outcomesData.unservedKg || 0),
      uneatenKg: Number(outcomesData.uneatenKg || 0),
      totalWasteKg: Number((Number(outcomesData.unservedKg || 0) + Number(outcomesData.uneatenKg || 0)).toFixed(3)),
      ranShort: Boolean(outcomesData.ranShort),
      wasteRecords: outcomesData.wasteRecords || [],
      recordedAt: new Date().toISOString(),
      provenance: 'live_outcome'
    };

    this.outcomes[mealId] = outcome;
    this._save(LIVE_OUTCOMES_KEY, this.outcomes);
    this._save(LIVE_MEALS_KEY, this.meals);
    this.logEvent('kitchen.outcome_submitted', outcome);
    return outcome;
  }

  createMeal(mealData) {
    const id = 'live-meal-' + Date.now();
    const newMeal = {
      id,
      mealDate: mealData.mealDate,
      type: mealData.type,
      name: mealData.name,
      items: mealData.items,
      startsAt: `${mealData.mealDate}T${mealData.startTime}:00`,
      endsAt: `${mealData.mealDate}T${mealData.endTime}:00`,
      responseCutoff: `${mealData.mealDate}T${mealData.cutoffTime}:00`,
      status: 'published',
      registeredSnapshot: this.facility.registeredCount,
      myResponse: null,
      rating: null,
      provenance: 'live_meal'
    };

    this.meals.push(newMeal);
    this.intentCounts[id] = { nEat: 0, nSkip: 0, nLate: 0 };
    
    // Default initial prediction snapshot for newly published live meal
    this.predictions[id] = {
      id: 'pred-' + id,
      mealId: id,
      prediction: Math.round(this.facility.registeredCount * 0.75),
      lowerBound: Math.round(this.facility.registeredCount * 0.70),
      upperBound: Math.round(this.facility.registeredCount * 0.80),
      modelVersion: 'v0-naive',
      confidenceLevel: 0.80,
      intervalTarget: 0.80,
      sampleCount: Object.keys(this.outcomes).length,
      generatedAt: new Date().toISOString()
    };

    this._save(LIVE_MEALS_KEY, this.meals);
    this._save(LIVE_INTENT_KEY, this.intentCounts);
    this._save(LIVE_PREDICTIONS_KEY, this.predictions);

    this.logEvent('meal_published', { meal_id: id, name: newMeal.name });
    return newMeal;
  }

  logEvent(eventName, properties = {}) {
    this.events.push({
      event_name: eventName,
      user_id: 'live-user',
      user_role: 'live',
      facility_id: this.facility.id,
      timestamp: new Date().toISOString(),
      session_id: 'live-session',
      app_version: '2.0.0',
      properties
    });
    if (this.events.length > 500) this.events.shift();
    this._save(LIVE_EVENTS_KEY, this.events);
  }
}

export const liveDataProvider = new LiveDataProvider();
