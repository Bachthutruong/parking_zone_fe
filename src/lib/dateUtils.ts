/**
 * Date utility functions for consistent date formatting
 */

/**
 * Format a date string to yyyy/mm/dd format
 * @param dateString - Date string or Date object
 * @returns Formatted date string in yyyy/mm/dd format
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * Format a date string to yyyy/mm/dd with weekday
 * @param dateString - Date string or Date object
 * @returns Formatted date string in yyyy/mm/dd (星期X) format
 */
export const formatDateWithWeekday = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = date.getDay();
  const weekdayMap = ['天', '一', '二', '三', '四', '五', '六'];
  return `${year}/${month}/${day} (星期${weekdayMap[weekday]})`;
};

/**
 * Format a date string to yyyy/mm/dd with time
 * @param dateString - Date string or Date object
 * @returns Formatted date string in yyyy/mm/dd HH:mm format
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

/**
 * Format a date range to yyyy/mm/dd - yyyy/mm/dd format
 * @param startDate - Start date string or Date object
 * @param endDate - End date string or Date object
 * @returns Formatted date range string
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
 * Get current date in yyyy/mm/dd format
 * @returns Current date in yyyy/mm/dd format
 */
export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

/**
 * Get current datetime in yyyy/mm/dd HH:mm format
 * @returns Current datetime in yyyy/mm/dd HH:mm format
 */
export const getCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};

/**
 * Normalize a date to the start of the day in local time and return ISO string
 * @param dateString - Date string or Date object
 * @returns ISO string at 00:00:00.000 local time
 */
export const startOfDayISO = (dateString: string | Date): string => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

/**
 * Normalize a date to the end of the day in local time and return ISO string
 * @param dateString - Date string or Date object
 * @returns ISO string at 23:59:59.999 local time
 */
export const endOfDayISO = (dateString: string | Date): string => {
  const date = new Date(dateString);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

/**
 * Convert date to ISO string for datetime-local inputs
 * @param dateString - Date string or Date object
 * @returns ISO string for datetime-local input
 */
export const toDateTimeLocal = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  // Return local datetime in the format expected by <input type="datetime-local">
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert date to ISO string for date inputs
 * @param dateString - Date string or Date object
 * @returns ISO string for date input
 */
export const toDateInput = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // Return local date in the format expected by <input type="date">
  return `${year}-${month}-${day}`;
};

/**
 * Convert datetime-local input value to ISO string
 * @param dateTimeLocalString - Value from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns ISO string
 */
export const fromDateTimeLocal = (dateTimeLocalString: string): string => {
  if (!dateTimeLocalString) return '';
  const date = new Date(dateTimeLocalString);
  return date.toISOString();
};

/**
 * Convert date input value to ISO string
 * @param dateInputString - Value from date input (YYYY-MM-DD)
 * @returns ISO string
 */
export const fromDateInput = (dateInputString: string): string => {
  if (!dateInputString) return '';
  const [year, month, day] = dateInputString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString();
};
