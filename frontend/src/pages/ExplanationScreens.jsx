import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';

/**
 * EXPLANATION SCREENS - 2 экрана объяснения системы процентов
 * Показываются после завершения Survey
 */

function ExplanationScreens() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(1);

  const handleNext = () => {
    if (currentScreen === 1) {
      setCurrentScreen(2);
    } else {
      // Сохраняем флаг, что объяснение просмотрено
      const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
      localStorage.setItem(`lenvpen_explanation_completed_${user.telegram_id}`, 'true');
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
    localStorage.setItem(`lenvpen_explanation_completed_${user.telegram_id}`, 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-lenvpen-bg flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Экран 1 */}
        {currentScreen === 1 && (
          <div className="space-y-8 text-center animate-fadeIn">
            <div className="text-8xl mb-6">📊</div>
            
            <h1 className="text-3xl font-bold text-lenvpen-text mb-4">
              Как работают проценты?
            </h1>

            <div className="bg-lenvpen-card border border-lenvpen-border rounded-2xl p-8 space-y-6 text-left">
              <div className="space-y-4">
                <p className="text-lenvpen-text text-lg leading-relaxed">
                  <span className="font-bold text-lenvpen-accent">Проценты</span> — это уровень вашего пути к цели.
                </p>
                
                <p className="text-lenvpen-text text-lg leading-relaxed">
                  Вы начинаете с <span className="font-bold text-lenvpen-accent">0%</span> — это нормально. 
                  Ленивец пока ждёт вашего первого шага.
                </p>

                <div className="bg-lenvpen-bg rounded-xl p-6 space-y-3">
                  <p className="text-lenvpen-text font-semibold">
                    Каждый день вы вносите отчёт, и ленивец меняется:
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✅</span>
                    <span className="text-lenvpen-text">
                      <span className="font-bold text-lenvpen-green">Хорошие действия</span> → повышают проценты
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">❌</span>
                    <span className="text-lenvpen-text">
                      <span className="font-bold text-lenvpen-red">Вредные привычки</span> → понижают проценты
                    </span>
                  </div>
                </div>

                <p className="text-lenvpen-accent text-xl font-bold text-center mt-6">
                  Ваш прогресс = сила вашего ленивца 💪
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-lenvpen-muted text-sm">
              <div className={`h-2 w-2 rounded-full ${currentScreen === 1 ? 'bg-lenvpen-accent' : 'bg-lenvpen-muted'}`} />
              <div className={`h-2 w-2 rounded-full ${currentScreen === 2 ? 'bg-lenvpen-accent' : 'bg-lenvpen-muted'}`} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="flex-1 py-4 px-6 rounded-xl font-semibold bg-lenvpen-card border border-lenvpen-border text-lenvpen-muted hover:text-lenvpen-text hover:bg-lenvpen-bg transition-all"
              >
                Пропустить
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 px-6 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all shadow-lg shadow-lenvpen-accent/20"
              >
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* Экран 2 */}
        {currentScreen === 2 && (
          <div className="space-y-8 text-center animate-fadeIn">
            <div className="text-8xl mb-6">🎯</div>
            
            <h1 className="text-3xl font-bold text-lenvpen-text mb-4">
              Когда будет 100%?
            </h1>

            <div className="bg-lenvpen-card border border-lenvpen-border rounded-2xl p-8 space-y-6 text-left">
              <div className="space-y-4">
                <p className="text-lenvpen-text text-lg leading-relaxed">
                  Когда вы достигнете <span className="font-bold text-lenvpen-green">100%</span> — вы достигнете своей цели.
                </p>
                
                <p className="text-lenvpen-text text-lg leading-relaxed">
                  В <span className="font-bold text-lenvpen-accent">99% случаев</span> это означает реальный успех,
                </p>

                <p className="text-lenvpen-muted text-base italic">
                  если ваша цель не «построить ракету из картона» 🚀📦
                </p>

                <div className="bg-gradient-to-br from-lenvpen-accent/10 to-lenvpen-bg rounded-xl p-6 border border-lenvpen-accent/30 mt-6">
                  <p className="text-lenvpen-text text-lg font-semibold mb-3 text-center">
                    💡 Главный секрет
                  </p>
                  <p className="text-lenvpen-text text-base leading-relaxed text-center">
                    Делайте маленькие шаги каждый день —<br/>
                    и вы увидите, как ленивец растёт,<br/>
                    а вместе с ним — <span className="font-bold text-lenvpen-accent">и вы</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-lenvpen-muted text-sm">
              <div className={`h-2 w-2 rounded-full ${currentScreen === 1 ? 'bg-lenvpen-accent' : 'bg-lenvpen-muted'}`} />
              <div className={`h-2 w-2 rounded-full ${currentScreen === 2 ? 'bg-lenvpen-accent' : 'bg-lenvpen-muted'}`} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentScreen(1)}
                className="flex-1 py-4 px-6 rounded-xl font-semibold bg-lenvpen-card border border-lenvpen-border text-lenvpen-text hover:bg-lenvpen-bg transition-all"
              >
                ← Назад
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 px-6 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all shadow-lg shadow-lenvpen-accent/20"
              >
                Начать! 🚀
              </button>
            </div>
          </div>
        )}

        {/* Версия */}
        <div className="text-center mt-8">
          <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}

export default ExplanationScreens;
