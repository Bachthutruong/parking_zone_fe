import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface AvailabilityCalendarProps {
  parkingLotId: string;
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
  parkingLotId,
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
    if (parkingLotId) {
      loadAvailabilityData();
    }
  }, [parkingLotId, currentMonth]);

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
        
        // Check availability for this specific day
        const { isAvailable, availableSpaces } = await checkDayAvailability(dateStr);
        
        days.push({
          date: dateStr,
          isAvailable: Boolean(isAvailable),
          isSelected: Boolean(isInRange),
          isInRange: Boolean(isInRange),
          conflictingBookings: availableSpaces // Simplified for demo
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setAvailabilityData(days);
    } catch (error) {
      console.error('Error loading availability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDayAvailability = async (date: string): Promise<{ isAvailable: boolean; availableSpaces: number }> => {
    try {
      // Use the parking lot availability API
      const response = await fetch(`/api/parking/${parkingLotId}/availability?date=${date}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          isAvailable: data.isAvailable, 
          availableSpaces: data.availableSpaces || 0 
        };
      } else {
        console.error('Error response:', response.status, response.statusText);
        return { isAvailable: false, availableSpaces: 0 };
      }
    } catch (error) {
      console.error('Error checking day availability:', error);
      return { isAvailable: false, availableSpaces: 0 };
    }
  };

  const getDayStatus = (day: DayInfo) => {
    const isSelected = selectedStartDate === day.date || selectedEndDate === day.date;
    const isInSelectionRange = selectedStartDate && selectedEndDate && 
      day.date >= selectedStartDate && day.date <= selectedEndDate;
    
    if (isSelected) {
      return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-100 ring-2 ring-blue-500' };
    }
    
    if (isInSelectionRange) {
      return { icon: null, color: 'text-blue-600', bg: 'bg-blue-50' };
    }
    
    if (day.isInRange) {
      if (day.isAvailable) {
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600', bg: 'bg-green-50' };
      } else {
        return { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-50' };
      }
    }
    if (day.isAvailable) {
      return { icon: null, color: 'text-gray-600', bg: 'bg-white' };
    } else {
      return { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-600', bg: 'bg-orange-50' };
    }
  };

//   const formatDate = (dateStr: string) => {
//     return new Date(dateStr).getDate();
//   };

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
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayInfo = availabilityData.find(d => d.date === dateStr);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isAvailable: dayInfo?.isAvailable ?? true,
        isSelected: dayInfo?.isSelected ?? false,
        isInRange: dayInfo?.isInRange ?? false,
        conflictingBookings: dayInfo?.conflictingBookings ?? 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (dateStr: string) => {
    if (!selectedStartDate) {
      // First click - set start date
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      // Second click - set end date
      const start = new Date(selectedStartDate);
      const end = new Date(dateStr);
      
      if (end < start) {
        // If end date is before start date, swap them
        setSelectedStartDate(dateStr);
        setSelectedEndDate(selectedStartDate);
        onDateRangeSelect?.(dateStr, selectedStartDate);
      } else {
        setSelectedEndDate(dateStr);
        onDateRangeSelect?.(selectedStartDate, dateStr);
      }
    } else {
      // Third click - reset and start new selection
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
    }
    
    onDateSelect?.(dateStr);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Lịch khả dụng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>Lịch khả dụng</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Hướng dẫn sử dụng:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Click ngày đầu tiên để chọn ngày bắt đầu</p>
            <p>• Click ngày thứ hai để chọn ngày kết thúc</p>
            <p>• Click lại để chọn khoảng thời gian mới</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            ←
          </Button>
          <h3 className="text-lg font-semibold">{getMonthName(currentMonth)}</h3>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            →
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {getWeekDays().map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {getDaysInMonth().map((day, index) => {
            const status = getDayStatus(day);
            return (
              <div
                key={index}
                className={`
                  p-2 text-center text-sm border rounded cursor-pointer transition-colors
                  ${day.isCurrentMonth ? status.color : 'text-gray-300'}
                  ${status.bg}
                  hover:bg-gray-50
                `}
                onClick={() => handleDateClick(day.date)}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{day.day}</span>
                  {status.icon}
                </div>
                {day.conflictingBookings !== undefined && (
                  <div className="text-xs mt-1">
                    {day.conflictingBookings > 0 ? (
                      <span className="text-green-600 font-medium">{day.conflictingBookings} chỗ</span>
                    ) : (
                      <span className="text-red-600 font-medium">Hết chỗ</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Còn chỗ</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Hết chỗ (trong khoảng thời gian đã chọn)</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span>Hết chỗ (ngày khác)</span>
          </div>
        </div>

        {/* Summary */}
        {checkInTime && checkOutTime && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Tóm tắt khoảng thời gian đã chọn:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(checkInTime).toLocaleDateString('vi-VN')} - {new Date(checkOutTime).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {availabilityData.filter(d => d.isInRange && d.isAvailable).length} ngày còn chỗ / {availabilityData.filter(d => d.isInRange).length} ngày
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar; 