import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  setHours,
  setMinutes,
  getHours,
  getMinutes
} from 'date-fns';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Calendar, ChevronLeft, ChevronRight, Clock, X, Check, Zap } from 'lucide-react';

interface DueDatePickerProps {
  value?: string | Date | null;
  onChange: (dateIsoString: string | null) => void;
  className?: string;
}

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const DueDatePicker: React.FC<DueDatePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected date object
  const selectedDate = value ? new Date(value) : null;
  const [viewMonth, setViewMonth] = useState<Date>(selectedDate || new Date());

  // Time state (default 18:00 if new)
  const [selectedTime, setSelectedTime] = useState<string>(
    selectedDate
      ? format(selectedDate, 'HH:mm')
      : '18:00'
  );

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // Keep viewMonth synced when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewMonth(d);
      setSelectedTime(format(d, 'HH:mm'));
    }
  }, [value]);

  // Navigate months
  const handlePrevMonth = () => setViewMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setViewMonth((m) => addMonths(m, 1));

  // Select a specific day on the calendar grid
  const handleSelectDay = (day: Date) => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    let finalDate = setHours(day, isNaN(hours) ? 18 : hours);
    finalDate = setMinutes(finalDate, isNaN(minutes) ? 0 : minutes);

    onChange(finalDate.toISOString());
  };

  // Quick Preset Actions
  const handlePreset = (type: 'today' | 'tomorrow' | 'nextWeek' | 'endOfMonth') => {
    const now = new Date();
    const [hours, minutes] = selectedTime.split(':').map(Number);
    let target = new Date();

    if (type === 'today') {
      target = now;
    } else if (type === 'tomorrow') {
      target = addDays(now, 1);
    } else if (type === 'nextWeek') {
      target = addDays(now, 7);
    } else if (type === 'endOfMonth') {
      target = endOfMonth(now);
    }

    target = setHours(target, isNaN(hours) ? 18 : hours);
    target = setMinutes(target, isNaN(minutes) ? 0 : minutes);

    setViewMonth(target);
    onChange(target.toISOString());
  };

  // Change Time
  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':').map(Number);
      let updated = setHours(selectedDate, isNaN(hours) ? 18 : hours);
      updated = setMinutes(updated, isNaN(minutes) ? 0 : minutes);
      onChange(updated.toISOString());
    }
  };

  // Clear Date
  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  // Render Calendar Grid Days
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const isSelected = selectedDate ? isSameDay(currentDay, selectedDate) : false;
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isCurrentToday = isToday(currentDay);
      const isOverdueDay = isPast(currentDay) && !isCurrentToday;

      days.push(
        <button
          key={currentDay.toISOString()}
          type="button"
          onClick={() => handleSelectDay(currentDay)}
          className={`h-8 w-8 text-xs font-semibold rounded-xl flex items-center justify-center transition-all relative ${
            isSelected
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 scale-105 z-10'
              : !isCurrentMonth
              ? 'text-neutral-300 dark:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              : isCurrentToday
              ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40'
              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <span>{format(currentDay, 'd')}</span>
          {isCurrentToday && !isSelected && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
          )}
        </button>
      );

      day = addDays(day, 1);
    }

    return days;
  };

  // Display Format
  const getDisplayText = () => {
    if (!selectedDate) return 'เลือกกำหนดส่ง (Set Due Date)';
    const dateFormatted = format(selectedDate, 'dd/MM/yyyy');
    const timeFormatted = format(selectedDate, 'HH:mm');
    const isOverdue = isPast(selectedDate) && !isToday(selectedDate);

    if (isToday(selectedDate)) {
      return `วันนี้, ${timeFormatted} น. (${dateFormatted})`;
    } else if (isSameDay(selectedDate, addDays(new Date(), 1))) {
      return `พรุ่งนี้, ${timeFormatted} น. (${dateFormatted})`;
    }

    return `${dateFormatted} • ${timeFormatted} น.`;
  };

  const isOverdue = selectedDate ? isPast(selectedDate) && !isToday(selectedDate) : false;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all shadow-2xs group ${
          selectedDate
            ? isOverdue
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold'
              : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-semibold'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar
            size={14}
            className={
              selectedDate
                ? isOverdue
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
            }
          />
          <span className="truncate">{getDisplayText()}</span>
        </div>

        {selectedDate ? (
          <span
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title="ล้างกำหนดส่ง"
          >
            <X size={13} />
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 font-normal">
            + วันที่
          </span>
        )}
      </button>

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>{THAI_MONTHS[viewMonth.getMonth()]}</span>
              <span className="text-neutral-400 font-normal">{viewMonth.getFullYear() + 543}</span>
            </h4>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5 mb-3 pb-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors flex items-center justify-center gap-1"
            >
              <Zap size={11} className="text-amber-500" />
              <span>วันนี้ (Today)</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset('tomorrow')}
              className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors flex items-center justify-center gap-1"
            >
              <span>🌅 พรุ่งนี้</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset('nextWeek')}
              className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors flex items-center justify-center gap-1"
            >
              <span>📅 สัปดาห์หน้า</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset('endOfMonth')}
              className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors flex items-center justify-center gap-1"
            >
              <span>⏳ สิ้นเดือน</span>
            </button>
          </div>

          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {THAI_DAYS.map((d, i) => (
              <span
                key={d}
                className={`text-[10px] font-bold ${
                  i === 0 ? 'text-rose-500' : 'text-neutral-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar 7x5 Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {renderCalendarDays()}
          </div>

          {/* Time Picker & Done Actions */}
          <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Clock size={12} className="text-neutral-400" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {selectedDate && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  ล้าง
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
              >
                <Check size={12} />
                <span>เสร็จสิ้น</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
