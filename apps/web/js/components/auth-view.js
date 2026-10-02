/**
 * MealSense Production Authentication View
 * PM Upgrade Version 2.0
 * 
 * Implements Section 19:
 * - Role-Based Demo Entry: "Explore as Student", "Explore as Kitchen Staff", "Explore as Administrator"
 * - Prominent "Start 60-Sec Guided Walkthrough"
 * - Clear Demo-Data Disclosure Badge
 * - Clean Slate for Real User Registrations
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
      <div class="auth-container" style="max-width: 540px; margin: 0 auto; padding: 20px 14px;">
        <!-- Brand Header -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 20px; text-align: center;">
          <div class="brand-icon" style="width: 56px; height: 56px; font-size: 2rem;">🍽️</div>
          <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; letter-spacing: -0.02em;">
            MealSense
          </h1>
          <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 440px; line-height: 1.4; margin: 0;">
            Institutional Dining & Food Waste Prevention Platform
          </p>
          <div style="font-size: 0.78rem; font-weight: 600; color: var(--brand-primary); margin-top: 2px;">
            Closed Loop: Student Intent → Conformal Forecast → Kitchen Prep Decision → Waste Audit
          </div>
        </div>

        <!-- Section 19.2: Guided 60-Second PM Evaluator Tour CTA Card -->
        <div class="card" style="background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(184, 93, 56, 0.08) 100%); border: 2px solid var(--brand-accent); padding: 18px; margin-bottom: 22px; text-align: center;">
          <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); letter-spacing: 0.05em; margin-bottom: 4px;">
            ⭐ Product Management Case Study Experience
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
            60-Second Closed-Loop Guided Tour
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto 14px auto; line-height: 1.4;">
            Walk through all 5 stages of the product loop across Student, Kitchen, and Admin perspectives with guided step explanations.
          </p>
          <button id="btn-start-guided-tour" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 0.95rem; font-weight: 700;">
            🚀 Start 60-Second Guided Tour
          </button>
        </div>

        <!-- Section 19.1: Role-Based Demo Entry Hub -->
        <div class="card" style="margin-bottom: 22px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
              💡 Explore by Role (Demo Sandbox):
            </div>
            <span class="badge" style="font-size: 0.68rem; background: var(--bg-secondary);">Preloaded Data</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Student Demo Card -->
            <button class="btn-demo-quick" data-demo-id="student_testid" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md); cursor: pointer; text-align: left; font-family: inherit; transition: all 0.2s ease;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.5rem;">🎓</span>
                <div>
                  <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">Explore as Student</div>
                  <div style="font-size: 0.76rem; color: var(--text-muted);">Aarav Sharma • 1-Tap Eat/Skip Intent & My Impact</div>
                </div>
              </div>
              <span style="font-size: 0.82rem; color: var(--brand-primary); font-weight: 700;">Launch →</span>
            </button>

            <!-- Kitchen Demo Card -->
            <button class="btn-demo-quick" data-demo-id="staff_testid" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md); cursor: pointer; text-align: left; font-family: inherit; transition: all 0.2s ease;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.5rem;">👨‍🍳</span>
                <div>
                  <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">Explore as Kitchen Staff</div>
                  <div style="font-size: 0.76rem; color: var(--text-muted);">Chef Rajesh • Decision-First Recommendation & Overrides</div>
                </div>
              </div>
              <span style="font-size: 0.82rem; color: var(--brand-primary); font-weight: 700;">Launch →</span>
            </button>

            <!-- Admin Demo Card -->
            <button class="btn-demo-quick" data-demo-id="admin_testid" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md); cursor: pointer; text-align: left; font-family: inherit; transition: all 0.2s ease;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.5rem;">🏛️</span>
                <div>
                  <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">Explore as Administrator</div>
                  <div style="font-size: 0.76rem; color: var(--text-muted);">Dr. V. K. Verma • Baseline Impact, Insights & SaaS ROI</div>
                </div>
              </div>
              <span style="font-size: 0.82rem; color: var(--brand-primary); font-weight: 700;">Launch →</span>
            </button>
          </div>

          <!-- Section 19.3: Demo-Data Disclosure Badge -->
          <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 10px 12px; margin-top: 14px; border: 1px solid var(--border-subtle); font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
            ⚠️ <strong>Demo Environment Disclosure:</strong> Preloaded with sample evaluative data for demonstration. Real-world institutional deployments measure actual facility baselines.
          </div>
        </div>

        <!-- Custom Account Sign-in / Registration Card -->
        <div class="auth-card">
          <div class="auth-tabs">
            <button id="tab-login" class="auth-tab-btn ${activeTab === 'login' ? 'active' : ''}">
              Sign In with Account
            </button>
            <button id="tab-signup" class="auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}">
              Register Clean Slate
            </button>
          </div>

          ${errorMessage ? `
            <div style="background: var(--color-danger-bg); border: 1px solid var(--color-danger); color: var(--color-danger); padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.84rem; font-weight: 600; margin-bottom: 16px;">
              ⚠️ ${errorMessage}
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
          <input type="text" id="login-email" class="form-input" placeholder="e.g. student_testid or custom email" value="" required autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input type="password" id="login-password" class="form-input" placeholder="Enter password (or 'demo')" value="" required autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Sign In
        </button>
      </form>
    `;
  }

  function renderSignupForm(role) {
    return `
      <form id="form-signup" autocomplete="off">
        <label class="form-label" style="margin-bottom: 8px; display: block;">Select Role</label>
        <div class="role-selector-grid">
          <div class="role-option-card ${role === 'student' ? 'selected' : ''}" data-role="student">
            <div class="role-option-icon">🎓</div>
            <div class="role-option-title">Resident Student</div>
          </div>
          <div class="role-option-card ${role === 'kitchen' ? 'selected' : ''}" data-role="kitchen">
            <div class="role-option-icon">👨‍🍳</div>
            <div class="role-option-title">Kitchen Staff / Chef</div>
          </div>
          <div class="role-option-card ${role === 'admin' ? 'selected' : ''}" data-role="admin">
            <div class="role-option-icon">🏛️</div>
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
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Register Clean Slate Account
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

    // Tab buttons
    const tabLogin = container.querySelector('#tab-login');
    const tabSignup = container.querySelector('#tab-signup');
    if (tabLogin && tabSignup) {
      tabLogin.onclick = () => { activeTab = 'login'; errorMessage = ''; update(); };
      tabSignup.onclick = () => { activeTab = 'signup'; errorMessage = ''; update(); };
    }

    // Quick demo buttons
    container.querySelectorAll('.btn-demo-quick').forEach(btn => {
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

    // Login Form Submit
    const formLogin = container.querySelector('#form-login');
    if (formLogin) {
      formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        try {
          await store.login(id, pass);
          tracker.track('auth.login_completed', { role: store.currentUser.role, is_demo: false });
          window.showToast(`Welcome back, ${store.currentUser.name}!`, 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    }

    // Role option cards in registration
    container.querySelectorAll('.role-option-card').forEach(card => {
      card.onclick = () => {
        selectedRole = card.dataset.role;
        update();
      };
    });

    // Registration Form Submit
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
          window.showToast('Account registered successfully with clean operational state!', 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    }
  }

  update();
}
