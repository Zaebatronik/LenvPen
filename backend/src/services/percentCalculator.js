import { supabase } from '../index.js';
import { 
  getDependencyLogic, 
  calculateStreakBonus, 
  clampPercent 
} from '../../config/percentRules.js';

/**
 * Обновить проценты всех зависимостей на основе дневного отчёта
 * @param {string} userId
 * @param {string} date - YYYY-MM-DD
 * @param {Object} dependenciesDaily - данные из daily_report
 */
export async function updateDependencyPercents(userId, date, dependenciesDaily) {
  try {
    // Получаем все dependency_cards пользователя
    const { data: dependencies, error: depsError } = await supabase
      .from('dependency_cards')
      .select('*')
      .eq('user_id', userId);

    if (depsError) throw depsError;

    // Получаем вчерашний отчёт для сравнения
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayReport } = await supabase
      .from('daily_reports')
      .select('dependencies_daily')
      .eq('user_id', userId)
      .eq('date', yesterdayStr)
      .single();

    const yesterdayData = yesterdayReport?.dependencies_daily || {};

    // Обрабатываем каждую зависимость
    const updates = [];

    for (const dep of dependencies) {
      const todayData = dependenciesDaily[dep.key];
      const yesterdayDepData = yesterdayData[dep.key];

      if (!todayData) continue; // Если нет данных за сегодня — пропускаем

      const logic = getDependencyLogic(dep.key);

      // Вычисляем дельту процента
      const delta = logic.calculateDelta(todayData, yesterdayDepData, dep.meta);

      // Обновляем streak
      const streakSuccess = logic.checkStreak(todayData, dep.meta);
      const newStreak = streakSuccess ? dep.streak + 1 : 0;

      // Бонус за streak
      const streakBonus = calculateStreakBonus(newStreak);

      // Новый процент
      let newPercent = parseFloat(dep.percent) + delta + streakBonus;
      newPercent = clampPercent(Math.round(newPercent * 100) / 100);

      // Добавляем запись в историю
      const historyEntry = {
        date,
        delta,
        streak_bonus: streakBonus,
        reason: streakSuccess ? 'success' : 'fail',
        new_percent: newPercent
      };

      const newHistory = [...(dep.history || []), historyEntry];

      // Сохраняем обновление
      updates.push({
        id: dep.id,
        percent: newPercent,
        streak: newStreak,
        history: newHistory
      });
    }

    // Применяем все обновления
    for (const update of updates) {
      await supabase
        .from('dependency_cards')
        .update({
          percent: update.percent,
          streak: update.streak,
          history: update.history
        })
        .eq('id', update.id);
    }

    // Пересчитываем общую победу
    await updateOverallVictory(userId);

    return { success: true, updates };

  } catch (error) {
    console.error('Update dependency percents error:', error);
    throw error;
  }
}

/**
 * Обновить общий процент победы
 * @param {string} userId
 */
export async function updateOverallVictory(userId) {
  try {
    const { data: dependencies, error } = await supabase
      .from('dependency_cards')
      .select('percent')
      .eq('user_id', userId);

    if (error) throw error;

    if (!dependencies || dependencies.length === 0) {
      return 0;
    }

    const sum = dependencies.reduce((acc, dep) => acc + parseFloat(dep.percent), 0);
    const overall = Math.round(sum / dependencies.length);

    // Обновляем в профиле
    await supabase
      .from('profiles')
      .update({ overall_victory_percent: overall })
      .eq('user_id', userId);

    return overall;

  } catch (error) {
    console.error('Update overall victory error:', error);
    throw error;
  }
}

/**
 * Обновить прогресс главной цели
 * @param {string} userId
 * @param {string} date - YYYY-MM-DD
 * @param {number} rating - оценка 0-10
 */
export async function updateMainGoalProgress(userId, date, rating) {
  try {
    const { data: goal, error: goalError } = await supabase
      .from('main_goal')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (goalError) throw goalError;

    const estimates = goal.progress_estimates || {};
    estimates[date] = rating;

    await supabase
      .from('main_goal')
      .update({ progress_estimates: estimates })
      .eq('user_id', userId);

    return { success: true };

  } catch (error) {
    console.error('Update main goal progress error:', error);
    throw error;
  }
}
