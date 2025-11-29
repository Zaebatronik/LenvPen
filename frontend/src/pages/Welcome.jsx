import { useNavigate } from 'react-router-dom';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/select-country');
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Логотип/Emoji */}
        <div className="text-7xl mb-4">📱</div>

        {/* Заголовок */}
        <h1 className="text-4xl font-bold text-lenvpen-text px-2">
          {texts.welcome.title}
        </h1>

        {/* Подзаголовок */}
        <p className="text-xl text-lenvpen-orange font-medium px-2">
          {texts.welcome.subtitle}
        </p>

        {/* Описание */}
        <div className="bg-lenvpen-card rounded-xl p-4 space-y-2 mx-2">
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
      <div className="fixed bottom-2 right-2">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Welcome;
