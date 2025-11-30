import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import Navigation from '../components/Navigation';

/**
 * DASHBOARD T3 — Главный экран по полной T3 спецификации
 * 
 * Логика:
 * - Старт с 30% (нейтральная точка)
 * - 9 стадий ленивца с анимациями
 * - Тап по ленивцу → детальная информация об этапе
 * - Динамическое обновление на основе отчётов
 * - Полная связь: отчёты → проценты → стадия → календарь → прогресс
 */

// T3 СИСТЕМА ЛЕНИВЦА: 9 стадий от 0% до 100%
const SLOTH_STAGES = [
  { 
    level: 0, 
    range: [0, 1], 
    emoji: '💀', 
    title: 'ЛЕНИВЕЦ МЁРТВ',
    text: 'Ты проиграл. Начни заново.',
    behavior: 'не двигается',
    color: 'text-lenvpen-red',
    bgColor: 'from-lenvpen-red/20 to-lenvpen-red/5'
  },
  { 
    level: 1, 
    range: [1, 10], 
    emoji: '😵', 
    title: 'Слабый',
    text: 'Слабая энергия, срочно действуй.',
    behavior: 'дрожит',
    color: 'text-orange-400',
    bgColor: 'from-orange-400/20 to-orange-400/5'
  },
  { 
    level: 2, 
    range: [10, 20], 
    emoji: '😴', 
    title: 'Хрупкий',
    text: 'Появляется мотивация.',
    behavior: 'пытается встать',
    color: 'text-yellow-400',
    bgColor: 'from-yellow-400/20 to-yellow-400/5'
  },
  { 
    level: 3, 
    range: [20, 30], 
    emoji: '😐', 
    title: 'Нестабильный',
    text: 'Начинаешь разгон.',
    behavior: 'маленький прыжок',
    color: 'text-yellow-300',
    bgColor: 'from-yellow-300/20 to-yellow-300/5'
  },
  { 
    level: 4, 
    range: [30, 50], 
    emoji: '🙂', 
    title: 'Стабильный',
    text: 'Есть прогресс.',
    behavior: 'уверенно стоит',
    color: 'text-lenvpen-accent',
    bgColor: 'from-lenvpen-accent/20 to-lenvpen-accent/5'
  },
  { 
    level: 5, 
    range: [50, 70], 
    emoji: '😊', 
    title: 'Сильный',
    text: 'Ты в тонусе.',
    behavior: 'активно двигается',
    color: 'text-lenvpen-green',
    bgColor: 'from-lenvpen-green/20 to-lenvpen-green/5'
  },
  { 
    level: 6, 
    range: [70, 90], 
    emoji: '😎', 
    title: 'Почти герой',
    text: 'Ты близко к цели.',
    behavior: 'позы героя',
    color: 'text-lenvpen-green',
    bgColor: 'from-lenvpen-green/30 to-lenvpen-green/10'
  },
  { 
    level: 7, 
    range: [90, 100], 
    emoji: '🔥', 
    title: 'Мастер',
    text: 'Ещё шаг. Ты почти там.',
    behavior: 'сияние',
    color: 'text-orange-300',
    bgColor: 'from-orange-300/30 to-orange-300/10'
  },
  { 
    level: 8, 
    range: [100, 999], 
    emoji: '🏆', 
    title: 'ГЕРОЙ',
    text: 'Цель достигнута.',
    behavior: 'супер-форма',
    color: 'text-yellow-300',
    bgColor: 'from-yellow-300/30 to-yellow-300/10',
    isVictory: true
  }
];

