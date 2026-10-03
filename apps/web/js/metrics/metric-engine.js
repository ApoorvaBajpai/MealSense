/**
 * MealSense Central Metrics Engine
 * Single source of calculation truth for both DEMO MODE and LIVE MODE.
 * Evaluates core KPIs dynamically from stored meal, outcome, prediction, and decision records.
 */

import { PROVENANCE } from './metric-definitions.js';

export class MetricEngine {
  /**
   * Calculate summary metrics from any DataProvider instance.
   */
  calculateSummary(provider) {
    const facility = provider.getFacility();
    const meals = provider.getMeals();
    const outcomesMap = provider.getAllOutcomes();
    const predictionsMap = provider.getAllPredictions();
    const decisionsMap = provider.getAllKitchenDecisions();
    const intentCountsMap = provider.getAllIntentCounts();

    const outcomesList = Object.values(outcomesMap || {});
    const closedCount = outcomesList.length;

    // Handle clean/empty state (Live mode with zero recorded outcomes)
    if (closedCount === 0) {
      return {
        hasData: false,
        totalMealsClosed: 0,
        totalMealsServed: 0,
        wastePerMealKg: 0.0,
        totalWasteKg: 0.0,
        unservedWasteKg: 0.0,
        plateWasteKg: 0.0,
        overproductionRate: 0.0,
        shortageRate: 0.0,
        shortagesCount: 0,
        forecastMae: 0.0,
        forecastBias: 0.0,
        onTimeResponseRate: 0.0,
        recommendationAcceptanceRate: 0.0,
        totalCookedServings: 0,
        totalActualAttendance: 0,
        provenance: provider.mode === 'demo' ? PROVENANCE.DEMO : PROVENANCE.LIVE
      };
    }

    // 1. Attendance & Cooked Totals
    const totalActualAttendance = outcomesList.reduce((acc, o) => acc + (Number(o.actualCount) || 0), 0);
    const totalCookedServings = outcomesList.reduce((acc, o) => acc + (Number(o.preparedServings) || 0), 0);

    // 2. Waste Aggregation (Distinguish unserved tray waste from plate scrapings)
    let unservedWasteKg = 0;
    let plateWasteKg = 0;

    outcomesList.forEach(o => {
      // Direct unserved/uneaten if present
      if (typeof o.unservedKg === 'number') {
        unservedWasteKg += o.unservedKg;
      }
      if (typeof o.uneatenKg === 'number') {
        plateWasteKg += o.uneatenKg;
      }

      // Or parse from wasteRecords array
      if (Array.isArray(o.wasteRecords)) {
        o.wasteRecords.forEach(r => {
          if (!r.donated) {
            if (r.wasteType === 'not_served' && typeof o.unservedKg !== 'number') {
              unservedWasteKg += Number(r.quantityKg || 0);
            } else if (r.wasteType === 'uneaten' && typeof o.uneatenKg !== 'number') {
              plateWasteKg += Number(r.quantityKg || 0);
            }
          }
        });
      }
    });

    const totalWasteKg = unservedWasteKg + plateWasteKg;

    // 3. North Star Metric: Avoidable Food Waste per Meal Served
    // Formula: unserved_waste_kg / actual_diners_served
    const wastePerMealKg = totalActualAttendance > 0 
      ? Number((unservedWasteKg / totalActualAttendance).toFixed(3))
      : 0.0;

    // 4. Overproduction Rate
    // Formula: max(prepared - actual, 0) / prepared * 100
    const overproducedServings = Math.max(0, totalCookedServings - totalActualAttendance);
    const overproductionRate = totalCookedServings > 0 
      ? Number(((overproducedServings / totalCookedServings) * 100).toFixed(1))
      : 0.0;

    // 5. Shortage Rate (Guardrail Metric)
    const shortagesCount = outcomesList.filter(o => o.ranShort).length;
    const shortageRate = closedCount > 0 
      ? Number(((shortagesCount / closedCount) * 100).toFixed(1))
      : 0.0;

    // 6. Forecast Quality: MAE & Bias across closed meals with predictions
    let maeSum = 0;
    let biasSum = 0;
    let evaluatedForecastCount = 0;

    outcomesList.forEach(outcome => {
      const pred = predictionsMap[outcome.mealId];
      if (pred && typeof pred.prediction === 'number' && typeof outcome.actualCount === 'number') {
        const error = Math.abs(pred.prediction - outcome.actualCount);
        const bias = pred.prediction - outcome.actualCount;
        maeSum += error;
        biasSum += bias;
        evaluatedForecastCount++;
      }
    });

    const forecastMae = evaluatedForecastCount > 0 
      ? Number((maeSum / evaluatedForecastCount).toFixed(1))
      : 0.0;
    const forecastBias = evaluatedForecastCount > 0 
      ? Number((biasSum / evaluatedForecastCount).toFixed(1))
      : 0.0;

    // 7. Input Response Rate
    let totalEligible = 0;
    let totalOnTimeResponses = 0;

    meals.forEach(m => {
      const intent = intentCountsMap[m.id];
      const registered = m.registeredSnapshot || facility.registeredCount || 450;
      if (intent && registered > 0) {
        totalEligible += registered;
        totalOnTimeResponses += (intent.nEat || 0) + (intent.nSkip || 0);
      }
    });

    const onTimeResponseRate = totalEligible > 0 
      ? Number(((totalOnTimeResponses / totalEligible) * 100).toFixed(1))
      : 0.0;

    // 8. Kitchen Recommendation Acceptance Rate
    const decisionsList = Object.values(decisionsMap || {});
    const acceptedCount = decisionsList.filter(d => d.adjustmentAmount === 0).length;
    const recommendationAcceptanceRate = decisionsList.length > 0 
      ? Number(((acceptedCount / decisionsList.length) * 100).toFixed(1))
      : 0.0;

    const avgAdjustmentServings = decisionsList.length > 0 
      ? Number((decisionsList.reduce((acc, d) => acc + (d.adjustmentAmount || 0), 0) / decisionsList.length).toFixed(1))
      : 0.0;

    return {
      hasData: true,
      totalMealsClosed: closedCount,
      totalMealsServed: totalActualAttendance,
      wastePerMealKg,
      totalWasteKg: Number(totalWasteKg.toFixed(2)),
      unservedWasteKg: Number(unservedWasteKg.toFixed(2)),
      plateWasteKg: Number(plateWasteKg.toFixed(2)),
      overproductionRate,
      shortageRate,
      shortagesCount,
      isShortageGuardrailPassed: shortageRate < 0.5,
      forecastMae,
      forecastBias,
      onTimeResponseRate,
      recommendationAcceptanceRate,
      avgAdjustmentServings,
      totalCookedServings,
      totalActualAttendance,
      provenance: provider.mode === 'demo' ? PROVENANCE.DEMO : PROVENANCE.LIVE
    };
  }
}

export const metricEngine = new MetricEngine();
