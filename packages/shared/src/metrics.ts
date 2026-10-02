/**
 * MealSense: Canonical Metric Calculation Functions (TypeScript)
 * Mirrors SQL views in v_meal_facts to ensure client and server parity.
 */

export interface MealFactsInput {
  actualCount: number | null;
  registeredSnapshot: number;
  preparedServings: number | null;
  unservedKg: number;
  uneatenKg: number;
  spoiledKg: number;
  totalWasteKg: number;
  kgPerServing: number;
  predictedHistory: number | null;
  predictedIntent: number | null;
  lowerIntent: number | null;
  upperIntent: number | null;
  nEat: number;
  nSkip: number;
  nLate: number;
}

export interface CalculatedMetrics {
  wasteKgPerMealServed: number | null;
  overproductionServings: number | null;
  overproductionRate: number | null;
  wastePctOfPrepared: number | null;
  forecastErrorHistory: number | null;
  forecastErrorIntent: number | null;
  attendanceRate: number | null;
  responseRate: number | null;
  isIntervalCoveredIntent: boolean | null;
}

export function calculateMealMetrics(input: MealFactsInput): CalculatedMetrics {
  const {
    actualCount,
    registeredSnapshot,
    preparedServings,
    unservedKg,
    totalWasteKg,
    kgPerServing,
    predictedHistory,
    predictedIntent,
    lowerIntent,
    upperIntent,
    nEat,
    nSkip,
  } = input;

  const wasteKgPerMealServed =
    actualCount && actualCount > 0
      ? Number((totalWasteKg / actualCount).toFixed(4))
      : null;

  const overproductionServings =
    preparedServings !== null && actualCount !== null
      ? preparedServings - actualCount
      : null;

  const overproductionRate =
    preparedServings && preparedServings > 0 && overproductionServings !== null
      ? Number((overproductionServings / preparedServings).toFixed(4))
      : null;

  const preparedKg =
    preparedServings && preparedServings > 0 && kgPerServing > 0
      ? preparedServings * kgPerServing
      : null;

  const wastePctOfPrepared =
    preparedKg && preparedKg > 0
      ? Number(((unservedKg / preparedKg) * 100).toFixed(2))
      : null;

  const forecastErrorHistory =
    actualCount !== null && predictedHistory !== null
      ? actualCount - predictedHistory
      : null;

  const forecastErrorIntent =
    actualCount !== null && predictedIntent !== null
      ? actualCount - predictedIntent
      : null;

  const attendanceRate =
    registeredSnapshot > 0 && actualCount !== null
      ? Number((actualCount / registeredSnapshot).toFixed(4))
      : null;

  const responseRate =
    registeredSnapshot > 0
      ? Number(((nEat + nSkip) / registeredSnapshot).toFixed(4))
      : null;

  const isIntervalCoveredIntent =
    actualCount !== null && lowerIntent !== null && upperIntent !== null
      ? actualCount >= lowerIntent && actualCount <= upperIntent
      : null;

  return {
    wasteKgPerMealServed,
    overproductionServings,
    overproductionRate,
    wastePctOfPrepared,
    forecastErrorHistory,
    forecastErrorIntent,
    attendanceRate,
    responseRate,
    isIntervalCoveredIntent,
  };
}
