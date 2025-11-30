import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import { HUMOR_TYPES, getRandomHumor } from '../utils/slothBehavior';

function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentJoke, setCurrentJoke] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      // Удаляем из Supabase если есть доступ
      if (user.telegram_id !== 'dev_test' && typeof user.telegram_id === 'number') {
        try {
          const { supabase } = await import('../services/supabase');
          
          // Удаляем пользователя из базы
          await supabase
            .from('users')
            .delete()
            .eq('telegram_id', user.telegram_id);
          
          console.log('User deleted from Supabase');
        } catch (supabaseError) {
          console.log('Supabase delete error (ignored):', supabaseError.message);
        }
      }

      // Удаляем ВСЕ данные пользователя из localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes(user.telegram_id.toString()) || 
          key === 'lenvpen_user' ||
          key === 'lenvpen_telegram_user'
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('Removed:', key);
      });
      
      // Дополнительно очищаем глобальный стейт
      localStorage.clear();
      
      console.log(`All data deleted: ${keysToRemove.length} keys removed`);

      // Показываем уведомление
      WebApp.showAlert('Аккаунт удалён. Данные стёрты. Начни заново!', () => {
        // Сбрасываем пользователя
        setUser(null);
        
        // Перезагружаем страницу для полного сброса
        window.location.href = '/welcome';
      });

    } catch (error) {
      console.error('Delete account error:', error);
      WebApp.showAlert('Ошибка удаления: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-lenvpen-dark/95 backdrop-blur-md border-b border-lenvpen-border/50 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 safe-area-inset">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-lenvpen-orange hover:text-lenvpen-red transition-colors active:scale-95 transform"
            >
              <span className="text-xl">🏠</span>
              <span className="hidden sm:inline">Главная</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-lenvpen-orange to-lenvpen-red bg-clip-text text-transparent">⚙️ Настройки</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Информация о пользователе */}
        <div className="card space-y-3 bg-gradient-to-br from-lenvpen-card to-lenvpen-bg shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-lenvpen-orange to-lenvpen-red bg-clip-text text-transparent">Информация</h2>
          <div className="space-y-2 text-sm">
            <p className="text-lenvpen-muted flex justify-between items-center">
              <span>Никнейм:</span> <span className="text-lenvpen-text font-semibold">{user?.username || 'Не указан'}</span>
            </p>
            <p className="text-lenvpen-muted">
              Имя: <span className="text-lenvpen-text">{user?.first_name || 'Не указано'}</span>
            </p>
            <p className="text-lenvpen-muted">
              Страна: <span className="text-lenvpen-text">{user?.country || 'Не указана'}</span>
            </p>
            <p className="text-lenvpen-muted">
              Город: <span className="text-lenvpen-text">{user?.city || 'Не указан'}</span>
            </p>
            {user?.registered_at && (
              <p className="text-lenvpen-muted">
                Регистрация: <span className="text-lenvpen-text">
                  {new Date(user.registered_at).toLocaleDateString('ru-RU')}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* БЛОК F: Юмор ленивца */}
        <div className="card space-y-3 bg-gradient-to-br from-lenvpen-orange/10 to-lenvpen-red/10 border border-lenvpen-orange/20">
          <h2 className="text-lg font-bold text-lenvpen-orange flex items-center gap-2">
            <span>😄</span> Чувство юмора ленивца
          </h2>
          <p className="text-lenvpen-muted text-sm">
            Ленивец знает 4 типа юмора. Нажми на кнопку, чтобы услышать случайную шутку!
          </p>
          {currentJoke && (
            <div className="bg-lenvpen-dark/50 rounded-lg p-4 border-l-4 border-lenvpen-orange">
              <p className="text-lenvpen-text italic">"{currentJoke}"</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentJoke(getRandomHumor('SITUATIONAL'))}
              className="p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors border border-lenvpen-orange/30"
            >
              🎭 Ситуационный
            </button>
            <button
              onClick={() => setCurrentJoke(getRandomHumor('MEME'))}
              className="p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors border border-lenvpen-orange/30"
            >
              🤡 Мемный
            </button>
            <button
              onClick={() => setCurrentJoke(getRandomHumor('OBSERVATIONAL'))}
              className="p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors border border-lenvpen-orange/30"
            >
              👀 Наблюдательный
            </button>
            <button
              onClick={() => setCurrentJoke(getRandomHumor('SARCASM'))}
              className="p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors border border-lenvpen-orange/30"
            >
              😏 Сарказм
            </button>
          </div>
        </div>

        {/* Данные */}
        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-lenvpen-text">Данные</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
                if (surveyData) {
                  const data = JSON.parse(surveyData);
                  WebApp.showAlert(`Зависимости: ${data.dependencies?.length || 0}\nПриоритеты: ${data.priorities?.length || 0}`);
                } else {
                  WebApp.showAlert('Данные опроса не найдены');
                }
              }}
              className="w-full p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text text-left hover:bg-lenvpen-border transition-colors"
            >
              📊 Просмотреть данные опроса
            </button>
            
            <button
              onClick={() => {
                // Экспорт данных
                const userData = localStorage.getItem(`lenvpen_user_${user.telegram_id}`);
                const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
                const exportData = {
                  user: userData ? JSON.parse(userData) : null,
                  survey: surveyData ? JSON.parse(surveyData) : null,
                  exported_at: new Date().toISOString()
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `lenvpen_backup_${user.telegram_id}.json`;
                link.click();
                
                WebApp.showAlert('Данные экспортированы!');
              }}
              className="w-full p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text text-left hover:bg-lenvpen-border transition-colors"
            >
              💾 Экспортировать данные
            </button>
          </div>
        </div>

        {/* Опасная зона */}
        <div className="card space-y-3 border-2 border-lenvpen-red/20">
          <h2 className="text-lg font-bold text-lenvpen-red">⚠️ Опасная зона</h2>
          <p className="text-sm text-lenvpen-muted">
            Удаление аккаунта необратимо. Все твои данные, цели, зависимости и отчёты будут удалены навсегда.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-4 bg-lenvpen-red/10 hover:bg-lenvpen-red/20 rounded-lg text-lenvpen-red font-bold transition-colors"
            >
              🗑️ Удалить аккаунт
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-lenvpen-red/10 rounded-lg space-y-2">
                <p className="text-lenvpen-red font-bold text-center">
                  ⚠️ Ты уверен?
                </p>
                <p className="text-sm text-lenvpen-text text-center">
                  Это действие нельзя отменить. Все данные будут удалены.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 p-3 bg-lenvpen-bg rounded-lg text-lenvpen-text font-medium hover:bg-lenvpen-border transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 p-3 bg-lenvpen-red hover:bg-lenvpen-red/80 rounded-lg text-white font-bold transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Удаляем...' : 'Да, удалить'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* О приложении */}
        <div className="card space-y-2">
          <h2 className="text-lg font-bold text-lenvpen-text">О приложении</h2>
          <div className="space-y-1 text-sm">
            <p className="text-lenvpen-muted">
              Версия: <span className="text-lenvpen-text font-mono">v{APP_VERSION}</span>
            </p>
            <p className="text-lenvpen-muted">
              Проект: <span className="text-lenvpen-text">Лень-в-Пень</span>
            </p>
            <p className="text-lenvpen-muted">
              Описание: <span className="text-lenvpen-text">Мотивационное приложение для борьбы с зависимостями</span>
            </p>
          </div>
        </div>
      </div>

      {/* Версия */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <span className="text-lenvpen-text/40 text-xs font-medium">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Settings;
