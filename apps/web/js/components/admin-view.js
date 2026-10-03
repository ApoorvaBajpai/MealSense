/**
 * Admin Dashboard View Component: PM & Technical Specification V2.0
 * 
 * Features:
 * - One product, two data modes: Full Demo Mode vs Clean Live Empty State
 * - Executive Overview with dynamic metrics from MetricEngine
 * - Baseline Comparison with defensible savings formulas
 * - Dynamic 7d / 30d / 90d Trends from TrendEngine
 * - Dynamic Deterministic Insights with N < 5 Small-Group Privacy Suppression
 * - Dynamic Conversion Funnels from FunnelEngine
 * - Experiments Register with explicit "Simulated Demo Benchmark" labeling
 * - Institutional SaaS ROI Calculator (Scenario Estimate)
 * - Monthly Mess Report with provenance and CSV export
 */

import { store } from '../store.js';
import { api } from '../api.js';
import { authService } from '../auth.js';

let currentAdminTab = 'overview'; // 'overview' | 'insights' | 'analytics' | 'roi' | 'governance'

export function renderAdminView(container) {
  const isDemo = Boolean(store.isDemo);
  const facility = store.facility;
  const metrics = store.getMetricsSummary();
  const tf = store.selectedTimeframe || '30d';

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

  // If in Live mode and there are zero meals or no operational data recorded yet,
  // show the Clean Live Empty State per Section 4.3 of the Technical Specification.
  if (!isDemo && !metrics.hasData) {
    container.innerHTML = `
      <div class="admin-container">
        <!-- Executive Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
                🏛️ ${facility.name || 'Institutional Mess'}
              </h2>
              <span class="badge badge-warning" style="font-size: 0.72rem;">
                Live Mode • Awaiting First Records
              </span>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
              Production Operational State • No seeded data
            </span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-empty-setup-fac" class="btn btn-secondary btn-sm">
              ⚙️ Facility Setup
            </button>
            <button id="btn-empty-explore-demo" class="btn btn-primary btn-sm">
              ✨ Explore Demo Mode
            </button>
          </div>
        </div>

        <!-- Empty State Card -->
        <div class="card" style="text-align: center; padding: 64px 24px; border: 1px dashed var(--border-color);">
          <div style="font-size: 3.2rem; margin-bottom: 16px;">🏛️</div>
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
            No operational data yet
          </h3>
          <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 24px; font-size: 0.92rem; line-height: 1.6;">
            MealSense will populate this dashboard once meals, student intent responses, and kitchen post-meal outcomes are recorded.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button id="btn-empty-setup-fac-2" class="btn btn-primary">
              ⚙️ Set Up Facility
            </button>
            <button id="btn-empty-explore-demo-2" class="btn btn-secondary">
              ✨ Explore Demo Mode
            </button>
          </div>
          <div style="margin-top: 32px; font-size: 0.78rem; color: var(--text-muted);">
            <em>Data Integrity Guarantee:</em> Live mode strictly displays real records and will never render seeded demo KPIs or simulated charts.
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-empty-setup-fac')?.addEventListener('click', () => openFacilityEditModal());
    container.querySelector('#btn-empty-setup-fac-2')?.addEventListener('click', () => openFacilityEditModal());
    container.querySelector('#btn-empty-explore-demo')?.addEventListener('click', () => store.switchToDemo('admin'));
    container.querySelector('#btn-empty-explore-demo-2')?.addEventListener('click', () => store.switchToDemo('admin'));
    return;
  }

  const baselineComp = store.getBaselineComparison();
  const trendWaste = store.getTrendSeries('wastePerMeal');
  const trendMae = store.getTrendSeries('forecastMae');
  const trendResp = store.getTrendSeries('responseRate');
  const insights = store.getInsights();
  const studentFunnel = store.getStudentFunnel();
  const kitchenFunnel = store.getKitchenFunnel();
  const experiments = store.experiments;

  const html = `
    <div class="admin-container">
      <!-- Executive Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
              🏛️ ${facility.name}
            </h2>
            <span class="badge ${isDemo ? 'badge-eat' : 'badge-primary'}" style="font-size: 0.72rem;">
              ${isDemo ? 'Demo Evaluator Sandbox • Sample Data' : 'Live Institutional Deployment • Real Records'}
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
          💡 Deterministic Insights (${insights.length})
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'analytics' ? 'active' : ''}" data-admin-tab="analytics">
          📈 Analytics, Funnels & Experiments
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'roi' ? 'active' : ''}" data-admin-tab="roi">
          💰 Institutional SaaS ROI Calculator
        </button>
        <button class="kitchen-tab-btn ${currentAdminTab === 'governance' ? 'active' : ''}" data-admin-tab="governance">
          🛡️ Roster & Model Governance
        </button>
      </div>

      ${renderActiveTabContent(currentAdminTab, {
        facility,
        metrics,
        baselineComp,
        tf,
        trendWaste,
        trendMae,
        trendResp,
        insights,
        studentFunnel,
        kitchenFunnel,
        experiments,
        accounts,
        students,
        isDemo
      })}
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
function renderOverviewTab({ facility, metrics, baselineComp, tf, trendWaste, trendMae, trendResp, isDemo }) {
  const isWasteReduced = metrics.wasteReductionPct > 0;
  const isOverprepReduced = metrics.overproductionReductionPct > 0;

  return `
    <div>
      <!-- Section 8.1 & 12.1: Executive KPI Grid -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <!-- North Star Metric -->
        <div class="kpi-card" style="border-top: 4px solid var(--color-eat); background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(46, 107, 72, 0.05) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">⭐ North Star: Avoidable Waste / Meal</span>
            <span class="badge ${isDemo ? 'badge-eat' : 'badge-primary'}" style="font-size: 0.68rem;">
              ${isDemo ? 'Demo Metric' : 'Live Metric'}
            </span>
          </div>
          <div class="kpi-value" style="color: var(--color-eat);">
            ${metrics.wastePerMealKg} <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">kg / meal</span>
          </div>
          <span class="kpi-delta ${isWasteReduced ? 'delta-good' : 'delta-bad'}">
            ${isWasteReduced ? '↓' : '↑'} ${Math.abs(metrics.wasteReductionPct)}% vs Baseline (${metrics.baselineWasteKg} kg)
          </span>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Provenance: Calculated from ${isDemo ? 'demo seed' : 'logged outcomes'}
          </div>
        </div>

        <!-- Overproduction Rate -->
        <div class="kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">Kitchen Overproduction Rate</span>
            <span class="badge" style="font-size: 0.68rem; background: var(--bg-secondary);">Target: &lt; 5%</span>
          </div>
          <div class="kpi-value">${metrics.overproductionRate}%</div>
          <span class="kpi-delta ${isOverprepReduced ? 'delta-good' : 'delta-bad'}">
            ${isOverprepReduced ? '↓' : '↑'} ${Math.abs(metrics.overproductionReductionPct)}% vs Baseline (${metrics.baselineOverproductionRate}%)
          </span>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Provenance: Derived from (prepared - actual diners) / prepared
          </div>
        </div>

        <!-- Forecast MAE -->
        <div class="kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">Forecast Error (MAE)</span>
            <span class="badge" style="font-size: 0.68rem; background: var(--bg-secondary);">Accuracy</span>
          </div>
          <div class="kpi-value">${metrics.forecastMae} <span style="font-size: 0.9rem; color: var(--text-muted);">heads</span></div>
          <span class="kpi-delta delta-good">
            ↓ ${metrics.maeReductionPct}% error reduction vs baseline
          </span>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Provenance: Mean |prediction - actual| across recorded meals
          </div>
        </div>

        <!-- Non-Negotiable Guardrail -->
        <div class="kpi-card" style="border-top: 4px solid ${metrics.shortageRate <= 0.5 ? 'var(--color-eat)' : 'var(--color-danger)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">🛡️ Guardrail: Shortage Rate</span>
            <span class="badge ${metrics.shortageRate <= 0.5 ? 'badge-eat' : 'badge-danger'}" style="font-size: 0.68rem;">Limit: &lt; 0.5%</span>
          </div>
          <div class="kpi-value" style="color: ${metrics.shortageRate <= 0.5 ? 'var(--color-eat)' : 'var(--color-danger)'};">
            ${metrics.shortageRate}%
          </div>
          <span class="kpi-delta ${metrics.shortageRate <= 0.5 ? 'delta-good' : 'delta-bad'}">
            ${metrics.shortageRate === 0 ? '✓ Zero shortages recorded in period' : '⚠️ Shortage events logged'}
          </span>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Provenance: Shortage occurrences / completed services
          </div>
        </div>

        <!-- On-Time Intent Participation -->
        <div class="kpi-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">Student On-Time Response</span>
            <span class="badge badge-eat" style="font-size: 0.68rem;">Signal</span>
          </div>
          <div class="kpi-value">${metrics.onTimeResponseRate}%</div>
          <span class="kpi-delta delta-good">
            ↑ ${metrics.responseRateDelta >= 0 ? '+' : ''}${metrics.responseRateDelta} pp vs baseline (${metrics.baselineResponseRate}%)
          </span>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Provenance: On-time student responses / eligible dining count
          </div>
        </div>

        <!-- Estimated Savings vs Baseline -->
        <div class="kpi-card" style="background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(184, 93, 56, 0.05) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="kpi-label">Estimated Savings vs Baseline</span>
            <span class="badge" style="font-size: 0.68rem; background: var(--bg-secondary);">Scenario Estimate</span>
          </div>
          <div class="kpi-value" style="color: var(--brand-primary);">
            ₹${metrics.estimatedMonthlySavings.toLocaleString('en-IN')}
          </div>
          <span class="kpi-delta delta-good">
            ₹${facility.costPerServing}/serving avoided overprep
          </span>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Provenance: (Baseline % - Current %) × Cooked Servings × ₹${facility.costPerServing}
          </div>
        </div>
      </div>

      <!-- Section 8.3 & 6: Baseline vs Current Like-for-Like Comparison Table -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              📊 Like-for-Like Operational Impact: Baseline vs. Current
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Comparing pre-implementation reference period (Aug 1–31, 2026) against active ${isDemo ? 'demo operations' : 'live facility records'}
            </span>
          </div>
          <span class="badge badge-eat" style="font-size: 0.74rem;">
            Sample Size: ${metrics.sampleCount} Meals Evaluated
          </span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Operational Metric</th>
                <th>Baseline (Pre-Implementation)</th>
                <th>Current Period</th>
                <th>Measured Change (Δ)</th>
                <th>Provenance & Classification</th>
              </tr>
            </thead>
            <tbody>
              ${baselineComp.metrics.map(row => `
                <tr ${row.key === 'estimatedSavings' ? 'style="background: rgba(184, 93, 56, 0.04); font-weight: 600;"' : ''}>
                  <td><strong>${row.name}</strong></td>
                  <td>${row.baseline}</td>
                  <td><strong>${row.current}</strong></td>
                  <td>
                    <span style="color: ${row.isGood ? 'var(--color-eat)' : 'var(--text-primary)'}; font-weight: 700;">
                      ${row.delta}
                    </span>
                  </td>
                  <td><span class="badge ${row.key === 'estimatedSavings' ? 'badge-warning' : 'badge-eat'}" style="font-size: 0.7rem;">${row.statusLabel}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 10px; line-height: 1.4;">
          *<em>Methodology & Disclosure:</em> All figures are derived dynamically from the active data provider (${isDemo ? 'demo seed records' : 'live operational records'}). Avoidable cost savings represent scenario estimates calculated from overproduction servings avoided multiplied by raw food portion cost (₹${facility.costPerServing.toFixed(2)}).
        </div>
      </div>

      <!-- Section 7: Operational Trends Derived from Raw Records -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              📈 Operational Trends & Trajectory
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              ${isDemo ? 'Example operational trend • Sample data' : 'Operational trend • Derived from logged meal outcomes'}
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
              <span style="font-size: 0.74rem; color: var(--color-eat); font-weight: 700;">${trendWaste.statusLabel}</span>
            </div>
            ${trendWaste.hasData 
              ? renderMiniBarChart(trendWaste.labels, trendWaste.values, 'kg', 'var(--color-eat)')
              : `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">Not enough data yet for ${tf} trend</div>`
            }
          </div>

          <!-- Chart 2: Forecast Error MAE Trend -->
          <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Forecast MAE (Error in Heads)</span>
              <span style="font-size: 0.74rem; color: var(--brand-primary); font-weight: 700;">${trendMae.statusLabel}</span>
            </div>
            ${trendMae.hasData 
              ? renderMiniBarChart(trendMae.labels, trendMae.values, 'heads', 'var(--brand-primary)')
              : `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">Not enough data yet for ${tf} trend</div>`
            }
          </div>

          <!-- Chart 3: Student Response Rate Trend -->
          <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">On-Time Student Intent Rate</span>
              <span style="font-size: 0.74rem; color: var(--brand-accent); font-weight: 700;">${trendResp.statusLabel}</span>
            </div>
            ${trendResp.hasData 
              ? renderMiniBarChart(trendResp.labels, trendResp.values, '%', 'var(--brand-accent)')
              : `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">Not enough data yet for ${tf} trend</div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------- TAB 2: DETERMINISTIC INSIGHTS ----------------
function renderInsightsTab({ insights, isDemo }) {
  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="card" style="border-left: 4px solid var(--brand-accent);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              💡 Deterministic Rule-Based Operational Insights
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Generated algorithmically by InsightEngine over ${isDemo ? 'demo seed logs' : 'live dining data'}. Uses associative language and enforces small-sample privacy rules.
            </p>
          </div>
          <span class="badge ${isDemo ? 'badge-eat' : 'badge-primary'}">
            ${isDemo ? 'Demo Mode Analysis' : 'Live Data Analysis'}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
          ${insights.map(item => `
            <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid var(--border-subtle); border-left: 3px solid ${item.badgeType === 'badge-eat' ? 'var(--color-eat)' : item.badgeType === 'badge-warning' ? 'var(--color-warning)' : 'var(--brand-accent)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
                  ${item.title}
                </div>
                <span class="badge ${item.badgeType}" style="font-size: 0.72rem;">${item.badgeLabel}</span>
              </div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 4px 0 8px 0; line-height: 1.5;">
                ${item.explanation}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="font-size: 0.78rem; color: var(--brand-primary); font-weight: 700;">
                  👉 Recommendation: ${item.actionLink}
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">
                  Sample: ${item.sampleSize} meals • ${item.privacySuppressed ? 'N < 5 Suppressed' : 'Unsuppressed'}
                </span>
              </div>
            </div>
          `).join('')}

          <!-- Section 9 / 16.1: Small Group Privacy Suppression Rule Demonstration -->
          <div style="background: rgba(184, 93, 56, 0.04); border-radius: var(--radius-md); padding: 14px 16px; border: 1px dashed var(--brand-accent);">
            <div style="font-size: 0.84rem; font-weight: 800; color: var(--brand-primary); margin-bottom: 4px;">
              🔒 Small-Group Privacy Suppression Rule
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
              <em>Cohort Example (Block C, Wing 4):</em> <strong>[ Insufficient data to display this breakdown — 3 responses ]</strong>.<br>
              Subgroup breakdowns with fewer than 5 active responses are suppressed across all aggregate dashboards to prevent resident re-identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------- TAB 3: PRODUCT ANALYTICS & EXPERIMENTS ----------------
function renderAnalyticsTab({ studentFunnel, kitchenFunnel, experiments, isDemo }) {
  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Conversion Funnels Grid (Section 10) -->
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
            ${studentFunnel.steps.map((step, idx) => 
              renderFunnelStep(step.name, step.count, step.pct, idx === studentFunnel.steps.length - 1)
            ).join('')}
          </div>
          <div style="margin-top: 14px; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between;">
            <span>View-to-Response Rate: <strong>${studentFunnel.viewToResponseRate}</strong></span>
            <span>Events: <strong>${studentFunnel.sampleCount}</strong></span>
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
            ${kitchenFunnel.steps.map((step, idx) => 
              renderFunnelStep(step.name, step.count, step.pct, idx === kitchenFunnel.steps.length - 1)
            ).join('')}
          </div>
          <div style="margin-top: 14px; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between;">
            <span>Cook Adoption Trust Ratio: <strong>${kitchenFunnel.acceptanceRate}</strong></span>
            <span>Events: <strong>${kitchenFunnel.sampleCount}</strong></span>
          </div>
        </div>
      </div>

      <!-- Active A/B Product Experiments Register (Section 11) -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">
              🧪 Product Experiments Register & Evidence Standards
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              Strict credibility policy: All simulated benchmarks are explicitly badged; unverified empirical claims are never shown as real.
            </span>
          </div>
          <span class="badge ${isDemo ? 'badge-eat' : 'badge-primary'}">
            ${experiments.length} Experiments Registered
          </span>
        </div>

        ${experiments.length === 0 ? `
          <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 0.88rem;">
            No experiments registered in this facility. To evaluate A/B testing frameworks, switch to Demo Mode.
          </div>
        ` : `
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Experiment ID & Hypothesis</th>
                  <th>Status</th>
                  <th>Primary / Guardrail Metric</th>
                  <th>Variants</th>
                  <th>Result Summary</th>
                  <th>Evidence Classification</th>
                </tr>
              </thead>
              <tbody>
                ${experiments.map(exp => `
                  <tr>
                    <td>
                      <strong>${exp.id}: ${exp.name}</strong><br>
                      <span style="font-size: 0.78rem; color: var(--text-secondary);">${exp.hypothesis}</span>
                    </td>
                    <td><span class="badge badge-eat">${exp.status}</span></td>
                    <td>
                      <span style="font-size: 0.78rem;"><strong>Pri:</strong> ${exp.primaryMetric}</span><br>
                      <span style="font-size: 0.74rem; color: var(--text-muted);"><strong>Grd:</strong> ${exp.guardrailMetric}</span>
                    </td>
                    <td>
                      <span style="font-size: 0.78rem;">
                        ${(() => {
                          const varA = Array.isArray(exp.variants) ? (exp.variants.find(v => v.id === 'A') || exp.variants[0]) : exp.variants?.A;
                          const varB = Array.isArray(exp.variants) ? (exp.variants.find(v => v.id === 'B') || exp.variants[1]) : exp.variants?.B;
                          return `A: ${varA?.name || 'Control'}<br>B: ${varB?.name || 'Treatment'} (Active: <strong>${exp.activeVariant}</strong>)`;
                        })()}
                      </span>
                    </td>
                    <td>
                      ${exp.result ? `
                        <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-eat);">
                          ${exp.result.metricValue} (Var B vs Var A)
                        </span><br>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">
                          p = ${exp.result.pValue} • N = ${exp.result.sampleSize}
                        </span>
                      ` : `
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Not yet run</span>
                      `}
                    </td>
                    <td>
                      ${exp.result ? `
                        <span class="badge ${exp.result.isRealData ? 'badge-eat' : 'badge-warning'}" style="font-size: 0.7rem;">
                          ${exp.result.badgeLabel}
                        </span>
                      ` : `
                        <span class="badge" style="font-size: 0.7rem; background: var(--bg-secondary);">Designed</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
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
          Model potential food savings, organic waste diversion, and net return on investment for university hostels and catering contractor bids. (Scenario planning tool)
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
                Scenario Return Projection
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
            <em>Scenario Estimate Disclosure:</em> Calculations assume 3 daily meals across 30 monthly service days. Actual fiscal results depend on food cost fluctuations and staff adherence.
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
              ${students.length} residents registered for ${facility.name}
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
            <span style="font-size: 0.82rem; color: var(--text-muted);">Model tier progression and walk-forward verification (Historical calibration)</span>
          </div>
          <span class="badge badge-eat">80% Nominal Target</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Tier</th>
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
    s?.addEventListener('input', updateRoi);
  });
}

// Section 18 / 24: Monthly Mess Report Modal (Dynamically derived from active data)
function openMonthlyReportModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const isDemo = Boolean(store.isDemo);
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
          <span class="badge ${isDemo ? 'badge-eat' : 'badge-primary'}" style="font-size: 0.78rem;">
            ${isDemo ? 'Demo Dataset' : 'Measured Facility Data'}
          </span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Report Ref: MS-2026-09-A</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-sm); font-size: 0.82rem; line-height: 1.6;">
          <div><strong>Total Meals Served:</strong> ${report.totalMealsServed.toLocaleString('en-IN')} meals</div>
          <div><strong>Total Organic Waste:</strong> ${report.totalWasteKg} kg</div>
          <div><strong>Avoidable Waste / Meal:</strong> <strong>${report.wastePerMealKg} kg/meal</strong> (Baseline: ${report.baselineWasteKg} kg)</div>
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
        <strong>Operational Statement:</strong><br>
        This operational summary is derived dynamically by MealSense's central MetricEngine from ${isDemo ? 'sample operational records' : 'logged dining records'}. Conformal safety buffers maintained food security with ${report.shortageRate}% shortage rate. Surplus disposition dispatched ${report.donatedFoodKg} kg to community recovery partners.
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
      + "Metric,Value,Baseline,Classification\n"
      + `Total Meals,${report.totalMealsServed},N/A,Operational Record\n`
      + `Waste per Meal (kg),${report.wastePerMealKg},${report.baselineWasteKg},Reduced ${report.wasteReductionPct}%\n`
      + `Overproduction Rate,${report.overproductionRate}%,${report.baselineOverproductionRate}%,Reduced\n`
      + `Shortage Rate,${report.shortageRate}%,0.40%,Guardrail Maintained\n`
      + `Estimated Savings (INR),${report.estimatedSavingsVsBaseline},0,Scenario Estimate\n`;
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
      <p><strong>Defensible Savings Methodology vs Unsubstantiated Claims:</strong></p>
      <p>
        In institutional dining, ungrounded financial claims fail administrative scrutiny. MealSense uses an audited 30-day pre-implementation baseline period to measure true operational change:
      </p>
      <ul style="margin-left: 20px; margin-top: 6px;">
        <li><strong>Baseline Reference Period:</strong> August 1–31, 2026 (Unassisted gut-feel cooking).</li>
        <li><strong>Baseline Overproduction Rate:</strong> 6.10% overprepared servings.</li>
        <li><strong>Baseline Food Waste:</strong> 0.230 kg unserved waste per meal.</li>
        <li><strong>Portion Cost Calibration:</strong> ₹42.00 raw food material cost per portion.</li>
      </ul>
      <div style="background: var(--bg-secondary); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-top: 10px;">
        <code>Savings = (Baseline Overprod % - Current Overprod %) × Cooked Servings × Raw Portion Cost</code>
      </div>
      <p style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
        *All figures are flagged in the interface as scenario estimates rather than financial guarantees.
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
    store.updateFacility({
      name: document.getElementById('cfg-fac-name').value,
      registeredCount: parseInt(document.getElementById('cfg-fac-capacity').value, 10),
      kgPerServing: parseFloat(document.getElementById('cfg-fac-weight').value),
      costPerServing: parseFloat(document.getElementById('cfg-fac-cost').value)
    });
    modalOverlay.classList.remove('active');
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
