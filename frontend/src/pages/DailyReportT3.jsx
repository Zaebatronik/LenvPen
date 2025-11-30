import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import DailyCalendar from '../components/DailyCalendar';

/**
 * T3 — СТРУКТУРА ВВОДА ДАННЫХ ПОЛЬЗОВАТЕЛЯ v3.7
 * Блок 1: Зависимости (отрицательные действия)
 * Блок 2: Полезные действия (плюсы)
 * Блок 3: Итог дня (автоматическая сводка)
 */
function DailyReportT3() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Зависимости из опросника
  const [dependencies, setDependencies] = useState([]);
  const [dependencyLimits, setDependencyLimits] = useState({});
  const [dependencyValues, setDependencyValues] = useState({});
  
  // Полезные действия
  const [positiveActions, setPositiveActions] = useState([
    { id: 'gym', name: 'Тренировка', emoji: '🏋️', weight: 2.0, done: false },
    { id: 'work', name: 'Работа/Заработок', emoji: '💼', weight: 2.5, done: false },
    { id: 'learning', name: 'Обучение', emoji: '📖', weight: 2.0, done: false },
    { id: 'walk', name: 'Прогулка', emoji: '🚶', weight: 1.0, done: false },
    { id: 'cleaning', name: 'Уборка', emoji: '🧹', weight: 1.0, done: false },
    { id: 'water', name: 'Пил воду 2л+', emoji: '💧', weight: 0.5, done: false },
    { id: 'sleep', name: 'Сон по графику', emoji: '😴', weight: 1.5, done: false },
    { id: 'meditation', name: 'Медитация', emoji: '🧘', weight: 1.5, done: false },
    { id: 'reading', name: 'Чтение', emoji: '📚', weight: 1.0, done: false },
    { id: 'social', name: 'Социальные шаги', emoji: '❤️', weight: 1.0, done: false },
    { id: 'nosocial', name: 'День без соцсетей', emoji: '🚫', weight: 2.0, done: false },
    { id: 'subgoal', name: 'Выполнена подцель', emoji: '🎯', weight: 3.0, done: false }
  ]);
  
  // Состояние ленивца
  const [slothState, setSlothState] = useState({
    emoji: '😐',
    message: 'Заполни отчёт дня, и я скажу, что думаю...',
    animation: '',
    color: 'text-lenvpen-text'
  });
  
  // Итоги
  const [summary, setSummary] = useState({
    positiveTotal: 0,
    negativeTotal: 0,
    dayResult: 0
  });
  
  const [showResults, setShowResults] = useState(false);
  
  // Конфигурация зависимостей
  const dependencyConfig = {
    smoking: { name: 'Курение', emoji: '🚬', unit: 'сигарет', defaultLimit: 3, harmPerUnit: 0.8 },
    alcohol: { name: 'Алкоголь', emoji: '🍺', unit: 'порций', defaultLimit: 0, harmPerUnit: 1.2 },
    sugar: { name: 'Сахар/Сладкое', emoji: '🍬', unit: 'порций', defaultLimit: 2, harmPerUnit: 0.5 },
    gambling: { name: 'Азартные игры', emoji: '🎰', unit: 'часов', defaultLimit: 0, harmPerUnit: 2.0 },
    gaming: { name: 'Видеоигры', emoji: '🎮', unit: 'часов', defaultLimit: 2, harmPerUnit: 0.6 },
    socialmedia: { name: 'Соцсети', emoji: '📱', unit: 'часов', defaultLimit: 2, harmPerUnit: 0.4 },
    porn: { name: 'Порно', emoji: '🔞', unit: 'раз', defaultLimit: 0, harmPerUnit: 1.5 },
    fastfood: { name: 'Фастфуд', emoji: '🍔', unit: 'раз', defaultLimit: 1, harmPerUnit: 0.7 }
  };
  
  useEffect(() => {
    loadUserData();
  }, [user]);
  
  useEffect(() => {
    calculateSummary();
  }, [dependencyValues, positiveActions]);
  
  const loadUserData = () => {
    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    if (!surveyData) {
      navigate('/survey');
      return;
    }
    
    const parsed = JSON.parse(surveyData);
    const deps = parsed.dependencies || [];
    setDependencies(deps);
    
    // Инициализация лимитов и значений
    const limits = {};
    const values = {};
    deps.forEach(dep => {
      limits[dep] = dependencyConfig[dep]?.defaultLimit || 0;
      values[dep] = 0;
    });
    setDependencyLimits(limits);
    setDependencyValues(values);
  };
  
  const updateDependencyValue = (dep, value) => {
    setDependencyValues(prev => ({
      ...prev,
      [dep]: Math.max(0, parseInt(value) || 0)
    }));
  };
  
  const togglePositiveAction = (id) => {
    setPositiveActions(prev => 
      prev.map(action => 
        action.id === id ? { ...action, done: !action.done } : action
      )
    );
  };
  
  const calculateSummary = () => {
    // Позитивные действия
    const positiveTotal = positiveActions
      .filter(a => a.done)
      .reduce((sum, a) => sum + a.weight, 0);
    
    // Негативное влияние зависимостей
    let negativeTotal = 0;
    dependencies.forEach(dep => {
      const config = dependencyConfig[dep];
      const limit = dependencyLimits[dep] || 0;
      const actual = dependencyValues[dep] || 0;
      
      if (actual > limit) {
        const excess = actual - limit;
        negativeTotal += excess * (config?.harmPerUnit || 1);
      }
    });
    
    const dayResult = positiveTotal - negativeTotal;
    
    setSummary({
      positiveTotal: parseFloat(positiveTotal.toFixed(1)),
      negativeTotal: parseFloat(negativeTotal.toFixed(1)),
      dayResult: parseFloat(dayResult.toFixed(1))
    });
    
    updateSlothReaction(dayResult, positiveTotal, negativeTotal);
  };
  
  const updateSlothReaction = (dayResult, positive, negative) => {
    let emoji, message, animation, color;
    
    if (dayResult >= 5) {
      emoji = '🔥';
      message = 'Превосходно! Я чувствую себя чемпионом!';
      animation = 'animate-bounce';
      color = 'text-lenvpen-orange';
    } else if (dayResult >= 3) {
      emoji = '😎';
      message = 'Отличный день! Так держать!';
      animation = 'animate-pulse';
      color = 'text-lenvpen-green';
    } else if (dayResult >= 1) {
      emoji = '🙂';
      message = 'Неплохо! Есть прогресс!';
      animation = '';
      color = 'text-lenvpen-green';
    } else if (dayResult >= -1) {
      emoji = '😐';
      message = 'Средне... Можно лучше';
      animation = '';
      color = 'text-lenvpen-text';
    } else if (dayResult >= -3) {
      emoji = '😕';
      message = 'Не очень... Надо подтянуться';
      animation = '';
      color = 'text-lenvpen-orange';
    } else {
      emoji = '😢';
      message = 'Брат... Что-то пошло не так...';
      animation = '';
      color = 'text-lenvpen-red';
    }
    
    setSlothState({ emoji, message, animation, color });
  };
  
  const getStatusColor = (dep) => {
    const limit = dependencyLimits[dep] || 0;
    const actual = dependencyValues[dep] || 0;
    
    if (actual <= limit) return 'border-lenvpen-green bg-lenvpen-green/5';
    if (actual <= limit + 2) return 'border-lenvpen-orange bg-lenvpen-orange/5';
    return 'border-lenvpen-red bg-lenvpen-red/5';
  };
  
  const getStatusIcon = (dep) => {
    const limit = dependencyLimits[dep] || 0;
    const actual = dependencyValues[dep] || 0;
    
    if (actual <= limit) return '✓';
    if (actual <= limit + 2) return '⚠';
    return '🔥';
  };
  
  const getHarmAmount = (dep) => {
    const config = dependencyConfig[dep];
    const limit = dependencyLimits[dep] || 0;
    const actual = dependencyValues[dep] || 0;
    
    if (actual <= limit) return 0;
    
    const excess = actual - limit;
    return parseFloat((excess * (config?.harmPerUnit || 1)).toFixed(1));
  };
  
  const handleSubmit = () => {
    // Обновление прогресса
    const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`));
    const currentProgress = 100 - (surveyData.harmLevel || 50);
    const newProgress = Math.max(0, Math.min(100, currentProgress + summary.dayResult));
    surveyData.harmLevel = Math.max(0, 100 - newProgress);
    localStorage.setItem(`lenvpen_survey_${user.telegram_id}`, JSON.stringify(surveyData));
    
    // Сохранение отчёта
    const reportData = {
      date: currentDate,
      dependencies: dependencies.map(dep => ({
        name: dep,
        limit: dependencyLimits[dep],
        actual: dependencyValues[dep],
        harm: getHarmAmount(dep)
      })),
      positiveActions: positiveActions.filter(a => a.done).map(a => ({
        name: a.name,
        weight: a.weight
      })),
      summary: {
        ...summary,
        progressBefore: currentProgress,
        progressAfter: newProgress
      },
      slothState,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`lenvpen_daily_report_${user.telegram_id}_${currentDate}`, JSON.stringify(reportData));
    
    setShowResults(true);
  };
  
  if (showCalendar) {
    return (
      <DailyCalendar 
        onClose={() => setShowCalendar(false)}
        userId={user.telegram_id}
      />
    );
  }
  
  if (showResults) {
    return (
      <div className="min-h-screen bg-lenvpen-dark">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-lenvpen-text mb-2">Отчёт сохранён</h1>
            <p className="text-lenvpen-muted">Результаты дня обработаны</p>
          </div>
          
          {/* Sloth reaction */}
          <div className="bg-lenvpen-card/50 rounded-2xl p-8 border border-lenvpen-border/30 mb-6">
            <div className="text-center">
              <div className={`text-7xl mb-4 ${slothState.animation}`}>{slothState.emoji}</div>
              <p className={`text-xl font-semibold ${slothState.color} mb-2`}>
                {slothState.message}
              </p>
            </div>
          </div>
          
          {/* Summary */}
          <div className="space-y-4 mb-8">
            <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lenvpen-muted">Полезные действия</span>
                <span className="text-2xl font-bold text-lenvpen-green">+{summary.positiveTotal}%</span>
              </div>
            </div>
            
            <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lenvpen-muted">Вред от зависимостей</span>
                <span className="text-2xl font-bold text-lenvpen-red">-{summary.negativeTotal}%</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-lenvpen-card/50 to-lenvpen-card/30 border-2 border-lenvpen-orange/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-lenvpen-text">Итог дня</span>
                <span className={`text-3xl font-bold ${summary.dayResult >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {summary.dayResult >= 0 ? '+' : ''}{summary.dayResult}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 px-6 rounded-xl font-semibold transition-all bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white hover:shadow-lg"
            >
              Вернуться на главную
            </button>
            
            <button
              onClick={() => setShowCalendar(true)}
              className="w-full py-3.5 px-6 rounded-xl font-semibold transition-all bg-lenvpen-card/50 text-lenvpen-text border border-lenvpen-border/30 hover:bg-lenvpen-card/80"
            >
              📅 Посмотреть календарь
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-lenvpen-dark pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-lenvpen-dark/98 backdrop-blur-xl border-b border-lenvpen-border/30 z-20">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-lenvpen-muted hover:text-lenvpen-text transition-colors"
            >
              ← Назад
            </button>
            <h1 className="text-lg font-bold text-lenvpen-text">Отчёт дня</h1>
            <button
              onClick={() => setShowCalendar(true)}
              className="text-lenvpen-orange hover:text-lenvpen-red transition-colors"
            >
              📅
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
        {/* БЛОК 1 — ЗАВИСИМОСТИ */}
        {dependencies.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-lenvpen-text mb-1">Зависимости</h2>
              <p className="text-sm text-lenvpen-muted">Отметь фактическое потребление</p>
            </div>
            
            <div className="space-y-3">
              {dependencies.map(dep => {
                const config = dependencyConfig[dep];
                if (!config) return null;
                
                const limit = dependencyLimits[dep] || 0;
                const actual = dependencyValues[dep] || 0;
                const harm = getHarmAmount(dep);
                
                return (
                  <div
                    key={dep}
                    className={`border-2 rounded-xl p-5 transition-all ${getStatusColor(dep)}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{config.emoji}</span>
                        <div>
                          <h3 className="font-bold text-lenvpen-text">{config.name}</h3>
                          <p className="text-xs text-lenvpen-muted">
                            Цель: ≤ {limit} {config.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-2xl">{getStatusIcon(dep)}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-lenvpen-muted block mb-2">
                          Сегодня ({config.unit}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={actual}
                          onChange={(e) => updateDependencyValue(dep, e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-lenvpen-dark border border-lenvpen-border/30 text-lenvpen-text font-bold text-lg focus:outline-none focus:border-lenvpen-orange"
                          placeholder="0"
                        />
                      </div>
                      
                      {harm > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-lenvpen-muted mb-1">Влияние</div>
                          <div className="text-xl font-bold text-lenvpen-red">-{harm}%</div>
                        </div>
                      )}
                    </div>
                    
                    {actual > limit && (
                      <div className="mt-3 pt-3 border-t border-lenvpen-border/20">
                        <p className="text-xs text-lenvpen-red">
                          {actual <= limit + 2 ? '⚠️ Небольшое превышение' : '🔥 Красная зона — значительное превышение'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* БЛОК 2 — ПОЛЕЗНЫЕ ДЕЙСТВИЯ */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-lenvpen-text mb-1">Полезные действия</h2>
            <p className="text-sm text-lenvpen-muted">Отметь выполненные сегодня</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {positiveActions.map(action => (
              <button
                key={action.id}
                onClick={() => togglePositiveAction(action.id)}
                className={`p-5 rounded-xl border-2 transition-all text-left ${
                  action.done
                    ? 'bg-lenvpen-green/10 border-lenvpen-green'
                    : 'bg-lenvpen-card/30 border-lenvpen-border/20 hover:border-lenvpen-border/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{action.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-lenvpen-text">{action.name}</h3>
                      <p className="text-xs text-lenvpen-muted">+{action.weight}%</p>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    action.done
                      ? 'bg-lenvpen-green border-lenvpen-green'
                      : 'border-lenvpen-border/30'
                  }`}>
                    {action.done && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* БЛОК 3 — ИТОГ ДНЯ */}
        <div className="bg-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border/30">
          <h2 className="text-lg font-bold text-lenvpen-text mb-4">Итог дня</h2>
          
          {/* Ленивец */}
          <div className="text-center mb-6 p-6 bg-lenvpen-dark/50 rounded-xl">
            <div className={`text-6xl mb-3 ${slothState.animation}`}>{slothState.emoji}</div>
            <p className={`text-base font-semibold ${slothState.color}`}>
              {slothState.message}
            </p>
          </div>
          
          {/* Расчёт */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-lenvpen-muted">Полезные действия</span>
              <span className="text-lg font-bold text-lenvpen-green">+{summary.positiveTotal}%</span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-lenvpen-muted">Вред зависимостей</span>
              <span className="text-lg font-bold text-lenvpen-red">-{summary.negativeTotal}%</span>
            </div>
            
            <div className="h-px bg-lenvpen-border/30"></div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-lg font-bold text-lenvpen-text">ИТОГО</span>
              <span className={`text-2xl font-bold ${summary.dayResult >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                {summary.dayResult >= 0 ? '+' : ''}{summary.dayResult}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="fixed bottom-0 left-0 right-0 bg-lenvpen-dark/98 backdrop-blur-xl border-t border-lenvpen-border/30 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white hover:shadow-lg hover:shadow-lenvpen-orange/20"
          >
            Сохранить отчёт
          </button>
        </div>
      </div>
      
      {/* Version */}
      <div className="text-center py-3">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION} • T3</span>
      </div>
    </div>
  );
}

export default DailyReportT3;
