import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// Import pages
import Welcome from './pages/Welcome';
import Registration from './pages/Registration';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Survey from './pages/Survey';
import Dashboard from './pages/Dashboard';
import DailyReport from './pages/DailyReport';

// Import services
import { apiClient } from './services/api';
import { useStore } from './store/useStore';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, setUser, setProfile, loadProfile } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Инициализация Telegram WebApp
    WebApp.ready();
    WebApp.expand();

    // Установка цветов
    WebApp.setHeaderColor('#0f0f0f');
    WebApp.setBackgroundColor('#0f0f0f');

    // Авторизация
    authenticateUser();
  }, []);

  const authenticateUser = async () => {
    try {
      // Получаем initData от Telegram
      const initData = WebApp.initData;

      if (!initData) {
        // ТЕСТОВЫЙ РЕЖИМ: используем моковые данные
        if (import.meta.env.DEV) {
          console.warn('Development mode: Using mock user data');
          
          // Создаём тестового пользователя
          const mockUser = {
            id: 'test-user-' + Math.random().toString(36).substr(2, 9),
            telegram_id: 123456789,
            username: 'test_user',
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            photo_url: null
          };
          
          setUser(mockUser);
          setLoading(false);
          navigate('/welcome');
          return;
        }
      }

      // Аутентификация на backend
      const authData = await apiClient.authenticateTelegram(initData);

      setUser(authData.user);

      if (authData.has_profile) {
        // Загружаем полный профиль
        await loadProfile(authData.user.id, apiClient);
        navigate('/dashboard');
      } else {
        // Новый пользователь - показываем welcome
        navigate('/welcome');
      }

      setLoading(false);

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Ошибка авторизации');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-lenvpen-dark">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <div className="text-lenvpen-text text-xl">ЛЕНЬ-В-ПЕНЬ</div>
          <div className="text-lenvpen-muted mt-2">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-lenvpen-dark p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-lenvpen-red text-xl mb-2">Ошибка</div>
          <div className="text-lenvpen-muted">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lenvpen-dark">
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/daily-report" element={<DailyReport />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </div>
  );
}

export default App;
