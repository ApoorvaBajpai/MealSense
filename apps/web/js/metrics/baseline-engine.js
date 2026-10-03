/**
 * MealSense Baseline Comparison Engine
 * Evaluates like-for-like operational changes against pre-implementation baseline.
 * Enforces defensible "Estimated Savings vs Baseline" formulas with ZERO silent fallbacks.
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

    const baselineMae = typeof baseline.forecastMae === 'number' ? Number(baseline.forecastMae) : null;
    const currentMae = Number(currentSummary.forecastMae) || 0;
    const maeReductionPct = (baselineMae !== null && baselineMae > 0 && currentMae > 0)
      ? Number((((baselineMae - currentMae) / baselineMae) * 100).toFixed(1))
      : null;

    // Savings Calculation: (baselineOverprodRate - currentOverprodRate)/100 * totalCookedServings * costPerServing
    const costPerServing = typeof facility?.costPerServing === 'number' 
      ? facility.costPerServing 
      : (typeof baseline.costPerServing === 'number' ? baseline.costPerServing : null);

    const cookedServings = currentSummary.totalCookedServings || 0;

    // Direct savings on observed meals
    let observedAvoidedPlates = 0;
    let observedSavings = null;
    let estimatedMonthlySavings = null;

    if (costPerServing !== null && cookedServings > 0) {
      observedAvoidedPlates = Math.max(0, ((baselineOverprod - currentOverprod) / 100) * cookedServings);
      observedSavings = Math.round(observedAvoidedPlates * costPerServing);

      if (facility?.registeredCount && facility?.mealsPerDay) {
        const monthlyMeals = facility.registeredCount * facility.mealsPerDay * 30;
        const monthlyAvoidedPlates = Math.max(0, Math.round(((baselineOverprod - currentOverprod) / 100) * monthlyMeals));
        estimatedMonthlySavings = Math.round(monthlyAvoidedPlates * costPerServing);
      }
    }

    const baselineShortage = typeof baseline.shortageRate === 'number' ? Number(baseline.shortageRate) : null;

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
        improved: maeReductionPct !== null && maeReductionPct > 0
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
        estimatedMonthlySavings: estimatedMonthlySavings ?? 0,
        provenance: PROVENANCE.SCENARIO,
        label: 'Scenario / Demo Estimate'
      },
      metrics: [
        {
          key: 'wastePerMeal',
          name: 'Avoidable Waste per Meal',
          baseline: `${baselineWaste.toFixed(3)} kg`,
          current: `${currentWaste.toFixed(3)} kg`,
          delta: `${wasteReductionPct >= 0 ? '↓' : '↑'} ${Math.abs(wasteReductionPct)}%`,
          isGood: wasteReductionPct > 0,
          statusLabel: 'North Star KPI'
        },
        {
          key: 'overproduction',
          name: 'Overproduction Rate',
          baseline: `${baselineOverprod.toFixed(1)}%`,
          current: `${currentOverprod.toFixed(1)}%`,
          delta: `${overproductionReductionPct >= 0 ? '↓' : '↑'} ${Math.abs(overproductionReductionPct)}%`,
          isGood: overproductionReductionPct > 0,
          statusLabel: 'Operational Efficiency'
        },
        {
          key: 'forecastMae',
          name: 'Forecast Error (MAE)',
          baseline: baselineMae !== null ? `${baselineMae} heads` : '—',
          current: `${currentMae} heads`,
          delta: maeReductionPct !== null ? `${maeReductionPct >= 0 ? '↓' : '↑'} ${Math.abs(maeReductionPct)}%` : '—',
          isGood: maeReductionPct !== null && maeReductionPct > 0,
          statusLabel: 'Model Accuracy'
        },
        {
          key: 'shortageRate',
          name: 'Dining Shortage Rate',
          baseline: baselineShortage !== null ? `${baselineShortage.toFixed(2)}%` : '—',
          current: `${currentSummary.shortageRate.toFixed(2)}%`,
          delta: currentSummary.shortageRate < 0.5 ? 'Guardrail Met' : 'Elevated',
          isGood: currentSummary.shortageRate < 0.5,
          statusLabel: 'Food Security Guardrail'
        },
        {
          key: 'estimatedSavings',
          name: 'Estimated Monthly Savings',
          baseline: '₹0 (Pre-system)',
          current: `₹${(estimatedMonthlySavings ?? 0).toLocaleString('en-IN')}`,
          delta: `+₹${(estimatedMonthlySavings ?? 0).toLocaleString('en-IN')}`,
          isGood: (estimatedMonthlySavings ?? 0) > 0,
          statusLabel: 'Defensible Savings'
        }
      ]
    };
  }
}

export const baselineEngine = new BaselineEngine();
