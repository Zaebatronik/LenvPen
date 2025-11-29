import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import { DEPENDENCIES } from '../config/constants';
import texts from '../locales/ru.json';

function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, dependencies, mainGoal, overallVictory, loadProfile } = useStore();
  const [loading, setLoading] = useState(true);
  const [hasTodayReport, setHasTodayReport] = useState(false);

  useEffect(() => {
    // Загружаем данные из localStorage (mock data)
    const surveyData = localStorage.getItem('lenvpen_survey');
    if (surveyData) {
      try {
        const data = JSON.parse(surveyData);
        console.log('Loaded survey data:', data);
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
    setLoading(false);
    setHasTodayReport(false);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-lenvpen-dark flex items-center justify-center">
        <div className="text-lenvpen-text text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lenvpen-dark p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <h1 className="text-4xl font-bold text-lenvpen-text">
          {texts.dashboard.title}
        </h1>

        {/* Главная цель */}
        <div className="card">
          <div className="text-sm text-lenvpen-muted mb-2">
            {texts.dashboard.mainGoal.label}
          </div>
          <div className="text-2xl text-lenvpen-text font-medium">
            {mainGoal?.text || texts.dashboard.mainGoal.noGoal}
          </div>
        </div>

        {/* Общая победа */}
        <div className="card">
          <div className="text-sm text-lenvpen-muted mb-3">
            {texts.dashboard.overallVictory.label}
          </div>
          <div className="text-6xl font-bold text-lenvpen-orange mb-4">
            {Math.round(overallVictory)}%
          </div>
          <div className="progress-bar h-6">
            <div 
              className="progress-fill" 
              style={{ width: `${overallVictory}%` }}
            />
          </div>
        </div>

        {/* Кнопка дневного отчёта */}
        <button
          onClick={() => navigate('/daily-report')}
          className={`w-full py-6 rounded-xl font-bold text-xl transition-all ${
            hasTodayReport
              ? 'bg-lenvpen-green/20 text-lenvpen-green border-2 border-lenvpen-green'
              : 'bg-lenvpen-red text-white hover:bg-lenvpen-orange'
          }`}
        >
          {hasTodayReport ? '✅ Отчёт за сегодня заполнен' : texts.dashboard.dailyReport.btnFill}
        </button>

        {/* Зависимости */}
        <div>
          <h2 className="text-2xl font-bold text-lenvpen-text mb-4">
            {texts.dashboard.dependencies.title}
          </h2>
          
          {dependencies && dependencies.length > 0 ? (
            <div className="grid gap-4">
              {dependencies.map(dep => {
                const depInfo = Object.values(DEPENDENCIES).find(d => d.key === dep.key);
                return (
                  <div key={dep.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{depInfo?.icon || '❓'}</div>
                        <div>
                          <div className="text-xl font-medium text-lenvpen-text">
                            {depInfo?.title || dep.key}
                          </div>
                          {dep.streak > 0 && (
                            <div className="text-sm text-lenvpen-green">
                              🔥 {dep.streak} дней подряд
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-lenvpen-orange">
                          {Math.round(dep.percent)}%
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar mt-3">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${dep.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center text-lenvpen-muted">
              {texts.dashboard.dependencies.empty}
            </div>
          )}
        </div>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-4 right-4 text-lenvpen-text/40 text-sm">
        v{APP_VERSION}
      </div>
    </div>
  );
}

export default Dashboard;
