/**
 * MealSense Demo Data Provider
 * First-class provider implementing the DataProvider interface for DEMO MODE.
 * Backed by demo-seed.js, demo-baseline.js, demo-events.js, and demo-experiments.js.
 * Mutations are session/demo-isolated and can be restored anytime via resetDemo().
 */

import { createDemoSeed } from './demo-seed.js';
import { DEMO_BASELINE } from './demo-baseline.js';
import { generateDemoEvents } from './demo-events.js';
import { DEMO_EXPERIMENTS } from './demo-experiments.js';

const DEMO_STORAGE_KEY = 'mealsense_demo_state_v3';

export class DemoDataProvider {
  constructor() {
    this.mode = 'demo';
    this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.meals && parsed.meals.length >= 30) {
          this.facility = parsed.facility;
          this.meals = parsed.meals;
          this.intentCounts = parsed.intentCounts;
          this.predictions = parsed.predictions;
          this.kitchenDecisions = parsed.kitchenDecisions;
          this.outcomes = parsed.outcomes;
          this.studentResponses = parsed.studentResponses || [];
          this.auditLogs = parsed.auditLogs || [];
          this.events = parsed.events || generateDemoEvents();
          this.experiments = parsed.experiments || DEMO_EXPERIMENTS;
          this.baseline = parsed.baseline || DEMO_BASELINE;
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load demo state from localStorage, initializing fresh seed', e);
    }
    this.resetDemo();
  }

  saveState() {
    try {
      const payload = {
        facility: this.facility,
        meals: this.meals,
        intentCounts: this.intentCounts,
        predictions: this.predictions,
        kitchenDecisions: this.kitchenDecisions,
        outcomes: this.outcomes,
        studentResponses: this.studentResponses,
        auditLogs: this.auditLogs,
        events: this.events,
        experiments: this.experiments,
        baseline: this.baseline
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save demo state', e);
    }
  }

  resetDemo() {
    const seed = createDemoSeed();
    this.facility = seed.facility;
    this.meals = seed.meals;
    this.intentCounts = seed.intentCounts;
    this.predictions = seed.predictions;
    this.kitchenDecisions = seed.kitchenDecisions;
    this.outcomes = seed.outcomes;
    this.studentResponses = seed.studentResponses;
    this.auditLogs = seed.auditLogs;
    this.events = generateDemoEvents();
    this.experiments = JSON.parse(JSON.stringify(DEMO_EXPERIMENTS));
    this.baseline = { ...DEMO_BASELINE };
    this.saveState();
  }

  // --- Data Provider Interface Queries ---

  getFacility() {
    return { ...this.facility, provenance: 'demo_seeded' };
  }

  getBaseline() {
    return { ...this.baseline, provenance: 'demo_baseline' };
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
    return [...this.experiments];
  }

  getStudentResponses() {
    return [...this.studentResponses];
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

    // Track student response entry
    const existing = this.studentResponses.find(r => r.mealId === mealId);
    if (existing) {
      existing.response = response;
      existing.isLate = isLate;
    } else {
      this.studentResponses.push({
        mealId,
        date: meal.mealDate,
        response,
        isLate
      });
    }

    // Telemetry event logging
    this.logEvent(isLate ? 'student.response_late' : 'student.response_submitted', {
      meal_id: mealId,
      response,
      source,
      is_late: isLate
    });

    this.saveState();
    return { success: true, isLate, counts };
  }

  recordKitchenDecision(mealId, decisionData) {
    const decision = {
      mealId,
      recommendedQuantity: decisionData.recommendedQuantity,
      selectedQuantity: decisionData.selectedQuantity,
      adjustmentAmount: decisionData.adjustmentAmount || 0,
      adjustmentReason: decisionData.adjustmentReason || 'accepted_recommendation',
      adjustedBy: decisionData.adjustedBy || 'Chef Rajesh Kumar (Demo)',
      adjustedAt: new Date().toISOString(),
      provenance: 'demo_decision'
    };

    this.kitchenDecisions[mealId] = decision;
    this.logEvent(decision.adjustmentAmount === 0 ? 'kitchen.recommendation_accepted' : 'kitchen.recommendation_adjusted', decision);
    this.saveState();
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
      provenance: 'demo_outcome'
    };

    this.outcomes[mealId] = outcome;
    this.logEvent('kitchen.outcome_submitted', outcome);
    this.saveState();
    return outcome;
  }

  createMeal(mealData) {
    const id = 'demo-meal-' + Date.now();
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
    };

    this.meals.push(newMeal);
    this.intentCounts[id] = { nEat: 0, nSkip: 0, nLate: 0 };
    
    // Add default initial prediction snapshot for newly published meal
    this.predictions[id] = {
      id: 'pred-' + id,
      mealId: id,
      prediction: Math.round(this.facility.registeredCount * 0.75),
      lowerBound: Math.round(this.facility.registeredCount * 0.70),
      upperBound: Math.round(this.facility.registeredCount * 0.80),
      modelVersion: 'v0-naive',
      confidenceLevel: 0.80,
      sampleCount: Object.keys(this.outcomes).length,
      generatedAt: new Date().toISOString()
    };

    this.saveState();
    return newMeal;
  }

  logEvent(eventName, properties = {}) {
    this.events.push({
      event_name: eventName,
      user_id: 'demo-user',
      user_role: 'demo',
      facility_id: this.facility.id,
      timestamp: new Date().toISOString(),
      session_id: 'demo-session',
      app_version: '2.0.0',
      properties
    });
    if (this.events.length > 500) this.events.shift();
  }
}

export const demoDataProvider = new DemoDataProvider();
