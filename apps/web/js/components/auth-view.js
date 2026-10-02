/**
 * MealSense Production Authentication View
 * Supports:
 * - Three dedicated evaluation demo accounts (student_testid, staff_testid, admin_testid) with sample data.
 * - Real user self-registrations with a completely clean slate (no dummy data).
 */

import { authService } from '../auth.js';
import { store } from '../store.js';
import { tracker } from '../analytics.js';

export function renderAuthView(container) {
  let activeTab = 'login'; // 'login' | 'signup'
  let selectedRole = 'student'; // 'student' | 'kitchen' | 'admin'
  let errorMessage = '';

  function update() {
    container.innerHTML = `
      <div class="auth-container">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 12px;">
          <div class="brand-icon" style="width: 52px; height: 52px; font-size: 1.8rem;">🍽️</div>
          <h1 style="font-size: 1.65rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; letter-spacing: -0.02em;">
            MealSense Portal
          </h1>
          <p style="font-size: 0.88rem; color: var(--text-secondary); max-width: 420px; line-height: 1.4;">
            Institutional Dining & Food Waste Prevention for University Hostels, Messes & Dining Facilities
          </p>
        </div>

        <div class="auth-card">
          <!-- Auth Mode Tabs -->
          <div class="auth-tabs">
            <button id="tab-login" class="auth-tab-btn ${activeTab === 'login' ? 'active' : ''}">
              Sign In
            </button>
            <button id="tab-signup" class="auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}">
              Register New Account
            </button>
          </div>

          ${errorMessage ? `
            <div style="background: var(--color-danger-bg); border: 1px solid var(--color-danger); color: var(--color-danger); padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.84rem; font-weight: 600; margin-bottom: 16px;">
              ⚠️ ${errorMessage}
            </div>
          ` : ''}

          ${activeTab === 'login' ? renderLoginForm() : renderSignupForm(selectedRole)}

          <!-- Evaluation Demo Testing IDs Box -->
          <div style="margin-top: 22px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: left;">
            <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
              💡 First-Time Evaluator Demo IDs:
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4;">
              Testing the app for the first time? Use these demo IDs to explore with sample data:
            </p>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <button class="btn-demo-quick" data-demo-id="student_testid" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 7px 12px; border-radius: var(--radius-sm); cursor: pointer; text-align: left; font-size: 0.82rem; font-family: inherit;">
                <span>🎓 <strong>student_testid</strong> (Resident Student)</span>
                <span style="font-size: 0.72rem; color: var(--brand-primary); font-weight: 700;">Try Demo →</span>
              </button>
              <button class="btn-demo-quick" data-demo-id="staff_testid" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 7px 12px; border-radius: var(--radius-sm); cursor: pointer; text-align: left; font-size: 0.82rem; font-family: inherit;">
                <span>👨‍🍳 <strong>staff_testid</strong> (Kitchen Chef & Planning)</span>
                <span style="font-size: 0.72rem; color: var(--brand-primary); font-weight: 700;">Try Demo →</span>
              </button>
              <button class="btn-demo-quick" data-demo-id="admin_testid" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 7px 12px; border-radius: var(--radius-sm); cursor: pointer; text-align: left; font-size: 0.82rem; font-family: inherit;">
                <span>🛡️ <strong>admin_testid</strong> (Warden / Mess Admin)</span>
                <span style="font-size: 0.72rem; color: var(--brand-primary); font-weight: 700;">Try Demo →</span>
              </button>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 6px;">
              <em>Note:</em> Real user signups load a clean operational slate with zero test data.
            </div>
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderLoginForm() {
    return `
      <form id="form-login" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="login-email">Registered Email or Demo ID</label>
          <input type="text" id="login-email" class="form-input" placeholder="e.g. your_email@mess.edu or demo ID" value="" required autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input type="password" id="login-password" class="form-input" placeholder="Enter your password (or 'demo')" value="" required autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Sign In to Your Dashboard
        </button>

        <div style="margin-top: 18px; text-align: center; font-size: 0.84rem; color: var(--text-secondary);">
          Don't have an account registered yet? 
          <a href="#" id="link-go-signup" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline;">
            Register your mess profile
          </a>
        </div>
      </form>
    `;
  }

  function renderSignupForm(role) {
    return `
      <form id="form-signup" autocomplete="off">
        <!-- Role Selection -->
        <label class="form-label" style="margin-bottom: 8px; display: block;">Select Your Role in the Mess</label>
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
            <div class="role-option-icon">🛡️</div>
            <div class="role-option-title">Warden / Admin</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-name">Full Name</label>
          <input type="text" id="signup-name" class="form-input" placeholder="e.g. Diya Sharma" value="" required autocomplete="off">
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-email">Email Address</label>
          <input type="email" id="signup-email" class="form-input" placeholder="e.g. diya.sharma@hostel.edu" value="" required autocomplete="off">
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-password">Create Password</label>
          <input type="password" id="signup-password" class="form-input" placeholder="Minimum 6 characters" minlength="6" value="" required autocomplete="new-password">
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-institution">Institution / University / Organization</label>
          <input type="text" id="signup-institution" class="form-input" placeholder="e.g. Indian Institute of Technology" value="" required autocomplete="off">
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-hostel">Hostel Dining Hall / Mess Name</label>
          <input type="text" id="signup-hostel" class="form-input" placeholder="e.g. Ganga Hostel Mess or North Dining Hall" value="" required autocomplete="off">
        </div>

        ${role === 'student' ? `
          <div class="form-group">
            <label class="form-label" for="signup-block">Block / Wing & Room Number</label>
            <input type="text" id="signup-block" class="form-input" placeholder="e.g. Block B, Room 304" value="" required autocomplete="off">
          </div>
          <div style="display: flex; align-items: flex-start; gap: 8px; margin: 12px 0 16px 0;">
            <input type="checkbox" id="chk-privacy-consent" style="margin-top: 4px; accent-color: var(--brand-primary);" required checked>
            <label for="chk-privacy-consent" style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
              I consent to meal intent processing under DPDP privacy standards. My individual Eat/Skip choices are processed anonymously and hidden from mess staff.
            </label>
          </div>
        ` : `
          <div class="form-group">
            <label class="form-label" for="signup-block">Department / Staff Designation</label>
            <input type="text" id="signup-block" class="form-input" placeholder="${role === 'kitchen' ? 'Head Chef / Catering Incharge' : 'Hostel Warden / Mess Secretary'}" value="" required autocomplete="off">
          </div>
        `}

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
          Register Account & Open Dashboard
        </button>

        <div style="margin-top: 18px; text-align: center; font-size: 0.84rem; color: var(--text-secondary);">
          Already have an account? 
          <a href="#" id="link-go-login" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline;">
            Sign In here
          </a>
        </div>
      </form>
    `;
  }

  function attachEvents() {
    container.querySelector('#tab-login').onclick = () => {
      activeTab = 'login';
      errorMessage = '';
      update();
    };

    container.querySelector('#tab-signup').onclick = () => {
      activeTab = 'signup';
      errorMessage = '';
      update();
    };

    const linkGoSignup = container.querySelector('#link-go-signup');
    if (linkGoSignup) {
      linkGoSignup.onclick = (e) => {
        e.preventDefault();
        activeTab = 'signup';
        errorMessage = '';
        update();
      };
    }

    const linkGoLogin = container.querySelector('#link-go-login');
    if (linkGoLogin) {
      linkGoLogin.onclick = (e) => {
        e.preventDefault();
        activeTab = 'login';
        errorMessage = '';
        update();
      };
    }

    container.querySelectorAll('.role-option-card').forEach(card => {
      card.onclick = () => {
        selectedRole = card.dataset.role;
        update();
      };
    });

    // Demo quick login triggers
    container.querySelectorAll('.btn-demo-quick').forEach(btn => {
      btn.onclick = async () => {
        const demoId = btn.dataset.demoId;
        try {
          const session = await store.login(demoId, 'demo');
          tracker.track('app_opened', { role: session.role, source: 'demo_quick' });
          window.showToast(`Logged in as ${session.name}`, 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    });

    const loginForm = container.querySelector('#form-login');
    if (loginForm) {
      const emailInput = container.querySelector('#login-email');
      const passInput = container.querySelector('#login-password');
      if (emailInput) emailInput.value = '';
      if (passInput) passInput.value = '';

      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const identifier = (container.querySelector('#login-email').value || '').trim();
        const password = container.querySelector('#login-password').value || '';

        try {
          const session = await store.login(identifier, password);
          tracker.track('app_opened', { role: session.role, source: 'login_form' });
          window.showToast(`Welcome, ${session.name}!`, 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    }

    const signupForm = container.querySelector('#form-signup');
    if (signupForm) {
      container.querySelectorAll('#form-signup input:not([type="checkbox"])').forEach(input => input.value = '');

      signupForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = container.querySelector('#signup-name').value;
        const email = container.querySelector('#signup-email').value;
        const password = container.querySelector('#signup-password').value;
        const institution = container.querySelector('#signup-institution').value;
        const hostelName = container.querySelector('#signup-hostel').value;
        const block = container.querySelector('#signup-block')?.value || '';

        try {
          const session = await store.signup({
            name,
            email,
            password,
            role: selectedRole,
            institution,
            hostelName,
            block,
          });
          tracker.track('app_opened', { role: selectedRole, source: 'signup_form' });
          window.showToast(`Account registered for ${name}!`, 'success');
        } catch (err) {
          errorMessage = err.message;
          update();
        }
      };
    }
  }

  update();
}
