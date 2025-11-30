import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import { USER_STATUSES, DEPENDENCIES } from '../config/constants';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function Survey() {
  const navigate = useNavigate();
  const { user, updateSurveyData, surveyData } = useStore();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState('');
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [depParams, setDepParams] = useState({}); // { depKey: { harm, difficulty, frequency } }
  const [mainGoal, setMainGoal] = useState('');
  const [goalDays, setGoalDays] = useState(90);
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step === 1 && !status) {
      alert('Выберите статус');
      return;
    }
    if (step === 2 && !position.trim()) {
      alert('Заполните должность');
      return;
    }
    if (step === 3 && selectedDeps.length === 0) {
      alert('Выберите хотя бы одну зависимость');
      return;
    }
    if (step === 4) {
      // Initialize params for selected dependencies
      const params = {};
      selectedDeps.forEach(key => {
        if (!depParams[key]) {
          params[key] = { harm: 5, difficulty: 5, frequency: 3 };
        } else {
          params[key] = depParams[key];
        }
      });
      setDepParams(params);
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDependencyToggle = (key) => {
    if (selectedDeps.includes(key)) {
      setSelectedDeps(selectedDeps.filter(k => k !== key));
    } else {
      setSelectedDeps([...selectedDeps, key]);
    }
  };

  const handleSaveGoal = async () => {
    if (!mainGoal.trim()) {
      alert('Напишите главную цель');
      return;
    }

    setSaving(true);

    try {
      // Сохраняем в localStorage с привязкой к telegram_id
      const surveyData = {
        status,
        position,
        dependencies: selectedDeps,
        depParams, // Include dependency parameters
        mainGoal,
        goalDays,
        completed_at: new Date().toISOString()
      };
      localStorage.setItem(`lenvpen_survey_${user.telegram_id}`, JSON.stringify(surveyData));
      
      console.log('Survey data saved for user:', user.telegram_id);

      // TODO: Send to Supabase via API
      // POST /api/profile/me/dependencies
      // POST /api/profile/me/goal

      // Переходим на dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (error) {
      console.error('Save survey error:', error);
      alert('Ошибка сохранения: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateDepParam = (depKey, paramName, value) => {
    setDepParams(prev => ({
      ...prev,
      [depKey]: {
        ...prev[depKey],
        [paramName]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark p-4 overflow-hidden">
      <div className="max-w-2xl mx-auto">
        {/* Прогресс */}
        <div className="mb-6">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <div className="text-lenvpen-muted text-sm mt-2 text-center">
            Шаг {step} из 5
          </div>
        </div>

        {/* Шаг 1: Статус */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              {texts.survey.status.title}
            </h2>
            <div className="space-y-3">
              {USER_STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    status === s.value 
                      ? 'bg-lenvpen-orange text-white' 
                      : 'bg-lenvpen-card text-lenvpen-text hover:bg-lenvpen-bg'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/registration-success')} className="btn-secondary flex-1">
                {texts.survey.btnBack}
              </button>
              <button onClick={handleNext} className="btn-primary flex-1">
                {texts.survey.btnNext}
              </button>
            </div>
          </div>
        )}

        {/* Шаг 2: Должность */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              {texts.survey.position.title}
            </h2>
            <p className="text-lenvpen-muted">
              {texts.survey.position.subtitle}
            </p>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={texts.survey.position.placeholder}
              className="w-full p-4 bg-lenvpen-card text-lenvpen-text rounded-lg"
            />
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                {texts.survey.btnBack}
              </button>
              <button onClick={handleNext} className="btn-primary flex-1">
                {texts.survey.btnNext}
              </button>
            </div>
          </div>
        )}

        {/* Шаг 3: Зависимости */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              {texts.survey.dependencies.title}
            </h2>
            <p className="text-lenvpen-muted">
              {texts.survey.dependencies.subtitle}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(DEPENDENCIES).map(dep => (
                <button
                  key={dep.key}
                  onClick={() => handleDependencyToggle(dep.key)}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    selectedDeps.includes(dep.key)
                      ? 'bg-lenvpen-red text-white'
                      : 'bg-lenvpen-card text-lenvpen-text hover:bg-lenvpen-bg'
                  }`}
                >
                  <div className="text-3xl mb-2">{dep.icon}</div>
                  <div className="text-sm">{dep.title}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                {texts.survey.btnBack}
              </button>
              <button onClick={handleNext} className="btn-primary flex-1">
                {texts.survey.btnNext}
              </button>
            </div>
          </div>
        )}

        {/* Шаг 4: Параметры зависимостей */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              Настройте параметры
            </h2>
            <p className="text-lenvpen-muted text-sm">
              Оцените каждую зависимость по 3 критериям. Это поможет системе точнее рассчитывать прогресс.
            </p>
            
            <div className="space-y-6">
              {selectedDeps.map(depKey => {
                const dep = DEPENDENCIES[depKey];
                const params = depParams[depKey] || { harm: 5, difficulty: 5, frequency: 3 };
                
                return (
                  <div key={depKey} className="bg-lenvpen-card p-4 rounded-lg space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{dep.icon}</span>
                      <span className="text-lenvpen-text font-semibold">{dep.title}</span>
                    </div>
                    
                    {/* Вред для здоровья */}
                    <div>
                      <label className="text-sm text-lenvpen-muted block mb-2">
                        Вред для здоровья/жизни: <span className="text-lenvpen-orange">{params.harm}/10</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={params.harm}
                        onChange={(e) => updateDepParam(depKey, 'harm', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-lenvpen-muted mt-1">
                        {params.harm <= 3 ? 'Легкий вред' : params.harm <= 7 ? 'Средний вред' : 'Сильный вред'}
                      </div>
                    </div>
                    
                    {/* Сложность избавления */}
                    <div>
                      <label className="text-sm text-lenvpen-muted block mb-2">
                        Сложность избавления: <span className="text-lenvpen-orange">{params.difficulty}/10</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={params.difficulty}
                        onChange={(e) => updateDepParam(depKey, 'difficulty', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-lenvpen-muted mt-1">
                        {params.difficulty <= 3 ? 'Легко бросить' : params.difficulty <= 7 ? 'Среднесложно' : 'Очень сложно'}
                      </div>
                    </div>
                    
                    {/* Частота в неделю */}
                    <div>
                      <label className="text-sm text-lenvpen-muted block mb-2">
                        Частота в неделю: <span className="text-lenvpen-orange">{params.frequency} дней</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="7"
                        value={params.frequency}
                        onChange={(e) => updateDepParam(depKey, 'frequency', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-lenvpen-muted mt-1">
                        {params.frequency === 0 ? 'Редко' : params.frequency <= 2 ? 'Иногда' : params.frequency <= 5 ? 'Часто' : 'Ежедневно'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                {texts.survey.btnBack}
              </button>
              <button onClick={handleNext} className="btn-primary flex-1">
                {texts.survey.btnNext}
              </button>
            </div>
          </div>
        )}

        {/* Шаг 5: Главная цель */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              {texts.survey.mainGoal.title}
            </h2>
            <p className="text-lenvpen-orange">
              {texts.survey.mainGoal.instruction}
            </p>
            
            {/* Выбор срока цели */}
            <div className="space-y-3">
              <label className="text-lg font-semibold text-lenvpen-text block">
                Сколько дней дать себе на достижение цели?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setGoalDays(days)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      goalDays === days
                        ? 'bg-lenvpen-accent text-white shadow-lg shadow-lenvpen-accent/20 scale-105'
                        : 'bg-lenvpen-card text-lenvpen-text hover:bg-lenvpen-card/80 border border-lenvpen-border'
                    }`}
                  >
                    <div className="text-3xl font-bold">{days}</div>
                    <div className="text-sm mt-1 opacity-80">дней</div>
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder={texts.survey.mainGoal.placeholder}
              rows={4}
              className="w-full p-4 bg-lenvpen-card text-lenvpen-text rounded-lg resize-none"
            />
            <div className="flex gap-3">
              <button onClick={handleBack} className="btn-secondary flex-1">
                {texts.survey.btnBack}
              </button>
              <button 
                onClick={handleSaveGoal} 
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Сохранение...' : texts.survey.mainGoal.btnSave}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-2 right-2">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Survey;
