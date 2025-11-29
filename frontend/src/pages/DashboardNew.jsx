import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';

// Система ленивца с 6 стадиями (Block C)
const SLOTH_STAGES = [
  {
    level: 0,
    range: [0, 10],
    emoji: '😵',
    pose: 'lying',
    text: 'Мне плохо. Всем плохо. Я не просил сюда приходить.',
    description: 'Лежит мордой вниз'
  },
  {
    level: 1,
    range: [10, 25],
    emoji: '😑',
    pose: 'sitting-bad',
    text: 'Ладно, допустим, я сел. Но я недоволен.',
    description: 'Сидит, глаза полуприкрыты'
  },
  {
    level: 2,
    range: [25, 40],
    emoji: '🙂',
    pose: 'sitting-ok',
    text: 'Кажется, этот мир… не так уж плох.',
    description: 'Сидит ровнее, смотрит бодрее'
  },
  {
    level: 3,
    range: [40, 60],
    emoji: '😊',
    pose: 'standing',
    text: 'Опа! Работа пошла!',
    description: 'Стоит, лёгкая улыбка'
  },
  {
    level: 4,
    range: [60, 80],
    emoji: '😎',
    pose: 'confident',
    text: 'У нас тут прогресс, между прочим!',
    description: 'Уверенно стоит, лапы приподняты'
  },
  {
    level: 5,
    range: [80, 100],
    emoji: '🔥',
    pose: 'hero',
    text: 'Ты легенда. Я легенда. Мы легенды.',
    description: 'Победная, лапы на поясе как супергерой'
  }
];

// Реактивные комментарии (Block C)
const SLOTH_COMMENTS = {
  harm_decreasing: [
    'Ты шо, спортсмен? Красавчик!',
    'Я начинаю в тебя верить.',
    'Если так продолжишь — я начну бегать.'
  ],
  harm_increasing: [
    'Эээ стоп. Что происходит?',
    'Я не осуждаю… но да, я осуждаю.',
    'Если что — я всегда могу лечь обратно.'
  ],
  goal_completed: [
    'Ну всё. Теперь официально: ты лучше меня.',
    'Не ожидал. Но горжусь!',
    'Легенда началась сегодня.'
  ],
  afk_long: [
    'Ты где? Я тут один с этим бардаком!',
    'Я притворяюсь, что всё нормально. Но ты вернись.',
    'Только зашёл — уже отдыхаешь? Классика.'
  ]
};

// Комментарии для конкретных зависимостей (Block C)
const DEPENDENCY_COMMENTS = {
  smoking: [
    'Ты что, дракон? Зачем так много дыма?',
    'Лёгкие кричат. Я слышу.',
    'Давай попробуем хотя бы день без этого?'
  ],
  alcohol: [
    'Эй, это не вода.',
    'Печень просила передать привет.',
    'Я за веселье, но не за это.'
  ],
  phone: [
    'Опять мемы? Я тоже люблю, но мы же договаривались…',
    'Телефон не убежит. Жизнь — может.',
    'Ты видел, сколько времени потратил? Я в шоке.'
  ],
  gaming: [
    'Игры крутые, но реальность тоже неплоха.',
    'Ты в топе? Молодец. А в жизни?',
    'Давай хотя бы делить 50/50: игра и дело.'
  ],
  overeating: [
    'Желудок не резиновый, друг.',
    'Я за вкусняшки, но это перебор.',
    'Может, попробуем овощи? Шучу. Но не совсем.'
  ],
  porn: [
    'Без комментариев. Но ты же сам знаешь.',
    'Это не путь, брат.',
    'Давай работаем над этим.'
  ],
  procrastination: [
    'Я эксперт по прокрастинации. Но даже мне стыдно.',
    'Делай сейчас, а не "потом".',
    'Потом никогда не наступает.'
  ],
  sleep: [
    'Спать в 3 утра — не режим, а катастрофа.',
    'Организм требует расписание.',
    'Ложись раньше. Я серьёзно.'
  ],
  impulse_spending: [
    'Деньги любят тишину, не импульсы.',
    'Это тебе правда нужно?',
    'Кошелёк плачет.'
  ],
  laziness: [
    'Лень — моя специализация. Но ты перегибаешь.',
    'Давай хоть что-то сделаем?',
    'Я верю в тебя. Вставай!'
  ]
};

