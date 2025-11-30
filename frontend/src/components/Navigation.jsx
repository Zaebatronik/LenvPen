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
      {/* Верхнее меню - 3 вкладки */}
      <div className="fixed top-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-b border-lenvpen-border z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                isActive('/dashboard')
                  ? 'bg-lenvpen-accent/10 text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text hover:bg-lenvpen-bg/50'
              }`}
            >
              <span className="text-2xl">🏠</span>
              <span className="text-xs font-bold">Главная</span>
            </button>

            <button
              onClick={() => navigate('/progress')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                isActive('/progress')
                  ? 'bg-lenvpen-accent/10 text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text hover:bg-lenvpen-bg/50'
              }`}
            >
              <span className="text-2xl">📊</span>
              <span className="text-xs font-bold">Прогресс</span>
            </button>

            <button
              onClick={() => navigate('/calendar')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                isActive('/calendar')
                  ? 'bg-lenvpen-accent/10 text-lenvpen-accent'
                  : 'text-lenvpen-muted hover:text-lenvpen-text hover:bg-lenvpen-bg/50'
              }`}
            >
              <span className="text-2xl">📅</span>
              <span className="text-xs font-bold">Календарь</span>
            </button>
          </div>
        </div>
      </div>

      {/* Нижнее меню - 2 кнопки */}
      <div className="fixed bottom-0 left-0 right-0 bg-lenvpen-card/95 backdrop-blur-md border-t border-lenvpen-border z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/daily-report')}
              className={`flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                isActive('/daily-report')
                  ? 'bg-lenvpen-accent text-white shadow-lg shadow-lenvpen-accent/20'
                  : 'bg-lenvpen-card border border-lenvpen-border text-lenvpen-text hover:border-lenvpen-accent/50'
              }`}
            >
              <span className="text-2xl">📋</span>
              <span>Отчёт за день</span>
            </button>

            <button
              onClick={() => navigate('/dependencies')}
              className={`flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                isActive('/dependencies')
                  ? 'bg-lenvpen-accent text-white shadow-lg shadow-lenvpen-accent/20'
                  : 'bg-lenvpen-card border border-lenvpen-border text-lenvpen-text hover:border-lenvpen-accent/50'
              }`}
            >
              <span className="text-2xl">🎯</span>
              <span>Мои зависимости</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navigation;
