import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';

function SetNickname() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useStore();
  
  const country = location.state?.country;
  const city = location.state?.city;
  
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  if (!country || !city) {
    navigate('/select-country');
    return null;
  }

  const handleComplete = async () => {
    if (!nickname.trim()) {
      alert('Введи никнейм');
      return;
    }

    if (nickname.length < 3) {
      alert('Никнейм должен быть минимум 3 символа');
      return;
    }

    setLoading(true);

    try {
      // Временно: используем только localStorage, пока не настроим RLS в Supabase
      const userData = {
        ...user,
        id: `user_${user.telegram_id}`,
        country,
        city,
        username: nickname.trim(),
        registered: true,
        registered_at: new Date().toISOString()
      };
      
      localStorage.setItem(`lenvpen_user_${user.telegram_id}`, JSON.stringify(userData));
      updateUser(userData);
      
      // TODO: Добавить синхронизацию с Supabase после настройки RLS политик
      console.log('User registered locally:', userData);
      
      // Сразу переходим к опросу после регистрации
      navigate('/survey');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка регистрации: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-lenvpen-text text-center">
          Последний шаг!
        </h1>

        <div className="card space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lenvpen-muted">
              Страна: <span className="text-lenvpen-text font-medium">{country}</span>
            </p>
            <p className="text-lenvpen-muted">
              Город: <span className="text-lenvpen-text font-medium">{city}</span>
            </p>
          </div>

          <div>
            <label className="text-lenvpen-text block mb-2 font-medium text-lg">
              Придумай никнейм
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Твой никнейм"
              className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors text-lg"
              autoFocus
              maxLength={20}
            />
            <p className="text-sm text-lenvpen-muted mt-2">
              Минимум 3 символа, максимум 20
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/select-city', { state: { country } })}
            className="btn-secondary flex-1 text-lg"
          >
            Назад
          </button>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="btn-primary flex-1 text-lg"
          >
            {loading ? 'Завершаем...' : 'Завершить регистрацию'}
          </button>
        </div>
      </div>

      {/* Версия */}
      <div className="absolute bottom-2 right-2 text-xs text-lenvpen-text opacity-30">
        {APP_VERSION}
      </div>
    </div>
  );
}

export default SetNickname;
