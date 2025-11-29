// Генератор ежедневных заданий на основе зависимостей пользователя

// Приветствия (рандомные)
export const greetings = [
  "Доброе утро, чемпион. Ну или почти.",
  "Проснулся? Я — да. Хотя бы физически.",
  "Если ты это читаешь — значит, ты жив. Уже хорошо.",
  "Новый день. Новые возможности. Ну или те же старые.",
  "Привет! Я всё ещё здесь. И ты тоже.",
  "Доброе утро! Или как там у тебя.",
  "Ты открыл приложение. Это уже подвиг.",
  "Солнце встало. Я встал. Теперь твоя очередь.",
];

// Оценка энергии
export const getEnergyComment = (energy) => {
  if (energy <= 10) return "Ты как батарейка у старого смартфона — заряд улетучился ещё до пробуждения.";
  if (energy <= 25) return "Энергии — капля. Но капля — это уже что-то.";
  if (energy <= 40) return "Средненько. Но работать можно.";
  if (energy <= 60) return "Норм. Можешь жить.";
  if (energy <= 80) return "Неплохо! Я бы так не смог.";
  return "Пожалуйста, поделись энергией со мной. Я устал.";
};

// Главные задания на основе зависимостей
export const generateMainTasks = (dependencies) => {
  const tasks = [];
  
  dependencies.forEach(dep => {
    switch(dep.type) {
      case 'smoking':
        if (dep.current > 0) {
          tasks.push({
            id: `main_smoking_${Date.now()}`,
            type: 'main',
            category: 'smoking',
            title: `Сократить курение до ${Math.max(0, dep.current - 1)} сигарет`,
            description: `Сейчас: ${dep.current}, Цель: ${dep.target}`,
            completed: false,
            points: 10
          });
        }
        break;
        
      case 'alcohol':
        tasks.push({
          id: `main_alcohol_${Date.now()}`,
          type: 'main',
          category: 'alcohol',
          title: 'Не употреблять алкоголь сегодня',
          description: 'Один день без алкоголя — один шаг к свободе',
          completed: false,
          points: 10
        });
        break;
        
      case 'phone':
        if (dep.current > 4) {
          tasks.push({
            id: `main_phone_${Date.now()}`,
            type: 'main',
            category: 'phone',
            title: `Сократить экранное время до ${Math.max(2, dep.current - 1)}ч`,
            description: `Сейчас: ${dep.current}ч, Цель: ${dep.target}ч`,
            completed: false,
            points: 10
          });
        }
        break;
        
      case 'junk_food':
        tasks.push({
          id: `main_junk_${Date.now()}`,
          type: 'main',
          category: 'junk_food',
          title: 'Избегать вредной еды',
          description: 'Хотя бы сегодня попробуй без фастфуда',
          completed: false,
          points: 8
        });
        break;
        
      case 'sedentary':
        tasks.push({
          id: `main_sedentary_${Date.now()}`,
          type: 'main',
          category: 'sedentary',
          title: 'Пройти минимум 5000 шагов',
          description: 'Или хотя бы встать со стула пару раз',
          completed: false,
          points: 8
        });
        break;
        
      case 'sleep':
        tasks.push({
          id: `main_sleep_${Date.now()}`,
          type: 'main',
          category: 'sleep',
          title: 'Лечь спать до 23:00',
          description: 'Твоё тело скажет спасибо',
          completed: false,
          points: 10
        });
        break;
    }
  });
  
  // Всегда добавляем задание по главной цели
  tasks.push({
    id: `main_goal_${Date.now()}`,
    type: 'main',
    category: 'goal',
    title: 'Сделать 1 шаг к главной цели',
    description: 'Даже маленький шаг — это прогресс',
    completed: false,
    points: 15
  });
  
  return tasks.slice(0, 3); // Максимум 3 главных задания
};

// Лайтовые задания
export const generateLightTasks = () => {
  const allLightTasks = [
    { title: 'Выпей стакан воды', description: 'Да, ленивец следит', points: 3 },
    { title: '5 минут без телефона', description: 'Сможешь?', points: 5 },
    { title: 'Просто дыши', description: 'Иногда нужно и это', points: 2 },
    { title: 'Встань и потянись', description: 'Твоя спина умоляет', points: 3 },
    { title: 'Посмотри в окно 30 секунд', description: 'Мир всё ещё там', points: 2 },
    { title: 'Скажи себе что-то хорошее', description: 'Даже если не веришь', points: 4 },
    { title: 'Сделай 10 приседаний', description: 'Или хотя бы попытайся', points: 5 },
  ];
  
  // Выбираем 2-3 случайных
  const shuffled = allLightTasks.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map((task, index) => ({
    id: `light_${Date.now()}_${index}`,
    type: 'light',
    category: 'wellness',
    ...task,
    completed: false
  }));
};

