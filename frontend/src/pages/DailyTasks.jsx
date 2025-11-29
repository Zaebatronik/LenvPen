import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '../config/version';
import {
  generateDailyTasks,
  getRandomGreeting,
  calculateEnergy,
  getEnergyComment
} from '../utils/dailyTasksGenerator';
import {
  getReactionForAction,
  getDayRating
} from '../utils/slothReactions';

function DailyTasks() {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [greeting, setGreeting] = useState('');
  const [energy, setEnergy] = useState(50);
  const [tasks, setTasks] = useState({ main: [], light: [], anti: [], funny: null });
  const [slothReaction, setSlothReaction] = useState('Загружаюсь… или отдыхаю. Не понял сам.');
  const [totalPoints, setTotalPoints] = useState(0);
  const [showDayEndSummary, setShowDayEndSummary] = useState(false);
  
  useEffect(() => {
    initializeDay();
  }, [user]);
  
  const initializeDay = () => {
    // Получаем данные опроса
    const surveyData = localStorage.getItem(`lenvpen_survey_${user.telegram_id}`);
    const parsedSurveyData = surveyData ? JSON.parse(surveyData) : null;
    
    // Получаем сегодняшнюю дату
    const today = new Date().toDateString();
    const savedTasksKey = `lenvpen_daily_tasks_${user.telegram_id}_${today}`;
    const savedTasks = localStorage.getItem(savedTasksKey);
    
    // Если уже есть задания на сегодня - загружаем их
    if (savedTasks) {
      const parsed = JSON.parse(savedTasks);
      setTasks(parsed.tasks);
      setTotalPoints(parsed.totalPoints || 0);
      setGreeting(parsed.greeting);
    } else {
      // Генерируем новые задания
      const newTasks = generateDailyTasks(parsedSurveyData);
      const newGreeting = getRandomGreeting();
      
      setTasks(newTasks);
      setGreeting(newGreeting);
      
      // Сохраняем
      localStorage.setItem(savedTasksKey, JSON.stringify({
        tasks: newTasks,
        totalPoints: 0,
        greeting: newGreeting,
        date: today
      }));
    }
    
    // Рассчитываем энергию
    const currentEnergy = calculateEnergy(parsedSurveyData);
    setEnergy(currentEnergy);
    
    setSlothReaction(getReactionForAction('popup'));
  };
  
  const updateTaskStatus = (taskId, status, taskType) => {
    const updatedTasks = { ...tasks };
    let points = 0;
    
    // Находим и обновляем задание
    ['main', 'light', 'anti'].forEach(type => {
      updatedTasks[type] = updatedTasks[type].map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, status };
          
          // Рассчитываем очки
          if (status === 'completed') {
            points = task.points;
          } else if (status === 'partial') {
            points = Math.floor(task.points / 2);
          }
          
          return updatedTask;
        }
        return task;
      });
    });
    
    if (tasks.funny && tasks.funny.id === taskId) {
      updatedTasks.funny = { ...tasks.funny, status };
      if (status === 'completed') {
        points = tasks.funny.points;
      }
    }
    
    setTasks(updatedTasks);
    setTotalPoints(prev => prev + points);
    
    // Реакция ленивца
    let reaction = '';
    if (status === 'completed') {
      reaction = getReactionForAction('completed');
    } else if (status === 'partial') {
      reaction = getReactionForAction('partial');
    } else if (status === 'skipped') {
      reaction = getReactionForAction('skipped');
    } else if (status === 'relapse') {
      reaction = getReactionForAction('relapse');
    }
    
    setSlothReaction(reaction);
    
    // Сохраняем изменения
    const today = new Date().toDateString();
    const savedTasksKey = `lenvpen_daily_tasks_${user.telegram_id}_${today}`;
    localStorage.setItem(savedTasksKey, JSON.stringify({
      tasks: updatedTasks,
      totalPoints: totalPoints + points,
      greeting,
      date: today
    }));
  };
  
  const calculateCompletion = () => {
    const allTasks = [
      ...tasks.main,
      ...tasks.light,
      ...tasks.anti,
      ...(tasks.funny ? [tasks.funny] : [])
    ];
    
    const completedCount = allTasks.filter(t => t.status === 'completed').length;
    const partialCount = allTasks.filter(t => t.status === 'partial').length;
    
    return Math.round(((completedCount + partialCount * 0.5) / allTasks.length) * 100);
  };
  
  const endDay = () => {
    const completionPercentage = calculateCompletion();
    const dayRating = getDayRating(completionPercentage);
    
    setSlothReaction(dayRating);
    setShowDayEndSummary(true);
    
    // Сохраняем итоги дня
    const today = new Date().toDateString();
    const historyKey = `lenvpen_daily_history_${user.telegram_id}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    history.push({
      date: today,
      tasks: tasks,
      completion: completionPercentage,
      points: totalPoints,
      rating: dayRating
    });
    
    localStorage.setItem(historyKey, JSON.stringify(history));
  };
  
  const getSlothEmoji = () => {
    const completion = calculateCompletion();
    if (completion >= 80) return '🔥';
    if (completion >= 60) return '😎';
    if (completion >= 40) return '😊';
    if (completion >= 25) return '🙂';
    if (completion >= 10) return '😑';
    return '😵';
  };
  
  const TaskItem = ({ task, onUpdate }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
      <div className="card mb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{task.type === 'main' ? '🎯' : task.type === 'light' ? '✨' : task.type === 'anti' ? '🚫' : '🎭'}</span>
              <h3 className="text-lenvpen-text font-medium">{task.title}</h3>
              {task.points && (
                <span className="text-xs text-lenvpen-orange">+{task.points}⭐</span>
              )}
            </div>
            <p className="text-sm text-lenvpen-muted mb-2">{task.description}</p>
            
            {!task.status && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onUpdate(task.id, 'completed', task.type)}
                  className="btn-primary text-xs py-1 px-3"
                >
                  ✅ Выполнено
                </button>
                <button
                  onClick={() => onUpdate(task.id, 'partial', task.type)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  ◐ Частично
                </button>
                <button
                  onClick={() => onUpdate(task.id, 'skipped', task.type)}
                  className="text-lenvpen-muted hover:text-lenvpen-text text-xs py-1 px-3 transition-colors"
                >
                  ⏭️ Пропустить
                </button>
                {task.type === 'anti' && (
                  <button
                    onClick={() => onUpdate(task.id, 'relapse', task.type)}
                    className="text-lenvpen-red hover:text-lenvpen-red/80 text-xs py-1 px-3 transition-colors"
                  >
                    💔 Срыв
                  </button>
                )}
              </div>
            )}
            
            {task.status && (
              <div className="flex items-center gap-2 mt-2">
                {task.status === 'completed' && <span className="text-green-500">✅ Выполнено!</span>}
                {task.status === 'partial' && <span className="text-yellow-500">◐ Частично</span>}
                {task.status === 'skipped' && <span className="text-lenvpen-muted">⏭️ Пропущено</span>}
                {task.status === 'relapse' && <span className="text-lenvpen-red">💔 Был срыв</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (showDayEndSummary) {
    const completion = calculateCompletion();
    
    return (
      <div className="min-h-screen bg-lenvpen-dark p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
            <div className="text-8xl mb-4">{getSlothEmoji()}</div>
            <h1 className="text-3xl font-bold text-lenvpen-text mb-4">
              День завершён!
            </h1>
          </div>
          
          <div className="card space-y-4">
            <div className="text-center">
              <div className="text-6xl font-bold text-lenvpen-orange mb-2">
                {completion}%
              </div>
              <p className="text-lenvpen-muted">Выполнено</p>
            </div>
            
            <div className="border-t border-lenvpen-border pt-4">
              <p className="text-lenvpen-text italic text-center">
                "{slothReaction}"
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-lenvpen-orange">{totalPoints}</div>
                <p className="text-xs text-lenvpen-muted">Очков заработано</p>
              </div>
              <div className="text-center">
                <div className="text-2xl">⭐</div>
                <p className="text-xs text-lenvpen-muted">Звёзды</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full"
          >
            К дашборду
          </button>
        </div>
        
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <span className="text-lenvpen-text/40 text-xs font-medium">v{APP_VERSION}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-lenvpen-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-lenvpen-dark/95 backdrop-blur-sm border-b border-lenvpen-border z-10 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/dashboard')} className="text-lenvpen-orange">
              ← Назад
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-lenvpen-text">Задания дня</h1>
              <p className="text-xs text-lenvpen-muted">{new Date().toLocaleDateString('ru-RU')}</p>
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Приветствие и состояние */}
        <div className="card space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-3">{getSlothEmoji()}</div>
            <p className="text-lenvpen-text text-lg font-medium mb-2">{greeting}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-lenvpen-muted">Энергия:</span>
                <div className="flex-1 max-w-xs h-3 bg-lenvpen-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-lenvpen-orange to-lenvpen-red transition-all duration-500"
                    style={{ width: `${energy}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-lenvpen-orange">{energy}%</span>
              </div>
              <p className="text-xs text-lenvpen-muted italic">
                {getEnergyComment(energy)}
              </p>
            </div>
          </div>
          
          {/* Реакция ленивца */}
          <div className="bg-lenvpen-bg rounded-lg p-3 border-l-4 border-lenvpen-orange">
            <p className="text-sm text-lenvpen-text italic">
              💬 "{slothReaction}"
            </p>
          </div>
          
          {/* Статистика */}
          <div className="flex justify-around border-t border-lenvpen-border pt-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-lenvpen-orange">{calculateCompletion()}%</div>
              <p className="text-xs text-lenvpen-muted">Прогресс</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-lenvpen-orange">{totalPoints}</div>
              <p className="text-xs text-lenvpen-muted">Очков</p>
            </div>
            <div className="text-center">
              <div className="text-2xl">⭐</div>
              <p className="text-xs text-lenvpen-muted">Награды</p>
            </div>
          </div>
        </div>
        
        {/* Главные задания */}
        {tasks.main.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-lenvpen-text flex items-center gap-2">
              <span>🎯</span> Главные задания
            </h2>
            {tasks.main.map(task => (
              <TaskItem key={task.id} task={task} onUpdate={updateTaskStatus} />
            ))}
          </div>
        )}
        
        {/* Лайтовые задания */}
        {tasks.light.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-lenvpen-text flex items-center gap-2">
              <span>✨</span> Лайтовые задания
            </h2>
            {tasks.light.map(task => (
              <TaskItem key={task.id} task={task} onUpdate={updateTaskStatus} />
            ))}
          </div>
        )}
        
        {/* Антизависимые действия */}
        {tasks.anti.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-lenvpen-text flex items-center gap-2">
              <span>🚫</span> Антизависимые действия
            </h2>
            {tasks.anti.map(task => (
              <TaskItem key={task.id} task={task} onUpdate={updateTaskStatus} />
            ))}
          </div>
        )}
        
        {/* Смешное задание */}
        {tasks.funny && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-lenvpen-text flex items-center gap-2">
              <span>🎭</span> Забавное задание
            </h2>
            <TaskItem task={tasks.funny} onUpdate={updateTaskStatus} />
          </div>
        )}
        
        {/* Кнопка завершения дня */}
        <button
          onClick={endDay}
          className="btn-primary w-full text-lg py-4"
        >
          🌙 Завершить день
        </button>
      </div>
      
      {/* Версия */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <span className="text-lenvpen-text/40 text-xs font-medium">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default DailyTasks;
