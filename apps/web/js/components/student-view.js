/**
 * Student PWA View Component
 * Covers Requirements ST-01 to ST-12
 * Fully production-ready for resident hostel students.
 */

import { store } from '../store.js';
import { api } from '../api.js';
import { tracker } from '../analytics.js';

export function renderStudentView(container) {
  const user = store.currentUser || { name: 'Resident', block: 'Room', hostelName: 'Mess' };
  const now = new Date();

  const meals = store.meals || [];

  const html = `
    <div class="student-container">
      <!-- Student Header & Greetings -->
      <div class="student-greeting">
        <div>
          <h2>👋 Hi, ${user.name}</h2>
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
            ${user.block} • ${user.hostelName} ${user.institution ? `(${user.institution})` : ''}
          </span>
        </div>
        <button id="btn-privacy-settings" class="pill-btn" style="display: flex; align-items: center; gap: 4px;">
          🔒 Privacy & Data
        </button>
      </div>

      <!-- Quick Actions -->
      <div class="student-actions-bar">
        <button id="btn-bulk-skip-tomorrow" class="pill-btn">⚡ Skip All Tomorrow</button>
        <button id="btn-open-away-modal" class="pill-btn">✈️ Away Mode</button>
      </div>

      <!-- Meal Cards Feed -->
      <div class="meals-feed" style="display: flex; flex-direction: column; gap: 16px;">
        ${meals.length > 0 ? (
          meals.map(meal => renderMealCard(meal, now)).join('')
        ) : (
          `
          <div class="card" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🍲</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">No Meals Published Yet</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 380px; margin: 6px auto 16px auto;">
              The kitchen team for <strong>${user.hostelName}</strong> has not published upcoming menus yet. They will appear here as soon as published.
            </p>
            <button id="btn-refresh-meals" class="btn btn-secondary btn-sm">
              🔄 Check for Updates
            </button>
          </div>
          `
        )}
      </div>
    </div>
  `;

  container.innerHTML = html;
  attachStudentEvents(container);
}

function renderMealCard(meal, now) {
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
    countdownText = `Cutoff in ${mins}m ${secs}s`;
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

      <div>
        <div style="font-size: 0.95rem; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">${meal.name}</div>
        <div class="menu-items-list">
          ${meal.items.map(item => `<span class="menu-item-tag">${item}</span>`).join('')}
        </div>
      </div>

      ${!isConcluded ? `
        <!-- Response Buttons -->
        <div class="response-actions">
          <button class="response-btn response-btn-eat ${isEatSelected ? 'selected' : ''}" data-action="eat" data-meal-id="${meal.id}">
            🍽️ I'll Eat
          </button>
          <button class="response-btn response-btn-skip ${isSkipSelected ? 'selected' : ''}" data-action="skip" data-meal-id="${meal.id}">
            🚫 I'll Skip
          </button>
        </div>
        ${isPastCutoff ? `<div class="late-notice">⚠️ Cutoff has passed. Changes will be recorded as late and will not alter the kitchen's cook order.</div>` : ''}
      ` : `
        <!-- Post-Meal Review -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
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
        tracker.track('response_submitted', { mealId, response, isLate: res.isLate });
        window.showToast(
          res.isLate ? 'Late response logged (won\'t change cook target)' : `Response saved: I'll ${response}`,
          res.isLate ? 'warning' : 'success'
        );
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  // Star ratings
  container.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mealId = btn.closest('.rating-bar').dataset.mealId;
      const star = parseInt(btn.dataset.star, 10);
      await api.submitRating(mealId, star);
      tracker.track('rating_submitted', { mealId, rating: star });
      window.showToast(`Rated ${star} stars. Thank you!`, 'success');
    });
  });

  // Bulk Skip Tomorrow
  const bulkSkipBtn = container.querySelector('#btn-bulk-skip-tomorrow');
  if (bulkSkipBtn) {
    bulkSkipBtn.addEventListener('click', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const count = await api.bulkSkip(tomorrow);
      tracker.track('bulk_response_submitted', { scope: 'tomorrow', count });
      window.showToast(`Set skip for all ${count} meals tomorrow`, 'success');
    });
  }

  // Away Mode Modal Trigger
  const awayBtn = container.querySelector('#btn-open-away-modal');
  if (awayBtn) {
    awayBtn.addEventListener('click', () => {
      window.openAwayModal();
    });
  }

  // Privacy Settings Trigger
  const privacyBtn = container.querySelector('#btn-privacy-settings');
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      window.openPrivacyModal();
    });
  }

  // Refresh
  const refreshBtn = container.querySelector('#btn-refresh-meals');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.showToast('Checking for published menus...', 'info');
      store.notify();
    });
  }
}

function getMealIcon(type) {
  switch (type) {
    case 'breakfast': return '🥞';
    case 'lunch': return '🍛';
    case 'snacks': return '🥪';
    case 'dinner': return '🍲';
    default: return '🍽️';
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
