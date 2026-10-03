/**
 * MealSense Funnel Engine
 * Dynamically evaluates conversion funnels by querying stored telemetry events.
 * Replaces hardcoded static funnel percentages.
 */

export class FunnelEngine {
  /**
   * Computes the Student Participation Funnel from raw events.
   */
  getStudentFunnel(provider) {
    const events = provider.getEvents();

    const countEvent = (name) => events.filter(e => e.event_name === name).length;

    const views = countEvent('student.meal_viewed');
    const starts = countEvent('student.response_started');
    const submits = countEvent('student.response_submitted');
    const late = countEvent('student.response_late');
    const onTime = Math.max(0, submits - late);

    // If completely empty in Live mode, show empty funnel
    if (views === 0) {
      return {
        hasData: false,
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

    const startPct = views > 0 ? Number(((starts / views) * 100).toFixed(1)) : 0;
    const submitPct = views > 0 ? Number(((submits / views) * 100).toFixed(1)) : 0;
    const onTimePct = views > 0 ? Number(((onTime / views) * 100).toFixed(1)) : 0;

    const viewToResponseRate = views > 0 
      ? `${((submits / views) * 100).toFixed(1)}%` 
      : '0.0%';

    return {
      hasData: true,
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
   */
  getKitchenFunnel(provider) {
    const events = provider.getEvents();

    const countEvent = (name) => events.filter(e => e.event_name === name).length;

    const forecastViews = countEvent('kitchen.forecast_viewed');
    const recReviews = countEvent('kitchen.recommendation_reviewed');
    const recAccepted = countEvent('kitchen.recommendation_accepted');
    const recAdjusted = countEvent('kitchen.recommendation_adjusted');
    const decisions = recAccepted + recAdjusted;
    const outcomes = countEvent('kitchen.outcome_submitted');

    if (forecastViews === 0 && decisions === 0) {
      return {
        hasData: false,
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
    const outPct = decisions > 0 ? Number(((outcomes / decisions) * 100).toFixed(1)) : 0;

    return {
      hasData: true,
      steps: [
        { name: '1. Forecast Viewed', count: forecastViews, pct: 100 },
        { name: '2. Recommendation Reviewed', count: recReviews, pct: Math.min(100, recPct) },
        { name: '3. Decision Recorded', count: decisions, pct: Math.min(100, decPct) },
        { name: '4. Accepted Without Override', count: recAccepted, pct: Math.min(100, acceptPct), isTarget: true },
        { name: '5. Post-Meal Outcome Logged', count: outcomes, pct: Math.min(100, outPct), isTarget: true }
      ],
      acceptanceRate: `${acceptPct}%`,
      complianceRate: `${outPct}%`
    };
  }
}

export const funnelEngine = new FunnelEngine();
