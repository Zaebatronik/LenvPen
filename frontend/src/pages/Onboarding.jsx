import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';

/**
 * ONBOARDING T3 — После регистрации
 * 3 экрана объяснения системы Процента Силы Лени⁺
 */
function Onboarding() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(1);
  
  const screens = [
    {
      title: 'Как работает система',
      content: (
        <div className="space-y-8">
          <div className="bg-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border/30">
            <h3 className="text-2xl font-bold text-lenvpen-text mb-4">
              Процент Силы Лени⁺
            </h3>
            <p className="text-lenvpen-text/80 leading-relaxed text-lg">
              Главный показатель вашего прогресса. Отражает уровень ресурсов, ясности и контроля над собой для достижения цели.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-lenvpen-text/60 uppercase tracking-wide text-sm">
              Расчёт процента
            </h4>
            
            <div className="space-y-3">
              <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 p-5 rounded-xl hover:bg-lenvpen-card/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-lenvpen-orange/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-lenvpen-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lenvpen-text mb-1">Выбранные зависимости</div>
                    <div className="text-sm text-lenvpen-muted">Курение, алкоголь, сладкое и другие привычки</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 p-5 rounded-xl hover:bg-lenvpen-card/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-lenvpen-red/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-lenvpen-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lenvpen-text mb-1">Уровень вреда</div>
                    <div className="text-sm text-lenvpen-muted">Степень влияния на ваш прогресс</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 p-5 rounded-xl hover:bg-lenvpen-card/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-lenvpen-green/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-lenvpen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lenvpen-text mb-1">Полезная активность</div>
                    <div className="text-sm text-lenvpen-muted">Спорт, работа, обучение, привычки</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 p-5 rounded-xl hover:bg-lenvpen-card/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-lenvpen-orange/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-lenvpen-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lenvpen-text mb-1">Ежедневный учёт</div>
                    <div className="text-sm text-lenvpen-muted">Отметки действий в дневнике</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-lenvpen-card/30 to-lenvpen-card/10 rounded-2xl p-6 border border-lenvpen-border/20">
            <div className="space-y-3 text-lenvpen-text/90">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-lenvpen-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lenvpen-green text-sm">↑</span>
                </div>
                <span>Полезные действия увеличивают процент</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-lenvpen-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lenvpen-red text-sm">↓</span>
                </div>
                <span>Вредные привычки снижают процент</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-lenvpen-orange/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lenvpen-orange text-sm">⚖</span>
                </div>
                <span>Баланс поддерживает стабильный прогресс</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Уровни прогресса',
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="bg-lenvpen-card/30 border-l-4 border-lenvpen-red/50 p-5 rounded-r-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-lenvpen-text">0% – 30%</div>
                <div className="text-xs uppercase tracking-wide text-lenvpen-red/60 font-semibold">Критический</div>
              </div>
              <p className="text-lenvpen-text/70 text-sm">
                Низкий уровень ресурсов. Требуется фокус на базовых изменениях
              </p>
            </div>
            
            <div className="bg-lenvpen-card/30 border-l-4 border-lenvpen-orange/50 p-5 rounded-r-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-lenvpen-text">30% – 60%</div>
                <div className="text-xs uppercase tracking-wide text-lenvpen-orange/60 font-semibold">Становление</div>
              </div>
              <p className="text-lenvpen-text/70 text-sm">
                Формирование стабильности. Прогресс становится заметным
              </p>
            </div>
            
            <div className="bg-lenvpen-card/30 border-l-4 border-lenvpen-green/50 p-5 rounded-r-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-lenvpen-text">60% – 90%</div>
                <div className="text-xs uppercase tracking-wide text-lenvpen-green/60 font-semibold">Уверенность</div>
              </div>
              <p className="text-lenvpen-text/70 text-sm">
                Устойчивое движение к цели. Контроль над привычками
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-lenvpen-orange/10 to-lenvpen-red/10 border border-lenvpen-orange/30 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-lenvpen-orange">90% – 100%</div>
                <div className="text-xs uppercase tracking-wide text-lenvpen-orange/80 font-semibold">Мастерство</div>
              </div>
              <p className="text-lenvpen-text/70 text-sm">
                Максимальная эффективность. Цель практически достигнута
              </p>
            </div>
          </div>
          
          <div className="bg-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border/30">
            <h3 className="text-lg font-bold text-lenvpen-text mb-4">
              Что означает 100%
            </h3>
            
            <div className="bg-lenvpen-dark/50 rounded-xl p-5 mb-4 border border-lenvpen-border/20">
              <p className="text-lenvpen-text/90 leading-relaxed">
                При достижении 100% вероятность реализации цели составляет 99%
              </p>
              <p className="text-xs text-lenvpen-muted mt-2">
                *при условии реалистичности и измеримости цели
              </p>
            </div>
            
            <div className="space-y-2.5 text-sm text-lenvpen-text/80">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-lenvpen-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-lenvpen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Высокая дисциплина</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-lenvpen-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-lenvpen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Контроль зависимостей</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-lenvpen-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-lenvpen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Стабильность полезных действий</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-lenvpen-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-lenvpen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Закреплённые привычки</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-lenvpen-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-lenvpen-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Естественный прогресс</span>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-lenvpen-border/20">
              <p className="text-lenvpen-text/60 text-sm leading-relaxed">
                100% означает трансформацию личности. В этой точке достижение цели становится закономерным результатом ваших изменений.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Начало работы',
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5 hover:bg-lenvpen-card/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-lenvpen-orange/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lenvpen-orange font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-lenvpen-text mb-1">Выбор зависимостей</h4>
                  <p className="text-sm text-lenvpen-muted leading-relaxed">
                    Определите привычки, которые препятствуют достижению цели
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5 hover:bg-lenvpen-card/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-lenvpen-orange/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lenvpen-orange font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-lenvpen-text mb-1">Постановка цели</h4>
                  <p className="text-sm text-lenvpen-muted leading-relaxed">
                    Сформулируйте конкретный и измеримый результат
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5 hover:bg-lenvpen-card/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-lenvpen-orange/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lenvpen-orange font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-lenvpen-text mb-1">Ежедневный учёт</h4>
                  <p className="text-sm text-lenvpen-muted leading-relaxed mb-3">
                    Фиксируйте полезные и вредные действия каждый день
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-lenvpen-text/60">
                      <div className="w-1 h-1 rounded-full bg-lenvpen-green"></div>
                      <span>Полезные действия повышают процент</span>
                    </div>
                    <div className="flex items-center gap-2 text-lenvpen-text/60">
                      <div className="w-1 h-1 rounded-full bg-lenvpen-red"></div>
                      <span>Вредные привычки снижают процент</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-lenvpen-card/30 border border-lenvpen-border/20 rounded-xl p-5 hover:bg-lenvpen-card/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-lenvpen-orange/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lenvpen-orange font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-lenvpen-text mb-1">Отслеживание прогресса</h4>
                  <p className="text-sm text-lenvpen-muted leading-relaxed">
                    Визуальный индикатор отражает ваш текущий уровень
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border/30">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-lenvpen-orange/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-lenvpen-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-lenvpen-text mb-2">Автоматизированная система</h3>
                <p className="text-lenvpen-text/70 text-sm leading-relaxed">
                  Алгоритм рассчитывает оптимальный путь на основе ваших данных. Требуется только ежедневная фиксация действий.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-lenvpen-dark/50 rounded-xl p-5 border border-lenvpen-border/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-lenvpen-orange flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lenvpen-text/60 text-xs leading-relaxed">
                <span className="font-semibold text-lenvpen-text/80">Рекомендация:</span> Стабильный прирост +1% ежедневно даёт +30% за месяц. Фокус на постоянстве эффективнее резких скачков.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];
  
  const handleNext = () => {
    if (currentScreen < 3) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // Отмечаем, что онбординг пройден
      const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
      if (user.telegram_id) {
        localStorage.setItem(`lenvpen_onboarding_completed_${user.telegram_id}`, 'true');
      }
      navigate('/survey');
    }
  };
  
  const handleSkip = () => {
    const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
    if (user.telegram_id) {
      localStorage.setItem(`lenvpen_onboarding_completed_${user.telegram_id}`, 'true');
    }
    navigate('/survey');
  };
  
  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col">
      {/* Progress header */}
      <div className="sticky top-0 bg-lenvpen-dark/98 backdrop-blur-xl border-b border-lenvpen-border/30 z-20">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-lenvpen-muted hover:text-lenvpen-text transition-colors text-sm font-medium"
            >
              Пропустить
            </button>
            <div className="flex gap-2.5">
              {[1, 2, 3].map(dot => (
                <div
                  key={dot}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dot === currentScreen
                      ? 'bg-lenvpen-orange w-12'
                      : dot < currentScreen
                      ? 'bg-lenvpen-orange/40 w-8'
                      : 'bg-lenvpen-border/50 w-8'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-lenvpen-muted font-medium">{currentScreen}/3</div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-lenvpen-text mb-8 tracking-tight">
            {screens[currentScreen - 1].title}
          </h1>
          
          {screens[currentScreen - 1].content}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="sticky bottom-0 bg-lenvpen-dark/98 backdrop-blur-xl border-t border-lenvpen-border/30 p-6">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentScreen > 1 && (
            <button
              onClick={() => setCurrentScreen(currentScreen - 1)}
              className="flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all bg-lenvpen-card/50 text-lenvpen-text border border-lenvpen-border/30 hover:bg-lenvpen-card/80 hover:border-lenvpen-border/50"
            >
              ← Назад
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white hover:shadow-lg hover:shadow-lenvpen-orange/20"
          >
            {currentScreen === 3 ? 'Начать работу' : 'Далее →'}
          </button>
        </div>
      </div>
      
      {/* Version */}
      <div className="text-center py-3 bg-lenvpen-dark">
        <span className="text-lenvpen-text/20 text-xs font-medium">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Onboarding;
