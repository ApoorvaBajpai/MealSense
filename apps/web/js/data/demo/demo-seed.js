/**
 * MealSense Demo Seed Dataset
 * Contains 10+ operational meals (8 closed past days with realized outcomes + today's lunch & dinner + tomorrow's breakfast),
 * prediction snapshots, kitchen decisions (accepted and overridden), and at least one forecast error scenario.
 */

export function createDemoSeed() {
  const today = new Date();
  
  function getDateStr(offsetDays) {
    const d = new Date(today.getTime() + offsetDays * 86400000);
    return d.toISOString().split('T')[0];
  }

  const facility = {
    id: 'demo-facility-ramanujan',
    name: 'Ramanujan Hall Dining Facility',
    timezone: 'Asia/Kolkata',
    registeredCount: 450,
    kgPerServing: 0.350,
    costPerServing: 42.00,
    mealsPerDay: 3,
    saasPlanCostPerMonth: 3999,
    provenance: 'demo_facility'
  };

  // 10 historical & active meals
  const meals = [
    // 7 Days Ago - Lunch (Normal weekday)
    {
      id: 'demo-meal-d7-lunch',
      mealDate: getDateStr(-7),
      type: 'lunch',
      name: 'Pindi Chole & Steamed Rice',
      items: ['Amritsari Pindi Chole', 'Jeera Basmati Rice', 'Aloo Palak', 'Tawa Roti', 'Boondi Raita', 'Cucumber Salad'],
      startsAt: `${getDateStr(-7)}T12:30:00`,
      endsAt: `${getDateStr(-7)}T14:30:00`,
      responseCutoff: `${getDateStr(-7)}T10:00:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 4,
    },
    // 6 Days Ago - Dinner (Light comfort)
    {
      id: 'demo-meal-d6-dinner',
      mealDate: getDateStr(-6),
      type: 'dinner',
      name: 'Moong Dal Khichdi & Aloo Bhujia',
      items: ['Moong Dal Khichdi', 'Kadhi Pakora', 'Crispy Papad', 'Mixed Pickle', 'Fresh Curd'],
      startsAt: `${getDateStr(-6)}T19:30:00`,
      endsAt: `${getDateStr(-6)}T21:30:00`,
      responseCutoff: `${getDateStr(-6)}T17:30:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 4,
    },
    // 5 Days Ago - Lunch (High turn-out favorite)
    {
      id: 'demo-meal-d5-lunch',
      mealDate: getDateStr(-5),
      type: 'lunch',
      name: 'Paneer Butter Masala Thali',
      items: ['Paneer Butter Masala', 'Dal Makhani', 'Peas Pulao', 'Butter Naan', 'Gulab Jamun'],
      startsAt: `${getDateStr(-5)}T12:30:00`,
      endsAt: `${getDateStr(-5)}T14:30:00`,
      responseCutoff: `${getDateStr(-5)}T10:00:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 5,
    },
    // 4 Days Ago - Dinner: FORECAST ERROR SCENARIO (Sudden heavy rain prevented students from walking to mess)
    {
      id: 'demo-meal-d4-dinner',
      mealDate: getDateStr(-4),
      type: 'dinner',
      name: 'Mix Veg Korma & Phulka',
      items: ['Navratan Korma', 'Yellow Dal Tadka', 'Steamed Rice', 'Phulka Roti', 'Green Salad'],
      startsAt: `${getDateStr(-4)}T19:30:00`,
      endsAt: `${getDateStr(-4)}T21:30:00`,
      responseCutoff: `${getDateStr(-4)}T17:30:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'skip',
      rating: 3,
    },
    // 3 Days Ago - Lunch (Standard weekday)
    {
      id: 'demo-meal-d3-lunch',
      mealDate: getDateStr(-3),
      type: 'lunch',
      name: 'Kashmiri Dum Aloo & Rice',
      items: ['Dum Aloo Kashmiri', 'Yellow Dal Fry', 'Steamed Rice', 'Tawa Roti', 'Carrot Raita'],
      startsAt: `${getDateStr(-3)}T12:30:00`,
      endsAt: `${getDateStr(-3)}T14:30:00`,
      responseCutoff: `${getDateStr(-3)}T10:00:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 4,
    },
    // 2 Days Ago - Dinner (Low variance)
    {
      id: 'demo-meal-d2-dinner',
      mealDate: getDateStr(-2),
      type: 'dinner',
      name: 'Egg Curry / Masala Paneer Dinner',
      items: ['Egg Curry / Shahi Paneer', 'Dal Tadka', 'Jeera Rice', 'Tawa Phulka', 'Fresh Curd'],
      startsAt: `${getDateStr(-2)}T19:30:00`,
      endsAt: `${getDateStr(-2)}T21:30:00`,
      responseCutoff: `${getDateStr(-2)}T17:30:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 4,
    },
    // Yesterday - Lunch (Closed yesterday, verified outcome)
    {
      id: 'demo-yesterday-lunch',
      mealDate: getDateStr(-1),
      type: 'lunch',
      name: 'Everyday Comfort Rajma & Rice',
      items: ['Rajma Masala', 'Steamed Basmati Rice', 'Aloo Gobi Dry', 'Phulka Roti', 'Green Salad'],
      startsAt: `${getDateStr(-1)}T12:30:00`,
      endsAt: `${getDateStr(-1)}T14:30:00`,
      responseCutoff: `${getDateStr(-1)}T10:00:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: 4,
    },
    // Today - Lunch (Active preparation, awaiting kitchen closure)
    {
      id: 'demo-today-lunch',
      mealDate: getDateStr(0),
      type: 'lunch',
      name: 'North Indian Deluxe Thali',
      items: ['Paneer Butter Masala', 'Dal Makhani', 'Jeera Rice', 'Tandoori Butter Roti', 'Boondi Raita', 'Gulab Jamun'],
      startsAt: `${getDateStr(0)}T12:30:00`,
      endsAt: `${getDateStr(0)}T14:30:00`,
      responseCutoff: new Date(Date.now() + 45 * 60000).toISOString(),
      status: 'published',
      registeredSnapshot: 450,
      myResponse: 'eat',
      rating: null,
    },
    // Today - Dinner (Upcoming today)
    {
      id: 'demo-today-dinner',
      mealDate: getDateStr(0),
      type: 'dinner',
      name: 'Homestyle Yellow Dal & Subzi',
      items: ['Yellow Dal Tadka', 'Seasonal Bhindi Masala', 'Steamed Rice', 'Tawa Phulka', 'Fresh Curd'],
      startsAt: `${getDateStr(0)}T19:30:00`,
      endsAt: `${getDateStr(0)}T21:30:00`,
      responseCutoff: `${getDateStr(0)}T17:30:00`,
      status: 'published',
      registeredSnapshot: 450,
      myResponse: null,
      rating: null,
    },
    // Tomorrow - Breakfast (Upcoming tomorrow)
    {
      id: 'demo-tomorrow-breakfast',
      mealDate: getDateStr(1),
      type: 'breakfast',
      name: 'South Indian Dosa & Idli Spread',
      items: ['Crispy Masala Dosa', 'Steamed Idli', 'Medu Vada', 'Fresh Coconut Chutney', 'Drumstick Sambar'],
      startsAt: `${getDateStr(1)}T07:30:00`,
      endsAt: `${getDateStr(1)}T09:30:00`,
      responseCutoff: `${getDateStr(1)}T05:30:00`,
      status: 'published',
      registeredSnapshot: 450,
      myResponse: null,
      rating: null,
    }
  ];

  // Intent Counts per meal
  const intentCounts = {
    'demo-meal-d7-lunch': { nEat: 338, nSkip: 58, nLate: 6 },
    'demo-meal-d6-dinner': { nEat: 310, nSkip: 64, nLate: 4 },
    'demo-meal-d5-lunch': { nEat: 382, nSkip: 32, nLate: 10 },
    'demo-meal-d4-dinner': { nEat: 295, nSkip: 72, nLate: 8 }, // Rain anomaly
    'demo-meal-d3-lunch': { nEat: 332, nSkip: 54, nLate: 5 },
    'demo-meal-d2-dinner': { nEat: 320, nSkip: 60, nLate: 4 },
    'demo-yesterday-lunch': { nEat: 342, nSkip: 63, nLate: 8 },
    'demo-today-lunch': { nEat: 318, nSkip: 52, nLate: 2 },
    'demo-today-dinner': { nEat: 265, nSkip: 42, nLate: 0 },
    'demo-tomorrow-breakfast': { nEat: 185, nSkip: 38, nLate: 0 },
  };

  // Prediction Snapshots (Conformal intervals & model versions)
  const predictions = {
    'demo-meal-d7-lunch': {
      id: 'pred-d7-l',
      mealId: 'demo-meal-d7-lunch',
      prediction: 342,
      lowerBound: 328,
      upperBound: 356,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 140,
      generatedAt: `${getDateStr(-7)}T10:05:00Z`
    },
    'demo-meal-d6-dinner': {
      id: 'pred-d6-d',
      mealId: 'demo-meal-d6-dinner',
      prediction: 315,
      lowerBound: 301,
      upperBound: 329,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 141,
      generatedAt: `${getDateStr(-6)}T17:35:00Z`
    },
    'demo-meal-d5-lunch': {
      id: 'pred-d5-l',
      mealId: 'demo-meal-d5-lunch',
      prediction: 388,
      lowerBound: 374,
      upperBound: 402,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 142,
      generatedAt: `${getDateStr(-5)}T10:05:00Z`
    },
    // Rain error scenario: predicted 308, but actual fell to 275 due to heavy torrential rain
    'demo-meal-d4-dinner': {
      id: 'pred-d4-d',
      mealId: 'demo-meal-d4-dinner',
      prediction: 308,
      lowerBound: 294,
      upperBound: 322,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 143,
      generatedAt: `${getDateStr(-4)}T17:35:00Z`
    },
    'demo-meal-d3-lunch': {
      id: 'pred-d3-l',
      mealId: 'demo-meal-d3-lunch',
      prediction: 336,
      lowerBound: 322,
      upperBound: 350,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 144,
      generatedAt: `${getDateStr(-3)}T10:05:00Z`
    },
    'demo-meal-d2-dinner': {
      id: 'pred-d2-d',
      mealId: 'demo-meal-d2-dinner',
      prediction: 324,
      lowerBound: 310,
      upperBound: 338,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 145,
      generatedAt: `${getDateStr(-2)}T17:35:00Z`
    },
    'demo-yesterday-lunch': {
      id: 'pred-y-l',
      mealId: 'demo-yesterday-lunch',
      prediction: 348,
      lowerBound: 334,
      upperBound: 362,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 146,
      generatedAt: `${getDateStr(-1)}T10:05:00Z`
    },
    'demo-today-lunch': {
      id: 'pred-t-l',
      mealId: 'demo-today-lunch',
      prediction: 348,
      lowerBound: 334,
      upperBound: 362,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 147,
      generatedAt: `${getDateStr(0)}T10:05:00Z`
    },
    'demo-today-dinner': {
      id: 'pred-t-d',
      mealId: 'demo-today-dinner',
      prediction: 295,
      lowerBound: 281,
      upperBound: 309,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      sampleCount: 147,
      generatedAt: `${getDateStr(0)}T17:35:00Z`
    },
    'demo-tomorrow-breakfast': {
      id: 'pred-tm-b',
      mealId: 'demo-tomorrow-breakfast',
      prediction: 215,
      lowerBound: 198,
      upperBound: 232,
      modelVersion: 'v0-weekly-weighted',
      confidenceLevel: 0.80,
      sampleCount: 147,
      generatedAt: `${getDateStr(1)}T05:35:00Z`
    }
  };

  // Kitchen Decisions (Recommended, selected, adjustment, reason)
  const kitchenDecisions = {
    'demo-meal-d7-lunch': {
      mealId: 'demo-meal-d7-lunch',
      recommendedQuantity: 356,
      selectedQuantity: 356,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-7)}T10:15:00`
    },
    'demo-meal-d6-dinner': {
      mealId: 'demo-meal-d6-dinner',
      recommendedQuantity: 325,
      selectedQuantity: 325,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-6)}T17:45:00`
    },
    // Special event: Chef adjusted +15 because of hostel sports meet
    'demo-meal-d5-lunch': {
      mealId: 'demo-meal-d5-lunch',
      recommendedQuantity: 395,
      selectedQuantity: 410,
      adjustmentAmount: 15,
      adjustmentReason: 'special_event',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-5)}T10:20:00`
    },
    // Rain day: Chef used recommendation
    'demo-meal-d4-dinner': {
      mealId: 'demo-meal-d4-dinner',
      recommendedQuantity: 318,
      selectedQuantity: 318,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-4)}T17:45:00`
    },
    'demo-meal-d3-lunch': {
      mealId: 'demo-meal-d3-lunch',
      recommendedQuantity: 350,
      selectedQuantity: 350,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-3)}T10:15:00`
    },
    'demo-meal-d2-dinner': {
      mealId: 'demo-meal-d2-dinner',
      recommendedQuantity: 334,
      selectedQuantity: 334,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-2)}T17:45:00`
    },
    'demo-yesterday-lunch': {
      mealId: 'demo-yesterday-lunch',
      recommendedQuantity: 355,
      selectedQuantity: 355,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(-1)}T10:15:00`
    },
    'demo-today-lunch': {
      mealId: 'demo-today-lunch',
      recommendedQuantity: 362,
      selectedQuantity: 362,
      adjustmentAmount: 0,
      adjustmentReason: 'accepted_recommendation',
      adjustedBy: 'Chef Rajesh Kumar',
      adjustedAt: `${getDateStr(0)}T09:30:00`
    }
  };

  // Realized Operational Outcomes for Closed Meals
  const outcomes = {
    'demo-meal-d7-lunch': {
      mealId: 'demo-meal-d7-lunch',
      actualCount: 344,
      preparedServings: 356,
      surplusDisposition: 'refrigerated',
      followedRecommendation: true,
      ranShort: false,
      unservedKg: 3.100,
      uneatenKg: 4.800,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 3.100, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 4.800, donated: false }
      ]
    },
    'demo-meal-d6-dinner': {
      mealId: 'demo-meal-d6-dinner',
      actualCount: 312,
      preparedServings: 325,
      surplusDisposition: 'refrigerated',
      followedRecommendation: true,
      ranShort: false,
      unservedKg: 3.200,
      uneatenKg: 3.900,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 3.200, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 3.900, donated: false }
      ]
    },
    'demo-meal-d5-lunch': {
      mealId: 'demo-meal-d5-lunch',
      actualCount: 402,
      preparedServings: 410,
      surplusDisposition: 'refrigerated',
      followedRecommendation: false,
      ranShort: false,
      unservedKg: 2.200,
      uneatenKg: 4.100,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 2.200, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 4.100, donated: false }
      ]
    },
    // Forecast Error Scenario: Torrential downpour caused turnout to fall to 275 heads (predicted 308, cooked 318)
    'demo-meal-d4-dinner': {
      mealId: 'demo-meal-d4-dinner',
      actualCount: 275,
      preparedServings: 318,
      surplusDisposition: 'donated', // Donated surplus to community
      followedRecommendation: true,
      ranShort: false,
      unservedKg: 11.200,
      uneatenKg: 3.500,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 11.200, donated: true }, // Donated!
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 3.500, donated: false }
      ]
    },
    'demo-meal-d3-lunch': {
      mealId: 'demo-meal-d3-lunch',
      actualCount: 338,
      preparedServings: 350,
      surplusDisposition: 'refrigerated',
      followedRecommendation: true,
      ranShort: false,
      unservedKg: 3.000,
      uneatenKg: 4.400,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 3.000, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 4.400, donated: false }
      ]
    },
    'demo-meal-d2-dinner': {
      mealId: 'demo-meal-d2-dinner',
      actualCount: 326,
      preparedServings: 334,
      surplusDisposition: 'refrigerated',
      followedRecommendation: true,
      ranShort: false,
      unservedKg: 2.100,
      uneatenKg: 4.200,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 2.100, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 4.200, donated: false }
      ]
    },
    'demo-yesterday-lunch': {
      mealId: 'demo-yesterday-lunch',
      actualCount: 345,
      preparedServings: 355,
      surplusDisposition: 'refrigerated',
      followedRecommendation: true,
      ranShort: false,
      unservedKg: 2.800,
      uneatenKg: 4.600,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: 2.800, donated: false },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: 4.600, donated: false }
      ]
    }
  };

  // Student specific response history (for Aarav Sharma)
  const studentResponses = [
    { mealId: 'demo-meal-d7-lunch', date: getDateStr(-7), response: 'eat', isLate: false },
    { mealId: 'demo-meal-d6-dinner', date: getDateStr(-6), response: 'eat', isLate: false },
    { mealId: 'demo-meal-d5-lunch', date: getDateStr(-5), response: 'eat', isLate: false },
    { mealId: 'demo-meal-d4-dinner', date: getDateStr(-4), response: 'skip', isLate: false },
    { mealId: 'demo-meal-d3-lunch', date: getDateStr(-3), response: 'eat', isLate: false },
    { mealId: 'demo-meal-d2-dinner', date: getDateStr(-2), response: 'eat', isLate: false },
    { mealId: 'demo-yesterday-lunch', date: getDateStr(-1), response: 'eat', isLate: false },
    { mealId: 'demo-today-lunch', date: getDateStr(0), response: 'eat', isLate: false },
  ];

  const auditLogs = [
    { id: 1, action: 'PUBLISH_MEAL', table: 'meals', rowId: 'demo-today-lunch', actor: 'Chef Rajesh Kumar', time: 'Today 07:30' },
    { id: 2, action: 'UPDATE_INTENT', table: 'meal_intent_counts', rowId: 'demo-today-lunch', actor: 'System Trigger', time: 'Today 10:14' },
    { id: 3, action: 'ACCEPT_RECOMMENDATION', table: 'kitchen_decisions', rowId: 'demo-today-lunch', actor: 'Chef Rajesh Kumar', time: 'Today 09:30' },
    { id: 4, action: 'RECORD_OUTCOMES', table: 'meal_outcomes', rowId: 'demo-yesterday-lunch', actor: 'Chef Rajesh Kumar', time: 'Yesterday 15:00' },
  ];

  return {
    facility,
    meals,
    intentCounts,
    predictions,
    kitchenDecisions,
    outcomes,
    studentResponses,
    auditLogs
  };
}
