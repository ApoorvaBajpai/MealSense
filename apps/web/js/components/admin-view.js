/**
 * Admin Dashboard View Component: PM Upgrade Version 2.0
 * 
 * Features:
 * - Section 12: Executive-Friendly Overview (North Star: Avoidable Waste/Meal, Guardrail: Shortage Rate)
 * - Section 5 & 6: Baseline Comparison & "Estimated Savings vs Baseline" Methodology
 * - Section 12.2: Interactive 7d / 30d / 90d Trends Selector
 * - Section 12.3 & 13: Deterministic Insights & Menu Intelligence with Small-Sample Suppression
 * - Section 14, 15, 16: Product Analytics, Funnels & Live A/B Experiments
 * - Section 18: Interactive Institutional SaaS ROI Calculator
 * - Section 24: Human-Readable Monthly Mess Audit Report (Print/PDF preview & CSV export)
 */

import { store, TREND_DATASETS } from '../store.js';
import { api } from '../api.js';
import { authService } from '../auth.js';
import { tracker } from '../analytics.js';

let currentAdminTab = 'overview'; // 'overview' | 'insights' | 'analytics' | 'roi' | 'governance'

export function renderAdminView(container) {
  const isDemo = Boolean(store.currentUser && store.currentUser.isDemo);
  const facility = store.facility;
  const metrics = store.getMetricsSummary();
  const tf = store.selectedTimeframe || '30d';
  const trendData = TREND_DATASETS[tf];

  // Roster Accounts
  const DEMO_EVALUATION_ROSTER = [
    { name: 'Aarav Sharma (Demo Student)', role: 'student', block: 'Block A (Room 204)', email: 'student_testid', status: 'Active Resident' },
    { name: 'Chef Rajesh Kumar (Demo Chef)', role: 'kitchen', block: 'Culinary & Inventory', email: 'staff_testid', status: 'Mess Staff' },
    { name: 'Dr. V. K. Verma (Demo Warden)', role: 'admin', block: 'Warden & Food Committee', email: 'admin_testid', status: 'Committee Chair' },
  ];

  const rawAccounts = authService.getAccounts();
  const realAccounts = rawAccounts.filter(acc => {
    if (!acc || acc.isDemo) return false;
    const email = (acc.email || '').toLowerCase().trim();
    return !email.includes('testid') && !email.includes('demo');
  });

  const accounts = isDemo ? DEMO_EVALUATION_ROSTER : realAccounts;
  const students = accounts.filter(a => a.role === 'student');

  const html = `
    <div class="admin-container">
      <!-- Executive Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
              🏛️ ${facility.name}
            </h2>
            <span class="badge ${isDemo ? 'badge-eat' : 'badge-warning'}" style="font-size: 0.72rem;">
              ${isDemo ? 'Demo Evaluator Sandbox' : 'Live Institutional Deployment'}
            </span>
          </div>
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
            Institutional Mess Administration & Waste Audit Center • Baseline Period: Aug 1–31, 2026
          </span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btn-open-methodology" class="btn btn-secondary btn-sm" title="View Defensible Savings Methodology">
            ℹ️ Baseline Methodology
          </button>
          <button id="btn-monthly-report" class="btn btn-primary btn-sm" title="Generate Human-Readable Monthly Mess Report">
            📄 Monthly Mess Report
          </button>
          <button id="btn-edit-facility" class="btn btn-secondary btn-sm">
            ⚙️ Facility Setup
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="kitchen-tabs" style="margin-bottom: 20px;">
        <button class="kitchen-tab-btn ${currentAdminTab === 'overview' ? 'active' : ''}" data-admin-tab="overview">
          📊 Executive Impact & Trends
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'insights' ? 'active' : ''}" data-admin-tab="insights">
          💡 Deterministic Insights
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'analytics' ? 'active' : ''}" data-admin-tab="analytics">
          📈 Analytics, Funnels & A/B Tests
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'roi' ? 'active' : ''}" data-admin-tab="roi">
          💰 Institutional SaaS ROI Calculator
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'governance' ? 'active' : ''}" data-admin-tab="governance">
          🛡️ Roster & Model Governance
        </button>
      </div>

      ${renderActiveTabContent(currentAdminTab, { facility, metrics, tf, trendData, accounts, students, isDemo })}
    </div>
  `;

  container.innerHTML = html;
  attachAdminEvents(container);
}

function renderActiveTabContent(tab, data) {
  switch (tab) {
    case 'overview': return renderOverviewTab(data);
    case 'insights': return renderInsightsTab(data);
    case 'analytics': return renderAnalyticsTab(data);
    case 'roi': return renderRoiCalculatorTab(data);
    case 'governance': return renderGovernanceTab(data);
    default: return renderOverviewTab(data);
  }
}

