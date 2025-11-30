import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';

/**
 * CALENDAR — История всех отчётов с карточками дней
 * Каждый день — карточка с итогом и emoji ленивца
 * При клике показывает полный неизменяемый отчёт
 */

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Маппинг действий с иконками
const ACTION_ICONS = {
  'sport': { label: 'Спорт', icon: '🏃' },
  'work': { label: 'Работа', icon: '💼' },
  'study': { label: 'Учёба', icon: '📚' },
  'sleep': { label: 'Сон 7+ часов', icon: '😴' },
  'healthy_food': { label: 'Здоровая еда', icon: '🥗' },
  'meditation': { label: 'Медитация', icon: '🧘' }
};

function Calendar() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allReports, setAllReports] = useState([]);

  const user = JSON.parse(localStorage.getItem('lenvpen_user') || '{}');

  useEffect(() => {
    // Загружаем все отчёты пользователя
    const reportsKey = `lenvpen_all_reports_${user.telegram_id}`;
    const reports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
    setAllReports(reports);
  }, [user.telegram_id]);

  // Генерация дней месяца
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    
    // Первый день недели (0 = Вс, 1 = Пн, ...)
    let firstDayOfWeek = firstDay.getDay();
    // Корректируем: у нас Пн = 0
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Пустые ячейки до первого дня
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysCount; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Проверка, есть ли отчёт за дату
  const getReportForDate = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return allReports.find(r => r.date === dateStr);
  };

  // Навигация по месяцам
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Открытие детального просмотра отчёта
  const openReport = (date) => {
    const report = getReportForDate(date);
    if (report) {
      setSelectedDate(report);
    }
  };

  const days = getDaysInMonth();
  const today = new Date().toDateString();

  return (
    <div className="min-h-screen bg-lenvpen-bg pb-24">
      {/* Шапка */}
      <div className="sticky top-0 bg-lenvpen-card/95 backdrop-blur-md border-b border-lenvpen-border z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-lenvpen-muted hover:text-lenvpen-text transition-colors"
            >
              ← Назад
            </button>
            <h1 className="text-xl font-bold text-lenvpen-text">Календарь отчётов</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Навигация по месяцам */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-full bg-lenvpen-card border border-lenvpen-border flex items-center justify-center text-lenvpen-text hover:bg-lenvpen-card/80 transition-all"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-lenvpen-text">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-full bg-lenvpen-card border border-lenvpen-border flex items-center justify-center text-lenvpen-text hover:bg-lenvpen-card/80 transition-all"
          >
            →
          </button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-lenvpen-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Календарь — карточки дней */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const report = getReportForDate(date);
            const isToday = date.toDateString() === today;
            const isFuture = date > new Date();
            const dayScore = report?.score || 0;

            // Определяем emoji ленивца в зависимости от результата
            let slothEmoji = '';
            if (report) {
              if (dayScore >= 10) slothEmoji = '🦥✨';
              else if (dayScore >= 5) slothEmoji = '🦥';
              else if (dayScore >= 0) slothEmoji = '😐';
              else if (dayScore >= -5) slothEmoji = '😿';
              else slothEmoji = '💀';
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => openReport(date)}
                disabled={!report || isFuture}
                className={`aspect-square rounded-xl transition-all flex flex-col items-center justify-center relative group ${
                  isToday
                    ? 'ring-2 ring-lenvpen-accent shadow-lg shadow-lenvpen-accent/20'
                    : ''
                } ${
                  report
                    ? dayScore >= 0
                      ? 'bg-gradient-to-br from-lenvpen-green/10 to-lenvpen-green/20 border-2 border-lenvpen-green/50 hover:border-lenvpen-green hover:shadow-md hover:scale-105'
                      : 'bg-gradient-to-br from-lenvpen-red/10 to-lenvpen-red/20 border-2 border-lenvpen-red/50 hover:border-lenvpen-red hover:shadow-md hover:scale-105'
                    : isFuture
                    ? 'bg-lenvpen-card/30 border border-dashed border-lenvpen-border/20 opacity-30 cursor-not-allowed'
                    : 'bg-lenvpen-card border border-lenvpen-border/30 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className={`text-base font-bold ${report ? 'text-lenvpen-text' : 'text-lenvpen-muted'}`}>
                  {date.getDate()}
                </span>
                {report && (
                  <>
                    <span className="text-xl my-1">{slothEmoji}</span>
                    <span className={`text-xs font-black ${dayScore >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                      {dayScore >= 0 ? '+' : ''}{dayScore}
                    </span>
                  </>
                )}
                {!report && !isFuture && (
                  <span className="text-xs text-lenvpen-muted/50 mt-1">—</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Легенда реакций ленивца */}
        <div className="mt-8 bg-gradient-to-br from-lenvpen-card to-lenvpen-card/50 rounded-2xl p-6 border border-lenvpen-border">
          <h3 className="text-lg font-bold text-lenvpen-text mb-4">📊 Легенда реакций</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦥✨</span>
              <span className="text-xs text-lenvpen-text">+10% и выше</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦥</span>
              <span className="text-xs text-lenvpen-text">+5% до +10%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">😐</span>
              <span className="text-xs text-lenvpen-text">0% до +5%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">😿</span>
              <span className="text-xs text-lenvpen-text">-5% до 0%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💀</span>
              <span className="text-xs text-lenvpen-text">Ниже -5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border border-dashed border-lenvpen-border/30 opacity-30"></div>
              <span className="text-xs text-lenvpen-muted">Будущее</span>
            </div>
          </div>
        </div>

        {/* Статистика месяца */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-lenvpen-card rounded-xl p-4 border border-lenvpen-border text-center">
            <div className="text-3xl font-black text-lenvpen-accent">
              {allReports.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === currentMonth.getMonth() && 
                       rDate.getFullYear() === currentMonth.getFullYear();
              }).length}
            </div>
            <div className="text-xs text-lenvpen-muted mt-1">Отчётов</div>
          </div>
          <div className="bg-lenvpen-card rounded-xl p-4 border border-lenvpen-border text-center">
            <div className="text-3xl font-black text-lenvpen-green">
              {allReports.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === currentMonth.getMonth() && 
                       rDate.getFullYear() === currentMonth.getFullYear() &&
                       r.score >= 0;
              }).length}
            </div>
            <div className="text-xs text-lenvpen-muted mt-1">Хороших</div>
          </div>
          <div className="bg-lenvpen-card rounded-xl p-4 border border-lenvpen-border text-center">
            <div className="text-3xl font-black text-lenvpen-red">
              {allReports.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === currentMonth.getMonth() && 
                       rDate.getFullYear() === currentMonth.getFullYear() &&
                       r.score < 0;
              }).length}
            </div>
            <div className="text-xs text-lenvpen-muted mt-1">Плохих</div>
          </div>
        </div>
      </div>

      {/* Модалка детального просмотра отчёта */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-lenvpen-card border-2 border-lenvpen-accent rounded-3xl p-8 max-w-2xl w-full my-8 shadow-2xl">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-lenvpen-text">
                  {new Date(selectedDate.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-lenvpen-muted mt-1">
                  {new Date(selectedDate.date).toLocaleDateString('ru-RU', { weekday: 'long' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-10 h-10 rounded-full bg-lenvpen-bg hover:bg-lenvpen-border flex items-center justify-center text-lenvpen-text transition-all"
              >
                ✕
              </button>
            </div>

            {/* Итог дня */}
            <div className="bg-gradient-to-br from-lenvpen-bg to-lenvpen-card/50 rounded-2xl p-6 mb-6 border border-lenvpen-border/30">
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {selectedDate.score >= 10 ? '🦥✨' : 
                   selectedDate.score >= 5 ? '🦥' :
                   selectedDate.score >= 0 ? '😐' :
                   selectedDate.score >= -5 ? '😿' : '💀'}
                </div>
                <div className={`text-6xl font-black mb-2 ${selectedDate.score >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {selectedDate.score >= 0 ? '+' : ''}{selectedDate.score}%
                </div>
                <div className="text-sm text-lenvpen-muted">Изменение прогресса</div>
              </div>
            </div>

            {/* Краткая статистика */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-lenvpen-bg rounded-xl p-3 text-center border border-lenvpen-border/30">
                <div className="text-2xl font-black text-lenvpen-red">
                  {Object.values(selectedDate.dependencies || {}).filter(d => d.violated).length}
                </div>
                <div className="text-xs text-lenvpen-muted mt-1">Нарушений</div>
              </div>
              <div className="bg-lenvpen-bg rounded-xl p-3 text-center border border-lenvpen-border/30">
                <div className="text-2xl font-black text-lenvpen-green">
                  {selectedDate.actions?.length || 0}
                </div>
                <div className="text-xs text-lenvpen-muted mt-1">Плюсов</div>
              </div>
              <div className="bg-lenvpen-bg rounded-xl p-3 text-center border border-lenvpen-border/30">
                <div className={`text-2xl font-black ${selectedDate.score >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {selectedDate.score >= 0 ? '+' : ''}{selectedDate.score}
                </div>
                <div className="text-xs text-lenvpen-muted mt-1">Итог</div>
              </div>
            </div>

            {/* Зависимости */}
            {Object.keys(selectedDate.dependencies || {}).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-lenvpen-text mb-3 flex items-center gap-2">
                  <span>❌</span> Вредные привычки
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedDate.dependencies).map(([key, data]) => (
                    <div 
                      key={key} 
                      className={`rounded-xl p-4 flex items-center justify-between transition-all ${
                        data.violated 
                          ? 'bg-lenvpen-red/10 border-2 border-lenvpen-red/30' 
                          : 'bg-lenvpen-green/10 border-2 border-lenvpen-green/30'
                      }`}
                    >
                      <span className="text-lenvpen-text capitalize font-semibold">{key}</span>
                      <div className="flex items-center gap-2">
                        {data.violated ? (
                          <>
                            <span className="text-lenvpen-red font-bold">❌ Да</span>
                            {data.amount > 0 && (
                              <span className="bg-lenvpen-red/20 text-lenvpen-red px-2 py-1 rounded-lg text-xs font-bold">
                                ×{data.amount}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-lenvpen-green font-bold">✅ Нет</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Позитивные действия */}
            {selectedDate.actions?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-lenvpen-text mb-3 flex items-center gap-2">
                  <span>✅</span> Полезные действия
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedDate.actions.map(actionId => {
                    const actionInfo = ACTION_ICONS[actionId] || { label: actionId.replace('_', ' '), icon: '✅' };
                    return (
                      <div
                        key={actionId}
                        className="bg-gradient-to-br from-lenvpen-accent/10 to-lenvpen-accent/5 border border-lenvpen-accent/30 rounded-lg px-3 py-3 flex items-center gap-2 hover:border-lenvpen-accent/50 transition-all"
                      >
                        <span className="text-2xl">{actionInfo.icon}</span>
                        <span className="text-lenvpen-text font-semibold text-sm">
                          {actionInfo.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Комментарий */}
            {selectedDate.comment && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-lenvpen-text mb-3 flex items-center gap-2">
                  <span>💭</span> Комментарий дня
                </h3>
                <div className="bg-lenvpen-bg rounded-xl p-4 border border-lenvpen-border/30">
                  <p className="text-lenvpen-text italic leading-relaxed">"{selectedDate.comment}"</p>
                </div>
              </div>
            )}

            {/* Реакция ленивца */}
            <div className={`rounded-2xl p-6 border-2 ${
              selectedDate.score >= 10 ? 'bg-gradient-to-br from-lenvpen-green/20 to-lenvpen-accent/20 border-lenvpen-green/50' :
              selectedDate.score >= 5 ? 'bg-lenvpen-accent/10 border-lenvpen-accent/30' :
              selectedDate.score >= 0 ? 'bg-lenvpen-card/50 border-lenvpen-border' :
              'bg-lenvpen-red/10 border-lenvpen-red/30'
            }`}>
              <div className="text-center">
                <div className="text-6xl mb-3">
                  {selectedDate.score >= 10 ? '🦥✨' : 
                   selectedDate.score >= 5 ? '🦥' :
                   selectedDate.score >= 0 ? '😐' :
                   selectedDate.score >= -5 ? '😿' : '💀'}
                </div>
                <p className="text-lenvpen-text font-semibold text-lg">
                  {selectedDate.score >= 10
                    ? 'Невероятно! Я снова полон сил! 🌟'
                    : selectedDate.score >= 5
                    ? 'Так держать! Я оживаю! Продолжай!'
                    : selectedDate.score >= 0
                    ? 'Неплохо. Маленькими шагами к цели.'
                    : selectedDate.score >= -5
                    ? 'Эх… Надеялся на лучший день 😿'
                    : 'Это катастрофа… Соберись, пожалуйста 💀'}
                </p>
              </div>
            </div>

            {/* Предупреждение о неизменяемости */}
            <div className="bg-lenvpen-bg/50 border border-lenvpen-border/50 rounded-xl p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-lenvpen-text font-semibold text-sm">Отчёт заморожен</p>
                <p className="text-lenvpen-muted text-xs">Изменение или редактирование невозможно</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full py-4 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all shadow-lg hover:shadow-xl"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Версия */}
      <div className="fixed bottom-2 right-2">
        <span className="text-lenvpen-text/20 text-xs">v{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default Calendar;
