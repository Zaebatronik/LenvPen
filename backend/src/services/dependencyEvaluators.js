/**
 * Dependency Outcome Evaluators
 * 
 * Evaluates daily dependency reports and returns outcome:
 * - FULL_WIN: Complete success
 * - PARTIAL_WIN: Improvement but not perfect
 * - FAIL: No improvement or worse
 * - CRITICAL_FAIL: Dangerous level requiring intervention
 */

const OUTCOMES = {
  FULL_WIN: 'FULL_WIN',
  PARTIAL_WIN: 'PARTIAL_WIN',
  FAIL: 'FAIL',
  CRITICAL_FAIL: 'CRITICAL_FAIL'
};

/**
 * Get yesterday's value for comparison
 */
async function getYesterdayValue(client, userDependencyId, date) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { rows } = await client.query(
    `SELECT value FROM daily_dependency_reports 
     WHERE user_dependency_id = $1 AND date = $2`,
    [userDependencyId, yesterday.toISOString().split('T')[0]]
  );
  
  return rows[0]?.value || null;
}

/**
 * Smoking evaluator
 */
async function evaluateSmoking(client, report, thresholds) {
  const smoked = report.value?.smoked || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdaySmoked = yesterdayValue?.smoked || null;
  
  const criticalThreshold = thresholds?.smoking?.critical_threshold || 20;
  
  // Critical fail
  if (smoked >= criticalThreshold) {
    return { outcome: OUTCOMES.CRITICAL_FAIL, measure: smoked };
  }
  
  // Full win - zero
  if (smoked === 0) {
    return { outcome: OUTCOMES.FULL_WIN, measure: 0 };
  }
  
  // Partial win - reduced from yesterday
  if (yesterdaySmoked !== null && smoked < yesterdaySmoked) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdaySmoked - smoked };
  }
  
  // Fail - same or worse
  return { outcome: OUTCOMES.FAIL, measure: smoked };
}

/**
 * Phone/screen time evaluator
 */
async function evaluatePhone(client, report, thresholds) {
  const hours = report.value?.phone_hours || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdayHours = yesterdayValue?.phone_hours || null;
  
  const targetHours = thresholds?.phone?.target_hours || 3;
  const criticalHours = thresholds?.phone?.critical_hours || 12;
  
  // Critical fail - extreme usage
  if (hours >= criticalHours) {
    return { outcome: OUTCOMES.CRITICAL_FAIL, measure: hours };
  }
  
  // Full win - met target
  if (hours <= targetHours) {
    return { outcome: OUTCOMES.FULL_WIN, measure: targetHours - hours };
  }
  
  // Partial win - improvement
  if (yesterdayHours !== null && hours < yesterdayHours) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdayHours - hours };
  }
  
  // Fail
  return { outcome: OUTCOMES.FAIL, measure: hours - targetHours };
}

/**
 * Alcohol evaluator
 */
async function evaluateAlcohol(client, report, thresholds) {
  const drinks = report.value?.drinks || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdayDrinks = yesterdayValue?.drinks || null;
  
  const heavyThreshold = thresholds?.alcohol?.heavy_threshold || 5;
  
  // Critical fail - heavy drinking
  if (drinks >= heavyThreshold) {
    return { outcome: OUTCOMES.CRITICAL_FAIL, measure: drinks };
  }
  
  // Full win - sober
  if (drinks === 0) {
    return { outcome: OUTCOMES.FULL_WIN, measure: 0 };
  }
  
  // Partial win - reduced
  if (yesterdayDrinks !== null && drinks < yesterdayDrinks) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdayDrinks - drinks };
  }
  
  // Fail
  return { outcome: OUTCOMES.FAIL, measure: drinks };
}

/**
 * Gaming evaluator
 */
async function evaluateGaming(client, report, thresholds) {
  const hours = report.value?.gaming_hours || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdayHours = yesterdayValue?.gaming_hours || null;
  
  const targetHours = thresholds?.gaming?.target_hours || 1;
  const criticalHours = thresholds?.gaming?.critical_hours || 8;
  
  if (hours >= criticalHours) {
    return { outcome: OUTCOMES.CRITICAL_FAIL, measure: hours };
  }
  
  if (hours <= targetHours) {
    return { outcome: OUTCOMES.FULL_WIN, measure: targetHours - hours };
  }
  
  if (yesterdayHours !== null && hours < yesterdayHours) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdayHours - hours };
  }
  
  return { outcome: OUTCOMES.FAIL, measure: hours - targetHours };
}

