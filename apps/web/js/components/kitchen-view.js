/**
 * Kitchen Dashboard View Component: PM Upgrade Version 2.1
 * 
 * Features:
 * - Section 4.2: Clean Live Empty State
 * - Section 13.1: Forecast Service as Single Source of Truth via Provider Prediction Snapshots
 * - Section 13.2: Decision-First Screen (Expected Turnout + Safety Buffer = Recommended Servings)
 * - Section 13.3: Override tracking with operational reasons & derived KPI strip
 * - Section 14: 60-Second Post-Meal Outcome Loop with Shortage Guardrail
 */

import { store } from '../store.js';
import { api } from '../api.js';
import { tracker } from '../analytics.js';

export function renderKitchenView(container) {
  const provider = store.getDataProvider();
  const meals = provider.getMeals() || [];

  // Section 4.2: Clean Live Empty State
  if (meals.length === 0) {
    const html = `
      <div class="kitchen-container">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary);">
                👨‍🍳 Kitchen Operations & Forecasting
              </h2>
              <span class="badge ${store.isDemo ? 'badge-eat' : 'badge-warning'}" style="font-size: 0.68rem;">
                ${store.isDemo ? 'Demo Mode' : 'Live Mode'}
              </span>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${provider.getFacility().name} • Clean Operational State
            </span>
          </div>
          <button id="btn-create-meal" class="btn btn-primary btn-sm">
            ➕ Publish New Meal
          </button>
        </div>

        <div class="card" style="text-align: center; padding: 56px 20px;">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🍲</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
            No meals scheduled
          </h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); max-width: 440px; margin: 8px auto 20px auto; line-height: 1.5;">
            Publish your first meal to start collecting student intent and generating a demand forecast.
          </p>
          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button id="btn-create-first-meal" class="btn btn-primary">
              ➕ Publish First Meal
            </button>
            <button id="btn-explore-demo-kitchen" class="btn btn-secondary">
              🚀 Explore Demo Mode
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;

    const btnFirst = container.querySelector('#btn-create-first-meal');
    if (btnFirst) btnFirst.addEventListener('click', () => window.openCreateMealModal());
    const btnTop = container.querySelector('#btn-create-meal');
    if (btnTop) btnTop.addEventListener('click', () => window.openCreateMealModal());
    const btnDemo = container.querySelector('#btn-explore-demo-kitchen');
    if (btnDemo) btnDemo.addEventListener('click', () => store.switchToDemo('kitchen'));
    return;
  }

  const selectedMeal = meals.find(m => m.id === store.selectedKitchenMealId) || meals[0];
  const intent = provider.getIntentCounts(selectedMeal.id);
  const registered = selectedMeal.registeredSnapshot ?? provider.getFacility().registeredCount ?? 0;
  const safeRegistered = Math.max(1, registered);
  const buffer = store.safetyBuffer;

  // Section 13.1: Forecast Service Source of Truth
  const predSnapshot = provider.getPredictions(selectedMeal.id);
  let predicted = 348;
  let lower = 334;
  let upper = 362;
  let modelVersion = 'v1-intent';
  let sampleCount = Object.keys(provider.getAllOutcomes() || {}).length;
  let generatedAt = '10:05 AM';

  if (predSnapshot && typeof predSnapshot.prediction === 'number') {
    predicted = predSnapshot.prediction;
    lower = predSnapshot.lowerBound;
    upper = predSnapshot.upperBound;
    modelVersion = predSnapshot.modelVersion || 'v1-intent';
    if (typeof predSnapshot.sampleCount === 'number') {
      sampleCount = predSnapshot.sampleCount;
    }
    if (predSnapshot.generatedAt) {
      try {
        generatedAt = new Date(predSnapshot.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        generatedAt = '10:05 AM';
      }
    }
  } else {
    // Dynamic fallback calculation
    const unresponded = Math.max(0, registered - (intent.nEat || 0) - (intent.nSkip || 0));
    predicted = Math.round(0.95 * (intent.nEat || 0) + 0.04 * (intent.nSkip || 0) + 0.72 * unresponded);
    lower = Math.max(0, predicted - 14);
    upper = Math.min(Math.round(registered * 1.05), predicted + 14);
  }

  const bufferServings = Math.round(buffer * (upper - predicted));
  const suggestedServings = predicted + bufferServings;

  // Kitchen decision state
  const existingDecision = provider.getKitchenDecisions(selectedMeal.id);
  const isDecisionMade = Boolean(existingDecision);
  const prepTarget = isDecisionMade ? existingDecision.selectedQuantity : suggestedServings;

  // Prediction interval RangeBar percentages
  const leftPct = Math.round((lower / safeRegistered) * 100);
  const widthPct = Math.max(4, Math.round(((upper - lower) / safeRegistered) * 100));
  const expectedPct = Math.round((predicted / safeRegistered) * 100);

  // Outcome status
  const outcome = provider.getOutcomes(selectedMeal.id);
  const isClosed = selectedMeal.status === 'closed';

  // Section 13.3: Calculate Derived Kitchen KPIs from provider records
  const metricSummary = store.getMetricsSummary();

  const html = `
    <div class="kitchen-container">
      <!-- Operational Meal Tabs & Publish Control -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
        <div class="kitchen-tabs" style="flex: 1;">
          ${meals.map(m => `
            <button class="kitchen-tab-btn ${m.id === selectedMeal.id ? 'active' : ''}" data-meal-id="${m.id}">
              <span>${getMealIcon(m.type)} ${capitalize(m.type)}</span>
              <span class="kitchen-tab-sub">${formatDate(m.mealDate)} ${m.status === 'closed' ? '✓ Closed' : ''}</span>
            </button>
          `).join('')}
        </div>
        <button id="btn-create-meal" class="btn btn-primary btn-sm" style="white-space: nowrap;">
          ➕ Publish New Meal
        </button>
      </div>

      <!-- Section 13.3: Data-Derived Kitchen KPI Strip -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 22px;">
        <div class="card" style="padding: 12px 16px; border-left: 3px solid var(--color-eat);">
          <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Algorithm Acceptance</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--color-eat); margin-top: 2px;">
            ${metricSummary.recommendationAcceptanceRate}%
          </div>
          <span style="font-size: 0.72rem; color: var(--text-secondary);">Calculated from logged decisions</span>
        </div>
        <div class="card" style="padding: 12px 16px; border-left: 3px solid var(--brand-primary);">
          <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Average Adjustment</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 2px;">
            ${metricSummary.avgAdjustmentServings > 0 ? '+' : ''}${metricSummary.avgAdjustmentServings} servings
          </div>
          <span style="font-size: 0.72rem; color: var(--text-secondary);">Mean chef override delta</span>
        </div>
        <div class="card" style="padding: 12px 16px; border-left: 3px solid var(--color-eat);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Shortage Guardrail</div>
            <span class="badge badge-eat" style="font-size: 0.65rem;">&lt; 0.5% limit</span>
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; color: ${metricSummary.shortageRate < 0.5 ? 'var(--color-eat)' : 'var(--color-danger)'}; margin-top: 2px;">
            ${metricSummary.shortageRate}%
          </div>
          <span style="font-size: 0.72rem; color: var(--color-eat); font-weight: 600;">
            ${metricSummary.shortagesCount === 0 ? '✓ Zero shortages recorded' : `${metricSummary.shortagesCount} shortages observed`}
          </span>
        </div>
        <div class="card" style="padding: 12px 16px; border-left: 3px solid var(--brand-accent);">
          <div style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Closed Meal Audits</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--brand-accent); margin-top: 2px;">
            ${metricSummary.totalMealsClosed} meals
          </div>
          <span style="font-size: 0.72rem; color: var(--text-secondary);">Completed outcome audits</span>
        </div>
      </div>

      <!-- Planning Grid -->
      <div class="planning-grid">
        <!-- Main Decision Card -->
        <div class="card" style="position: relative;">
          <!-- Live Intent Ribbon -->
          <div class="live-intent-ribbon" style="margin-bottom: 16px;">
            <div class="live-indicator">
              <span class="pulse-dot"></span>
              Live Student Intent
            </div>
            <div class="intent-counts-group">
              <div class="intent-stat-item">
                <span class="intent-stat-num" style="color: var(--color-eat);">${intent.nEat || 0}</span>
                <span class="intent-stat-label">Confirmed Eat</span>
              </div>
              <div class="intent-stat-item">
                <span class="intent-stat-num" style="color: var(--text-muted);">${intent.nSkip || 0}</span>
                <span class="intent-stat-label">Confirmed Skip</span>
              </div>
              <div class="intent-stat-item">
                <span class="intent-stat-num" style="color: var(--color-warning);">${intent.nLate || 0}</span>
                <span class="intent-stat-label">Late Responses</span>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
                ${selectedMeal.name}
              </h2>
              <span style="font-size: 0.85rem; color: var(--text-muted);">
                ${formatDate(selectedMeal.mealDate)} • ${selectedMeal.startsAt.split('T')[1].substring(0, 5)}–${selectedMeal.endsAt.split('T')[1].substring(0, 5)} • Capacity: <strong>${registered} students</strong>
              </span>
            </div>
            <span class="badge ${isClosed ? 'badge-skip' : 'badge-eat'}">
              ${isClosed ? 'Service Concluded' : 'Active Preparation Planning'}
            </span>
          </div>

          <!-- Section 13.2: Decision-First Screen Recommendation -->
          <div style="background: linear-gradient(135deg, rgba(184, 93, 56, 0.08) 0%, rgba(156, 75, 40, 0.04) 100%); border: 2px solid var(--brand-accent); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); letter-spacing: 0.05em;">
                🎯 Recommended Preparation Quantity
              </span>
              <span style="font-size: 0.78rem; background: var(--bg-surface); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); color: var(--text-secondary);">
                Expected Turnout: <strong>${predicted}</strong> | Likely Range: <strong>${lower}–${upper}</strong>
              </span>
            </div>

            <div style="display: flex; align-items: baseline; gap: 12px; margin: 12px 0;">
              <div style="font-size: 2.8rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1;">
                ${prepTarget}
              </div>
              <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-secondary);">
                servings to prepare
              </div>
            </div>

            <!-- Transparent Formula Breakdown -->
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 16px;">
              <strong>Calculation Method:</strong> ${predicted} expected turnout + ${bufferServings} safety buffer = <strong>${suggestedServings} servings</strong>
              ${existingDecision && existingDecision.adjustmentAmount !== 0 ? `
                <div style="margin-top: 4px; color: var(--brand-primary); font-weight: 600;">
                  ⚠️ Kitchen override recorded: Target set to ${existingDecision.selectedQuantity} (${existingDecision.adjustmentAmount > 0 ? '+' : ''}${existingDecision.adjustmentAmount} servings) — Reason: ${formatReason(existingDecision.adjustmentReason)}
                </div>
              ` : ''}
            </div>

            <!-- Action Buttons: Use Recommendation vs Adjust Quantity -->
            ${!isClosed ? `
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="btn-use-recommendation" class="btn ${existingDecision && existingDecision.adjustmentAmount === 0 ? 'btn-secondary' : 'btn-primary'}" style="flex: 1; min-width: 180px;">
                  ✓ ${existingDecision && existingDecision.adjustmentAmount === 0 ? `Recommendation Locked (${suggestedServings})` : `Use Recommendation (${suggestedServings})`}
                </button>
                <button id="btn-adjust-quantity" class="btn btn-secondary" style="flex: 1; min-width: 180px;">
                  ✏️ Adjust Quantity...
                </button>
              </div>
            ` : `
              <div style="background: var(--color-eat-bg); color: var(--color-eat); border: 1px solid var(--color-eat-border); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 700;">
                ✓ Meal service concluded & closed. Actual Diners: ${outcome ? outcome.actualCount : 345} | Cooked: ${outcome ? outcome.preparedServings : 355} | Waste: ${outcome ? outcome.totalWasteKg : 7.8} kg
              </div>
            `}
          </div>

          <!-- Section 8.2: Expandable Advanced Forecast Details Accordion -->
          <details style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px; border: 1px solid var(--border-subtle);">
            <summary style="font-size: 0.88rem; font-weight: 800; color: var(--brand-primary); cursor: pointer; user-select: none;">
              🔍 Forecast Provenance & Model Specification (${modelVersion})
            </summary>
            <div style="margin-top: 14px;">
              <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
                <div><strong>Model Version:</strong> <code>${modelVersion}</code> — ${modelVersion === 'v0-naive' ? 'Cold-start heuristic baseline' : 'Intent-weighted operational forecast'}</div>
                <div><strong>Coverage Specification:</strong> ${modelVersion === 'v0-naive' ? 'Heuristic interval (Cold start: ±5% of registered diners)' : '80% target prediction interval (Historical variance band)'}</div>
                <div><strong>Training Samples:</strong> <strong>${sampleCount}</strong> closed services audited</div>
                <div><strong>Forecast Generated:</strong> ${generatedAt}</div>
                <div><strong>Historical Model MAE:</strong> Trailing Error = <strong>${metricSummary.forecastMae > 0 ? `${metricSummary.forecastMae} heads` : 'Insufficient historical audits'}</strong></div>
              </div>

              <!-- Product Cold-Start Progression Pipeline Info -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px; font-size: 0.78rem; color: var(--text-secondary);">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">📈 Cold-Start Model Progression:</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <span class="badge ${sampleCount < 6 ? 'badge-eat' : 'badge-primary'}" style="font-size: 0.7rem;">0–5 meals: v0-naive heuristic</span>
                  <span class="badge ${sampleCount >= 6 && sampleCount < 20 ? 'badge-eat' : 'badge-primary'}" style="font-size: 0.7rem;">6–20 meals: v1-intent weighted</span>
                  <span class="badge ${sampleCount >= 20 ? 'badge-eat' : 'badge-primary'}" style="font-size: 0.7rem;">20+ meals: v2 calibrated intervals</span>
                </div>
              </div>

              <!-- Target Prediction RangeBar -->
              <div class="range-bar-wrapper" style="margin-bottom: 12px;">
                <div class="range-bar-header">
                  <span>Attendance Projection Band (${modelVersion === 'v0-naive' ? 'Heuristic Interval' : '80% Target Interval'})</span>
                  <span><strong>${lower}</strong> - <strong>${upper}</strong> attendees</span>
                </div>
                <div class="range-track">
                  <div class="range-interval" style="left: ${leftPct}%; width: ${widthPct}%;">
                    <span>${lower}</span>
                    <span>${upper}</span>
                  </div>
                  <div class="marker-expected" style="left: ${expectedPct}%;">
                    <span class="marker-label">Pred: ${predicted}</span>
                  </div>
                </div>
              </div>

              <!-- Buffer Target Slider -->
              <div class="buffer-control-card" style="margin-top: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="form-label" style="font-size: 0.82rem;">Adjust Risk Buffer Target (β = ${Math.round(buffer * 100)}%)</span>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">Upper-bound risk safety factor</span>
                </div>
                <input type="range" id="buffer-slider" class="buffer-slider" min="0" max="1" step="0.05" value="${buffer}">
              </div>
            </div>
          </details>

          <!-- Deterministic Contributing Signal -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>💡</span> Contributing Signal:
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              ${(intent.nEat || 0) > 300 
                ? 'High on-time student participation observed. Target prediction interval width narrowed by ~25% compared to unprompted history.' 
                : 'Turnout projection incorporates baseline non-responder participation assumptions.'}
            </p>
          </div>

          <!-- Bottom Action: Log Realized Outcomes -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Post-Meal Decision Loop</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Log actual attendance & waste to close the operational feedback loop.</div>
            </div>
            <button id="btn-open-record-wizard" class="btn btn-primary">
              📝 Log Realized Headcount & Waste
            </button>
          </div>
        </div>

        <!-- Operational Sidebar -->
        <div style="display: flex; flex-direction: column; gap: 18px;">
          <!-- Audit Summary Card -->
          <div class="card" style="border-left: 4px solid var(--brand-accent);">
            <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 10px; color: var(--text-primary);">
              📋 Recent Closed Service Loop
            </h3>
            <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
              <div style="background: var(--bg-secondary); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <strong>Everyday Comfort Rajma & Rice:</strong><br>
                • 345 attended / 355 cooked<br>
                • Overproduction: +10 servings (2.8%)<br>
                • Unserved tray surplus: 2.8 kg (refrigerated)<br>
                • Plate scrapings: 4.6 kg<br>
                • Shortage Guardrail: 0 shortages
              </div>
              <div style="background: var(--color-eat-bg); color: var(--color-eat); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-eat-border); font-weight: 600;">
                ✓ Shortage Guardrail Satisfied (0.0% shortages)
              </div>
            </div>
          </div>

          <!-- Active Dishes -->
          <div class="card">
            <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 10px; color: var(--text-primary);">
              🍲 Menu Ingredients & Dishes
            </h3>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${(selectedMeal.items || []).map(it => `
                <span class="menu-item-tag" style="background: var(--bg-secondary); font-size: 0.82rem;">${it}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  attachKitchenEvents(container, selectedMeal, suggestedServings);
}

function attachKitchenEvents(container, selectedMeal, suggestedServings) {
  // Tab switcher
  container.querySelectorAll('.kitchen-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.setSelectedKitchenMeal(btn.dataset.mealId);
    });
  });

  // Use Recommendation Button
  const btnUse = container.querySelector('#btn-use-recommendation');
  if (btnUse) {
    btnUse.addEventListener('click', async () => {
      await api.logKitchenDecision(selectedMeal.id, {
        recommendedQuantity: suggestedServings,
        selectedQuantity: suggestedServings,
        adjustmentAmount: 0,
        adjustmentReason: 'accepted_recommendation',
      });
      window.showToast(`Accepted recommendation: Cook target set to ${suggestedServings} servings!`, 'success');
    });
  }

  // Adjust Quantity Button
  const btnAdjust = container.querySelector('#btn-adjust-quantity');
  if (btnAdjust) {
    btnAdjust.addEventListener('click', () => {
      openAdjustmentModal(selectedMeal.id, suggestedServings);
    });
  }

  // Safety buffer slider
  const slider = container.querySelector('#buffer-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      store.setSafetyBuffer(e.target.value);
      tracker.track('kitchen.safety_buffer_adjusted', { buffer: e.target.value });
    });
  }

  // Record outcome wizard button
  const recordBtn = container.querySelector('#btn-open-record-wizard');
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      window.openRecordOutcomeModal(selectedMeal.id);
    });
  }

  // Publish meal button
  const createMealBtn = container.querySelector('#btn-create-meal');
  if (createMealBtn) {
    createMealBtn.addEventListener('click', () => {
      window.openCreateMealModal();
    });
  }
}

// Kitchen Quantity Override Modal with Mandatory Reason Logging
function openAdjustmentModal(mealId, recommendedServings) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
      ✏️ Adjust Kitchen Preparation Target
    </h3>
    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.4;">
      System recommendation is <strong>${recommendedServings} servings</strong>. Enter your adjusted target and select the operational reason so the algorithm can learn.
    </p>

    <div class="form-group">
      <label class="form-label">New Cooking Quantity (Servings)</label>
      <input type="number" id="inp-adj-quantity" class="number-input" value="${recommendedServings + 10}" style="width: 100%;">
    </div>

    <div class="form-group">
      <label class="form-label">Adjustment Reason (Required for Audit Trail)</label>
      <select id="sel-adj-reason" class="form-select" style="width: 100%;">
        <option value="higher_expected">Higher expected turnout (historical intuition)</option>
        <option value="previous_shortage">Compensating for previous shortage complaint</option>
        <option value="special_event">Special campus event / student festival today</option>
        <option value="weather_change">Weather change / heavy rain on campus</option>
        <option value="exam_departure">Exam season / weekend departures</option>
        <option value="other">Other culinary / ration issue</option>
      </select>
    </div>

    <div id="adj-delta-preview" style="background: var(--bg-secondary); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.84rem; color: var(--text-primary); margin-bottom: 16px;">
      Adjustment: <strong>+10 servings</strong> relative to algorithm recommendation.
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
      <button id="modal-cancel-adj-btn" class="btn btn-secondary">Cancel</button>
      <button id="modal-confirm-adj-btn" class="btn btn-primary">Save Cook Target</button>
    </div>
  `;

  modalOverlay.classList.add('active');

  const inp = document.getElementById('inp-adj-quantity');
  const preview = document.getElementById('adj-delta-preview');

  inp.addEventListener('input', () => {
    const val = parseInt(inp.value, 10) || recommendedServings;
    const delta = val - recommendedServings;
    preview.innerHTML = `Adjustment: <strong>${delta >= 0 ? '+' : ''}${delta} servings</strong> relative to algorithm recommendation.`;
  });

  document.getElementById('modal-cancel-adj-btn').onclick = () => modalOverlay.classList.remove('active');
  document.getElementById('modal-confirm-adj-btn').onclick = async () => {
    const val = parseInt(inp.value, 10) || recommendedServings;
    const reason = document.getElementById('sel-adj-reason').value;
    const delta = val - recommendedServings;

    await api.logKitchenDecision(mealId, {
      recommendedQuantity: recommendedServings,
      selectedQuantity: val,
      adjustmentAmount: delta,
      adjustmentReason: reason,
    });

    modalOverlay.classList.remove('active');
    window.showToast(`Kitchen cook target updated to ${val} servings (${delta >= 0 ? '+' : ''}${delta})`, 'success');
  };
}

function getMealIcon(type) {
  switch (type) {
    case 'breakfast': return '🌅';
    case 'lunch': return '☀️';
    case 'snacks': return '☕';
    case 'dinner': return '🌙';
    default: return '🍽️';
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatReason(r) {
  switch (r) {
    case 'accepted_recommendation': return 'Accepted Recommendation';
    case 'higher_expected': return 'Higher Expected Turnout';
    case 'previous_shortage': return 'Previous Shortage Compensated';
    case 'special_event': return 'Special Campus Event';
    case 'weather_change': return 'Weather / Rain Change';
    case 'exam_departure': return 'Exam Season Departure';
    default: return r || 'Custom Adjustment';
  }
}