function DashboardNew() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0); // 0-100
  const [mainGoal, setMainGoal] = useState('');
  const [dependencies, setDependencies] = useState([]);
  const [slothComment, setSlothComment] = useState('');
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showPath, setShowPath] = useState(false);

  useEffect(() => {
    if (!user?.telegram_id) {
      navigate('/welcome');
      return;
    }

    // Check survey completed
    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    if (!surveyData) {
      navigate('/survey');
      return;
    }

    loadDashboard(surveyData);
    
    // AFK check
    const afkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity > 30000) { // 30 секунд
        const randomComment = SLOTH_COMMENTS.afk_long[Math.floor(Math.random() * SLOTH_COMMENTS.afk_long.length)];
        setSlothComment(randomComment);
        setTimeout(() => setSlothComment(''), 5000);
      }
    }, 10000);

    return () => clearInterval(afkInterval);
  }, [user, navigate, lastActivity]);

  const loadDashboard = (surveyDataString) => {
    try {
      const surveyData = JSON.parse(surveyDataString);
      
      // Прогресс на основе harmLevel из Block B
      const harmLevel = surveyData.harmLevel || 0;
      const calculatedProgress = Math.max(0, 100 - harmLevel); // Инвертируем: меньше вреда = больше прогресс
      setProgress(calculatedProgress);
      
      // Главная цель (если есть)
      setMainGoal(surveyData.mainGoal || 'Не задана');
      
      // Зависимости
      const deps = surveyData.dependencies || [];
      const depDetails = surveyData.depDetails || {};
      const priorities = surveyData.priorities || [];
      
      setDependencies(deps.map(key => {
        const details = depDetails[key] || {};
        const isPriority = priorities.indexOf(key) !== -1;
        
        return {
          key,
          title: getDependencyTitle(key, details),
          icon: getDependencyIcon(key),
          was: getDependencyWas(key, details),
          goal: getDependencyGoal(key, details),
          today: 'не отмечено',
          progress: Math.random() * 20, // TODO: real progress
          harm: getHarmStatus(key, details),
          comment: getRandomComment(key),
          isPriority
        };
      }));
      
      // Стартовый комментарий ленивца
      const stage = getSlothStage(calculatedProgress);
      setSlothComment(stage.text);
      
      setLoading(false);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setLoading(false);
    }
  };

  const getSlothStage = (progressValue) => {
    return SLOTH_STAGES.find(s => progressValue >= s.range[0] && progressValue <= s.range[1]) || SLOTH_STAGES[0];
  };

  const getDependencyTitle = (key, details) => {
    const titles = {
      smoking: 'Курение',
      alcohol: 'Алкоголь',
      phone: 'Телефон / Соцсети',
      gaming: 'Гейминг',
      overeating: 'Переедание',
      porn: 'П*рно',
      procrastination: 'Прокрастинация',
      sleep: 'Режим сна',
      impulse_spending: 'Импульсивные траты',
      laziness: 'Лень',
      other: details.name || 'Другое'
    };
    return titles[key] || key;
  };

  const getDependencyIcon = (key) => {
    const icons = {
      smoking: '🚬',
      alcohol: '🍺',
      phone: '📱',
      gaming: '🎮',
      overeating: '🍔',
      porn: '🔞',
      procrastination: '⏰',
      sleep: '😴',
      impulse_spending: '💸',
      laziness: '🦥',
      other: '❓'
    };
    return icons[key] || '❓';
  };

  const getDependencyWas = (key, details) => {
    if (key === 'smoking') return `${details.cigarettes || 0} сигарет/день`;
    if (key === 'alcohol') return details.frequency || 'не указано';
    if (key === 'phone') return `${details.hours || 0} часов/день`;
    if (key === 'gaming') return `${details.hours || 0} часов/день`;
    return 'не указано';
  };

  const getDependencyGoal = (key, details) => {
    if (details.goal) {
      if (details.goal === 'reduce') return 'Снизить';
      if (details.goal === 'quit') return 'Бросить';
      if (details.goal === 'limit') return 'Ограничить';
      return details.goal;
    }
    return 'не задана';
  };

  const getHarmStatus = (key, details) => {
    // Упрощённая логика
    if (key === 'smoking' && details.cigarettes > 15) return '🔥 Высокий вред';
    if (key === 'alcohol' && (details.frequency === 'daily' || details.frequency === 'few_week')) return '🔥 Высокий вред';
    if (key === 'phone' && details.hours > 5) return '⚠️ Средний вред';
    if (key === 'gaming' && details.hours > 4) return '⚠️ Средний вред';
    return '✅ Под контролем';
  };

  const getRandomComment = (key) => {
    const comments = DEPENDENCY_COMMENTS[key] || ['Работаем над этим.'];
    return comments[Math.floor(Math.random() * comments.length)];
  };

  const handleActivity = () => {
    setLastActivity(Date.now());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lenvpen-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🦥</div>
          <div className="text-lenvpen-text text-xl">Загрузка дашборда...</div>
        </div>
      </div>
    );
  }

  const currentStage = getSlothStage(progress);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-lenvpen-dark via-lenvpen-bg to-lenvpen-dark p-4 pb-24"
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Аватар ленивца с состоянием (Block C) */}
        <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-lenvpen-orange/30 relative overflow-hidden">
          {/* Декоративный фон */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-lenvpen-orange/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            {/* Прогресс и аватар */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-lenvpen-muted">Общий прогресс</div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lenvpen-orange to-lenvpen-red">
                  {Math.round(progress)}%
                </div>
              </div>
              
              {/* Круглый аватар ленивца */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lenvpen-orange/30 to-lenvpen-red/30 border-4 border-lenvpen-orange flex items-center justify-center shadow-2xl">
                  <span className="text-6xl">{currentStage.emoji}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-lenvpen-card px-2 py-1 rounded-full border border-lenvpen-orange/50">
                  <span className="text-xs text-lenvpen-orange font-bold">Lv.{currentStage.level}</span>
                </div>
              </div>
            </div>
            
            {/* Прогресс-бар */}
            <div className="h-3 bg-lenvpen-bg rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-lenvpen-orange via-lenvpen-red to-lenvpen-orange rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Комментарий ленивца (речевой пузырь) */}
            <div className="bg-lenvpen-bg/80 rounded-2xl p-4 relative">
              <div className="absolute -top-2 left-8 w-4 h-4 bg-lenvpen-bg/80 rotate-45"></div>
              <p className="text-lenvpen-text text-center italic">
                "{slothComment || currentStage.text}"
              </p>
            </div>
            
            <div className="text-center text-xs text-lenvpen-muted mt-2">
              {currentStage.description}
            </div>
          </div>
        </div>

        {/* Главная цель (Block C) */}
        <div className="bg-gradient-to-br from-lenvpen-orange/20 to-lenvpen-red/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-lenvpen-orange">
          <div className="flex items-start gap-4">
            <span className="text-5xl">🎯</span>
            <div className="flex-1">
              <h2 className="text-sm text-lenvpen-orange uppercase font-bold mb-2">Главная цель</h2>
              <p className="text-2xl font-bold text-lenvpen-text mb-2">
                {mainGoal}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-lenvpen-bg/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-sm text-lenvpen-orange font-bold">{Math.round(progress)}%</span>
              </div>
              <p className="text-xs text-lenvpen-muted mt-2 italic">
                "Так… первая цель адекватная. Уже неплохо."
              </p>
            </div>
          </div>
        </div>

        {/* Кнопка дневного отчёта */}
        <button
          onClick={() => navigate('/daily-report')}
          className="w-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-lenvpen-red/30 active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <span>📋</span>
          <span>Заполнить дневной отчёт</span>
        </button>

        {/* Карточки зависимостей (Block C) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-lenvpen-text">Ваши зависимости</h2>
            <span className="text-sm text-lenvpen-muted">{dependencies.length} шт</span>
          </div>
          
          {dependencies.length > 0 ? (
            dependencies.map(dep => (
              <div 
                key={dep.key} 
                className={`bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                  dep.isPriority 
                    ? 'border-lenvpen-red shadow-lg shadow-lenvpen-red/20' 
                    : 'border-lenvpen-orange/20'
                }`}
              >
                {dep.isPriority && (
                  <div className="inline-block bg-lenvpen-red text-white text-xs px-3 py-1 rounded-full mb-2 font-bold">
                    🔥 Топ-приоритет
                  </div>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl">{dep.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-lenvpen-text">{dep.title}</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-lenvpen-muted block">Было:</span>
                        <span className="text-lenvpen-text font-semibold">{dep.was}</span>
                      </div>
                      <div>
                        <span className="text-lenvpen-muted block">Цель:</span>
                        <span className="text-lenvpen-orange font-semibold">{dep.goal}</span>
                      </div>
                      <div>
                        <span className="text-lenvpen-muted block">Сегодня:</span>
                        <span className="text-lenvpen-muted italic">{dep.today}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-lenvpen-orange">{Math.round(dep.progress)}%</div>
                    <div className="text-xs text-lenvpen-muted mt-1">{dep.harm}</div>
                  </div>
                </div>
                
                {/* Прогресс-бар */}
                <div className="h-2 bg-lenvpen-bg rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red rounded-full"
                    style={{ width: `${dep.progress}%` }}
                  />
                </div>
                
                {/* Комментарий ленивца для зависимости */}
                <div className="bg-lenvpen-bg/50 rounded-lg p-2 text-xs text-lenvpen-muted italic">
                  💬 "{dep.comment}"
                </div>
              </div>
            ))
          ) : (
            <div className="bg-lenvpen-card/50 rounded-2xl p-8 text-center text-lenvpen-muted">
              Нет зависимостей. Поздравляю!
            </div>
          )}
        </div>

        {/* Кнопка "Мой путь" */}
        <button
          onClick={() => setShowPath(!showPath)}
          className="w-full bg-lenvpen-card/60 backdrop-blur-sm text-lenvpen-text py-4 rounded-2xl font-semibold border border-lenvpen-orange/30 active:scale-95 transition-transform"
        >
          {showPath ? '▼' : '▶'} Мой путь (статистика)
        </button>

        {/* Экран "Мой путь" (Block C) */}
        {showPath && (
          <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-6 border border-lenvpen-orange/20 space-y-4">
            <h3 className="text-xl font-bold text-lenvpen-text mb-4">📊 Мой путь</h3>
            
            {/* Успешные дни */}
            <div>
              <div className="text-sm text-lenvpen-muted mb-2">Успешные дни:</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-6 bg-lenvpen-bg rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-lenvpen-green to-lenvpen-green/50" style={{ width: '30%' }}></div>
                </div>
                <span className="text-lenvpen-text font-bold">3 дня</span>
              </div>
              <p className="text-xs text-lenvpen-muted italic mt-1">"Неплохо, но можно лучше."</p>
            </div>
            
            {/* Статистика по топ-зависимости */}
            {dependencies.length > 0 && (
              <div>
                <div className="text-sm text-lenvpen-muted mb-2">Топ-зависимость: {dependencies[0].title}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-lenvpen-bg rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-lenvpen-red to-lenvpen-orange" style={{ width: '72%' }}></div>
                  </div>
                  <span className="text-lenvpen-red font-bold">72% вред</span>
                </div>
                <p className="text-xs text-lenvpen-muted italic mt-1">"Мне уже кашлять хочется."</p>
              </div>
            )}
            
            {/* Визуальные связи (Block C) */}
            <div className="bg-lenvpen-bg/50 rounded-xl p-4 space-y-2">
              <div className="text-sm text-lenvpen-muted mb-3">🔗 Связи:</div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lenvpen-orange">🎯</span>
                  <span className="text-lenvpen-text">{mainGoal}</span>
                </div>
                <div className="ml-4 text-lenvpen-muted">↓</div>
                {dependencies.slice(0, 2).map(dep => (
                  <div key={dep.key} className="ml-4 flex items-center gap-2">
                    <span>{dep.icon}</span>
                    <span className="text-lenvpen-text text-xs">{dep.title}</span>
                  </div>
                ))}
                <div className="ml-4 text-lenvpen-muted">↓</div>
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-lenvpen-green">✅</span>
                  <span className="text-lenvpen-text text-xs">Ежедневные действия</span>
                </div>
                <div className="ml-4 text-lenvpen-muted">↓</div>
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-lenvpen-orange">📈</span>
                  <span className="text-lenvpen-text text-xs">Прогресс: +{Math.round(progress)}%</span>
                </div>
              </div>
              <p className="text-xs text-lenvpen-muted italic mt-3 text-center">
                "Вот видишь? Я же говорил!"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Навигация (Block C) */}
      <div className="fixed bottom-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-t border-lenvpen-orange/20">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <button className="flex flex-col items-center gap-1 text-lenvpen-orange" onClick={() => setShowPath(false)}>
              <span className="text-2xl">🏠</span>
              <span className="text-xs">Главная</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-lenvpen-muted hover:text-lenvpen-orange transition-colors" onClick={() => setShowPath(true)}>
              <span className="text-2xl">📊</span>
              <span className="text-xs">Путь</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-lenvpen-muted hover:text-lenvpen-orange transition-colors" onClick={() => navigate('/daily-report')}>
              <span className="text-2xl">📝</span>
              <span className="text-xs">Отчёт</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-lenvpen-muted hover:text-lenvpen-orange transition-colors" onClick={() => navigate('/settings')}>
              <span className="text-2xl">⚙️</span>
              <span className="text-xs">Настройки</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-lenvpen-muted hover:text-lenvpen-orange transition-colors">
              <span className="text-2xl">{currentStage.emoji}</span>
              <span className="text-xs">Аватар</span>
            </button>
          </div>
          <div className="text-center text-xs text-lenvpen-muted mt-2 italic">
            "Нажми что-нибудь. Я верю в тебя."
          </div>
        </div>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <span className="text-lenvpen-text/40 text-xs font-medium">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DashboardNew;
