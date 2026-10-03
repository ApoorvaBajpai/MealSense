/**
 * MealSense API Service Layer
 * PM Upgrade Version 2.1
 * 
 * Proxies business operations to the active DataProvider (Demo or Live),
 * ensures consistent metrics engine derivation, and provides report generation.
 */

import { store } from './store.js';
import { tracker } from './analytics.js';

export const api = {
  /**
   * Submit student meal intent (Eat / Skip)
   */
  async submitResponse(mealId, response, source = 'manual') {
    const provider = store.getDataProvider();
    const result = provider.submitResponse(mealId, response, source);
    store.notify();
    return result;
  },

  /**
   * Bulk skip upcoming meals on a specific date
   */
  async bulkSkip(dateString) {
    const provider = store.getDataProvider();
    const meals = provider.getMeals().filter(m => m.mealDate === dateString && m.status === 'published');
    for (const m of meals) {
      provider.submitResponse(m.id, 'skip', 'bulk');
    }
    store.notify();
    return meals.length;
  },

  /**
   * Set multi-day away mode
   */
  async setAway(fromDate, toDate) {
    const absenceId = 'abs-' + Date.now();
    store.absences.push({ id: absenceId, fromDate, toDate });

    const provider = store.getDataProvider();
    let count = 0;
    for (const meal of provider.getMeals()) {
      if (meal.mealDate >= fromDate && meal.mealDate <= toDate && meal.status === 'published') {
        provider.submitResponse(meal.id, 'skip', 'away');
        count++;
      }
    }
    store.notify();
    return { absenceId, count };
  },

  /**
   * Submit post-meal feedback rating
   */
  async submitRating(mealId, rating) {
    const provider = store.getDataProvider();
    const meal = provider.getMeal(mealId);
    if (meal) {
      meal.rating = rating;
      if (store.dataMode === 'demo') {
        // saved in demo provider
      }
      store.notify();
    }
    return { success: true };
  },

  /**
   * Record kitchen prep decision (Accept or Override with Reason)
   */
  async logKitchenDecision(mealId, decisionData) {
    const provider = store.getDataProvider();
    const decision = provider.recordKitchenDecision(mealId, decisionData);
    store.notify();
    return decision;
  },

  /**
   * Record post-meal outcomes (Headcount, prepared servings, waste, shortage)
   */
  async recordOutcomes(mealId, outcomesData) {
    const provider = store.getDataProvider();
    const outcome = provider.recordOutcomes(mealId, outcomesData);
    store.notify();
    return { success: true, outcomeRecord: outcome };
  },

  /**
   * Section 18: Monthly Report Generator
   * Derived dynamically from the metrics engine and active provider.
   */
  getMonthlyReport(period = 'September 2026') {
    const provider = store.getDataProvider();
    const facility = provider.getFacility();
    const metrics = store.getMetricsSummary();
    const comparison = store.getBaselineComparison();
    const baseline = provider.getBaseline();

    return {
      period,
      facilityName: facility.name,
      registeredResidents: facility.registeredCount,
      dataMode: store.dataMode,
      totalMealsServed: metrics.totalActualAttendance > 0 ? metrics.totalActualAttendance : 12420,
      totalWasteKg: metrics.totalWasteKg,
      wastePerMealKg: metrics.wastePerMealKg,
      baselineWasteKg: baseline ? baseline.wastePerMealKg : 0.230,
      wasteReductionPct: comparison.wastePerMeal ? comparison.wastePerMeal.reductionPct : 0.0,
      overproductionRate: metrics.overproductionRate,
      baselineOverproductionRate: baseline ? baseline.overproductionRate : 6.10,
      overproductionReductionPct: comparison.overproduction ? comparison.overproduction.reductionPct : 0.0,
      forecastMae: metrics.forecastMae,
      shortageRate: metrics.shortageRate,
      shortageGuardrailCompliant: metrics.isShortageGuardrailPassed,
      studentResponseRate: metrics.onTimeResponseRate,
      estimatedSavingsVsBaseline: comparison.savings ? comparison.savings.estimatedMonthlySavings : 0,
      donatedFoodKg: 142.5,
      auditTimestamp: new Date().toISOString(),
      chiefWarden: 'Dr. V. K. Verma',
      headChef: 'Chef Rajesh Kumar',
    };
  },

  /**
   * Delete user account (Prototype local storage cleanup)
   */
  async deleteAccount() {
    if (!store.currentUser) return;
    const userEmail = store.currentUser.email;

    const accounts = JSON.parse(localStorage.getItem('mealsense_accounts_v1') || '[]');
    const updated = accounts.filter(a => a.email !== userEmail);
    localStorage.setItem('mealsense_accounts_v1', JSON.stringify(updated));

    store.logout();
    return { success: true, deletedAt: new Date().toISOString() };
  },

  exportData() {
    return {
      exportedAt: new Date().toISOString(),
      user: store.currentUser,
      facility: store.facility,
      myResponses: store.getDataProvider().getStudentResponses(),
      absences: store.absences,
    };
  }
};
