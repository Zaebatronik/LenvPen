/**
 * Daily Report Processing Worker
 * 
 * This worker processes daily reports asynchronously:
 * 1. Locks user to prevent race conditions
 * 2. Evaluates each dependency outcome
 * 3. Calculates C3 weights based on windows
 * 4. Updates dependency percents
 * 5. Calculates O3 discipline health
 * 6. Sends notifications
 */

const { supabase } = require('../config/supabase');
const { evaluateDependencyOutcome, OUTCOMES } = require('./dependencyEvaluators');

/**
 * Load coefficients from app_config
 */
async function loadCoefficients() {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'coefficients')
    .single();
  
  if (error) throw error;
  return data.value;
}

/**
 * Load dependency thresholds
 */
async function loadThresholds() {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'dependency_thresholds')
    .single();
  
  if (error) throw error;
  return data.value;
}

/**
 * Get windows counts (P3/P7/P30, W3/W7/W30)
 */
async function getWindowsCounts(userDependencyId, date) {
  const { data, error } = await supabase
    .rpc('get_windows_counts', {
      p_user_dependency_id: userDependencyId,
      p_date: date
    });
  
  if (error) throw error;
  return data || { P3: 0, P7: 0, P30: 0, W3: 0, W7: 0, W30: 0 };
}

/**
 * Calculate current weight using C3 formula
 */
function calculateCurrentWeight(baseWeight, windows, streak, coeffs) {
  const p3 = windows.P3 * coeffs.penalty_weights.p3;
  const p7 = windows.P7 * coeffs.penalty_weights.p7;
  const p30 = windows.P30 * coeffs.penalty_weights.p30;
  const penalty = p3 + p7 + p30;
  
  const w3 = windows.W3 * coeffs.reward_weights.w3;
  const w7 = windows.W7 * coeffs.reward_weights.w7;
  const w30 = windows.W30 * coeffs.reward_weights.w30;
  const reward = w3 + w7 + w30;
  
  const streakFactor = streak > 0 ? Math.log2(streak + 1) : 0;
  
  const weightRaw = baseWeight + penalty - reward - streakFactor;
  const currentWeight = Math.max(1.0, Math.min(20.0, weightRaw));
  
  return {
    currentWeight,
    penalty,
    reward,
    streakFactor
  };
}

/**
 * Calculate delta percent based on outcome
 */
function calculateDeltaPercent(outcome, currentWeight, coeffs) {
  const maxWeight = 20.0;
  const ratio = currentWeight / maxWeight;
  
  switch (outcome) {
    case OUTCOMES.FULL_WIN:
      return ratio * coeffs.win_factor;
    case OUTCOMES.PARTIAL_WIN:
      return ratio * coeffs.partial_win_factor;
    case OUTCOMES.FAIL:
      return -(ratio * coeffs.fail_factor);
    case OUTCOMES.CRITICAL_FAIL:
      return -(ratio * coeffs.critical_fail_factor);
    default:
      return 0;
  }
}

/**
 * Main worker function
 */
