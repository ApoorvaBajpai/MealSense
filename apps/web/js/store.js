/**
 * MealSense Production Reactive Store
 * PM Upgrade Version 2.1 (Two Explicit Data Modes: Demo & Live)
 * 
 * Implements Section 2 & 17:
 * - Data Provider Layer: DemoDataProvider for DEMO MODE and LiveDataProvider for LIVE MODE.
 * - Single source of calculation truth via Central Metrics Engine.
 * - Strict mode isolation and zero leakage.
 * - Guided 60-Second PM Tour and deep-link support.
 */

import { authService } from './auth.js';
import { demoDataProvider } from './data/demo/demo-provider.js';
import { liveDataProvider } from './data/live/live-provider.js';
import { metricEngine } from './metrics/metric-engine.js';
import { baselineEngine } from './metrics/baseline-engine.js';
import { trendEngine } from './metrics/trend-engine.js';
import { funnelEngine } from './metrics/funnel-engine.js';
import { insightEngine } from './metrics/insight-engine.js';
import { experimentEngine } from './metrics/experiment-engine.js';

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
      this.dataMode = existingSession.isDemo ? 'demo' : 'live';
    } else {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentRole = 'auth';
      this.dataMode = 'demo'; // Default to demo for unauthenticated visitors
    }

    this.safetyBuffer = 0.50; // Beta = 50%
    this.selectedTimeframe = '30d';
    this.selectedKitchenMealId = null;
    this.absences = [];

    // Guided 60-Second PM Evaluator Tour State
    this.guidedTour = {
      active: false,
      step: 1,
      totalSteps: 5,
      steps: [
        {
          role: 'student',
          targetId: 'student_testid',
          title: 'Step 1/5: Student Intent Signal',
          description: 'Aarav Sharma submits a 1-tap meal decision ("Eating") in under 3 seconds with visible personal impact.',
          actionHint: 'Tap "Eating" or "Not Eating" on the Lunch card.'
        },
        {
          role: 'kitchen',
          targetId: 'staff_testid',
          title: 'Step 2/5: Demand Forecast & Decision Card',
          description: 'Live student intent feeds the model. Chef Rajesh sees a decision-first prep target: 348 expected + 14 safety buffer = 362 servings.',
          actionHint: 'Review the recommended prep target box.'
        },
        {
          role: 'kitchen',
          targetId: 'staff_testid',
          title: 'Step 3/5: Kitchen Decision Acceptance or Override',
          description: 'Chef accepts the recommendation (or overrides with an operational reason). Decision is permanently audited.',
          actionHint: 'Click "Use Recommendation" or "Adjust Quantity".'
        },
        {
          role: 'kitchen',
          targetId: 'staff_testid',
          title: 'Step 4/5: 60-Second Post-Meal Outcome Audit',
          description: 'Post-service, kitchen records actual headcount, unserved tray food, and plate scrapings. Shortage guardrail is verified.',
          actionHint: 'Click "Log Realized Headcount & Waste".'
        },
        {
          role: 'admin',
          targetId: 'admin_testid',
          title: 'Step 5/5: Executive Impact, Baseline Comparison & SaaS ROI',
          description: 'Dr. Verma views the North Star metric (Avoidable Food Waste/meal ↓21.7%), defensible savings, and monthly audit report.',
          actionHint: 'Explore the Baseline Comparison and Deterministic Insights tabs.'
        }
      ]
    };

    // Initialize initial selected meal
    this._refreshSelectedKitchenMeal();

    // Handle deep links on startup
    this._handleDeepLinks();
  }

  // --- Provider Resolution ---

  getDataProvider() {
    return this.dataMode === 'demo' ? demoDataProvider : liveDataProvider;
  }

  get isDemo() {
    return this.dataMode === 'demo';
  }

  get facility() {
    return this.getDataProvider().getFacility();
  }

  get baseline() {
    return this.getDataProvider().getBaseline();
  }

  get meals() {
    return this.getDataProvider().getMeals();
  }

  get intentCounts() {
    return this.getDataProvider().getAllIntentCounts();
  }

  get outcomes() {
    return this.getDataProvider().getAllOutcomes();
  }

  get predictions() {
    return this.getDataProvider().getAllPredictions();
  }

  get kitchenDecisions() {
    return this.getDataProvider().getAllKitchenDecisions();
  }

  get auditLogs() {
    return this.getDataProvider().getAuditLogs();
  }

  get events() {
    return this.getDataProvider().getEvents();
  }

  get experiments() {
    return experimentEngine.getExperiments(this.getDataProvider());
  }

  _refreshSelectedKitchenMeal() {
    const meals = this.meals;
    if (meals.length > 0) {
      // Find today's lunch or published meal, otherwise first meal
      const pub = meals.find(m => m.status === 'published');
      this.selectedKitchenMealId = pub ? pub.id : meals[0].id;
    } else {
      this.selectedKitchenMealId = null;
    }
  }

  _handleDeepLinks() {
    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const roleParam = params.get('role');
      const tourParam = params.get('tour');

      if (tourParam === 'true') {
        this.startGuidedTour();
        return;
      }

      if (modeParam === 'demo' || roleParam) {
        let demoId = 'student_testid';
        if (roleParam === 'kitchen') demoId = 'staff_testid';
        else if (roleParam === 'admin') demoId = 'admin_testid';
        
        this.login(demoId, 'demo');
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  // --- Calculations Delegated to Metrics Engines ---

  getMetricsSummary() {
    return metricEngine.calculateSummary(this.getDataProvider());
  }

  getBaselineComparison() {
    return baselineEngine.compare(this.baseline, this.getMetricsSummary(), this.facility);
  }

  getTrendSeries(metricKey) {
    return trendEngine.getSeries(metricKey, this.selectedTimeframe, this.getDataProvider());
  }

  getStudentFunnel() {
    return funnelEngine.getStudentFunnel(this.getDataProvider());
  }

  getKitchenFunnel() {
    return funnelEngine.getKitchenFunnel(this.getDataProvider());
  }

  getInsights() {
    return insightEngine.generateInsights(this.getDataProvider(), this.getMetricsSummary(), this.getBaselineComparison());
  }

  // --- Observer Pattern ---

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

  setTimeframe(tf) {
    this.selectedTimeframe = tf;
    this.notify();
  }

  // --- Auth & Session ---

  async login(identifier, password) {
    const session = await authService.authenticate(identifier, password);
    this.isAuthenticated = true;
    this.currentUser = session;
    this.currentRole = session.role;
    this.dataMode = session.isDemo ? 'demo' : 'live';

    this._refreshSelectedKitchenMeal();
    this.notify();
    return session;
  }

  async signup(userData) {
    const session = await authService.registerUser(userData);
    this.isAuthenticated = true;
    this.currentUser = session;
    this.currentRole = session.role;
    this.dataMode = 'live'; // Real registrations are strictly LIVE MODE

    // Update facility name in live provider
    liveDataProvider.setFacility({
      name: session.hostelName,
      registeredCount: 0
    });

    this._refreshSelectedKitchenMeal();
    this.notify();
    return session;
  }

  logout() {
    authService.clearSession();
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentRole = 'auth';
    this.guidedTour.active = false;
    this.dataMode = 'demo';
    this.notify();
  }

  async switchToDemo(role = 'student') {
    let demoId = 'student_testid';
    if (role === 'kitchen' || role === 'staff') demoId = 'staff_testid';
    else if (role === 'admin' || role === 'warden') demoId = 'admin_testid';

    return await this.login(demoId, 'demo');
  }

  switchToLive() {
    this.logout();
  }

  // --- Guided PM Evaluator Tour ---

  async startGuidedTour() {
    this.dataMode = 'demo';
    this.guidedTour.active = true;
    this.guidedTour.step = 1;
    await this.login('student_testid', 'demo');
    this.notify();
  }

  async setTourStep(stepNum) {
    if (stepNum < 1 || stepNum > this.guidedTour.totalSteps) return;
    this.guidedTour.step = stepNum;
    const stepConfig = this.guidedTour.steps[stepNum - 1];

    if (this.currentUser?.id !== stepConfig.targetId) {
      await this.login(stepConfig.targetId, 'demo');
    } else {
      this.notify();
    }
  }

  async nextTourStep() {
    if (this.guidedTour.step < this.guidedTour.totalSteps) {
      await this.setTourStep(this.guidedTour.step + 1);
    } else {
      this.exitGuidedTour();
    }
  }

  async prevTourStep() {
    if (this.guidedTour.step > 1) {
      await this.setTourStep(this.guidedTour.step - 1);
    }
  }

  exitGuidedTour() {
    this.guidedTour.active = false;
    this.notify();
  }

  resetDemo() {
    demoDataProvider.resetDemo();
    this._refreshSelectedKitchenMeal();
    this.notify();
  }

  // --- Actions Delegated to Provider ---

  createMeal(mealData) {
    const newMeal = this.getDataProvider().createMeal(mealData);
    this.selectedKitchenMealId = newMeal.id;
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

  setExperimentVariant(expId, variant) {
    if (this.dataMode !== 'demo') {
      console.warn('Experiment variant toggles are restricted in Live Mode');
      return;
    }
    const exps = this.getDataProvider().getExperiments();
    const exp = exps.find(e => e.id === expId);
    if (exp) {
      exp.activeVariant = variant;
      if (this.dataMode === 'demo') demoDataProvider.saveState();
      this.notify();
    }
  }

  updateFacility(facilityData) {
    if (this.dataMode === 'live') {
      liveDataProvider.setFacility(facilityData);
    } else {
      this.facility.name = facilityData.name;
      this.facility.registeredCount = facilityData.registeredCount;
      this.facility.kgPerServing = facilityData.kgPerServing;
      this.facility.costPerServing = facilityData.costPerServing;
      demoDataProvider.saveState();
    }
    this.notify();
  }
}

export const store = new MealSenseStore();
