/**
 * MealSense Production Reactive Store
 * Manages tenant state with strict separation:
 * - Demo accounts (student_testid, staff_testid, admin_testid) load sample dummy data
 * - Real user registrations load a clean, empty operational slate with zero dummy data.
 */

import { authService } from './auth.js';

const STORAGE_REAL_MEALS_KEY = 'mealsense_real_meals_v1';
const STORAGE_REAL_INTENT_KEY = 'mealsense_real_intents_v1';
const STORAGE_REAL_OUTCOMES_KEY = 'mealsense_real_outcomes_v1';
const STORAGE_REAL_AUDIT_KEY = 'mealsense_real_audits_v1';

// Rich demo dataset for student_testid, staff_testid, admin_testid
function getDummyDataset() {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const meals = [
    {
      id: 'demo-yesterday-lunch',
      mealDate: yesterdayStr,
      type: 'lunch',
      name: 'Everyday Comfort Rajma & Rice',
      items: ['Rajma Masala', 'Steamed Basmati Rice', 'Aloo Gobi Dry', 'Phulka Roti', 'Green Salad'],
      startsAt: `${yesterdayStr}T12:30:00`,
      endsAt: `${yesterdayStr}T14:30:00`,
      responseCutoff: `${yesterdayStr}T10:00:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 4,
    },
    {
      id: 'demo-today-lunch',
      mealDate: todayStr,
      type: 'lunch',
      name: 'North Indian Deluxe Thali',
      items: ['Paneer Butter Masala', 'Dal Makhani', 'Jeera Rice', 'Tandoori Butter Roti', 'Boondi Raita', 'Gulab Jamun'],
      startsAt: `${todayStr}T12:30:00`,
      endsAt: `${todayStr}T14:30:00`,
      responseCutoff: new Date(Date.now() + 50 * 60000).toISOString(),
      status: 'published',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: null,
    },
    {
      id: 'demo-today-dinner',
      mealDate: todayStr,
      type: 'dinner',
      name: 'Homestyle Yellow Dal & Subzi',
      items: ['Yellow Dal Tadka', 'Seasonal Bhindi Masala', 'Steamed Rice', 'Tawa Phulka', 'Fresh Curd'],
      startsAt: `${todayStr}T19:30:00`,
      endsAt: `${todayStr}T21:30:00`,
      responseCutoff: `${todayStr}T17:30:00`,
      status: 'published',
      registeredSnapshot: 450,
      myResponse: null,
      rating: null,
    },
    {
      id: 'demo-tomorrow-breakfast',
      mealDate: tomorrowStr,
      type: 'breakfast',
      name: 'South Indian Dosa & Idli Spread',
      items: ['Crispy Masala Dosa', 'Steamed Idli', 'Medu Vada', 'Fresh Coconut Chutney', 'Drumstick Sambar'],
      startsAt: `${tomorrowStr}T07:30:00`,
      endsAt: `${tomorrowStr}T09:30:00`,
      responseCutoff: `${tomorrowStr}T05:30:00`,
      status: 'published',
      registeredSnapshot: 450,
      myResponse: null,
      rating: null,
    }
  ];

  const intentCounts = {
    'demo-yesterday-lunch': { nEat: 342, nSkip: 63, nLate: 8 },
    'demo-today-lunch': { nEat: 318, nSkip: 52, nLate: 2 },
    'demo-today-dinner': { nEat: 265, nSkip: 42, nLate: 0 },
    'demo-tomorrow-breakfast': { nEat: 185, nSkip: 38, nLate: 0 },
  };

  const outcomes = {
    'demo-yesterday-lunch': {
      actualCount: 345,
      preparedServings: 355,
      followedRecommendation: true,
      ranShort: false,
      wasteRecords: [
        { wasteType: 'not_served', category: 'subzi_and_rice', quantityKg: 3.200, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 4.600, donated: false },
      ]
    }
  };

  const auditLogs = [
    { id: 1, action: 'PUBLISH_MEAL', table: 'meals', rowId: 'demo-today-lunch', actor: 'Chef Rajesh Kumar', time: 'Today 07:30' },
    { id: 2, action: 'UPDATE_INTENT', table: 'meal_intent_counts', rowId: 'demo-today-lunch', actor: 'System Trigger', time: 'Today 10:14' },
  ];

  return { meals, intentCounts, outcomes, auditLogs };
}

class MealSenseStore {
  constructor() {
    this.listeners = new Set();

    // Theme (Default: warm beige light theme)
    this.theme = localStorage.getItem('mealsense_theme') || 'light';
    document.documentElement.setAttribute('data-theme', this.theme);

    // Active session
    const existingSession = authService.getCurrentSession();
    if (existingSession) {
      this.isAuthenticated = true;
      this.currentUser = existingSession;
      this.currentRole = existingSession.role;
    } else {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentRole = 'auth';
    }

    this.facility = {
      name: this.currentUser ? this.currentUser.hostelName : 'Campus Dining Hall',
      timezone: 'Asia/Kolkata',
      registeredCount: 450,
      kgPerServing: 0.350,
      costPerServing: 42.00,
    };

    this.absences = [];
    this.loadStateForUser();
    this.safetyBuffer = 0.50;
  }

  loadStateForUser() {
    this.absences = [];
    const isDemo = Boolean(this.currentUser && this.currentUser.isDemo);

    if (isDemo) {
      // Load rich dummy dataset
      const dummy = getDummyDataset();
      this.meals = dummy.meals;
      this.intentCounts = dummy.intentCounts;
      this.outcomes = dummy.outcomes;
      this.auditLogs = dummy.auditLogs;
      this.selectedKitchenMealId = this.meals[1]?.id || this.meals[0]?.id;
    } else {
      // Real user: Strictly clean operational state (Zero dummy data)
      this.meals = this.loadRealMeals();
      this.intentCounts = this.loadRealIntents();
      this.outcomes = this.loadRealOutcomes();
      this.auditLogs = this.loadRealAuditLogs();
      this.selectedKitchenMealId = this.meals[0]?.id || null;
      if (this.currentUser) {
        this.facility.name = this.currentUser.hostelName;
      }
    }
  }

  loadRealMeals() {
    try {
      const stored = localStorage.getItem(STORAGE_REAL_MEALS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return []; // Clean slate for real users
  }

  saveRealMeals() {
    if (!this.currentUser?.isDemo) {
      localStorage.setItem(STORAGE_REAL_MEALS_KEY, JSON.stringify(this.meals));
    }
  }

  saveMeals() {
    this.saveRealMeals();
  }

  loadRealIntents() {
    try {
      const stored = localStorage.getItem(STORAGE_REAL_INTENT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  saveRealIntents() {
    if (!this.currentUser?.isDemo) {
      localStorage.setItem(STORAGE_REAL_INTENT_KEY, JSON.stringify(this.intentCounts));
    }
  }

  saveIntents() {
    this.saveRealIntents();
  }

  loadRealOutcomes() {
    try {
      const stored = localStorage.getItem(STORAGE_REAL_OUTCOMES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  saveRealOutcomes() {
    if (!this.currentUser?.isDemo) {
      localStorage.setItem(STORAGE_REAL_OUTCOMES_KEY, JSON.stringify(this.outcomes));
    }
  }

  saveOutcomes() {
    this.saveRealOutcomes();
  }

  loadRealAuditLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_REAL_AUDIT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  saveRealAuditLogs() {
    if (!this.currentUser?.isDemo) {
      localStorage.setItem(STORAGE_REAL_AUDIT_KEY, JSON.stringify(this.auditLogs));
    }
  }

  saveAuditLogs() {
    this.saveRealAuditLogs();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('mealsense_theme', this.theme);
    document.documentElement.setAttribute('data-theme', this.theme);
    this.notify();
  }

  async login(identifier, password) {
    const session = await authService.authenticate(identifier, password);
    this.isAuthenticated = true;
    this.currentUser = session;
    this.currentRole = session.role;
    this.facility.name = session.hostelName;

    // Load clean vs demo data
    this.loadStateForUser();

    this.logAudit('USER_LOGIN', 'sessions', session.id, session.name);
    this.notify();
    return session;
  }

  async signup(userData) {
    const session = await authService.registerUser(userData);
    this.isAuthenticated = true;
    this.currentUser = session;
    this.currentRole = session.role;
    this.facility.name = session.hostelName;

    // Clean slate for real registrations
    this.loadStateForUser();

    this.logAudit('USER_REGISTER', 'profiles', session.id, session.name);
    this.notify();
    return session;
  }

  logout() {
    const actor = this.currentUser?.name || 'User';
    authService.clearSession();
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentRole = 'auth';
    this.meals = [];
    this.intentCounts = {};
    this.notify();
  }

  createMeal(mealData) {
    const id = 'meal-' + Date.now();
    const newMeal = {
      id,
      mealDate: mealData.mealDate,
      type: mealData.type,
      name: mealData.name,
      items: mealData.items,
      startsAt: `${mealData.mealDate}T${mealData.startTime}:00`,
      endsAt: `${mealData.mealDate}T${mealData.endTime}:00`,
      responseCutoff: `${mealData.mealDate}T${mealData.cutoffTime}:00`,
      status: 'published',
      registeredSnapshot: this.facility.registeredCount,
      myResponse: null,
      rating: null,
    };

    this.meals.push(newMeal);
    this.intentCounts[id] = { nEat: 0, nSkip: 0, nLate: 0 };
    this.selectedKitchenMealId = id;
    this.saveRealMeals();
    this.saveRealIntents();
    this.logAudit('CREATE_MEAL', 'meals', id, this.currentUser.name);
    this.notify();
    return newMeal;
  }

  setSelectedKitchenMeal(mealId) {
    this.selectedKitchenMealId = mealId;
    this.notify();
  }

  setSafetyBuffer(val) {
    this.safetyBuffer = parseFloat(val);
    this.notify();
  }

  logAudit(action, table, rowId, actor) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.auditLogs.unshift({
      id: Date.now(),
      action,
      table,
      rowId,
      actor,
      time: `Today ${timeStr}`,
    });
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    this.saveRealAuditLogs();
  }
}

export const store = new MealSenseStore();
