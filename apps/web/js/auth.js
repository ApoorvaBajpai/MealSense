/**
 * Prototype Authentication Service
 * Local browser authentication (localStorage + SHA-256) for portfolio evaluation.
 * Supports:
 * 1. Dedicated first-time evaluation accounts for evaluator walkthroughs.
 * 2. Real user registrations: strictly clean slate without dummy data in Live Mode.
 */

const STORAGE_USERS_KEY = 'mealsense_accounts_v1';
const STORAGE_SESSION_KEY = 'mealsense_session_v1';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  getAccounts() {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Strictly filter out any test IDs, old demo emails, or dummy accounts
          const cleanRealAccounts = parsed.filter(acc => {
            if (!acc || acc.isDemo) return false;
            const email = (acc.email || '').toLowerCase().trim();
            const id = (acc.id || '').toLowerCase().trim();
            const name = (acc.name || '').toLowerCase().trim();

            // Filter out any demo / test identifiers and old seed accounts
            if (
              email === 'student_testid' ||
              email === 'staff_testid' ||
              email === 'admin_testid' ||
              email === 'student@mess.edu' ||
              email === 'chef@mess.edu' ||
              email === 'warden@mess.edu' ||
              email.includes('testid') ||
              email.endsWith('@mess.edu') ||
              email.endsWith('@mealsense.app') ||
              id.includes('testid') ||
              id.includes('demo') ||
              name.includes('aarav sharma') ||
              name.includes('rajesh kumar') ||
              name.includes('v. k. verma') ||
              name.includes('demo')
            ) {
              return false;
            }
            return true;
          });

          // Permanently purge any dummy test entries from localStorage
          if (cleanRealAccounts.length !== parsed.length) {
            localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(cleanRealAccounts));
          }
          return cleanRealAccounts;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored accounts', e);
    }
    return [];
  },

  deleteAccountByEmail(emailToDelete) {
    const clean = this.getAccounts().filter(acc => acc.email.toLowerCase() !== emailToDelete.toLowerCase());
    this.saveAccounts(clean);
    return clean;
  },

  saveAccounts(accounts) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts));
  },

  getCurrentSession() {
    try {
      const stored = localStorage.getItem(STORAGE_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse session', e);
    }
    return null;
  },

  saveSession(sessionData) {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
  },

  clearSession() {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  },

  async authenticate(identifier, password) {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Dedicated Demo Testing Accounts (support common demo aliases)
    if (
      cleanId === 'student_testid' ||
      cleanId === 'student_testid@mealsense.app' ||
      cleanId === 'student' ||
      cleanId === 'demo' ||
      cleanId === 'demo_student'
    ) {
      const session = {
        id: 'student_testid',
        name: 'Aarav Sharma (Demo Student)',
        email: 'student_testid',
        role: 'student',
        hostelName: 'Ramanujan Hall Dining Facility',
        institution: 'Campus University',
        block: 'Block A (Room 204)',
        isDemo: true,
        loggedInAt: new Date().toISOString(),
      };
      this.saveSession(session);
      return session;
    }

    if (
      cleanId === 'staff_testid' ||
      cleanId === 'staff_testid@mealsense.app' ||
      cleanId === 'staff' ||
      cleanId === 'chef' ||
      cleanId === 'kitchen' ||
      cleanId === 'demo_staff'
    ) {
      const session = {
        id: 'staff_testid',
        name: 'Chef Rajesh Kumar (Demo Chef)',
        email: 'staff_testid',
        role: 'kitchen',
        hostelName: 'Ramanujan Hall Dining Facility',
        institution: 'Campus University',
        block: 'Head of Culinary & Inventory',
        isDemo: true,
        loggedInAt: new Date().toISOString(),
      };
      this.saveSession(session);
      return session;
    }

    if (
      cleanId === 'admin_testid' ||
      cleanId === 'admin_testid@mealsense.app' ||
      cleanId === 'admin' ||
      cleanId === 'warden' ||
      cleanId === 'demo_admin'
    ) {
      const session = {
        id: 'admin_testid',
        name: 'Dr. V. K. Verma (Demo Warden)',
        email: 'admin_testid',
        role: 'admin',
        hostelName: 'Ramanujan Hall Dining Facility',
        institution: 'Campus University',
        block: 'Warden & Food Committee Chair',
        isDemo: true,
        loggedInAt: new Date().toISOString(),
      };
      this.saveSession(session);
      return session;
    }

    // 2. Real Registered Accounts (Clean Slate)
    const hash = await sha256(password);
    const accounts = this.getAccounts();

    const user = accounts.find(acc => acc.email.toLowerCase() === cleanId && acc.isActive);
    if (!user) {
      throw new Error('No account found with this ID/email. Click "Register New Account" to register, or use a demo ID.');
    }

    if (user.passwordHash !== hash) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hostelName: user.hostelName,
      institution: user.institution || '',
      block: user.block,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    this.saveSession(session);
    return session;
  },

  async registerUser({ name, email, password, role, hostelName, institution, block }) {
    const cleanEmail = email.trim().toLowerCase();

    // Prevent collision with demo IDs
    if (['student_testid', 'staff_testid', 'admin_testid'].includes(cleanEmail) || cleanEmail.includes('testid')) {
      throw new Error('This ID or name pattern is reserved for evaluation demo accounts.');
    }

    const accounts = this.getAccounts();
    if (accounts.some(acc => acc.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const passwordHash = await sha256(password);
    const newUser = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      hostelName: (hostelName && hostelName.trim()) || 'Main Dining Facility',
      institution: (institution && institution.trim()) || '',
      block: (block && block.trim()) || (role === 'student' ? 'General Resident' : 'Mess Staff'),
      isDemo: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newUser);
    this.saveAccounts(accounts);

    const session = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      hostelName: newUser.hostelName,
      institution: newUser.institution,
      block: newUser.block,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    this.saveSession(session);
    return session;
  }
};
