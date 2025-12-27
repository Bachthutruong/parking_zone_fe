/**
 * Date utility functions for consistent date formatting
 * Optimized for Taiwan (UTC+8) timezone
 */

const TAIWAN_OFFSET = '+08:00';
const TAIWAN_TIMEZONE = 'Asia/Taipei';

/**
 * Get date components in Taiwan timezone
 */
const getTaiwanParts = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: TAIWAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short'
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second'),
    weekday: getPart('weekday')
  };
};

/**
 * Format a date string to yyyy/mm/dd format in Taiwan time
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day } = getTaiwanParts(date);
  return `${year}/${month}/${day}`;
};

/**
 * Format a date string to yyyy/mm/dd with weekday in Taiwan time
 */
export const formatDateWithWeekday = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day } = getTaiwanParts(date);

  // Use zh-TW for weekday name
  const weekday = new Intl.DateTimeFormat('zh-TW', {
    timeZone: TAIWAN_TIMEZONE,
    weekday: 'short'
  }).format(date);

  return `${year}/${month}/${day} (${weekday})`;
};

/**
 * Format a date string to yyyy/mm/dd with time in Taiwan time
 */
export const formatDateTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day, minute } = getTaiwanParts(date);

  // Intl format for hour might be 12h or 24h depending on locale, 
  // but getTaiwanParts uses en-US which we can control.
  // To be safe, let's force 24h hour
  const h24 = new Intl.DateTimeFormat('en-GB', {
    timeZone: TAIWAN_TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(date);

  return `${year}/${month}/${day} ${h24}:${minute}`;
};

/**
 * Format a date range to yyyy/mm/dd - yyyy/mm/dd format
 */
export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
};

/**
 * Get current date in yyyy/mm/dd format (Taiwan time)
 */
export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

/**
 * Get current datetime in yyyy/mm/dd HH:mm format (Taiwan time)
 */
export const getCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};

/**
 * Normalize a date to the start of the day in Taiwan time and return ISO-like string with offset
 */
export const startOfDayISO = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day } = getTaiwanParts(date);
  return `${year}-${month}-${day}T00:00:00.000${TAIWAN_OFFSET}`;
};

/**
 * Normalize a date to the end of the day in Taiwan time and return ISO-like string with offset
 */
export const endOfDayISO = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day } = getTaiwanParts(date);
  return `${year}-${month}-${day}T23:59:59.999${TAIWAN_OFFSET}`;
};

/**
 * Convert date to string for datetime-local inputs (Taiwan time)
 */
export const toDateTimeLocal = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day } = getTaiwanParts(date);

  const h24 = new Intl.DateTimeFormat('en-GB', {
    timeZone: TAIWAN_TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(date);

  const { minute } = getTaiwanParts(date);

  return `${year}-${month}-${day}T${h24}:${minute}`;
};

/**
 * Convert date to string for date inputs (Taiwan time)
 */
export const toDateInput = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const { year, month, day } = getTaiwanParts(date);
  return `${year}-${month}-${day}`;
};

/**
 * Convert datetime-local input value to ISO string with Taiwan offset
 */
export const fromDateTimeLocal = (dateTimeLocalString: string): string => {
  if (!dateTimeLocalString) return '';
  // If it already has an offset, return as is (unlikely for datetime-local)
  if (dateTimeLocalString.includes('+') || (dateTimeLocalString.includes('Z') && !dateTimeLocalString.endsWith('T'))) {
    return new Date(dateTimeLocalString).toISOString();
  }
  // Otherwise append Taiwan offset
  return `${dateTimeLocalString}:00.000${TAIWAN_OFFSET}`;
};

/**
 * Convert date input value to ISO string with Taiwan offset
 */
export const fromDateInput = (dateInputString: string): string => {
  if (!dateInputString) return '';
  return `${dateInputString}T00:00:00.000${TAIWAN_OFFSET}`;
};