/**
 * Overeating evaluator
 */
async function evaluateOvereating(client, report, thresholds) {
  const bingeEpisodes = report.value?.binge_episodes || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdayBinge = yesterdayValue?.binge_episodes || null;
  
  if (bingeEpisodes === 0) {
    return { outcome: OUTCOMES.FULL_WIN, measure: 0 };
  }
  
  if (yesterdayBinge !== null && bingeEpisodes < yesterdayBinge) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdayBinge - bingeEpisodes };
  }
  
  if (bingeEpisodes >= 3) {
    return { outcome: OUTCOMES.CRITICAL_FAIL, measure: bingeEpisodes };
  }
  
  return { outcome: OUTCOMES.FAIL, measure: bingeEpisodes };
}

/**
 * Procrastination evaluator
 */
async function evaluateProcrastination(client, report, thresholds) {
  const wastedHours = report.value?.wasted_hours || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdayWasted = yesterdayValue?.wasted_hours || null;
  
  const targetHours = thresholds?.procrastination?.target_hours || 2;
  
  if (wastedHours <= targetHours) {
    return { outcome: OUTCOMES.FULL_WIN, measure: targetHours - wastedHours };
  }
  
  if (yesterdayWasted !== null && wastedHours < yesterdayWasted) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdayWasted - wastedHours };
  }
  
  if (wastedHours >= 10) {
    return { outcome: OUTCOMES.CRITICAL_FAIL, measure: wastedHours };
  }
  
  return { outcome: OUTCOMES.FAIL, measure: wastedHours - targetHours };
}

/**
 * Drugs evaluator - ALWAYS CRITICAL if any positive
 */
async function evaluateDrugs(client, report, thresholds) {
  const used = report.value?.used || false;
  const slip = report.slip || false;
  
  // ANY positive marker or slip = CRITICAL
  if (used || slip) {
    return { 
      outcome: OUTCOMES.CRITICAL_FAIL, 
      measure: 1,
      requiresHelp: true,
      helpMessage: 'Обратитесь за профессиональной помощью. Это важно.'
    };
  }
  
  return { outcome: OUTCOMES.FULL_WIN, measure: 0 };
}

/**
 * Generic/Other evaluator
 */
async function evaluateOther(client, report, thresholds) {
  const count = report.value?.count || 0;
  const targetValue = report.value?.target || 0;
  const yesterdayValue = await getYesterdayValue(client, report.user_dependency_id, report.date);
  const yesterdayCount = yesterdayValue?.count || null;
  
  if (count <= targetValue) {
    return { outcome: OUTCOMES.FULL_WIN, measure: targetValue - count };
  }
  
  if (yesterdayCount !== null && count < yesterdayCount) {
    return { outcome: OUTCOMES.PARTIAL_WIN, measure: yesterdayCount - count };
  }
  
  return { outcome: OUTCOMES.FAIL, measure: count - targetValue };
}

/**
 * Main evaluator dispatcher
 */
async function evaluateDependencyOutcome(client, report, dependencyKey, thresholds) {
  const evaluators = {
    smoking: evaluateSmoking,
    phone: evaluatePhone,
    alcohol: evaluateAlcohol,
    gaming: evaluateGaming,
    overeating: evaluateOvereating,
    procrastination: evaluateProcrastination,
    drugs: evaluateDrugs,
    social_media: evaluatePhone, // Same logic as phone
    shopping: evaluateOther,
    caffeine: evaluateSmoking, // Similar count-based logic
    other: evaluateOther
  };
  
  const evaluator = evaluators[dependencyKey] || evaluateOther;
  
  try {
    const result = await evaluator(client, report, thresholds);
    
    // If slip flag is set, downgrade wins to fails
    if (report.slip && result.outcome !== OUTCOMES.CRITICAL_FAIL) {
      result.outcome = OUTCOMES.FAIL;
      result.slipOverride = true;
    }
    
    return result;
  } catch (error) {
    console.error(`Error evaluating ${dependencyKey}:`, error);
    return { outcome: OUTCOMES.FAIL, measure: 0, error: error.message };
  }
}

export {
  OUTCOMES,
  evaluateDependencyOutcome,
  evaluateSmoking,
  evaluatePhone,
  evaluateAlcohol,
  evaluateGaming,
  evaluateOvereating,
  evaluateProcrastination,
  evaluateDrugs,
  evaluateOther
};
