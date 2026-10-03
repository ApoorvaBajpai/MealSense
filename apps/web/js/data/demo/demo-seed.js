/**
 * MealSense Demo Seed Dataset
 * 
 * Features:
 * - 35+ days of operational dining history (~90+ meal services) spanning breakfast, lunch, and dinner.
 * - Realistic variance across weekdays and weekend departure drops on Friday dinner.
 * - Dish palatability differences (high-preference Paneer/Dal Makhani vs standard rotations).
 * - Calibrated prediction snapshots with 80% target prediction interval.
 * - Decisions with accepted recommendations and reasoned adjustments.
 * - Preserves specific IDs for guided evaluator tour (demo-today-lunch, demo-yesterday-lunch, demo-meal-d4-dinner).
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

  const meals = [];
  const intentCounts = {};
  const predictions = {};
  const kitchenDecisions = {};
  const outcomes = {};
  const studentResponses = [];

  // Menu rotation templates
  const MENUS = [
    { lunch: { name: 'Pindi Chole & Jeera Rice', items: ['Amritsari Chole', 'Jeera Rice', 'Aloo Palak', 'Tawa Roti', 'Boondi Raita'] },
      dinner: { name: 'Moong Dal Khichdi & Aloo Bhujia', items: ['Moong Dal Khichdi', 'Kadhi Pakora', 'Crispy Papad', 'Curd'] } },
    { lunch: { name: 'Rajma Masala & Steamed Rice', items: ['Punjabi Rajma', 'Steamed Rice', 'Bhindi Fry', 'Phulka', 'Salad'] },
      dinner: { name: 'Dal Tadka & Phulka Roti', items: ['Yellow Dal Tadka', 'Jeera Aloo', 'Steamed Rice', 'Phulka Roti'] } },
    { lunch: { name: 'Paneer Butter Masala Thali', items: ['Paneer Butter Masala', 'Dal Makhani', 'Peas Pulao', 'Butter Naan', 'Gulab Jamun'] },
      dinner: { name: 'Mix Veg Korma & Rice', items: ['Navratan Korma', 'Chana Dal', 'Steamed Rice', 'Phulka Roti'] } },
    { lunch: { name: 'Kashmiri Dum Aloo & Rice', items: ['Dum Aloo', 'Dal Tadka', 'Steamed Rice', 'Tawa Roti', 'Carrot Raita'] },
      dinner: { name: 'Aloo Gobi & Sambar Rice', items: ['Aloo Gobi Adraki', 'Mysore Rasam', 'Steamed Rice', 'Tawa Roti'] } },
    { lunch: { name: 'Chole Bhature Special', items: ['Chole Masala', 'Bhature', 'Jeera Pulao', 'Kachumber Salad'] },
      dinner: { name: 'Kadhi Chawal & Sukhi Sabzi', items: ['Punjabi Kadhi', 'Steamed Rice', 'Aloo Methi', 'Papad'] } },
    { lunch: { name: 'Kadai Paneer & Pulao', items: ['Kadai Paneer', 'Dal Fry', 'Veg Pulao', 'Tawa Roti', 'Cucumber Salad'] },
      dinner: { name: 'Khichdi & Chokha (Departure Dinner)', items: ['Bihari Khichdi', 'Aloo Chokha', 'Papad', 'Green Chutney'] } },
    { lunch: { name: 'South Indian Thali', items: ['Sambar', 'Rasam', 'Avial', 'Steamed Rice', 'Appalam', 'Payasam'] },
      dinner: { name: 'Paneer Bhurji & Paratha', items: ['Paneer Bhurji', 'Dal Fry', 'Tawa Paratha', 'Raita'] } }
  ];

  // Generate 35 days of history (Days -35 to -1)
  for (let offset = -35; offset <= -1; offset++) {
    const dateStr = getDateStr(offset);
    const dateParts = dateStr.split('-');
    const dayOfWeek = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])).getDay(); // 0 = Sun, 5 = Fri
    const menuIdx = Math.abs(offset) % MENUS.length;
    const menuSet = MENUS[menuIdx];

    // Determine IDs
    let lunchId = `demo-meal-d${Math.abs(offset)}-lunch`;
    let dinnerId = `demo-meal-d${Math.abs(offset)}-dinner`;

    if (offset === -1) {
      lunchId = 'demo-yesterday-lunch';
    } else if (offset === -4) {
      dinnerId = 'demo-meal-d4-dinner'; // Preserves storm error scenario
    }

    // --- LUNCH SERVICE ---
    const isPaneerLunch = menuSet.lunch.name.includes('Paneer');
    const baseLunchAttendance = isPaneerLunch ? 375 : 352;
    const lunchNoise = ((offset * 7) % 15) - 7;
    const actualLunch = Math.min(430, Math.max(310, baseLunchAttendance + lunchNoise));
    const predLunch = actualLunch + (((offset * 11) % 13) - 6); // MAE ~5-7
    const prepLunch = Math.min(440, predLunch + 12); // Buffer ~12
    const unservedLunchKg = Number((Math.max(0, (prepLunch - actualLunch) * 0.350 * 0.55)).toFixed(3));
    const uneatenLunchKg = Number((actualLunch * (isPaneerLunch ? 0.038 : 0.095)).toFixed(3));

    meals.push({
      id: lunchId,
      mealDate: dateStr,
      type: 'lunch',
      name: menuSet.lunch.name,
      items: menuSet.lunch.items,
      startsAt: `${dateStr}T12:30:00`,
      endsAt: `${dateStr}T14:30:00`,
      responseCutoff: `${dateStr}T10:00:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: offset % 5 === 0 ? 'skip' : 'eat',
      rating: isPaneerLunch ? 5 : 4
    });

    intentCounts[lunchId] = {
      mealId: lunchId,
      nEat: Math.round(actualLunch * 0.88),
      nSkip: 450 - Math.round(actualLunch * 0.88) - 22,
      nLate: 22
    };

    predictions[lunchId] = {
      id: `pred-${lunchId}`,
      mealId: lunchId,
      prediction: predLunch,
      lowerBound: predLunch - 14,
      upperBound: predLunch + 14,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      intervalTarget: 0.80,
      sampleCount: 70
    };

    kitchenDecisions[lunchId] = {
      mealId: lunchId,
      recommendedQuantity: predLunch + 14,
      selectedQuantity: prepLunch,
      adjustmentAmount: prepLunch - (predLunch + 14),
      adjustmentReason: prepLunch === predLunch + 14 ? 'accepted_recommendation' : 'buffer_caution',
      followedRecommendation: prepLunch === predLunch + 14,
      decidedBy: 'Chef Rajesh Kumar'
    };

    outcomes[lunchId] = {
      mealId: lunchId,
      actualCount: actualLunch,
      preparedServings: prepLunch,
      surplusDisposition: offset % 6 === 0 ? 'donated' : 'refrigerated',
      followedRecommendation: prepLunch === predLunch + 14,
      ranShort: false,
      unservedKg: unservedLunchKg,
      uneatenKg: uneatenLunchKg,
      donatedKg: offset % 6 === 0 ? 12.5 : 0,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: unservedLunchKg, donated: offset % 6 === 0 },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: uneatenLunchKg, donated: false }
      ]
    };

    studentResponses.push({
      mealId: lunchId,
      date: dateStr,
      response: offset % 5 === 0 ? 'skip' : 'eat',
      isLate: offset % 9 === 0
    });

    const isFridayDinner = dayOfWeek === 5;
    // Friday night has higher variance and lower attendance due to weekend home departures
    const fridayTurnoutPattern = [215, 285, 230, 290, 225];
    const fIdx = Math.floor(Math.abs(offset) / 7) % fridayTurnoutPattern.length;
    let actualDinner = isFridayDinner ? fridayTurnoutPattern[fIdx] : (335 + (((offset * 3) % 7) - 3));
    let predDinner = actualDinner + (((offset * 7) % 11) - 5);
    let prepDinner = predDinner + 10;
    let unservedDinnerKg = Number((Math.max(0, (prepDinner - actualDinner) * 0.350 * 0.50)).toFixed(3));
    let uneatenDinnerKg = Number((actualDinner * 0.088).toFixed(3));

    // Special Forecast Error Scenario on Day -4 Dinner (Storm)
    if (offset === -4) {
      predDinner = 340;
      prepDinner = 352;
      actualDinner = 325; // Moderate storm variance
      unservedDinnerKg = 9.450;
      uneatenDinnerKg = 4.800;
    }

    meals.push({
      id: dinnerId,
      mealDate: dateStr,
      type: 'dinner',
      name: isFridayDinner ? 'Khichdi & Chokha (Departure Service)' : menuSet.dinner.name,
      items: menuSet.dinner.items,
      startsAt: `${dateStr}T19:30:00`,
      endsAt: `${dateStr}T21:30:00`,
      responseCutoff: `${dateStr}T17:30:00`,
      status: 'closed',
      registeredSnapshot: 450,
      myResponse: isFridayDinner ? 'skip' : 'eat',
      rating: 4
    });

    intentCounts[dinnerId] = {
      mealId: dinnerId,
      nEat: Math.round(actualDinner * 0.85),
      nSkip: 450 - Math.round(actualDinner * 0.85) - 25,
      nLate: 25
    };

    predictions[dinnerId] = {
      id: `pred-${dinnerId}`,
      mealId: dinnerId,
      prediction: predDinner,
      lowerBound: predDinner - 14,
      upperBound: predDinner + 14,
      modelVersion: 'v1-intent',
      confidenceLevel: 0.80,
      intervalTarget: 0.80,
      sampleCount: 70
    };

    kitchenDecisions[dinnerId] = {
      mealId: dinnerId,
      recommendedQuantity: predDinner + 14,
      selectedQuantity: prepDinner,
      adjustmentAmount: prepDinner - (predDinner + 14),
      adjustmentReason: isFridayDinner ? 'weekend_departure_cushion' : 'accepted_recommendation',
      followedRecommendation: prepDinner === predDinner + 14,
      decidedBy: 'Chef Rajesh Kumar'
    };

    outcomes[dinnerId] = {
      mealId: dinnerId,
      actualCount: actualDinner,
      preparedServings: prepDinner,
      surplusDisposition: offset === -4 ? 'donated' : 'refrigerated',
      followedRecommendation: prepDinner === predDinner + 14,
      ranShort: false,
      unservedKg: unservedDinnerKg,
      uneatenKg: uneatenDinnerKg,
      donatedKg: offset === -4 ? 18.0 : 0,
      wasteRecords: [
        { wasteType: 'not_served', category: 'general', quantityKg: unservedDinnerKg, donated: offset === -4 },
        { wasteType: 'uneaten', category: 'plate_waste', quantityKg: uneatenDinnerKg, donated: false }
      ]
    };

    studentResponses.push({
      mealId: dinnerId,
      date: dateStr,
      response: isFridayDinner ? 'skip' : 'eat',
      isLate: false
    });
  }

  // --- DAY 0 (TODAY) ---
  // Today's Lunch: Active Published
  meals.push({
    id: 'demo-today-lunch',
    mealDate: getDateStr(0),
    type: 'lunch',
    name: 'Rajma Masala & Steamed Rice',
    items: ['Punjabi Rajma Masala', 'Steamed Basmati Rice', 'Jeera Aloo Sabzi', 'Tawa Roti', 'Boondi Raita', 'Cucumber Salad'],
    startsAt: `${getDateStr(0)}T12:30:00`,
    endsAt: `${getDateStr(0)}T14:30:00`,
    responseCutoff: `${getDateStr(0)}T10:30:00`,
    status: 'published',
    registeredSnapshot: 450,
    myResponse: 'eat',
    rating: null
  });

  intentCounts['demo-today-lunch'] = {
    mealId: 'demo-today-lunch',
    nEat: 312,
    nSkip: 88,
    nLate: 14
  };

  predictions['demo-today-lunch'] = {
    id: 'pred-demo-today-lunch',
    mealId: 'demo-today-lunch',
    prediction: 348,
    lowerBound: 334,
    upperBound: 362,
    modelVersion: 'v1-intent',
    confidenceLevel: 0.80,
    intervalTarget: 0.80,
    sampleCount: 70
  };

  kitchenDecisions['demo-today-lunch'] = {
    mealId: 'demo-today-lunch',
    recommendedQuantity: 362,
    selectedQuantity: 362,
    adjustmentAmount: 0,
    adjustmentReason: 'accepted_recommendation',
    followedRecommendation: true,
    decidedBy: 'Chef Rajesh Kumar'
  };

  // Today's Dinner: Active Published
  meals.push({
    id: 'demo-today-dinner',
    mealDate: getDateStr(0),
    type: 'dinner',
    name: 'Paneer Bhurji & Phulka Roti',
    items: ['Paneer Bhurji', 'Dal Tadka', 'Jeera Rice', 'Phulka Roti', 'Mixed Pickle'],
    startsAt: `${getDateStr(0)}T19:30:00`,
    endsAt: `${getDateStr(0)}T21:30:00`,
    responseCutoff: `${getDateStr(0)}T17:30:00`,
    status: 'published',
    registeredSnapshot: 450,
    myResponse: null,
    rating: null
  });

  intentCounts['demo-today-dinner'] = {
    mealId: 'demo-today-dinner',
    nEat: 285,
    nSkip: 95,
    nLate: 8
  };

  predictions['demo-today-dinner'] = {
    id: 'pred-demo-today-dinner',
    mealId: 'demo-today-dinner',
    prediction: 328,
    lowerBound: 314,
    upperBound: 342,
    modelVersion: 'v1-intent',
    confidenceLevel: 0.80,
    intervalTarget: 0.80,
    sampleCount: 70
  };

  // --- DAY +1 (TOMORROW) ---
  meals.push({
    id: 'demo-tomorrow-breakfast',
    mealDate: getDateStr(1),
    type: 'breakfast',
    name: 'Poha, Boiled Eggs & Chai',
    items: ['Indori Poha', 'Boiled Eggs / Sprouts', 'Green Chutney', 'Special Ginger Chai', 'Seasonal Banana'],
    startsAt: `${getDateStr(1)}T08:00:00`,
    endsAt: `${getDateStr(1)}T09:30:00`,
    responseCutoff: `${getDateStr(1)}T06:30:00`,
    status: 'scheduled',
    registeredSnapshot: 450,
    myResponse: null,
    rating: null
  });

  intentCounts['demo-tomorrow-breakfast'] = {
    mealId: 'demo-tomorrow-breakfast',
    nEat: 198,
    nSkip: 112,
    nLate: 4
  };

  predictions['demo-tomorrow-breakfast'] = {
    id: 'pred-demo-tomorrow-breakfast',
    mealId: 'demo-tomorrow-breakfast',
    prediction: 265,
    lowerBound: 250,
    upperBound: 280,
    modelVersion: 'v1-intent',
    confidenceLevel: 0.80,
    intervalTarget: 0.80,
    sampleCount: 70
  };

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
