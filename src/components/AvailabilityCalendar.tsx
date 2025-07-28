import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/services';

interface AvailabilityCalendarProps {
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  onDateSelect?: (date: string) => void;
  onDateRangeSelect?: (checkIn: string, checkOut: string) => void;
}

interface DayInfo {
  date: string;
  isAvailable: boolean;
  isSelected: boolean;
  isInRange: boolean;
  conflictingBookings?: number;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  parkingTypeId,
  checkInTime,
  checkOutTime,
  onDateSelect,
  onDateRangeSelect
}) => {
  const [availabilityData, setAvailabilityData] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (parkingTypeId) {
      loadAvailabilityData();
    }
  }, [parkingTypeId, currentMonth]);

  const loadAvailabilityData = async () => {
    setLoading(true);
    try {
      // Get the first and last day of the current month
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Generate all days in the month
      const days: DayInfo[] = [];
      const currentDate = new Date(firstDay);
      
      while (currentDate <= lastDay) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInRange = checkInTime && checkOutTime && 
          currentDate >= new Date(checkInTime) && currentDate <= new Date(checkOutTime);
        
        days.push({
          date: dateStr,
          isAvailable: true, // Default to available, will be updated by API
          isSelected: Boolean(isInRange),
          isInRange: Boolean(isInRange),
          conflictingBookings: 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setAvailabilityData(days);
      
      // Make a single API call to get availability for the entire month
      await checkMonthAvailability(firstDay, lastDay);
      
    } catch (error) {
      console.error('Error loading availability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMonthAvailability = async (firstDay: Date, lastDay: Date) => {
    try {
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      // Make a single API call for the entire month
      const response = await api.post('/bookings/check-availability', {
        parkingTypeId,
        checkInTime: `${startDate}T00:00:00.000Z`,
        checkOutTime: `${endDate}T23:59:59.999Z`
      });
      
      if (response.data.success) {
        // Update availability data based on the response
        setAvailabilityData(prev => prev.map(day => ({
          ...day,
          isAvailable: true, // If the month is available, all days are available
          conflictingBookings: 0
        })));
      } else {
        // If the month is not available, mark all days as unavailable
        setAvailabilityData(prev => prev.map(day => ({
          ...day,
          isAvailable: false,
          conflictingBookings: 1
        })));
      }
    } catch (error) {
      console.error('Error checking month availability:', error);
      // On error, assume all days are available
      setAvailabilityData(prev => prev.map(day => ({
        ...day,
        isAvailable: true,
        conflictingBookings: 0
      })));
    }
  };

  const getDayStatus = (day: DayInfo) => {
    const isSelected = selectedStartDate === day.date || selectedEndDate === day.date;
    const isInSelectionRange = selectedStartDate && selectedEndDate && 
      day.date >= selectedStartDate && day.date <= selectedEndDate;
    
    if (isSelected) return 'selected';
    if (isInSelectionRange) return 'in-range';
    if (day.isInRange) return 'in-booking-range';
    if (!day.isAvailable) return 'unavailable';
    return 'available';
  };

  const getDayClassName = (day: DayInfo) => {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200';
    const status = getDayStatus(day);
    
    switch (status) {
      case 'selected':
        return `${baseClasses} bg-blue-600 text-white shadow-lg`;
      case 'in-range':
        return `${baseClasses} bg-blue-200 text-blue-800`;
      case 'in-booking-range':
        return `${baseClasses} bg-green-100 text-green-800 border-2 border-green-300`;
      case 'unavailable':
        return `${baseClasses} bg-red-100 text-red-600 cursor-not-allowed opacity-50`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
    }
  };

  const getDayIcon = (day: DayInfo) => {
    const status = getDayStatus(day);
    
    switch (status) {
      case 'selected':
        return <CheckCircle className="h-4 w-4" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4" />;
      case 'in-booking-range':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getWeekDays = () => {
    return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Add empty cells for days before the first day of the month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayInfo = availabilityData.find(day => day.date === dateStr);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        ...dayInfo
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (dateStr: string) => {
    if (!dateStr) return;
    
    const dayInfo = availabilityData.find(day => day.date === dateStr);
    if (!dayInfo || !dayInfo.isAvailable) return;
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
      onDateSelect?.(dateStr);
    } else {
      if (dateStr >= selectedStartDate) {
        setSelectedEndDate(dateStr);
        onDateRangeSelect?.(selectedStartDate, dateStr);
      } else {
        setSelectedStartDate(dateStr);
        setSelectedEndDate(selectedStartDate);
        onDateRangeSelect?.(dateStr, selectedStartDate);
      }
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center space-x-3 text-blue-900">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span>Lịch khả dụng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center space-x-3 text-blue-900">
          <Calendar className="h-6 w-6 text-blue-600" />
          <span>Lịch khả dụng</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="flex items-center space-x-2"
          >
            <span>←</span>
            <span>Tháng trước</span>
          </Button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {getMonthName(currentMonth)}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="flex items-center space-x-2"
          >
            <span>Tháng sau</span>
            <span>→</span>
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1">
            {getWeekDays().map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              if (!day) {
                return <div key={index} className="w-8 h-8" />;
              }

                             const dayInfo = availabilityData.find(d => d.date === day.date);
               const status = getDayStatus(dayInfo || { ...day, isAvailable: true, isSelected: false, isInRange: false });
               const className = getDayClassName(dayInfo || { ...day, isAvailable: true, isSelected: false, isInRange: false });
               const icon = getDayIcon(dayInfo || { ...day, isAvailable: true, isSelected: false, isInRange: false });

              return (
                <div
                  key={index}
                  className={className}
                  onClick={() => handleDateClick(day.date)}
                  title={`${day.date} - ${status}`}
                >
                  {icon || day.day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded-full"></div>
              <span className="text-gray-600">Có sẵn</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded-full"></div>
              <span className="text-gray-600">Đã đặt</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 rounded-full opacity-50"></div>
              <span className="text-gray-600">Hết chỗ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Đã chọn</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar; 