import { useNavigate } from 'react-router-dom';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/registration');
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-6">
      {/* ТЕСТОВЫЙ БАННЕР */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-lenvpen-orange px-6 py-3 rounded-lg shadow-lg z-50">
        <span className="text-lenvpen-dark text-xl font-bold">ТЕСТ v{APP_VERSION}</span>
      </div>
      
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Логотип/Emoji */}
        <div className="text-8xl mb-6">📱</div>

        {/* Заголовок */}
        <h1 className="text-5xl font-bold text-lenvpen-orange">
          🔥 ТЕСТ ВЕРСИЯ 0.0.5 🔥
        </h1>
        <h2 className="text-3xl font-bold text-lenvpen-text">
          {texts.welcome.title}
        </h2>

        {/* Подзаголовок */}
        <p className="text-2xl text-lenvpen-orange font-medium">
          {texts.welcome.subtitle}
        </p>

        {/* Описание */}
        <div className="bg-lenvpen-card rounded-xl p-6 space-y-3">
          {texts.welcome.description.map((line, index) => (
            <p key={index} className="text-lg text-lenvpen-text">
              {line}
            </p>
          ))}
        </div>

        {/* Кнопка */}
        <button
          onClick={handleStart}
          className="btn-primary text-xl w-full max-w-md mx-auto mt-8"
        >
          {texts.welcome.btnStart}
        </button>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-4 right-4 bg-lenvpen-card px-3 py-1 rounded-lg">
        <span className="text-lenvpen-text/60 text-sm font-mono">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Welcome;
