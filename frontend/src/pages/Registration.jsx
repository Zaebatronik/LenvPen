import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import texts from '../locales/ru.json';
import { APP_VERSION } from '../config/version';

function Registration() {
  const navigate = useNavigate();
  const { user, updateUser } = useStore();
  
  const [formData, setFormData] = useState({
    country: '',
    city: '',
    nickname: '',
    password: '',
    telegram_id: user?.telegram_id || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    // Валидация
    if (!formData.country.trim()) {
      alert('Укажите страну');
      return;
    }
    if (!formData.city.trim()) {
      alert('Укажите город');
      return;
    }
    if (!formData.nickname.trim()) {
      alert('Укажите никнейм');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      alert('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      // Сохраняем данные регистрации с привязкой к telegram_id
      const userData = {
        ...user,
        country: formData.country,
        city: formData.city,
        username: formData.nickname,
        registered: true,
        registered_at: new Date().toISOString()
      };
      
      // Сохраняем в localStorage по telegram_id (БЕЗ пароля в открытом виде!)
      localStorage.setItem(`lenvpen_user_${user.telegram_id}`, JSON.stringify(userData));
      
      // Обновляем в store
      updateUser(userData);
      
      console.log('User registered:', user.telegram_id);

      // Переходим к экрану успешной регистрации
      setTimeout(() => {
        navigate('/registration-success');
      }, 500);
      
      // TODO: Когда будет backend:
      // await apiClient.register(formData);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка регистрации: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Заголовок */}
        <h1 className="text-4xl font-bold text-lenvpen-text text-center">
          {texts.registration.form.title}
        </h1>

        {/* Подтекст */}
        <p className="text-xl text-lenvpen-muted text-center">
          {texts.registration.form.subtitle}
        </p>

        {/* Форма */}
        <div className="card space-y-5">
          {/* Страна */}
          <div>
            <label className="text-lenvpen-text block mb-2 font-medium">
              {texts.registration.form.fields.country}
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Россия, Беларусь, Казахстан..."
              className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors"
            />
          </div>

          {/* Город */}
          <div>
            <label className="text-lenvpen-text block mb-2 font-medium">
              {texts.registration.form.fields.city}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Москва, Минск, Алматы..."
              className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors"
            />
          </div>

          {/* Никнейм */}
          <div>
            <label className="text-lenvpen-text block mb-2 font-medium">
              {texts.registration.form.fields.nickname}
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              placeholder="Твой никнейм"
              className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors"
            />
          </div>

          {/* Пароль */}
          <div>
            <label className="text-lenvpen-text block mb-2 font-medium">
              {texts.registration.form.fields.password}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors"
            />
          </div>

          {/* Telegram ID (автозаполнение) */}
          <div>
            <label className="text-lenvpen-text block mb-2 font-medium">
              {texts.registration.form.fields.telegram_id}
            </label>
            <input
              type="text"
              value={formData.telegram_id}
              disabled
              className="w-full p-4 bg-lenvpen-dark text-lenvpen-muted rounded-lg border border-lenvpen-border cursor-not-allowed"
            />
            <p className="text-sm text-lenvpen-muted mt-1">
              Заполняется автоматически из Telegram
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/welcome')}
            className="btn-secondary text-xl flex-1"
          >
            Назад
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="btn-primary text-xl flex-1"
          >
            {loading ? 'Регистрация...' : texts.registration.form.btnRegister}
          </button>
        </div>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-4 right-4 text-lenvpen-text/40 text-sm">
        v{APP_VERSION}
      </div>
    </div>
  );
}

export default Registration;
