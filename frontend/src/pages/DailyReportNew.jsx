import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';

/**
 * DAILY REPORT T3 — Структурированный отчёт дня
 * 3 секции: Зависимости, Позитивные действия, Комментарий
 * С окном подтверждения и блокировкой после отправки
 */

// Позитивные действия для выбора
const POSITIVE_ACTIONS = [
  { id: 'sport', label: '🏃 Спорт', icon: '🏃' },
  { id: 'work', label: '💼 Работа', icon: '💼' },
  { id: 'study', label: '📚 Учёба', icon: '📚' },
  { id: 'sleep', label: '😴 Сон', icon: '😴' },
  { id: 'order', label: '🧹 Порядок', icon: '🧹' },
  { id: 'social', label: '👥 Социальное', icon: '👥' }
];

const INTENSITY_LEVELS = [
  { value: 'low', label: 'Низкая', points: 1, color: 'bg-lenvpen-muted' },
  { value: 'medium', label: 'Средняя', points: 2, color: 'bg-lenvpen-accent' },
  { value: 'high', label: 'Высокая', points: 3, color: 'bg-lenvpen-green' }
];

function DailyReportNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1=Зависимости, 2=Действия, 3=Комментарий, 4=Подтверждение
  
  // Получаем данные пользователя
  const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
  const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');
  
  // Проверяем, заполнен ли уже отчёт за сегодня
  const today = new Date().toISOString().split('T')[0];
  const todayReport = localStorage.getItem(`lenvpen_report_${user.telegram_id}_${today}`);
  const [isReportLocked, setIsReportLocked] = useState(!!todayReport);
  
  // Состояния для 3 секций
  const [dependenciesReport, setDependenciesReport] = useState({});
  const [selectedActions, setSelectedActions] = useState([]);
  const [actionsIntensity, setActionsIntensity] = useState({});
  const [customAction, setCustomAction] = useState('');
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
      setActionsIntensity(report.intensity || {});
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

  // Обработчик выбора действия
  const handleActionToggle = (actionId) => {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(prev => prev.filter(id => id !== actionId));
      setActionsIntensity(prev => {
        const newIntensity = { ...prev };
        delete newIntensity[actionId];
        return newIntensity;
      });
    } else {
      setSelectedActions(prev => [...prev, actionId]);
      setActionsIntensity(prev => ({ ...prev, [actionId]: 'medium' }));
    }
  };

  // Добавление кастомного действия
  const handleAddCustomAction = () => {
    if (customAction.trim()) {
      const customId = `custom_${Date.now()}`;
      setSelectedActions(prev => [...prev, customId]);
      setActionsIntensity(prev => ({ ...prev, [customId]: 'medium' }));
      POSITIVE_ACTIONS.push({ id: customId, label: customAction, icon: '✨' });
      setCustomAction('');
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
        score -= harm; // Минус -1 (вред влияет на размер минуса)
      }
    });
    
    // Плюсы от действий (×2 для всех плюсов)
    selectedActions.forEach(actionId => {
      const intensity = actionsIntensity[actionId] || 'medium';
      const level = INTENSITY_LEVELS.find(l => l.value === intensity);
      score += level.points * 2; // ×2 для плюсовых действий
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
      intensity: actionsIntensity,
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

  // Навигация по шагам
  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else setShowConfirmModal(true);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (isReportLocked && !showConfirmModal) {
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
    <div className="min-h-screen bg-lenvpen-bg pb-24">
      {/* Шапка с прогрессом */}
      <div className="sticky top-0 bg-lenvpen-card/95 backdrop-blur-md border-b border-lenvpen-border z-20">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-lenvpen-text">Отчёт дня</h1>
            <span className="text-sm text-lenvpen-muted">Шаг {currentStep} из 3</span>
          </div>
          <div className="h-2 bg-lenvpen-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-lenvpen-accent transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Шаг 1: Зависимости */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-lenvpen-text mb-2">Зависимости</h2>
              <p className="text-lenvpen-muted">Отметьте, что произошло сегодня</p>
            </div>

            {surveyData.dependencies?.length > 0 ? (
              <div className="space-y-4">
                {surveyData.dependencies.map(depKey => {
                  const depData = surveyData.depParams?.[depKey] || {};
                  return (
                    <div key={depKey} className="bg-lenvpen-card border border-lenvpen-border rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🚬</span>
                        <h3 className="text-lg font-bold text-lenvpen-text capitalize">{depKey}</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-lenvpen-muted block mb-2">
                            Нарушили сегодня?
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleDependencyChange(depKey, 'violated', false)}
                              className={`py-3 rounded-xl font-semibold transition-all ${
                                !dependenciesReport[depKey]?.violated
                                  ? 'bg-lenvpen-green text-white'
                                  : 'bg-lenvpen-card border border-lenvpen-border text-lenvpen-text'
                              }`}
                            >
                              ✅ Нет
                            </button>
                            <button
                              onClick={() => handleDependencyChange(depKey, 'violated', true)}
                              className={`py-3 rounded-xl font-semibold transition-all ${
                                dependenciesReport[depKey]?.violated
                                  ? 'bg-lenvpen-red text-white'
                                  : 'bg-lenvpen-card border border-lenvpen-border text-lenvpen-text'
                              }`}
                            >
                              ❌ Да
                            </button>
                          </div>
                        </div>

                        {dependenciesReport[depKey]?.violated && (
                          <div>
                            <label className="text-sm text-lenvpen-muted block mb-2">
                              Сколько раз? (необязательно)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={dependenciesReport[depKey]?.amount || ''}
                              onChange={(e) => handleDependencyChange(depKey, 'amount', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full bg-lenvpen-bg border border-lenvpen-border rounded-xl px-4 py-3 text-lenvpen-text"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-lenvpen-card/50 border border-lenvpen-border rounded-2xl p-8 text-center">
                <p className="text-lenvpen-muted">У вас нет выбранных зависимостей</p>
              </div>
            )}
          </div>
        )}

        {/* Шаг 2: Позитивные действия */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-lenvpen-text mb-2">Позитивные действия</h2>
              <p className="text-lenvpen-muted">Что полезного сделали сегодня?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {POSITIVE_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleActionToggle(action.id)}
                  className={`p-4 rounded-xl transition-all ${
                    selectedActions.includes(action.id)
                      ? 'bg-lenvpen-accent text-white shadow-lg shadow-lenvpen-accent/20'
                      : 'bg-lenvpen-card border border-lenvpen-border text-lenvpen-text hover:border-lenvpen-accent/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <div className="text-sm font-semibold">{action.label.replace(/[^\w\s]/gi, '')}</div>
                </button>
              ))}
            </div>

            {/* Кастомное действие */}
            <div>
              <label className="text-sm text-lenvpen-muted block mb-2">Добавить своё действие</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  placeholder="Например: Медитация"
                  className="flex-1 bg-lenvpen-card border border-lenvpen-border rounded-xl px-4 py-3 text-lenvpen-text"
                />
                <button
                  onClick={handleAddCustomAction}
                  className="bg-lenvpen-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-lenvpen-accent/90"
                >
                  Добавить
                </button>
              </div>
            </div>

            {/* Интенсивность для выбранных действий */}
            {selectedActions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-lenvpen-text">Интенсивность</h3>
                {selectedActions.map(actionId => {
                  const action = POSITIVE_ACTIONS.find(a => a.id === actionId);
                  return (
                    <div key={actionId} className="bg-lenvpen-card border border-lenvpen-border rounded-xl p-4">
                      <div className="text-sm font-semibold text-lenvpen-text mb-3">
                        {action?.icon} {action?.label.replace(/[^\w\s]/gi, '')}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {INTENSITY_LEVELS.map(level => (
                          <button
                            key={level.value}
                            onClick={() => setActionsIntensity(prev => ({ ...prev, [actionId]: level.value }))}
                            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                              actionsIntensity[actionId] === level.value
                                ? `${level.color} text-white`
                                : 'bg-lenvpen-bg text-lenvpen-muted border border-lenvpen-border'
                            }`}
                          >
                            {level.label} (+{level.points}%)
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Шаг 3: Комментарий дня */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-lenvpen-text mb-2">Комментарий дня</h2>
              <p className="text-lenvpen-muted">Необязательно, но полезно для истории</p>
            </div>

            <textarea
              value={dayComment}
              onChange={(e) => setDayComment(e.target.value)}
              placeholder="Сегодня был хороший день, я чувствую прогресс..."
              className="w-full bg-lenvpen-card border border-lenvpen-border rounded-xl px-4 py-4 text-lenvpen-text resize-none h-32"
            />

            <div className="bg-lenvpen-card/50 border border-lenvpen-accent/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-lenvpen-text mb-4">Итог дня:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-lenvpen-muted">Зависимости (нарушено):</span>
                  <span className="text-lenvpen-red font-bold">
                    {Object.values(dependenciesReport).filter(d => d.violated).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lenvpen-muted">Позитивные действия:</span>
                  <span className="text-lenvpen-green font-bold">{selectedActions.length}</span>
                </div>
                <div className="border-t border-lenvpen-border pt-3 flex justify-between items-center">
                  <span className="text-lenvpen-text font-semibold">Изменение процента:</span>
                  <span className={`text-2xl font-black ${calculateDayScore() >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                    {calculateDayScore() >= 0 ? '+' : ''}{calculateDayScore()}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Навигация */}
      <div className="fixed bottom-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-t border-lenvpen-border p-6">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-6 rounded-xl font-semibold bg-lenvpen-bg border border-lenvpen-border text-lenvpen-text hover:bg-lenvpen-card transition-all"
            >
              ← Назад
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all shadow-lg shadow-lenvpen-accent/20"
          >
            {currentStep === 3 ? 'Подтвердить отчёт' : 'Далее →'}
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
      <div className="fixed bottom-20 right-4">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DailyReportNew;
