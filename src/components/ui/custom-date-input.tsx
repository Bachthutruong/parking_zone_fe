import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { formatDate, formatDateTime, toDateTimeLocal, toDateInput, fromDateTimeLocal, fromDateInput } from '@/lib/dateUtils';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      if (type === 'datetime-local') {
        setDisplayValue(formatDateTime(value));
      } else {
        setDisplayValue(formatDate(value));
      }
    } else {
      setDisplayValue('');
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
    setTempValue(value);
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

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeValue = e.target.value;
    
    
    if (type === 'datetime-local') {
      const isoValue = fromDateTimeLocal(nativeValue);
      setTempValue(isoValue);
      // Also call onChange immediately for datetime-local
      onChange(isoValue);
    } else {
      const isoValue = fromDateInput(nativeValue);
      onChange(isoValue);
      setIsOpen(false);
    }
  };

  const getNativeValue = () => {
    // Use tempValue if available, otherwise use the current value
    const valueToUse = tempValue || value;
    if (!valueToUse) return '';
    
    if (type === 'datetime-local') {
      return toDateTimeLocal(valueToUse);
    } else {
      return toDateInput(valueToUse);
    }
  };

  const getNativeMin = () => {
    if (!min) return undefined;
    
    if (type === 'datetime-local') {
      return toDateTimeLocal(min);
    } else {
      return toDateInput(min);
    }
  };

  const getNativeMax = () => {
    if (!max) return undefined;
    
    if (type === 'datetime-local') {
      return toDateTimeLocal(max);
    } else {
      return toDateInput(max);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
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
          className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 min-w-[300px]"
        >
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              {type === 'datetime-local' ? '選擇日期和時間' : '選擇日期'}
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs text-gray-600">
                使用原生選擇器:
              </label>
              <input
                type={type}
                value={getNativeValue()}
                onChange={handleNativeChange}
                min={getNativeMin()}
                max={getNativeMax()}
                placeholder={type === 'datetime-local' ? '年/月/日 00:00' : '年/月/日'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tempValue && (
                <div className="text-xs text-gray-500">
                  當前選擇: {type === 'datetime-local' ? formatDateTime(tempValue) : formatDate(tempValue)}
                </div>
              )}
            </div>
            
            {/* <div className="space-y-2">
              <label className="block text-xs text-gray-600">
                或直接輸入 (yyyy/mm/dd):
              </label>
              <input
                type="text"
                value={tempValue ? (type === 'datetime-local' ? formatDateTime(tempValue) : formatDate(tempValue)) : displayValue}
                onChange={handleInputChange}
                placeholder="年/月/日 00:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div> */}
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTempValue(''); // Clear temp value
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempValue) {
                    onChange(tempValue);
                  }
                  setTempValue(''); // Clear temp value
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
