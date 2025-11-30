import { useState, useEffect } from 'react';

/**
 * БЛОК D - Календарь с цветовой индикацией дней
 * Показывает историю отчётов с визуальными индикаторами
 */
function DailyCalendar({ userId, onSelectDay }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reports, setReports] = useState({});
  
  useEffect(() => {
    loadMonthReports();
  }, [currentMonth, userId]);
  
  const loadMonthReports = () => {
    const allReports = JSON.parse(localStorage.getItem(`lenvpen_all_reports_${userId}`) || '[]');
    
    // Группируем отчёты по дням
    const reportsByDate = {};
    allReports.forEach(report => {
      const date = new Date(report.date).toDateString();
      reportsByDate[date] = report;
    });
    
    setReports(reportsByDate);
  };
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  const getDayColor = (report) => {
    if (!report || !report.analysis) return 'bg-lenvpen-border';
    
    const { overall } = report.analysis;
    if (overall === 'good') return 'bg-lenvpen-green';
    if (overall === 'bad') return 'bg-lenvpen-red';
    return 'bg-lenvpen-orange';
  };
  
  const getSlothEmoji = (report) => {
    if (!report || !report.analysis) return '😐';
    
    const { slothMood } = report.analysis;
    if (slothMood === 'happy') return '😊';
    if (slothMood === 'concerned') return '😟';
    if (slothMood === 'sad') return '😢';
    return '😐';
  };
  
  const getDayPercentage = (report) => {
    if (!report || !report.analysis) return 0;
    return report.analysis.goalImpact || 0;
  };
  
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    const today = new Date();
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    // Не позволяем перейти в будущее
    if (next <= today) {
      setCurrentMonth(next);
    }
  };
  
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date().toDateString();
    
    // Пустые клетки до первого дня месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square"></div>
      );
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toDateString();
      const report = reports[dateString];
      const isToday = dateString === today;
      const isFuture = date > new Date();
      const canEdit = !isFuture && date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 дней назад
      
      days.push(
        <button
          key={day}
          onClick={() => canEdit && onSelectDay(date)}
          disabled={isFuture}
          className={`aspect-square rounded-lg p-1 text-center transition-all relative ${
            isFuture ? 'opacity-30 cursor-not-allowed' : 
            canEdit ? 'hover:scale-105 cursor-pointer' : 
            'opacity-60'
          } ${getDayColor(report)} ${
            isToday ? 'ring-2 ring-lenvpen-orange' : ''
          }`}
        >
          <div className="text-xs font-bold text-white">{day}</div>
          {report && (
            <>
              <div className="text-lg">{getSlothEmoji(report)}</div>
              <div className="text-xs text-white font-semibold">
                {getDayPercentage(report) > 0 ? '+' : ''}{getDayPercentage(report).toFixed(0)}%
              </div>
            </>
          )}
          {!report && !isFuture && (
            <div className="text-xl opacity-50">•</div>
          )}
        </button>
      );
    }
    
    return days;
  };
  
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={previousMonth}
          className="p-2 rounded-lg bg-lenvpen-bg text-lenvpen-text hover:bg-lenvpen-orange/20 transition-colors"
        >
          ←
        </button>
        <h3 className="text-lg font-bold text-lenvpen-text">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          disabled={currentMonth.getMonth() === new Date().getMonth()}
          className={`p-2 rounded-lg transition-colors ${
            currentMonth.getMonth() === new Date().getMonth()
              ? 'bg-lenvpen-border text-lenvpen-muted cursor-not-allowed'
              : 'bg-lenvpen-bg text-lenvpen-text hover:bg-lenvpen-orange/20'
          }`}
        >
          →
        </button>
      </div>
      
      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 text-xs text-lenvpen-muted text-center font-semibold">
        <div>Вс</div>
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-lenvpen-muted pt-2 border-t border-lenvpen-border">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-lenvpen-green"></div>
          <span>Хороший</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-lenvpen-orange"></div>
          <span>Средний</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-lenvpen-red"></div>
          <span>Плохой</span>
        </div>
      </div>
    </div>
  );
}

export default DailyCalendar;
