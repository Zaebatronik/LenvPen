/**
 * C3 Weight Calculation Worker
 * Автоматический расчёт динамических весов зависимостей
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Главная функция обработки ежедневного отчёта
 * @param {string} reportId - UUID daily_report
 */
async function processDailyReport(reportId) {
  console.log(`[Worker] Processing daily report: ${reportId}`);
  
  try {
    // 1. Получить отчёт
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .select('*, daily_dependency_reports(*)')
      .eq('id', reportId)
      .single();
    
    if (reportError) throw reportError;
    
    const { user_id, date, daily_dependency_reports } = report;
    
    // 2. Обработать каждую зависимость
    for (const depReport of daily_dependency_reports) {
      await processDependencyReport(depReport, user_id, date);
    }
    
    // 3. Пересчитать веса C3 для всех зависимостей пользователя
    await recalculateAllWeights(user_id, date);
    
    // 4. Рассчитать вклад дня и обновить O3
    await calculateDisciplineHealth(user_id, date);
    
    // 5. Обновить streaks
    await updateStreaks(user_id, date);
    
    console.log(`[Worker] Successfully processed report: ${reportId}`);
  } catch (error) {
    console.error(`[Worker] Error processing report ${reportId}:`, error);
    throw error;
  }
}

/**
 * Обработка отчёта по одной зависимости
 */
