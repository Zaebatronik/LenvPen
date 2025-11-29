import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function Welcome() {
  const navigate = useNavigate();
  const [afkMessage, setAfkMessage] = useState('');
  const [blink, setBlink] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // AFK логика
  useEffect(() => {
    const checkAFK = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity > 10000 && !afkMessage) {
        setAfkMessage('Только зашёл — уже отдыхаешь? Классика.');
        setTimeout(() => setAfkMessage(''), 5000);
      }
    }, 5000);

    return () => clearInterval(checkAFK);
  }, [lastActivity, afkMessage]);

  // Анимация моргания
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Сброс таймера при любом взаимодействии
  const handleActivity = () => {
    setLastActivity(Date.now());
  };

  const handleStart = () => {
    handleActivity();
    navigate('/select-country');
  };

  const handleCancel = () => {
    handleActivity();
    WebApp.close();
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
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10 space-y-6" onMouseMove={handleActivity} onTouchStart={handleActivity}>
        
        {/* Круглый placeholder под аватара ленивца */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lenvpen-orange/20 to-lenvpen-red/20 border-4 border-lenvpen-orange/30 flex items-center justify-center shadow-2xl mx-auto">
              <span className={`text-7xl transition-all duration-200 ${blink ? 'scale-90 opacity-80' : 'scale-100'}`}>🦥</span>
            </div>
            {/* Пульсирующий эффект */}
            <div className="absolute inset-0 rounded-full bg-lenvpen-orange/10 animate-ping"></div>
          </div>
          
          <h1 className="text-3xl font-black text-lenvpen-text leading-tight">
            Добро пожаловать,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lenvpen-orange to-lenvpen-red">
              герой диванных войск.
            </span>
          </h1>
          
          <p className="text-lg text-lenvpen-orange/80">
            Не бойся. Сейчас не больно.<br/>
            <span className="text-sm text-lenvpen-muted">Больно будет потом.</span>
          </p>
        </div>

        {/* Описание того, что сейчас будет */}
        <div className="bg-lenvpen-card/60 backdrop-blur-sm rounded-2xl p-6 border border-lenvpen-orange/20 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎯</span>
            <div className="flex-1">
              <h3 className="text-lenvpen-text font-bold text-lg mb-2">Мы тут не играем в мотивацию</h3>
              <p className="text-sm text-lenvpen-muted leading-relaxed">
                Никаких блёсток. Только прямота. Сейчас будет диагностика твоего бардака.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 pt-3 border-t border-lenvpen-orange/10">
            <span className="text-3xl">🔍</span>
            <div className="flex-1">
              <h3 className="text-lenvpen-text font-bold mb-2">Нам нужно понять твой бардак</h3>
              <p className="text-sm text-lenvpen-muted leading-relaxed">
                Чтобы строить маршрут — нужно узнать, что ты хочешь и что тебе мешает.
              </p>
            </div>
          </div>
        </div>

        {/* AFK сообщение */}
        {afkMessage && (
          <div className="bg-lenvpen-red/20 backdrop-blur-sm rounded-xl p-4 border border-lenvpen-red/30 animate-fade-in">
            <p className="text-lenvpen-text text-center text-sm">
              💤 {afkMessage}
            </p>
          </div>
        )}

        {/* Кнопка начать тестирование */}
        <button
          onClick={handleStart}
          className="btn-primary text-xl py-5 shadow-2xl shadow-lenvpen-red/30 transform transition-all active:scale-95 hover:scale-105"
        >
          Начать тестирование 🎯
        </button>

        {/* Кнопка передумал */}
        <button
          onClick={handleCancel}
          className="text-lenvpen-muted/60 text-base py-3 hover:text-lenvpen-muted transition-colors border border-lenvpen-muted/20 rounded-xl hover:border-lenvpen-muted/40"
        >
          Не, я передумал
        </button>

        {/* Кнопка очистки (для тестирования) */}
        {import.meta.env.DEV && (
          <button
            onClick={handleClearData}
            className="text-lenvpen-muted/20 text-xs py-2 hover:text-lenvpen-muted/40 transition-colors"
          >
            🗑️ DEV: Очистить данные
          </button>
        )}
      </div>
      
      {/* Версия */}
      <div className="absolute bottom-4 right-4">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Welcome;
