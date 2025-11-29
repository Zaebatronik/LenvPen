import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import { determineTone, getPhraseByTone, getReactionForEvent, checkAchievements, getRandomBubble } from '../utils/slothBehavior';
import BubbleNotification from '../components/BubbleNotification';
import AchievementManager from '../components/AchievementManager';

// Система ленивца с 6 стадиями (Block C)
const SLOTH_STAGES = [
  { level: 0, range: [0, 10], emoji: '😵', text: 'Мне плохо. Всем плохо. Я не просил сюда приходить.' },
  { level: 1, range: [10, 25], emoji: '😑', text: 'Ладно, допустим, я сел. Но я недоволен.' },
  { level: 2, range: [25, 40], emoji: '🙂', text: 'Кажется, этот мир… не так уж плох.' },
  { level: 3, range: [40, 60], emoji: '😊', text: 'Опа! Работа пошла!' },
  { level: 4, range: [60, 80], emoji: '😎', text: 'У нас тут прогресс, между прочим!' },
  { level: 5, range: [80, 100], emoji: '🔥', text: 'Ты легенда. Я легенда. Мы легенды.' }
];

function DashboardClean() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dependencies, setDependencies] = useState([]);
  const [slothComment, setSlothComment] = useState('');
  
  // Block F: Уведомления и достижения
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [newAchievements, setNewAchievements] = useState([]);

  useEffect(() => {
    if (!user?.telegram_id) {
      navigate('/welcome');
      return;
    }

    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    if (!surveyData) {
      navigate('/survey');
      return;
    }

    loadDashboard(surveyData);
  }, [user, navigate]);

  const loadDashboard = (surveyDataString) => {
    try {
      const surveyData = JSON.parse(surveyDataString);
      const harmLevel = surveyData.harmLevel || 0;
      const calculatedProgress = Math.max(0, 100 - harmLevel);
      setProgress(calculatedProgress);
      
      const deps = surveyData.dependencies || [];
      setDependencies(deps);
      
      // БЛОК F: Определяем состояние пользователя
      const lastVisit = localStorage.getItem(`lenvpen_last_visit_${user.telegram_id}`);
      const now = new Date();
      const daysInactive = lastVisit ? Math.floor((now - new Date(lastVisit)) / (1000 * 60 * 60 * 24)) : 0;
      
      const today = new Date().toDateString();
      const todayTasks = JSON.parse(localStorage.getItem(`lenvpen_daily_tasks_${user.telegram_id}_${today}`) || '{}');
      const tasksCompletedToday = todayTasks.completed || 0;
      
      const streakData = JSON.parse(localStorage.getItem(`lenvpen_streak_${user.telegram_id}`) || '{"count": 0}');
      
      const userData = {
        progress: calculatedProgress,
        daysInactive,
        tasksCompletedToday,
        streak: streakData.count || 0
      };
      
      // Определяем тон и получаем фразу
      const tone = determineTone(userData);
      const smartPhrase = getPhraseByTone(tone);
      
      setSlothComment(smartPhrase);
      
      // БЛОК F: Проверяем достижения
      const unlockedAchievements = localStorage.getItem(`lenvpen_achievements_${user.telegram_id}`);
      const previousAchievements = unlockedAchievements ? JSON.parse(unlockedAchievements) : [];
      const newlyUnlocked = checkAchievements(userData, previousAchievements);
      
      if (newlyUnlocked.length > 0) {
        const updated = [...previousAchievements, ...newlyUnlocked.map(a => a.id)];
        localStorage.setItem(`lenvpen_achievements_${user.telegram_id}`, JSON.stringify(updated));
        setNewAchievements(newlyUnlocked);
      }
      
      // БЛОК F: Показываем бабл через 2 секунды
      setTimeout(() => {
        const bubble = getRandomBubble();
        setBubbleMessage(bubble);
        setShowBubble(true);
      }, 2000);
      
      // Сохраняем время визита
      localStorage.setItem(`lenvpen_last_visit_${user.telegram_id}`, now.toISOString());
      
      setLoading(false);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setLoading(false);
    }
  };

  const getSlothStage = (progressValue) => {
    return SLOTH_STAGES.find(s => progressValue >= s.range[0] && progressValue <= s.range[1]) || SLOTH_STAGES[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lenvpen-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦥</div>
          <div className="text-lenvpen-text text-xl">Загрузка...</div>
        </div>
      </div>
    );
  }

  const currentStage = getSlothStage(progress);

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col">
      
      {/* ═══ ВЕРХНЕЕ МЕНЮ ═══ */}
      <div className="bg-lenvpen-card border-b border-lenvpen-orange/20 py-3 px-4">
        <div className="flex gap-3 overflow-x-auto">
          <button 
            onClick={() => navigate('/analytics')}
            className="flex-shrink-0 px-4 py-2 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">🧠</span>
            <span className="text-sm">Аналитика</span>
          </button>
          <button 
            onClick={() => navigate('/daily-tasks')}
            className="flex-shrink-0 px-4 py-2 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">✅</span>
            <span className="text-sm">Задания</span>
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="flex-shrink-0 px-4 py-2 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-sm">Настройки</span>
          </button>
        </div>
      </div>

      {/* ═══ ЦЕНТР - ЛЕНИВЕЦ ═══ */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md w-full">
          
          {/* Круговой прогресс с ленивцем */}
          <div className="relative inline-block mb-6">
            <svg className="w-72 h-72 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" stroke="#2a2a2a" strokeWidth="6" fill="none" />
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="#f97316"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 85}`}
                strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            
            {/* Ленивец */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-2">🦥</div>
                <div className="text-xs text-lenvpen-muted uppercase">
                  Lv.{currentStage.level}
                </div>
              </div>
            </div>
          </div>
          
          {/* Прогресс */}
          <div className="mb-6">
            <div className="text-6xl font-black text-lenvpen-orange mb-2">
              {Math.round(progress)}%
            </div>
            <div className="text-sm text-lenvpen-muted">
              Общий прогресс
            </div>
          </div>
          
          {/* Комментарий */}
          <div className="bg-lenvpen-card rounded-xl p-4 border border-lenvpen-orange/20">
            <p className="text-lenvpen-text text-sm italic">
              "{slothComment}"
            </p>
          </div>
          
        </div>
      </div>

      {/* ═══ НИЖНИЕ КНОПКИ ═══ */}
      <div className="bg-lenvpen-card border-t border-lenvpen-orange/20 p-4">
        <div className="max-w-md mx-auto space-y-3">
          <button
            onClick={() => navigate('/daily-tasks')}
            className="w-full bg-lenvpen-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-lenvpen-red transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">✅</span>
            <span>Задания дня</span>
          </button>
          
          <button
            onClick={() => navigate('/analytics')}
            className="w-full bg-lenvpen-bg text-lenvpen-text py-4 rounded-xl font-semibold border border-lenvpen-orange/30 hover:bg-lenvpen-orange/10 transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📊</span>
            <span>{dependencies.length} зависимостей</span>
          </button>
        </div>
      </div>

      {/* Версия */}
      <div className="text-center py-2">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
      
      {/* БЛОК F: Бабл-уведомления */}
      <BubbleNotification 
        show={showBubble}
        message={bubbleMessage}
        onClose={() => setShowBubble(false)}
      />
      
      {/* БЛОК F: Достижения */}
      <AchievementManager achievements={newAchievements} />
      
    </div>
  );
}

export default DashboardClean;
