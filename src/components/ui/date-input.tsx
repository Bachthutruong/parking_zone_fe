import React from 'react';
import { Input } from './input';
import { toDateTimeLocal, toDateInput, fromDateTimeLocal, fromDateInput } from '@/lib/dateUtils';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  placeholder?: string;
  type?: 'date' | 'datetime-local';
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  className = '',
  placeholder,
  type = 'datetime-local'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeValue = e.target.value;
    
    if (type === 'datetime-local') {
      const isoValue = fromDateTimeLocal(nativeValue);
      onChange(isoValue);
    } else {
      const isoValue = fromDateInput(nativeValue);
      onChange(isoValue);
    }
  };

  const getNativeValue = () => {
    if (!value) return '';
    
    if (type === 'datetime-local') {
      return toDateTimeLocal(value);
    } else {
      return toDateInput(value);
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
    <Input
      id={id}
      type={type}
      value={getNativeValue()}
      onChange={handleChange}
      min={getNativeMin()}
      max={getNativeMax()}
      placeholder={placeholder || (type === 'datetime-local' ? 'yyyy/mm/dd hh:mm' : 'yyyy/mm/dd')}
      className={className}
      style={{
        fontFamily: 'monospace'
      }}
    />
  );
};

export default DateInput;
