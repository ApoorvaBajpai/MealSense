/**
 * MealSense Production Application Bootstrap
 * PM Upgrade Version 2.0
 * 
 * Strict session routing: logged in users are locked to their authorized dashboard.
 * Supports interactive 60-Second Guided PM Evaluator Tour across Student, Kitchen, and Admin.
 */

import { store } from './store.js';
import { api } from './api.js';
import { renderAuthView } from './components/auth-view.js';
import { renderStudentView } from './components/student-view.js';
import { renderKitchenView } from './components/kitchen-view.js';
import { renderAdminView } from './components/admin-view.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainContainer = document.getElementById('view-container');
  const headerNavContainer = document.getElementById('header-nav-container');
  const guidedTourBanner = document.getElementById('guided-tour-banner');

  function render() {
    renderHeader();
    renderDemoModeBanner();
    renderGuidedTourBanner();

    if (!store.isAuthenticated || store.currentRole === 'auth') {
      renderAuthView(mainContainer);
    } else if (store.currentRole === 'student') {
      renderStudentView(mainContainer);
    } else if (store.currentRole === 'kitchen') {
      renderKitchenView(mainContainer);
    } else if (store.currentRole === 'admin') {
      renderAdminView(mainContainer);
    }
  }

  // Section 3.2: Demo Mode Banner & Reset Entry Point
  function renderDemoModeBanner() {
    const demoBanner = document.getElementById('demo-mode-banner');
    if (!demoBanner) return;

    if (!store.isAuthenticated || !store.isDemo) {
      demoBanner.style.display = 'none';
      return;
    }

    demoBanner.style.display = 'block';
    demoBanner.innerHTML = `
      <div class="demo-banner-inner">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge badge-warning">⚡ Demo Mode</span>
          <span style="color:var(--text-secondary);font-weight:600;font-size:0.82rem;">Sample operational data &mdash; explore the full workflow</span>
        </div>
        <div style="display:flex;gap:7px;align-items:center;">
          <button id="btn-reset-demo-banner" class="pill-btn" style="font-size:0.75rem;padding:5px 12px;" title="Reset demo dataset">
            ↺ Reset
          </button>
          <button id="btn-exit-demo-banner" class="pill-btn" style="font-size:0.75rem;padding:5px 12px;" title="Exit demo">
            Exit Demo
          </button>
        </div>
      </div>
    `;

    demoBanner.querySelector('#btn-reset-demo-banner')?.addEventListener('click', () => {
      store.resetDemo();
      window.showToast('Demo dataset restored to initial seed', 'success');
    });

    demoBanner.querySelector('#btn-exit-demo-banner')?.addEventListener('click', () => {
      store.logout();
      window.showToast('Exited demo mode', 'info');
    });
  }

  function renderHeader() {
    if (!store.isAuthenticated) {
      headerNavContainer.innerHTML = `
        <div class="header-actions">
          <button id="btn-theme-toggle" class="theme-toggle-btn" title="Toggle light/dark theme" aria-label="Toggle theme">
            ${store.theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      `;
    } else {
      const user = store.currentUser;
      const roleLabel = user.role.toUpperCase();
      const isDemo = Boolean(user.isDemo);
      const initials = user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

      headerNavContainer.innerHTML = `
        <div class="header-actions">
          ${isDemo ? `
            <button id="btn-header-tour-toggle" class="pill-btn" style="${store.guidedTour.active ? 'background:var(--color-eat-bg);color:var(--color-eat);border-color:var(--color-eat-border);' : ''}font-size:0.75rem;">
              ${store.guidedTour.active ? '◉ Tour Active' : '▶ Guided Tour'}
            </button>
          ` : ''}

          <div class="user-profile-badge">
            <div class="user-avatar">${initials}</div>
            <span style="font-weight:600;font-size:0.83rem;">${user.name.split(' ')[0]}</span>
            <span class="user-role-tag">${roleLabel}</span>
          </div>

          <button id="btn-theme-toggle" class="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">
            ${store.theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button id="btn-sign-out" class="btn btn-secondary btn-sm" title="Sign out">
            Sign out
          </button>
        </div>
      `;

      document.getElementById('btn-sign-out').onclick = () => {
        store.logout();
        window.showToast('Signed out successfully', 'warning');
      };

      const tourBtn = document.getElementById('btn-header-tour-toggle');
      if (tourBtn) {
        tourBtn.onclick = async () => {
          if (store.guidedTour.active) {
            store.exitGuidedTour();
          } else {
            await store.startGuidedTour();
          }
        };
      }
    }

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.onclick = () => store.toggleTheme();
    }
  }

  // Section 19.2: Guided 60-Second PM Tour Banner
  function renderGuidedTourBanner() {
    if (!guidedTourBanner) return;

    if (!store.guidedTour.active) {
      guidedTourBanner.style.display = 'none';
      return;
    }

    const currentStepIndex = store.guidedTour.step - 1;
    const stepConfig = store.guidedTour.steps[currentStepIndex];
    const totalSteps = store.guidedTour.totalSteps;
    const currentStep = store.guidedTour.step;

    guidedTourBanner.style.display = 'block';
    guidedTourBanner.innerHTML = `
      <div class="guided-tour-inner">
        <div class="tour-content-group">
          <span class="tour-step-indicator">
            <span class="tour-step-indicator-dot"></span>
            ${stepConfig.title} &mdash; ${currentStep}/${totalSteps}
          </span>
          <div>
            <div class="tour-title">${stepConfig.description}</div>
            <div class="tour-desc">→ <strong>Action:</strong> ${stepConfig.actionHint}</div>
          </div>
        </div>

        <div class="tour-controls">
          ${currentStep > 1 ? `
            <button id="btn-tour-prev" class="btn btn-secondary btn-sm">
              ← Prev
            </button>
          ` : ''}
          <button id="btn-tour-next" class="btn btn-primary btn-sm">
            ${currentStep === totalSteps ? 'Finish ✓' : 'Next →'}
          </button>
          <button id="btn-tour-exit" class="btn btn-secondary btn-sm" title="Exit tour">
            ✕
          </button>
        </div>
      </div>
    `;

    const prevBtn = document.getElementById('btn-tour-prev');
    if (prevBtn) prevBtn.onclick = () => store.prevTourStep();

    const nextBtn = document.getElementById('btn-tour-next');
    if (nextBtn) nextBtn.onclick = () => store.nextTourStep();

    const exitBtn = document.getElementById('btn-tour-exit');
    if (exitBtn) exitBtn.onclick = () => store.exitGuidedTour();
  }

  // Subscribe to store updates
  store.subscribe(render);

  // Global Toast function
  window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
    const icon = icons[type] || icons.success;
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 280);
    }, 3800);
  };

  // Modals
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  // Away Mode Modal (Student)
  window.openAwayModal = function() {
    modalBody.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-icon" style="background:var(--color-info-bg);border-color:rgba(96,165,250,0.25);">✈️</div>
        <div>
          <div class="modal-title" id="modal-title">Set Away Mode</div>
          <div class="modal-subtitle">Mark all meals as Skip while you're away from campus.</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="away-from">From Date</label>
        <input type="date" id="away-from" class="form-input" style="width:100%;" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label" for="away-to">To Date</label>
        <input type="date" id="away-to" class="form-input" style="width:100%;" value="${new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]}">
      </div>
      <div class="modal-footer">
        <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
        <button id="modal-confirm-away-btn" class="btn btn-primary">Confirm Away Range</button>
      </div>
    `;
    modalOverlay.classList.add('active');

    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-confirm-away-btn').onclick = async () => {
      const from = document.getElementById('away-from').value;
      const to = document.getElementById('away-to').value;
      const res = await api.setAway(from, to);
      closeModal();
      window.showToast(`Away mode set for ${res.count} meals`, 'success');
    };
  };

  // Section 9: Record Outcomes Wizard (Kitchen)
  window.openRecordOutcomeModal = function(mealId) {
    const meal = store.meals.find(m => m.id === mealId) || store.meals[0];
    const existingDecision = store.kitchenDecisions[meal.id];
    const prepTarget = existingDecision ? existingDecision.selectedQuantity : 362;

    modalBody.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-icon" style="background:var(--color-warning-bg);border-color:var(--color-warning-border);">📋</div>
        <div>
          <div class="modal-title" id="modal-title">Realized Outcome Audit</div>
          <div class="modal-subtitle">${meal.name} &bull; ${meal.mealDate}</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="inp-actual-count">Actual Headcount</label>
          <input type="number" id="inp-actual-count" class="form-input" value="348" style="width:100%;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="inp-prepared-servings">Prepared Servings Cooked</label>
          <input type="number" id="inp-prepared-servings" class="form-input" value="${prepTarget}" style="width:100%;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="sel-surplus-disposition">Surplus Food Disposition</label>
          <select id="sel-surplus-disposition" class="form-select" style="width:100%;">
            <option value="refrigerated" selected>Refrigerated for Next Service</option>
            <option value="donated">Donated to Campus Hunger Relief</option>
            <option value="discarded">Discarded (Organic Waste)</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="inp-unserved-kg">Unserved Surplus (kg)</label>
            <input type="number" step="0.1" id="inp-unserved-kg" class="form-input" value="2.8" style="width:100%;">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="inp-uneaten-kg">Plate Waste (kg)</label>
            <input type="number" step="0.1" id="inp-uneaten-kg" class="form-input" value="4.2" style="width:100%;">
          </div>
        </div>
        <div class="guardrail-warning" style="cursor:pointer;" id="ran-short-row">
          <input type="checkbox" id="chk-ran-short" style="width:16px;height:16px;accent-color:var(--color-danger);flex-shrink:0;">
          <label for="chk-ran-short" style="cursor:pointer;font-weight:700;">Ran Short &mdash; Inviolable Guardrail Alert</label>
        </div>
      </div>

      <div class="modal-footer">
        <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
        <button id="modal-submit-outcomes-btn" class="btn btn-primary">Save &amp; Close Loop</button>
      </div>
    `;
    modalOverlay.classList.add('active');

    document.getElementById('ran-short-row').onclick = (e) => {
      if (e.target.tagName !== 'INPUT') document.getElementById('chk-ran-short').click();
    };

    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-submit-outcomes-btn').onclick = async () => {
      const actualCount = parseInt(document.getElementById('inp-actual-count').value, 10);
      const preparedServings = parseInt(document.getElementById('inp-prepared-servings').value, 10);
      const surplusDisposition = document.getElementById('sel-surplus-disposition').value;
      const unservedKg = parseFloat(document.getElementById('inp-unserved-kg').value) || 0;
      const uneatenKg = parseFloat(document.getElementById('inp-uneaten-kg').value) || 0;
      const ranShort = document.getElementById('chk-ran-short').checked;

      await api.recordOutcomes(meal.id, {
        actualCount, preparedServings, surplusDisposition, unservedKg, uneatenKg, ranShort,
        wasteRecords: [
          { wasteType: 'not_served', category: 'general', quantityKg: unservedKg, donated: surplusDisposition === 'donated' },
          { wasteType: 'uneaten', category: 'plate_waste', quantityKg: uneatenKg, donated: false },
        ]
      });

      closeModal();
      window.showToast('Outcomes recorded. Meal loop closed!', 'success');
    };
  };

  // Create Meal Modal (Kitchen / Admin)
  window.openCreateMealModal = function() {
    modalBody.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-icon">🍲</div>
        <div>
          <div class="modal-title" id="modal-title">Publish Meal Service</div>
          <div class="modal-subtitle">Define menu, timing, and response cutoff.</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0;">
        <div class="form-group">
          <label class="form-label" for="new-meal-type">Meal Type</label>
          <select id="new-meal-type" class="form-select">
            <option value="breakfast">Breakfast</option>
            <option value="lunch" selected>Lunch</option>
            <option value="snacks">Evening Snacks</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-meal-date">Date</label>
          <input type="date" id="new-meal-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label" for="new-meal-name">Menu Title</label>
          <input type="text" id="new-meal-name" class="form-input" placeholder="e.g. Weekend Biryani Lunch" value="Special Sunday Biryani &amp; Raita">
        </div>
        <div class="form-group">
          <label class="form-label" for="new-meal-items">Dishes (comma-separated)</label>
          <input type="text" id="new-meal-items" class="form-input" placeholder="Dish 1, Dish 2..." value="Veg Dum Biryani, Mirchi Ka Salan, Burani Raita, Papad, Gulab Jamun">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <div class="form-group">
            <label class="form-label" for="new-meal-start">Start</label>
            <input type="time" id="new-meal-start" class="form-input" value="12:30">
          </div>
          <div class="form-group">
            <label class="form-label" for="new-meal-end">End</label>
            <input type="time" id="new-meal-end" class="form-input" value="14:30">
          </div>
          <div class="form-group">
            <label class="form-label" for="new-meal-cutoff">Cutoff</label>
            <input type="time" id="new-meal-cutoff" class="form-input" value="10:30">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
        <button id="modal-publish-meal-btn" class="btn btn-primary">Publish Meal</button>
      </div>
    `;
    modalOverlay.classList.add('active');

    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-publish-meal-btn').onclick = () => {
      const type = document.getElementById('new-meal-type').value;
      const mealDate = document.getElementById('new-meal-date').value;
      const name = document.getElementById('new-meal-name').value;
      const items = document.getElementById('new-meal-items').value.split(',').map(s => s.trim()).filter(Boolean);
      const startTime = document.getElementById('new-meal-start').value;
      const endTime = document.getElementById('new-meal-end').value;
      const cutoffTime = document.getElementById('new-meal-cutoff').value;

      store.createMeal({ type, mealDate, name, items, startTime, endTime, cutoffTime });
      closeModal();
      window.showToast(`Published: ${name}`, 'success');
    };
  };

  // Privacy & Data Rights Modal
  window.openPrivacyModal = function() {
    modalBody.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-icon" style="background:rgba(96,165,250,0.10);border-color:rgba(96,165,250,0.25);">🔒</div>
        <div>
          <div class="modal-title" id="modal-title">Privacy &amp; Data Rights</div>
          <div class="modal-subtitle">Your data, enforced by cryptography &amp; RLS.</div>
        </div>
      </div>

      <div class="info-box" style="margin-bottom:16px;">
        <ul style="list-style:none;display:flex;flex-direction:column;gap:7px;">
          <li style="display:flex;gap:8px;align-items:flex-start;"><span style="color:var(--brand-primary);flex-shrink:0;">✓</span> Your Eat/Skip choices are <strong style="color:var(--text-primary);">strictly invisible</strong> to kitchen staff &amp; wardens.</li>
          <li style="display:flex;gap:8px;align-items:flex-start;"><span style="color:var(--brand-primary);flex-shrink:0;">✓</span> Kitchen only sees anonymous aggregate totals.</li>
          <li style="display:flex;gap:8px;align-items:flex-start;"><span style="color:var(--brand-primary);flex-shrink:0;">✓</span> No location, contacts, or skip reasons ever stored.</li>
        </ul>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="btn-export-data" class="btn btn-secondary" style="width:100%;justify-content:flex-start;gap:12px;">
          <span>📥</span> Export My Data (JSON)
        </button>
        <button id="btn-delete-account" class="btn btn-danger" style="width:100%;justify-content:flex-start;gap:12px;">
          <span>🗑️</span> Anonymize &amp; Delete Account
        </button>
      </div>

      <div class="modal-footer">
        <button id="modal-cancel-btn" class="btn btn-secondary">Close</button>
      </div>
    `;
    modalOverlay.classList.add('active');

    document.getElementById('modal-cancel-btn').onclick = closeModal;

    document.getElementById('btn-export-data').onclick = () => {
      const data = api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mealsense_data_${store.currentUser.name.replace(/\s+/g, '_')}.json`;
      a.click();
      window.showToast('Data exported successfully', 'success');
    };

    document.getElementById('btn-delete-account').onclick = async () => {
      if (confirm('Are you sure? This permanently anonymizes and deletes your account.')) {
        await api.deleteAccount();
        closeModal();
        window.showToast('Account anonymized and deleted.', 'warning');
      }
    };
  };

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Countdown timer refresh loop every 1 second
  setInterval(() => {
    const badges = document.querySelectorAll('.countdown-badge');
    const now = new Date();
    badges.forEach(badge => {
      const card = badge.closest('.meal-card');
      if (!card) return;
      const mealId = card.dataset.mealId;
      const meal = store.meals.find(m => m.id === mealId);
      if (!meal) return;

      const cutoff = new Date(meal.responseCutoff);
      const endsAt = new Date(meal.endsAt);
      const diffMs = cutoff - now;

      if (now > endsAt || meal.status === 'closed') {
        badge.innerHTML = '⏱️ Service Concluded';
        badge.classList.add('expired');
      } else if (diffMs <= 0) {
        badge.innerHTML = '⏱️ Cutoff Passed (Late responses accepted)';
        badge.classList.add('expired');
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        badge.innerHTML = `⏱️ Closes in ${mins}m ${secs}s`;
        badge.classList.remove('expired');
      }
    });
  }, 1000);

  // Initial render
  render();
});
