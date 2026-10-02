# MealSense: Design System Decisions & Rationale

## 1. Visual Aesthetics & Palette Choice: Warm Linen & Espresso

MealSense purposefully rejects cold, clinical blue-and-gray enterprise software aesthetics. Institutional dining is deeply human, sensory, and communal.

### Color Palette Rationale
- **Linen Parchment Background (`#f6f3ed`)**: Soft, natural, reduces eye strain for students in dim dorm rooms and cooks in bright kitchen offices.
- **Deep Espresso Brown (`#2c1f17`)**: High-contrast, grounded typographic anchor that conveys craftsmanship, institutional stability, and warmth.
- **Toasted Terracotta & Caramel Accent (`#b85d38`, `#9c4b28`)**: Warm culinary tones reminiscent of roasted grains, tandoori clay, and comfort food.
- **Sage Olive (`#2e6b48`) & Gentle Crimson (`#b33927`)**: Organic functional status indicators for Eat/Skip, success, and guardrail alerts.

---

## 2. Decision-First Kitchen UX Architecture

### Problem
Traditional ERP software presents dense data tables requiring mental calculation to determine cooking quantities.

### Decision
- **Single Dominant Recommendation**: The top of the planning viewport is reserved for the primary decision:
  $$\mathbf{RECOMMENDED\ PREPARATION:\ 362\ SERVINGS}$$
- **Formula Transparency**: Plainly discloses how the number was calculated (`Turnout + Safety Buffer`).
- **Progressive Disclosure**: Model hyperparameters, historical MAE, and walk-forward backtest curves are placed in an expandable secondary accordion.

---

## 3. Student Intent Ergonomics

- **Thumb-Zone Accessibility**: On mobile viewports, the primary Eat and Skip buttons are sized $\ge 52\text{px}$ in height and placed within natural reach of one-handed thumb interaction.
- **Cognitive Load Minimization**: Meal cards feature prominent countdown badges, eliminating the need for mental time subtraction against cutoff deadlines.
- **Intrinsic Gamification**: "My Impact" introduces lightweight personal agency without punitive leaderboards or competitive stress.
