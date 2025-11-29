import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/select-country');
  };

  const handleClearData = () => {
    const telegramId = WebApp.initDataUnsafe?.user?.id;
    if (telegramId) {
      localStorage.removeItem(`lenvpen_user_${telegramId}`);
      localStorage.removeItem(`lenvpen_survey_${telegramId}`);
      console.log('Data cleared for user:', telegramId);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lenvpen-dark via-lenvpen-bg to-lenvpen-dark flex flex-col p-6 relative overflow-hidden">
      {/* Декоративный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lenvpen-orange/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-lenvpen-red/10 rounded-full blur-3xl"></div>
      </div>

      {/* Контент */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10 space-y-6">
        
        {/* Лого и название */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-lenvpen-orange to-lenvpen-red rounded-3xl shadow-2xl mb-4">
            <span className="text-6xl">🦥</span>
          </div>
          
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lenvpen-orange via-lenvpen-red to-lenvpen-orange leading-tight">
            {texts.welcome.title}
          </h1>
          
          <p className="text-lg text-lenvpen-orange font-semibold">
            {texts.welcome.subtitle}
          </p>
        </div>

        {/* Фичи в компактных карточках */}
        <div className="space-y-3">
          <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-4 border border-lenvpen-orange/20">
            <div className="flex items-start gap-3">
              <span className="text-3xl">📊</span>
              <div className="flex-1">
                <h3 className="text-lenvpen-text font-semibold mb-1">C3/O3 Система</h3>
                <p className="text-sm text-lenvpen-muted">Математическая модель отслеживания прогресса</p>
              </div>
            </div>
          </div>

          <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-4 border border-lenvpen-orange/20">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎯</span>
              <div className="flex-1">
                <h3 className="text-lenvpen-text font-semibold mb-1">Дневные отчёты</h3>
                <p className="text-sm text-lenvpen-muted">Ежедневный трекинг зависимостей и целей</p>
              </div>
            </div>
          </div>

          <div className="bg-lenvpen-card/80 backdrop-blur-sm rounded-2xl p-4 border border-lenvpen-orange/20">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💪</span>
              <div className="flex-1">
                <h3 className="text-lenvpen-text font-semibold mb-1">Метрика дисциплины</h3>
                <p className="text-sm text-lenvpen-muted">Визуализация вашего прогресса в режиме реального времени</p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка старта */}
        <button
          onClick={handleStart}
          className="btn-primary text-xl py-4 shadow-2xl shadow-lenvpen-red/30 transform transition-all active:scale-95"
        >
          {texts.welcome.btnStart} 🚀
        </button>

        {/* Кнопка очистки (для тестирования) */}
        <button
          onClick={handleClearData}
          className="text-lenvpen-muted/30 text-xs py-2 hover:text-lenvpen-muted/50 transition-colors"
        >
          🗑️ Очистить данные
        </button>
      </div>
      
      {/* Версия */}
      <div className="absolute bottom-4 right-4">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Welcome;
