import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Car, 
  Phone, 
  Eye,
  Pencil,
  Printer,
  Grid3X3,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllBookings, updateBookingStatus, updateBulkBookingStatus, deleteBooking, getAllParkingTypes, getCalendarBookings, updateBooking } from '@/services/admin';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, RotateCcw } from 'lucide-react';
import { getSystemSettings } from '@/services/systemSettings';
import { formatDateTime, getDateStrTaiwan, getNextDayStrTaiwan } from '@/lib/dateUtils';
import DateInput from '@/components/ui/date-input';
import type { Booking } from '@/types';

const EDIT_STATUS_OPTIONS = [
  { value: 'pending', label: '等待進入停車場' },
  { value: 'confirmed', label: '預約成功' },
  { value: 'checked-in', label: '已進入停車場' },
  { value: 'checked-out', label: '已離開停車場' },
  { value: 'cancelled', label: '已取消' },
] as const;

interface EditBookingForm {
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  notes: string;
}

const BookingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') ?? '';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: searchFromUrl
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedParkingType, setSelectedParkingType] = useState<string>('all');
  const [showBookingsDialog, setShowBookingsDialog] = useState(false);
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [systemSettings, setSystemSettings] = useState<any>(null);


  const [activeTab, setActiveTab] = useState('active');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Status Change Dialog State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [bookingInProcess, setBookingInProcess] = useState<{booking: Booking, status: string} | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Bulk selection & status
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string>('');
  const [bulkStatusReason, setBulkStatusReason] = useState('');
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  // Edit Booking Dialog State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<EditBookingForm>({
    driverName: '',
    phone: '',
    email: '',
    licensePlate: '',
    parkingTypeId: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'confirmed',
    notes: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Parking Types State
  const [parkingTypes, setParkingTypes] = useState<any[]>([]);
  // selectedParkingType already declared above

  useEffect(() => {
    loadParkingTypes();
  }, []);

  // Sync search from URL (e.g. when coming from Today Overview "編輯" link)
  useEffect(() => {
    if (searchFromUrl) {
      setFilters((prev) => ({ ...prev, search: searchFromUrl }));
    }
  }, [searchFromUrl]);

  useEffect(() => {
    loadBookings();
    loadSettings();
  }, [page, filters, activeTab, itemsPerPage, selectedParkingType]);

  const loadParkingTypes = async () => {
    try {
      const data = await getAllParkingTypes();
      setParkingTypes(data.parkingTypes || []);
    } catch (error) {
      console.error('Failed to load parking types:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [viewMode, selectedParkingType, currentMonth, currentYear, filters, activeTab]);

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
        limit: itemsPerPage, // Use dynamic limit
        isDeleted: activeTab === 'deleted',
        parkingTypeId: selectedParkingType === 'all' ? undefined : selectedParkingType,
        sortBy: 'checkInTime',
        order: 'asc' as const
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
      
      // Build filter params for calendar API (no pagination needed)
      const filterParams: any = {
        status: filters.status === 'all' ? undefined : filters.status,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        search: filters.search || undefined,
        isDeleted: activeTab === 'deleted'
      };
      
      // Add parking type filter if not 'all'
      if (selectedParkingType && selectedParkingType !== 'all') {
        filterParams.parkingTypeId = selectedParkingType;
      }
      
      // Use the new calendar-specific API
      const response = await getCalendarBookings(filterParams);
      
      // Group bookings by date and parking type. Must use Taiwan date (same as sidebar/backend).
      // - occupiedSpaces = SUM(vehicleCount) for bookings that overlap the day
      // - Only count status in ['pending','confirmed','checked-in'] and !isDeleted
      const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked-in'];
      const groupedData = response.bookings.reduce((acc: any, booking: Booking) => {
        if (!booking.parkingType || !booking.parkingType._id) return acc;

        const parkingTypeId = booking.parkingType._id;
        const endDate = new Date(booking.checkOutTime);
        const vehicles = booking.vehicleCount ?? 1;
        const isActive = ACTIVE_STATUSES.includes(booking.status) && !booking.isDeleted;

        // Iterate by Taiwan calendar days (same as backend getTodayAvailability)
        let currentDayStr = getDateStrTaiwan(booking.checkInTime);
        while (currentDayStr) {
          if (!acc[currentDayStr]) acc[currentDayStr] = {};
          if (!acc[currentDayStr][parkingTypeId]) {
            acc[currentDayStr][parkingTypeId] = {
              parkingType: booking.parkingType,
              bookings: [],
              occupiedSpaces: 0
            };
          }
          acc[currentDayStr][parkingTypeId].bookings.push(booking);
          if (isActive) {
            acc[currentDayStr][parkingTypeId].occupiedSpaces += vehicles;
          }
          // Stop when this day is the last day the booking occupies (checkOut <= end of this day in Taiwan)
          const endOfCurrentDay = new Date(`${currentDayStr}T23:59:59.999+08:00`);
          if (endDate <= endOfCurrentDay) break;
          currentDayStr = getNextDayStrTaiwan(currentDayStr);
        }
        return acc;
      }, {});
      
      setCalendarData(groupedData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('無法載入日曆數據');
    } finally {
      setLoading(false);
    }
  };



  const openStatusDialog = (booking: Booking, status: string) => {
    setBookingInProcess({ booking, status });
    setStatusReason('');
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!bookingInProcess) return;
    try {
      await updateBookingStatus(bookingInProcess.booking._id, bookingInProcess.status, statusReason);
      toast.success('狀態更新成功');
      loadBookings();
      setIsStatusDialogOpen(false);
      setBookingInProcess(null);
    } catch (error: any) {
      console.error('Status update error:', error);
      const errorMessage = error.response?.data?.message || error.message || '狀態更新失敗';
      toast.error(errorMessage);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === bookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookings.map(b => b._id)));
    }
  };

  const toggleSelectBooking = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openBulkStatusDialog = (status: string) => {
    setBulkStatusTarget(status);
    setBulkStatusReason('');
    setIsBulkStatusDialogOpen(true);
  };

  const confirmBulkStatusChange = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkStatusLoading(true);
      const result = await updateBulkBookingStatus(
        Array.from(selectedIds),
        bulkStatusTarget,
        bulkStatusTarget === 'cancelled' ? bulkStatusReason : undefined
      );
      const successCount = (result as any).success?.length ?? 0;
      const failedCount = (result as any).failed?.length ?? 0;
      if (successCount > 0) {
        toast.success(`已更新 ${successCount} 筆預約狀態`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} 筆更新失敗`);
      }
      setSelectedIds(new Set());
      setIsBulkStatusDialogOpen(false);
      loadBookings();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || '批次更新失敗';
      toast.error(msg);
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteReason('');
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    try {
      await deleteBooking(bookingToDelete._id, deleteReason);
      toast.success('預約已刪除');
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
      loadBookings();
    } catch (error: any) {
      toast.error(error.message || '刪除失敗');
    }
  };

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    const ptId = typeof booking.parkingType === 'object' && booking.parkingType?._id
      ? booking.parkingType._id
      : (booking as any).parkingType ?? '';
    setEditForm({
      driverName: booking.driverName ?? '',
      phone: booking.phone ?? '',
      email: booking.email ?? '',
      licensePlate: booking.licensePlate ?? '',
      parkingTypeId: ptId,
      checkInTime: booking.checkInTime ?? '',
      checkOutTime: booking.checkOutTime ?? '',
      status: booking.status ?? 'confirmed',
      notes: (booking as any).notes ?? '',
    });
  };

  const closeEditDialog = () => {
    setEditingBooking(null);
    setEditSaving(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      setEditSaving(true);
      await updateBooking(editingBooking._id, {
        driverName: editForm.driverName,
        phone: editForm.phone,
        email: editForm.email || undefined,
        licensePlate: editForm.licensePlate,
        parkingType: editForm.parkingTypeId || undefined,
        checkInTime: editForm.checkInTime,
        checkOutTime: editForm.checkOutTime,
        status: editForm.status as 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled',
        notes: editForm.notes || undefined,
      } as Parameters<typeof updateBooking>[1]);
      toast.success('已更新預約資訊');
      closeEditDialog();
      loadBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '更新失敗');
    } finally {
      setEditSaving(false);
    }
  };

  const handleRevertStatus = (booking: Booking) => {
    let newStatus = '';
    switch (booking.status) {
      case 'checked-in':
        newStatus = 'confirmed';
        break;
      case 'checked-out':
        newStatus = 'checked-in';
        break;
      case 'cancelled':
        newStatus = 'confirmed';
        break;
    }
    
    if (newStatus) {
      openStatusDialog(booking, newStatus);
    }
  };

  const handleDateBookingClick = (date: string, parkingTypeId: string) => {
    const dateData = calendarData[date as keyof typeof calendarData];
    
    if (dateData && dateData[parkingTypeId as keyof typeof dateData]) {
      setDateBookings((dateData as any)[parkingTypeId].bookings);
    } else {
      setDateBookings([]); // No bookings for this date
    }
    
    setSelectedDate(date);
    setSelectedParkingType(parkingTypeId);
    setShowBookingsDialog(true);
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
          <h1>預約詳細資訊</h1>
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
        <div class="section">
          <h3>接駁與行李信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">出發 (${booking.departureTerminal === 'terminal1' ? '第一航廈' : booking.departureTerminal === 'terminal2' ? '第二航廈' : '未選擇'}):</span> 
              接駁 ${booking.departurePassengerCount || booking.passengerCount || 0} 人 / 行李 ${booking.departureLuggageCount || booking.luggageCount || 0} 件
            </div>
            <div class="info-item">
              <span class="label">回程 (${booking.returnTerminal === 'terminal1' ? '第一航廈' : booking.returnTerminal === 'terminal2' ? '第二航廈' : '未選擇'}):</span> 
              接駁 ${booking.returnPassengerCount || 0} 人 / 行李 ${booking.returnLuggageCount || 0} 件
            </div>
          </div>
        </div>

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

        ${booking.addonServices?.length > 0 ? `
        <div class="section">
          <h3>附加服務</h3>
          <div class="services">
            ${(booking.addonServices ?? []).map(addon => 
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
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
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
            return <div key={`empty-${index}`} className="p-2 min-h-[100px]"></div>;
          }
          
          const { day, date, data } = dayData;
          const isToday = date === getDateStrTaiwan(new Date());
          const isCurrentMonth = new Date(date + 'T12:00:00+08:00').getMonth() === currentMonth;
          
          return (
            <div 
              key={`day-${date}`} 
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
              
              {/* Show parking type statistics - same logic as sidebar: available = totalSpaces - occupiedSpaces (sum vehicleCount) */}
              {(selectedParkingType === 'all' ? parkingTypes : parkingTypes.filter(pt => pt._id === selectedParkingType)).map(pt => {
                const parkingData = data[pt._id];
                const occupiedSpaces = parkingData?.occupiedSpaces ?? 0;
                const totalSpaces = pt.totalSpaces ?? 50;
                const availableSlots = Math.max(0, totalSpaces - occupiedSpaces);
                const hasBookings = (parkingData?.bookings?.length ?? 0) > 0;
                
                const occupancyPercent = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;
                let statusColor = 'bg-green-100 border-green-300 text-green-700';
                if (occupancyPercent >= 80) statusColor = 'bg-red-100 border-red-300 text-red-700';
                else if (occupancyPercent >= 50) statusColor = 'bg-yellow-100 border-yellow-300 text-yellow-700';
                
                return (
                  <div 
                    key={pt._id}
                    className={`mb-1 p-1.5 rounded border text-xs cursor-pointer transition-all hover:shadow-md ${statusColor}`}
                    onClick={() => handleDateBookingClick(date, pt._id)}
                    title={hasBookings ? `點擊查看 ${parkingData.bookings.length} 筆預約，已佔 ${occupiedSpaces} 格` : `空: ${availableSlots}/${totalSpaces}`}
                  >
                    <div className="font-bold truncate" style={{ color: pt.color || '#3B82F6' }}>
                      {pt.icon || '🏢'} {pt.name}
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span>空: <strong>{availableSlots}</strong>/{totalSpaces}</span>
                      {occupiedSpaces > 0 && (
                        <span className="bg-blue-500 text-white px-1 rounded text-[10px]">
                          {occupiedSpaces} 訂
                        </span>
                      )}
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
                disabled={activeTab === 'deleted'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="所有狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="pending">等待進入停車場</SelectItem>
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

      {/* Parking Type Tabs */}
      <Tabs value={selectedParkingType} onValueChange={setSelectedParkingType} className="mb-4 sm:mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">所有停車場</TabsTrigger>
          {parkingTypes.map((pt) => (
            <TabsTrigger key={pt._id} value={pt._id} className="text-xs sm:text-sm">{pt.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'deleted')} className="mb-4 sm:mb-6">
        <TabsList>
          <TabsTrigger value="active" className="text-xs sm:text-sm">有效預約</TabsTrigger>
          <TabsTrigger value="deleted" className="text-xs sm:text-sm">已刪除預約</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bookings List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <CardTitle className="text-base sm:text-lg">預約清單 ({total})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="limit">顯示數量:</Label>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(val) => { setItemsPerPage(Number(val)); setPage(1); }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'calendar')}>
              <TabsList className="h-8 sm:h-9">
                <TabsTrigger value="table" className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                  <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">列表</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs sm:text-sm">
                  <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">日曆</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : viewMode === 'table' ? (
            <>
              {selectedIds.size > 0 && (
                <div className="mb-4 p-3 flex flex-wrap items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    已選 {selectedIds.size} 筆
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIds(new Set())}
                    className="border-blue-300"
                  >
                    取消選擇
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">批次變更狀態：</span>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => openBulkStatusDialog('checked-in')}
                  >
                    已進入停車場
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openBulkStatusDialog('checked-out')}
                  >
                    已離開停車場
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openBulkStatusDialog('cancelled')}
                  >
                    已取消
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={bookings.length > 0 && selectedIds.size === bookings.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="全選本頁"
                      />
                    </TableHead>
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
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedIds.has(booking._id)}
                          onCheckedChange={() => toggleSelectBooking(booking._id)}
                          aria-label={`選擇 ${booking.driverName}`}
                        />
                      </TableCell>
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
                          {/* <div className="text-sm text-gray-600">
                            {booking.parkingType?.icon || '🏢'} {(booking.parkingType?.type || 'indoor') === 'indoor' ? '室內' : 
                             (booking.parkingType?.type || 'indoor') === 'outdoor' ? '戶外' : '無障礙'}
                          </div> */}
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
                            title="查看詳情"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(booking)}
                            title="編輯預約"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          {/* Status Action Buttons */}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                onClick={() => openStatusDialog(booking, 'checked-in')}
                              >
                                已進入停車場
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openStatusDialog(booking, 'cancelled')}
                              >
                                取消
                              </Button>
                            </>
                          )}
                          
                          {booking.status === 'checked-in' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => openStatusDialog(booking, 'checked-out')}
                              >
                                已離開停車場
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevertStatus(booking)}
                                title="返回上一狀態"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {booking.status === 'checked-out' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevertStatus(booking)}
                              title="返回上一狀態"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}

                          {booking.status === 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevertStatus(booking)}
                              title="恢復訂單"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printBooking(booking)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                      
                      {activeTab !== 'deleted' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(booking)}
                          title="刪除預約"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold mb-2">停車場使用情況日曆</h3>
                <p className="text-gray-600 text-sm">點擊數字查看該日期的詳細預約</p>
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
            <DialogDescription className="text-xs sm:text-sm">
              {selectedDate} - {parkingTypes.find(pt => pt._id === selectedParkingType)?.name || '停車場'} 的預約
              {dateBookings.length > 0 ? ` (共 ${dateBookings.length} 筆)` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {dateBookings.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">該日無預約</h3>
              <p className="text-gray-500 text-sm sm:text-base">
                {selectedDate} 的 {parkingTypes.find(pt => pt._id === selectedParkingType)?.name || '此停車場'} 目前沒有任何預約記錄。
              </p>
            </div>
          ) : (
          <div className="space-y-3 sm:space-y-4">
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
                      <div>
                        <strong>出發:</strong> 
                        {booking.departureTerminal === 'terminal1' ? '一航' : booking.departureTerminal === 'terminal2' ? '二航' : '-'} 
                        ({booking.departurePassengerCount || booking.passengerCount || 0}人/{booking.departureLuggageCount || booking.luggageCount || 0}行李)
                      </div>
                      <div>
                        <strong>回程:</strong> 
                        {booking.returnTerminal === 'terminal1' ? '一航' : booking.returnTerminal === 'terminal2' ? '二航' : '-'} 
                        ({booking.returnPassengerCount || 0}人/{booking.returnLuggageCount || 0}行李)
                      </div>
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
                    onClick={() => {
                      setShowBookingsDialog(false);
                      openEditDialog(booking);
                    }}
                    title="編輯預約"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    編輯
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
          </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingsDialog(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>預約詳細資訊</DialogTitle>
            <DialogDescription>
              預約的詳細資訊
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">客戶資訊</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>姓名:</strong> {selectedBooking.driverName}</div>
                    <div><strong>電話:</strong> {selectedBooking.phone}</div>
                    <div><strong>電子郵件:</strong> {selectedBooking.email}</div>
                    <div><strong>車牌號碼:</strong> {selectedBooking.licensePlate}</div>
                    <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                      <div className="font-semibold text-gray-700">出發 (前往機場)</div>
                      <div>航廈: {selectedBooking.departureTerminal === 'terminal1' ? '第一航廈' : selectedBooking.departureTerminal === 'terminal2' ? '第二航廈' : '未選擇'}</div>
                      <div>接駁: {selectedBooking.departurePassengerCount || selectedBooking.passengerCount || 0} 人</div>
                      <div>行李: {selectedBooking.departureLuggageCount || selectedBooking.luggageCount || 0} 件</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                      <div className="font-semibold text-gray-700">回程 (接回停車場)</div>
                      <div>航廈: {selectedBooking.returnTerminal === 'terminal1' ? '第一航廈' : selectedBooking.returnTerminal === 'terminal2' ? '第二航廈' : '未選擇'}</div>
                      <div>接駁: {selectedBooking.returnPassengerCount || 0} 人</div>
                      <div>行李: {selectedBooking.returnLuggageCount || 0} 件</div>
                    </div>
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

              {selectedBooking.addonServices?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">附加服務</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedBooking.addonServices ?? []).map((addon, index) => (
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

      {/* Edit Booking Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯預約</DialogTitle>
            <DialogDescription>
              {editingBooking && (editingBooking.bookingNumber ? `預約編號: ${editingBooking.bookingNumber}` : `預約 ID: ${editingBooking._id}`)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-driverName">客戶姓名 *</Label>
                <Input
                  id="edit-driverName"
                  value={editForm.driverName}
                  onChange={(e) => setEditForm((f) => ({ ...f, driverName: e.target.value }))}
                  required
                  placeholder="客戶姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">電話 *</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  placeholder="電話"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-licensePlate">車牌號碼 *</Label>
              <Input
                id="edit-licensePlate"
                value={editForm.licensePlate}
                onChange={(e) => setEditForm((f) => ({ ...f, licensePlate: e.target.value }))}
                required
                placeholder="車牌號碼"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parkingType">停車場 *</Label>
              <Select
                value={editForm.parkingTypeId}
                onValueChange={(value) => setEditForm((f) => ({ ...f, parkingTypeId: value }))}
              >
                <SelectTrigger id="edit-parkingType">
                  <SelectValue placeholder="選擇停車場" />
                </SelectTrigger>
                <SelectContent>
                  {parkingTypes.map((pt) => (
                    <SelectItem key={pt._id} value={pt._id}>
                      {pt.icon || '🏢'} {pt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-checkInTime">進入時間 *</Label>
                <DateInput
                  id="edit-checkInTime"
                  type="datetime-local"
                  value={editForm.checkInTime}
                  onChange={(value) => setEditForm((f) => ({ ...f, checkInTime: value }))}
                  placeholder="年/月/日 00:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-checkOutTime">離開時間 *</Label>
                <DateInput
                  id="edit-checkOutTime"
                  type="datetime-local"
                  value={editForm.checkOutTime}
                  onChange={(value) => setEditForm((f) => ({ ...f, checkOutTime: value }))}
                  placeholder="年/月/日 00:00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">狀態</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">備註</Label>
              <Input
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="備註"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog} disabled={editSaving}>
                取消
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? '儲存中...' : '儲存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除預約</DialogTitle>
            <DialogDescription>
              您確定要刪除此預約嗎？此操作將會把預約移至已刪除列表。
              {bookingToDelete && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <p>預約編號: {bookingToDelete.bookingNumber || bookingToDelete._id}</p>
                  <p>客戶: {bookingToDelete.driverName}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="deleteReason" className="mb-2 block">刪除原因 (可選)</Label>
            <Textarea
              id="deleteReason"
              placeholder="請輸入刪除原因..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Bulk Status Change Confirmation Dialog */}
      <AlertDialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批次更改狀態 - 確認</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkStatusTarget && (
                <>
                  您確定要將所選 <strong>{selectedIds.size}</strong> 筆預約的狀態更改為
                  {bulkStatusTarget === 'checked-in' ? ' 已進入停車場' :
                   bulkStatusTarget === 'checked-out' ? ' 已離開停車場' :
                   bulkStatusTarget === 'cancelled' ? ' 已取消' : ` ${bulkStatusTarget}`} 嗎？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkStatusTarget === 'cancelled' && (
            <div className="py-4">
              <Label htmlFor="bulkStatusReason" className="mb-2 block">取消原因 (可選)</Label>
              <Textarea
                id="bulkStatusReason"
                placeholder="請輸入取消原因..."
                value={bulkStatusReason}
                onChange={(e) => setBulkStatusReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkStatusLoading}>取消</AlertDialogCancel>
            <Button
              variant={bulkStatusTarget === 'cancelled' ? 'destructive' : 'default'}
              onClick={confirmBulkStatusChange}
              disabled={bulkStatusLoading}
            >
              {bulkStatusLoading ? '處理中...' : '確認批次更改'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Booking Status Change Confirmation Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認更改狀態</AlertDialogTitle>
            <AlertDialogDescription>
              {bookingInProcess && (
                <>
                  您確定要將預約 <strong>{bookingInProcess.booking.driverName}</strong> 的狀態更改為
                  {bookingInProcess.status === 'checked-in' ? ' 已進入停車場' :
                   bookingInProcess.status === 'checked-out' ? ' 已離開停車場' :
                   bookingInProcess.status === 'cancelled' ? ' 已取消' :
                   bookingInProcess.status === 'confirmed' ? ' 已確認' : 
                   ` ${bookingInProcess.status}`} 嗎？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bookingInProcess?.status === 'cancelled' && (
            <div className="py-4">
              <Label htmlFor="statusReason" className="mb-2 block">取消原因 (可選)</Label>
              <Textarea
                id="statusReason"
                placeholder="請輸入取消原因..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <Button 
              variant={bookingInProcess?.status === 'cancelled' ? 'destructive' : 'default'}
              onClick={confirmStatusChange}
            >
              確認更改
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingsPage; 