// Антизависимые действия
export const generateAntiDependencyTasks = (dependencies) => {
  const tasks = [];
  
  dependencies.forEach(dep => {
    switch(dep.type) {
      case 'junk_food':
        tasks.push({
          id: `anti_junk_${Date.now()}`,
          type: 'anti',
          category: 'junk_food',
          title: 'Не есть ночью',
          description: 'После 21:00 кухня закрыта',
          completed: false,
          points: 7
        });
        break;
        
      case 'smoking':
        tasks.push({
          id: `anti_smoking_${Date.now()}`,
          type: 'anti',
          category: 'smoking',
          title: `Не курить минимум ${dep.current > 5 ? '3 часа' : '2 часа'}`,
          description: 'Увеличь промежутки',
          completed: false,
          points: 8
        });
        break;
        
      case 'phone':
        tasks.push({
          id: `anti_phone_${Date.now()}`,
          type: 'anti',
          category: 'phone',
          title: 'Не залипать на телефоне перед сном',
          description: 'За час до сна — телефон в сторону',
          completed: false,
          points: 7
        });
        break;
        
      case 'procrastination':
        tasks.push({
          id: `anti_procr_${Date.now()}`,
          type: 'anti',
          category: 'procrastination',
          title: 'Сделать одно дело, которое откладывал',
          description: 'Хотя бы начать',
          completed: false,
          points: 10
        });
        break;
    }
  });
  
  return tasks.slice(0, 2); // Максимум 2 антизависимых
};

// Смешные случайные задания
export const generateFunnyTask = () => {
  const funnyTasks = [
    { title: 'Погладь воздух', description: 'Представь, что это я', points: 1 },
    { title: 'Сделай лицом вот так 😐', description: 'И подержи 3 секунды', points: 1 },
    { title: 'Представь, что ты Wi-Fi', description: 'Раздай хоть что-то полезное миру сегодня', points: 2 },
    { title: 'Подмигни зеркалу', description: 'Пусть знает, кто тут главный', points: 1 },
    { title: 'Скажи "Я молодец" вслух', description: 'Даже если никто не слышит', points: 2 },
    { title: 'Покрути головой влево-вправо', description: 'Проверь, всё ли на месте', points: 1 },
    { title: 'Сделай глубокий вдох', description: 'И представь, что вдыхаешь мотивацию', points: 1 },
    { title: 'Похлопай себя по плечу', description: 'Ты это заслужил. Просто так.', points: 1 },
  ];
  
  const random = funnyTasks[Math.floor(Math.random() * funnyTasks.length)];
  return {
    id: `funny_${Date.now()}`,
    type: 'funny',
    category: 'fun',
    ...random,
    completed: false
  };
};

// Генерация всех заданий на день
export const generateDailyTasks = (surveyData) => {
  if (!surveyData || !surveyData.dependencies) {
    return {
      main: [],
      light: generateLightTasks(),
      anti: [],
      funny: generateFunnyTask()
    };
  }
  
  const dependencies = surveyData.dependencies;
  
  return {
    main: generateMainTasks(dependencies),
    light: generateLightTasks(),
    anti: generateAntiDependencyTasks(dependencies),
    funny: generateFunnyTask()
  };
};

// Получить случайное приветствие
export const getRandomGreeting = () => {
  return greetings[Math.floor(Math.random() * greetings.length)];
};

// Рассчитать энергию на основе времени суток и прогресса
export const calculateEnergy = (progressData) => {
  const hour = new Date().getHours();
  let baseEnergy = 50;
  
  // Время суток
  if (hour >= 6 && hour < 9) baseEnergy = 40; // Утро
  else if (hour >= 9 && hour < 12) baseEnergy = 70; // Активное утро
  else if (hour >= 12 && hour < 15) baseEnergy = 60; // День
  else if (hour >= 15 && hour < 18) baseEnergy = 55; // После обеда
  else if (hour >= 18 && hour < 22) baseEnergy = 50; // Вечер
  else baseEnergy = 30; // Ночь
  
  // Добавляем влияние прогресса
  if (progressData && progressData.overall) {
    const progressBonus = Math.floor(progressData.overall / 2);
    baseEnergy = Math.min(100, baseEnergy + progressBonus);
  }
  
  return baseEnergy;
};
