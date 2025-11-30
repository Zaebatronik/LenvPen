/**
 * БЛОК D - Система Streaks (серии достижений)
 * Подсчёт непрерывных серий: без курения, без алкоголя, спорт, продуктивность
 */

/**
 * Рассчитывает текущие серии пользователя
 */
export function calculateStreaks(userId) {
  const allReports = JSON.parse(localStorage.getItem(`lenvpen_all_reports_${userId}`) || '[]');
  
  // Сортируем отчёты по дате (от новых к старым)
  const sortedReports = allReports
    .map(r => ({ ...r, date: new Date(r.date) }))
    .sort((a, b) => b.date - a.date);
  
  const streaks = {
    noSmoking: 0,
    noAlcohol: 0,
    exercise: 0,
    productive: 0,
    overall: 0 // общая серия хороших дней
  };
  
  // Проверяем каждый день подряд от сегодня
  for (let i = 0; i < sortedReports.length; i++) {
    const report = sortedReports[i];
    
    // Проверяем, что это последовательные дни
    if (i > 0) {
      const prevDate = sortedReports[i - 1].date;
      const currDate = report.date;
      const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      // Если разрыв больше 1 дня - прерываем подсчёт
      if (dayDiff > 1) break;
    }
    
    // Проверяем серию без курения
    const hasSmokingDep = report.dependencies && Object.keys(report.dependencies).some(dep => 
      dep.toLowerCase().includes('курение') || dep.toLowerCase().includes('сигарет')
    );
    if (hasSmokingDep) {
      const smokingReport = Object.values(report.dependencies).find(d => 
        typeof d === 'object' && (d.resisted || (!d.exceeded && !d.action))
      );
      if (smokingReport) {
        streaks.noSmoking++;
      } else {
        // Серия прервана
        break;
      }
    } else {
      streaks.noSmoking++; // Нет зависимости = продолжение серии
    }
    
    // Проверяем серию без алкоголя
    const hasAlcoholDep = report.dependencies && Object.keys(report.dependencies).some(dep => 
      dep.toLowerCase().includes('алкоголь') || dep.toLowerCase().includes('пиво')
    );
    if (hasAlcoholDep) {
      const alcoholReport = Object.values(report.dependencies).find(d => 
        typeof d === 'object' && (d.resisted || (!d.exceeded && !d.action))
      );
      if (alcoholReport) {
        streaks.noAlcohol++;
      }
    } else {
      streaks.noAlcohol++;
    }
    
    // Проверяем серию спорта/тренировок
    if (report.usefulActions && (report.usefulActions.exercise || report.usefulActions.walk)) {
      streaks.exercise++;
    }
    
    // Проверяем продуктивность (3+ полезных действий)
    if (report.usefulActions) {
      const usefulCount = Object.values(report.usefulActions).filter(Boolean).length;
      if (usefulCount >= 3) {
        streaks.productive++;
      }
    }
    
    // Общая серия хороших дней
    if (report.analysis && report.analysis.overall === 'good') {
      streaks.overall++;
    }
  }
  
  return streaks;
}

/**
 * Получает реакцию ленивца на достижение серии
 */
export function getStreakReaction(streakType, count) {
  const reactions = {
    5: {
      noSmoking: '🎉 5 дней без курения! Я начинаю подозревать, что ты стал взрослым…',
      noAlcohol: '🎊 5 трезвых дней! Твоя печень шепчет мне "спасибо".',
      exercise: '💪 5 дней спорта! Мои лапки уже устали за тебя радоваться!',
      productive: '⚡ 5 продуктивных дней! Ты точно не робот?',
      overall: '✨ 5 хороших дней подряд! Ленивец гордится!'
    },
    10: {
      noSmoking: '🏆 10 дней без курения! Я в шоке. Ты точно человек?',
      noAlcohol: '🌟 10 трезвых дней! Легенда! Ты — машина самоконтроля!',
      exercise: '🔥 10 дней спорта! Дружище, ты уничтожаешь мои стереотипы!',
      productive: '👑 10 продуктивных дней! Я бы хотел быть таким… но я ленивец.',
      overall: '🎯 10 отличных дней! Ленивец записывает в историю!'
    },
    30: {
      noSmoking: '👏 МЕСЯЦ без курения! Ты официально супергерой!',
      noAlcohol: '🎖️ МЕСЯЦ трезвости! Респект и уважуха!',
      exercise: '💎 МЕСЯЦ спорта! Ты — машина! Ленивец аплодирует!',
      productive: '🚀 МЕСЯЦ продуктивности! Дружище, ты уничтожаешь мои стереотипы!',
      overall: '🌈 МЕСЯЦ побед! Ленивец снимает шляпу (если бы она была)!'
    }
  };
  
  // Проверяем особые milestone
  if (reactions[count] && reactions[count][streakType]) {
    return {
      milestone: count,
      message: reactions[count][streakType],
      celebrate: true
    };
  }
  
  // Обычное сообщение для текущей серии
  const messages = {
    noSmoking: `🚭 ${count} ${getDaysWord(count)} без курения!`,
    noAlcohol: `🚫 ${count} ${getDaysWord(count)} без алкоголя!`,
    exercise: `🏃 ${count} ${getDaysWord(count)} спорта!`,
    productive: `⚡ ${count} ${getDaysWord(count)} продуктивности!`,
    overall: `✨ ${count} ${getDaysWord(count)} успеха!`
  };
  
  return {
    milestone: null,
    message: messages[streakType] || `Серия: ${count} дней`,
    celebrate: false
  };
}

/**
 * Склонение слова "день"
 */
function getDaysWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'дней';
  }
  
  if (lastDigit === 1) {
    return 'день';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }
  
  return 'дней';
}

/**
 * Получает иконку для типа серии
 */
export function getStreakIcon(streakType) {
  const icons = {
    noSmoking: '🚭',
    noAlcohol: '🚫',
    exercise: '🏃',
    productive: '⚡',
    overall: '✨'
  };
  
  return icons[streakType] || '📊';
}

/**
 * Получает название серии
 */
export function getStreakName(streakType) {
  const names = {
    noSmoking: 'Без курения',
    noAlcohol: 'Без алкоголя',
    exercise: 'Спорт',
    productive: 'Продуктивность',
    overall: 'Хорошие дни'
  };
  
  return names[streakType] || streakType;
}

/**
 * Компонент отображения серий
 */
export function StreakBadge({ streakType, count, onClick }) {
  const icon = getStreakIcon(streakType);
  const name = getStreakName(streakType);
  const reaction = getStreakReaction(streakType, count);
  
  return (
    <div
      onClick={onClick}
      className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer ${
        reaction.celebrate
          ? 'bg-gradient-to-br from-lenvpen-orange/20 to-lenvpen-red/20 border-lenvpen-orange animate-pulse'
          : 'bg-lenvpen-card border-lenvpen-border hover:border-lenvpen-orange/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="text-lenvpen-text font-semibold text-sm">{name}</div>
          <div className="text-lenvpen-orange font-bold text-xl">{count}</div>
        </div>
      </div>
      
      {reaction.celebrate && (
        <div className="absolute -top-1 -right-1 bg-lenvpen-orange text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">
          🎉 {reaction.milestone}!
        </div>
      )}
    </div>
  );
}

export default {
  calculateStreaks,
  getStreakReaction,
  getStreakIcon,
  getStreakName,
  StreakBadge
};
