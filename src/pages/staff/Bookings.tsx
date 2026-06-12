import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Car, 
//   User, 
  Phone, 
  // Edit,
  Eye,
  Printer,
  Grid3X3,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllBookings, updateBookingStatus } from '@/services/admin';
import { getSystemSettings } from '@/services/systemSettings';
import { formatDateTime } from '@/lib/dateUtils';
import {
  getDepartureLuggageCount,
  getDeparturePassengerCount,
  getReturnLuggageCount,
  getReturnPassengerCount,
  getTerminalLabel,
} from '@/lib/bookingDisplay';
import type { Booking } from '@/types';

const StaffBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedParkingType, setSelectedParkingType] = useState<string>('');
  const [showBookingsDialog, setShowBookingsDialog] = useState(false);
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    loadBookings();
    loadSettings();
  }, [page, filters]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [viewMode, selectedParkingType, currentMonth, currentYear]);

  const loadSettings = async () => {
    try {
      const settings = await getSystemSettings();
      setSystemSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const filterParams = {
        ...filters,
        status: filters.status === 'all' ? '' : filters.status,
        page,
        limit: 10
      };
      const response = await getAllBookings(filterParams);
      setBookings(response.bookings);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('無法載入預約清單');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      // This will be implemented with a new API endpoint
      // For now, we'll use the existing bookings data
      const response = await getAllBookings({
        ...filters,
        status: filters.status === 'all' ? '' : filters.status,
        page: 1,
        limit: 1000 // Get all bookings for calendar view
      });
      
      // Group bookings by date and parking type
      const groupedData = response.bookings.reduce((acc: any, booking: Booking) => {
        const parkingTypeId = booking.parkingType._id;
        const startDate = new Date(booking.checkInTime);
        const endDate = new Date(booking.checkOutTime);
        
        // Add booking to all dates in the range
        const currentDate = new Date(startDate);
        while (currentDate < endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          if (!acc[dateStr]) {
            acc[dateStr] = {};
          }
          if (!acc[dateStr][parkingTypeId]) {
            acc[dateStr][parkingTypeId] = {
              parkingType: booking.parkingType,
              bookings: [],
              totalBookings: 0
            };
          }
          
          acc[dateStr][parkingTypeId].bookings.push(booking);
          acc[dateStr][parkingTypeId].totalBookings++;
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return acc;
      }, {});
      
      setCalendarData(groupedData);
    } catch (error) {
      toast.error('無法載入日曆數據');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success('狀態更新成功');
      loadBookings();
      window.dispatchEvent(new Event('parking-updated'));
    } catch (error: any) {
      console.error('Status update error:', error);
      const errorMessage = error.response?.data?.message || error.message || '狀態更新失敗';
      toast.error(errorMessage);
    }
  };

  const createStatusUpdateHandler = (bookingId: string, newStatus: string) => {
    return () => handleStatusUpdate(bookingId, newStatus);
  };

  const handleDateBookingClick = (date: string, parkingTypeId: string) => {
    const dateData = calendarData[date as keyof typeof calendarData];
    if (dateData && dateData[parkingTypeId as keyof typeof dateData]) {
      setDateBookings((dateData as any)[parkingTypeId].bookings);
      setSelectedDate(date);
      setSelectedParkingType(parkingTypeId);
      setShowBookingsDialog(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const printBooking = async (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Ensure systemSettings is loaded
    let settings = systemSettings;
    if (!settings) {
      try {
        settings = await getSystemSettings();
      } catch (error) {
        console.error('Error loading settings for print:', error);
        settings = null;
      }
    }
    
    console.log('🔍 Print debug - systemSettings:', systemSettings);
    console.log('🔍 Print debug - settings:', settings);
    console.log('🔍 Print debug - contractTerms:', settings?.contractTerms);
    console.log('🔍 Print debug - contractTerms length:', settings?.contractTerms?.length);
    console.log('🔍 Print debug - contractTerms preview:', settings?.contractTerms?.substring(0, 100));

    // Create a backup text version of contract terms for better print compatibility
    const contractTermsText = settings?.contractTerms ? 
      settings.contractTerms
        .replace(/<h2[^>]*>/g, '\n\n')
        .replace(/<\/h2>/g, '\n')
        .replace(/<p[^>]*>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<strong[^>]*>/g, '【')
        .replace(/<\/strong>/g, '】')
        .replace(/<[^>]*>/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim() : '';

    // Create a simple HTML version without complex styling
    const contractTermsSimple = settings?.contractTerms ? 
      settings.contractTerms
        .replace(/<h2[^>]*>/g, '<div style="font-weight: bold; font-size: 14px; margin: 10px 0;">')
        .replace(/<\/h2>/g, '</div>')
        .replace(/<p[^>]*>/g, '<div style="margin: 5px 0; line-height: 1.4;">')
        .replace(/<\/p>/g, '</div>')
        .replace(/<strong[^>]*>/g, '<span style="font-weight: bold;">')
        .replace(/<\/strong>/g, '</span>') : '';

    console.log('🔍 Print debug - contractTermsSimple:', contractTermsSimple?.substring(0, 100));
    console.log('🔍 Print debug - contractTermsText:', contractTermsText?.substring(0, 100));

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>預約詳情 - ${booking.driverName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item { margin-bottom: 8px; }
          .label { font-weight: bold; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-confirmed { background-color: #fef3c7; color: #92400e; }
          .status-checked-in { background-color: #d1fae5; color: #065f46; }
          .status-checked-out { background-color: #f3f4f6; color: #374151; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          .services { display: flex; flex-wrap: wrap; gap: 5px; }
          .service-badge { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
          .total { font-size: 18px; font-weight: bold; color: #333; }
          .contract-terms { 
            border-top: 2px solid #333; 
            padding-top: 20px; 
            margin-top: 30px; 
            font-size: 12px; 
            line-height: 1.6; 
            color: #000; 
            font-family: Arial, sans-serif; 
            white-space: normal; 
            word-wrap: break-word; 
          }
          .contract-terms h2 { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #333; 
          }
          .contract-terms p { 
            margin-bottom: 8px; 
            color: #000; 
            font-size: 12px; 
          }
          .contract-terms strong { 
            font-weight: bold; 
            color: #000; 
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .contract-terms { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .contract-terms h2 { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .contract-terms p { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .contract-terms strong { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Ensure contract terms display properly when printing */
            .contract-terms table {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border-collapse: collapse !important;
              width: 100% !important;
            }
            .contract-terms td {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              border: 1px solid #000 !important;
              padding: 10px !important;
              font-family: Arial, sans-serif !important;
              color: #000 !important;
              vertical-align: top !important;
            }
            .contract-terms div {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: Arial, sans-serif !important;
              color: #000 !important;
            }
            .contract-terms pre {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: Arial, sans-serif !important;
              color: #000 !important;
              white-space: pre-wrap !important;
              word-wrap: break-word !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>預約詳情 - ${booking.driverName}</h1>
          <p>預約編號: ${booking.bookingNumber || booking._id}</p>
        </div>

        <div class="section">
          <h3>客戶資訊</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">姓名:</span> ${booking.driverName}
            </div>
            <div class="info-item">
              <span class="label">電話:</span> ${booking.phone}
            </div>
            <div class="info-item">
              <span class="label">電子郵件:</span> ${booking.email || '無'}
            </div>
            <div class="info-item">
              <span class="label">車牌號碼:</span> ${booking.licensePlate}
            </div>
            <div class="info-item">
              <span class="label">乘客:</span> ${getDeparturePassengerCount(booking)} 人
            </div>
            <div class="info-item">
              <span class="label">行李:</span> ${getDepartureLuggageCount(booking)} 件
            </div>
          </div>
        </div>

        ${getDeparturePassengerCount(booking) > 0 || getReturnPassengerCount(booking) > 0 ? `
        <div class="section">
          <h3>接駁服務信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">出發航廈:</span> ${getTerminalLabel(booking.departureTerminal)}
            </div>
            <div class="info-item">
              <span class="label">出發人數:</span> ${getDeparturePassengerCount(booking)} 人
            </div>
            <div class="info-item">
              <span class="label">回程航廈:</span> ${getTerminalLabel(booking.returnTerminal)}
            </div>
            <div class="info-item">
              <span class="label">回程人數:</span> ${getReturnPassengerCount(booking)} 人
            </div>
            <div class="info-item">
              <span class="label">回程行李:</span> ${getReturnLuggageCount(booking)} 件
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h3>預約資訊</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">停車場:</span> ${booking.parkingType.name}
            </div>
            <div class="info-item">
              <span class="label">類型:</span> ${(booking.parkingType.type || 'indoor') === 'indoor' ? '室內' : 
                (booking.parkingType.type || 'indoor') === 'outdoor' ? '戶外' : '無障礙'}
            </div>
            <div class="info-item">
              <span class="label">進場停車時間:</span> ${formatDateTime(booking.checkInTime)}
            </div>
            <div class="info-item">
              <span class="label">回國時間:</span> ${formatDateTime(booking.checkOutTime)}
            </div>
            <div class="info-item">
              <span class="label">狀態:</span> 
              <span class="status status-${booking.status}">
                ${booking.status === 'pending' ? '等待進入停車場' :
                  booking.status === 'confirmed' ? '等待進入停車場 (舊)' :
                  booking.status === 'checked-in' ? '已進入停車場' :
                  booking.status === 'checked-out' ? '已離開停車場' : '已取消'}
              </span>
            </div>
            <div class="info-item">
              <span class="label">VIP:</span> ${booking.isVIP ? '是' : '否'}
            </div>
          </div>
        </div>

        ${booking.addonServices.length > 0 ? `
        <div class="section">
          <h3>附加服務</h3>
          <div class="services">
            ${booking.addonServices.map(addon => 
              `<span class="service-badge">${addon.service.icon} ${addon.service.name} - ${addon.price.toLocaleString('zh-TW')} TWD</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h3>每日價格明細</h3>
          <div class="info-grid">
            ${booking.dailyPrices && booking.dailyPrices.length > 0 ? 
              booking.dailyPrices.map(dayPrice => `
                <div class="info-item">
                  <span class="label">${new Date(dayPrice.date).toLocaleDateString('zh-TW')}:</span> 
                  ${dayPrice.price.toLocaleString('zh-TW')} TWD
                  ${dayPrice.isSpecialPrice ? ` (特殊價格: ${dayPrice.specialPriceReason || '特殊定價'})` : ''}
                  ${dayPrice.isMaintenanceDay ? ' 🔧 保養日' : ''}
                </div>
              `).join('') :
              `
              <div class="info-item">
                <span class="label">總金額:</span> 
                ${booking.totalAmount.toLocaleString('zh-TW')} TWD
              </div>
              <div class="info-item">
                <span class="label">天數:</span> 
                ${booking.durationDays || '未知'} 天
              </div>
              <div class="info-item">
                <span class="label">每日平均:</span> 
                ${booking.durationDays ? Math.round(booking.totalAmount / booking.durationDays).toLocaleString('zh-TW') : '未知'} TWD
              </div>
              `
            }
          </div>
        </div>

        <div class="section">
          <h3>付款資訊</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">總金額:</span> ${booking.totalAmount.toLocaleString('zh-TW')} TWD
            </div>
            ${booking.autoDiscount && booking.autoDiscountAmount && booking.autoDiscountAmount > 0 ? `
            <div class="info-item">
              <span class="label">自動折扣 (${booking.autoDiscount.name}):</span> -${booking.autoDiscountAmount.toLocaleString('zh-TW')} TWD
            </div>
            <div class="info-item">
              <span class="label">自動折扣說明:</span> ${booking.autoDiscount.description}
            </div>
            ` : ''}
            ${booking.vipDiscount > 0 ? `
            <div class="info-item">
              <span class="label">VIP 折扣:</span> -${booking.vipDiscount.toLocaleString('zh-TW')} TWD
            </div>
            ` : ''}
            ${booking.discountAmount > 0 ? `
            <div class="info-item">
              <span class="label">折扣碼:</span> -${booking.discountAmount.toLocaleString('zh-TW')} TWD
            </div>
            ` : ''}
            <div class="info-item total">
              <span class="label">應付金額:</span> ${booking.finalAmount.toLocaleString('zh-TW')} TWD
            </div>
            <div class="info-item">
              <span class="label">付款方式:</span> ${booking.paymentMethod}
            </div>
            <div class="info-item">
              <span class="label">付款狀態:</span> ${booking.paymentStatus}
            </div>
          </div>
        </div>

        ${booking.notes ? `
        <div class="section">
          <h3>備註</h3>
          <p>${booking.notes}</p>
        </div>
        ` : ''}

        ${settings?.contractTerms ? `
        <div class="section contract-terms">
          <h3>合約條款</h3>
          <div style="padding: 15px; border: 1px solid #000; background: #f9f9f9; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #000;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 15px; text-align: center;">停車場使用合約條款</div>
            <div style="white-space: pre-line; font-size: 11px;">
              ${contractTermsText}
            </div>
          </div>
        </div>
        ` : ''}

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()">列印</button>
          <button onclick="window.close()">關閉</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '等待進入停車場', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '等待進入停車場', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'checked-in': { label: '已進入停車場', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'checked-out': { label: '已離開停車場', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  // Date formatting function is now imported from dateUtils

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const renderCalendar = () => {
    const today = new Date();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get unique parking types from calendar data
    const allParkingTypes = new Set();
    Object.values(calendarData).forEach((dateData: any) => {
      Object.keys(dateData).forEach(parkingTypeId => {
        allParkingTypes.add(parkingTypeId);
      });
    });
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = (calendarData as any)[dateStr] || {};
      
      days.push({
        day,
        date: dateStr,
        data: dayData
      });
    }
    
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    return (
      <div className="space-y-4">
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="flex items-center space-x-1"
          >
            <span>‹</span>
            <span>上月</span>
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Select
                value={currentMonth.toString()}
                onValueChange={(value) => setCurrentMonth(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={currentYear.toString()}
                onValueChange={(value) => setCurrentYear(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-blue-600 hover:text-blue-700"
            >
              今天
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="flex items-center space-x-1"
          >
            <span>下月</span>
            <span>›</span>
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Header */}
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="p-2 text-center font-semibold bg-gray-100">
              {day}
            </div>
          ))}
        
        {/* Days */}
        {days.map((dayData, index) => {
          if (!dayData) {
            return <div key={index} className="p-2 min-h-[100px]"></div>;
          }
          
          const { day, date, data } = dayData;
          const isToday = date === today.toISOString().split('T')[0];
          const isCurrentMonth = new Date(date).getMonth() === currentMonth;
          
          return (
            <div 
              key={day} 
              className={`p-2 min-h-[100px] border border-gray-200 ${
                isToday ? 'bg-blue-50 border-blue-300' : 
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
              }`}>
                {day}
              </div>
              
              {/* Show parking type statistics */}
              {Object.keys(data).map(parkingTypeId => {
                const parkingData = data[parkingTypeId];
                const parkingType = parkingData.parkingType;
                const totalBookings = parkingData.totalBookings;
                
                // Assume max capacity is 50 for now (this should come from parking type data)
                const maxCapacity = 50;
                const availableSlots = maxCapacity - totalBookings;
                
                return (
                  <div 
                    key={parkingTypeId}
                    className="mb-1 p-1 rounded text-xs cursor-pointer hover:bg-gray-100"
                    onClick={() => handleDateBookingClick(date, parkingTypeId)}
                  >
                    <div className="font-medium text-blue-600">
                      {parkingType?.name || '未知停車場'}
                    </div>
                    <div className="text-green-600">
                      空位: {availableSlots}
                    </div>
                    <div className="text-red-600">
                      已訂: {totalBookings}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  // Ensure filters.status is always a valid value
  const currentStatus = filters.status || 'all';

  // Don't render until state is ready
  if (loading && bookings.length === 0) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">預約管理</h1>
        <p className="text-gray-600 text-sm sm:text-base">管理系統中的所有預約</p>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>篩選</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search">搜尋</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="姓名、電話、車牌號碼..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">狀態</Label>
              <Select 
                value={currentStatus} 
                onValueChange={(value) => handleFilterChange('status', value)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="所有狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="pending">等待進入停車場</SelectItem>
                  <SelectItem value="confirmed">等待進入停車場 (舊)</SelectItem>
                  <SelectItem value="checked-in">已進入停車場</SelectItem>
                  <SelectItem value="checked-out">已離開停車場</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">開始日期</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">結束日期</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={loadBookings} className="w-full">
                篩選
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Tabs */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'calendar')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table" className="flex items-center space-x-2 text-xs sm:text-sm">
                <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>列表視圖</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center space-x-2 text-xs sm:text-sm">
                <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>日曆視圖</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">預約清單</CardTitle>
          <CardDescription className="text-sm">
            {viewMode === 'table' 
              ? `共 ${total} 筆預約 • 第 ${page} 頁，共 ${totalPages} 頁`
              : '日曆視圖 - 點擊數字查看詳細預約'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : viewMode === 'table' ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客戶</TableHead>
                    <TableHead>停車場</TableHead>
                    <TableHead>時間</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.driverName}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <Phone className="h-3 w-3" />
                            <span>{booking.phone}</span>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <Car className="h-3 w-3" />
                            <span>{booking.licensePlate}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.parkingType?.name || '未知停車場'}</div>
                          <div className="text-sm text-gray-600">
                            {booking.parkingType?.icon || '🏢'} {(booking.parkingType?.type || 'indoor') === 'indoor' ? '室內' : 
                             (booking.parkingType?.type || 'indoor') === 'outdoor' ? '戶外' : '無障礙'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDateTime(booking.checkInTime)}
                          </div>
                          <div className="text-sm">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDateTime(booking.checkOutTime)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(booking.finalAmount)}</div>
                          {booking.discountAmount > 0 && (
                            <div className="text-sm text-green-600">
                              -{formatCurrency(booking.discountAmount)}
                            </div>
                          )}
                          {booking.autoDiscountAmount && booking.autoDiscountAmount > 0 && (
                            <div className="text-sm text-purple-600">
                              🎯 自動折扣: -{formatCurrency(booking.autoDiscountAmount)}
                            </div>
                          )}
                          {booking.vipDiscount > 0 && (
                            <div className="text-sm text-yellow-600">
                              👑 VIP: -{formatCurrency(booking.vipDiscount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Status Action Buttons */}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <>
                              <Button
                                size="sm"
                                                variant="default"
                className="bg-[#39653f] hover:bg-[#2d4f33] text-white"
                                onClick={createStatusUpdateHandler(booking._id, 'checked-in')}
                              >
                                已進入停車場
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={createStatusUpdateHandler(booking._id, 'cancelled')}
                              >
                                取消
                              </Button>
                            </>
                          )}
                          
                          {booking.status === 'checked-in' && (
                            <Button
                              size="sm"
                                              variant="default"
                className="bg-[#39653f] hover:bg-[#2d4f33] text-white"
                              onClick={createStatusUpdateHandler(booking._id, 'checked-out')}
                            >
                              已離開停車場
                            </Button>
                          )}
                          

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printBooking(booking)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    顯示第 {((page - 1) * 10) + 1} - {Math.min(page * 10, total)} 筆，共 {total} 筆結果
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      上一頁
                    </Button>
                    <span className="text-sm">
                      第 {page} 頁，共 {totalPages} 頁
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">停車場使用情況日曆</h3>
                <p className="text-gray-600">點擊數字查看該日期的詳細預約</p>
              </div>
              {renderCalendar()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Bookings Dialog */}
      <Dialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">預約詳細列表</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedDate} - {dateBookings.length > 0 ? (dateBookings[0].parkingType?.name || '未知停車場') : '停車場'} 的預約
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {dateBookings.map((booking) => (
              <Card key={booking._id} className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">客戶信息</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>姓名:</strong> {booking.driverName}</div>
                      <div><strong>電話:</strong> {booking.phone}</div>
                      <div><strong>車牌:</strong> {booking.licensePlate}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">時間信息</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>進入:</strong> {formatDateTime(booking.checkInTime)}</div>
                      <div><strong>離開:</strong> {formatDateTime(booking.checkOutTime)}</div>
                      <div><strong>狀態:</strong> {getStatusBadge(booking.status)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">服務信息</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>乘客:</strong> {getDeparturePassengerCount(booking)} 人</div>
                      <div><strong>行李:</strong> {getDepartureLuggageCount(booking)} 件</div>
                      {(getDeparturePassengerCount(booking) > 0 || getReturnPassengerCount(booking) > 0) && (
                        <>
                          <div><strong>出發航廈:</strong> {getTerminalLabel(booking.departureTerminal)}</div>
                          <div><strong>出發人數:</strong> {getDeparturePassengerCount(booking)} 人</div>
                          <div><strong>回程航廈:</strong> {getTerminalLabel(booking.returnTerminal)}</div>
                          <div><strong>回程人數:</strong> {getReturnPassengerCount(booking)} 人</div>
                          <div><strong>回程行李:</strong> {getReturnLuggageCount(booking)} 件</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">金額信息</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>總金額:</strong> {formatCurrency(booking.totalAmount)}</div>
                      {booking.autoDiscountAmount && booking.autoDiscountAmount > 0 && (
                        <div className="text-purple-600">
                          <strong>🎯 自動折扣:</strong> -{formatCurrency(booking.autoDiscountAmount)}
                        </div>
                      )}
                      {booking.vipDiscount > 0 && (
                        <div className="text-yellow-600">
                          <strong>👑 VIP:</strong> -{formatCurrency(booking.vipDiscount)}
                        </div>
                      )}
                      {booking.discountAmount > 0 && (
                        <div className="text-green-600">
                          <strong>🎫 折扣碼:</strong> -{formatCurrency(booking.discountAmount)}
                        </div>
                      )}
                      <div><strong>應付:</strong> {formatCurrency(booking.finalAmount)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowBookingsDialog(false);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    查看詳情
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printBooking(booking)}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    列印
                  </Button>
                </div>
              </Card>
            ))}
            
            {dateBookings.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">沒有預約</h3>
                <p className="text-gray-500">該日期沒有預約記錄</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingsDialog(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">預約詳細資訊</DialogTitle>
            <DialogDescription className="text-sm">
              預約的詳細資訊
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h4 className="font-semibold mb-2">客戶資訊</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>姓名:</strong> {selectedBooking.driverName}</div>
                    <div><strong>電話:</strong> {selectedBooking.phone}</div>
                    <div><strong>電子郵件:</strong> {selectedBooking.email}</div>
                    <div><strong>車牌號碼:</strong> {selectedBooking.licensePlate}</div>
                    <div><strong>乘客:</strong> {getDeparturePassengerCount(selectedBooking)} 人</div>
                    <div><strong>行李:</strong> {getDepartureLuggageCount(selectedBooking)} 件</div>
                    {(getDeparturePassengerCount(selectedBooking) > 0 || getReturnPassengerCount(selectedBooking) > 0) && (
                      <>
                        <div><strong>出發航廈:</strong> {getTerminalLabel(selectedBooking.departureTerminal)}</div>
                        <div><strong>出發人數:</strong> {getDeparturePassengerCount(selectedBooking)} 人</div>
                        <div><strong>回程航廈:</strong> {getTerminalLabel(selectedBooking.returnTerminal)}</div>
                        <div><strong>回程人數:</strong> {getReturnPassengerCount(selectedBooking)} 人</div>
                        <div><strong>回程行李:</strong> {getReturnLuggageCount(selectedBooking)} 件</div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">預約資訊</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>停車場:</strong> {selectedBooking.parkingType?.name || '未知停車場'}</div>
                    <div><strong>類型:</strong> {selectedBooking.parkingType?.type || 'indoor'}</div>
                    <div><strong>進入:</strong> {formatDateTime(selectedBooking.checkInTime)}</div>
                    <div><strong>離開:</strong> {formatDateTime(selectedBooking.checkOutTime)}</div>
                    <div><strong>狀態:</strong> {getStatusBadge(selectedBooking.status)}</div>
                    <div><strong>VIP:</strong> {selectedBooking.isVIP ? '是' : '否'}</div>
                  </div>
                </div>
              </div>

              {selectedBooking.addonServices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">附加服務</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.addonServices.map((addon, index) => (
                      <Badge key={index} variant="outline">
                        {addon.service.icon} {addon.service.name} - {formatCurrency(addon.price)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">付款資訊</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>總金額:</strong> {formatCurrency(selectedBooking.totalAmount)}</div>
                  
                  {/* Auto Discount */}
                  {selectedBooking.autoDiscount && selectedBooking.autoDiscountAmount && selectedBooking.autoDiscountAmount > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-purple-600 font-medium">🎯 自動折扣:</span>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {selectedBooking.autoDiscount.name}
                        </span>
                      </div>
                      <div className="text-purple-600 font-semibold">-{formatCurrency(selectedBooking.autoDiscountAmount)}</div>
                      <div className="text-xs text-purple-500">{selectedBooking.autoDiscount.description}</div>
                    </div>
                  )}
                  
                  {/* VIP Discount */}
                  {selectedBooking.vipDiscount > 0 && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-yellow-600 font-medium">👑 VIP 折扣:</span>
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">VIP 會員</span>
                      </div>
                      <div className="text-yellow-600 font-semibold">-{formatCurrency(selectedBooking.vipDiscount)}</div>
                      <div className="text-xs text-yellow-500">VIP會員享有折扣優惠</div>
                    </div>
                  )}
                  
                  {/* Discount Code */}
                  {selectedBooking.discountAmount > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-green-600 font-medium">🎫 折扣碼:</span>
                      </div>
                      <div className="text-green-600 font-semibold">-{formatCurrency(selectedBooking.discountAmount)}</div>
                      <div className="text-xs text-green-500">折扣碼已應用</div>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <div><strong>應付金額:</strong> {formatCurrency(selectedBooking.finalAmount)}</div>
                    <div><strong>付款方式:</strong> {selectedBooking.paymentMethod}</div>
                    <div><strong>付款狀態:</strong> {selectedBooking.paymentStatus}</div>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h4 className="font-semibold mb-2">備註</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default StaffBookings;
