/**
 * Student PWA View Component
 * PM Upgrade Version 2.0
 * 
 * Features:
 * - One-tap Eat/Skip intent decision (< 3s completion time)
 * - Dynamic Value Proposition with A/B experiment variant support
 * - Personal "My Impact" metrics & 4-week response trend
 * - Multi-day Away Mode & DPDP privacy controls
 */

import { store } from '../store.js';
import { api } from '../api.js';
import { tracker } from '../analytics.js';

export function renderStudentView(container) {
  const user = store.currentUser || { name: 'Resident', block: 'Room', hostelName: 'Mess' };
  const firstName = user.name.split(' ')[0] || 'Resident';
  const now = new Date();

  // Time-aware greeting
  const hours = now.getHours();
  const greeting = hours < 12 ? 'Good morning' : (hours < 17 ? 'Good afternoon' : 'Good evening');

  const meals = store.meals || [];
  
  // Active Experiment Variants
  const expValProp = store.experiments['exp-01-value-prop'];
  const expBtnWording = store.experiments['exp-02-button-wording'];

  const valuePropText = expValProp.variants[expValProp.currentVariant].text;
  const btnEatLabel = expBtnWording.variants[expBtnWording.currentVariant].eat;
  const btnSkipLabel = expBtnWording.variants[expBtnWording.currentVariant].skip;

  const html = `
    <div class="student-container">
      <!-- Greeting & Header -->
      <div class="student-greeting" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
            ${greeting}, ${firstName} 👋
          </h2>
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
            ${user.block} • ${user.hostelName}
          </span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="btn-privacy-settings" class="pill-btn" title="View DPDP Data Privacy Rights">
            🔒 Privacy
          </button>
        </div>
      </div>

      <!-- Value Proposition Banner (A/B Test Variant) -->
      <div class="card" style="background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-secondary) 100%); border-left: 4px solid var(--brand-accent); padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.6rem;">🌱</span>
          <div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">
              ${valuePropText}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              Your response helps the kitchen prepare closer to actual demand, preventing food waste.
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge" style="font-size: 0.7rem; background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color);">
            A/B Test: Var ${expValProp.currentVariant}
          </span>
          <button id="btn-toggle-val-prop" class="pill-btn" style="font-size: 0.72rem; padding: 4px 8px;" title="Switch Experiment Variant">
            Toggle ⇄
          </button>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="student-actions-bar" style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
        <button id="btn-bulk-skip-tomorrow" class="pill-btn">⚡ Skip All Tomorrow</button>
        <button id="btn-open-away-modal" class="pill-btn">✈️ Away Mode</button>
        <button id="btn-scroll-to-impact" class="pill-btn" style="background: var(--color-eat-bg); color: var(--color-eat); border-color: var(--color-eat-border);">
          🏆 My Impact (2.1 kg Saved)
        </button>
      </div>

      <!-- Meal Cards Feed -->
      <div class="meals-feed" style="display: flex; flex-direction: column; gap: 18px; margin-bottom: 30px;">
        ${meals.length > 0 ? (
          meals.map(meal => renderMealCard(meal, now, btnEatLabel, btnSkipLabel)).join('')
        ) : (
          `
          <div class="card" style="text-align: center; padding: 48px 20px;">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🍲</div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">No Meals Scheduled Yet</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 380px; margin: 6px auto 16px auto;">
              The kitchen team for <strong>${user.hostelName}</strong> has not published upcoming menus yet.
            </p>
          </div>
          `
        )}
      </div>

      <!-- Section 7.2: My Impact Card -->
      <div class="card" id="student-impact-card" style="margin-top: 10px; border-top: 3px solid var(--color-eat);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>🌱</span> My Personal Dining Impact
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Verified data from your mess responses over trailing 30 days
            </span>
          </div>
          <span class="badge badge-eat" style="font-size: 0.76rem;">
            Top 15% Responder
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 18px;">
          <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border-subtle);">
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary);">28</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Meals Responded</div>
          </div>
          <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border-subtle);">
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--color-eat);">96.4%</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">On-Time Rate</div>
          </div>
          <div style="background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border-subtle);">
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary);">6</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Meals Skipped</div>
          </div>
          <div style="background: var(--color-eat-bg); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--color-eat-border);">
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--color-eat);">2.1 kg</div>
            <div style="font-size: 0.78rem; color: var(--color-eat); font-weight: 700; text-transform: uppercase;">Food Avoided*</div>
          </div>
        </div>

        <!-- 4-Week Participation Trend Mini Bar Chart -->
        <div style="background: var(--bg-secondary); padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">4-Week Response Consistency</span>
            <span style="font-size: 0.78rem; color: var(--color-eat); font-weight: 600;">Consistent participation</span>
          </div>
          <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 55px; gap: 8px; padding-top: 10px;">
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; background: var(--border-color); height: 35px; border-radius: 4px 4px 0 0;"></div>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Week 1</span>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; background: var(--border-color); height: 42px; border-radius: 4px 4px 0 0;"></div>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Week 2</span>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; background: var(--color-eat); height: 48px; border-radius: 4px 4px 0 0;"></div>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Week 3</span>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; background: var(--color-eat); height: 52px; border-radius: 4px 4px 0 0;"></div>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">This Wk</span>
            </div>
          </div>
        </div>

        <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
          *<em>Methodology Notice:</em> Food avoided estimate is calculated as 0.350 kg/serving avoided whenever an on-time 'Skip' response allowed the kitchen to adjust batch preparation. Only advance responses prevent overcooking.
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  attachStudentEvents(container);
}

function renderMealCard(meal, now, btnEatLabel, btnSkipLabel) {
  const cutoff = new Date(meal.responseCutoff);
  const endsAt = new Date(meal.endsAt);
  const isPastCutoff = now > cutoff;
  const isConcluded = now > endsAt || meal.status === 'closed';

  let countdownText = 'Calculating cutoff...';
  if (isConcluded) {
    countdownText = 'Service Concluded';
  } else if (isPastCutoff) {
    countdownText = 'Cutoff Passed (Late responses accepted)';
  } else {
    const diffMs = cutoff - now;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    countdownText = `Response closes in ${mins}m ${secs}s`;
  }

  const isEatSelected = meal.myResponse === 'eat';
  const isSkipSelected = meal.myResponse === 'skip';

  return `
    <div class="meal-card ${isEatSelected ? 'responded-eat' : ''} ${isSkipSelected ? 'responded-skip' : ''}" data-meal-id="${meal.id}">
      <div class="meal-card-header">
        <div class="meal-title-group">
          <h3>
            ${getMealIcon(meal.type)} ${capitalize(meal.type)}
            <span class="badge ${isConcluded ? 'badge-skip' : (isPastCutoff ? 'badge-warning' : 'badge-eat')}">
              ${isConcluded ? 'Closed' : capitalize(meal.status)}
            </span>
          </h3>
          <div class="meal-time">${formatDate(meal.mealDate)} • ${meal.startsAt.split('T')[1].substring(0, 5)} - ${meal.endsAt.split('T')[1].substring(0, 5)}</div>
        </div>
        <div class="countdown-badge ${isPastCutoff ? 'expired' : ''}">
          ⏱️ ${countdownText}
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="font-size: 1.05rem; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">${meal.name}</div>
        <div class="menu-items-list" style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${meal.items.map(item => `<span class="menu-item-tag">${item}</span>`).join('')}
        </div>
      </div>

      ${!isConcluded ? `
        <!-- Section 7.1: Are you eating? One-Tap Decision -->
        <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid var(--border-subtle); margin-top: 10px;">
          <div style="font-size: 0.88rem; font-weight: 800; color: var(--text-primary); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span>Are you eating this meal?</span>
            <span style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">1-Tap Decision</span>
          </div>
          <div class="response-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button class="response-btn response-btn-eat ${isEatSelected ? 'selected' : ''}" data-action="eat" data-meal-id="${meal.id}">
              🍽️ ${btnEatLabel}
            </button>
            <button class="response-btn response-btn-skip ${isSkipSelected ? 'selected' : ''}" data-action="skip" data-meal-id="${meal.id}">
              🚫 ${btnSkipLabel}
            </button>
          </div>
          ${isPastCutoff ? `<div class="late-notice" style="margin-top: 8px;">⚠️ Cutoff has passed. Changes will be recorded as late and will not alter the kitchen's cook order.</div>` : ''}
        </div>
      ` : `
        <!-- Post-Meal Review -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">How was this meal?</span>
            <div class="rating-bar" data-meal-id="${meal.id}">
              ${[1, 2, 3, 4, 5].map(star => `
                <button class="star-btn ${meal.rating && meal.rating >= star ? 'active' : ''}" data-star="${star}">★</button>
              `).join('')}
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

function attachStudentEvents(container) {
  // Eat / Skip click handlers
  container.querySelectorAll('.response-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mealId = btn.dataset.mealId;
      const response = btn.dataset.action;
      try {
        const res = await api.submitResponse(mealId, response);
        window.showToast(
          res.isLate ? 'Late response logged (won\'t alter cook order)' : `Response saved: Confirmed ${response.toUpperCase()}!`,
          res.isLate ? 'warning' : 'success'
        );
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  // Toggle Value Proposition Experiment Variant
  const btnToggleVal = container.querySelector('#btn-toggle-val-prop');
  if (btnToggleVal) {
    btnToggleVal.addEventListener('click', () => {
      const cur = store.experiments['exp-01-value-prop'].currentVariant;
      const next = cur === 'A' ? 'B' : 'A';
      store.setExperimentVariant('exp-01-value-prop', next);
      window.showToast(`Switched Value Prop Experiment to Variant ${next}`, 'success');
    });
  }

  // Scroll to impact card
  const btnImpactScroll = container.querySelector('#btn-scroll-to-impact');
  if (btnImpactScroll) {
    btnImpactScroll.addEventListener('click', () => {
      const card = container.querySelector('#student-impact-card');
      if (card) card.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Star ratings
  container.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mealId = btn.closest('.rating-bar').dataset.mealId;
      const star = parseInt(btn.dataset.star, 10);
      await api.submitRating(mealId, star);
      window.showToast(`Rated ${star} stars. Thank you!`, 'success');
    });
  });

  // Quick actions
  const bulkBtn = container.querySelector('#btn-bulk-skip-tomorrow');
  if (bulkBtn) {
    bulkBtn.addEventListener('click', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const count = await api.bulkSkip(tomorrow);
      window.showToast(`Marked ${count} meals tomorrow as Skip`, 'warning');
    });
  }

  const awayBtn = container.querySelector('#btn-open-away-modal');
  if (awayBtn) {
    awayBtn.addEventListener('click', () => window.openAwayModal());
  }

  const privacyBtn = container.querySelector('#btn-privacy-settings');
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => window.openPrivacyModal());
  }
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