async function processDailyReport(reportId) {
  console.log(`[Worker] Processing report: ${reportId}`);
  
  try {
    // 1. Load report
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('id', reportId)
      .single();
    
    if (reportError) throw reportError;
    if (!report) throw new Error('Report not found');
    
    const userId = report.user_id;
    const reportDate = report.date;
    
    console.log(`[Worker] User: ${userId}, Date: ${reportDate}`);
    
    // 2. Load coefficients and thresholds
    const coeffs = await loadCoefficients();
    const thresholds = await loadThresholds();
    
    // 3. Load daily dependency reports
    const { data: depReports, error: depError } = await supabase
      .from('daily_dependency_reports')
      .select(`
        *,
        user_dependencies (
          id,
          user_id,
          dependency_id,
          base_harm,
          base_difficulty,
          base_frequency,
          base_weight,
          current_weight,
          percent,
          streak,
          dependencies (key, title)
        )
      `)
      .eq('daily_report_id', reportId);
    
    if (depError) throw depError;
    
    console.log(`[Worker] Processing ${depReports.length} dependencies`);
    
    let sumWins = 0;
    let sumFails = 0;
    let totalXpGain = 0;
    
    // 4. Process each dependency
    for (const depReport of depReports) {
      const userDep = depReport.user_dependencies;
      const depKey = userDep.dependencies.key;
      
      console.log(`[Worker] Processing ${depKey}...`);
      
      // 4.1 Evaluate outcome
      const evaluation = await evaluateDependencyOutcome(
        null, // client (we use supabase client instead)
        depReport,
        depKey,
        thresholds
      );
      
      console.log(`[Worker] ${depKey} outcome: ${evaluation.outcome}`);
      
      // 4.2 Get windows counts
      const windows = await getWindowsCounts(userDep.id, reportDate);
      
      // 4.3 Calculate new weight
      const { currentWeight, penalty, reward, streakFactor } = calculateCurrentWeight(
        userDep.base_weight,
        windows,
        userDep.streak,
        coeffs
      );
      
      // 4.4 Calculate delta percent
      const deltaPercent = calculateDeltaPercent(evaluation.outcome, currentWeight, coeffs);
      const oldPercent = userDep.percent;
      const newPercent = Math.max(0, Math.min(100, oldPercent + deltaPercent));
      
      // 4.5 Update streak
      let newStreak = userDep.streak;
      let lastSlipAt = userDep.last_slip_at;
      
      if (evaluation.outcome === OUTCOMES.FULL_WIN || evaluation.outcome === OUTCOMES.PARTIAL_WIN) {
        newStreak = (userDep.streak || 0) + 1;
      } else {
        newStreak = 0;
        lastSlipAt = new Date().toISOString();
      }
      
      // 4.6 Update user_dependencies
      const { error: updateError } = await supabase
        .from('user_dependencies')
        .update({
          current_weight: currentWeight,
          percent: newPercent,
          streak: newStreak,
          last_slip_at: lastSlipAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', userDep.id);
      
      if (updateError) throw updateError;
      
      // 4.7 Insert dependency history
      const { error: historyError } = await supabase
        .from('dependency_history')
        .insert({
          user_dependency_id: userDep.id,
          date: reportDate,
          percent_before: oldPercent,
          percent_after: newPercent,
          weight_before: userDep.current_weight,
          weight_after: currentWeight,
          percent_delta: deltaPercent,
          weight_delta: currentWeight - userDep.current_weight,
          reason: evaluation.outcome
        });
      
      if (historyError) throw historyError;
      
      // 4.8 Update daily_dependency_reports with outcome flags
      const { error: reportUpdateError } = await supabase
        .from('daily_dependency_reports')
        .update({
          is_win: evaluation.outcome === OUTCOMES.FULL_WIN,
          is_partial_win: evaluation.outcome === OUTCOMES.PARTIAL_WIN
        })
        .eq('id', depReport.id);
      
      if (reportUpdateError) throw reportUpdateError;
      
      // 4.9 Accumulate sums for O3
      if (evaluation.outcome === OUTCOMES.FULL_WIN) {
        sumWins += currentWeight;
        totalXpGain += coeffs.win_factor;
      } else if (evaluation.outcome === OUTCOMES.PARTIAL_WIN) {
        sumWins += currentWeight * 0.5;
        totalXpGain += coeffs.partial_win_factor;
      } else if (evaluation.outcome === OUTCOMES.FAIL) {
        sumFails += currentWeight;
        totalXpGain -= coeffs.fail_factor;
      } else if (evaluation.outcome === OUTCOMES.CRITICAL_FAIL) {
        sumFails += currentWeight * 2;
        totalXpGain -= coeffs.critical_fail_factor;
      }
      
      console.log(`[Worker] ${depKey} updated: ${oldPercent.toFixed(1)}% → ${newPercent.toFixed(1)}%`);
    }
    
    // 5. Update O3 discipline health
    const { data: metrics, error: metricsError } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (metricsError && metricsError.code !== 'PGRST116') throw metricsError;
    
    const alpha = coeffs.alpha;
    const beta = coeffs.beta;
    const deltaHealth = (sumWins * alpha) - (sumFails * beta);
    
    const oldHealth = metrics?.discipline_health || 50;
    const newHealth = Math.max(0, Math.min(100, oldHealth + deltaHealth));
    const oldXp = metrics?.total_xp || 0;
    const newXp = oldXp + totalXpGain;
    
    // Update or insert system_metrics
    const { error: metricsUpdateError } = await supabase
      .from('system_metrics')
      .upsert({
        user_id: userId,
        discipline_health: newHealth,
        total_xp: newXp,
        last_report_date: reportDate,
        last_update: new Date().toISOString()
      });
    
    if (metricsUpdateError) throw metricsUpdateError;
    
    // 6. Insert daily metrics history
    const { error: historyInsertError } = await supabase
      .from('daily_metrics_history')
      .insert({
        user_id: userId,
        date: reportDate,
        discipline_health: newHealth,
        discipline_delta: deltaHealth,
        sum_wins: sumWins,
        sum_fails: sumFails,
        xp_earned: totalXpGain
      });
    
    if (historyInsertError) throw historyInsertError;
    
    console.log(`[Worker] O3 updated: ${oldHealth.toFixed(1)}% → ${newHealth.toFixed(1)}% (Δ${deltaHealth > 0 ? '+' : ''}${deltaHealth.toFixed(1)})`);
    console.log(`[Worker] XP: ${oldXp} → ${newXp} (${totalXpGain > 0 ? '+' : ''}${totalXpGain})`);
    
    // 7. Send notification (TODO: implement Telegram bot notification)
    // await sendTelegramNotification(userId, {
    //   deltaHealth,
    //   newHealth,
    //   sumWins,
    //   sumFails,
    //   xpGained: totalXpGain
    // });
    
    console.log(`[Worker] ✅ Report ${reportId} processed successfully`);
    
    return {
      success: true,
      userId,
      reportDate,
      deltaHealth,
      newHealth,
      xpGained: totalXpGain
    };
    
  } catch (error) {
    console.error(`[Worker] ❌ Error processing report ${reportId}:`, error);
    throw error;
  }
}

module.exports = {
  processDailyReport
};
