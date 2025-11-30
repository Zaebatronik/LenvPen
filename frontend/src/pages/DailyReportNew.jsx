import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';

/**
 * DAILY REPORT T3 — 2-колоночный отчёт дня
 * Колонка A: Вредные привычки (каждая зависимость своя строка)
 * Колонка B: Плюсовые действия (галочки)
 * С окном подтверждения и блокировкой после отправки
 */

// Позитивные действия для выбора
const POSITIVE_ACTIONS = [
  { id: 'sport', label: 'Спорт', icon: '🏃', points: 2 },
  { id: 'work', label: 'Работа', icon: '💼', points: 2 },
  { id: 'study', label: 'Учёба', icon: '📚', points: 2 },
  { id: 'sleep', label: 'Сон 7+ часов', icon: '😴', points: 2 },
  { id: 'healthy_food', label: 'Здоровая еда', icon: '🥗', points: 2 },
  { id: 'meditation', label: 'Медитация', icon: '🧘', points: 2 }
];

function DailyReportNew() {
  const navigate = useNavigate();
  
  // Получаем данные пользователя
  const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
  const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');
  
  // Проверяем, заполнен ли уже отчёт за сегодня
  const today = new Date().toISOString().split('T')[0];
  const todayReport = localStorage.getItem(`lenvpen_report_${user.telegram_id}_${today}`);
  const [isReportLocked, setIsReportLocked] = useState(!!todayReport);
  
  // Состояния для 2 колонок
  const [dependenciesReport, setDependenciesReport] = useState({});
  const [selectedActions, setSelectedActions] = useState([]);
  const [dayComment, setDayComment] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Инициализация зависимостей из survey
  useEffect(() => {
    if (surveyData.dependencies) {
      const initial = {};
      surveyData.dependencies.forEach(depKey => {
        initial[depKey] = { violated: false, amount: 0 };
      });
      setDependenciesReport(initial);
    }
  }, []);

  // Если отчёт уже заполнен, показываем его в режиме просмотра
  useEffect(() => {
    if (todayReport) {
      const report = JSON.parse(todayReport);
      setDependenciesReport(report.dependencies || {});
      setSelectedActions(report.actions || []);
      setDayComment(report.comment || '');
    }
  }, [todayReport]);

  // Обработчик изменения зависимости
  const handleDependencyChange = (depKey, field, value) => {
    setDependenciesReport(prev => ({
      ...prev,
      [depKey]: { ...prev[depKey], [field]: value }
    }));
  };

  // Обработчик выбора действия (простой чекбокс)
  const handleActionToggle = (actionId) => {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(prev => prev.filter(id => id !== actionId));
    } else {
      setSelectedActions(prev => [...prev, actionId]);
    }
  };

  // Расчёт итоговых очков (Блок 6: Плюсы ×2, Минусы -1)
  const calculateDayScore = () => {
    let score = 0;
    
    // Минусы от зависимостей (-1 за каждое нарушение)
    Object.entries(dependenciesReport).forEach(([key, data]) => {
      if (data.violated) {
        const depParam = surveyData.depParams?.[key];
        const harm = depParam?.harm || 5;
        score -= harm; // Минус = вред зависимости
      }
    });
    
    // Плюсы от действий (×2 для каждого действия)
    selectedActions.forEach(actionId => {
      const action = POSITIVE_ACTIONS.find(a => a.id === actionId);
      score += (action?.points || 2) * 2; // ×2 для плюсовых действий
    });
    
    return score;
  };

  // Подтверждение отчёта
  const handleConfirmReport = () => {
    const dayScore = calculateDayScore();
    const report = {
      date: today,
      dependencies: dependenciesReport,
      actions: selectedActions,
      comment: dayComment,
      score: dayScore,
      timestamp: new Date().toISOString()
    };
    
    // Сохраняем отчёт (блокируем изменения)
    localStorage.setItem(`lenvpen_report_${user.telegram_id}_${today}`, JSON.stringify(report));
    
    // Обновляем общий прогресс
    const allReportsKey = `lenvpen_all_reports_${user.telegram_id}`;
    const allReports = JSON.parse(localStorage.getItem(allReportsKey) || '[]');
    allReports.push(report);
    localStorage.setItem(allReportsKey, JSON.stringify(allReports));
    
    setIsReportLocked(true);
    setShowConfirmModal(false);
    
    // Переходим на главную с обновлённым ленивцем
    setTimeout(() => navigate('/dashboard'), 500);
  };

  if (isReportLocked) {
    return (
      <div className="min-h-screen bg-lenvpen-bg flex flex-col items-center justify-center p-6">
        <div className="text-8xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold text-lenvpen-text mb-3">Отчёт за сегодня уже заполнен</h1>
        <p className="text-lenvpen-muted text-center max-w-md mb-8">
          Вы уже отправили отчёт за {new Date().toLocaleDateString('ru-RU')}. Изменить его нельзя.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-lenvpen-accent text-white px-8 py-3 rounded-xl font-semibold hover:bg-lenvpen-accent/90 transition-all"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lenvpen-bg pb-32 pt-20">
      {/* Шапка */}
      <div className="fixed top-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-b border-lenvpen-border z-20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-lenvpen-text">📋 Отчёт за день</h1>
            <span className="text-sm text-lenvpen-muted">{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 2-колоночный формат */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Колонка A: Вредные привычки */}
          <div className="space-y-4">
            <div className="bg-lenvpen-card/50 border-2 border-lenvpen-red/30 rounded-2xl p-4">
              <h2 className="text-xl font-bold text-lenvpen-text mb-1">❌ Вредные привычки</h2>
              <p className="text-sm text-lenvpen-muted">Сделал сегодня?</p>
            </div>

            {surveyData.dependencies?.length > 0 ? (
              <div className="space-y-3">
                {surveyData.dependencies.map(depKey => {
                  const depData = surveyData.depParams?.[depKey] || {};
                  return (
                    <div key={depKey} className="bg-lenvpen-card border border-lenvpen-border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🚬</span>
                        <h3 className="text-base font-bold text-lenvpen-text capitalize flex-1">{depKey}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDependencyChange(depKey, 'violated', false)}
                          disabled={isReportLocked}
                          className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                            !dependenciesReport[depKey]?.violated
                              ? 'bg-lenvpen-green text-white'
                              : 'bg-lenvpen-bg border border-lenvpen-border text-lenvpen-muted'
                          }`}
                        >
                          ✅ Нет
                        </button>
                        <button
                          onClick={() => handleDependencyChange(depKey, 'violated', true)}
                          disabled={isReportLocked}
                          className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                            dependenciesReport[depKey]?.violated
                              ? 'bg-lenvpen-red text-white'
                              : 'bg-lenvpen-bg border border-lenvpen-border text-lenvpen-muted'
                          }`}
                        >
                          ❌ Да
                        </button>
                      </div>

                      {dependenciesReport[depKey]?.violated && (
                        <div className="mt-3">
                          <input
                            type="number"
                            min="0"
                            value={dependenciesReport[depKey]?.amount || ''}
                            onChange={(e) => handleDependencyChange(depKey, 'amount', parseInt(e.target.value) || 0)}
                            placeholder="Сколько раз?"
                            disabled={isReportLocked}
                            className="w-full bg-lenvpen-bg border border-lenvpen-border rounded-lg px-3 py-2 text-sm text-lenvpen-text"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-lenvpen-card/50 border border-lenvpen-border rounded-xl p-6 text-center">
                <p className="text-lenvpen-muted text-sm">У вас нет выбранных зависимостей</p>
              </div>
            )}
          </div>

          {/* Колонка B: Плюсовые действия */}
          <div className="space-y-4">
            <div className="bg-lenvpen-card/50 border-2 border-lenvpen-accent/30 rounded-2xl p-4">
              <h2 className="text-xl font-bold text-lenvpen-text mb-1">✅ Плюсовые действия</h2>
              <p className="text-sm text-lenvpen-muted">Что полезного сделал?</p>
            </div>

            <div className="space-y-2">
              {POSITIVE_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleActionToggle(action.id)}
                  disabled={isReportLocked}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    selectedActions.includes(action.id)
                      ? 'bg-lenvpen-accent text-white shadow-lg shadow-lenvpen-accent/20'
                      : 'bg-lenvpen-card border border-lenvpen-border text-lenvpen-text hover:border-lenvpen-accent/50'
                  }`}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-base font-semibold flex-1 text-left">{action.label}</span>
                  {selectedActions.includes(action.id) && (
                    <span className="text-2xl">✅</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Комментарий дня */}
        <div className="bg-lenvpen-card border border-lenvpen-border rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-lenvpen-text mb-3">💭 Комментарий дня</h3>
          <textarea
            value={dayComment}
            onChange={(e) => setDayComment(e.target.value)}
            placeholder="Как прошёл день? (необязательно)"
            disabled={isReportLocked}
            className="w-full bg-lenvpen-bg border border-lenvpen-border rounded-xl px-4 py-3 text-lenvpen-text resize-none h-24"
          />
        </div>

        {/* Итог дня */}
        <div className="bg-gradient-to-br from-lenvpen-accent/10 to-lenvpen-card border-2 border-lenvpen-accent/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-lenvpen-text mb-4 text-center">📊 Итог дня</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-black text-lenvpen-red">
                {Object.values(dependenciesReport).filter(d => d.violated).length}
              </div>
              <div className="text-xs text-lenvpen-muted mt-1">Вредные</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-lenvpen-green">
                {selectedActions.length}
              </div>
              <div className="text-xs text-lenvpen-muted mt-1">Полезные</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-black ${calculateDayScore() >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                {calculateDayScore() >= 0 ? '+' : ''}{calculateDayScore()}%
              </div>
              <div className="text-xs text-lenvpen-muted mt-1">Изменение</div>
            </div>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isReportLocked}
            className="w-full py-4 rounded-xl font-bold text-lg bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all shadow-lg shadow-lenvpen-accent/20 disabled:opacity-50"
          >
            Подтвердить отчёт
          </button>
        </div>
      </div>

      {/* Модалка подтверждения */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-lenvpen-card border-2 border-lenvpen-accent rounded-3xl p-8 max-w-md w-full">
            <div className="text-6xl text-center mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-lenvpen-text text-center mb-4">
              Подтвердить отчёт?
            </h2>
            <p className="text-lenvpen-muted text-center mb-8">
              После подтверждения отчёт <span className="text-lenvpen-accent font-bold">нельзя будет изменить</span>. Проценты обновятся, и ленивец отреагирует на ваш день.
            </p>
            
            <div className="bg-lenvpen-bg rounded-xl p-4 mb-6">
              <div className="text-center">
                <div className={`text-4xl font-black mb-1 ${calculateDayScore() >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {calculateDayScore() >= 0 ? '+' : ''}{calculateDayScore()}%
                </div>
                <div className="text-sm text-lenvpen-muted">к общему прогрессу</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold bg-lenvpen-bg border border-lenvpen-border text-lenvpen-text hover:bg-lenvpen-card transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmReport}
                className="flex-1 py-3 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Версия */}
      <div className="fixed bottom-24 right-4">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DailyReportNew;
