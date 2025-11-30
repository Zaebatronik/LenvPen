import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import { analyzeDailyReport, calculateGoalImpact } from '../utils/dailyAnalyzer';
import { getReactionForEvent } from '../utils/slothBehavior';
import { calculateStreaks, getStreakReaction } from '../utils/streakSystem.jsx';
import DailyCalendar from '../components/DailyCalendar';

/**
 * БЛОК D - УЛУЧШЕННАЯ СИСТЕМА ОТЧЁТОВ ×300
 * Ленивец в центре / Полезные действия ↑ / Зависимости ↓
 */
function DailyReportEnhanced() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [dependencies, setDependencies] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Полезные действия (верхний блок)
  const [usefulActions, setUsefulActions] = useState({
    exercise: false,     // 🏋️ Тренировка
    walk: false,         // 🚶 Прогулка
    work: false,         // 💼 Работа / заработок
    cleaning: false,     // 🧹 Уборка
    learning: false,     // 📖 Обучение
    meditation: false,   // 🧘 Медитация
    social: false,       // ❤️ Социальные действия
    subgoal: false       // 🎯 Выполнена подцель
  });
  
  // Зависимости (нижний блок)
  const [dependencyValues, setDependencyValues] = useState({});
  
  // Дополнительные события
  const [additionalEvents, setAdditionalEvents] = useState({
    stress: false,
    temptation: false,
    conflict: false,
    achievement: false,
    triggerVictory: false
  });
  
  // Состояние ленивца
  const [slothState, setSlothState] = useState({
    emoji: '😐',
    message: 'Заполни отчёт, и я скажу, что думаю о твоём дне...',
    animation: 'none',
    progressDelta: 0
  });
  
  // Результаты
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [streaks, setStreaks] = useState(null);
  
  useEffect(() => {
    loadDependencies();
    loadStreaks();
  }, [user]);
  
  const loadDependencies = () => {
    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    if (!surveyData) {
      navigate('/survey');
      return;
    }
    
    const parsed = JSON.parse(surveyData);
    const deps = parsed.dependencies || [];
    setDependencies(deps);
    
    // Инициализация значений зависимостей
    const values = {};
    deps.forEach(dep => {
      values[dep] = {
        count: 0,
        resisted: false,
        exceeded: false
      };
    });
    setDependencyValues(values);
  };
  
  const loadStreaks = () => {
    const currentStreaks = calculateStreaks(user.telegram_id);
    setStreaks(currentStreaks);
  };
  
  // Обновление полезного действия
  const toggleUsefulAction = (action) => {
    setUsefulActions(prev => {
      const newState = { ...prev, [action]: !prev[action] };
      updateSlothReaction(newState, dependencyValues, additionalEvents);
      return newState;
    });
  };
  
  // Обновление зависимости
  const updateDependency = (dep, field, value) => {
    setDependencyValues(prev => {
      const newState = {
        ...prev,
        [dep]: { ...prev[dep], [field]: value }
      };
      updateSlothReaction(usefulActions, newState, additionalEvents);
      return newState;
    });
  };
  
  // Обновление дополнительного события
  const toggleEvent = (event) => {
    setAdditionalEvents(prev => {
      const newState = { ...prev, [event]: !prev[event] };
      updateSlothReaction(usefulActions, dependencyValues, newState);
      return newState;
    });
  };
  
  // ДИНАМИЧЕСКАЯ РЕАКЦИЯ ЛЕНИВЦА (в реальном времени)
  const updateSlothReaction = (useful, deps, events) => {
    // Подсчёт пользы
    const usefulCount = Object.values(useful).filter(Boolean).length;
    let totalUseful = usefulCount * 5;
    
    // Подсчёт вреда
    let totalHarm = 0;
    Object.values(deps).forEach(dep => {
      if (dep.exceeded) totalHarm += 10;
      if (dep.count > 0 && !dep.resisted) totalHarm += dep.count * 2;
    });
    
    // Дополнительные события
    if (events.stress) totalHarm += 3;
    if (events.conflict) totalHarm += 5;
    if (events.triggerVictory) totalUseful += 8;
    if (events.achievement) totalUseful += 10;
    
    // Дельта прогресса
    const delta = totalUseful - totalHarm;
    
    // Определяем реакцию
    let emoji = '😐';
    let message = 'Пока нейтрально...';
    let animation = 'none';
    
    if (delta >= 15) {
      emoji = '🔥';
      message = 'ДААА! Ты машина! Я танцую от радости!';
      animation = 'victory';
    } else if (delta >= 10) {
      emoji = '😎';
      message = 'Отлично! Продолжай в том же духе!';
      animation = 'sunglasses';
    } else if (delta >= 5) {
      emoji = '😊';
      message = 'Хорошо! Вижу прогресс!';
      animation = 'jump';
    } else if (delta >= -5) {
      emoji = '😐';
      message = 'Так себе день... можно лучше.';
      animation = 'none';
    } else if (delta >= -10) {
      emoji = '😟';
      message = 'Хм... не очень хорошо складывается.';
      animation = 'wave';
    } else {
      emoji = '😢';
      message = 'Я не выдержу таких эмоциональных американских горок…';
      animation = 'lie-down';
    }
    
    setSlothState({
      emoji,
      message,
      animation,
      progressDelta: delta
    });
  };
  
  // Отправка отчёта
  const handleSubmit = () => {
    const reportData = {
      date: new Date().toISOString(),
      dependencies: dependencyValues,
      usefulActions,
      additionalEvents,
      userId: user.telegram_id,
      progressDelta: slothState.progressDelta // Добавляем дельту прогресса
    };
    
    // Анализ
    const result = analyzeDailyReport(reportData);
    result.goalImpact = slothState.progressDelta; // Передаём дельту в анализ
    setAnalysis(result);
    
    // ВАЖНО: Обновляем общий прогресс пользователя
    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    if (surveyData) {
      const parsed = JSON.parse(surveyData);
      const currentProgress = 100 - (parsed.harmLevel || 0);
      const newProgress = Math.min(100, Math.max(0, currentProgress + slothState.progressDelta));
      
      // Обновляем harmLevel обратно из прогресса
      parsed.harmLevel = Math.max(0, 100 - newProgress);
      parsed.lastProgressUpdate = new Date().toISOString();
      localStorage.setItem(`lenvpen_survey_${user.telegram_id}`, JSON.stringify(parsed));
    }
    
    // Сохранение
    const today = new Date().toDateString();
    const reportKey = `lenvpen_daily_report_${user.telegram_id}_${today}`;
    localStorage.setItem(reportKey, JSON.stringify({
      ...reportData,
      analysis: result,
      timestamp: Date.now()
    }));
    
    // Добавление в историю
    const allReports = JSON.parse(localStorage.getItem(`lenvpen_all_reports_${user.telegram_id}`) || '[]');
    allReports.push(reportData);
    localStorage.setItem(`lenvpen_all_reports_${user.telegram_id}`, JSON.stringify(allReports));
    
    // Обновление streaks
    loadStreaks();
    
    setShowResults(true);
  };
  
  const usefulActionsConfig = [
    { key: 'exercise', icon: '🏋️', label: 'Тренировка', points: '+15' },
    { key: 'walk', icon: '🚶', label: 'Прогулка', points: '+10' },
    { key: 'work', icon: '💼', label: 'Работа / заработок', points: '+12' },
    { key: 'cleaning', icon: '🧹', label: 'Уборка', points: '+8' },
    { key: 'learning', icon: '📖', label: 'Обучение', points: '+15' },
    { key: 'meditation', icon: '🧘', label: 'Медитация', points: '+12' },
    { key: 'social', icon: '❤️', label: 'Социальные действия', points: '+10' },
    { key: 'subgoal', icon: '🎯', label: 'Выполнена подцель', points: '+20' }
  ];
  
  const eventConfig = [
    { key: 'stress', icon: '😰', label: 'Стресс', color: 'red' },
    { key: 'temptation', icon: '🍫', label: 'Соблазн', color: 'orange' },
    { key: 'conflict', icon: '💥', label: 'Конфликт', color: 'red' },
    { key: 'achievement', icon: '🏆', label: 'Достижение', color: 'green' },
    { key: 'triggerVictory', icon: '✨', label: 'Победа над триггером', color: 'green' }
  ];
  
  if (showCalendar) {
    return (
      <div className="min-h-screen bg-lenvpen-dark p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowCalendar(false)}
              className="flex items-center gap-2 text-lenvpen-orange hover:text-lenvpen-red transition-colors"
            >
              <span>←</span> Назад
            </button>
            <h2 className="text-xl font-bold text-lenvpen-text">Календарь отчётов</h2>
            <div className="w-16"></div>
          </div>
          
          <DailyCalendar 
            userId={user.telegram_id}
            onSelectDay={(date) => {
              console.log('Selected day:', date);
              setShowCalendar(false);
            }}
          />
        </div>
      </div>
    );
  }
  
  if (showResults && analysis) {
    return (
      <div className="min-h-screen bg-lenvpen-dark p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Реакция ленивца */}
          <div className="card text-center border-2 border-lenvpen-orange bg-gradient-to-br from-lenvpen-orange/10 to-lenvpen-red/10">
            <div className={`text-9xl mb-4 sloth-animation-${slothState.animation}`}>
              {slothState.emoji}
            </div>
            <div className="mb-4">
              <div className="text-4xl font-black mb-1">
                <span className={slothState.progressDelta >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}>
                  {slothState.progressDelta > 0 ? '+' : ''}{slothState.progressDelta}%
                </span>
              </div>
              <p className="text-sm text-lenvpen-muted">
                {slothState.progressDelta > 0 ? 'Прогресс вырос!' : slothState.progressDelta < 0 ? 'Прогресс снизился' : 'Без изменений'}
              </p>
            </div>
            <p className="text-lg text-lenvpen-text italic">
              "{analysis.comment}"
            </p>
          </div>
          
          {/* Streaks */}
          {streaks && (
            <div className="card space-y-3">
              <h3 className="text-lg font-bold text-lenvpen-orange">🔥 Твои серии</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(streaks).map(([type, count]) => {
                  if (count === 0) return null;
                  const reaction = getStreakReaction(type, count);
                  return (
                    <div key={type} className={`p-3 rounded-lg ${reaction.celebrate ? 'bg-lenvpen-orange/20 border-2 border-lenvpen-orange' : 'bg-lenvpen-bg'}`}>
                      <div className="text-2xl font-bold text-lenvpen-orange">{count}</div>
                      <div className="text-sm text-lenvpen-text">{reaction.message}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Влияние на прогресс */}
          <div className="card bg-gradient-to-br from-lenvpen-orange/5 to-lenvpen-red/5">
            <h3 className="text-lg font-bold text-lenvpen-orange mb-3">⚡ Влияние на общий прогресс</h3>
            <div className="bg-lenvpen-bg rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lenvpen-muted text-sm">Прогресс до отчёта:</span>
                <span className="text-lenvpen-text font-bold">
                  {(() => {
                    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
                    if (surveyData) {
                      const parsed = JSON.parse(surveyData);
                      return Math.max(0, 100 - (parsed.harmLevel || 0));
                    }
                    return 0;
                  })()}%
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lenvpen-muted text-sm">Изменение:</span>
                <span className={`font-black text-lg ${slothState.progressDelta >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {slothState.progressDelta > 0 ? '+' : ''}{slothState.progressDelta}%
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-lenvpen-border">
                <span className="text-lenvpen-text font-semibold">Новый прогресс:</span>
                <span className="text-lenvpen-orange font-black text-xl">
                  {(() => {
                    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
                    if (surveyData) {
                      const parsed = JSON.parse(surveyData);
                      const current = Math.max(0, 100 - (parsed.harmLevel || 0));
                      return Math.min(100, Math.max(0, current + slothState.progressDelta));
                    }
                    return slothState.progressDelta;
                  })()}%
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-lenvpen-muted text-center">
              💡 Dashboard обновится автоматически при следующем входе
            </div>
          </div>
          
          {/* Анализ */}
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-lenvpen-text">📊 Детали дня</h3>
            
            {analysis.improvements.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-lenvpen-green mb-2">✅ Улучшения:</h4>
                <ul className="space-y-1">
                  {analysis.improvements.map((item, idx) => (
                    <li key={idx} className="text-lenvpen-text text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.concerns.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-lenvpen-red mb-2">⚠️ Проблемы:</h4>
                <ul className="space-y-1">
                  {analysis.concerns.map((item, idx) => (
                    <li key={idx} className="text-lenvpen-text text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full text-lg py-4"
          >
            🏠 На главную
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-lenvpen-dark">
      {/* Header */}
      <div className="sticky top-0 bg-lenvpen-dark/95 backdrop-blur-md border-b border-lenvpen-border/50 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-lenvpen-orange hover:text-lenvpen-red transition-colors"
            >
              🏠
            </button>
            <h1 className="text-xl font-bold text-lenvpen-orange">
              Отчёт дня
            </h1>
            <button
              onClick={() => setShowCalendar(true)}
              className="text-lenvpen-orange hover:text-lenvpen-red transition-colors"
            >
              📅
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* ═══ ПОЛЕЗНЫЕ ДЕЙСТВИЯ ↑ ═══ */}
        <div className="card space-y-4">
          <h2 className="text-xl font-bold text-lenvpen-green flex items-center gap-2">
            <span>↑</span> Полезные действия
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {usefulActionsConfig.map(action => (
              <button
                key={action.key}
                onClick={() => toggleUsefulAction(action.key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  usefulActions[action.key]
                    ? 'bg-lenvpen-green/20 border-lenvpen-green scale-95'
                    : 'bg-lenvpen-bg border-lenvpen-border hover:border-lenvpen-green/50'
                }`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="text-sm text-lenvpen-text font-semibold">{action.label}</div>
                <div className="text-xs text-lenvpen-green">{action.points}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* ═══ ЛЕНИВЕЦ В ЦЕНТРЕ 🦥 ═══ */}
        <div className="card bg-gradient-to-br from-lenvpen-orange/10 to-lenvpen-red/10 border-2 border-lenvpen-orange text-center py-8">
          <div className={`text-9xl mb-4 sloth-animation-${slothState.animation}`}>
            {slothState.emoji}
          </div>
          <div className="text-3xl font-black mb-2">
            <span className={slothState.progressDelta >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}>
              {slothState.progressDelta > 0 ? '+' : ''}{slothState.progressDelta}%
            </span>
          </div>
          <p className="text-lenvpen-text italic px-4 mb-4">
            "{slothState.message}"
          </p>
          
          {/* Формула расчёта */}
          <div className="mt-4 pt-4 border-t border-lenvpen-orange/30">
            <div className="text-xs text-lenvpen-muted mb-2">📊 Формула влияния</div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-lenvpen-green font-bold">
                Польза: {(() => {
                  const usefulCount = Object.values(usefulActions).filter(Boolean).length;
                  let total = usefulCount * 5;
                  if (additionalEvents.triggerVictory) total += 8;
                  if (additionalEvents.achievement) total += 10;
                  return total;
                })()}
              </span>
              <span className="text-lenvpen-muted">−</span>
              <span className="text-lenvpen-red font-bold">
                Вред: {(() => {
                  let total = 0;
                  Object.values(dependencyValues).forEach(dep => {
                    if (dep.exceeded) total += 10;
                    if (dep.count > 0 && !dep.resisted) total += dep.count * 2;
                  });
                  if (additionalEvents.stress) total += 3;
                  if (additionalEvents.conflict) total += 5;
                  return total;
                })()}
              </span>
              <span className="text-lenvpen-muted">=</span>
              <span className={`font-black ${slothState.progressDelta >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                {slothState.progressDelta > 0 ? '+' : ''}{slothState.progressDelta}
              </span>
            </div>
          </div>
        </div>
        
        {/* ═══ ЗАВИСИМОСТИ ↓ ═══ */}
        <div className="card space-y-4">
          <h2 className="text-xl font-bold text-lenvpen-red flex items-center gap-2">
            <span>↓</span> Зависимости
          </h2>
          
          {dependencies.length > 0 ? dependencies.map((dep, idx) => (
            <div key={idx} className="bg-lenvpen-bg rounded-xl p-4 space-y-3">
              <h3 className="text-lg font-semibold text-lenvpen-text">{dep}</h3>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-lenvpen-muted flex-1">
                  Количество (сигареты/порции/часы):
                </label>
                <input
                  type="number"
                  min="0"
                  value={dependencyValues[dep]?.count || 0}
                  onChange={(e) => updateDependency(dep, 'count', parseInt(e.target.value) || 0)}
                  className="w-20 bg-lenvpen-card text-lenvpen-text rounded-lg p-2 text-center"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => updateDependency(dep, 'resisted', !dependencyValues[dep]?.resisted)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    dependencyValues[dep]?.resisted
                      ? 'bg-lenvpen-green text-white'
                      : 'bg-lenvpen-border text-lenvpen-muted'
                  }`}
                >
                  ✅ Удержался
                </button>
                <button
                  onClick={() => updateDependency(dep, 'exceeded', !dependencyValues[dep]?.exceeded)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    dependencyValues[dep]?.exceeded
                      ? 'bg-lenvpen-red text-white'
                      : 'bg-lenvpen-border text-lenvpen-muted'
                  }`}
                >
                  ⚠️ Превышение
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center text-lenvpen-muted py-4">
              Нет зависимостей для отслеживания
            </div>
          )}
        </div>
        
        {/* ═══ ДОПОЛНИТЕЛЬНЫЕ СОБЫТИЯ ═══ */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-lenvpen-text">💭 Дополнительные события</h2>
          <div className="flex flex-wrap gap-2">
            {eventConfig.map(event => (
              <button
                key={event.key}
                onClick={() => toggleEvent(event.key)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  additionalEvents[event.key]
                    ? `bg-lenvpen-${event.color}/20 border-lenvpen-${event.color}`
                    : 'bg-lenvpen-bg border-lenvpen-border'
                }`}
              >
                <span className="text-xl mr-2">{event.icon}</span>
                <span className="text-sm text-lenvpen-text">{event.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="btn-primary w-full text-lg py-4"
        >
          🎯 Сохранить отчёт
        </button>
        
      </div>
      
      <div className="text-center py-4">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DailyReportEnhanced;
