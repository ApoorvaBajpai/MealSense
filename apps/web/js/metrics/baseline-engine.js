/**
 * MealSense Baseline Comparison Engine
 * Evaluates like-for-like operational changes against pre-implementation baseline.
 * Enforces defensible "Estimated Savings vs Baseline" formulas.
 */

import { PROVENANCE } from './metric-definitions.js';

export class BaselineEngine {
  /**
   * Compares an active baseline against a current metric summary.
   */
  compare(baseline, currentSummary, facility) {
    if (!baseline || typeof baseline.wastePerMealKg !== 'number' || typeof baseline.overproductionRate !== 'number') {
      return {
        hasBaseline: false,
        message: 'No pre-implementation baseline established yet.'
      };
    }

    if (!currentSummary || !currentSummary.hasData) {
      return {
        hasBaseline: true,
        baseline,
        hasCurrentData: false,
        message: 'Awaiting operational meals to measure change against baseline.'
      };
    }

    const baselineWaste = Number(baseline.wastePerMealKg);
    const currentWaste = Number(currentSummary.wastePerMealKg) || 0;
    const wasteDeltaKg = Number((currentWaste - baselineWaste).toFixed(3));
    const wasteReductionPct = baselineWaste > 0 
      ? Number((((baselineWaste - currentWaste) / baselineWaste) * 100).toFixed(1))
      : 0;

    const baselineOverprod = Number(baseline.overproductionRate);
    const currentOverprod = Number(currentSummary.overproductionRate) || 0;
    const overprodDeltaPp = Number((currentOverprod - baselineOverprod).toFixed(1));
    const overproductionReductionPct = baselineOverprod > 0 
      ? Number((((baselineOverprod - currentOverprod) / baselineOverprod) * 100).toFixed(1))
      : 0;

    const baselineMae = Number(baseline.forecastMae);
    const currentMae = Number(currentSummary.forecastMae) || 0;
    const maeReductionPct = baselineMae > 0 && currentMae > 0
      ? Number((((baselineMae - currentMae) / baselineMae) * 100).toFixed(1))
      : 0;

    // Savings Calculation
    // (baselineOverprodRate - currentOverprodRate)/100 * totalCookedServings * costPerServing
    const costPerServing = Number(facility?.costPerServing || baseline.costPerServing || 42.00);
    const cookedServings = currentSummary.totalCookedServings || 0;

    // Direct savings on observed meals
    const observedAvoidedPlates = Math.max(0, ((baselineOverprod - currentOverprod) / 100) * cookedServings);
    const observedSavings = Math.round(observedAvoidedPlates * costPerServing);

    // Monthly scaled projection (e.g. 450 residents * 3 meals * 30 days = 40,500 monthly meals)
    const monthlyMeals = (facility?.registeredCount || 450) * (facility?.mealsPerDay || 3) * 30;
    const monthlyAvoidedPlates = Math.max(0, Math.round(((baselineOverprod - currentOverprod) / 100) * monthlyMeals));
    const estimatedMonthlySavings = Math.round(monthlyAvoidedPlates * costPerServing);

    const baselineShortage = typeof baseline.shortageRate === 'number' ? baseline.shortageRate : 0.0;

    return {
      hasBaseline: true,
      hasCurrentData: true,
      baseline,
      wastePerMeal: {
        baseline: baselineWaste,
        current: currentWaste,
        deltaKg: wasteDeltaKg,
        reductionPct: wasteReductionPct,
        improved: wasteReductionPct > 0
      },
      overproduction: {
        baseline: baselineOverprod,
        current: currentOverprod,
        deltaPp: overprodDeltaPp,
        reductionPct: overproductionReductionPct,
        improved: overproductionReductionPct > 0
      },
      forecastMae: {
        baseline: baselineMae,
        current: currentMae,
        reductionPct: maeReductionPct,
        improved: maeReductionPct > 0
      },
      shortageRate: {
        baseline: baselineShortage,
        current: currentSummary.shortageRate,
        isGuardrailSatisfied: currentSummary.shortageRate < 0.5
      },
      savings: {
        costPerServing,
        observedAvoidedPlates: Math.round(observedAvoidedPlates),
        observedSavings,
        estimatedMonthlySavings,
        provenance: PROVENANCE.SCENARIO,
        label: 'Scenario / Demo Estimate'
      }
    };
  }
}

export const baselineEngine = new BaselineEngine();
