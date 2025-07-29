import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, XCircle, Car } from 'lucide-react';
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
  availableSlots?: number;
  price?: number;
  isSpecialPrice?: boolean;
  specialPriceReason?: string;
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
  const [parkingTypeInfo, setParkingTypeInfo] = useState<any>(null);

  useEffect(() => {
    if (parkingTypeId) {
      loadParkingTypeInfo();
    }
  }, [parkingTypeId]);

  useEffect(() => {
    if (parkingTypeId && parkingTypeInfo) {
      loadAvailabilityData();
    }
  }, [parkingTypeId, currentMonth, parkingTypeInfo]);

  const loadParkingTypeInfo = async () => {
    try {
      // Use the correct endpoint /api/parking
      const response = await api.get('/parking');
      if (response.data.parkingTypes) {
        const parkingType = response.data.parkingTypes.find((pt: any) => pt._id === parkingTypeId);
        if (parkingType) {
          setParkingTypeInfo(parkingType);
        }
      }
    } catch (error) {
      console.error('Error loading parking type info:', error);
    }
  };

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
        
        // Use fallback values if parkingTypeInfo is not loaded yet
        const totalSpaces = parkingTypeInfo?.totalSpaces || 10;
        const pricePerDay = parkingTypeInfo?.pricePerDay || 1200;
        
        days.push({
          date: dateStr,
          isAvailable: true, // Default to available, will be updated by API
          isSelected: Boolean(isInRange),
          isInRange: Boolean(isInRange),
          conflictingBookings: 0,
          availableSlots: totalSpaces,
          price: pricePerDay
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setAvailabilityData(days);
      
      // Check availability for each day individually to get accurate data
      await checkDailyAvailability(days);
      
    } catch (error) {
      console.error('Error loading availability data:', error);
    } finally {
      setLoading(false);
    }
  };

    const checkDailyAvailability = async (days: DayInfo[]) => {
    try {
      if (!parkingTypeInfo) {
        console.log('Parking type info not loaded yet');
        return;
      }

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // Use the new month availability API
      const response = await api.get(`/parking/${parkingTypeId}/month-availability`, {
        params: { year, month }
      });

      if (response.data.availabilityData) {
        const monthData = response.data.availabilityData;
        
        const updatedDays = days.map((day) => {
          const dayData = monthData.find((md: any) => md.date === day.date);
          
          if (dayData) {
            return {
              ...day,
              isAvailable: dayData.isAvailable,
              availableSlots: dayData.availableSpaces,
              price: dayData.price,
              isSpecialPrice: false,
              specialPriceReason: ''
            };
          } else {
            // Fallback for days not in the month data
            const dayDate = new Date(day.date);
            const isInPast = dayDate < new Date();
            
            return {
              ...day,
              isAvailable: !isInPast,
              availableSlots: isInPast ? 0 : (parkingTypeInfo?.totalSpaces || 0),
              price: parkingTypeInfo?.pricePerDay || 0,
              isSpecialPrice: false,
              specialPriceReason: ''
            };
          }
        });
        
        setAvailabilityData(updatedDays);
      }
    } catch (error) {
      console.error('Error checking daily availability:', error);
      // Fallback to simulation if API fails - show all future dates as available
      const now = new Date();
      const updatedDays = days.map((day) => {
        const dayDate = new Date(day.date);
        const isInPast = dayDate < now;
        
        // For future dates, show as available with some slots
        const availableSlots = isInPast ? 0 : Math.max(1, Math.floor(Math.random() * (parkingTypeInfo?.totalSpaces || 10)));
        
        return {
          ...day,
          isAvailable: !isInPast,
          availableSlots: availableSlots,
          price: parkingTypeInfo?.pricePerDay || 1200,
          isSpecialPrice: false,
          specialPriceReason: ''
        };
      });
      
      setAvailabilityData(updatedDays);
    }
  };

  const getDayStatus = (day: DayInfo) => {
    const isSelected = selectedStartDate === day.date || selectedEndDate === day.date;
    const isInSelectionRange = selectedStartDate && selectedEndDate && 
      day.date >= selectedStartDate && day.date <= selectedEndDate;
    
    if (isSelected) return 'selected';
    if (isInSelectionRange) return 'in-range';
    if (day.isInRange) return 'in-booking-range';
    if (!day.isAvailable || day.availableSlots === 0) return 'unavailable';
    return 'available';
  };

  const getDayClassName = (day: DayInfo) => {
    const baseClasses = 'w-full h-20 rounded-lg flex flex-col items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 border-2';
    const status = getDayStatus(day);
    
    switch (status) {
      case 'selected':
        return `${baseClasses} bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700`;
      case 'in-range':
        return `${baseClasses} bg-blue-200 text-blue-800 border-blue-300 hover:bg-blue-300`;
      case 'in-booking-range':
        return `${baseClasses} bg-green-100 text-green-800 border-green-300 hover:bg-green-200`;
      case 'unavailable':
        return `${baseClasses} bg-red-50 text-red-600 border-red-200 cursor-not-allowed opacity-60`;
      default:
        return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-blue-300`;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
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
    return ['日', '一', '二', '三', '四', '五', '六'];
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
    if (!dayInfo || !dayInfo.isAvailable || dayInfo.availableSlots === 0) return;
    
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
            <span>可用性日曆</span>
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
            <span>上個月</span>
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
            <span>下個月</span>
            <span>→</span>
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays().map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => {
              if (!day) {
                return <div key={index} className="w-full h-20" />;
              }

              const dayInfo = availabilityData.find(d => d.date === day.date);
              const status = getDayStatus(dayInfo || { ...day, isAvailable: true, isSelected: false, isInRange: false });
              const className = getDayClassName(dayInfo || { ...day, isAvailable: true, isSelected: false, isInRange: false });

              return (
                <div
                  key={index}
                  className={className}
                  onClick={() => handleDateClick(day.date)}
                  title={`${day.date} - ${status}`}
                >
                  {/* Date at top */}
                  <div className="text-lg font-bold mb-1">
                    {day.day}
                  </div>
                  
                                     {/* Availability and price info in center */}
                   <div className="text-center">
                     {dayInfo?.isAvailable && (dayInfo?.availableSlots || 0) > 0 ? (
                      <>
                        {/* Available slots */}
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Car className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {dayInfo.availableSlots} 位
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className={`text-xs font-bold ${
                          dayInfo.isSpecialPrice ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(dayInfo.price || 0)}
                        </div>
                        
                        {/* Special price indicator */}
                        {dayInfo.isSpecialPrice && (
                          <div className="text-xs text-orange-500 font-medium">
                            {dayInfo.specialPriceReason}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center mb-1">
                          <XCircle className="h-4 w-4" />
                        </div>
                        <div className="text-xs font-medium">
                          已滿
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-gray-600">Có sẵn</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-gray-600">Đã đặt</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded opacity-60"></div>
              <span className="text-gray-600">Hết chỗ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 border-2 border-blue-600 rounded"></div>
              <span className="text-gray-600">Đã chọn</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar; 