import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import { DEPENDENCIES } from '../config/constants';

function DailyReport() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userDependencies, setUserDependencies] = useState([]);
  
  // Form state - новый формат C3/O3
  const [goalProgress, setGoalProgress] = useState(5);
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [comment, setComment] = useState('');
  const [depValues, setDepValues] = useState({}); // { dep_key: { value, slip } }

  useEffect(() => {
    loadUserDependencies();
  }, []);

  const loadUserDependencies = async () => {
    try {
      // TODO: Load from Supabase via GET /api/profile/me/dependencies
      // For now, load from localStorage survey data
      const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
      if (surveyData) {
        const parsed = JSON.parse(surveyData);
        const deps = parsed.dependencies || [];
        setUserDependencies(deps.map(key => ({
          id: key, // temp id, will be replaced with real UUID
          key,
          ...DEPENDENCIES[key]
        })));
        
        // Initialize dep values
        const initialValues = {};
        deps.forEach(key => {
          initialValues[key] = {
            value: getInitialValue(key),
            slip: false
          };
        });
        setDepValues(initialValues);
      }
      setLoading(false);
    } catch (error) {
      console.error('Load dependencies error:', error);
      setLoading(false);
    }
  };

  const getInitialValue = (depKey) => {
    switch (depKey) {
      case 'smoking': return { smoked: 0 };
      case 'phone': return { hours: 0 };
      case 'alcohol': return { drinks: 0 };
      case 'gaming': return { hours: 0 };
      case 'overeating': return { overate: false };
      case 'procrastination': return { hours: 0 };
      case 'drugs': return { used: false };
      default: return { value: 0 };
    }
  };

  const updateDepValue = (depKey, field, value) => {
    setDepValues(prev => ({
      ...prev,
      [depKey]: {
        ...prev[depKey],
        value: {
          ...prev[depKey].value,
          [field]: value
        }
      }
    }));
  };

  const toggleSlip = (depKey) => {
    setDepValues(prev => ({
      ...prev,
      [depKey]: {
        ...prev[depKey],
        slip: !prev[depKey].slip
      }
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Prepare payload for new API format
      const payload = {
        goal_progress: goalProgress,
        mood,
        stress,
        sleep_hours: sleepHours,
        comment: comment.trim() || null,
        dependencies: Object.entries(depValues).map(([key, data]) => ({
          user_dependency_id: key, // TODO: use real UUID from Supabase
          value: data.value,
          slip: data.slip
        }))
      };

      console.log('Submitting daily report:', payload);

      // TODO: Implement API call
      // const response = await apiClient.post('/profile/me/daily_report', payload);

      alert('✅ Отчёт сохранён! Worker обработает данные и обновит метрики.');
      navigate('/dashboard');

    } catch (error) {
      console.error('Submit report error:', error);
      alert('Ошибка отправки: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDepInput = (dep) => {
    const value = depValues[dep.key]?.value || {};
    const slip = depValues[dep.key]?.slip || false;

    return (
      <div key={dep.key} className="bg-lenvpen-card p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dep.icon}</span>
            <span className="text-lenvpen-text font-semibold">{dep.title}</span>
          </div>
          <button
            onClick={() => toggleSlip(dep.key)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              slip 
                ? 'bg-lenvpen-red text-white' 
                : 'bg-lenvpen-bg text-lenvpen-muted'
            }`}
          >
            {slip ? '⚠️ Срыв' : 'Без срыва'}
          </button>
        </div>

        {/* Specific inputs based on dependency type */}
        {dep.key === 'smoking' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Сколько выкурили сигарет: <span className="text-lenvpen-orange">{value.smoked || 0}</span>
            </label>
            <input
              type="number"
              min="0"
              value={value.smoked || 0}
              onChange={(e) => updateDepValue(dep.key, 'smoked', parseInt(e.target.value) || 0)}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded"
            />
          </div>
        )}

        {dep.key === 'phone' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Экранное время (часов): <span className="text-lenvpen-orange">{value.hours || 0}</span>
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={value.hours || 0}
              onChange={(e) => updateDepValue(dep.key, 'hours', parseFloat(e.target.value) || 0)}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded"
            />
          </div>
        )}

        {dep.key === 'alcohol' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Количество выпитого (напитков): <span className="text-lenvpen-orange">{value.drinks || 0}</span>
            </label>
            <input
              type="number"
              min="0"
              value={value.drinks || 0}
              onChange={(e) => updateDepValue(dep.key, 'drinks', parseInt(e.target.value) || 0)}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded"
            />
          </div>
        )}

        {dep.key === 'gaming' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Время в играх (часов): <span className="text-lenvpen-orange">{value.hours || 0}</span>
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={value.hours || 0}
              onChange={(e) => updateDepValue(dep.key, 'hours', parseFloat(e.target.value) || 0)}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded"
            />
          </div>
        )}

        {dep.key === 'overeating' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Переедали сегодня?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => updateDepValue(dep.key, 'overate', false)}
                className={`flex-1 py-2 rounded transition-colors ${
                  !value.overate ? 'bg-lenvpen-orange text-white' : 'bg-lenvpen-bg text-lenvpen-muted'
                }`}
              >
                Нет
              </button>
              <button
                onClick={() => updateDepValue(dep.key, 'overate', true)}
                className={`flex-1 py-2 rounded transition-colors ${
                  value.overate ? 'bg-lenvpen-red text-white' : 'bg-lenvpen-bg text-lenvpen-muted'
                }`}
              >
                Да
              </button>
            </div>
          </div>
        )}

        {dep.key === 'procrastination' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Потрачено на прокрастинацию (часов): <span className="text-lenvpen-orange">{value.hours || 0}</span>
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={value.hours || 0}
              onChange={(e) => updateDepValue(dep.key, 'hours', parseFloat(e.target.value) || 0)}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded"
            />
          </div>
        )}

        {dep.key === 'drugs' && (
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Употребляли сегодня?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => updateDepValue(dep.key, 'used', false)}
                className={`flex-1 py-2 rounded transition-colors ${
                  !value.used ? 'bg-lenvpen-orange text-white' : 'bg-lenvpen-bg text-lenvpen-muted'
                }`}
              >
                Нет
              </button>
              <button
                onClick={() => updateDepValue(dep.key, 'used', true)}
                className={`flex-1 py-2 rounded transition-colors ${
                  value.used ? 'bg-lenvpen-red text-white' : 'bg-lenvpen-bg text-lenvpen-muted'
                }`}
              >
                Да
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lenvpen-dark flex items-center justify-center">
        <div className="text-lenvpen-text">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lenvpen-dark p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-lenvpen-text">
          Дневной отчёт 📋
        </h1>
        <p className="text-lenvpen-muted text-sm">
          Заполните отчёт за сегодня. Система автоматически пересчитает ваши метрики по формулам C3/O3.
        </p>

        {/* Main metrics */}
        <div className="bg-lenvpen-card p-4 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-lenvpen-text">Общие показатели</h3>
          
          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Прогресс к цели: <span className="text-lenvpen-orange">{goalProgress}/10</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={goalProgress}
              onChange={(e) => setGoalProgress(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Настроение: <span className="text-lenvpen-orange">{mood}/10</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Уровень стресса: <span className="text-lenvpen-orange">{stress}/10</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-lenvpen-muted block mb-2">
              Сон (часов): <span className="text-lenvpen-orange">{sleepHours}</span>
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded"
            />
          </div>
        </div>

        {/* Dependencies */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-lenvpen-text">Ваши зависимости</h3>
          {userDependencies.length > 0 ? (
            userDependencies.map(dep => renderDepInput(dep))
          ) : (
            <div className="text-lenvpen-muted text-center py-8">
              Нет зависимостей для отслеживания. Пройдите опрос сначала.
            </div>
          )}
        </div>

        {/* Comment */}
        <div className="bg-lenvpen-card p-4 rounded-lg">
          <label className="text-sm text-lenvpen-muted block mb-2">
            Комментарий (необязательно)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Как прошёл день? Что помогло/помешало?.."
            rows={3}
            className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary flex-1"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || userDependencies.length === 0}
            className="btn-primary flex-1"
          >
            {submitting ? 'Отправка...' : 'Отправить отчёт'}
          </button>
        </div>
      </div>

      {/* Version */}
      <div className="fixed bottom-2 right-2">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DailyReport;
