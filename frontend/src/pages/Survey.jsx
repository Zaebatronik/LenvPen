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
  const [mainGoal, setMainGoal] = useState('');
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
        mainGoal,
        completed_at: new Date().toISOString()
      };
      localStorage.setItem(`lenvpen_survey_${user.telegram_id}`, JSON.stringify(surveyData));
      
      console.log('Survey data saved for user:', user.telegram_id);

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

  return (
    <div className="min-h-screen bg-lenvpen-dark p-4 overflow-hidden">
      <div className="max-w-2xl mx-auto">
        {/* Прогресс */}
        <div className="mb-6">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
          <div className="text-lenvpen-muted text-sm mt-2 text-center">
            Шаг {step} из 4
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

        {/* Шаг 4: Главная цель */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-lenvpen-text">
              {texts.survey.mainGoal.title}
            </h2>
            <p className="text-lenvpen-orange">
              {texts.survey.mainGoal.instruction}
            </p>
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
