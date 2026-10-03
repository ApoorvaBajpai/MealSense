/**
 * MealSense Demo Event Telemetry Seed
 * Contains structured telemetry events across student, kitchen, and admin workflows
 * used by FunnelEngine to compute realistic conversion funnels from raw events.
 */

export function generateDemoEvents() {
  const events = [];
  const facilityId = 'demo-facility-ramanujan';
  const now = Date.now();

  // 1. Student Participation Funnel Events (Target: 424 viewed, 398 started, 372 submitted, 370 on-time)
  // Step 1: meal_viewed (424 unique students)
  for (let i = 0; i < 424; i++) {
    events.push({
      event_name: 'student.meal_viewed',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 120 * 60000 - i * 1000).toISOString(),
      properties: { meal_type: 'lunch', provenance: 'demo_seeded_event' }
    });
  }

  // Step 2: response_started (398 unique students)
  for (let i = 0; i < 398; i++) {
    events.push({
      event_name: 'student.response_started',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 110 * 60000 - i * 1000).toISOString(),
      properties: { meal_type: 'lunch', provenance: 'demo_seeded_event' }
    });
  }

  // Step 3: response_submitted (372 unique students: 318 eat on-time, 52 skip on-time, 2 eat late)
  for (let i = 0; i < 318; i++) {
    events.push({
      event_name: 'student.response_submitted',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 90 * 60000 - i * 1000).toISOString(),
      properties: { meal_type: 'lunch', response: 'eat', is_late: false, provenance: 'demo_seeded_event' }
    });
  }

  for (let i = 318; i < 370; i++) {
    events.push({
      event_name: 'student.response_submitted',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 85 * 60000 - (i - 318) * 1000).toISOString(),
      properties: { meal_type: 'lunch', response: 'skip', is_late: false, provenance: 'demo_seeded_event' }
    });
  }

  // 2 Late Submissions
  for (let i = 370; i < 372; i++) {
    events.push({
      event_name: 'student.response_submitted',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 10 * 60000 - (i - 370) * 1000).toISOString(),
      properties: { meal_type: 'lunch', response: 'eat', is_late: true, provenance: 'demo_seeded_event' }
    });
  }

  // Response changed & Impact viewed
  for (let i = 0; i < 14; i++) {
    events.push({
      event_name: 'student.response_changed',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 70 * 60000).toISOString(),
      properties: { meal_type: 'lunch', from: 'eat', to: 'skip', provenance: 'demo_seeded_event' }
    });
  }

  for (let i = 0; i < 186; i++) {
    events.push({
      event_name: 'student.impact_viewed',
      user_id: `student-${i + 1}`,
      user_role: 'student',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-stu-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 60 * 60000).toISOString(),
      properties: { section: 'my_impact', provenance: 'demo_seeded_event' }
    });
  }

  // 2. Kitchen Decision-to-Outcome Funnel Events (Target: 100 services)
  // Step 1: forecast_viewed (100 unique meal services)
  for (let i = 0; i < 100; i++) {
    events.push({
      event_name: 'kitchen.forecast_viewed',
      user_id: 'staff_testid',
      user_role: 'kitchen',
      facility_id: facilityId,
      meal_id: `service-${i + 1}`,
      session_id: `sess-kitch-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 240 * 60000 - i * 1000).toISOString(),
      properties: { provenance: 'demo_seeded_event' }
    });
  }

  // Step 2: recommendation_reviewed (100 unique meal services)
  for (let i = 0; i < 100; i++) {
    events.push({
      event_name: 'kitchen.recommendation_reviewed',
      user_id: 'staff_testid',
      user_role: 'kitchen',
      facility_id: facilityId,
      meal_id: `service-${i + 1}`,
      session_id: `sess-kitch-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 230 * 60000 - i * 1000).toISOString(),
      properties: { model_version: 'v1-intent', provenance: 'demo_seeded_event' }
    });
  }

  // Step 3: decisions (96 total: 84 accepted, 12 adjusted)
  for (let i = 0; i < 84; i++) {
    events.push({
      event_name: 'kitchen.recommendation_accepted',
      user_id: 'staff_testid',
      user_role: 'kitchen',
      facility_id: facilityId,
      meal_id: `service-${i + 1}`,
      session_id: `sess-kitch-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 200 * 60000 - i * 1000).toISOString(),
      properties: { delta: 0, reason: 'accepted_recommendation', provenance: 'demo_seeded_event' }
    });
  }

  for (let i = 84; i < 96; i++) {
    events.push({
      event_name: 'kitchen.recommendation_adjusted',
      user_id: 'staff_testid',
      user_role: 'kitchen',
      facility_id: facilityId,
      meal_id: `service-${i + 1}`,
      session_id: `sess-kitch-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 190 * 60000 - (i - 84) * 1000).toISOString(),
      properties: { delta: 10, reason: 'higher_expected', provenance: 'demo_seeded_event' }
    });
  }

  // Step 4: outcome_submitted (94 outcomes logged, subset of 96 decisions)
  for (let i = 0; i < 94; i++) {
    events.push({
      event_name: 'kitchen.outcome_submitted',
      user_id: 'staff_testid',
      user_role: 'kitchen',
      facility_id: facilityId,
      meal_id: `service-${i + 1}`,
      session_id: `sess-kitch-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 45 * 60000 - i * 1000).toISOString(),
      properties: { shortage: false, surplus_disposition: 'refrigerated', provenance: 'demo_seeded_event' }
    });
  }

  // 3. Admin Events
  for (let i = 0; i < 42; i++) {
    events.push({
      event_name: 'admin.dashboard_viewed',
      user_id: 'admin_testid',
      user_role: 'admin',
      facility_id: facilityId,
      meal_id: 'demo-today-lunch',
      session_id: `sess-admin-${i + 1}`,
      app_version: '2.0.0',
      timestamp: new Date(now - 180 * 60000).toISOString(),
      properties: { timeframe: '30d', provenance: 'demo_seeded_event' }
    });
  }

  return events;
}