async function processDependencyReport(depReport, userId, date) {
  const { user_dependency_id, value, slip } = depReport;
  
  // Получить user_dependency
  const { data: userDep, error } = await supabase
    .from('user_dependencies')
    .select('*, dependency:dependencies(*)')
    .eq('id', user_dependency_id)
    .single();
  
  if (error) throw error;
  
  // Определить win/partial_win/fail
  const result = evaluateDependencyResult(userDep.dependency.key, value, slip, userDep.target_value);
  
  // Обновить is_win, is_partial_win в daily_dependency_reports
  await supabase
    .from('daily_dependency_reports')
    .update({
      is_win: result.isWin,
      is_partial_win: result.isPartialWin
    })
    .eq('id', depReport.id);
  
  // Обновить streak
  if (result.isWin) {
    await supabase
      .from('user_dependencies')
      .update({ 
        streak: userDep.streak + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_dependency_id);
  } else if (slip || !result.isPartialWin) {
    // Сброс streak при провале
    await supabase
      .from('user_dependencies')
      .update({ 
        streak: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_dependency_id);
  }
}

/**
 * Оценка результата по зависимости
 */
function evaluateDependencyResult(depKey, value, slip, target) {
  if (slip) {
    return { isWin: false, isPartialWin: false };
  }
  
  switch (depKey) {
    case 'smoking':
      const smoked = value.smoked || 0;
      if (smoked === 0) return { isWin: true, isPartialWin: false };
      // TODO: сравнить с yesterday для partial win
      return { isWin: false, isPartialWin: smoked < 5 }; // placeholder
    
    case 'phone':
      const hours = value.phone_hours || 0;
      const targetHours = parseFloat(target) || 2;
      if (hours <= targetHours) return { isWin: true, isPartialWin: false };
      if (hours <= targetHours + 1) return { isWin: false, isPartialWin: true };
      return { isWin: false, isPartialWin: false };
    
    case 'alcohol':
      const drinks = value.drinks || 0;
      return { isWin: drinks === 0, isPartialWin: false };
    
    case 'overeating':
      return { isWin: !value.overate, isPartialWin: false };
    
    default:
      // Generic: check если value.success существует
      if (value.success !== undefined) {
        return { isWin: value.success, isPartialWin: false };
      }
      return { isWin: true, isPartialWin: false };
  }
}

/**
 * Пересчёт весов C3 для всех зависимостей пользователя
 */
async function recalculateAllWeights(userId, date) {
  // Получить все user_dependencies
  const { data: userDeps, error } = await supabase
    .from('user_dependencies')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  
  // Получить конфиг
  const config = await getConfig();
  
  for (const dep of userDeps) {
    const newWeight = await calculateC3Weight(dep, date, config);
    const deltaPercent = await calculatePercentDelta(dep, date, config);
    
    const newPercent = Math.max(0, Math.min(100, dep.percent + deltaPercent));
    
    // Обновить
    await supabase
      .from('user_dependencies')
      .update({
        current_weight: newWeight,
        percent: newPercent,
        updated_at: new Date().toISOString()
      })
      .eq('id', dep.id);
    
    // Записать в историю
    await supabase
      .from('dependency_history')
      .insert({
        user_dependency_id: dep.id,
        date,
        percent_delta: deltaPercent,
        weight_delta: newWeight - dep.current_weight,
        reason: 'daily_report'
      });
  }
}

/**
 * Расчёт C3 веса по формуле
 */
async function calculateC3Weight(userDep, date, config) {
  const { id, base_weight, streak } = userDep;
  
  // Получить отчёты за окна памяти
  const reports = await getDependencyReports(id, date, 30);
  
  // Подсчёт провалов (P3, P7, P30)
  const fails = reports.filter(r => !r.is_win && !r.is_partial_win);
  const P3 = fails.filter(r => daysDiff(r.date, date) <= 3).length;
  const P7 = fails.filter(r => daysDiff(r.date, date) <= 7).length;
  const P30 = fails.length;
  
  // Подсчёт побед (W3, W7, W30)
  const wins = reports.filter(r => r.is_win || r.is_partial_win);
  const W3 = wins.filter(r => daysDiff(r.date, date) <= 3).length;
  const W7 = wins.filter(r => daysDiff(r.date, date) <= 7).length;
  const W30 = wins.length;
  
  // Penalty и Reward
  const { p3, p7, p30 } = config.c3_penalty_coeffs;
  const { w3, w7, w30 } = config.c3_reward_coeffs;
  
  const Penalty = (P3 * p3) + (P7 * p7) + (P30 * p30);
  const Reward = (W3 * w3) + (W7 * w7) + (W30 * w30);
  
  // StreakFactor
  const StreakFactor = Math.log2(streak + 1);
  
  // Формула
  const WeightRaw = base_weight + Penalty - Reward - StreakFactor;
  
  // Clamp
  const { min, max } = config.c3_weight_bounds;
  const CurrentWeight = Math.max(min, Math.min(max, WeightRaw));
  
  return CurrentWeight;
}

/**
 * Расчёт изменения процента за день
 */
async function calculatePercentDelta(userDep, date, config) {
  // Получить сегодняшний отчёт
  const { data: todayReport } = await supabase
    .from('daily_dependency_reports')
    .select('*')
    .eq('user_dependency_id', userDep.id)
    .eq('date', date)
    .single();
  
  if (!todayReport) return 0;
  
  const { current_weight } = userDep;
  const { is_win, is_partial_win, slip } = todayReport;
  const { win, partial_win, fail, critical_fail } = config.day_score_factors;
  
  let deltaPercent = 0;
  
  if (is_win) {
    deltaPercent = (current_weight / 100) * win * 50; // масштаб для видимости
  } else if (is_partial_win) {
    deltaPercent = (current_weight / 100) * partial_win * 50;
  } else if (slip) {
    deltaPercent = -(current_weight / 100) * critical_fail * 50;
  } else {
    deltaPercent = -(current_weight / 100) * fail * 50;
  }
  
  return deltaPercent;
}

/**
 * Расчёт Discipline Health (O3)
 */
async function calculateDisciplineHealth(userId, date) {
  // Получить все зависимости пользователя
  const { data: userDeps } = await supabase
    .from('user_dependencies')
    .select('*')
    .eq('user_id', userId);
  
  // Получить отчёты за сегодня
  const { data: todayReports } = await supabase
    .from('daily_dependency_reports')
    .select('*')
    .eq('date', date)
    .in('user_dependency_id', userDeps.map(d => d.id));
  
  const config = await getConfig();
  const { alpha, beta } = config.o3_health_coeffs;
  
  // Расчёт SumWins и SumFails
  let SumWins = 0;
  let SumFails = 0;
  
  for (const dep of userDeps) {
    const report = todayReports.find(r => r.user_dependency_id === dep.id);
    if (!report) continue;
    
    const weight = dep.current_weight;
    
    if (report.is_win) {
      SumWins += weight * 1.0;
    } else if (report.is_partial_win) {
      SumWins += weight * 0.5;
    } else if (report.slip) {
      SumFails += weight * 1.5;
    } else {
      SumFails += weight * 1.0;
    }
  }
  
  // DeltaHealth
  const DeltaHealth = (SumWins * alpha) - (SumFails * beta);
  
  // Обновить discipline_health
  const { data: metrics } = await supabase
    .from('system_metrics')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  const newHealth = Math.max(0, Math.min(100, metrics.discipline_health + DeltaHealth));
  
  await supabase
    .from('system_metrics')
    .update({
      discipline_health: newHealth,
      last_update: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  // Записать в историю
  await supabase
    .from('daily_metrics_history')
    .insert({
      user_id: userId,
      date,
      discipline_health: newHealth,
      discipline_delta: DeltaHealth,
      sum_wins: SumWins,
      sum_fails: SumFails,
      xp_earned: SumWins * 10 - SumFails * 6
    });
}

/**
 * Обновление streaks
 */
async function updateStreaks(userId, date) {
  // TODO: implement global_streak logic
  // Считаем процент побед за день
  // Если >= 70% → global_streak++
  // Иначе сбрасываем
}

/**
 * Вспомогательные функции
 */

async function getConfig() {
  const { data } = await supabase
    .from('app_config')
    .select('*');
  
  const config = {};
  for (const row of data) {
    config[row.key] = row.value;
  }
  return config;
}

async function getDependencyReports(userDepId, toDate, days) {
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);
  
  const { data } = await supabase
    .from('daily_dependency_reports')
    .select('*')
    .eq('user_dependency_id', userDepId)
    .gte('date', fromDate.toISOString().split('T')[0])
    .lte('date', toDate);
  
  return data || [];
}

function daysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export {
  processDailyReport
};
