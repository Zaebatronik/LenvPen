import { useNavigate } from 'react-router-dom';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function RegistrationSuccess() {
  const navigate = useNavigate();

  const handleStartQuestions = () => {
    navigate('/survey');
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Emoji */}
        <div className="text-7xl text-center">🎯</div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-lenvpen-text text-center">
          {texts.registration.success.title}
        </h1>

        {/* Основной текст */}
        <div className="bg-lenvpen-card rounded-xl p-6 space-y-4">
          <p className="text-xl text-lenvpen-text">
            {texts.registration.success.text}
          </p>
          <p className="text-lg text-lenvpen-orange mb-3">
            {texts.registration.success.subtitle}
          </p>
          <div className="space-y-2">
            {texts.registration.success.points.map((point, index) => (
              <p key={index} className="text-lg text-lenvpen-text">
                {point}
              </p>
            ))}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/registration')}
            className="btn-secondary text-xl flex-1"
          >
            Назад
          </button>
          <button
            onClick={handleStartQuestions}
            className="btn-primary text-xl flex-1"
          >
            {texts.registration.success.btnQuestions}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrationSuccess;
