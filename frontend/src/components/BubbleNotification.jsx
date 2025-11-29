import { useState, useEffect } from 'react';
import { getRandomBubble } from '../utils/slothBehavior';

/**
 * БЛОК F - Мыльные оповещения (пузырьки сверху экрана)
 */
function BubbleNotification({ show, message, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Исчезает через 4 секунды
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-lenvpen-orange to-lenvpen-red text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default BubbleNotification;
