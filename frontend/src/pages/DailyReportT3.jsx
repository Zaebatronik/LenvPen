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
  const [reportExists, setReportExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Блок A - Краткий итог дня
  const [dayStatus, setDayStatus] = useState(''); // 'win' | 'normal' | 'fail'
  const [dayComment, setDayComment] = useState('');
  
  // Блок B - Главная цель
  const [goalProgress, setGoalProgress] = useState(5); // 0-10
  const [goalNote, setGoalNote] = useState('');
  
  // Зависимости из опросника
  const [dependencies, setDependencies] = useState([]);
  const [dependencyLimits, setDependencyLimits] = useState({});
  const [dependencyValues, setDependencyValues] = useState({});
  const [dependencyNotes, setDependencyNotes] = useState({});
  
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
    checkExistingReport();
    loadUserData();
  }, [user]);
  
  useEffect(() => {
    calculateSummary();
  }, [dependencyValues, positiveActions, goalProgress]);
  
  const checkExistingReport = () => {
    // Проверка неизменяемости: отчёт за эту дату уже существует?
    const existingReport = localStorage.getItem(`lenvpen_daily_report_${user.telegram_id}_${currentDate}`);
    if (existingReport) {
      setReportExists(true);
    }
  };
  
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
    const notes = {};
    deps.forEach(dep => {
      limits[dep] = dependencyConfig[dep]?.defaultLimit || 0;
      values[dep] = 0;
      notes[dep] = '';
    });
    setDependencyLimits(limits);
    setDependencyValues(values);
    setDependencyNotes(notes);
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
    
    // Вклад главной цели (goalProgress 0-10 → 0-4%)
    const goalBonus = (goalProgress / 10) * 4;
    
    // Негативное влияние зависимостей (по формуле T3)
    let negativeTotal = 0;
    let dependencyDetails = [];
    
    dependencies.forEach(dep => {
      const config = dependencyConfig[dep];
      const limit = dependencyLimits[dep] || 0;
      const actual = dependencyValues[dep] || 0;
      
      if (actual > limit) {
        const excess = actual - limit;
        const harm = excess * (config?.harmPerUnit || 1);
        negativeTotal += harm;
        
        dependencyDetails.push({
          name: config?.name,
          excess,
          harm: parseFloat(harm.toFixed(1))
        });
      }
    });
    
    const dayResult = positiveTotal + goalBonus - negativeTotal;
    
    setSummary({
      positiveTotal: parseFloat(positiveTotal.toFixed(1)),
      goalBonus: parseFloat(goalBonus.toFixed(1)),
      negativeTotal: parseFloat(negativeTotal.toFixed(1)),
      dayResult: parseFloat(dayResult.toFixed(1)),
      dependencyDetails
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
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Проверка валидности
    if (!dayStatus) {
      alert('Выберите общий итог дня (Победа/Нормально/Провал)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Обновление прогресса по формуле T3
      const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`));
      const currentProgress = 100 - (surveyData.harmLevel || 50);
      const newProgress = Math.max(0, Math.min(100, currentProgress + summary.dayResult));
      surveyData.harmLevel = Math.max(0, 100 - newProgress);
      localStorage.setItem(`lenvpen_survey_${user.telegram_id}`, JSON.stringify(surveyData));
      
      // Формирование отчёта (immutable format)
      const reportData = {
        version: 'T3_v1',
        date: currentDate,
        user_id: user.telegram_id,
        
        // Блок A - Краткий итог
        dayStatus,
        dayComment,
        
        // Блок B - Главная цель
        goalProgress,
        goalNote,
        
        // Блок C - Зависимости
        dependencyLogs: dependencies.map(dep => ({
          dependency: dep,
          limit: dependencyLimits[dep],
          actual: dependencyValues[dep],
          note: dependencyNotes[dep],
          slip: dependencyValues[dep] > dependencyLimits[dep],
          harm: getHarmAmount(dep)
        })),
        
        // Блок D - Полезные действия
        positiveActions: positiveActions.filter(a => a.done).map(a => ({
          id: a.id,
          name: a.name,
          weight: a.weight
        })),
        
        // Итоги
        summary: {
          ...summary,
          progressBefore: currentProgress,
          progressAfter: newProgress
        },
        
        slothState,
        
        // Метаданные
        timestamp: new Date().toISOString(),
        immutable: true,
        edited: false
      };
      
      // НЕИЗМЕНЯЕМОСТЬ: проверка перед сохранением
      const existingReport = localStorage.getItem(`lenvpen_daily_report_${user.telegram_id}_${currentDate}`);
      if (existingReport) {
        alert('Отчёт за эту дату уже существует и не может быть изменён.');
        setIsSubmitting(false);
        return;
      }
      
      // Сохранение отчёта (immutable)
      localStorage.setItem(
        `lenvpen_daily_report_${user.telegram_id}_${currentDate}`, 
        JSON.stringify(reportData)
      );
      
      // Обновление индекса отчётов
      const reportsIndex = JSON.parse(localStorage.getItem(`lenvpen_reports_index_${user.telegram_id}`) || '[]');
      if (!reportsIndex.includes(currentDate)) {
        reportsIndex.push(currentDate);
        reportsIndex.sort();
        localStorage.setItem(`lenvpen_reports_index_${user.telegram_id}`, JSON.stringify(reportsIndex));
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Ошибка при сохранении отчёта');
      setIsSubmitting(false);
    }
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
            
            {summary.goalBonus > 0 && (
              <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lenvpen-muted">Шаг к цели</span>
                  <span className="text-2xl font-bold text-lenvpen-green">+{summary.goalBonus}%</span>
                </div>
              </div>
            )}
            
            {summary.negativeTotal > 0 && (
              <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lenvpen-muted">Вред от зависимостей</span>
                    <span className="text-2xl font-bold text-lenvpen-red">-{summary.negativeTotal}%</span>
                  </div>
                </div>
                {summary.dependencyDetails && summary.dependencyDetails.length > 0 && (
                  <div className="space-y-1 pt-3 border-t border-lenvpen-border/10">
                    {summary.dependencyDetails.map((detail, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-lenvpen-muted">{detail.name}</span>
                        <span className="text-lenvpen-red">-{detail.harm}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-gradient-to-br from-lenvpen-card/50 to-lenvpen-card/30 border-2 border-lenvpen-orange/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-lenvpen-text">Итог дня</span>
                <span className={`text-3xl font-bold ${summary.dayResult >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {summary.dayResult >= 0 ? '+' : ''}{summary.dayResult}%
                </span>
              </div>
              <div className="text-xs text-lenvpen-muted pt-3 border-t border-lenvpen-border/10">
                {summary.positiveTotal > 0 && <span>+{summary.positiveTotal} полезное </span>}
                {summary.goalBonus > 0 && <span>+{summary.goalBonus} цель </span>}
                {summary.negativeTotal > 0 && <span>-{summary.negativeTotal} вред</span>}
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
  
  // Если отчёт уже существует - показать экран с блокировкой
  if (reportExists) {
    return (
      <div className="min-h-screen bg-lenvpen-dark flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-lenvpen-text mb-2">
              Отчёт уже существует
            </h1>
          </div>
          
          <div className="bg-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border/30 mb-6">
            <p className="text-lenvpen-text/80 leading-relaxed mb-4">
              Отчёт за <span className="font-bold text-lenvpen-orange">{currentDate}</span> уже был сохранён и не может быть изменён.
            </p>
            <p className="text-sm text-lenvpen-muted">
              Это правило неизменяемости — оно защищает честность вашей истории. Если нужна корректировка, обратитесь в поддержку.
            </p>
          </div>
          
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
            <h1 className="text-lg font-bold text-lenvpen-text">Отчёт за {currentDate}</h1>
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
        {/* Подсказка о неизменяемости */}
        <div className="bg-lenvpen-orange/10 border border-lenvpen-orange/30 rounded-xl p-4">
          <p className="text-sm text-lenvpen-text/80 text-center">
            ⚠️ Один отчёт в день — сохраняется навсегда. Заполни честно.
          </p>
        </div>
        
        {/* БЛОК A — КРАТКИЙ ИТОГ ДНЯ */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-lenvpen-text mb-1">Итог дня</h2>
            <p className="text-sm text-lenvpen-muted">Как прошёл день в целом?</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setDayStatus('win')}
              className={`p-4 rounded-xl border-2 transition-all ${
                dayStatus === 'win'
                  ? 'bg-lenvpen-green/20 border-lenvpen-green'
                  : 'bg-lenvpen-card/30 border-lenvpen-border/20 hover:border-lenvpen-border/40'
              }`}
            >
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm font-semibold text-lenvpen-text">Победа</div>
            </button>
            
            <button
              onClick={() => setDayStatus('normal')}
              className={`p-4 rounded-xl border-2 transition-all ${
                dayStatus === 'normal'
                  ? 'bg-lenvpen-orange/20 border-lenvpen-orange'
                  : 'bg-lenvpen-card/30 border-lenvpen-border/20 hover:border-lenvpen-border/40'
              }`}
            >
              <div className="text-3xl mb-2">😐</div>
              <div className="text-sm font-semibold text-lenvpen-text">Нормально</div>
            </button>
            
            <button
              onClick={() => setDayStatus('fail')}
              className={`p-4 rounded-xl border-2 transition-all ${
                dayStatus === 'fail'
                  ? 'bg-lenvpen-red/20 border-lenvpen-red'
                  : 'bg-lenvpen-card/30 border-lenvpen-border/20 hover:border-lenvpen-border/40'
              }`}
            >
              <div className="text-3xl mb-2">😔</div>
              <div className="text-sm font-semibold text-lenvpen-text">Провал</div>
            </button>
          </div>
          
          <textarea
            value={dayComment}
            onChange={(e) => setDayComment(e.target.value)}
            placeholder="Краткий комментарий (необязательно)..."
            className="w-full px-4 py-3 rounded-xl bg-lenvpen-card/50 border border-lenvpen-border/30 text-lenvpen-text placeholder-lenvpen-muted focus:outline-none focus:border-lenvpen-orange resize-none"
            rows="2"
          />
        </div>
        
        {/* БЛОК B — ГЛАВНАЯ ЦЕЛЬ */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-lenvpen-text mb-1">Главная цель</h2>
            <p className="text-sm text-lenvpen-muted">Сделал шаг к цели сегодня?</p>
          </div>
          
          <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5">
            <div className="mb-4">
              <label className="text-sm text-lenvpen-muted block mb-3">
                Оценка прогресса (0 — ничего, 10 — отличный шаг)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={goalProgress}
                  onChange={(e) => setGoalProgress(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-lenvpen-dark rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FF6B35 0%, #FF6B35 ${goalProgress * 10}%, #1a1a1a ${goalProgress * 10}%, #1a1a1a 100%)`
                  }}
                />
                <span className="text-2xl font-bold text-lenvpen-orange w-12 text-center">
                  {goalProgress}
                </span>
              </div>
            </div>
            
            <textarea
              value={goalNote}
              onChange={(e) => setGoalNote(e.target.value)}
              placeholder="Что сделал для цели? (необязательно)"
              className="w-full px-4 py-3 rounded-lg bg-lenvpen-dark border border-lenvpen-border/30 text-lenvpen-text placeholder-lenvpen-muted focus:outline-none focus:border-lenvpen-orange resize-none"
              rows="2"
            />
          </div>
        </div>
        
        {/* БЛОК C — ЗАВИСИМОСТИ */}
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
                    
                    <div className="flex items-center gap-4 mb-3">
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
                    
                    <textarea
                      value={dependencyNotes[dep] || ''}
                      onChange={(e) => setDependencyNotes(prev => ({ ...prev, [dep]: e.target.value }))}
                      placeholder="Заметка (контекст, причина...)"
                      className="w-full px-3 py-2 rounded-lg bg-lenvpen-dark/50 border border-lenvpen-border/20 text-lenvpen-text text-sm placeholder-lenvpen-muted/50 focus:outline-none focus:border-lenvpen-orange/50 resize-none"
                      rows="1"
                    />
                    
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
          <h2 className="text-lg font-bold text-lenvpen-text mb-4">Предпросмотр итога</h2>
          
          {/* Ленивец */}
          <div className="text-center mb-6 p-6 bg-lenvpen-dark/50 rounded-xl border border-lenvpen-border/10">
            <div className={`text-6xl mb-3 ${slothState.animation}`}>{slothState.emoji}</div>
            <p className={`text-base font-semibold ${slothState.color}`}>
              {slothState.message}
            </p>
          </div>
          
          {/* Формула расчёта */}
          <div className="bg-lenvpen-dark/50 rounded-xl p-5 mb-4 border border-lenvpen-border/10">
            <div className="text-xs text-lenvpen-muted mb-3 uppercase tracking-wide">Расчёт по формуле T3:</div>
            <div className="space-y-2 text-sm">
              {summary.positiveTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-lenvpen-text/70">Полезные действия</span>
                  <span className="font-bold text-lenvpen-green">+{summary.positiveTotal}%</span>
                </div>
              )}
              
              {summary.goalBonus > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-lenvpen-text/70">Прогресс к цели</span>
                  <span className="font-bold text-lenvpen-green">+{summary.goalBonus}%</span>
                </div>
              )}
              
              {summary.negativeTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-lenvpen-text/70">Вред зависимостей</span>
                  <span className="font-bold text-lenvpen-red">-{summary.negativeTotal}%</span>
                </div>
              )}
            </div>
            
            <div className="h-px bg-lenvpen-border/20 my-3"></div>
            
            <div className="flex items-center justify-between">
              <span className="font-bold text-lenvpen-text">Итого за день</span>
              <span className={`text-2xl font-bold ${summary.dayResult >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                {summary.dayResult >= 0 ? '+' : ''}{summary.dayResult}%
              </span>
            </div>
          </div>
          
          {/* Подсказка */}
          <div className="bg-lenvpen-orange/5 border border-lenvpen-orange/20 rounded-lg p-3">
            <p className="text-xs text-lenvpen-text/60 text-center">
              💡 Это предварительный расчёт. Финальные проценты обновятся после сохранения.
            </p>
          </div>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="fixed bottom-0 left-0 right-0 bg-lenvpen-dark/98 backdrop-blur-xl border-t border-lenvpen-border/30 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !dayStatus}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              isSubmitting || !dayStatus
                ? 'bg-lenvpen-card/50 text-lenvpen-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white hover:shadow-lg hover:shadow-lenvpen-orange/20'
            }`}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить отчёт (неизменяемый)'}
          </button>
          {!dayStatus && (
            <p className="text-xs text-lenvpen-red text-center mt-2">
              Выберите общий итог дня для продолжения
            </p>
          )}
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
