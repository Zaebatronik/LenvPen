import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';

// 11 зависимостей по Block B
const DEPENDENCIES_FULL = [
  { key: 'smoking', icon: '🚬', title: 'Курение' },
  { key: 'alcohol', icon: '🍺', title: 'Алкоголь' },
  { key: 'phone', icon: '📱', title: 'Телефон / Соцсети' },
  { key: 'gaming', icon: '🎮', title: 'Азартные игры / Гейминг' },
  { key: 'overeating', icon: '🍔', title: 'Переедание / Джанк-фуд' },
  { key: 'porn', icon: '🔞', title: 'П*рно / Мастурбация' },
  { key: 'procrastination', icon: '⏰', title: 'Прокрастинация' },
  { key: 'sleep', icon: '😴', title: 'Режим сна' },
  { key: 'impulse_spending', icon: '💸', title: 'Импульсивные траты' },
  { key: 'laziness', icon: '🦥', title: 'Лень общая' },
  { key: 'other', icon: '❓', title: 'Другое' }
];

function SurveyNew() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [step, setStep] = useState(0); // 0 = intro
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [depDetails, setDepDetails] = useState({}); // Уточняющие ответы по каждой зависимости
  const [priorities, setPriorities] = useState([]); // Топ-3
  const [harmLevel, setHarmLevel] = useState(0); // Общий уровень вреда 0-100
  const [complexity, setComplexity] = useState(''); // лёгкая / средняя / адская
  const [mainGoal, setMainGoal] = useState(''); // Главная цель
  const [saving, setSaving] = useState(false);

  // Расчёт динамической шкалы вреда
  useEffect(() => {
    if (Object.keys(depDetails).length > 0) {
      calculateHarmLevel();
    }
  }, [depDetails]);

  const calculateHarmLevel = () => {
    let totalHarm = 0;
    let count = 0;
    
    Object.keys(depDetails).forEach(key => {
      const detail = depDetails[key];
      // Простая формула для примера
      if (key === 'smoking' && detail.cigarettes) {
        totalHarm += Math.min((detail.cigarettes / 40) * 100, 100);
        count++;
      }
      if (key === 'alcohol' && detail.frequency) {
        const freqMap = { 'daily': 100, 'few_week': 70, 'weekends': 40, 'monthly': 20 };
        totalHarm += freqMap[detail.frequency] || 0;
        count++;
      }
      // ... добавить для остальных
    });
    
    const avgHarm = count > 0 ? Math.round(totalHarm / count) : 0;
    setHarmLevel(avgHarm);
    
    // Определение сложности
    if (avgHarm >= 70) setComplexity('адская');
    else if (avgHarm >= 40) setComplexity('средняя');
    else setComplexity('лёгкая');
  };

  const handleNext = () => {
    // После приоритетов (selectedDeps.length + 2) переход к главной цели
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleDependencyToggle = (key) => {
    if (selectedDeps.includes(key)) {
      setSelectedDeps(selectedDeps.filter(k => k !== key));
      // Удалить детали
      const newDetails = { ...depDetails };
      delete newDetails[key];
      setDepDetails(newDetails);
    } else {
      setSelectedDeps([...selectedDeps, key]);
    }
  };

  const updateDetail = (depKey, field, value) => {
    setDepDetails(prev => ({
      ...prev,
      [depKey]: {
        ...prev[depKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const surveyData = {
        dependencies: selectedDeps,
        depDetails,
        priorities,
        harmLevel,
        complexity,
        mainGoal: mainGoal.trim() || 'Не задана',
        completed_at: new Date().toISOString()
      };
      
      localStorage.setItem(`lenvpen_survey_${user.telegram_id}`, JSON.stringify(surveyData));
      console.log('Block B survey saved:', surveyData);
      
      // TODO: POST /api/profile/me/dependencies
      
      setTimeout(() => {
        // Перенаправляем на экраны объяснения после завершения опроса
        navigate('/explanation');
      }, 500);
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentDepForDetails = () => {
    const index = step - 2; // Шаг 2+ это детали зависимостей
    return selectedDeps[index];
  };

  // Рендер уточняющих вопросов для конкретной зависимости
  const renderDependencyQuestions = (depKey) => {
    const dep = DEPENDENCIES_FULL.find(d => d.key === depKey);
    const details = depDetails[depKey] || {};

    switch(depKey) {
      case 'smoking':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько сигарет в день куришь?</label>
              <input
                type="number"
                min="0"
                max="100"
                value={details.cigarettes || ''}
                onChange={(e) => updateDetail(depKey, 'cigarettes', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Цель?</label>
              <select
                value={details.goal || ''}
                onChange={(e) => updateDetail(depKey, 'goal', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              >
                <option value="">Выбери</option>
                <option value="reduce">Снизить</option>
                <option value="quit">Полностью бросить</option>
              </select>
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько лет куришь?</label>
              <input
                type="number"
                min="0"
                max="50"
                value={details.years || ''}
                onChange={(e) => updateDetail(depKey, 'years', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
          </div>
        );

      case 'alcohol':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Как часто пьёшь?</label>
              <select
                value={details.frequency || ''}
                onChange={(e) => updateDetail(depKey, 'frequency', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              >
                <option value="">Выбери</option>
                <option value="daily">Каждый день</option>
                <option value="few_week">Пару раз в неделю</option>
                <option value="weekends">По выходным</option>
                <option value="monthly">Раз в месяц</option>
              </select>
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько употребляешь за раз?</label>
              <input
                type="text"
                value={details.amount || ''}
                onChange={(e) => updateDetail(depKey, 'amount', e.target.value)}
                placeholder="Например: 3-4 бутылки пива"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Были ли «завязки» до этого?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateDetail(depKey, 'had_quit', 'yes')}
                  className={`flex-1 p-3 rounded-lg ${details.had_quit === 'yes' ? 'bg-lenvpen-orange text-white' : 'bg-lenvpen-card text-lenvpen-text'}`}
                >
                  Да
                </button>
                <button
                  onClick={() => updateDetail(depKey, 'had_quit', 'no')}
                  className={`flex-1 p-3 rounded-lg ${details.had_quit === 'no' ? 'bg-lenvpen-orange text-white' : 'bg-lenvpen-card text-lenvpen-text'}`}
                >
                  Нет
                </button>
              </div>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько часов в день в телефоне?</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={details.hours || ''}
                onChange={(e) => updateDetail(depKey, 'hours', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Какие соцсети жрут время?</label>
              <input
                type="text"
                value={details.apps || ''}
                onChange={(e) => updateDetail(depKey, 'apps', e.target.value)}
                placeholder="Например: YouTube, TikTok, Instagram"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Какая цель?</label>
              <select
                value={details.goal || ''}
                onChange={(e) => updateDetail(depKey, 'goal', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              >
                <option value="">Выбери</option>
                <option value="reduce">Уменьшить</option>
                <option value="limit">Ограничить до N часов</option>
              </select>
            </div>
          </div>
        );

      case 'gaming':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько играешь в день? (часов)</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={details.hours || ''}
                onChange={(e) => updateDetail(depKey, 'hours', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Какие игры?</label>
              <input
                type="text"
                value={details.games || ''}
                onChange={(e) => updateDetail(depKey, 'games', e.target.value)}
                placeholder="Например: CS:GO, Dota 2"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Игры мешают работе/жизни?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateDetail(depKey, 'interferes', 'yes')}
                  className={`flex-1 p-3 rounded-lg ${details.interferes === 'yes' ? 'bg-lenvpen-red text-white' : 'bg-lenvpen-card text-lenvpen-text'}`}
                >
                  Да
                </button>
                <button
                  onClick={() => updateDetail(depKey, 'interferes', 'no')}
                  className={`flex-1 p-3 rounded-lg ${details.interferes === 'no' ? 'bg-lenvpen-orange text-white' : 'bg-lenvpen-card text-lenvpen-text'}`}
                >
                  Нет
                </button>
              </div>
            </div>
          </div>
        );

      case 'overeating':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Что именно чаще всего?</label>
              <select
                value={details.type || ''}
                onChange={(e) => updateDetail(depKey, 'type', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              >
                <option value="">Выбери</option>
                <option value="fastfood">Фастфуд</option>
                <option value="sweets">Сладкое</option>
                <option value="everything">Всё подряд</option>
              </select>
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько раз в день переедаешь?</label>
              <input
                type="number"
                min="0"
                max="10"
                value={details.times_per_day || ''}
                onChange={(e) => updateDetail(depKey, 'times_per_day', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Есть цель по весу?</label>
              <input
                type="text"
                value={details.weight_goal || ''}
                onChange={(e) => updateDetail(depKey, 'weight_goal', e.target.value)}
                placeholder="Например: сбросить 10 кг"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
          </div>
        );

      case 'porn':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Как часто?</label>
              <select
                value={details.frequency || ''}
                onChange={(e) => updateDetail(depKey, 'frequency', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              >
                <option value="">Выбери</option>
                <option value="daily">Раз в день</option>
                <option value="few_daily">Несколько раз в день</option>
                <option value="weekly">Раз в неделю</option>
              </select>
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Цель?</label>
              <select
                value={details.goal || ''}
                onChange={(e) => updateDetail(depKey, 'goal', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              >
                <option value="">Выбери</option>
                <option value="reduce">Сократить</option>
                <option value="quit">Полностью отказаться</option>
              </select>
            </div>
          </div>
        );

      case 'procrastination':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Из-за чего чаще всего откладываешь?</label>
              <textarea
                value={details.reason || ''}
                onChange={(e) => updateDetail(depKey, 'reason', e.target.value)}
                rows={3}
                placeholder="Например: лень, страх неудачи, отвлекаюсь на телефон"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg resize-none"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Насколько сильно это мешает? (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={details.severity || 5}
                onChange={(e) => updateDetail(depKey, 'severity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-lenvpen-orange text-xl">{details.severity || 5}/10</div>
            </div>
          </div>
        );

      case 'sleep':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Когда ложишься?</label>
              <input
                type="time"
                value={details.bed_time || ''}
                onChange={(e) => updateDetail(depKey, 'bed_time', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Когда просыпаешься?</label>
              <input
                type="time"
                value={details.wake_time || ''}
                onChange={(e) => updateDetail(depKey, 'wake_time', e.target.value)}
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Чувствуешь усталость?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateDetail(depKey, 'tired', 'yes')}
                  className={`flex-1 p-3 rounded-lg ${details.tired === 'yes' ? 'bg-lenvpen-red text-white' : 'bg-lenvpen-card text-lenvpen-text'}`}
                >
                  Да
                </button>
                <button
                  onClick={() => updateDetail(depKey, 'tired', 'no')}
                  className={`flex-1 p-3 rounded-lg ${details.tired === 'no' ? 'bg-lenvpen-orange text-white' : 'bg-lenvpen-card text-lenvpen-text'}`}
                >
                  Нет
                </button>
              </div>
            </div>
          </div>
        );

      case 'impulse_spending':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">На что тратишь?</label>
              <input
                type="text"
                value={details.on_what || ''}
                onChange={(e) => updateDetail(depKey, 'on_what', e.target.value)}
                placeholder="Например: одежда, гаджеты, еда"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Сколько лишнего в месяц?</label>
              <input
                type="number"
                min="0"
                value={details.amount_monthly || ''}
                onChange={(e) => updateDetail(depKey, 'amount_monthly', parseInt(e.target.value) || 0)}
                placeholder="В рублях"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
          </div>
        );

      case 'laziness':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Что не можешь заставить себя делать?</label>
              <textarea
                value={details.what || ''}
                onChange={(e) => updateDetail(depKey, 'what', e.target.value)}
                rows={3}
                placeholder="Например: убираться, заниматься спортом, учиться"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg resize-none"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Какой идеальный сценарий?</label>
              <textarea
                value={details.ideal || ''}
                onChange={(e) => updateDetail(depKey, 'ideal', e.target.value)}
                rows={3}
                placeholder="Например: делать всё вовремя, быть продуктивным"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg resize-none"
              />
            </div>
          </div>
        );

      case 'other':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-lenvpen-text flex items-center gap-3">
              {dep.icon} {dep.title}
            </h3>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Название зависимости</label>
              <input
                type="text"
                value={details.name || ''}
                onChange={(e) => updateDetail(depKey, 'name', e.target.value)}
                placeholder="Например: шоппинг, переписки"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">В чём проявляется?</label>
              <textarea
                value={details.manifestation || ''}
                onChange={(e) => updateDetail(depKey, 'manifestation', e.target.value)}
                rows={3}
                placeholder="Опиши, как это влияет на твою жизнь"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg resize-none"
              />
            </div>
            
            <div>
              <label className="text-lenvpen-muted block mb-2">Цель</label>
              <input
                type="text"
                value={details.goal || ''}
                onChange={(e) => updateDetail(depKey, 'goal', e.target.value)}
                placeholder="Что хочешь изменить?"
                className="w-full p-3 bg-lenvpen-card text-lenvpen-text rounded-lg"
              />
            </div>
          </div>
        );

      default:
        return <div className="text-lenvpen-muted">Нет вопросов для этой зависимости</div>;
    }
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark p-4 relative overflow-hidden">
      {/* Декоративный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-60 h-60 bg-lenvpen-orange/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-lenvpen-red/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Сонный аватар ленивца вверху */}
        {step > 0 && (
          <div className="text-center mb-4">
            <div className="inline-block relative">
              <div className="w-20 h-20 rounded-full bg-lenvpen-card/50 flex items-center justify-center">
                <span className="text-5xl opacity-60">🦥</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-lenvpen-orange/50 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lenvpen-muted text-sm mt-2">Сейчас мы узнаем, где ты себе враг</p>
          </div>
        )}

        {/* Прогресс */}
        {step > 0 && (
          <div className="mb-6">
            <div className="h-2 bg-lenvpen-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red transition-all duration-300"
                style={{ width: `${(step / (selectedDeps.length + 3)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Шаг 0: Intro */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lenvpen-orange/20 to-lenvpen-red/20 border-4 border-lenvpen-orange/30 flex items-center justify-center shadow-2xl mx-auto">
              <span className="text-8xl">🦥</span>
            </div>
            
            <h2 className="text-3xl font-bold text-lenvpen-text leading-tight">
              Ладно, герой.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lenvpen-orange to-lenvpen-red">
                Сейчас мы проведём мини-раскопки.
              </span>
            </h2>
            
            <div className="bg-lenvpen-card/60 backdrop-blur-sm rounded-2xl p-6 text-left space-y-3">
              <p className="text-lenvpen-text text-lg">
                Ты честно отвечаешь — мы честно показываем, насколько всё плохо.
              </p>
              <p className="text-lenvpen-muted">
                Не переживай. <span className="text-lenvpen-orange font-semibold">Плохо — это нормально.</span>
                <br />
                Оставить всё как есть — ненормально.
              </p>
            </div>
            
            <button
              onClick={handleNext}
              className="btn-primary text-xl py-5 px-8 shadow-2xl shadow-lenvpen-red/30 transform transition-all hover:scale-105 active:scale-95"
            >
              Погнали 🚀
            </button>
          </div>
        )}

        {/* Шаг 1: Выбор зависимостей */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              Выбирай свои зависимости
            </h2>
            <p className="text-lenvpen-muted text-sm">
              Выбирай честно. Чем меньше выберешь — тем хуже совесть, но лучше статистика.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {DEPENDENCIES_FULL.map(dep => (
                <button
                  key={dep.key}
                  onClick={() => handleDependencyToggle(dep.key)}
                  className={`p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    selectedDeps.includes(dep.key)
                      ? 'bg-gradient-to-br from-lenvpen-orange via-lenvpen-red to-lenvpen-orange text-white shadow-xl shadow-lenvpen-orange/50 animate-pulse'
                      : 'bg-gradient-to-br from-lenvpen-card to-lenvpen-bg text-lenvpen-text hover:shadow-lg hover:border-lenvpen-orange/30 border-2 border-transparent'
                  }`}
                >
                  <div className="text-4xl sm:text-5xl mb-2 transition-transform ${
                    selectedDeps.includes(dep.key) ? 'scale-110' : ''
                  }">{dep.icon}</div>
                  <div className="text-xs sm:text-sm font-semibold">{dep.title}</div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Назад
              </button>
              <button 
                onClick={handleNext} 
                disabled={selectedDeps.length === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Дальше ({selectedDeps.length})
              </button>
            </div>
          </div>
        )}

        {/* Шаги 2+: Уточняющие вопросы по каждой зависимости */}
        {step >= 2 && step < selectedDeps.length + 2 && (
          <div className="space-y-6">
            {renderDependencyQuestions(getCurrentDepForDetails())}
            
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Назад
              </button>
              <button onClick={handleNext} className="btn-primary flex-1">
                Дальше
              </button>
            </div>
          </div>
        )}

        {/* Шкала вреда и приоритетность */}
        {step === selectedDeps.length + 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              Расставь приоритеты
            </h2>
            <p className="text-lenvpen-muted">
              Окей. Что жрёт тебя больше всего? Расставь по местам.
            </p>
            
            {/* Динамическая шкала вреда */}
            <div className="bg-lenvpen-card/60 backdrop-blur-sm rounded-2xl p-6 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-lenvpen-muted">Текущий уровень вреда:</span>
                  <span className="text-lenvpen-red font-bold text-xl">{harmLevel}/100</span>
                </div>
                <div className="h-3 bg-lenvpen-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red"
                    style={{ width: `${harmLevel}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-lenvpen-muted block">Сложность пути:</span>
                  <span className="text-lenvpen-orange font-semibold capitalize">{complexity}</span>
                </div>
                <div>
                  <span className="text-lenvpen-muted block">Потенциал улучшения:</span>
                  <span className="text-lenvpen-orange font-semibold">{100 - harmLevel}/100</span>
                </div>
              </div>
            </div>
            
            {/* Выбор топ-3 */}
            <div className="space-y-3">
              <p className="text-lenvpen-muted text-sm">Выбери топ-3 проблемы (нажми по порядку):</p>
              <div className="grid grid-cols-1 gap-2">
                {selectedDeps.map(key => {
                  const dep = DEPENDENCIES_FULL.find(d => d.key === key);
                  const priorityIndex = priorities.indexOf(key);
                  const isPriority = priorityIndex !== -1;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (isPriority) {
                          setPriorities(priorities.filter(p => p !== key));
                        } else if (priorities.length < 3) {
                          setPriorities([...priorities, key]);
                        }
                      }}
                      className={`p-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                        isPriority
                          ? 'bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white'
                          : 'bg-lenvpen-card text-lenvpen-text hover:bg-lenvpen-bg'
                      }`}
                    >
                      {isPriority && (
                        <span className="w-8 h-8 bg-white text-lenvpen-red rounded-full flex items-center justify-center font-bold">
                          {priorityIndex + 1}
                        </span>
                      )}
                      <span className="text-2xl">{dep.icon}</span>
                      <span className="flex-1">{dep.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Назад
              </button>
              <button 
                onClick={handleNext}
                disabled={priorities.length === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Дальше
              </button>
            </div>
          </div>
        )}

        {/* Шаг: Главная цель */}
        {step === selectedDeps.length + 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              Главная цель
            </h2>
            <p className="text-lenvpen-muted">
              Куда ты идёшь? Что хочешь получить в итоге?
            </p>
            
            <div>
              <label className="text-lenvpen-text block mb-2 font-medium">
                Напиши свою главную цель
              </label>
              <textarea
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                rows={4}
                placeholder="Например: Бросить курить и начать заниматься спортом"
                className="w-full p-4 bg-lenvpen-card text-lenvpen-text rounded-lg border border-lenvpen-orange/20 focus:border-lenvpen-orange outline-none transition-colors resize-none"
              />
            </div>
            
            <div className="bg-lenvpen-card/60 backdrop-blur-sm rounded-2xl p-6">
              <p className="text-lenvpen-text text-sm italic">
                💡 Совет: Чем конкретнее цель — тем проще к ней идти.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Назад
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Завершить'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Версия */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <span className="text-lenvpen-text/40 text-xs font-medium">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default SurveyNew;
