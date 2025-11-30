import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';
import Navigation from '../components/Navigation';

/**
 * PROGRESS - Блок Е (новая версия)
 * 3 секции: Прогресс дня, Прогресс недели, Прогресс главной цели
 */

function Progress() {
  const navigate = useNavigate();
  const [dayProgress, setDayProgress] = useState({ plusActions: [], minusActions: [], total: 0 });
  const [weekProgress, setWeekProgress] = useState([]);
  const [goalProgress, setGoalProgress] = useState({ current: 0, total: 100, subgoals: { completed: 0, total: 7 } });
  
  const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
  const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    // Прогресс дня
    const today = new Date().toISOString().split('T')[0];
    const todayReport = localStorage.getItem(`lenvpen_report_${user.telegram_id}_${today}`);
    
    if (todayReport) {
      const report = JSON.parse(todayReport);
      const plusActions = [];
      const minusActions = [];
      
      // Плюсы от действий
      report.actions?.forEach(actionId => {
        const intensity = report.intensity?.[actionId] || 'medium';
        const points = intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3;
        plusActions.push({ action: actionId, points: points * 2 }); // ×2 для плюсов
      });
      
      // Минусы от зависимостей
      Object.entries(report.dependencies || {}).forEach(([key, data]) => {
        if (data.violated) {
          const harm = surveyData.depParams?.[key]?.harm || 5;
          minusActions.push({ action: key, points: -harm }); // -1 за зависимость
        }
      });
      
      setDayProgress({
        plusActions,
        minusActions,
        total: report.score || 0
      });
    }
    
    // Прогресс недели (последние 7 дней)
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayReport = localStorage.getItem(`lenvpen_report_${user.telegram_id}_${dateStr}`);
      
      const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()];
      
      if (dayReport) {
        const report = JSON.parse(dayReport);
        weekData.push({ day: dayName, score: report.score || 0 });
      } else {
        weekData.push({ day: dayName, score: null });
      }
    }
    setWeekProgress(weekData);
    
    // Прогресс главной цели
    const allReports = JSON.parse(localStorage.getItem(`lenvpen_all_reports_${user.telegram_id}`) || '[]');
    const totalScore = allReports.reduce((sum, r) => sum + (r.score || 0), 0);
    setGoalProgress({
      current: Math.min(100, Math.max(0, totalScore)),
      total: 100,
      subgoals: { completed: Math.floor(totalScore / 15), total: 7 }
    });
  };

  return (
    <div className="min-h-screen bg-lenvpen-bg">
      <Navigation />
      
      <div className="pt-20 pb-24 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Заголовок */}
          <h1 className="text-3xl font-bold text-lenvpen-text">Прогресс</h1>
          
          {/* 1. Прогресс дня */}
          <div className="bg-lenvpen-card rounded-2xl p-6 border border-lenvpen-border">
            <h2 className="text-xl font-bold text-lenvpen-text mb-4">Сегодня:</h2>
            
            {dayProgress.total !== 0 ? (
              <div className="space-y-4">
                {/* Плюсы */}
                {dayProgress.plusActions.length > 0 && (
                  <div>
                    <div className="text-sm text-lenvpen-green font-semibold mb-2">Плюсы (×2):</div>
                    {dayProgress.plusActions.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="text-lenvpen-text">{item.action}</span>
                        <span className="text-lenvpen-green font-bold">+{item.points}%</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Минусы */}
                {dayProgress.minusActions.length > 0 && (
                  <div>
                    <div className="text-sm text-lenvpen-red font-semibold mb-2">Минусы (−1):</div>
                    {dayProgress.minusActions.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="text-lenvpen-text">{item.action}</span>
                        <span className="text-lenvpen-red font-bold">{item.points}%</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Итог */}
                <div className="pt-4 border-t border-lenvpen-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-lenvpen-text">Итог:</span>
                    <span className={`text-3xl font-black ${dayProgress.total >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                      {dayProgress.total >= 0 ? '+' : ''}{dayProgress.total}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-lenvpen-muted text-center py-4">Отчёт за сегодня ещё не заполнен</p>
            )}
          </div>
          
          {/* 2. Прогресс недели */}
          <div className="bg-lenvpen-card rounded-2xl p-6 border border-lenvpen-border">
            <h2 className="text-xl font-bold text-lenvpen-text mb-4">Прогресс недели:</h2>
            
            <div className="space-y-3">
              {weekProgress.map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lenvpen-muted font-semibold w-8">{day.day}</span>
                  <div className="flex-1 h-12 bg-lenvpen-bg rounded-lg overflow-hidden relative">
                    {day.score !== null ? (
                      <>
                        <div 
                          className={`h-full transition-all ${day.score >= 0 ? 'bg-lenvpen-green' : 'bg-lenvpen-red'}`}
                          style={{ width: `${Math.min(100, Math.abs(day.score) * 5)}%` }}
                        />
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${day.score >= 0 ? 'text-white' : 'text-white'}`}>
                          {day.score >= 0 ? '+' : ''}{day.score}%
                        </span>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-lenvpen-muted text-sm">
                        Нет данных
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 3. Прогресс главной цели */}
          <div className="bg-lenvpen-card rounded-2xl p-6 border border-lenvpen-border">
            <h2 className="text-xl font-bold text-lenvpen-text mb-4">Прогресс главной цели:</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-lenvpen-muted mb-2">Главная цель:</div>
                <div className="text-lg font-semibold text-lenvpen-text">
                  {surveyData.mainGoal || 'Не указана'}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-lenvpen-muted">Текущий прогресс:</span>
                  <span className="text-2xl font-bold text-lenvpen-accent">{goalProgress.current}%</span>
                </div>
                <div className="h-4 bg-lenvpen-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-lenvpen-accent transition-all duration-500"
                    style={{ width: `${goalProgress.current}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm text-lenvpen-muted mb-2">Оставшиеся подцели:</div>
                <div className="text-lg font-semibold text-lenvpen-text">
                  {goalProgress.subgoals.completed} из {goalProgress.subgoals.total}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="fixed bottom-20 right-4 z-10">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Progress;
