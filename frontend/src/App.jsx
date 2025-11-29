import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// Import pages
import Welcome from './pages/Welcome';
import SelectCountry from './pages/SelectCountry';
import SelectCity from './pages/SelectCity';
import SetNickname from './pages/SetNickname';
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
      // Получаем Telegram ID пользователя (всегда используем реальный ID)
      const telegramId = WebApp.initDataUnsafe?.user?.id;
      
      if (!telegramId) {
        console.error('Telegram ID not found');
        setError('Ошибка авторизации Telegram');
        setLoading(false);
        return;
      }

      console.log('Authenticating user with telegram_id:', telegramId);
      
      // Проверяем, есть ли уже зарегистрированный пользователь с этим telegram_id
      const existingUserData = localStorage.getItem(`lenvpen_user_${telegramId}`);
      
      if (existingUserData) {
        // Пользователь уже зарегистрирован - загружаем его данные
        const userData = JSON.parse(existingUserData);
        console.log('Existing user found:', telegramId, userData);
        
        setUser(userData);
        setLoading(false);
        
        // Если регистрация завершена
        if (userData.registered) {
          // Проверяем, прошёл ли пользователь опросник
          const surveyDataString = localStorage.getItem(`lenvpen_survey_${telegramId}`);
          if (surveyDataString) {
            navigate('/dashboard');
          } else {
            navigate('/survey');
          }
        } else {
          // Регистрация не завершена - продолжаем
          navigate('/welcome');
        }
      } else {
        // Новый пользователь - создаем базовые данные
        console.log('New user, telegram_id:', telegramId);
        
        const newUser = {
          id: `user_${telegramId}`,
          telegram_id: telegramId,
          username: WebApp.initDataUnsafe?.user?.username || 'user',
          first_name: WebApp.initDataUnsafe?.user?.first_name || 'Пользователь',
          last_name: WebApp.initDataUnsafe?.user?.last_name || '',
          photo_url: null,
          registered: false // Флаг регистрации
        };
        
        setUser(newUser);
        setLoading(false);
        navigate('/welcome');
      }

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
        <Route path="/select-country" element={<SelectCountry />} />
        <Route path="/select-city" element={<SelectCity />} />
        <Route path="/set-nickname" element={<SetNickname />} />
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
