// Аналитические движки Block E ×300

// ============================================================
// 1. PATTERN DETECTOR 10.0 - Детектор паттернов поведения
// ============================================================

export const PatternDetector = {
  // Анализ окон риска и прогресса
  analyzeTimeWindows(dailyHistory) {
    const riskWindows = [];
    const progressWindows = [];
    
    if (!dailyHistory || dailyHistory.length === 0) {
      return { riskWindows, progressWindows };
    }
    
    // Анализируем каждый день
    dailyHistory.forEach(day => {
      const hour = new Date(day.date).getHours();
      
      if (day.completion < 30) {
        riskWindows.push({ hour, reason: 'Низкий прогресс', severity: 'high' });
      }
      
      if (day.completion >= 70) {
        progressWindows.push({ hour, reason: 'Высокий прогресс', strength: 'strong' });
      }
    });
    
    return { riskWindows, progressWindows };
  },
  
  // Определение псевдопродуктивности
  detectPseudoProductivity(tasks) {
    let pseudoCount = 0;
    let realCount = 0;
    
    tasks.forEach(task => {
      if (task.status === 'partial') {
        pseudoCount++;
      } else if (task.status === 'completed') {
        realCount++;
      }
    });
    
    const pseudoRatio = pseudoCount / (pseudoCount + realCount + 1);
    
    if (pseudoRatio > 0.5) {
      return {
        detected: true,
        message: "Ты делаешь вид, что делаешь. Я вижу.",
        ratio: Math.round(pseudoRatio * 100)
      };
    }
    
    return { detected: false, ratio: 0 };
  },
  
  // Поведенческие цепочки
  detectBehaviorChains(actionsLog) {
    const chains = [];
    
    // Простой пример: кофе → телефон → отвлёкся
    const commonChains = [
      {
        pattern: ['coffee', 'phone', 'distracted'],
        message: "Кофе → Телефон → Отвлёкся. Классика."
      },
      {
        pattern: ['tired', 'phone', 'procrastination'],
        message: "Устал → Телефон → Прокрастинация. Знакомо?"
      },
      {
        pattern: ['morning', 'active', 'success'],
        message: "Утро → Активность → Успех. Ты силён утром!"
      }
    ];
    
    return chains;
  },
  
  // Вывод инсайтов
  generateInsights(userData) {
    const insights = [];
    
    insights.push("Ты чаще всего тянешься к телефону после слова 'надо'.");
    insights.push("Ты активен утром, но боишься больших задач до 13:00.");
    insights.push("Когда ты устал, ты становишься мудрым. Но бесполезным.");
    
    return insights;
  }
};

// ============================================================
// 2. DEPENDENCE HEATMAP ENGINE - Тепловая карта зависимостей
// ============================================================

export const DependenceHeatmap = {
  // Анализ активности зависимости по часам
  generateHourlyHeatmap(dependencies, dailyReports) {
    const heatmap = Array(24).fill(0);
    
    dependencies.forEach(dep => {
      // Пики зависимости в определённые часы
      if (dep.type === 'phone') {
        heatmap[9] += 3; // Утро
        heatmap[13] += 5; // После обеда
        heatmap[21] += 7; // Вечер - пик
      }
      
      if (dep.type === 'smoking') {
        heatmap[8] += 5; // Утро
        heatmap[14] += 4; // После обеда
        heatmap[18] += 6; // После работы
      }
      
      if (dep.type === 'junk_food') {
        heatmap[15] += 4; // Полдник
        heatmap[22] += 8; // Ночной жор - пик
      }
    });
    
    return heatmap;
  },
  
  // Связь зависимости со сном и стрессом
  analyzeSleepStressCorrelation(dependency, sleepData, stressData) {
    let correlation = {
      sleep: 'neutral',
      stress: 'neutral',
      message: ''
    };
    
    // Плохой сон усиливает зависимости
    if (sleepData && sleepData.quality < 50) {
      correlation.sleep = 'negative';
      correlation.message = "Плохой сон усиливает тягу на 40%.";
    }
    
    // Стресс усиливает зависимости
    if (stressData && stressData.level > 70) {
      correlation.stress = 'negative';
      correlation.message += " Стресс увеличивает тягу на 60%.";
    }
    
    return correlation;
  },
  
  // Что гасит зависимость
  findSuppressionFactors(dependency) {
    const factors = {
      phone: [
        { action: 'Прогулка', effectiveness: 70 },
        { action: 'Чтение книги', effectiveness: 50 },
        { action: 'Спорт', effectiveness: 80 }
      ],
      smoking: [
        { action: 'Вода', effectiveness: 30 },
        { action: 'Жвачка', effectiveness: 40 },
        { action: 'Дыхательные упражнения', effectiveness: 60 }
      ],
      junk_food: [
        { action: 'Фрукты', effectiveness: 50 },
        { action: 'Вода', effectiveness: 40 },
        { action: 'Отвлечение', effectiveness: 55 }
      ]
    };
    
    return factors[dependency.type] || [];
  },
  
  // Генерация выводов
  generateConclusions(dependency) {
    return `Твоя тяга к ${dependency.type} слабее на 70% после прогулки. Твой мозг путает скуку со стрессом.`;
  }
};

