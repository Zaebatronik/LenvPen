// Система прогнозов Block E ×30

export const ForecastSystem = {
  // Прогноз энергии
  predictEnergy(userData, timeOfDay) {
    const hour = timeOfDay || new Date().getHours();
    let baseEnergy = 50;
    
    // Время суток
    if (hour >= 8 && hour < 12) baseEnergy = 75;
    else if (hour >= 12 && hour < 16) baseEnergy = 65;
    else if (hour >= 16 && hour < 20) baseEnergy = 55;
    else if (hour >= 20 && hour < 24) baseEnergy = 40;
    else baseEnergy = 25;
    
    // Влияние сна
    if (userData.sleep?.quality < 50) baseEnergy -= 20;
    if (userData.sleep?.quality > 80) baseEnergy += 15;
    
    // Влияние прогресса
    if (userData.recentProgress > 70) baseEnergy += 10;
    
    return Math.max(0, Math.min(100, baseEnergy));
  },
  
  // Прогноз мотивации
  predictMotivation(userData, progressData) {
    let motivation = 50;
    
    if (progressData?.streak > 3) motivation += 20;
    if (progressData?.recentWins > 2) motivation += 15;
    if (userData.goalClarity > 70) motivation += 10;
    
    if (progressData?.recentFailures > 2) motivation -= 25;
    if (userData.stress > 70) motivation -= 15;
    
    return Math.max(0, Math.min(100, motivation));
  },
  
  // Прогноз тяги к зависимости
  predictCraving(dependency, context) {
    let craving = dependency.current / dependency.target * 100;
    
    if (context.stress > 70) craving += 30;
    if (context.boredom > 60) craving += 20;
    if (context.sleep < 50) craving += 25;
    
    if (context.activity === 'sport') craving -= 40;
    if (context.activity === 'social') craving -= 25;
    
    return Math.max(0, Math.min(100, craving));
  },
  
  // Прогноз настроения
  predictMood(userData, upcomingEvents) {
    const factors = {
      sleep: userData.sleep?.quality || 50,
      stress: 100 - (userData.stress || 50),
      progress: userData.recentProgress || 50,
      social: userData.socialInteraction || 50
    };
    
    const avgMood = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    
    return {
      score: Math.round(avgMood),
      emotion: avgMood > 70 ? '😊' : avgMood > 40 ? '😐' : '😔',
      forecast: avgMood > 70 ? 'Отличное' : avgMood > 40 ? 'Нормальное' : 'Тяжёлое'
    };
  },
  
  // Оптимальные окна продуктивности
  findProductivityWindows(userData, analyticsData) {
    const windows = [];
    
    // Анализ исторических данных
    const bestHours = [9, 10, 11, 14, 15]; // Стандартные окна
    
    bestHours.forEach(hour => {
      const energy = this.predictEnergy(userData, hour);
      const motivation = this.predictMotivation(userData, analyticsData);
      const score = (energy + motivation) / 2;
      
      if (score > 60) {
        windows.push({
          start: `${hour}:00`,
          end: `${hour + 2}:00`,
          score: Math.round(score),
          recommendation: score > 80 ? 'Лучшее время для важных задач' : 'Хорошее время для работы'
        });
      }
    });
    
    return windows;
  },
  
  // Комплексный прогноз дня
  generateDayForecast(userData) {
    const energy = this.predictEnergy(userData);
    const motivation = this.predictMotivation(userData, userData.progress);
    const mood = this.predictMood(userData, []);
    const windows = this.findProductivityWindows(userData, userData.analytics);
    
    return {
      energy: {
        current: energy,
        peak: Math.min(100, energy + 20),
        message: energy > 70 ? 'Энергии много!' : energy > 40 ? 'Энергии достаточно' : 'Энергии мало'
      },
      motivation: {
        level: motivation,
        message: motivation > 70 ? 'Мотивация на максимум!' : motivation > 40 ? 'Мотивация есть' : 'Мотивация на нуле'
      },
      mood: mood,
      bestWindows: windows,
      summary: `Лучшее время для важного дела: ${windows[0]?.start || '10:00'}–${windows[0]?.end || '12:00'}.`
    };
  }
};

export default ForecastSystem;
