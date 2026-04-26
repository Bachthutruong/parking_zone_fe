import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar,
  Car,
  Clock,
  Pencil,
  Eye,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Printer,
  RotateCcw,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTodayBookings, updateBooking, updateBookingStatus, updateBulkBookingStatus, getAllParkingTypes } from '@/services/admin';
import ParkingSlotPicker from '@/components/admin/ParkingSlotPicker';
import { calculatePrice } from '@/services/booking';
import { formatDateTime, formatDateWithWeekday } from '@/lib/dateUtils';
import DateInput from '@/components/ui/date-input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface TodayBooking {
  _id: string;
  bookingNumber: string;
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  finalAmount: number;
  vehicleCount?: number;
  parkingType: {
    _id?: string;
    name: string;
    code: string;
    icon?: string;
  };
  user: {
    name: string;
    phone: string;
  };
}

interface TodaySummary {
  checkInsToday: TodayBooking[];
  checkOutsToday: TodayBooking[];
  overdueBookings: TodayBooking[];
  expectedNotEnteredBookings: TodayBooking[];
  summary: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalOverdue: number;
    totalExpectedNotEntered: number;
  };
}

interface EditFormState {
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  parkingTypeId: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  notes?: string;
  vehicleCount: number;
  parkingSlotNumbers: number[];
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待確認' },
  { value: 'confirmed', label: '預約成功' },
  { value: 'checked-in', label: '已進入停車場' },
  { value: 'checked-out', label: '已離開停車場' },
  { value: 'cancelled', label: '已取消' },
] as const;

// 5 tab keys: 預計進場車輛 | 已進場車輛 | 預計離場車輛 | 逾期離場車輛 | 預期未進場
type TodayTabKey = 'entering' | 'alreadyEntered' | 'leaving' | 'overdue' | 'expectedNotEntered';

