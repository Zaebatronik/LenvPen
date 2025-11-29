import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DEPENDENCIES } from '../config/constants';
import { APP_VERSION } from '../config/version';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user?.telegram_id) {
      navigate('/welcome');
      return;
    }

    // Check survey completed
    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    if (!surveyData) {
      navigate('/survey');
      return;
    }

    loadMetrics();
  }, [user, navigate]);

  const loadMetrics = async () => {
    try {
      // TODO: GET /api/profile/me/metrics
      // For now, mock data from localStorage
      const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
      if (surveyData) {
        const parsed = JSON.parse(surveyData);
        const deps = parsed.dependencies || [];
        
        // Mock metrics
        setMetrics({
          discipline_health: 65,
          total_xp: 450,
          last_report_date: null,
          avatar_stage: 3
        });
        
        // Mock dependencies with progress
        setDependencies(deps.map(key => ({
          id: key,
          key,
          ...DEPENDENCIES[key],
          percent: Math.random() * 100,
          current_weight: 5 + Math.random() * 10,
          streak: Math.floor(Math.random() * 30)
        })));
        
        // Mock history (last 7 days)
        const mockHistory = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockHistory.push({
            date: date.toISOString().split('T')[0],
            discipline_health: 50 + Math.random() * 30,
            xp_earned: Math.floor(Math.random() * 50)
          });
        }
        setHistory(mockHistory);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Load metrics error:', error);
      setLoading(false);
    }
  };

  // Gauge component
  const CircularGauge = ({ value, label }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;
    
    // Color based on value
    let color = '#ef4444'; // red
    if (value >= 80) color = '#22c55e'; // green
    else if (value >= 60) color = '#eab308'; // yellow
    else if (value >= 40) color = '#f97316'; // orange
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="transform -rotate-90 w-48 h-48">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-lenvpen-bg"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-lenvpen-text">
            {Math.round(value)}
          </div>
          <div className="text-sm text-lenvpen-muted mt-1">{label}</div>
        </div>
      </div>
    );
  };

  // Mini chart component
  const MiniChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const max = Math.max(...data.map(d => d.discipline_health));
    const min = Math.min(...data.map(d => d.discipline_health));
    const range = max - min || 1;
    
    return (
      <div className="h-20 flex items-end gap-1">
        {data.map((point, i) => {
          const height = ((point.discipline_health - min) / range) * 100 || 50;
          return (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-lenvpen-orange to-lenvpen-red rounded-t transition-all"
              style={{ height: `${height}%`, minHeight: '20%' }}
              title={`${point.date}: ${Math.round(point.discipline_health)}%`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lenvpen-dark flex items-center justify-center">
        <div className="text-lenvpen-text text-xl">Загрузка...</div>
      </div>
    );
  }

  const disciplineHealth = metrics?.discipline_health || 0;
  const avatarStage = metrics?.avatar_stage || 1;
  
  // Avatar emoji based on stage
  const avatarEmojis = ['😴', '🥱', '🙂', '😎', '🔥'];
  const avatarDescriptions = [
    'Ленивец лёжа',
    'Пытается встать',
    'Стоящий',
    'Грозный ленивец',
    'Уверенный человек'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-lenvpen-dark via-lenvpen-bg to-lenvpen-dark p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Header with avatar */}
        <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-6 border border-lenvpen-orange/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-lenvpen-text">Дашборд</h1>
              <p className="text-sm text-lenvpen-muted">Ваш прогресс сегодня</p>
            </div>
            <div className="text-5xl">{avatarEmojis[avatarStage - 1]}</div>
          </div>
          
          {/* Discipline Health Gauge */}
          <CircularGauge value={disciplineHealth} label="Дисциплина" />
          
          <div className="text-center mt-4">
            <div className="text-sm text-lenvpen-muted">{avatarDescriptions[avatarStage - 1]}</div>
            <div className="text-xs text-lenvpen-orange mt-1">XP: {metrics?.total_xp || 0}</div>
          </div>
        </div>

        {/* Daily Report Button */}
        <button
          onClick={() => navigate('/daily-report')}
          className="w-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-lenvpen-red/30 active:scale-95 transition-transform"
        >
          📋 Заполнить дневной отчёт
        </button>

        {/* History Chart */}
        {history.length > 0 && (
          <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-4 border border-lenvpen-orange/20">
            <h3 className="text-lg font-semibold text-lenvpen-text mb-3">История (7 дней)</h3>
            <MiniChart data={history} />
            <div className="flex justify-between text-xs text-lenvpen-muted mt-2">
              <span>{history[0]?.date.slice(5)}</span>
              <span>{history[history.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        )}

        {/* Dependencies Cards */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-lenvpen-text">Ваши зависимости</h2>
          
          {dependencies.length > 0 ? (
            dependencies.map(dep => (
              <div key={dep.id} className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-4 border border-lenvpen-orange/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{dep.icon}</span>
                    <div>
                      <div className="text-lg font-semibold text-lenvpen-text">{dep.title}</div>
                      {dep.streak > 0 && (
                        <div className="text-xs text-lenvpen-green flex items-center gap-1">
                          <span>🔥</span>
                          <span>{dep.streak} дней</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-lenvpen-orange">
                      {Math.round(dep.percent)}%
                    </div>
                    <div className="text-xs text-lenvpen-muted">
                      вес: {dep.current_weight.toFixed(1)}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-lenvpen-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red rounded-full transition-all duration-500"
                    style={{ width: `${dep.percent}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-lenvpen-card/50 rounded-2xl p-8 text-center text-lenvpen-muted">
              Пройдите опрос, чтобы добавить зависимости
            </div>
          )}
        </div>
      </div>
      
      {/* Version */}
      <div className="fixed bottom-4 right-4">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Dashboard;
