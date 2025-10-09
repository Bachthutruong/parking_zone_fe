import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllBookings, updateBookingStatus } from '@/services/admin';
import { formatDateTime } from '@/lib/dateUtils';
import type { Booking } from '@/types';

const BookingsPage: React.FC = () => {
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

  useEffect(() => {
    loadBookings();
  }, [page, filters]);

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

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success('狀態更新成功');
      loadBookings();
    } catch (error: any) {
      console.error('Status update error:', error);
      const errorMessage = error.response?.data?.message || error.message || '狀態更新失敗';
      toast.error(errorMessage);
    }
  };

  const createStatusUpdateHandler = (bookingId: string, newStatus: string) => {
    return () => handleStatusUpdate(bookingId, newStatus);
  };

  const printBooking = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>預約詳細資訊</h1>
          <p>預約編號: ${booking._id}</p>
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
              <span class="label">乘客:</span> ${booking.passengerCount} 人
            </div>
            <div class="info-item">
              <span class="label">行李:</span> ${booking.luggageCount} 件
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
              <span class="label">進入時間:</span> ${formatDateTime(booking.checkInTime)}
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
          <h3>付款資訊</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">總金額:</span> ${booking.totalAmount.toLocaleString('zh-TW')} TWD
            </div>
            ${booking.discountAmount > 0 ? `
            <div class="info-item">
              <span class="label">折扣:</span> -${booking.discountAmount.toLocaleString('zh-TW')} TWD
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

  // Ensure filters.status is always a valid value
  const currentStatus = filters.status || 'all';

  // Don't render until state is ready
  if (loading && bookings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">預約管理</h1>
        <p className="text-gray-600">管理系統中的所有預約</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>篩選</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>預約清單</CardTitle>
          <CardDescription>
            共 {total} 筆預約 • 第 {page} 頁，共 {totalPages} 頁
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
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
                          <div className="font-medium">{booking.parkingType.name}</div>
                          <div className="text-sm text-gray-600">
                            {booking.parkingType.icon || '🏢'} {(booking.parkingType.type || 'indoor') === 'indoor' ? '室內' : 
                             (booking.parkingType.type || 'indoor') === 'outdoor' ? '戶外' : '無障礙'}
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
          )}
        </CardContent>
      </Card>

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
                    <div><strong>乘客:</strong> {selectedBooking.passengerCount} 人</div>
                    <div><strong>行李:</strong> {selectedBooking.luggageCount} 件</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">預約資訊</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>停車場:</strong> {selectedBooking.parkingType.name}</div>
                    <div><strong>類型:</strong> {selectedBooking.parkingType.type || 'indoor'}</div>
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
                  {selectedBooking.discountAmount > 0 && (
                    <div><strong>折扣:</strong> -{formatCurrency(selectedBooking.discountAmount)}</div>
                  )}
                  <div><strong>應付金額:</strong> {formatCurrency(selectedBooking.finalAmount)}</div>
                  <div><strong>付款方式:</strong> {selectedBooking.paymentMethod}</div>
                  <div><strong>付款狀態:</strong> {selectedBooking.paymentStatus}</div>
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

export default BookingsPage; 