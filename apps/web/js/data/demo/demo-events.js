/**
 * MealSense Demo Event Telemetry Seed
 * Contains structured telemetry events across student, kitchen, and admin workflows
 * used by FunnelEngine to compute realistic conversion funnels from raw events.
 */

export function generateDemoEvents() {
  const events = [];
  const facilityId = 'demo-facility-ramanujan';
  const now = Date.now();

  // Helper to add events over past 7 days
  function addBatch(name, role, count, properties = {}, timeOffsetMinutes = 0) {
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (timeOffsetMinutes * 60000) - (i * 35000)).toISOString();
      events.push({
        event_name: name,
        user_id: `demo-user-${(i % 50) + 1}`,
        user_role: role,
        facility_id: facilityId,
        meal_id: 'demo-today-lunch',
        session_id: `sess-demo-${(i % 30) + 1}`,
        app_version: '2.0.0',
        timestamp,
        properties: {
          ...properties,
          provenance: 'demo_seeded_event'
        }
      });
    }
  }

  // 1. Student Participation Funnel Events (Target: ~450 eligible students)
  // Step 1: meal_viewed (424 events)
  addBatch('student.meal_viewed', 'student', 424, { meal_type: 'lunch' }, 120);

  // Step 2: response_started (398 events)
  addBatch('student.response_started', 'student', 398, { meal_type: 'lunch' }, 110);

  // Step 3: response_submitted (372 events: 318 eat, 52 skip, 2 late)
  addBatch('student.response_submitted', 'student', 318, { meal_type: 'lunch', response: 'eat', is_late: false }, 90);
  addBatch('student.response_submitted', 'student', 52, { meal_type: 'lunch', response: 'skip', is_late: false }, 85);
  addBatch('student.response_submitted', 'student', 2, { meal_type: 'lunch', response: 'eat', is_late: true }, 10);

  // Response changed & late events
  addBatch('student.response_changed', 'student', 14, { meal_type: 'lunch', from: 'eat', to: 'skip' }, 70);
  addBatch('student.impact_viewed', 'student', 186, { section: 'my_impact' }, 60);

  // 2. Kitchen Decision-to-Outcome Funnel Events (Target: 100 historical meal services)
  // Step 1: forecast_viewed (100)
  addBatch('kitchen.forecast_viewed', 'kitchen', 100, {}, 240);

  // Step 2: recommendation_reviewed (100)
  addBatch('kitchen.recommendation_reviewed', 'kitchen', 100, { model_version: 'v1-intent' }, 230);

  // Step 3: decision_recorded (96 decisions: 84 accepted, 12 adjusted)
  addBatch('kitchen.recommendation_accepted', 'kitchen', 84, { delta: 0, reason: 'accepted_recommendation' }, 200);
  addBatch('kitchen.recommendation_adjusted', 'kitchen', 12, { delta: 10, reason: 'higher_expected' }, 190);

  // Step 4: outcome_submitted (98 outcomes logged)
  addBatch('kitchen.outcome_started', 'kitchen', 98, {}, 60);
  addBatch('kitchen.outcome_submitted', 'kitchen', 98, { shortage: false, surplus_disposition: 'refrigerated' }, 45);

  // 3. Admin Events
  addBatch('admin.dashboard_viewed', 'admin', 42, { timeframe: '30d' }, 180);
  addBatch('admin.insight_opened', 'admin', 28, { insight_id: 'lunch-waste-drop' }, 150);
  addBatch('admin.report_exported', 'admin', 12, { format: 'csv' }, 100);

  // 4. Experiment Exposures
  addBatch('experiment.exposure', 'student', 210, { experiment_id: 'exp-01-value-prop', variant: 'A' }, 300);
  addBatch('experiment.exposure', 'student', 214, { experiment_id: 'exp-01-value-prop', variant: 'B' }, 300);

  return events;
}
