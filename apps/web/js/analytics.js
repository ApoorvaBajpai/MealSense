/**
 * MealSense First-Party Telemetry Tracker
 * Strictly adheres to docs/product/event-taxonomy.md
 */

import { store } from './store.js';

class AnalyticsTracker {
  constructor() {
    this.sessionId = 'sess-' + Math.random().toString(36).substring(2, 9);
    this.eventBuffer = [];
  }

  track(eventName, props = {}) {
    const payload = {
      name: eventName,
      props,
      hostelId: store.currentUser.hostelId,
      userId: store.currentUser.role === 'student' ? store.currentUser.id : null,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.eventBuffer.push(payload);
    // In production, flushes to supabase 'events' table
    console.debug(`[Telemetry] ${eventName}`, props);
  }
}

export const tracker = new AnalyticsTracker();
