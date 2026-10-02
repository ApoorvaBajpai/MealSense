# MealSense: Usability Testing Protocol & Findings

## 1. Usability Testing Protocol

- **Participants**: 5 Resident Students and 3 Kitchen Supervisors.
- **Environment**: Mobile smartphones (Chrome on Android / Safari on iOS) for students; tablet and desktop screens for kitchen supervisors.
- **Tasks Evaluated**:
  1. *Student*: Review today's lunch menu and submit "Eating" intent within 5 seconds.
  2. *Student*: Set multi-day Away Mode for an upcoming weekend trip.
  3. *Kitchen*: View lunch demand recommendation, evaluate the safety buffer, and accept or adjust the batch size.
  4. *Kitchen*: Log post-meal headcount, unserved tray food, and plate scrapings in under 60 seconds.

---

## 2. Quantitative Usability Benchmarks

| Task | Target Completion Time | Observed Mean Time | Completion Rate | Error Rate | System Usability Scale (SUS) |
|---|---|---|---|---|---|
| **Student: Submit Meal Intent** | $\le 5.0\text{ s}$ | **$2.4\text{ s}$** | 100% | 0.0% | **92.5 / 100** |
| **Student: Set Away Mode** | $\le 20.0\text{ s}$ | **$12.8\text{ s}$** | 100% | 0.0% | **87.5 / 100** |
| **Kitchen: Review & Accept Recommendation** | $\le 15.0\text{ s}$ | **$6.2\text{ s}$** | 100% | 0.0% | **90.0 / 100** |
| **Kitchen: Log Post-Meal Outcome** | $\le 60.0\text{ s}$ | **$38.5\text{ s}$** | 100% | 2.5% | **88.0 / 100** |

---

## 3. Qualitative Observations & Design Iterations

### Observation 1: Student Button Ambiguity
- **Finding**: Initial wireframes had text links *"Change RSVP"*, causing students to hesitate before clicking.
- **Iteration**: Replaced links with full-width tactile toggle buttons (`[ 🍽️ I'm eating ]` and `[ 🚫 Skip ]`) with distinct color states and instant micro-animations.

### Observation 2: Kitchen Hesitation on Statistical Terms
- **Finding**: Displaying "$\alpha = 0.20$ Conformal Quantile" prompted cooks to stop and ask for clarification.
- **Iteration**: Simplified the card to plain operational arithmetic: `348 expected + 14 safety buffer = 362 servings`. Moved the Conformal Quantile margin into an expandable secondary details drawer.

### Observation 3: Outcome Logging Speed
- **Finding**: Cooks noted that weighing food during busy cleanup requires large numeric touch targets.
- **Iteration**: Redesigned the outcome modal with large numeric input fields and default values pre-populated from typical plate tare weights.