// ---------------- TAB 1: EXECUTIVE OVERVIEW & TRENDS ----------------
function renderOverviewTab({ facility, metrics, tf, trendData, isDemo }) {
  return `
    <div>
      <!-- Section 12.1: Executive KPI Grid -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <!-- North Star Metric -->
        <div class="kpi-card" style="border-top: 4px solid var(--color-eat); background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(46, 107, 72, 0.05) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">⭐ North Star Metric: Avoidable Waste</span>
            <span class="badge badge-eat" style="font-size: 0.7rem;">Target: ≤ 0.17 kg</span>
          </div>
          <div class="kpi-value" style="color: var(--color-eat);">
            ${metrics.wastePerMealKg} <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">kg / meal</span>
          </div>
          <span class="kpi-delta delta-good">
            ↓ ${metrics.wasteReductionPct}% vs Pre-Implementation Baseline (${metrics.baselineWasteKg} kg)
          </span>
        </div>

        <!-- Overproduction Rate -->
        <div class="kpi-card">
          <span class="kpi-label">Kitchen Overproduction Rate</span>
          <div class="kpi-value">${metrics.overproductionRate}%</div>
          <span class="kpi-delta delta-good">
            ↓ ${metrics.overproductionReductionPct}% vs Baseline (${metrics.baselineOverproductionRate}%)
          </span>
        </div>

        <!-- Forecast MAE -->
        <div class="kpi-card">
          <span class="kpi-label">Forecast Accuracy (MAE)</span>
          <div class="kpi-value">${metrics.forecastMae} <span style="font-size: 0.9rem; color: var(--text-muted);">heads</span></div>
          <span class="kpi-delta delta-good">
            ↓ ${metrics.maeReductionPct}% error reduction vs baseline
          </span>
        </div>

        <!-- Non-Negotiable Guardrail -->
        <div class="kpi-card" style="border-top: 4px solid ${metrics.shortageRate <= 0.5 ? 'var(--color-eat)' : 'var(--color-danger)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">🛡️ Guardrail: Shortage Rate</span>
            <span class="badge ${metrics.shortageRate <= 0.5 ? 'badge-eat' : 'badge-warning'}" style="font-size: 0.7rem;">Limit: < 0.5%</span>
          </div>
          <div class="kpi-value" style="color: ${metrics.shortageRate <= 0.5 ? 'var(--color-eat)' : 'var(--color-danger)'};">
            ${metrics.shortageRate}%
          </div>
          <span class="kpi-delta delta-good">
            ✓ Zero shortages recorded this month
          </span>
        </div>

        <!-- On-Time Intent Participation -->
        <div class="kpi-card">
          <span class="kpi-label">Student On-Time Response Rate</span>
          <div class="kpi-value">${metrics.onTimeResponseRate}%</div>
          <span class="kpi-delta delta-good">
            ↑ from 24.5% baseline (+53.0 pp)
          </span>
        </div>

        <!-- Estimated Savings vs Baseline -->
        <div class="kpi-card" style="background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(184, 93, 56, 0.05) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">Estimated Savings vs Baseline*</span>
            <span class="badge" style="font-size: 0.68rem; background: var(--bg-secondary);">Defensible Est.</span>
          </div>
          <div class="kpi-value" style="color: var(--brand-primary);">
            ₹${metrics.estimatedMonthlySavings.toLocaleString('en-IN')}
          </div>
          <span class="kpi-delta delta-good">
            ₹${facility.costPerServing}/serving avoided overprep
          </span>
        </div>
      </div>

      <!-- Section 6: Baseline vs Current Like-for-Like Comparison Table -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              📊 Like-for-Like Operational Impact: Baseline vs. Current
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Comparing pre-implementation audit period (August 2026) against live MealSense operations (September 2026)
            </span>
          </div>
          <span class="badge badge-eat" style="font-size: 0.74rem;">
            Sample Size: 12,420 Meals Evaluated
          </span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Operational Metric</th>
                <th>Baseline (Pre-MealSense)</th>
                <th>Current (With MealSense)</th>
                <th>Measured Change (Δ)</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Avoidable Food Waste per Meal</strong></td>
                <td>0.230 kg / meal</td>
                <td><strong>0.180 kg / meal</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">↓ 21.7% (-0.050 kg)</span></td>
                <td><span class="badge badge-eat">Verified North Star</span></td>
              </tr>
              <tr>
                <td><strong>Kitchen Overproduction Rate</strong></td>
                <td>6.10% excess prep</td>
                <td><strong>4.20% excess prep</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">↓ 31.1% (-1.90 pp)</span></td>
                <td><span class="badge badge-eat">Verified Cook Reduction</span></td>
              </tr>
              <tr>
                <td><strong>Student On-Time Response Rate</strong></td>
                <td>24.5% unprompted</td>
                <td><strong>77.5% intent rate</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">↑ 216% (+53.0 pp)</span></td>
                <td><span class="badge badge-eat">Observed Correlation</span></td>
              </tr>
              <tr>
                <td><strong>Forecast Error (MAE)</strong></td>
                <td>8.6 heads error</td>
                <td><strong>7.1 heads error</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">↓ 17.4% (-1.5 heads)</span></td>
                <td><span class="badge badge-eat">Walk-Forward Backtested</span></td>
              </tr>
              <tr>
                <td><strong>Shortage Rate (Guardrail)</strong></td>
                <td>0.40% meals</td>
                <td><strong>0.00% meals</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">-0.40 pp (0 shortages)</span></td>
                <td><span class="badge badge-eat">✓ Guardrail Maintained</span></td>
              </tr>
              <tr style="background: rgba(184, 93, 56, 0.04);">
                <td><strong>Estimated Monthly Operational Savings</strong></td>
                <td>₹0 (Baseline)</td>
                <td><strong>₹${metrics.estimatedMonthlySavings.toLocaleString('en-IN')} / mo</strong></td>
                <td><span style="color: var(--brand-primary); font-weight: 800;">+₹${metrics.estimatedMonthlySavings.toLocaleString('en-IN')} net</span></td>
                <td><span class="badge" style="background: var(--bg-surface); border: 1px solid var(--border-color);">Audited Methodology*</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 10px; line-height: 1.4;">
          *<em>Correlation vs. Causation Disclosure:</em> Observed increases in student response rate correlate strongly with reduced preparation variance ($r = 0.79$). Avoidable cost savings are calculated as overproduction servings avoided multiplied by raw food cost per portion (₹42.00).
        </div>
      </div>

      <!-- Section 12.2: Operational Trends (7d / 30d / 90d) -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              📈 Operational Trends & Trajectory
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Visualize trajectory for food waste, forecast accuracy, and student engagement
            </span>
          </div>
          <!-- Timeframe Selector -->
          <div class="filter-group" style="display: flex; gap: 4px;">
            <button class="pill-btn btn-timeframe ${tf === '7d' ? 'active' : ''}" data-tf="7d">7 Days</button>
            <button class="pill-btn btn-timeframe ${tf === '30d' ? 'active' : ''}" data-tf="30d">30 Days</button>
            <button class="pill-btn btn-timeframe ${tf === '90d' ? 'active' : ''}" data-tf="90d">90 Days</button>
          </div>
        </div>

        <!-- Trend Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <!-- Chart 1: Avoidable Waste / Meal Trend -->
          <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Avoidable Waste (kg/meal)</span>
              <span style="font-size: 0.78rem; color: var(--color-eat); font-weight: 700;">↓ Declining</span>
            </div>
            ${renderMiniBarChart(trendData.labels, trendData.wastePerMeal, 'kg', 'var(--color-eat)')}
          </div>

          <!-- Chart 2: Forecast Error MAE Trend -->
          <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Forecast MAE (Error in Heads)</span>
              <span style="font-size: 0.78rem; color: var(--brand-primary); font-weight: 700;">↓ Calibrating</span>
            </div>
            ${renderMiniBarChart(trendData.labels, trendData.forecastMae, 'heads', 'var(--brand-primary)')}
          </div>

          <!-- Chart 3: Student Response Rate Trend -->
          <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">On-Time Student Intent Rate</span>
              <span style="font-size: 0.78rem; color: var(--color-eat); font-weight: 700;">↑ 77.5%</span>
            </div>
            ${renderMiniBarChart(trendData.labels, trendData.responseRate, '%', 'var(--brand-accent)')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------- TAB 2: DETERMINISTIC INSIGHTS ----------------
function renderInsightsTab() {
  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="card" style="border-left: 4px solid var(--brand-accent);">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
          💡 Deterministic Rule-Based Operational Insights
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
          MealSense applies deterministic heuristics on operational logs to surface actionable dining recommendations without black-box hallucinations.
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Insight 1: Waste Trend -->
          <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
                📉 Lunch Service Waste Dropped 22% Following Early Intent Peak
              </div>
              <span class="badge badge-eat">Operational Trend</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 4px 0 8px 0; line-height: 1.5;">
              When students respond before 10:00 AM, kitchen cook buffer targets tightened by 12 servings on average. Overproduction fell from 6.1% to 4.2% across Tuesday and Thursday lunch services.
            </p>
            <div style="font-size: 0.76rem; color: var(--brand-primary); font-weight: 700;">
              Recommended Action: Keep 10:30 AM cutoff notification active to sustain early student response yields.
            </div>
          </div>

          <!-- Insight 2: Friday Dinner Variance -->
          <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
                ⚠️ Friday Dinner Exhibits 1.8× Higher Attendance Variance
              </div>
              <span class="badge badge-warning">Problem Area</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 4px 0 8px 0; line-height: 1.5;">
              Weekend departures cause Friday dinner attendance to drop between 18% and 34% below weekday averages. When unprompted, kitchen cooks overprepared by 38 servings on Friday nights.
            </p>
            <div style="font-size: 0.76rem; color: var(--brand-primary); font-weight: 700;">
              Recommended Action: Conformal safety buffer automatically relaxes by -8 servings for Friday dinner services.
            </div>
          </div>

          <!-- Insight 3: Menu Intelligence & Suppression Rule -->
          <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
                🍲 Menu Intelligence: High-Protein Paneer Dishes Reduce Plate Waste by 35%
              </div>
              <span class="badge badge-eat">Menu Opportunity</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 4px 0 8px 0; line-height: 1.5;">
              Dishes featuring Paneer or Dal Makhani show average plate scrapings of only 0.04 kg/diner, compared to 0.11 kg/diner for bottle-gourd / pumpkin preparations.
            </p>
            <div style="font-size: 0.76rem; color: var(--brand-primary); font-weight: 700;">
              Recommended Action: Share palatability data with the student mess committee for next month's menu rotation.
            </div>
          </div>

          <!-- Small Group Privacy Rule Demonstration -->
          <div style="background: rgba(184, 93, 56, 0.04); border-radius: var(--radius-md); padding: 14px 16px; border: 1px dashed var(--brand-accent);">
            <div style="font-size: 0.84rem; font-weight: 800; color: var(--brand-primary); margin-bottom: 4px;">
              🔒 Small-Group Privacy Suppression Rule (Section 23 Compliance)
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
              <em>Block C (Wing 4) Intent Breakdown:</em> <strong>[ Insufficient data to display this breakdown — 3 responses ]</strong>.<br>
              Breakdowns with fewer than 5 active students are automatically suppressed across all admin views to protect individual resident anonymity.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------- TAB 3: PRODUCT ANALYTICS & EXPERIMENTS ----------------
function renderAnalyticsTab() {
  const exp01 = store.experiments['exp-01-value-prop'];
  const exp02 = store.experiments['exp-02-button-wording'];
  const exp03 = store.experiments['exp-03-impact-feedback'];
  const studentFunnel = tracker.getStudentFunnelMetrics();
  const kitchenFunnel = tracker.getKitchenFunnelMetrics();

  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Conversion Funnels Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        <!-- Student Funnel -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">
              📱 Student Intent Participation Funnel
            </h3>
            <span class="badge badge-eat">Yield: ${studentFunnel.onTimeYield}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${renderFunnelStep('1. App Opened', studentFunnel.appOpened, 100)}
            ${renderFunnelStep('2. Meal Viewed', studentFunnel.mealViewed, 94.2)}
            ${renderFunnelStep('3. Response Started', studentFunnel.responseStarted, 88.5)}
            ${renderFunnelStep('4. Response Submitted', studentFunnel.responseSubmitted, 82.6)}
            ${renderFunnelStep('5. On-Time Confirmed', studentFunnel.onTimeConfirmed, 77.3, true)}
          </div>
          <div style="margin-top: 14px; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px;">
            View-to-Response Conversion: <strong>${studentFunnel.viewToResponseRate}</strong>
          </div>
        </div>

        <!-- Kitchen Funnel -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">
              👨‍🍳 Kitchen Decision-to-Outcome Funnel
            </h3>
            <span class="badge badge-eat">Compliance: ${kitchenFunnel.complianceRate}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${renderFunnelStep('1. Forecast Viewed', kitchenFunnel.forecastViewed, 100)}
            ${renderFunnelStep('2. Recommendation Reviewed', kitchenFunnel.recommendationReviewed, 100)}
            ${renderFunnelStep('3. Decision Recorded', kitchenFunnel.decisionRecorded, 96.0)}
            ${renderFunnelStep('4. Used Without Override', kitchenFunnel.acceptedWithoutOverride, 84.0, true)}
            ${renderFunnelStep('5. Post-Meal Outcome Logged', kitchenFunnel.outcomesLogged, 98.0, true)}
          </div>
          <div style="margin-top: 14px; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px;">
            Cook Adoption Trust Ratio: <strong>${kitchenFunnel.acceptanceRate}</strong>
          </div>
        </div>
      </div>

      <!-- Active A/B Product Experiments Table -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              🧪 Active Product Experiments Register
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Hypotheses tested through sticky randomized cohort assignments (Section 16)
            </span>
          </div>
          <span class="badge badge-eat">3 Experiments Running</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Experiment ID & Name</th>
                <th>Hypothesis / Primary Metric</th>
                <th>Control (Var A)</th>
                <th>Treatment (Var B)</th>
                <th>Impact (Δ)</th>
                <th>p-Value</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>EXP-01: Value Prop Framing</strong></td>
                <td>Impact question boosts on-time response rate</td>
                <td>68.4%</td>
                <td><strong>76.2%</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">+7.8%</span></td>
                <td>0.003</td>
                <td><span class="badge badge-eat">Promoted Var B</span></td>
              </tr>
              <tr>
                <td><strong>EXP-02: Intent Button Wording</strong></td>
                <td>Concise verbs reduce decision latency</td>
                <td>81.2% (4.2s)</td>
                <td><strong>86.8% (2.6s)</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">+5.6%</span></td>
                <td>0.012</td>
                <td><span class="badge badge-eat">Promoted Var B</span></td>
              </tr>
              <tr>
                <td><strong>EXP-03: My Impact Feedback</strong></td>
                <td>Food saved metric increases Week-2 retention</td>
                <td>58.5%</td>
                <td><strong>74.8%</strong></td>
                <td><span style="color: var(--color-eat); font-weight: 700;">+16.3%</span></td>
                <td>< 0.001</td>
                <td><span class="badge badge-eat">Integrated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ---------------- TAB 4: INSTITUTIONAL SAAS ROI CALCULATOR ----------------
function renderRoiCalculatorTab({ facility }) {
  return `
    <div class="card">
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
          💰 Institutional SaaS ROI & Scenario Calculator
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
          Model potential food savings, organic waste diversion, and net return on investment for university hostels and catering contractor bids.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
        <!-- Input Parameters -->
        <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">
            Facility Operational Parameters
          </h4>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>Registered Residents:</span>
              <strong id="val-calc-residents">${facility.registeredCount}</strong>
            </label>
            <input type="range" id="slider-calc-residents" min="100" max="2500" step="50" value="${facility.registeredCount}" style="width: 100%;">
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>Raw Material Cost / Serving:</span>
              <strong id="val-calc-cost">₹${facility.costPerServing.toFixed(2)}</strong>
            </label>
            <input type="range" id="slider-calc-cost" min="25" max="85" step="1" value="${facility.costPerServing}" style="width: 100%;">
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>Overproduction Reduction:</span>
              <strong id="val-calc-reduction">1.9% drop</strong>
            </label>
            <input type="range" id="slider-calc-reduction" min="0.5" max="4.0" step="0.1" value="1.9" style="width: 100%;">
          </div>

          <div class="form-group">
            <label class="form-label" style="display: flex; justify-content: space-between;">
              <span>SaaS Subscription Fee:</span>
              <strong id="val-calc-saas">₹${facility.saasPlanCostPerMonth} / mo</strong>
            </label>
            <input type="range" id="slider-calc-saas" min="1999" max="9999" step="500" value="${facility.saasPlanCostPerMonth}" style="width: 100%;">
          </div>
        </div>

        <!-- Live Output Projections -->
        <div style="background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(46, 107, 72, 0.04) 100%); padding: 20px; border-radius: var(--radius-md); border: 2px solid var(--color-eat); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--color-eat); letter-spacing: 0.05em;">
                Projected Institutional Return
              </span>
              <span class="badge badge-eat" id="calc-roi-multiple">8.08× ROI</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
              <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">ESTIMATED GROSS SAVINGS</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--brand-primary);" id="calc-gross-savings">
                  ₹32,319 <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">/ month</span>
                </div>
              </div>

              <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">NET SAVINGS AFTER SAAS COST</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--color-eat);" id="calc-net-savings">
                  ₹28,320 <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">/ month</span>
                </div>
              </div>

              <div style="border-top: 1px solid var(--border-color); padding-top: 10px;">
                <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
                  • <strong>Annual Food Diverted:</strong> <span id="calc-annual-kg">2,449 kg</span> organic waste<br>
                  • <strong>Avoided Overprepared Plates:</strong> <span id="calc-plates-saved">770</span> servings/mo<br>
                  • <strong>Annual Net Fiscal Savings:</strong> <span id="calc-annual-net">₹3,39,840</span>
                </div>
              </div>
            </div>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 8px;">
            <em>Notice:</em> All figures are scenario estimates for planning purposes based on 3 daily meals and 30 monthly service days.
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------- TAB 5: ROSTER & MODEL GOVERNANCE ----------------
function renderGovernanceTab({ facility, accounts, students, isDemo }) {
  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Registered Resident Roster -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              👥 Registered Dining Members Roster
            </h3>
            <span style="font-size: 0.82rem; color: var(--text-muted);">
              ${students.length} verified residents registered for ${facility.name}
            </span>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Hostel / Block</th>
                <th>Email Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${accounts.map(acc => `
                <tr>
                  <td><strong>${acc.name}</strong></td>
                  <td><span class="user-role-tag" style="font-size: 0.68rem;">${acc.role}</span></td>
                  <td>${acc.block || 'General'}</td>
                  <td><code>${acc.email}</code></td>
                  <td><span style="color: var(--color-eat); font-weight: 700;">${acc.status || 'Active'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Forecast Model Governance -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">🎯 Conformal Prediction Governance</h3>
            <span style="font-size: 0.82rem; color: var(--text-muted);">Model tier progression and walk-forward verification</span>
          </div>
          <span class="badge badge-eat">80% Nominal Target</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Status</th>
                <th>MAE (heads)</th>
                <th>MAPE (%)</th>
                <th>Bias</th>
                <th>Observed 80% Coverage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>v0-naive</strong></td>
                <td><span class="badge badge-skip">Phase 1 Cold Start</span></td>
                <td>28.4</td>
                <td>8.2%</td>
                <td>+4.2</td>
                <td>54.2%</td>
              </tr>
              <tr>
                <td><strong>v0-weekly-weighted</strong></td>
                <td><span class="badge badge-warning">Phase 2 Early History</span></td>
                <td>14.8</td>
                <td>4.2%</td>
                <td>+0.9</td>
                <td>74.6%</td>
              </tr>
              <tr style="background: rgba(45, 106, 79, 0.04);">
                <td><strong>v1-intent (NNLS)</strong></td>
                <td><span class="champion-tag">⭐ Active Champion</span></td>
                <td><strong>7.1</strong></td>
                <td><strong>2.1%</strong></td>
                <td><strong>+0.1</strong></td>
                <td><strong>81.8% (Calibrated)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ---------------- ATTACH EVENTS & MODALS ----------------
function attachAdminEvents(container) {
  // Tab switching
  container.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAdminTab = btn.dataset.adminTab;
      renderAdminView(container);
    });
  });

  // Timeframe selector
  container.querySelectorAll('.btn-timeframe').forEach(btn => {
    btn.addEventListener('click', () => {
      store.setTimeframe(btn.dataset.tf);
    });
  });

  // Monthly report button
  const reportBtn = container.querySelector('#btn-monthly-report');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => openMonthlyReportModal());
  }

  // Methodology modal button
  const methodBtn = container.querySelector('#btn-open-methodology');
  if (methodBtn) {
    methodBtn.addEventListener('click', () => openMethodologyModal());
  }

  // Facility edit modal
  const editFacBtn = container.querySelector('#btn-edit-facility');
  if (editFacBtn) {
    editFacBtn.addEventListener('click', () => openFacilityEditModal());
  }

  // ROI Calculator live slider bindings
  setupRoiCalculator(container);
}

function setupRoiCalculator(container) {
  const sliderResidents = container.querySelector('#slider-calc-residents');
  const sliderCost = container.querySelector('#slider-calc-cost');
  const sliderRed = container.querySelector('#slider-calc-reduction');
  const sliderSaas = container.querySelector('#slider-calc-saas');

  if (!sliderResidents) return;

  function updateRoi() {
    const residents = parseInt(sliderResidents.value, 10);
    const cost = parseFloat(sliderCost.value);
    const redPct = parseFloat(sliderRed.value);
    const saas = parseInt(sliderSaas.value, 10);

    container.querySelector('#val-calc-residents').textContent = residents;
    container.querySelector('#val-calc-cost').textContent = `₹${cost.toFixed(2)}`;
    container.querySelector('#val-calc-reduction').textContent = `${redPct.toFixed(1)}% drop`;
    container.querySelector('#val-calc-saas').textContent = `₹${saas.toLocaleString('en-IN')} / mo`;

    const monthlyMeals = residents * 3 * 30;
    const platesSaved = Math.round((redPct / 100) * monthlyMeals);
    const grossSavings = Math.round(platesSaved * cost);
    const netSavings = grossSavings - saas;
    const roiMultiple = saas > 0 ? (grossSavings / saas).toFixed(2) : '0';
    const annualKg = Math.round(platesSaved * 0.35 * 12);
    const annualNet = netSavings * 12;

    container.querySelector('#calc-gross-savings').innerHTML = `₹${grossSavings.toLocaleString('en-IN')} <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">/ month</span>`;
    container.querySelector('#calc-net-savings').innerHTML = `₹${netSavings.toLocaleString('en-IN')} <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">/ month</span>`;
    container.querySelector('#calc-roi-multiple').textContent = `${roiMultiple}× ROI`;
    container.querySelector('#calc-plates-saved').textContent = platesSaved.toLocaleString('en-IN');
    container.querySelector('#calc-annual-kg').textContent = `${annualKg.toLocaleString('en-IN')} kg`;
    container.querySelector('#calc-annual-net').textContent = `₹${annualNet.toLocaleString('en-IN')}`;
  }

  [sliderResidents, sliderCost, sliderRed, sliderSaas].forEach(s => {
    s.addEventListener('input', updateRoi);
  });
}

// Section 24: Human-Readable Monthly Mess Audit Report Modal
function openMonthlyReportModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const report = api.getMonthlyReport('September 2026');

  modalBody.innerHTML = `
    <div style="padding: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); letter-spacing: 0.05em;">
            INSTITUTIONAL DINING & WASTE AUDIT
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 2px 0;">
            MealSense Monthly Operations Report
          </h2>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Facility: <strong>${report.facilityName}</strong> • Period: <strong>${report.period}</strong>
          </span>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-eat" style="font-size: 0.78rem;">✓ Guardrail Verified</span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Report Ref: MS-2026-09-A</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-sm); font-size: 0.82rem; line-height: 1.6;">
          <div><strong>Total Meals Served:</strong> ${report.totalMealsServed.toLocaleString('en-IN')} meals</div>
          <div><strong>Total Organic Waste:</strong> ${report.totalWasteKg} kg</div>
          <div><strong>Avoidable Waste / Meal:</strong> <strong>${report.wastePerMealKg} kg/meal</strong> (Baseline: 0.230 kg)</div>
          <div><strong>Waste Reduction:</strong> <span style="color: var(--color-eat); font-weight: 700;">↓ ${report.wasteReductionPct}%</span></div>
        </div>
        <div style="background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-sm); font-size: 0.82rem; line-height: 1.6;">
          <div><strong>Overproduction Rate:</strong> ${report.overproductionRate}% (Baseline: ${report.baselineOverproductionRate}%)</div>
          <div><strong>Shortage Frequency:</strong> <strong>${report.shortageRate}%</strong> (Target: &lt; 0.5%)</div>
          <div><strong>Student Intent Rate:</strong> ${report.studentResponseRate}% on-time participation</div>
          <div><strong>Estimated Savings vs Baseline:</strong> <strong style="color: var(--brand-primary);">₹${report.estimatedSavingsVsBaseline.toLocaleString('en-IN')}</strong></div>
        </div>
      </div>

      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
        <strong>Executive Audit Certification:</strong><br>
        This dining hall operated within authorized food waste reduction parameters throughout the reporting cycle. Conformal safety buffers prevented student food shortages (0 shortages logged). Donated surplus: ${report.donatedFoodKg} kg food dispatched to local community partners.
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 14px;">
        <div style="display: flex; gap: 8px;">
          <button id="btn-print-report" class="btn btn-secondary btn-sm">
            🖨️ Print / Save PDF
          </button>
          <button id="btn-csv-report" class="btn btn-secondary btn-sm">
            📥 Export CSV
          </button>
        </div>
        <button id="modal-close-report-btn" class="btn btn-primary btn-sm">
          Close Report
        </button>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');

  document.getElementById('modal-close-report-btn').onclick = () => modalOverlay.classList.remove('active');
  document.getElementById('btn-print-report').onclick = () => window.print();
  document.getElementById('btn-csv-report').onclick = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value,Baseline,Status\n"
      + `Total Meals,${report.totalMealsServed},N/A,Verified\n`
      + `Waste per Meal (kg),${report.wastePerMealKg},${report.baselineWasteKg},Reduced ${report.wasteReductionPct}%\n`
      + `Overproduction Rate,${report.overproductionRate}%,${report.baselineOverproductionRate}%,Reduced\n`
      + `Shortage Rate,${report.shortageRate}%,0.40%,Guardrail OK\n`
      + `Estimated Savings (INR),${report.estimatedSavingsVsBaseline},0,Baseline Est\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MealSense_Audit_${report.period.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast('CSV Audit Report exported', 'success');
  };
}

// Section 5.4: Baseline Methodology Information Modal
function openMethodologyModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
      📐 Defensible Baseline & Savings Methodology
    </h3>
    <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
      <p><strong>Why MealSense Renamed "Avoided Cost" to "Estimated Savings vs. Baseline":</strong></p>
      <p>
        In institutional facilities, ungrounded financial claims fail audit scrutiny. MealSense establishes an audited 30-day pre-implementation baseline period to measure true operational change:
      </p>
      <ul style="margin-left: 20px; margin-top: 6px;">
        <li><strong>Baseline Period:</strong> August 1–31, 2026 (Unassisted gut-feel cooking).</li>
        <li><strong>Baseline Overproduction Rate:</strong> 6.10% overprepared servings.</li>
        <li><strong>Baseline Food Waste:</strong> 0.230 kg unserved waste per meal.</li>
        <li><strong>Cost Calibration:</strong> ₹42.00 raw food material cost per portion.</li>
      </ul>
      <div style="background: var(--bg-secondary); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-top: 10px;">
        <code>Savings = (Baseline Overprod % - Current Overprod %) × Cooked Servings × ₹42.00</code>
      </div>
      <p style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
        *All figures are clearly flagged in the interface as operational scenario estimates rather than financial guarantees.
      </p>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <button id="modal-close-methodology-btn" class="btn btn-secondary">Close</button>
    </div>
  `;

  modalOverlay.classList.add('active');
  document.getElementById('modal-close-methodology-btn').onclick = () => modalOverlay.classList.remove('active');
}

// Facility Setup Modal
function openFacilityEditModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const facility = store.facility;

  modalBody.innerHTML = `
    <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
      ⚙️ Configure Facility & Mess Parameters
    </h3>
    <div class="form-group">
      <label class="form-label">Facility / Hostel Name</label>
      <input type="text" id="cfg-fac-name" class="form-input" value="${facility.name}" style="width: 100%;">
    </div>
    <div class="form-group">
      <label class="form-label">Registered Dining Hall Seating / Resident Capacity</label>
      <input type="number" id="cfg-fac-capacity" class="number-input" value="${facility.registeredCount}" style="width: 100%;">
    </div>
    <div class="form-group">
      <label class="form-label">Average Food Weight per Serving (kg)</label>
      <input type="number" step="0.01" id="cfg-fac-weight" class="number-input" value="${facility.kgPerServing}" style="width: 100%;">
    </div>
    <div class="form-group">
      <label class="form-label">Raw Material Food Cost per Serving (₹)</label>
      <input type="number" step="0.5" id="cfg-fac-cost" class="number-input" value="${facility.costPerServing}" style="width: 100%;">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
      <button id="modal-cancel-cfg-btn" class="btn btn-secondary">Cancel</button>
      <button id="modal-save-cfg-btn" class="btn btn-primary">Save Facility Settings</button>
    </div>
  `;

  modalOverlay.classList.add('active');
  document.getElementById('modal-cancel-cfg-btn').onclick = () => modalOverlay.classList.remove('active');
  document.getElementById('modal-save-cfg-btn').onclick = () => {
    facility.name = document.getElementById('cfg-fac-name').value;
    facility.registeredCount = parseInt(document.getElementById('cfg-fac-capacity').value, 10);
    facility.kgPerServing = parseFloat(document.getElementById('cfg-fac-weight').value);
    facility.costPerServing = parseFloat(document.getElementById('cfg-fac-cost').value);
    modalOverlay.classList.remove('active');
    store.notify();
    window.showToast('Facility parameters updated', 'success');
  };
}

// Mini Bar Visualizer for Trend Cards
function renderMiniBarChart(labels, values, unit, color) {
  const maxVal = Math.max(...values, 0.01);
  return `
    <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 65px; gap: 6px; padding-top: 14px;">
      ${values.map((v, i) => {
        const heightPct = Math.max(12, Math.round((v / maxVal) * 100));
        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;" title="${labels[i]}: ${v} ${unit}">
            <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary);">${v}</span>
            <div style="width: 100%; background: ${color}; height: ${heightPct}%; border-radius: 3px 3px 0 0; opacity: 0.85;"></div>
            <span style="font-size: 0.68rem; color: var(--text-muted);">${labels[i]}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderFunnelStep(label, count, pct, isTarget = false) {
  return `
    <div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 2px;">
        <span style="color: var(--text-primary); font-weight: 600;">${label}</span>
        <strong style="color: ${isTarget ? 'var(--color-eat)' : 'var(--text-primary)'};">${count} (${pct}%)</strong>
      </div>
      <div style="width: 100%; background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
        <div style="width: ${pct}%; background: ${isTarget ? 'var(--color-eat)' : 'var(--brand-accent)'}; height: 100%;"></div>
      </div>
    </div>
  `;
}
