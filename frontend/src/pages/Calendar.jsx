import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../config/version';

/**
 * CALENDAR — История всех отчётов
 * Каждый день — кнопка, при клике показывает неизменяемый отчёт
 */

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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

        {/* Календарь */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const report = getReportForDate(date);
            const isToday = date.toDateString() === today;
            const dayScore = report?.score || 0;

            return (
              <button
                key={date.toISOString()}
                onClick={() => openReport(date)}
                disabled={!report}
                className={`aspect-square rounded-xl transition-all flex flex-col items-center justify-center relative ${
                  isToday
                    ? 'ring-2 ring-lenvpen-accent'
                    : ''
                } ${
                  report
                    ? dayScore >= 0
                      ? 'bg-lenvpen-green/20 border-2 border-lenvpen-green/50 hover:bg-lenvpen-green/30'
                      : 'bg-lenvpen-red/20 border-2 border-lenvpen-red/50 hover:bg-lenvpen-red/30'
                    : 'bg-lenvpen-card border border-lenvpen-border/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className={`text-lg font-bold ${report ? 'text-lenvpen-text' : 'text-lenvpen-muted'}`}>
                  {date.getDate()}
                </span>
                {report && (
                  <span className={`text-xs font-bold mt-1 ${dayScore >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                    {dayScore >= 0 ? '+' : ''}{dayScore}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Легенда */}
        <div className="mt-8 bg-lenvpen-card rounded-2xl p-6 border border-lenvpen-border">
          <h3 className="text-lg font-bold text-lenvpen-text mb-4">Легенда</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-lenvpen-green/20 border-2 border-lenvpen-green/50"></div>
              <span className="text-sm text-lenvpen-text">Хороший день (+)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-lenvpen-red/20 border-2 border-lenvpen-red/50"></div>
              <span className="text-sm text-lenvpen-text">Плохой день (−)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-lenvpen-card border border-lenvpen-border/30 opacity-50"></div>
              <span className="text-sm text-lenvpen-text">Нет отчёта</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-lenvpen-card border border-lenvpen-border/30 ring-2 ring-lenvpen-accent"></div>
              <span className="text-sm text-lenvpen-text">Сегодня</span>
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
          <div className="bg-lenvpen-card border-2 border-lenvpen-accent rounded-3xl p-8 max-w-2xl w-full my-8">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-lenvpen-text">
                {new Date(selectedDate.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-10 h-10 rounded-full bg-lenvpen-bg hover:bg-lenvpen-border flex items-center justify-center text-lenvpen-text transition-all"
              >
                ✕
              </button>
            </div>

            {/* Итог дня */}
            <div className="bg-lenvpen-bg rounded-2xl p-6 mb-6">
              <div className="text-center">
                <div className={`text-6xl font-black mb-2 ${selectedDate.score >= 0 ? 'text-lenvpen-green' : 'text-lenvpen-red'}`}>
                  {selectedDate.score >= 0 ? '+' : ''}{selectedDate.score}%
                </div>
                <div className="text-sm text-lenvpen-muted">Изменение процента</div>
              </div>
            </div>

            {/* Зависимости */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-lenvpen-text mb-3">Зависимости</h3>
              {Object.keys(selectedDate.dependencies || {}).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(selectedDate.dependencies).map(([key, data]) => (
                    <div key={key} className="bg-lenvpen-bg rounded-xl p-4 flex items-center justify-between">
                      <span className="text-lenvpen-text capitalize">{key}</span>
                      <div className="flex items-center gap-2">
                        {data.violated ? (
                          <>
                            <span className="text-lenvpen-red font-bold">❌ Нарушено</span>
                            {data.amount > 0 && (
                              <span className="text-lenvpen-muted text-sm">({data.amount}x)</span>
                            )}
                          </>
                        ) : (
                          <span className="text-lenvpen-green font-bold">✅ Не нарушено</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lenvpen-muted text-sm">Нет данных о зависимостях</p>
              )}
            </div>

            {/* Позитивные действия */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-lenvpen-text mb-3">Позитивные действия</h3>
              {selectedDate.actions?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedDate.actions.map(actionId => {
                    const intensity = selectedDate.intensity?.[actionId] || 'medium';
                    return (
                      <div
                        key={actionId}
                        className="bg-lenvpen-bg rounded-lg px-4 py-2 text-sm"
                      >
                        <span className="text-lenvpen-text font-semibold">{actionId}</span>
                        <span className="text-lenvpen-muted ml-2">({intensity})</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-lenvpen-muted text-sm">Нет позитивных действий</p>
              )}
            </div>

            {/* Комментарий */}
            {selectedDate.comment && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-lenvpen-text mb-3">Комментарий дня</h3>
                <div className="bg-lenvpen-bg rounded-xl p-4">
                  <p className="text-lenvpen-text italic">"{selectedDate.comment}"</p>
                </div>
              </div>
            )}

            {/* Реакция ленивца */}
            <div className="bg-lenvpen-accent/10 border border-lenvpen-accent/30 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {selectedDate.score >= 5 ? '🦥✨' : selectedDate.score >= 0 ? '🦥' : '😿'}
                </div>
                <p className="text-lenvpen-text font-semibold">
                  {selectedDate.score >= 5
                    ? 'Так! Я снова оживаю! Продолжай!'
                    : selectedDate.score >= 0
                    ? 'Неплохо. Двигаемся дальше.'
                    : 'Ну вот… а я надеялся на лучший день 😿'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full mt-6 py-3 rounded-xl font-semibold bg-lenvpen-accent text-white hover:bg-lenvpen-accent/90 transition-all"
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
