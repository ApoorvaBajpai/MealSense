/**
 * MealSense Authentication View Component
 * Dark-First Glassmorphism Edition — Redesigned for premium UX
 */

import { authService } from '../auth.js';
import { store } from '../store.js';
import { tracker } from '../analytics.js';

export function renderAuthView(container) {
  let activeTab = 'login'; // 'login' | 'signup'
  let selectedRole = 'student';
  let errorMessage = '';

  function update() {
    container.innerHTML = `
      <div class="auth-container">

        <!-- Brand Hero -->
        <div class="auth-brand-header">
          <div class="auth-brand-icon">🍽️</div>
          <h1 class="auth-heading">MealSense</h1>
          <p class="auth-tagline">Institutional dining & food-waste prevention — driven by student intent signals.</p>
          <div class="auth-flow-line">Intent → Forecast → Kitchen Decision → Waste Audit → Insight</div>
        </div>

        <!-- Guided Tour CTA -->
        <div class="auth-card auth-tour-card">
          <div class="tour-eyebrow">
            <span class="tour-eyebrow-badge">
              <span class="dot"></span>
              PM Evaluator Experience
            </span>
          </div>
          <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em;margin-bottom:6px;">
            60-Second Closed-Loop Guided Tour
          </h3>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">
            Walk through the complete 5-stage product loop across Student, Kitchen, and Admin perspectives — guided at every step.
          </p>
          <button id="btn-start-guided-tour" class="btn btn-primary btn-lg" style="width:100%;">
            ▶&ensp;Start Guided Tour
          </button>
        </div>

        <!-- Demo Mode Hub -->
        <div class="auth-card" style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;">
            <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;">
              Sandbox — Seeded Demo
            </span>
            <span class="badge badge-eat">Ready to Explore</span>
          </div>

          <button id="btn-explore-demo-direct" type="button" class="btn btn-primary" style="width:100%;margin-bottom:14px;height:46px;">
            ✦&ensp;Explore Demo Mode
          </button>

          <div class="demo-mode-section-label">Or enter as a specific role:</div>

          <!-- Student -->
          <button type="button" class="demo-role-btn" data-demo-id="student_testid">
            <div class="demo-role-icon student-icon">🎓</div>
            <div class="demo-role-body">
              <div class="demo-role-name">Student — Aarav Sharma</div>
              <div class="demo-role-desc">One-tap intent, My Impact metrics, away mode</div>
            </div>
            <span class="demo-role-arrow">→</span>
          </button>

          <!-- Kitchen -->
          <button type="button" class="demo-role-btn" data-demo-id="staff_testid">
            <div class="demo-role-icon kitchen-icon">👨‍🍳</div>
            <div class="demo-role-body">
              <div class="demo-role-name">Kitchen — Chef Rajesh</div>
              <div class="demo-role-desc">Forecast snapshot, prep decision, outcome loop</div>
            </div>
            <span class="demo-role-arrow">→</span>
          </button>

          <!-- Admin -->
          <button type="button" class="demo-role-btn" data-demo-id="admin_testid">
            <div class="demo-role-icon admin-icon">🏛️</div>
            <div class="demo-role-body">
              <div class="demo-role-name">Admin — Dr. V. K. Verma</div>
              <div class="demo-role-desc">Executive KPIs, trends, funnels, audit reports</div>
            </div>
            <span class="demo-role-arrow">→</span>
          </button>

          <!-- Deep link hint -->
          <div class="info-box" style="margin-top:12px;">
            🔗 <strong>Evaluator deep links:</strong>
            <code style="font-size:0.72rem;background:var(--bg-surface-3);padding:1px 5px;border-radius:3px;">?mode=demo&role=student</code>,
            <code style="font-size:0.72rem;background:var(--bg-surface-3);padding:1px 5px;border-radius:3px;">?mode=demo&role=kitchen</code>,
            <code style="font-size:0.72rem;background:var(--bg-surface-3);padding:1px 5px;border-radius:3px;">?tour=true</code>
          </div>
        </div>

        <!-- Auth Card (Login / Register) -->
        <div class="auth-card">
          <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;">
                Prototype Authentication
              </span>
              <span class="badge badge-skip" style="font-size:0.63rem;">Local SHA-256</span>
            </div>
            <div style="font-size:0.73rem;color:var(--text-muted);line-height:1.45;">
              Client-side prototype. Production uses OAuth/SAML SSO with server-side JWT & Row-Level Security.
            </div>
          </div>

          <div class="auth-tabs">
            <button id="tab-login" class="auth-tab-btn ${activeTab === 'login' ? 'active' : ''}">Sign In</button>
            <button id="tab-signup" class="auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}">Register (Live Mode)</button>
          </div>

          ${errorMessage ? `
            <div class="error-banner">
              <span>⚠</span> ${errorMessage}
            </div>
          ` : ''}

          ${activeTab === 'login' ? renderLoginForm() : renderSignupForm(selectedRole)}
        </div>

      </div>
    `;

    attachEvents();
  }

  function renderLoginForm() {
    return `
      <form id="form-login" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="login-email">Email or Demo ID</label>
          <input type="text" id="login-email" class="form-input" placeholder="e.g. student_testid or your email" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input type="password" id="login-password" class="form-input" placeholder='Password (use "demo" for demo accounts)' autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px;">
          Sign In
        </button>
      </form>
    `;
  }

  function renderSignupForm(role) {
    return `
      <form id="form-signup" autocomplete="off">
        <div class="info-box" style="margin-bottom:14px;">
          ℹ&nbsp;<strong>Live Mode:</strong> Creates a clean state with zero seeded meals or fake KPIs.
        </div>

        <label class="form-label" style="margin-bottom:8px;display:block;">Select Role</label>
        <div class="role-selector-grid">
          <div class="role-option-card ${role === 'student' ? 'selected' : ''}" data-role="student">
            <span class="role-option-icon">🎓</span>
            <div class="role-option-title">Resident Student</div>
          </div>
          <div class="role-option-card ${role === 'kitchen' ? 'selected' : ''}" data-role="kitchen">
            <span class="role-option-icon">👨‍🍳</span>
            <div class="role-option-title">Kitchen Staff</div>
          </div>
          <div class="role-option-card ${role === 'admin' ? 'selected' : ''}" data-role="admin">
            <span class="role-option-icon">🏛️</span>
            <div class="role-option-title">Warden / Admin</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-name">Full Name</label>
          <input type="text" id="reg-name" class="form-input" placeholder="e.g. Siddharth Verma" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-email">Official Email</label>
          <input type="email" id="reg-email" class="form-input" placeholder="e.g. user@campus.edu" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-hostel">Dining Facility / Hostel</label>
          <input type="text" id="reg-hostel" class="form-input" placeholder="e.g. Tagore Hostel Mess" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-password">Password</label>
          <input type="password" id="reg-password" class="form-input" placeholder="Choose a password" required minlength="4">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px;">
          Create Live Account
        </button>
      </form>
    `;
  }

  function attachEvents() {
    // Guided Tour launcher
    const btnTour = container.querySelector('#btn-start-guided-tour');
    if (btnTour) {
      btnTour.addEventListener('click', async () => {
        await store.startGuidedTour();
      });
    }

    // Tab switching
    const tabLogin = container.querySelector('#tab-login');
    const tabSignup = container.querySelector('#tab-signup');
    if (tabLogin && tabSignup) {
      tabLogin.onclick = () => { activeTab = 'login'; errorMessage = ''; update(); };
      tabSignup.onclick = () => { activeTab = 'signup'; errorMessage = ''; update(); };
    }

    // Explore Demo direct button
    const btnExploreDirect = container.querySelector('#btn-explore-demo-direct');
    if (btnExploreDirect) {
      btnExploreDirect.onclick = async () => {
        try {
          await store.switchToDemo('student');
          tracker.track('auth.login_completed', { role: 'student', is_demo: true });
          window.showToast('Demo Mode launched — Student view', 'success');
        } catch (e) {
          errorMessage = e.message;
          update();
        }
      };
    }

    // Role-specific demo buttons
    container.querySelectorAll('.demo-role-btn').forEach(btn => {
      btn.onclick = async () => {
        const demoId = btn.dataset.demoId;
        try {
          await store.login(demoId, 'demo');
          tracker.track('auth.login_completed', { role: store.currentUser.role, is_demo: true });
          window.showToast(`Logged in as ${store.currentUser.name}`, 'success');
        } catch (e) {
          errorMessage = e.message;
          update();
        }
      };
    });

    // Login form
    const formLogin = container.querySelector('#form-login');
    if (formLogin) {
      formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;
        try {
          await store.login(id, pass);
          tracker.track('auth.login_completed', { role: store.currentUser.role, is_demo: store.isDemo });
          window.showToast(`Welcome back, ${store.currentUser.name}!`, 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    }

    // Role option cards (signup)
    container.querySelectorAll('.role-option-card').forEach(card => {
      card.onclick = () => {
        selectedRole = card.dataset.role;
        update();
      };
    });

    // Signup form
    const formSignup = container.querySelector('#form-signup');
    if (formSignup) {
      formSignup.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const hostelName = document.getElementById('reg-hostel').value;
        const password = document.getElementById('reg-password').value;
        try {
          await store.signup({ name, email, password, role: selectedRole, hostelName });
          tracker.track('auth.signup_completed', { role: selectedRole });
          window.showToast('Account created — Live Mode active!', 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    }
  }

  update();
}
