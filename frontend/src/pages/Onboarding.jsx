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
      title: 'Добро пожаловать! Вот как всё работает 👇',
      content: (
        <div className="space-y-6">
          <div className="bg-lenvpen-orange/10 rounded-xl p-6 border-2 border-lenvpen-orange">
            <h3 className="text-xl font-bold text-lenvpen-orange mb-3">
              Ваш главный показатель — Процент Силы Лени⁺
            </h3>
            <p className="text-lenvpen-text leading-relaxed">
              Это не про то, насколько вы ленивы — это про то, <span className="font-bold text-lenvpen-orange">сколько у вас ресурсов, ясности и контроля</span> над собой, чтобы дойти до цели.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-lenvpen-text">
              Система считает ваш % на основе:
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-lenvpen-card p-4 rounded-lg">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-semibold text-lenvpen-text">Выбранных зависимостей</div>
                  <div className="text-sm text-lenvpen-muted">курение, алкоголь, сладкое и т.д.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-lenvpen-card p-4 rounded-lg">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-semibold text-lenvpen-text">Уровня их вреда</div>
                  <div className="text-sm text-lenvpen-muted">насколько сильно они влияют</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-lenvpen-card p-4 rounded-lg">
                <span className="text-2xl">💪</span>
                <div>
                  <div className="font-semibold text-lenvpen-text">Вашей активности</div>
                  <div className="text-sm text-lenvpen-muted">спорт, работа, учёба, хорошие привычки</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-lenvpen-card p-4 rounded-lg">
                <span className="text-2xl">📝</span>
                <div>
                  <div className="font-semibold text-lenvpen-text">Ежедневных отметок</div>
                  <div className="text-sm text-lenvpen-muted">«делал / не делал»</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-lenvpen-green/10 rounded-xl p-6 border-2 border-lenvpen-green">
            <h4 className="text-lg font-bold text-lenvpen-green mb-3">Проще говоря:</h4>
            <div className="space-y-2 text-lenvpen-text">
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-green font-bold">↑</span>
                <span>сделали что-то полезное → % растёт</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-red font-bold">↓</span>
                <span>сделали что-то вредное → % падает</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-orange font-bold">⚖️</span>
                <span>держите баланс → ленивец оживает и помогает вам идти дальше</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Зачем нужен этот процент?',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="bg-lenvpen-red/20 rounded-xl p-5 border-2 border-lenvpen-red">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">😵</span>
                <div className="text-2xl font-bold text-lenvpen-red">0% – 30%</div>
              </div>
              <p className="text-lenvpen-text">
                Ваш ленивец еле жив… и ваша цель тоже 😅
              </p>
            </div>
            
            <div className="bg-lenvpen-orange/20 rounded-xl p-5 border-2 border-lenvpen-orange">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🙂</span>
                <div className="text-2xl font-bold text-lenvpen-orange">30% – 60%</div>
              </div>
              <p className="text-lenvpen-text">
                Вы становитесь стабильнее, сила растёт
              </p>
            </div>
            
            <div className="bg-lenvpen-green/20 rounded-xl p-5 border-2 border-lenvpen-green">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">😎</span>
                <div className="text-2xl font-bold text-lenvpen-green">60% – 90%</div>
              </div>
              <p className="text-lenvpen-text">
                Вы уверенно движетесь к своей цели
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-lenvpen-orange to-lenvpen-red p-5 rounded-xl border-2 border-lenvpen-orange">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🔥</span>
                <div className="text-2xl font-bold text-white">90% – 100%</div>
              </div>
              <p className="text-white font-semibold">
                Вы почти у вершины и идёте на полном заряде
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-lenvpen-orange/10 to-lenvpen-red/10 rounded-xl p-6 border-2 border-lenvpen-orange">
            <h3 className="text-xl font-bold text-lenvpen-orange mb-4">
              🎯 Что происходит при 100%?
            </h3>
            
            <div className="bg-lenvpen-bg rounded-lg p-4 mb-4">
              <p className="text-lenvpen-text text-lg font-semibold mb-2">
                При достижении 100% в 99% случаев вы достигаете своей цели
              </p>
              <p className="text-sm text-lenvpen-muted">
                (если ваша цель — не «стану космонавтом за неделю» 🤝🚀)
              </p>
            </div>
            
            <div className="space-y-2 text-lenvpen-text">
              <div className="text-lg font-bold text-lenvpen-orange mb-2">100% =</div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-green">✓</span>
                <span>вы дисциплинированы</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-green">✓</span>
                <span>зависимости под контролем</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-green">✓</span>
                <span>полезные действия стабильны</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-green">✓</span>
                <span>привычки закрепляются</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lenvpen-green">✓</span>
                <span>прогресс становится естественным</span>
              </div>
            </div>
            
            <div className="mt-4 bg-lenvpen-card rounded-lg p-4">
              <p className="text-lenvpen-text italic">
                Это та точка, где <span className="font-bold text-lenvpen-orange">вы уже другой человек</span> — и цель становится <span className="font-bold text-lenvpen-green">неизбежным результатом</span>.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Что делать дальше?',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="bg-lenvpen-card rounded-xl p-5 border-l-4 border-lenvpen-orange">
              <div className="flex items-start gap-3">
                <span className="text-3xl">1️⃣</span>
                <div>
                  <h4 className="text-lg font-bold text-lenvpen-text mb-1">Выберите свои зависимости</h4>
                  <p className="text-sm text-lenvpen-muted">
                    Честно отметьте, что мешает вам двигаться к цели
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-lenvpen-card rounded-xl p-5 border-l-4 border-lenvpen-orange">
              <div className="flex items-start gap-3">
                <span className="text-3xl">2️⃣</span>
                <div>
                  <h4 className="text-lg font-bold text-lenvpen-text mb-1">Отметьте цель</h4>
                  <p className="text-sm text-lenvpen-muted">
                    Куда вы идёте? Чего хотите достичь?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-lenvpen-card rounded-xl p-5 border-l-4 border-lenvpen-orange">
              <div className="flex items-start gap-3">
                <span className="text-3xl">3️⃣</span>
                <div>
                  <h4 className="text-lg font-bold text-lenvpen-text mb-1">Каждый вечер отмечайте день</h4>
                  <div className="space-y-1 text-sm text-lenvpen-muted mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lenvpen-red">↓</span>
                      <span>вредные действия → % падает</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lenvpen-green">↑</span>
                      <span>полезные действия → % растёт</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-lenvpen-card rounded-xl p-5 border-l-4 border-lenvpen-orange">
              <div className="flex items-start gap-3">
                <span className="text-3xl">4️⃣</span>
                <div>
                  <h4 className="text-lg font-bold text-lenvpen-text mb-1">Следите за ленивцем в центре экрана</h4>
                  <p className="text-sm text-lenvpen-muted">
                    Он показывает ваше состояние лучше любых цифр
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-lenvpen-orange/10 to-lenvpen-red/10 rounded-xl p-6 border-2 border-lenvpen-orange">
            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">🦥</div>
              <h3 className="text-xl font-bold text-lenvpen-orange">И всё!</h3>
              <p className="text-lenvpen-text leading-relaxed">
                Система сама ведёт вас к результату.
              </p>
              <p className="text-lenvpen-text font-semibold">
                Ваше дело — просто прожить один день честно и поставить пару галочек.
              </p>
            </div>
          </div>
          
          <div className="bg-lenvpen-green/10 rounded-lg p-4 border border-lenvpen-green">
            <p className="text-center text-lenvpen-text text-sm">
              💡 <span className="font-semibold">Совет:</span> Не гонитесь за 100% сразу. Даже +1% каждый день через месяц даст вам +30%. А это уже <span className="text-lenvpen-green font-bold">огромный прогресс</span>.
            </p>
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
      {/* Progress dots */}
      <div className="sticky top-0 bg-lenvpen-dark/95 backdrop-blur-md border-b border-lenvpen-border/50 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-lenvpen-muted hover:text-lenvpen-text transition-colors text-sm"
            >
              Пропустить
            </button>
            <div className="flex gap-2">
              {[1, 2, 3].map(dot => (
                <div
                  key={dot}
                  className={`w-2 h-2 rounded-full transition-all ${
                    dot === currentScreen
                      ? 'bg-lenvpen-orange w-8'
                      : 'bg-lenvpen-border'
                  }`}
                />
              ))}
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-lenvpen-text mb-6">
            {screens[currentScreen - 1].title}
          </h1>
          
          {screens[currentScreen - 1].content}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="sticky bottom-0 bg-lenvpen-card border-t border-lenvpen-border p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentScreen > 1 && (
            <button
              onClick={() => setCurrentScreen(currentScreen - 1)}
              className="btn-secondary flex-1"
            >
              ← Назад
            </button>
          )}
          <button
            onClick={handleNext}
            className="btn-primary flex-1"
          >
            {currentScreen === 3 ? 'Начать!' : 'Далее →'}
          </button>
        </div>
      </div>
      
      {/* Version */}
      <div className="text-center py-2">
        <span className="text-lenvpen-text/30 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Onboarding;
