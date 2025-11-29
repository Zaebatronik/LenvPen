import { useState, useEffect } from 'react';

/**
 * БЛОК F - Система достижений (ачивки)
 */
function AchievementUnlocked({ achievement, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-lenvpen-card rounded-2xl p-8 max-w-sm mx-4 text-center space-y-4 animate-scale-in shadow-2xl border-2 border-lenvpen-orange">
        <div className="text-8xl animate-bounce">{achievement.emoji}</div>
        <div>
          <h3 className="text-2xl font-bold text-lenvpen-orange mb-2">
            Достижение разблокировано!
          </h3>
          <p className="text-xl text-lenvpen-text font-bold">
            {achievement.name}
          </p>
        </div>
        <div className="text-lenvpen-muted text-sm">
          🎉 Отлично! Так держать!
        </div>
      </div>
    </div>
  );
}

/**
 * Менеджер достижений - показывает по очереди
 */
function AchievementManager({ achievements }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(achievements.length > 0);
  
  const handleClose = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShow(false);
    }
  };
  
  if (!show || achievements.length === 0) return null;
  
  return (
    <AchievementUnlocked 
      achievement={achievements[currentIndex]} 
      onClose={handleClose}
    />
  );
}

export default AchievementManager;
