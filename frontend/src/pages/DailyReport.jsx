import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function DailyReport() {
  const navigate = useNavigate();
  const { user, dependencies } = useStore();
  const [loading, setLoading] = useState(false);
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  
  // Данные формы
  const [didStep, setDidStep] = useState(false);
  const [stepDescription, setStepDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [depData, setDepData] = useState({});

  useEffect(() => {
    checkTodayReport();
  }, [user]);

  const checkTodayReport = async () => {
    try {
      const check = await apiClient.checkTodayReport(user.id);
      setAlreadyFilled(check.has_report_today);
      
      if (check.has_report_today && check.report) {
        // Заполняем форму существующими данными
        setDidStep(check.report.for_goal?.did_step || false);
        setStepDescription(check.report.for_goal?.step_description || '');
        setRating(check.report.for_goal?.rating || 5);
        setDepData(check.report.dependencies_daily || {});
      }
    } catch (error) {
      console.error('Check today report error:', error);
    }
  };

  const handleDepChange = (depKey, field, value) => {
    setDepData({
      ...depData,
      [depKey]: {
        ...depData[depKey],
        [field]: value
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      await apiClient.saveDailyReport({
        userId: user.id,
        date: today,
        for_goal: {
          did_step: didStep,
          step_description: stepDescription,
          rating
        },
        dependencies_daily: depData,
        mood: {}
      });

      alert(texts.dailyReport.success);
      navigate('/dashboard');

    } catch (error) {
      console.error('Save daily report error:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark p-4 overflow-hidden relative">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-lenvpen-text">
          {texts.dailyReport.title}
        </h1>

        {alreadyFilled && (
          <div className="bg-lenvpen-green/20 border-2 border-lenvpen-green rounded-xl p-4 text-lenvpen-green">
            {texts.dailyReport.alreadyFilled}
          </div>
        )}

        {/* Главная цель */}
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold text-lenvpen-text">
            {texts.dailyReport.goal.title}
          </h2>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={didStep}
              onChange={(e) => setDidStep(e.target.checked)}
              className="w-6 h-6"
            />
            <span className="text-lenvpen-text">{texts.dailyReport.goal.didStep}</span>
          </label>

          {didStep && (
            <textarea
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              placeholder={texts.dailyReport.goal.description}
              rows={3}
              className="w-full p-3 bg-lenvpen-bg text-lenvpen-text rounded-lg resize-none"
            />
          )}

          <div>
            <label className="text-lenvpen-text block mb-2">
              {texts.dailyReport.goal.rating}: {rating}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-lenvpen-muted mt-1">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Зависимости */}
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold text-lenvpen-text">
            {texts.dailyReport.dependencies.title}
          </h2>

          {dependencies && dependencies.length > 0 ? (
            dependencies.map(dep => (
              <div key={dep.id} className="bg-lenvpen-bg rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-medium text-lenvpen-text">
                  {dep.key}
                </h3>

                {/* Упрощённые поля для MVP */}
                {dep.key === 'smoking' && (
                  <>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!depData[dep.key]?.did_smoke}
                        onChange={(e) => handleDepChange(dep.key, 'did_smoke', !e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-lenvpen-text">Не курил сегодня</span>
                    </label>
                    {depData[dep.key]?.did_smoke && (
                      <input
                        type="number"
                        placeholder="Сколько сигарет?"
                        value={depData[dep.key]?.count || ''}
                        onChange={(e) => handleDepChange(dep.key, 'count', parseInt(e.target.value) || 0)}
                        className="w-full p-2 bg-lenvpen-dark text-lenvpen-text rounded"
                      />
                    )}
                  </>
                )}

                {dep.key === 'phone' && (
                  <input
                    type="number"
                    placeholder="Часов в телефоне"
                    value={depData[dep.key]?.hours || ''}
                    onChange={(e) => handleDepChange(dep.key, 'hours', parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-lenvpen-dark text-lenvpen-text rounded"
                  />
                )}

                {/* Для остальных - простое да/нет */}
                {!['smoking', 'phone'].includes(dep.key) && (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={depData[dep.key]?.no_action || false}
                      onChange={(e) => handleDepChange(dep.key, 'no_action', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-lenvpen-text">Не делал сегодня</span>
                  </label>
                )}
              </div>
            ))
          ) : (
            <div className="text-lenvpen-muted">Нет зависимостей для отслеживания</div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary flex-1"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Сохранение...' : texts.dailyReport.btnSubmit}
          </button>
        </div>
      </div>
      
      {/* Версия */}
      <div className="absolute bottom-2 right-2 text-xs text-lenvpen-text opacity-30">
        {APP_VERSION}
      </div>
    </div>
  );
}

export default DailyReport;