function DashboardT3() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(30); // СТАРТ с 30%!
  const [todayStatus, setTodayStatus] = useState({ filled: false, score: 0 });
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageHistory, setStageHistory] = useState([]);

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

    loadDashboard();
  }, [user, navigate]);

  const loadDashboard = () => {
    try {
      // НОВАЯ ЛОГИКА % ПРОГРЕССА
      // Получаем все отчёты
      const allReportsKey = `lenvpen_all_reports_${user.telegram_id}`;
      const allReports = JSON.parse(localStorage.getItem(allReportsKey) || '[]');
      
      // Если нет отчётов - стартуем с 30%
      if (allReports.length === 0) {
        setProgress(30);
      } else {
        // Суммируем все score и добавляем к стартовым 30%
        const totalScore = allReports.reduce((sum, report) => sum + (report.score || 0), 0);
        const calculatedProgress = Math.min(100, Math.max(0, 30 + totalScore));
        setProgress(calculatedProgress);
      }
      
      // Проверяем отчёт за сегодня
      const today = new Date().toISOString().split('T')[0];
      const todayReportKey = `lenvpen_report_${user.telegram_id}_${today}`;
      const todayReport = localStorage.getItem(todayReportKey);
      
      if (todayReport) {
        const report = JSON.parse(todayReport);
        setTodayStatus({ 
          filled: true, 
          score: report.score || 0,
          finalized: report.finalized || false
        });
      }
      
      // Загружаем историю этапов
      loadStageHistory(allReports);
      
      setLoading(false);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setLoading(false);
    }
  };

  const loadStageHistory = (reports) => {
    // Строим историю переходов между этапами
    const history = [];
    let currentProgress = 30;
    
    reports.forEach((report, index) => {
      currentProgress += report.score || 0;
      currentProgress = Math.min(100, Math.max(0, currentProgress));
      
      const stage = getSlothStage(currentProgress);
      
      // Добавляем только если сменился уровень
      if (history.length === 0 || history[history.length - 1].level !== stage.level) {
        history.push({
          level: stage.level,
          emoji: stage.emoji,
          title: stage.title,
          date: report.date,
          progress: Math.round(currentProgress)
        });
      }
    });
    
    setStageHistory(history);
  };

  const getSlothStage = (progressValue) => {
    return SLOTH_STAGES.find(s => progressValue >= s.range[0] && progressValue <= s.range[1]) || SLOTH_STAGES[3];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lenvpen-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🦥</div>
          <div className="text-lenvpen-text text-xl">Загрузка...</div>
        </div>
      </div>
    );
  }

  const currentStage = getSlothStage(progress);
  const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');

  return (
    <div className="min-h-screen bg-lenvpen-bg">
      <Navigation />
      
      <div className="pt-20 pb-24 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* ЦЕНТР ЭКРАНА — ЛЕНИВЕЦ (тапабельный) */}
          <button
            onClick={() => setShowStageModal(true)}
            className="w-full transition-transform hover:scale-105 active:scale-95"
          >
            <div className={`relative w-64 h-64 mx-auto rounded-full bg-gradient-to-br ${currentStage.bgColor} border-4 border-lenvpen-accent/50 flex flex-col items-center justify-center shadow-2xl shadow-lenvpen-accent/40 overflow-hidden`}>
              {/* Анимация сияния для героя */}
              {currentStage.isVictory && (
                <div className="absolute inset-0 bg-gradient-radial from-yellow-300/30 to-transparent animate-pulse"></div>
              )}
              
              {/* Анимация дрожи для слабого */}
              <div className={`text-8xl relative z-10 mb-4 ${currentStage.level === 1 ? 'animate-bounce' : ''}`}>
                {currentStage.emoji}
              </div>
              
              {/* Процент внутри */}
              <div className="relative z-10 text-center">
                <div className={`text-5xl font-black ${currentStage.color}`}>
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-lenvpen-muted uppercase tracking-wide mt-1">
                  {currentStage.title}
                </div>
              </div>
            </div>
          </button>

          {/* Реакция ленивца */}
          <div className="bg-lenvpen-card/50 backdrop-blur-sm rounded-2xl p-6 border border-lenvpen-border">
            <p className="text-lenvpen-text italic text-center text-lg">
              "{currentStage.text}"
            </p>
            <p className="text-lenvpen-muted text-sm text-center mt-2">
              {currentStage.behavior}
            </p>
          </div>

          {/* Главная цель и дни */}
          <div className="bg-gradient-to-br from-lenvpen-card to-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-accent/30">
            <div className="text-xs text-lenvpen-muted uppercase tracking-wide mb-2">🎯 Главная цель</div>
            <p className="text-lenvpen-text text-xl font-semibold leading-tight mb-4">
              {surveyData?.mainGoal || 'Цель не указана'}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-lenvpen-border/30">
              <div>
                <div className="text-4xl font-black text-lenvpen-accent">
                  {surveyData?.goalDays || 90}
                </div>
                <div className="text-sm text-lenvpen-muted mt-1">дней до цели</div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black ${currentStage.color}`}>
                  {Math.round(progress)}%
                </div>
                <div className="text-sm text-lenvpen-muted mt-1">текущий прогресс</div>
              </div>
            </div>
          </div>

          {/* Статус сегодняшнего дня */}
          {todayStatus.filled ? (
            <div className={`rounded-2xl p-6 border-2 ${
              todayStatus.score >= 0 
                ? 'bg-lenvpen-green/10 border-lenvpen-green/30' 
                : 'bg-lenvpen-red/10 border-lenvpen-red/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-lenvpen-muted mb-1">📅 Сегодня</div>
                  <div className="text-lenvpen-text font-semibold">
                    {todayStatus.finalized ? 'День завершён' : 'Отчёт сохранён'}
                  </div>
                </div>
                <div className={`text-4xl font-black ${
                  todayStatus.score >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'
                }`}>
                  {todayStatus.score >= 0 ? '+' : ''}{todayStatus.score}
                </div>
              </div>
              {!todayStatus.finalized && (
                <button
                  onClick={() => navigate('/daily-report')}
                  className="w-full mt-4 py-2 rounded-lg bg-lenvpen-accent text-white font-semibold hover:bg-lenvpen-accent/90 transition-all"
                >
                  Продолжить заполнение
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/daily-report')}
              className="w-full bg-gradient-to-r from-lenvpen-accent to-lenvpen-accent/80 text-white rounded-2xl p-6 font-bold text-lg shadow-lg shadow-lenvpen-accent/20 hover:shadow-xl transition-all"
            >
              <div className="text-3xl mb-2">📋</div>
              <div>Создать отчёт за сегодня</div>
              <div className="text-sm font-normal mt-2 opacity-90">
                Заполни свой день и получи +/- к прогрессу
              </div>
            </button>
          )}

        </div>
      </div>

      {/* МОДАЛКА "ВАШ ЭТАП" */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-lenvpen-card border-2 border-lenvpen-accent rounded-3xl p-8 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-lenvpen-text">Ваш текущий этап</h2>
              <button
                onClick={() => setShowStageModal(false)}
                className="w-10 h-10 rounded-full bg-lenvpen-bg hover:bg-lenvpen-border flex items-center justify-center text-lenvpen-text transition-all"
              >
                ✕
              </button>
            </div>

            {/* Текущая стадия */}
            <div className={`bg-gradient-to-br ${currentStage.bgColor} rounded-2xl p-6 mb-6 border border-lenvpen-accent/30`}>
              <div className="text-center">
                <div className="text-7xl mb-4">{currentStage.emoji}</div>
                <div className={`text-4xl font-black ${currentStage.color} mb-2`}>
                  {Math.round(progress)}%
                </div>
                <div className="text-2xl font-bold text-lenvpen-text mb-2">
                  {currentStage.title}
                </div>
                <p className="text-lenvpen-text italic mb-2">
                  "{currentStage.text}"
                </p>
                <p className="text-lenvpen-muted text-sm">
                  Поведение: {currentStage.behavior}
                </p>
              </div>
            </div>

            {/* Объяснение */}
            <div className="bg-lenvpen-bg rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-lenvpen-text mb-3">💡 Почему ты на этом этапе?</h3>
              <p className="text-lenvpen-muted mb-4">
                Твой прогресс формируется из ежедневных отчётов. Каждое полезное действие даёт +2 до +10 поинтов (×2), 
                каждое нарушение зависимости забирает -3 до -20 поинтов.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-lenvpen-green/10 border border-lenvpen-green/30 rounded-xl p-4">
                  <div className="text-lenvpen-green font-bold mb-2">✅ Для роста:</div>
                  <ul className="text-sm text-lenvpen-text space-y-1">
                    <li>• Спорт (+4)</li>
                    <li>• Работа (+4)</li>
                    <li>• Учёба (+4)</li>
                    <li>• Здоровый сон (+4)</li>
                  </ul>
                </div>
                <div className="bg-lenvpen-red/10 border border-lenvpen-red/30 rounded-xl p-4">
                  <div className="text-lenvpen-red font-bold mb-2">❌ Что тормозит:</div>
                  <ul className="text-sm text-lenvpen-text space-y-1">
                    <li>• Нарушения зависимостей</li>
                    <li>• Пропуски отчётов</li>
                    <li>• Отсутствие действий</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* История переходов */}
            {stageHistory.length > 0 && (
              <div className="bg-lenvpen-bg rounded-2xl p-6">
                <h3 className="text-lg font-bold text-lenvpen-text mb-3">📈 История этапов</h3>
                <div className="space-y-2">
                  {stageHistory.slice(-5).reverse().map((stage, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 bg-lenvpen-card/50 rounded-lg p-3"
                    >
                      <span className="text-3xl">{stage.emoji}</span>
                      <div className="flex-1">
                        <div className="text-lenvpen-text font-semibold">{stage.title}</div>
                        <div className="text-xs text-lenvpen-muted">
                          {new Date(stage.date).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div className="text-lenvpen-accent font-bold">{stage.progress}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowStageModal(false)}
              className="w-full mt-6 py-4 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Версия */}
      <div className="fixed bottom-20 right-4 z-10">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DashboardT3;
