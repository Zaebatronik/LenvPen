import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import { PatternDetector, DependenceHeatmap, EmotionAnalyzer, FailurePredictor } from '../utils/analyticsEngines';
import { detectUserModel, getModelPhrase } from '../utils/behavioralModels';
import ForecastSystem from '../utils/forecastSystem';
import { getRandomReaction, getRiskReaction, getModelReaction } from '../utils/analystSlothReactions';

function Analytics() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [activeTab, setActiveTab] = useState('portrait'); // portrait, patterns, heatmap, forecast, model
  const [analysisData, setAnalysisData] = useState(null);
  const [slothComment, setSlothComment] = useState('Загружаю аналитику... или сплю. Не знаю.');
  const [userModel, setUserModel] = useState(null);
  
  useEffect(() => {
    performAnalysis();
  }, [user]);
  
  const performAnalysis = () => {
    // Загружаем данные из localStorage
    const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');
    const dailyHistory = JSON.parse(localStorage.getItem(`lenvpen_daily_history_${user.telegram_id}`) || '[]');
    const today = new Date().toDateString();
    const todayTasks = JSON.parse(localStorage.getItem(`lenvpen_daily_tasks_${user.telegram_id}_${today}`) || '{}');
    
    // Формируем данные для анализа
    const userData = {
      completion: todayTasks?.totalPoints ? (todayTasks.totalPoints / 100) * 100 : 50,
      distractions: Math.floor(Math.random() * 5),
      taskCompletionSpeed: 60 + Math.random() * 30,
      moodSwings: Math.floor(Math.random() * 5),
      recentFailure: false,
      currentProgress: 65,
      avgProgress: 55,
      stability: 70,
      stress: 40,
      sleep: { quality: 60 },
      recentProgress: 65,
      goalClarity: 75,
      progress: { streak: 3, recentWins: 2, recentFailures: 1 },
      energy: 65,
      consistency: 75,
      taskSwitching: 3,
      procrastination: 45,
      lastMinuteCompletion: 55,
      emotionalFlux: 30
    };
    
    // Выполняем анализы
    const patterns = PatternDetector.analyzeTimeWindows(dailyHistory);
    const insights = PatternDetector.generateInsights(userData);
    const risk = FailurePredictor.calculateRisk(userData, surveyData.dependencies || [], userData);
    const forecast = ForecastSystem.generateDayForecast(userData);
    const model = detectUserModel(userData);
    
    setUserModel(model);
    setAnalysisData({
      patterns,
      insights,
      risk,
      forecast,
      model,
      dependencies: surveyData.dependencies || [],
      history: dailyHistory
    });
    
    setSlothComment(getRandomReaction('generalInsights'));
  };
  
  const AnalystSloth = () => (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-lenvpen-orange/10 via-transparent to-lenvpen-red/10 animate-pulse"></div>
      <div className="card relative text-center space-y-4 bg-gradient-to-br from-lenvpen-card via-lenvpen-card to-lenvpen-bg border-2 border-lenvpen-orange/30 shadow-2xl shadow-lenvpen-orange/20">
        <div className="text-8xl sm:text-9xl animate-bounce">
          {userModel?.emoji || '🦥'}
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-lenvpen-orange to-lenvpen-red bg-clip-text text-transparent">
            Ленивец-Аналитик
          </h2>
          {userModel && (
            <div className="text-base sm:text-lg text-lenvpen-text font-medium px-4">
              Ты сегодня: <span className="text-lenvpen-orange font-bold">{userModel.name}</span>
            </div>
          )}
          <div className="bg-gradient-to-r from-lenvpen-bg via-lenvpen-card to-lenvpen-bg rounded-xl p-4 border-l-4 border-lenvpen-orange shadow-lg mx-2">
            <p className="text-sm sm:text-base text-lenvpen-text italic leading-relaxed">
              💬 "{slothComment}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const PortraitTab = () => {
    if (!analysisData) return <div>Загрузка...</div>;
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-lenvpen-text">📊 Портрет дня</h3>
        
        {/* Риск срыва */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-lenvpen-text">Риск срыва</h4>
            <span className="text-3xl">{analysisData.risk.emoji}</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-lenvpen-muted">Уровень</span>
              <span className="text-lenvpen-text font-bold">{analysisData.risk.name}</span>
            </div>
            <div className="h-3 bg-lenvpen-bg rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500"
                style={{
                  width: `${analysisData.risk.score}%`,
                  backgroundColor: analysisData.risk.color
                }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-lenvpen-muted italic">
            {analysisData.risk.message}
          </p>
        </div>
        
        {/* Модель поведения */}
        <div className="card">
          <div className="text-center space-y-3">
            <div className="text-6xl">{analysisData.model.emoji}</div>
            <h4 className="text-xl font-bold text-lenvpen-orange">
              {analysisData.model.name}
            </h4>
            <p className="text-sm text-lenvpen-muted">
              {analysisData.model.description}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {Object.entries(analysisData.model.traits).map(([trait, value]) => (
                <div key={trait} className="bg-lenvpen-bg rounded-lg p-3">
                  <div className="text-xs text-lenvpen-muted capitalize mb-1">{trait}</div>
                  <div className="h-2 bg-lenvpen-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-lenvpen-orange transition-all"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Инсайты */}
        <div className="card">
          <h4 className="font-bold text-lenvpen-text mb-3">💡 Инсайты</h4>
          <div className="space-y-2">
            {analysisData.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-lenvpen-orange">→</span>
                <span className="text-lenvpen-muted">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const ForecastTab = () => {
    if (!analysisData) return <div>Загрузка...</div>;
    
    const { forecast } = analysisData;
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-lenvpen-text">🔮 Прогнозы</h3>
        
        {/* Энергия */}
        <div className="card">
          <h4 className="font-bold text-lenvpen-text mb-3">⚡ Энергия</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-lenvpen-muted">Текущая</span>
              <span className="text-2xl font-bold text-lenvpen-orange">
                {forecast.energy.current}%
              </span>
            </div>
            <div className="h-3 bg-lenvpen-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red transition-all"
                style={{ width: `${forecast.energy.current}%` }}
              ></div>
            </div>
            <p className="text-sm text-lenvpen-muted italic">
              {forecast.energy.message}
            </p>
          </div>
        </div>
        
        {/* Мотивация */}
        <div className="card">
          <h4 className="font-bold text-lenvpen-text mb-3">🎯 Мотивация</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-lenvpen-muted">Уровень</span>
              <span className="text-2xl font-bold text-lenvpen-orange">
                {forecast.motivation.level}%
              </span>
            </div>
            <div className="h-3 bg-lenvpen-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-lenvpen-orange transition-all"
                style={{ width: `${forecast.motivation.level}%` }}
              ></div>
            </div>
            <p className="text-sm text-lenvpen-muted italic">
              {forecast.motivation.message}
            </p>
          </div>
        </div>
        
        {/* Настроение */}
        <div className="card">
          <h4 className="font-bold text-lenvpen-text mb-3">😊 Настроение</h4>
          <div className="text-center space-y-3">
            <div className="text-6xl">{forecast.mood.emotion}</div>
            <div className="text-xl font-bold text-lenvpen-text">
              {forecast.mood.forecast}
            </div>
            <div className="text-sm text-lenvpen-muted">
              Прогноз: {forecast.mood.score}%
            </div>
          </div>
        </div>
        
        {/* Лучшие окна */}
        <div className="card">
          <h4 className="font-bold text-lenvpen-text mb-3">⏰ Лучшие окна продуктивности</h4>
          <div className="space-y-3">
            {forecast.bestWindows.map((window, idx) => (
              <div key={idx} className="bg-lenvpen-bg rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lenvpen-orange">
                    {window.start} - {window.end}
                  </span>
                  <span className="text-sm font-bold text-lenvpen-text">
                    {window.score}%
                  </span>
                </div>
                <p className="text-xs text-lenvpen-muted">{window.recommendation}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-lenvpen-orange/10 rounded-lg border-l-4 border-lenvpen-orange">
            <p className="text-sm text-lenvpen-text">
              💡 {forecast.summary}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-lenvpen-dark via-lenvpen-dark to-lenvpen-bg">
      {/* Header */}
      <div className="sticky top-0 bg-lenvpen-dark/95 backdrop-blur-md border-b border-lenvpen-border/50 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 safe-area-inset">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 text-lenvpen-orange hover:text-lenvpen-red transition-colors active:scale-95 transform"
            >
              <span className="text-xl">🏠</span>
              <span className="hidden sm:inline">Главная</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-lenvpen-orange to-lenvpen-red bg-clip-text text-transparent">
              🧠 Аналитика
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Ленивец-аналитик в центре */}
        <AnalystSloth />
        
        {/* Табы */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('portrait')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'portrait'
                ? 'bg-lenvpen-orange text-white'
                : 'bg-lenvpen-card text-lenvpen-muted hover:text-lenvpen-text'
            }`}
          >
            📊 Портрет
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'forecast'
                ? 'bg-lenvpen-orange text-white'
                : 'bg-lenvpen-card text-lenvpen-muted hover:text-lenvpen-text'
            }`}
          >
            🔮 Прогнозы
          </button>
        </div>
        
        {/* Контент табов */}
        {activeTab === 'portrait' && <PortraitTab />}
        {activeTab === 'forecast' && <ForecastTab />}
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <span className="text-lenvpen-text/40 text-xs font-medium">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Analytics;
