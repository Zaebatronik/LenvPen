import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import Navigation from '../components/Navigation';

// Система ленивца с 6 стадиями
const SLOTH_STAGES = [
  { level: 0, range: [0, 20], emoji: '😵', text: 'Мне плохо. Всем плохо. Я не просил сюда приходить.' },
  { level: 1, range: [20, 40], emoji: '😑', text: 'Ладно, допустим, я сел. Но я недоволен.' },
  { level: 2, range: [40, 60], emoji: '🙂', text: 'Кажется, этот мир… не так уж плох.' },
  { level: 3, range: [60, 75], emoji: '😊', text: 'Опа! Работа пошла!' },
  { level: 4, range: [75, 90], emoji: '😎', text: 'У нас тут прогресс, между прочим!' },
  { level: 5, range: [90, 100], emoji: '🔥', text: 'Ты легенда. Я легенда. Мы легенды.' }
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
      
      // Новая система: считаем проценты из всех отчётов
      const allReportsKey = `lenvpen_all_reports_${user.telegram_id}`;
      const allReports = JSON.parse(localStorage.getItem(allReportsKey) || '[]');
      
      // Суммируем score из всех отчётов
      const totalScore = allReports.reduce((sum, report) => sum + (report.score || 0), 0);
      const calculatedProgress = Math.min(100, Math.max(0, totalScore));
      setProgress(calculatedProgress);
      
      const deps = surveyData.dependencies || [];
      setDependencies(deps);
      
      // БЛОК F: Определяем состояние пользователя
      const lastVisit = localStorage.getItem(`lenvpen_last_visit_${user.telegram_id}`);
      const now = new Date();
      const daysInactive = lastVisit ? Math.floor((now - new Date(lastVisit)) / (1000 * 60 * 60 * 24)) : 0;
      
      // Определяем фразу ленивца на основе последнего отчёта
      const today = new Date().toISOString().split('T')[0];
      const todayReportKey = `lenvpen_report_${user.telegram_id}_${today}`;
      const todayReport = localStorage.getItem(todayReportKey);
      
      if (todayReport) {
        const report = JSON.parse(todayReport);
        const score = report.score || 0;
        if (score >= 5) {
          setSlothComment('Так! Я снова оживаю! Продолжай!');
        } else if (score >= 0) {
          setSlothComment('Неплохо. Двигаемся дальше.');
        } else {
          setSlothComment('Ну вот… а я надеялся на лучший день 😿');
        }
      } else {
        setSlothComment('Заполни отчёт дня, чтобы я увидел прогресс!');
      }
      
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

  const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');

  return (
    <div className="min-h-screen bg-lenvpen-bg">
      {/* Единая навигация T3 */}
      <Navigation />
      
      {/* Контент с отступами для навигации */}
      <div className="pt-20 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Компактный ленивец с процентом внутри */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-48 h-48 rounded-full bg-lenvpen-card/80 border-4 border-lenvpen-accent/50 flex flex-col items-center justify-center shadow-2xl shadow-lenvpen-accent/40 relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-lenvpen-accent/10"></div>
              <div className="text-6xl relative z-10 mb-2">{currentStage.emoji}</div>
              <div className="relative z-10 text-center">
                <div className="text-4xl font-black text-lenvpen-accent">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-lenvpen-muted uppercase tracking-wide mt-1">
                  Уровень {currentStage.level}
                </div>
              </div>
            </div>
            
            {/* Главная цель и дни */}
            <div className="w-full max-w-md">
              <div className="bg-lenvpen-card/50 backdrop-blur-sm rounded-2xl p-5 border border-lenvpen-accent/30">
                <div className="text-xs text-lenvpen-muted uppercase tracking-wide mb-2">Главная цель</div>
                <p className="text-lenvpen-text text-lg font-semibold leading-tight">
                  {surveyData?.mainGoal || 'Цель не указана'}
                </p>
                <div className="mt-4 pt-4 border-t border-lenvpen-border/30">
                  <div className="text-3xl font-bold text-lenvpen-accent">
                    {surveyData?.goalDays || 90}
                  </div>
                  <div className="text-sm text-lenvpen-muted mt-1">дней до цели</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Реакция ленивца */}
          <div className="bg-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border mb-6">
            <p className="text-lenvpen-text italic text-center">
              "{slothComment}"
            </p>
          </div>
          
        </div>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-20 right-4 z-10">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DashboardClean;
