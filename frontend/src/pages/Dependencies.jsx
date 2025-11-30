import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';
import Navigation from '../components/Navigation';

/**
 * DEPENDENCIES - Мои зависимости
 * Показывает список выбранных зависимостей с параметрами
 */

function Dependencies() {
  const navigate = useNavigate();
  const [dependencies, setDependencies] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');
  const surveyData = JSON.parse(localStorage.getItem(`lenvpen_survey_${user.telegram_id}`) || '{}');

  useEffect(() => {
    if (surveyData.dependencies) {
      setDependencies(surveyData.dependencies);
    }
  }, []);

  return (
    <div className="min-h-screen bg-lenvpen-bg">
      <Navigation />
      
      <div className="pt-20 pb-24 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <h1 className="text-3xl font-bold text-lenvpen-text">Мои зависимости</h1>
          
          {dependencies.length > 0 ? (
            <div className="space-y-4">
              {dependencies.map(depKey => {
                const params = surveyData.depParams?.[depKey] || { harm: 5, difficulty: 5, frequency: 3 };
                
                return (
                  <div key={depKey} className="bg-lenvpen-card rounded-2xl p-6 border border-lenvpen-border">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">🚬</span>
                      <h3 className="text-xl font-bold text-lenvpen-text capitalize">{depKey}</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lenvpen-muted">Вред для здоровья:</span>
                        <span className="text-lenvpen-red font-bold">{params.harm}/10</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lenvpen-muted">Сложность избавления:</span>
                        <span className="text-lenvpen-orange font-bold">{params.difficulty}/10</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lenvpen-muted">Частота в неделю:</span>
                        <span className="text-lenvpen-accent font-bold">{params.frequency} дней</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-lenvpen-card rounded-2xl p-12 border border-lenvpen-border text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lenvpen-muted text-lg">У вас нет выбранных зависимостей</p>
            </div>
          )}
          
        </div>
      </div>
      
      <div className="fixed bottom-20 right-4 z-10">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Dependencies;