const AdminTodayOverview: React.FC = () => {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TodayTabKey>('entering');
  const [editingBooking, setEditingBooking] = useState<TodayBooking | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    driverName: '',
    phone: '',
    email: '',
    licensePlate: '',
    parkingTypeId: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'confirmed',
    notes: '',
    vehicleCount: 1,
    parkingSlotNumbers: [],
  });
  const [saving, setSaving] = useState(false);
  const [parkingTypes, setParkingTypes] = useState<any[]>([]);
  const [newPriceLoading, setNewPriceLoading] = useState(false);
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [newPriceError, setNewPriceError] = useState<string | null>(null);
  const [availabilityErrorDetail, setAvailabilityErrorDetail] = useState<{
    selectedRange: { from: string; to: string };
    fullDays: string[];
  } | null>(null);
  // Chỉ tính lại giá sau khi user thực sự thay đổi dữ liệu
  const [shouldRecalcPrice, setShouldRecalcPrice] = useState(false);

  // Selection & bulk status (like Bookings)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [bookingInProcess, setBookingInProcess] = useState<{ booking: TodayBooking; status: string } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [checkInSlots, setCheckInSlots] = useState<number[]>([]);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string>('');
  const [bulkStatusReason, setBulkStatusReason] = useState('');
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  // View details
  const [viewingBooking, setViewingBooking] = useState<TodayBooking | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  useEffect(() => {
    getAllParkingTypes()
      .then((res) => setParkingTypes(res.parkingTypes ?? []))
      .catch(() => setParkingTypes([]));
  }, []);

  const loadTodayData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getTodayBookings({
        search: debouncedSearch || undefined,
      });
      setData(result);
    } catch (error: any) {
      console.error('Error loading today data:', error);
      toast.error('無法載入今日資料');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  // Date formatting function is now imported from dateUtils

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
      pending: { label: '等待進入停車場', variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      confirmed: { label: '預約成功', variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      'checked-in': { label: '已進入停車場', variant: 'secondary', icon: <Car className="h-3 w-3 mr-1" /> },
      'checked-out': { label: '已離開停車場', variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
      cancelled: { label: '已取消', variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.icon}{config.label}</Badge>;
  };

  // 5 lists:
  // - 進入車輛: đặt hẹn hoàn thành nhưng chưa vào bãi (checkIn hôm nay, status pending/confirmed)
  // - 待進入車輛: đã vào bãi (checkIn hôm nay, status checked-in)
  // - 離開車輛: sẽ rời bãi vào hôm nay nhưng chưa đến giờ rời (checkOut hôm nay, còn trong bãi, checkOutTime > now)
  // - 未離開車輛: quá hạn đến hôm nay nhưng chưa rời (overdue, status !== checked-out)
  // - 預期未進場: expected checkIn was in the past, but hasn't entered (pending/confirmed)
  const { enteringList, alreadyEnteredList, leavingList, overdueList, expectedNotEnteredList, counts } = useMemo(() => {
    if (!data) {
      return {
        enteringList: [] as TodayBooking[],
        alreadyEnteredList: [] as TodayBooking[],
        leavingList: [] as TodayBooking[],
        overdueList: [] as TodayBooking[],
        expectedNotEnteredList: [] as TodayBooking[],
        counts: { entering: 0, alreadyEntered: 0, leaving: 0, overdue: 0, expectedNotEntered: 0 },
      };
    }
    const now = new Date();
    // 進入車輛: checkIn hôm nay, chưa vào bãi (pending/confirmed)
    const entering = data.checkInsToday.filter((b) => b.status === 'pending' || b.status === 'confirmed');
    // 待進入車輛: checkIn hôm nay, đã vào bãi (checked-in)
    const alreadyEntered = data.checkInsToday.filter((b) => b.status === 'checked-in');
    // 離開車輛: checkOut hôm nay, vẫn còn trong bãi, chưa đến giờ rời (checkOutTime > now)
    const leaving = data.checkOutsToday.filter(
      (b) => b.status === 'checked-in' && new Date(b.checkOutTime) > now
    );
    // 未離開車輛: quá hạn (checkOut đã qua) nhưng chưa rời
    const overdue = data.overdueBookings.filter((b) => b.status !== 'checked-out');
    // 預期未進場: overdue checkIn
    const expectedNotEntered = data.expectedNotEnteredBookings || [];

    return {
      enteringList: entering,
      alreadyEnteredList: alreadyEntered,
      leavingList: leaving,
      overdueList: overdue,
      expectedNotEnteredList: expectedNotEntered,
      counts: {
        entering: entering.length,
        alreadyEntered: alreadyEntered.length,
        leaving: leaving.length,
        overdue: overdue.length,
        expectedNotEntered: expectedNotEntered.length,
      },
    };
  }, [data]);

  const getCurrentData = (): TodayBooking[] => {
    switch (activeTab) {
      case 'entering': return enteringList;
      case 'alreadyEntered': return alreadyEnteredList;
      case 'leaving': return leavingList;
      case 'overdue': return overdueList;
      case 'expectedNotEntered': return expectedNotEnteredList;
      default: return enteringList;
    }
  };

  const currentList = getCurrentData();

  const openStatusDialog = (booking: TodayBooking, status: string) => {
    setBookingInProcess({ booking, status });
    setStatusReason('');
    const ex = (booking as TodayBooking & { parkingSlotNumbers?: number[] }).parkingSlotNumbers;
    setCheckInSlots(status === 'checked-in' && Array.isArray(ex) ? [...ex] : []);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!bookingInProcess) return;
    const { booking, status } = bookingInProcess;
    const vc = Math.max(1, (booking as TodayBooking & { vehicleCount?: number }).vehicleCount || 1);
    if (status === 'checked-in') {
      if (checkInSlots.length !== vc) {
        toast.error(`入場須選擇 ${vc} 個空車位`);
        return;
      }
    }
    try {
      await updateBookingStatus(
        booking._id,
        status,
        statusReason,
        status === 'checked-in' ? checkInSlots : undefined
      );
      toast.success('狀態更新成功');
      loadTodayData();
      setIsStatusDialogOpen(false);
      setBookingInProcess(null);
      setCheckInSlots([]);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '狀態更新失敗';
      toast.error(msg);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentList.map((b) => b._id)));
    }
  };

  const toggleSelectBooking = (id: string) => {
    setSelectedIds((prev) => {
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
      ) as { success?: string[]; failed?: string[] };
      const successCount = result?.success?.length ?? 0;
      const failedCount = result?.failed?.length ?? 0;
      if (successCount > 0) toast.success(`已更新 ${successCount} 筆預約狀態`);
      if (failedCount > 0) toast.error(`${failedCount} 筆更新失敗`);
      setSelectedIds(new Set());
      setIsBulkStatusDialogOpen(false);
      loadTodayData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '批次更新失敗';
      toast.error(msg);
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const handleRevertStatus = (booking: TodayBooking) => {
    let newStatus = '';
    if (booking.status === 'checked-in') newStatus = 'confirmed';
    else if (booking.status === 'checked-out') newStatus = 'checked-in';
    else if (booking.status === 'cancelled') newStatus = 'confirmed';
    if (newStatus) openStatusDialog(booking, newStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  const printInvoice = (booking: TodayBooking) => {
    const w = window.open('', '_blank', 'width=480,height=720');
    if (!w) {
      toast.error('請允許彈出視窗以列印單據');
      return;
    }
    const amount = formatCurrency(booking.finalAmount);
    const parkingLabel = [booking.parkingType?.name, booking.parkingType?.code].filter(Boolean).join(' ');
    const title = '停車預約單據';
    const statusLabel =
      booking.status === 'pending'
        ? '待確認'
        : booking.status === 'confirmed'
          ? '預約成功'
          : booking.status === 'checked-in'
            ? '已進入停車場'
            : booking.status === 'checked-out'
              ? '已離開停車場'
              : booking.status === 'cancelled'
                ? '已取消'
                : booking.status;

    w.document.write(`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <title>${title} — ${booking.bookingNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; padding: 24px; max-width: 420px; margin: 0 auto; color: #111; }
    h1 { font-size: 1.25rem; margin: 0 0 8px; text-align: center; }
    .sub { text-align: center; color: #666; font-size: 0.85rem; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { text-align: left; width: 6.5em; color: #444; font-weight: 600; padding: 6px 0; vertical-align: top; }
    td { padding: 6px 0; border-bottom: 1px solid #eee; }
    .amount { font-size: 1.1rem; font-weight: 700; color: #16a34a; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="sub">${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} 列印</div>
  <table>
    <tr><th>預約編號</th><td>${escapeHtml(String(booking.bookingNumber))}</td></tr>
    <tr><th>客戶</th><td>${escapeHtml(String(booking.driverName || ''))}</td></tr>
    <tr><th>電話</th><td>${escapeHtml(String(booking.phone || ''))}</td></tr>
    <tr><th>車牌</th><td>${escapeHtml(String(booking.licensePlate || ''))}</td></tr>
    <tr><th>停車場</th><td>${escapeHtml(parkingLabel || '—')}</td></tr>
    <tr><th>進入</th><td>${escapeHtml(formatDateTime(booking.checkInTime))}</td></tr>
    <tr><th>離開</th><td>${escapeHtml(formatDateTime(booking.checkOutTime))}</td></tr>
    <tr><th>狀態</th><td>${escapeHtml(statusLabel)}</td></tr>
    <tr><th>金額</th><td class="amount">${escapeHtml(amount)}</td></tr>
  </table>
</body>
</html>`);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 250);
  };

  const openEditDialog = (booking: TodayBooking) => {
    setEditingBooking(booking);
    setNewPrice(null);
    setNewPriceError(null);
    setAvailabilityErrorDetail(null);
    setShouldRecalcPrice(false);
    const ptId = (booking.parkingType as any)?._id ?? '';
    setEditForm({
      driverName: booking.driverName ?? '',
      phone: booking.phone ?? '',
      email: (booking as any).email ?? '',
      licensePlate: booking.licensePlate ?? '',
      parkingTypeId: ptId,
      checkInTime: booking.checkInTime ?? '',
      checkOutTime: booking.checkOutTime ?? '',
      status: booking.status ?? 'confirmed',
      notes: (booking as any).notes ?? '',
      vehicleCount: (booking as any).vehicleCount ?? 1,
      parkingSlotNumbers: Array.isArray((booking as any).parkingSlotNumbers)
        ? ([...(booking as any).parkingSlotNumbers] as number[])
        : [],
    });
  };

  const closeEditDialog = () => {
    setEditingBooking(null);
    setSaving(false);
    setNewPrice(null);
    setNewPriceError(null);
    setAvailabilityErrorDetail(null);
    setShouldRecalcPrice(false);
  };

  // Khi chỉnh sửa: thay đổi bãi / thời gian / số lượng xe → ước tính lại giá mới
  useEffect(() => {
    if (!editingBooking || !editForm.parkingTypeId || !editForm.checkInTime || !editForm.checkOutTime) {
      setNewPrice(null);
      setNewPriceError(null);
      setAvailabilityErrorDetail(null);
      return;
    }
    // Không gọi API khi vừa mở dialog, chỉ khi user đã sửa một trong các field liên quan
    if (!shouldRecalcPrice) {
      return;
    }
    const checkIn = new Date(editForm.checkInTime);
    const checkOut = new Date(editForm.checkOutTime);
    if (checkOut <= checkIn) {
      setNewPrice(null);
      setNewPriceError('離開時間須晚於進入時間');
      setAvailabilityErrorDetail(null);
      return;
    }
    let cancelled = false;
    setNewPriceLoading(true);
    setNewPriceError(null);
    calculatePrice({
      parkingTypeId: editForm.parkingTypeId,
      checkInTime: editForm.checkInTime,
      checkOutTime: editForm.checkOutTime,
      addonServices: [], // phụ dịch vụ giữ nguyên, chỉ preview giá đỗ xe
      discountCode: (editingBooking as any)?.discountCode?.code,
      isVIP: (editingBooking as any)?.isVIP,
      userEmail: (editingBooking as any)?.email,
      vehicleCount: editForm.vehicleCount || 1,
    } as any)
      .then((res: any) => {
        if (cancelled) return;
        if (res?.success && res?.pricing?.finalAmount != null) {
          setNewPrice(res.pricing.finalAmount);
          setNewPriceError(null);
        } else if (res?.pricing?.finalAmount != null) {
          setNewPrice(res.pricing.finalAmount);
          setNewPriceError(res?.message || null);
        } else {
          setNewPrice(null);
          setNewPriceError(res?.message || '無法計算新價格');
        }
        setAvailabilityErrorDetail(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setNewPrice(null);
        setNewPriceError(err?.response?.data?.message || '無法計算新價格');
        setAvailabilityErrorDetail(null);
      })
      .finally(() => {
        if (!cancelled) setNewPriceLoading(false);
      });
    return () => { cancelled = true; };
  }, [editingBooking, editForm.parkingTypeId, editForm.checkInTime, editForm.checkOutTime, editForm.vehicleCount, shouldRecalcPrice]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    const vc = Math.max(1, editForm.vehicleCount || 1);
    if (editForm.status === 'checked-in' && editForm.parkingSlotNumbers.length !== vc) {
      toast.error(`狀態為「已進入停車場」時須選好 ${vc} 個實體車位`);
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        driverName: editForm.driverName,
        phone: editForm.phone,
        email: editForm.email || undefined,
        licensePlate: editForm.licensePlate,
        parkingType: editForm.parkingTypeId || undefined,
        checkInTime: editForm.checkInTime,
        checkOutTime: editForm.checkOutTime,
        status: editForm.status as 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled',
        notes: editForm.notes || undefined,
        vehicleCount: editForm.vehicleCount || 1,
        ...(editForm.status === 'checked-in' && editForm.parkingSlotNumbers.length > 0
          ? { parkingSlotNumbers: editForm.parkingSlotNumbers }
          : {}),
      };

      // Thử tính lại giá mới với vehicleCount mới, nếu thành công thì gửi kèm các field tiền
      try {
        const res: any = await calculatePrice({
          parkingTypeId: editForm.parkingTypeId,
          checkInTime: editForm.checkInTime,
          checkOutTime: editForm.checkOutTime,
          addonServices: [], // TodayOverview không cho chỉnh addon, để backend giữ nguyên chi tiết nếu cần
          discountCode: (editingBooking as any)?.discountCode?.code,
          isVIP: (editingBooking as any)?.isVIP,
          userEmail: (editingBooking as any)?.email,
          vehicleCount: editForm.vehicleCount || 1,
        } as any);
        const pricing = res?.pricing;
        if (pricing && pricing.finalAmount != null) {
          payload.totalAmount = pricing.totalAmount ?? pricing.finalAmount;
          payload.discountAmount = pricing.discountAmount ?? 0;
          payload.finalAmount = pricing.finalAmount;
          if (pricing.autoDiscountAmount != null) {
            payload.autoDiscountAmount = pricing.autoDiscountAmount;
          }
          if (pricing.dailyPrices) {
            payload.dailyPrices = pricing.dailyPrices;
          }
        }
      } catch (err) {
        console.error('Recalculate price failed in TodayOverview:', err);
      }

      await updateBooking(editingBooking._id, payload as Parameters<typeof updateBooking>[1]);
      toast.success('已更新預約資訊');
      closeEditDialog();
      loadTodayData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">沒有資料</h3>
          <p className="text-gray-500">無法載入今日資料。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">今日概覽</h1>
          <p className="text-gray-600 text-sm sm:text-base">今日停車場進出車輛統計</p>
          {debouncedSearch ? (
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              搜尋「{debouncedSearch}」：下方分類數字與列表僅顯示符合的預約
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadTodayData} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Printer className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">列印報告</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards - 5 cards for 5 tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">預計進場車輛</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-amber-600">{counts.entering}</div>
                  <p className="text-xs text-muted-foreground">
                    預約完成，尚未進入停車場
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>今日預計進場車輛總數</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">預期未進場</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{counts.expectedNotEntered}</div>
                  <p className="text-xs text-muted-foreground">
                    已過預計進場時間，尚未進入
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>預期未進場總數</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">已進場車輛</CardTitle>
                  <Car className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{counts.alreadyEntered}</div>
                  <p className="text-xs text-muted-foreground">
                    已進入停車場
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>確定已進場車輛總數</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">預計離場車輛</CardTitle>
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{counts.leaving}</div>
                  <p className="text-xs text-muted-foreground">
                    今日將離開停車場
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>今日預計離場車輛總數</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">逾期離場車輛</CardTitle>
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{counts.overdue}</div>
                  <p className="text-xs text-muted-foreground">
                    已逾預約離開日，尚未離開
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>總數</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>今日詳情</CardTitle>
          <CardDescription>
            查看進出停車場車輛的詳細資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="搜尋預約編號、姓名、電話、車牌、停車場…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="搜尋今日預約"
              />
            </div>
            {searchInput ? (
              <Button type="button" variant="ghost" size="sm" className="self-start sm:self-center shrink-0" onClick={() => setSearchInput('')}>
                清除
              </Button>
            ) : null}
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === 'entering' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('entering')}
                    className="text-xs sm:text-sm"
                  >
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    預計進場車輛 ({counts.entering})
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>今日預計進場車輛總數</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === 'alreadyEntered' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('alreadyEntered')}
                    className="text-xs sm:text-sm"
                  >
                    <Car className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    已進場車輛 ({counts.alreadyEntered})
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>確定已進場車輛總數</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === 'leaving' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('leaving')}
                    className="text-xs sm:text-sm"
                  >
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    預計離場車輛 ({counts.leaving})
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>今日預計離場車輛總數</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === 'overdue' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('overdue')}
                    className="text-xs sm:text-sm"
                  >
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    逾期離場車輛 ({counts.overdue})
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>總數</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === 'expectedNotEntered' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('expectedNotEntered')}
                    className="text-xs sm:text-sm"
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    預期未進場 ({counts.expectedNotEntered})
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>預期未進場總數</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 flex flex-wrap items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                已選 {selectedIds.size} 筆
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())} className="border-blue-300">
                取消選擇
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">批次變更狀態：</span>
              <Button
                size="sm"
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => toast.error('入場需逐筆選擇車位，無法批次操作')}
              >
                已進入停車場
              </Button>
              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openBulkStatusDialog('checked-out')}>
                已離開停車場
              </Button>
              <Button size="sm" variant="destructive" onClick={() => openBulkStatusDialog('cancelled')}>
                已取消
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 no-print">
                  <Checkbox
                    checked={currentList.length > 0 && selectedIds.size === currentList.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="全選本頁"
                  />
                </TableHead>
                <TableHead>預約編號</TableHead>
                <TableHead>客戶</TableHead>
                <TableHead>車牌號碼</TableHead>
                <TableHead>停車場</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>金額</TableHead>
                <TableHead className="no-print">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentList.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell className="w-10 no-print">
                    <Checkbox
                      checked={selectedIds.has(booking._id)}
                      onCheckedChange={() => toggleSelectBooking(booking._id)}
                      aria-label={`選擇 ${booking.driverName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.bookingNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{booking.driverName}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {booking.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.licensePlate}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.parkingType?.name || '未知停車場'}</div>
                      <div className="text-sm text-gray-600">{booking.parkingType?.code || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        <span className="font-medium">進入:</span> {formatDateTime(booking.checkInTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">離開:</span> {formatDateTime(booking.checkOutTime)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-green-600">
                      {formatCurrency(booking.finalAmount)}
                    </div>
                  </TableCell>
                  <TableCell className="no-print">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setViewingBooking(booking)} title="查看詳情">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(booking)} title="編輯">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printInvoice(booking)} title="列印單據">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <>
                          <Button size="sm" variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => openStatusDialog(booking, 'checked-in')}>
                            已進入
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openStatusDialog(booking, 'cancelled')}>
                            取消
                          </Button>
                        </>
                      )}
                      {booking.status === 'checked-in' && (
                        <>
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openStatusDialog(booking, 'checked-out')}>
                            已離開
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRevertStatus(booking)} title="返回上一狀態">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === 'checked-out' && (
                        <Button size="sm" variant="outline" onClick={() => handleRevertStatus(booking)} title="返回上一狀態">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {currentList.length === 0 && (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {activeTab === 'entering' && '尚無預計進場車輛'}
                {activeTab === 'alreadyEntered' && '尚無已進場車輛'}
                {activeTab === 'leaving' && '今日尚無預計離場車輛'}
                {activeTab === 'overdue' && '尚無逾期離場車輛'}
                {activeTab === 'expectedNotEntered' && '尚無預期未進場車輛'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'entering' && '今日預計進場車輛總數，預約完成但尚未進入停車場的車輛會顯示於此。'}
                {activeTab === 'alreadyEntered' && '確定已進場車輛總數，已進入停車場的車輛會顯示於此。'}
                {activeTab === 'leaving' && '今日預計離場車輛總數，今日將離開的車輛會顯示於此。'}
                {activeTab === 'overdue' && '逾期離場車輛總數，已逾預約離開日但尚未離開的車輛會顯示於此。'}
              </p>
              {debouncedSearch ? (
                <p className="text-sm text-muted-foreground mt-2">嘗試修改搜尋關鍵字，或按「清除」以顯示全部。</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View details dialog */}
      <Dialog open={!!viewingBooking} onOpenChange={(open) => !open && setViewingBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>預約詳情</DialogTitle>
            <DialogDescription>{viewingBooking && `預約編號: ${viewingBooking.bookingNumber}`}</DialogDescription>
          </DialogHeader>
          {viewingBooking && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">客戶:</span> {viewingBooking.driverName}</div>
              <div><span className="font-medium">電話:</span> {viewingBooking.phone}</div>
              <div><span className="font-medium">車牌:</span> {viewingBooking.licensePlate}</div>
              <div><span className="font-medium">停車場:</span> {viewingBooking.parkingType?.name}</div>
              <div><span className="font-medium">進入:</span> {formatDateTime(viewingBooking.checkInTime)}</div>
              <div><span className="font-medium">離開:</span> {formatDateTime(viewingBooking.checkOutTime)}</div>
              <div><span className="font-medium">狀態:</span> {getStatusBadge(viewingBooking.status)}</div>
              <div><span className="font-medium">金額:</span> {formatCurrency(viewingBooking.finalAmount)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single status change confirm */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認變更狀態</AlertDialogTitle>
            <AlertDialogDescription>
              {bookingInProcess && (
                <>將預約 {bookingInProcess.booking.bookingNumber} 的狀態變更為「
                  {STATUS_OPTIONS.find((o) => o.value === bookingInProcess.status)?.label ?? bookingInProcess.status}」？
                  {bookingInProcess.status === 'cancelled' && (
                    <div className="mt-2">
                      <Label>取消原因（選填）</Label>
                      <Textarea
                        className="mt-1"
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        placeholder="輸入原因..."
                        rows={2}
                      />
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bookingInProcess?.status === 'checked-in' && (() => {
            const b = bookingInProcess.booking;
            const ptId = (b.parkingType as { _id?: string })?._id ?? '';
            return (
              <div className="space-y-2 px-1 pb-2 border-t pt-3">
                <Label>選擇實體車位（必選）</Label>
                {ptId ? (
                  <ParkingSlotPicker
                    parkingTypeId={ptId}
                    excludeBookingId={b._id}
                    vehicleCount={Math.max(1, (b as { vehicleCount?: number }).vehicleCount || 1)}
                    value={checkInSlots}
                    onChange={setCheckInSlots}
                  />
                ) : (
                  <p className="text-sm text-destructive">找不到停車場，無法選位</p>
                )}
              </div>
            );
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <Button onClick={confirmStatusChange}>確認</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk status change confirm */}
      <AlertDialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批次變更狀態</AlertDialogTitle>
            <AlertDialogDescription>
              將已選取的 {selectedIds.size} 筆預約狀態變更為「{STATUS_OPTIONS.find((o) => o.value === bulkStatusTarget)?.label ?? bulkStatusTarget}」？
              {bulkStatusTarget === 'cancelled' && (
                <div className="mt-2">
                  <Label>取消原因（必填）</Label>
                  <Textarea
                    className="mt-1"
                    value={bulkStatusReason}
                    onChange={(e) => setBulkStatusReason(e.target.value)}
                    placeholder="請輸入取消原因"
                    rows={2}
                  />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <Button
              onClick={confirmBulkStatusChange}
              disabled={bulkStatusLoading || (bulkStatusTarget === 'cancelled' && !bulkStatusReason.trim())}
            >
              {bulkStatusLoading ? '處理中...' : '確認'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Booking Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯預約</DialogTitle>
            <DialogDescription>
              {editingBooking && `預約編號: ${editingBooking.bookingNumber}`}
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
                onValueChange={(value) => {
                  setEditForm((f) => ({ ...f, parkingTypeId: value }));
                  setShouldRecalcPrice(true);
                }}
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
                  onChange={(value) => {
                    setEditForm((f) => ({ ...f, checkInTime: value }));
                    setShouldRecalcPrice(true);
                  }}
                  placeholder="年/月/日 00:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-checkOutTime">離開時間 *</Label>
                <DateInput
                  id="edit-checkOutTime"
                  type="datetime-local"
                  value={editForm.checkOutTime}
                  onChange={(value) => {
                    setEditForm((f) => ({ ...f, checkOutTime: value }));
                    setShouldRecalcPrice(true);
                  }}
                  placeholder="年/月/日 00:00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vehicleCount">車輛數量 *</Label>
              <Input
                id="edit-vehicleCount"
                type="number"
                min={1}
                value={editForm.vehicleCount}
                onChange={(e) => {
                  setEditForm((f) => ({
                    ...f,
                    vehicleCount: Math.max(1, Number(e.target.value) || 1),
                    parkingSlotNumbers: [],
                  }));
                  setShouldRecalcPrice(true);
                }}
                placeholder="車輛數量"
              />
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
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.status === 'checked-in' && editForm.parkingTypeId && editingBooking && (
              <div className="space-y-2 rounded-md border p-3 bg-amber-50/50">
                <Label>實體車位（{editForm.vehicleCount || 1} 格 · 在場用）</Label>
                <ParkingSlotPicker
                  key={`${editingBooking._id}-${editForm.parkingTypeId}`}
                  parkingTypeId={editForm.parkingTypeId}
                  excludeBookingId={editingBooking._id}
                  vehicleCount={Math.max(1, editForm.vehicleCount || 1)}
                  value={editForm.parkingSlotNumbers}
                  onChange={(parkingSlotNumbers) => setEditForm((f) => ({ ...f, parkingSlotNumbers }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">備註</Label>
              <Input
                id="edit-notes"
                value={editForm.notes ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="備註"
              />
            </div>
            {/* 價格比較：變更停車場或日期時顯示原價 vs 新價 */}
            {editingBooking && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">價格比較</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">原價（目前預約）</div>
                    <div className="font-semibold text-base">{formatCurrency(editingBooking.finalAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">新價（變更後）</div>
                    {newPriceLoading ? (
                      <div className="text-muted-foreground">計算中...</div>
                    ) : newPrice != null ? (
                      <div className={`font-semibold text-base ${newPrice !== editingBooking.finalAmount ? 'text-amber-600' : ''}`}>
                        {formatCurrency(newPrice)}
                        {newPrice !== editingBooking.finalAmount && (
                          <span className="ml-1 text-xs font-normal">
                            ({newPrice > editingBooking.finalAmount ? '+' : ''}{formatCurrency(newPrice - editingBooking.finalAmount)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-muted-foreground text-xs">{newPriceError || '變更停車場或日期後顯示'}</div>
                        {availabilityErrorDetail && (
                          <div className="mt-2 text-xs text-red-600 space-y-1">
                            <p><span className="font-medium">您選擇的日期：</span>{availabilityErrorDetail.selectedRange.from} ～ {availabilityErrorDetail.selectedRange.to}</p>
                            {availabilityErrorDetail.fullDays.length > 0 && (
                              <p><span className="font-medium">已滿的日期：</span>{availabilityErrorDetail.fullDays.map((d) => formatDateWithWeekday(d)).join('、')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog} disabled={saving}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '儲存中...' : '儲存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminTodayOverview; 