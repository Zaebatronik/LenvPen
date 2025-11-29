/**
 * Конфигурация для расчёта процентов побед над зависимостями
 */

export const PERCENT_RULES = {
  // Базовые изменения
  no_action: 1.0,           // Не делал сегодня (курение, алкоголь)
  reduced: 0.5,             // Сократил по сравнению с вчера
  same: 0,                  // То же самое
  increased: -1.0,          // Увеличил
  relapse: -5.0,            // Серьёзный рецидив
  
  // Для целевых лимитов (телефон, игры)
  met_target: 1.0,          // Достиг целевого лимита
  exceeded_slightly: 0.5,   // Превысил, но меньше чем вчера
  exceeded_much: -1.0,      // Существенно превысил
  
  // Ограничения
  min_percent: 0,
  max_percent: 100
};

export const STREAK_BONUSES = {
  7: 2,     // 7 дней → +2%
  30: 5,    // 30 дней → +5%
  90: 10    // 90 дней → +10%
};

/**
 * Правила расчёта для каждой зависимости
 */
export const DEPENDENCY_LOGIC = {
  smoking: {
    calculateDelta: (todayData, yesterdayData, meta) => {
      if (!todayData.did_smoke) {
        return PERCENT_RULES.no_action;
      }
      
      const todayCount = todayData.count || 0;
      const yesterdayCount = yesterdayData?.count || meta.current_amount || 0;
      
      if (todayCount < yesterdayCount) return PERCENT_RULES.reduced;
      if (todayCount === yesterdayCount) return PERCENT_RULES.same;
      return PERCENT_RULES.increased;
    },
    checkStreak: (todayData) => {
      return !todayData.did_smoke;
    }
  },
  
  alcohol: {
    calculateDelta: (todayData, yesterdayData, meta) => {
      if (!todayData.did_drink) {
        return PERCENT_RULES.no_action;
      }
      
      const todayAmount = todayData.amount || 0;
      const yesterdayAmount = yesterdayData?.amount || 0;
      
      if (todayAmount < yesterdayAmount) return PERCENT_RULES.reduced;
      if (todayAmount === yesterdayAmount) return PERCENT_RULES.same;
      return PERCENT_RULES.increased;
    },
    checkStreak: (todayData) => {
      return !todayData.did_drink;
    }
  },
  
  phone: {
    calculateDelta: (todayData, yesterdayData, meta) => {
      const todayHours = todayData.hours || 0;
      const targetHours = meta.target_hours || 2;
      const yesterdayHours = yesterdayData?.hours || meta.current_hours || 6;
      
      if (todayHours <= targetHours) {
        return PERCENT_RULES.met_target;
      }
      
      if (todayHours < yesterdayHours) {
        return PERCENT_RULES.exceeded_slightly;
      }
      
      return PERCENT_RULES.exceeded_much;
    },
    checkStreak: (todayData, meta) => {
      const todayHours = todayData.hours || 0;
      const targetHours = meta.target_hours || 2;
      return todayHours <= targetHours;
    }
  },
  
  games: {
    calculateDelta: (todayData, yesterdayData, meta) => {
      const todayHours = todayData.hours || 0;
      const targetHours = meta.target_hours || 0;
      const yesterdayHours = yesterdayData?.hours || meta.current_hours || 4;
      
      if (todayHours <= targetHours) {
        return PERCENT_RULES.met_target;
      }
      
      if (todayHours < yesterdayHours) {
        return PERCENT_RULES.exceeded_slightly;
      }
      
      return PERCENT_RULES.exceeded_much;
    },
    checkStreak: (todayData, meta) => {
      const todayHours = todayData.hours || 0;
      const targetHours = meta.target_hours || 0;
      return todayHours <= targetHours;
    }
  },
  
  // Универсальное правило для остальных зависимостей
  default: {
    calculateDelta: (todayData, yesterdayData, meta) => {
      if (todayData.no_action) {
        return PERCENT_RULES.no_action;
      }
      
      const todayValue = todayData.value || 0;
      const yesterdayValue = yesterdayData?.value || 0;
      
      if (todayValue < yesterdayValue) return PERCENT_RULES.reduced;
      if (todayValue === yesterdayValue) return PERCENT_RULES.same;
      return PERCENT_RULES.increased;
    },
    checkStreak: (todayData) => {
      return todayData.no_action === true;
    }
  }
};

/**
 * Получить логику расчёта для зависимости
 */
export function getDependencyLogic(dependencyKey) {
  return DEPENDENCY_LOGIC[dependencyKey] || DEPENDENCY_LOGIC.default;
}

/**
 * Вычислить бонус за streak
 */
export function calculateStreakBonus(streak) {
  let bonus = 0;
  
  Object.keys(STREAK_BONUSES)
    .sort((a, b) => b - a) // От большего к меньшему
    .forEach(threshold => {
      if (streak >= parseInt(threshold) && streak % parseInt(threshold) === 0) {
        bonus = STREAK_BONUSES[threshold];
      }
    });
  
  return bonus;
}

/**
 * Ограничить процент в пределах [0, 100]
 */
export function clampPercent(value) {
  return Math.max(
    PERCENT_RULES.min_percent, 
    Math.min(PERCENT_RULES.max_percent, value)
  );
}
