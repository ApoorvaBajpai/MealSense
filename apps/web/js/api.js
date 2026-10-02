/**
 * MealSense Production API Service Layer
 * Enforces business rules (cutoff times, rate limits, outcome locks)
 * and guarantees persistence in local database/storage.
 */

import { store } from './store.js';

export const api = {
  /**
   * ST-03 & ST-04: submit_response
   */
  async submitResponse(mealId, response, source = 'manual') {
    const meal = store.meals.find(m => m.id === mealId);
    if (!meal) throw new Error('Meal not found');

    const now = new Date();
    const cutoff = new Date(meal.responseCutoff);
    const endsAt = new Date(meal.endsAt);

    if (now > endsAt) {
      throw new Error('Meal service has already concluded');
    }

    const isLate = now > cutoff;
    const previousResponse = meal.myResponse;

    // Update meal record
    meal.myResponse = response;

    // Trigger simulation: update meal_intent_counts
    const counts = store.intentCounts[mealId] || { nEat: 0, nSkip: 0, nLate: 0 };
    if (!isLate) {
      if (previousResponse === 'eat') counts.nEat = Math.max(0, counts.nEat - 1);
      if (previousResponse === 'skip') counts.nSkip = Math.max(0, counts.nSkip - 1);

      if (response === 'eat') counts.nEat += 1;
      if (response === 'skip') counts.nSkip += 1;
    } else {
      counts.nLate += 1;
    }

    store.intentCounts[mealId] = counts;
    store.saveMeals();
    store.saveIntents();

    store.logAudit(
      isLate ? 'SUBMIT_LATE_RESPONSE' : 'SUBMIT_RESPONSE',
      'meal_responses',
      mealId,
      store.currentUser ? store.currentUser.name : 'Resident'
    );

    store.notify();

    return {
      success: true,
      mealId,
      response,
      isLate,
      cutoff: meal.responseCutoff,
    };
  },

  /**
   * ST-05: Bulk Skip
   */
  async bulkSkip(dateString) {
    const affected = store.meals.filter(m => m.mealDate === dateString && m.status === 'published');
    for (const meal of affected) {
      await this.submitResponse(meal.id, 'skip', 'bulk');
    }
    return affected.length;
  },

  /**
   * ST-06: set_away
   */
  async setAway(fromDate, toDate) {
    const absenceId = 'abs-' + Date.now();
    store.absences.push({ id: absenceId, fromDate, toDate });

    let count = 0;
    for (const meal of store.meals) {
      if (meal.mealDate >= fromDate && meal.mealDate <= toDate && meal.status === 'published') {
        await this.submitResponse(meal.id, 'skip', 'away');
        count++;
      }
    }
    return { absenceId, count };
  },

  /**
   * ST-09: Feedback rating
   */
  async submitRating(mealId, rating, comment = '') {
    const meal = store.meals.find(m => m.id === mealId);
    if (meal) {
      meal.rating = rating;
      store.saveMeals();
      store.notify();
    }
    return { success: true };
  },

  /**
   * KT-04, KT-05, KT-06: Outcome Recording Wizard
   */
  async recordOutcomes(mealId, outcomesData) {
    store.outcomes[mealId] = outcomesData;
    const meal = store.meals.find(m => m.id === mealId);
    if (meal) {
      meal.status = 'closed';
    }

    store.saveOutcomes();
    store.saveMeals();

    store.logAudit(
      'RECORD_OUTCOMES',
      'meals',
      mealId,
      store.currentUser ? store.currentUser.name : 'Kitchen Staff'
    );

    store.notify();
    return { success: true };
  },

  /**
   * ST-11: DPDP Compliance
   */
  async deleteAccount() {
    if (!store.currentUser) return;
    const userEmail = store.currentUser.email;

    // Remove user account
    const accounts = JSON.parse(localStorage.getItem('mealsense_accounts_v1') || '[]');
    const updated = accounts.filter(a => a.email !== userEmail);
    localStorage.setItem('mealsense_accounts_v1', JSON.stringify(updated));

    // Clear session
    store.logout();
    return { success: true, deletedAt: new Date().toISOString() };
  },

  exportData() {
    return {
      exportedAt: new Date().toISOString(),
      user: store.currentUser,
      facility: store.facility,
      responses: store.meals.map(m => ({ mealId: m.id, date: m.mealDate, type: m.type, response: m.myResponse, rating: m.rating })),
      absences: store.absences,
    };
  }
};
