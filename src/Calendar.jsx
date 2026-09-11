import { useState } from 'react';
import { toLocalDateString } from './utils/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Calendar({ logsByDate, onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayOfMonth.getDay();

  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  return (
    <div className="w-full max-w-md border border-[#e0d5c6] rounded-3xl p-4 bg-[#fbf8f3] shadow-sm">
      <div className="flex justify-between items-center mb-2.5">
        <button className="px-2 py-1 rounded hover:bg-[#faf0e6] text-stone-600" onClick={goToPreviousMonth}>&lt;</button>
        <h2 className="text-lg font-semibold text-stone-800">{MONTH_NAMES[month]} {year}</h2>
        <button className="px-2 py-1 rounded hover:bg-[#faf0e6] text-stone-600" onClick={goToNextMonth}>&gt;</button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => (
          <div key={label} className="text-center font-bold text-sm">{label}</div>
        ))}

        {cells.map((date, index) => {
          if (!date) {
            return <div key={index} className="py-4"></div>;
          }

          const dateString = toLocalDateString(date);
          const logType = logsByDate[dateString];

          return (
            <div
              key={index}
              className="text-center py-4 rounded-full cursor-pointer hover:bg-[#faf0e6]"
              style={logType ? { backgroundColor: logType.color, color: 'white' } : {}}
              onClick={(e) => onDateClick(date, e)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
