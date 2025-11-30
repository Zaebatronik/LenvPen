import { useNavigate, useLocation } from 'react-router-dom';

/**
 * NAVIGATION COMPONENT
 * Единая навигация без дублирования
 * Верх: Главная, Календарь, Прогресс, Зависимости
 * Низ: Отчёт дня, Мотивация, Профиль
 */

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Верхнее меню */}
      <div className="fixed top-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-b border-lenvpen-border z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/dashboard')
                  ? 'text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <span className="text-2xl">🏠</span>
              <span className="text-xs font-medium">Главная</span>
            </button>

            <button
              onClick={() => navigate('/calendar')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/calendar')
                  ? 'text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <span className="text-2xl">📅</span>
              <span className="text-xs font-medium">Календарь</span>
            </button>

            <button
              onClick={() => navigate('/analytics')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/analytics')
                  ? 'text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <span className="text-2xl">📊</span>
              <span className="text-xs font-medium">Прогресс</span>
            </button>

            <button
              onClick={() => navigate('/daily-tasks')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/daily-tasks')
                  ? 'text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-medium">Зависимости</span>
            </button>
          </div>
        </div>
      </div>

      {/* Нижнее меню */}
      <div className="fixed bottom-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-t border-lenvpen-border z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <button
              onClick={() => navigate('/daily-report')}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive('/daily-report')
                  ? 'text-lenvpen-accent scale-110'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <div className={`rounded-full p-2 ${isActive('/daily-report') ? 'bg-lenvpen-accent/10' : ''}`}>
                <span className="text-3xl">📋</span>
              </div>
              <span className="text-xs font-bold">Отчёт дня</span>
            </button>

            <button
              onClick={() => navigate('/motivation')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/motivation')
                  ? 'text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <span className="text-2xl">💪</span>
              <span className="text-xs font-medium">Мотивация</span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive('/settings')
                  ? 'text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text'
              }`}
            >
              <span className="text-2xl">👤</span>
              <span className="text-xs font-medium">Профиль</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navigation;