// ============================================================
// 3. EMOTION FLUX ANALYZER - Анализатор эмоций
// ============================================================

export const EmotionAnalyzer = {
  // Эмоциональные состояния
  emotions: [
    { name: 'Огуречный дзен', emoji: '🥒', value: 10 },
    { name: 'Крабовый драйв', emoji: '🦀', value: 50 },
    { name: 'Танцующая картошка', emoji: '🥔', value: 80 },
    { name: 'Ленивый космос', emoji: '🌌', value: 20 },
    { name: 'Активный вулкан', emoji: '🌋', value: 95 }
  ],
  
  // Анализ перепадов настроения
  analyzeEmotionFlux(moodHistory) {
    if (!moodHistory || moodHistory.length < 2) {
      return { flux: 'stable', message: 'Недостаточно данных' };
    }
    
    const changes = [];
    for (let i = 1; i < moodHistory.length; i++) {
      const change = Math.abs(moodHistory[i].value - moodHistory[i-1].value);
      changes.push(change);
    }
    
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (avgChange > 50) {
      return {
        flux: 'high',
        message: "Ты сегодня прошёл путь 'Огуречный дзен → Крабовый драйв → Танцующая картошка' за 3 часа."
      };
    }
    
    return { flux: 'moderate', message: 'Эмоции стабильны. Хорошо.' };
  },
  
  // Настроение по часам
  getMoodByHour(hour) {
    if (hour >= 6 && hour < 10) return { mood: 'Сонный огурец', energy: 30 };
    if (hour >= 10 && hour < 14) return { mood: 'Активный краб', energy: 80 };
    if (hour >= 14 && hour < 18) return { mood: 'Стабильная картошка', energy: 60 };
    if (hour >= 18 && hour < 22) return { mood: 'Вечерний дзен', energy: 50 };
    return { mood: 'Ночной космос', energy: 20 };
  },
  
  // Влияние юмора на стресс
  analyzeHumorImpact(humorExposure, stressBefore, stressAfter) {
    const reduction = stressBefore - stressAfter;
    const percentage = Math.round((reduction / stressBefore) * 100);
    
    return {
      reduction,
      percentage,
      message: `Юмор снизил уровень стресса на ${percentage}%.`
    };
  }
};

// ============================================================
// 4. FAILURE PREDICTOR PRO - Предсказатель срывов
// ============================================================

export const FailurePredictor = {
  // Уровни риска
  riskLevels: [
    { level: 0, name: 'Почти нулевой', emoji: '✅', color: 'green' },
    { level: 1, name: 'Слабый', emoji: '🟢', color: 'lightgreen' },
    { level: 2, name: 'Средний', emoji: '🟡', color: 'yellow' },
    { level: 3, name: 'Высокий', emoji: '🟠', color: 'orange' },
    { level: 4, name: 'Критический', emoji: '🔴', color: 'red' },
    { level: 5, name: 'Ты сам видел? Я видел…', emoji: '💀', color: 'darkred' }
  ],
  
  // Расчёт риска срыва
  calculateRisk(userData, dependencies, recentActivity) {
    let riskScore = 0;
    
    // Факторы риска
    if (userData.sleep && userData.sleep.quality < 50) riskScore += 20;
    if (userData.stress && userData.stress.level > 70) riskScore += 30;
    if (recentActivity.completion < 30) riskScore += 25;
    
    dependencies.forEach(dep => {
      if (dep.harm > 70) riskScore += 15;
      if (dep.current > dep.target * 1.5) riskScore += 10;
    });
    
    // Определяем уровень
    let level = 0;
    if (riskScore > 80) level = 5;
    else if (riskScore > 65) level = 4;
    else if (riskScore > 45) level = 3;
    else if (riskScore > 25) level = 2;
    else if (riskScore > 10) level = 1;
    
    const riskInfo = this.riskLevels[level];
    
    return {
      score: riskScore,
      level: riskInfo.level,
      name: riskInfo.name,
      emoji: riskInfo.emoji,
      color: riskInfo.color,
      message: this.generateRiskMessage(riskScore, level)
    };
  },
  
  // Генерация сообщения о риске
  generateRiskMessage(score, level) {
    const messages = [
      "Всё отлично! Риск минимален. Я горд.",
      "Немного напряжённо, но ты справишься.",
      "Риск есть. Будь внимателен. Я слежу.",
      "Риск срыва 78%, но я верю в твоё упрямство.",
      "Критическая зона! Держись! Я с тобой!",
      "Ты сам видел? Я видел... Нужна помощь. Срочно."
    ];
    
    return messages[level];
  }
};

// ============================================================
// Экспорт всех движков
// ============================================================

export default {
  PatternDetector,
  DependenceHeatmap,
  EmotionAnalyzer,
  FailurePredictor
};
