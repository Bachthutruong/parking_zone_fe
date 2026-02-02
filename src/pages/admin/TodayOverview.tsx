import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Car,
  Clock,
  Pencil,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTodayBookings, updateBooking, getAllParkingTypes } from '@/services/admin';
import { checkAvailability } from '@/services/booking';
import { formatDateTime, formatDateWithWeekday } from '@/lib/dateUtils';
import DateInput from '@/components/ui/date-input';

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
  summary: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalOverdue: number;
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
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待確認' },
  { value: 'confirmed', label: '預約成功' },
  { value: 'checked-in', label: '已進入停車場' },
  { value: 'checked-out', label: '已離開停車場' },
  { value: 'cancelled', label: '已取消' },
] as const;

const AdminTodayOverview: React.FC = () => {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checkins' | 'checkouts' | 'overdue'>('checkins');
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

  useEffect(() => {
    loadTodayData();
  }, []);

  useEffect(() => {
    getAllParkingTypes()
      .then((res) => setParkingTypes(res.parkingTypes ?? []))
      .catch(() => setParkingTypes([]));
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const result = await getTodayBookings();
      setData(result);
    } catch (error: any) {
      console.error('Error loading today data:', error);
      toast.error('無法載入今日資料');
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />預約成功</Badge>;
      case 'checked-in':
        return <Badge variant="secondary"><Car className="h-3 w-3 mr-1" />已進入停車場</Badge>;
      case 'checked-out':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />已離開停車場</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const openEditDialog = (booking: TodayBooking) => {
    setEditingBooking(booking);
    setNewPrice(null);
    setNewPriceError(null);
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
    });
  };

  const closeEditDialog = () => {
    setEditingBooking(null);
    setSaving(false);
    setNewPrice(null);
    setNewPriceError(null);
    setAvailabilityErrorDetail(null);
  };

  // When parking or dates change, fetch new price for comparison
  useEffect(() => {
    if (!editingBooking || !editForm.parkingTypeId || !editForm.checkInTime || !editForm.checkOutTime) {
      setNewPrice(null);
      setNewPriceError(null);
      setAvailabilityErrorDetail(null);
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
    checkAvailability({
      parkingTypeId: editForm.parkingTypeId,
      checkInTime: editForm.checkInTime,
      checkOutTime: editForm.checkOutTime,
      excludeBookingId: editingBooking?._id,
      debug: true
    })
      .then((res: any) => {
        if (cancelled) return;
        if (res?.success && res?.pricing?.totalPrice != null) {
          setNewPrice(res.pricing.totalPrice);
          setNewPriceError(null);
          setAvailabilityErrorDetail(null);
        } else {
          setNewPrice(null);
          const msg = res?.message || '無法計算新價格';
          const debugInfo = res?.debug
            ? ` [Debug: 每日佔用=${JSON.stringify(res.debug.perDayOccupancy?.map((d: any) => `${d.day}:${d.occupied}`) || [])}, max=${res.debug.maxOccupied}]`
            : '';
          setNewPriceError(msg + debugInfo);
          if (res?.selectedRange && Array.isArray(res?.fullDays)) {
            setAvailabilityErrorDetail({ selectedRange: res.selectedRange, fullDays: res.fullDays });
          } else {
            setAvailabilityErrorDetail(null);
          }
        }
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
  }, [editingBooking, editForm.parkingTypeId, editForm.checkInTime, editForm.checkOutTime]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      setSaving(true);
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

  const getCurrentData = () => {
    switch (activeTab) {
      case 'checkins':
        return data.checkInsToday;
      case 'checkouts':
        return data.checkOutsToday;
      case 'overdue':
        return data.overdueBookings;
      default:
        return data.checkInsToday;
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">今日概覽</h1>
          <p className="text-gray-600 text-sm sm:text-base">今日停車場進出車輛統計</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">今日進入車輛</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{data.summary.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              今天將進入停車場的車輛
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今天離開車輛</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{data.summary.totalCheckOuts}</div>
            <p className="text-xs text-muted-foreground">
              今天將離開停車場的車輛
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期車輛</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{data.summary.totalOverdue}</div>
            <p className="text-xs text-muted-foreground">
              已超過預約時間的車輛
            </p>
          </CardContent>
        </Card>
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
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <Button
              variant={activeTab === 'checkins' ? 'default' : 'outline'}
              onClick={() => setActiveTab('checkins')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              進入車輛 ({data.summary.totalCheckIns})
            </Button>
            <Button
              variant={activeTab === 'checkouts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('checkouts')}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              離開車輛 ({data.summary.totalCheckOuts})
            </Button>
            <Button
              variant={activeTab === 'overdue' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overdue')}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">逾期</span> ({data.summary.totalOverdue})
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
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
              {getCurrentData().map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>
                    <div className="font-medium">{booking.bookingNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.driverName}</div>
                      <div className="text-sm text-gray-600">{booking.phone}</div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => openEditDialog(booking)}
                      title="編輯此預約"
                    >
                      <Pencil className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">編輯</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {getCurrentData().length === 0 && (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {activeTab === 'checkins' && '今天沒有車輛進入'}
                {activeTab === 'checkouts' && '今天沒有車輛離開'}
                {activeTab === 'overdue' && '沒有逾期車輛'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'checkins' && '今天還沒有車輛預約進入。'}
                {activeTab === 'checkouts' && '今天還沒有車輛預約離開。'}
                {activeTab === 'overdue' && '所有車輛都按時。'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Booking Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  {STATUS_OPTIONS.map((opt) => (
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