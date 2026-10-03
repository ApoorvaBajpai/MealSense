/**
 * MealSense First-Party Telemetry Tracker
 * PM Upgrade Version 2.0
 * 
 * Strictly adheres to docs/analytics/event-taxonomy.md
 * Tracks student funnels, kitchen decision adherence, and experiment metrics.
 */

import { store } from './store.js';

class AnalyticsTracker {
  constructor() {
    this.sessionId = 'sess-' + Math.random().toString(36).substring(2, 9);
    this.eventBuffer = [];
  }

  track(eventName, props = {}) {
    const user = store.currentUser;
    const payload = {
      event_name: eventName,
      user_id: user ? user.id : 'anonymous',
      user_role: user ? user.role : 'guest',
      facility_id: store.facility?.id || 'facility-default',
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      app_version: '2.0.0',
      properties: {
        ...props,
        active_timeframe: store.selectedTimeframe,
      },
    };

    this.eventBuffer.push(payload);
    if (this.eventBuffer.length > 200) this.eventBuffer.shift();

    // Log for developer inspection
    console.debug(`[Telemetry: ${eventName}]`, payload);
  }

}

export const tracker = new AnalyticsTracker();
