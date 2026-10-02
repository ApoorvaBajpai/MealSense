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

  function renderHeader() {
    if (!store.isAuthenticated) {
      headerNavContainer.innerHTML = `
        <div class="header-actions">
          <button id="btn-theme-toggle" class="theme-toggle-btn" title="Toggle theme">
            ${store.theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      `;
    } else {
      const user = store.currentUser;
      const roleLabel = user.role.toUpperCase();
      const isDemo = Boolean(user.isDemo);

      headerNavContainer.innerHTML = `
        <div class="header-actions" style="display: flex; align-items: center; gap: 10px;">
          ${isDemo ? `
            <button id="btn-header-tour-toggle" class="pill-btn" style="background: ${store.guidedTour.active ? 'var(--brand-primary)' : 'var(--bg-secondary)'}; color: ${store.guidedTour.active ? '#fff' : 'var(--brand-primary)'}; font-size: 0.74rem; font-weight: 700; border-color: var(--brand-accent);">
              ${store.guidedTour.active ? '⏸️ Active Tour' : '🚀 Guided Tour'}
            </button>
          ` : ''}

          <div class="user-profile-badge">
            <span style="font-weight: 700;">${user.name}</span>
            <span class="user-role-tag">${roleLabel}</span>
          </div>

          <button id="btn-theme-toggle" class="theme-toggle-btn" title="Toggle theme">
            ${store.theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button id="btn-sign-out" class="btn btn-secondary btn-sm" title="Log out to switch role or account">
            🚪 Log Out
          </button>
        </div>
      `;

      // Log out handler
      document.getElementById('btn-sign-out').onclick = () => {
        store.logout();
        window.showToast('Session ended. Please sign in to continue.', 'warning');
      };

      // Header Tour Toggle
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

    // Theme toggle
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

    guidedTourBanner.style.display = 'block';
    guidedTourBanner.innerHTML = `
      <div class="guided-tour-inner">
        <div class="tour-content-group">
          <span class="tour-step-indicator">${stepConfig.title}</span>
          <div>
            <div class="tour-title">${stepConfig.description}</div>
            <div class="tour-desc">👉 <strong>Action:</strong> ${stepConfig.actionHint}</div>
          </div>
        </div>

        <div class="tour-controls">
          ${store.guidedTour.step > 1 ? `
            <button id="btn-tour-prev" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.76rem;">
              ← Prev
            </button>
          ` : ''}

          <button id="btn-tour-next" class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.76rem;">
            ${store.guidedTour.step === store.guidedTour.totalSteps ? 'Finish Tour ✓' : 'Next Step →'}
          </button>

          <button id="btn-tour-exit" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.74rem;" title="Exit Guided Tour">
            ✕ Exit
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
    toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'warning' ? '⚠️' : '✕')}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
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
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">✈️ Set Away Mode</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
        Going home or off-campus? Setting away mode automatically marks all meals during your trip as 'Skip' so the mess doesn't cook excess food.
      </p>
      <div class="form-group">
        <label class="form-label">From Date</label>
        <input type="date" id="away-from" class="form-input" style="width: 100%;" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">To Date</label>
        <input type="date" id="away-to" class="form-input" style="width: 100%;" value="${new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]}">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
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
      window.showToast(`Away mode activated for ${res.count} meals`, 'success');
    };
  };

  // Section 9: Record Outcomes Wizard (Kitchen)
  window.openRecordOutcomeModal = function(mealId) {
    const meal = store.meals.find(m => m.id === mealId) || store.meals[0];
    const existingDecision = store.kitchenDecisions[meal.id];
    const prepTarget = existingDecision ? existingDecision.selectedQuantity : 362;

    modalBody.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
        📝 60-Second Realized Outcome Audit
      </h3>
      <span style="font-size: 0.82rem; color: var(--text-muted);">${meal.name} • ${meal.mealDate}</span>

      <div style="margin-top: 16px;">
        <div class="form-group">
          <label class="form-label">1. Actual Headcount (Diners Attended)</label>
          <input type="number" id="inp-actual-count" class="number-input" value="348" style="width: 100%;">
        </div>
        <div class="form-group">
          <label class="form-label">2. Prepared Servings Cooked</label>
          <input type="number" id="inp-prepared-servings" class="number-input" value="${prepTarget}" style="width: 100%;">
        </div>
        <div class="form-group">
          <label class="form-label">3. Surplus Food Disposition</label>
          <select id="sel-surplus-disposition" class="form-select" style="width: 100%;">
            <option value="refrigerated" selected>Refrigerated / Chilled for Next Service</option>
            <option value="donated">Donated to Campus Hunger Relief Partner</option>
            <option value="discarded">Discarded (Organic Waste)</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">4. Unserved Tray Surplus (kg)</label>
            <input type="number" step="0.1" id="inp-unserved-kg" class="number-input" value="2.8" style="width: 100%;">
          </div>
          <div class="form-group">
            <label class="form-label">5. Plate Waste (kg)</label>
            <input type="number" step="0.1" id="inp-uneaten-kg" class="number-input" value="4.2" style="width: 100%;">
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin: 12px 0; background: rgba(179, 57, 39, 0.05); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <input type="checkbox" id="chk-ran-short" style="width: 18px; height: 18px; accent-color: var(--color-danger);">
          <label for="chk-ran-short" style="font-size: 0.85rem; font-weight: 700; color: var(--color-danger);">
            Ran Short (Inviolable Guardrail Alert)
          </label>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
        <button id="modal-submit-outcomes-btn" class="btn btn-primary">Save & Close Meal Loop</button>
      </div>
    `;
    modalOverlay.classList.add('active');

    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-submit-outcomes-btn').onclick = async () => {
      const actualCount = parseInt(document.getElementById('inp-actual-count').value, 10);
      const preparedServings = parseInt(document.getElementById('inp-prepared-servings').value, 10);
      const surplusDisposition = document.getElementById('sel-surplus-disposition').value;
      const unservedKg = parseFloat(document.getElementById('inp-unserved-kg').value) || 0;
      const uneatenKg = parseFloat(document.getElementById('inp-uneaten-kg').value) || 0;
      const ranShort = document.getElementById('chk-ran-short').checked;

      await api.recordOutcomes(meal.id, {
        actualCount,
        preparedServings,
        surplusDisposition,
        unservedKg,
        uneatenKg,
        ranShort,
        wasteRecords: [
          { wasteType: 'not_served', category: 'general', quantityKg: unservedKg, donated: surplusDisposition === 'donated' },
          { wasteType: 'uneaten', category: 'plate_waste', quantityKg: uneatenKg, donated: false },
        ]
      });

      closeModal();
      window.showToast('Meal outcomes recorded successfully. Decision loop closed!', 'success');
    };
  };

  // Create Meal Modal (Kitchen / Admin)
  window.openCreateMealModal = function() {
    modalBody.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">🍲 Publish New Meal Service</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
        Publish an upcoming meal menu and define student cutoff deadlines.
      </p>
      <div class="form-group">
        <label class="form-label">Meal Type</label>
        <select id="new-meal-type" class="form-select">
          <option value="breakfast">Breakfast</option>
          <option value="lunch" selected>Lunch</option>
          <option value="snacks">Evening Snacks</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" id="new-meal-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">Menu Title</label>
        <input type="text" id="new-meal-name" class="form-input" placeholder="e.g. Special Weekend Biryani Lunch" value="Special Sunday Biryani & Raita">
      </div>
      <div class="form-group">
        <label class="form-label">Dishes (comma separated)</label>
        <input type="text" id="new-meal-items" class="form-input" placeholder="Dish 1, Dish 2, Dish 3" value="Veg Dum Biryani, Mirchi Ka Salan, Burani Raita, Roasted Papad, Gulab Jamun">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <div class="form-group">
          <label class="form-label">Start Time</label>
          <input type="time" id="new-meal-start" class="form-input" value="12:30">
        </div>
        <div class="form-group">
          <label class="form-label">End Time</label>
          <input type="time" id="new-meal-end" class="form-input" value="14:30">
        </div>
        <div class="form-group">
          <label class="form-label">Cutoff Time</label>
          <input type="time" id="new-meal-cutoff" class="form-input" value="10:30">
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
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

      store.createMeal({
        type,
        mealDate,
        name,
        items,
        startTime,
        endTime,
        cutoffTime,
      });

      closeModal();
      window.showToast(`Published ${name} for ${mealDate}!`, 'success');
    };
  };

  // Privacy & Data Rights Modal
  window.openPrivacyModal = function() {
    modalBody.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">🔒 Privacy & Your DPDP Rights</h3>
      <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
        <p><strong>Your Privacy is Enforced by Cryptography & Database RLS:</strong></p>
        <ul style="margin-left: 20px; margin-top: 6px;">
          <li>Your individual Eat/Skip responses are <strong>strictly invisible</strong> to kitchen staff and wardens.</li>
          <li>The kitchen only sees anonymous aggregate totals (e.g. 318 students eating).</li>
          <li>No personal location, contacts, or reasons for skipping are ever requested or stored.</li>
        </ul>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
        <button id="btn-export-data" class="btn btn-secondary" style="width: 100%;">
          📥 Export My Personal Data (JSON)
        </button>
        <button id="btn-delete-account" class="btn btn-danger" style="width: 100%;">
          🗑️ Anonymize & Delete My Account
        </button>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
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
      if (confirm('Are you sure you want to delete and anonymize your account? This action cannot be undone.')) {
        await api.deleteAccount();
        closeModal();
        window.showToast('Account anonymized. All personal channels deleted.', 'warning');
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
