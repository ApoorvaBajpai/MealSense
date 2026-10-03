/**
 * MealSense Funnel Engine
 * Dynamically evaluates conversion funnels by querying stored telemetry events.
 * 
 * Strict Measurement Standards:
 * 1. Student Funnel Denominator: Unique student-meal pairs (not raw events).
 * 2. On-Time Yield: Strictly verifies `is_late !== true` from event properties/payload.
 * 3. Kitchen Funnel Denominator: Unique meal service IDs (prevents outcome > 100% anomaly).
 */

export class FunnelEngine {
  /**
   * Computes the Student Participation Funnel from raw events.
   * Denominator: Unique student × meal exposures.
   */
  getStudentFunnel(provider) {
    const events = provider.getEvents() || [];

    // Helper to extract student-meal pair key (strictly requires both userId and mealId)
    const getStudentMealKey = (e) => {
      const userId = e.user_id || e.payload?.user_id || e.properties?.user_id;
      const mealId = e.meal_id || e.payload?.meal_id || e.properties?.meal_id;
      if (!userId || !mealId) return null;
      return `${userId}::${mealId}`;
    };

    const exposedSet = new Set();
    const startedSet = new Set();
    const submittedSet = new Set();
    const onTimeSet = new Set();

    events.forEach(e => {
      const key = getStudentMealKey(e);
      if (!key) return;
      const isLate = e.properties?.is_late === true || e.payload?.is_late === true;

      if (e.event_name === 'student.meal_viewed') {
        exposedSet.add(key);
      } else if (e.event_name === 'student.response_started') {
        startedSet.add(key);
      } else if (e.event_name === 'student.response_submitted') {
        submittedSet.add(key);
        if (!isLate) {
          onTimeSet.add(key);
        }
      }
    });

    const views = exposedSet.size;
    const starts = startedSet.size;
    const submits = submittedSet.size;
    const onTime = onTimeSet.size;

    // Handle clean empty state
    if (views === 0 && submits === 0) {
      return {
        hasData: false,
        unit: 'Unique student-meal pairs',
        steps: [
          { name: '1. Meal Viewed', count: 0, pct: 0 },
          { name: '2. Response Started', count: 0, pct: 0 },
          { name: '3. Response Submitted', count: 0, pct: 0 },
          { name: '4. On-Time Confirmed', count: 0, pct: 0 }
        ],
        viewToResponseRate: '0.0%',
        onTimeYield: '0.0%'
      };
    }

    const baseline = Math.max(1, views);
    const startPct = Number(((starts / baseline) * 100).toFixed(1));
    const submitPct = Number(((submits / baseline) * 100).toFixed(1));
    const onTimePct = Number(((onTime / baseline) * 100).toFixed(1));

    const viewToResponseRate = views > 0 
      ? `${((submits / views) * 100).toFixed(1)}%` 
      : '0.0%';

    return {
      hasData: true,
      unit: 'Unique student-meal pairs',
      sampleCount: views,
      steps: [
        { name: '1. Meal Viewed', count: views, pct: 100 },
        { name: '2. Response Started', count: starts, pct: Math.min(100, startPct) },
        { name: '3. Response Submitted', count: submits, pct: Math.min(100, submitPct) },
        { name: '4. On-Time Confirmed', count: onTime, pct: Math.min(100, onTimePct), isTarget: true }
      ],
      viewToResponseRate,
      onTimeYield: `${onTimePct}%`
    };
  }

  /**
   * Computes the Kitchen Decision-to-Outcome Funnel from raw events.
   * Denominator: Unique meal service IDs.
   */
  getKitchenFunnel(provider) {
    const events = provider.getEvents() || [];

    const getMealId = (e) => e.meal_id || e.payload?.meal_id || e.properties?.meal_id || null;

    const forecastMeals = new Set();
    const reviewMeals = new Set();
    const decisionMeals = new Set();
    const acceptedMeals = new Set();
    const outcomeMeals = new Set();

    events.forEach(e => {
      const mId = getMealId(e);
      if (!mId) return;

      if (e.event_name === 'kitchen.forecast_viewed') {
        forecastMeals.add(mId);
      } else if (e.event_name === 'kitchen.recommendation_reviewed') {
        reviewMeals.add(mId);
      } else if (e.event_name === 'kitchen.recommendation_accepted') {
        decisionMeals.add(mId);
        acceptedMeals.add(mId);
      } else if (e.event_name === 'kitchen.recommendation_adjusted') {
        decisionMeals.add(mId);
      } else if (e.event_name === 'kitchen.outcome_submitted') {
        outcomeMeals.add(mId);
      }
    });

    const forecastViews = forecastMeals.size;
    const recReviews = reviewMeals.size;
    const decisions = decisionMeals.size;
    const recAccepted = acceptedMeals.size;

    // Guardrail: Outcomes in the sequence must have had a decision recorded
    const validOutcomes = decisions > 0 
      ? new Set([...outcomeMeals].filter(id => decisionMeals.has(id))).size
      : outcomeMeals.size;

    if (forecastViews === 0 && decisions === 0) {
      return {
        hasData: false,
        unit: 'Unique meal services',
        steps: [
          { name: '1. Forecast Viewed', count: 0, pct: 0 },
          { name: '2. Recommendation Reviewed', count: 0, pct: 0 },
          { name: '3. Decision Recorded', count: 0, pct: 0 },
          { name: '4. Accepted Without Override', count: 0, pct: 0 },
          { name: '5. Post-Meal Outcome Logged', count: 0, pct: 0 }
        ],
        acceptanceRate: '0.0%',
        complianceRate: '0.0%'
      };
    }

    const baselineViews = Math.max(1, forecastViews);
    const recPct = Number(((recReviews / baselineViews) * 100).toFixed(1));
    const decPct = Number(((decisions / baselineViews) * 100).toFixed(1));
    const acceptPct = decisions > 0 ? Number(((recAccepted / decisions) * 100).toFixed(1)) : 0;
    const outPct = decisions > 0 ? Number(((validOutcomes / decisions) * 100).toFixed(1)) : 0;

    return {
      hasData: true,
      unit: 'Unique meal services',
      sampleCount: forecastViews,
      steps: [
        { name: '1. Forecast Viewed', count: forecastViews, pct: 100 },
        { name: '2. Recommendation Reviewed', count: recReviews, pct: Math.min(100, recPct) },
        { name: '3. Decision Recorded', count: decisions, pct: Math.min(100, decPct) },
        { name: '4. Accepted Without Override', count: recAccepted, pct: Math.min(100, acceptPct), isTarget: true },
        { name: '5. Post-Meal Outcome Logged', count: validOutcomes, pct: Math.min(100, outPct), isTarget: true }
      ],
      acceptanceRate: `${acceptPct}%`,
      complianceRate: `${outPct}%`
    };
  }
}

export const funnelEngine = new FunnelEngine();
