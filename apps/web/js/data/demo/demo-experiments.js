/**
 * MealSense Demo Experiments Registry
 * Credibility Standard: Contains experiment designs and explicitly labeled simulated results.
 * Not real-world randomized trial claims.
 */

export const DEMO_EXPERIMENTS = [
  {
    id: 'exp-01-value-prop',
    name: 'Student Value Proposition Framing',
    hypothesis: 'Framing meal intent around collective waste reduction increases on-time response rates compared to transactional queries.',
    audience: 'All active resident students (morning notification & meal card header)',
    status: 'demo_simulation',
    primaryMetric: 'On-Time Intent Response Rate',
    guardrailMetric: 'Student Opt-Out / Mute Rate (< 1%)',
    sampleSizeTarget: 12000,
    mde: '5.0%',
    startAt: '2026-09-01T00:00:00Z',
    endAt: '2026-09-15T23:59:59Z',
    variants: [
      { id: 'A', name: 'Control (Transactional)', text: 'Will you eat lunch?' },
      { id: 'B', name: 'Treatment (Impact Framing)', text: 'Help your mess reduce food waste — will you eat lunch?' }
    ],
    activeVariant: 'B',
    decision: 'Demo decision: Treatment B selected for illustration',
    simulatedResult: {
      isRealData: false,
      status: 'Simulated',
      evidence: 'Synthetic benchmark',
      label: 'Simulated Demo Benchmark (Illustrative)',
      metric: 'On-Time Response Rate',
      sampleSize: 12420,
      variantAValue: 68.4,
      variantBValue: 76.2,
      delta: '+7.8 pp',
      confidenceInterval: '[+4.2%, +11.4%]',
      pValue: 0.003,
      analyzedAt: '2026-09-16T10:00:00Z',
      methodology: 'Simulated binomial proportions test over seeded cohort'
    }
  },
  {
    id: 'exp-02-button-wording',
    name: 'Intent Button Verbs & Decision Latency',
    hypothesis: 'Concise present-tense action verbs ("Eating" / "Not Eating") reduce decision latency compared to full phrases ("I\'ll Eat" / "I\'ll Skip").',
    audience: 'Mobile browser residents during morning peak rush (7:30 AM - 10:00 AM)',
    status: 'demo_simulation',
    primaryMetric: 'View-to-Response Conversion Rate',
    guardrailMetric: 'Response Change / Flip Frequency (< 8%)',
    sampleSizeTarget: 6000,
    mde: '3.0%',
    startAt: '2026-09-16T00:00:00Z',
    endAt: '2026-09-30T23:59:59Z',
    variants: [
      { id: 'A', name: 'Phrases', eat: "I'll Eat", skip: "I'll Skip" },
      { id: 'B', name: 'Active Verbs', eat: "Eating", skip: "Not Eating" }
    ],
    activeVariant: 'B',
    decision: 'Demo decision: Active Verbs selected for illustration',
    simulatedResult: {
      isRealData: false,
      status: 'Simulated',
      evidence: 'Synthetic benchmark',
      label: 'Simulated Demo Benchmark (Illustrative)',
      metric: 'View-to-Response Conversion Rate',
      sampleSize: 6240,
      variantAValue: 81.2,
      variantBValue: 86.8,
      delta: '+5.6 pp',
      medianLatencyA: '4.2s',
      medianLatencyB: '2.6s',
      confidenceInterval: '[+2.1%, +9.1%]',
      pValue: 0.012,
      analyzedAt: '2026-10-01T08:00:00Z',
      methodology: 'Simulated latency and click-through log analysis'
    }
  },
  {
    id: 'exp-03-impact-feedback',
    name: 'Personal Impact Feedback vs. 14-Day Retention',
    hypothesis: 'Providing visible "My Impact" metrics showing food saved increases weekly active intent consistency.',
    audience: 'Newly onboarded hostel residents',
    status: 'demo_simulation',
    primaryMetric: 'Week-2 Response Retention Rate',
    guardrailMetric: 'Forecast Bias Drift (± 1.5 heads)',
    sampleSizeTarget: 8000,
    mde: '8.0%',
    startAt: '2026-09-20T00:00:00Z',
    endAt: null,
    variants: [
      { id: 'A', name: 'Standard Meal Card Only', description: 'No personal impact card shown' },
      { id: 'B', name: 'Meal Card + My Impact Dashboard', description: 'Displays personal meals responded, skipped, and kg avoided' }
    ],
    activeVariant: 'B',
    decision: 'Demo decision: Monitored for illustration',
    simulatedResult: {
      isRealData: false,
      status: 'Simulated',
      evidence: 'Synthetic benchmark',
      label: 'Interim Simulated Benchmark (Illustrative)',
      metric: 'Week-2 Response Retention',
      sampleSize: 4120,
      variantAValue: 58.5,
      variantBValue: 74.8,
      delta: '+16.3 pp',
      confidenceInterval: '[+9.4%, +23.2%]',
      pValue: '<0.001',
      analyzedAt: '2026-10-02T12:00:00Z',
      methodology: 'Interim cohort survival calculation'
    }
  }
];
