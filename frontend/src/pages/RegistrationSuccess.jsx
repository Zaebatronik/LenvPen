import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';

function RegistrationSuccess() {
  const navigate = useNavigate();
  const { user } = useStore();

  const handleClearData = () => {
    const telegramId = WebApp.initDataUnsafe?.user?.id;
    if (telegramId) {
      if (window.confirm('Очистить все данные и начать заново?')) {
        localStorage.removeItem(`lenvpen_user_${telegramId}`);
        localStorage.removeItem(`lenvpen_survey_${telegramId}`);
        console.log('Data cleared for user:', telegramId);
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full space-y-6">
        {/* Emoji */}
        <div className="text-6xl text-center">🎉</div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-lenvpen-text text-center">
          Регистрация завершена!
        </h1>

        {/* Основной текст */}
        <div className="card space-y-4">
          <p className="text-lg text-lenvpen-text text-center">
            Добро пожаловать, <span className="text-lenvpen-orange font-bold">{user.username}</span>!
          </p>
          
          <div className="text-lenvpen-muted text-center space-y-1">
            <p>📍 {user.country}, {user.city}</p>
          </div>

          <div className="space-y-2 text-lenvpen-text">
            <p>✅ Профиль создан</p>
            <p>✅ Данные сохранены</p>
          </div>
        </div>

        {/* Информация */}
        <div className="card bg-lenvpen-orange/10 border border-lenvpen-orange/30">
          <p className="text-lenvpen-text text-center font-semibold">
            Что дальше?
          </p>
          <p className="text-lenvpen-muted text-sm text-center mt-2">
            Пройдите короткий опрос о ваших зависимостях — это займёт несколько минут
          </p>
        </div>

        {/* Кнопка */}
        <button
          onClick={() => navigate('/survey')}
          className="btn-primary w-full text-lg"
        >
          Перейти к опросу
        </button>

        {/* Кнопка очистки (для тестирования) */}
        <button
          onClick={handleClearData}
          className="btn-secondary w-full text-sm mt-2 opacity-30"
        >
          🗑️ Начать заново
        </button>
      </div>
      
      {/* Версия */}
      <div className="absolute bottom-2 right-2 text-xs text-lenvpen-text opacity-30">
        {APP_VERSION}
      </div>
    </div>
  );
}

export default RegistrationSuccess;
