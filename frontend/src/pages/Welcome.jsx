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
    <div className="min-h-screen bg-gradient-to-b from-lenvpen-dark via-lenvpen-dark to-lenvpen-bg flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Декоративные элементы */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-lenvpen-orange/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-lenvpen-red/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* Телефон с ленивцем */}
        <div className="relative inline-block">
          <div className="relative w-48 h-96 mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl border-4 border-gray-700 p-3">
            {/* Динамик */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-gray-700 rounded-full"></div>
            
            {/* Экран телефона */}
            <div className="w-full h-full bg-gradient-to-br from-lenvpen-bg to-lenvpen-dark rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center p-4 relative">
              {/* Ленивец */}
              <div className="text-8xl mb-2 animate-bounce-slow">🦥</div>
              <div className="text-white text-xs font-bold mb-1">ЛЕНЬ-В-ПЕНЬ</div>
              <div className="text-lenvpen-orange text-[10px]">Дисциплина по кускам</div>
              
              {/* Эффект свечения */}
              <div className="absolute inset-0 bg-gradient-to-t from-lenvpen-orange/10 to-transparent"></div>
            </div>

            {/* Кнопка Home */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
            </div>
          </div>

          {/* Тень от телефона */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-8 bg-black/30 rounded-full blur-xl"></div>
        </div>

        {/* Заголовок */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lenvpen-orange via-lenvpen-red to-lenvpen-orange px-2 leading-tight">
            {texts.welcome.title}
          </h1>

          {/* Подзаголовок */}
          <p className="text-xl text-lenvpen-orange font-bold px-2 drop-shadow-lg">
            {texts.welcome.subtitle}
          </p>
        </div>

        {/* Описание */}
        <div className="bg-lenvpen-card/50 backdrop-blur-sm rounded-2xl p-6 space-y-3 mx-2 border border-lenvpen-orange/20 shadow-xl">
          {texts.welcome.description.map((line, index) => (
            <p key={index} className="text-lg text-lenvpen-text leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        {/* Кнопка */}
        <button
          onClick={handleStart}
          className="btn-primary text-2xl w-full max-w-md mx-auto mt-8 shadow-2xl shadow-lenvpen-red/50 transform transition-all hover:scale-105 active:scale-95"
        >
          {texts.welcome.btnStart}
        </button>

        {/* Кнопка очистки данных (для тестирования) */}
        <button
          onClick={handleClearData}
          className="btn-secondary text-xs w-full max-w-md mx-auto mt-4 opacity-30 hover:opacity-50 transition-opacity"
        >
          🗑️ Очистить данные
        </button>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-2 right-2 z-20">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Welcome;
