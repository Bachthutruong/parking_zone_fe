import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { formatDate, formatDateTime, toDateInput, fromDateInput } from '@/lib/dateUtils';
import { Calendar, Clock } from 'lucide-react';

interface CustomDateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  placeholder?: string;
  type?: 'date' | 'datetime-local';
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  className = '',
  placeholder,
  type = 'datetime-local'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHours, setSelectedHours] = useState('00');
  const [selectedMinutes, setSelectedMinutes] = useState('00');
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      if (type === 'datetime-local') {
        setDisplayValue(formatDateTime(value));
        const date = new Date(value);
        setSelectedDate(toDateInput(value));
        setSelectedHours(String(date.getHours()).padStart(2, '0'));
        setSelectedMinutes(String(date.getMinutes()).padStart(2, '0'));
      } else {
        setDisplayValue(formatDate(value));
        setSelectedDate(toDateInput(value));
      }
    } else {
      setDisplayValue('');
      setSelectedDate('');
      setSelectedHours('00');
      setSelectedMinutes('00');
    }
  }, [value, type]);

  // Update display value when tempValue changes
  useEffect(() => {
    if (tempValue && isOpen) {
      if (type === 'datetime-local') {
        setDisplayValue(formatDateTime(tempValue));
      } else {
        setDisplayValue(formatDate(tempValue));
      }
    }
  }, [tempValue, isOpen, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputClick = () => {
    setIsOpen(true);
    if (value) {
      setTempValue(value);
      const date = new Date(value);
      setSelectedDate(toDateInput(value));
      if (type === 'datetime-local') {
        setSelectedHours(String(date.getHours()).padStart(2, '0'));
        setSelectedMinutes(String(date.getMinutes()).padStart(2, '0'));
      }
    } else {
      const now = new Date();
      setSelectedDate(toDateInput(now.toISOString()));
      setSelectedHours(String(now.getHours()).padStart(2, '0'));
      setSelectedMinutes(String(now.getMinutes()).padStart(2, '0'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Try to parse yyyy/mm/dd format
    if (inputValue.includes('/')) {
      try {
        const parts = inputValue.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || (type === 'datetime-local' ? '00:00' : '');
        
        if (datePart.includes('/')) {
          const [year, month, day] = datePart.split('/');
          
          if (year && month && day) {
            let isoString;
            if (type === 'datetime-local') {
              const [hours, minutes] = timePart.split(':');
              const date = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours || '0'),
                parseInt(minutes || '0')
              );
              isoString = date.toISOString();
            } else {
              const date = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
              isoString = date.toISOString();
            }
            
            if (!isNaN(new Date(isoString).getTime())) {
              onChange(isoString);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    updateDateTimeValue(dateValue, selectedHours, selectedMinutes);
  };

  const handleTimeChange = (hours: string, minutes: string) => {
    setSelectedHours(hours);
    setSelectedMinutes(minutes);
    updateDateTimeValue(selectedDate, hours, minutes);
  };

  const updateDateTimeValue = (date: string, hours: string, minutes: string) => {
    if (!date) return;
    
    if (type === 'datetime-local') {
      const [year, month, day] = date.split('-');
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
      const isoValue = dateObj.toISOString();
      setTempValue(isoValue);
      onChange(isoValue);
    } else {
      const isoValue = fromDateInput(date);
      setTempValue(isoValue);
      onChange(isoValue);
    }
  };

  const getNativeMin = () => {
    if (!min) return undefined;
    return toDateInput(min);
  };

  const getNativeMax = () => {
    if (!max) return undefined;
    return toDateInput(max);
  };

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => 
    String(i).padStart(2, '0')
  );

  // Generate minute options (00-59) so displayed time always matches state
  const minuteOptions = Array.from({ length: 60 }, (_, i) => 
    String(i).padStart(2, '0')
  );

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder || '年/月/日 00:00'}
          className={`${className} pr-10`}
          style={{
            fontFamily: 'monospace',
            cursor: 'pointer',
            paddingLeft: '12px',
            paddingRight: '40px'
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {type === 'datetime-local' ? (
            <Clock className="h-4 w-4 text-gray-400" />
          ) : (
            <Calendar className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 min-w-[320px]"
        >
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              {type === 'datetime-local' ? '選擇日期和時間' : '選擇日期'}
            </div>
            
            <div className="space-y-3">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-600">
                  日期:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={getNativeMin()}
                  max={getNativeMax()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Selection (24-hour format) */}
              {type === 'datetime-local' && (
                <div className="space-y-2">
                  <label className="block text-xs text-gray-600">
                    時間 (24小時制):
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedHours}
                      onChange={(e) => handleTimeChange(e.target.value, selectedMinutes)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    >
                      {hourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500 font-semibold">:</span>
                    <select
                      value={selectedMinutes}
                      onChange={(e) => handleTimeChange(selectedHours, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    >
                      {minuteOptions.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {(selectedDate || tempValue) && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  當前選擇: {type === 'datetime-local' && selectedDate
                    ? `${selectedDate.replace(/-/g, '/')} ${selectedHours}:${selectedMinutes}`
                    : (selectedDate ? selectedDate.replace(/-/g, '/') : (tempValue ? (type === 'datetime-local' ? formatDateTime(tempValue) : formatDate(tempValue)) : ''))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTempValue('');
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (type === 'datetime-local' && selectedDate) {
                    updateDateTimeValue(selectedDate, selectedHours, selectedMinutes);
                  } else if (type === 'date' && selectedDate) {
                    onChange(fromDateInput(selectedDate));
                  }
                  setTempValue('');
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateInput;
