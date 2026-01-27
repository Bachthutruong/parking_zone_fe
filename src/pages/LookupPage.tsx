import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Phone, 
  Car, 
  Calendar, 
  Clock, 
  MapPin,
  User,
  // Mail,
  Package,
  // Users,
  // Plane,
  // CheckCircle,
  // XCircle,
  AlertCircle,
  Info,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getBookingBySearch, getBookingDetails } from '@/services/booking';
import type { Booking } from '@/types';

const LookupPage: React.FC = () => {
  const [searchType, setSearchType] = useState<'phone' | 'licensePlate'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('請輸入搜尋資訊');
      return;
    }

    try {
      setLoading(true);
      const phone = searchType === 'phone' ? searchValue.trim() : undefined;
      const licensePlate = searchType === 'licensePlate' ? searchValue.trim().toUpperCase() : undefined;
      
      const result = await getBookingBySearch(phone, licensePlate);
      setBookings(result || []);
      setFilteredBookings(result || []);
      
      if (result?.length === 0) {
        toast('找不到任何預約', { icon: 'ℹ️' });
      }
    } catch (error: any) {
      // Handle authentication errors gracefully for public lookup
      if (error.response?.status === 401) {
        toast.error('請登入以查詢預約');
      } else {
        toast.error(error.message || '搜尋時發生錯誤');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bookingId: string) => {
    try {
      const result = await getBookingDetails(bookingId);
      setSelectedBooking(result);
      setShowDetailsDialog(true);
    } catch (error: any) {
      // Handle authentication errors gracefully for public lookup
      if (error.response?.status === 401) {
        toast.error('請登入以查看預約詳情');
      } else {
        toast.error(error.message || '無法載入預約詳情');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '等待確認', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '預約成功', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'checked-in': { label: '已進入停車場', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'checked-out': { label: '已離開停車場', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getParkingTypeIcon = (parkingType: any) => {
    // Use icon from database if available, otherwise fallback to type-based icons
    if (parkingType.icon) {
      return parkingType.icon;
    }
    
    // Fallback to type-based icons
    switch (parkingType.type || parkingType) {
      case 'indoor': return '🏢';
      case 'outdoor': return '🌤';
      case 'disabled': return '♿️';
      default: return '🚗';
    }
  };

  // Apply filters to bookings
  const applyFilters = () => {
    let filtered = [...bookings];

    if (advancedFilters.status) {
      filtered = filtered.filter(booking => booking.status === advancedFilters.status);
    }

    if (advancedFilters.dateFrom) {
      const fromDate = new Date(advancedFilters.dateFrom);
      filtered = filtered.filter(booking => new Date(booking.checkInTime) >= fromDate);
    }

    if (advancedFilters.dateTo) {
      const toDate = new Date(advancedFilters.dateTo);
      filtered = filtered.filter(booking => new Date(booking.checkInTime) <= toDate);
    }

    if (advancedFilters.minAmount) {
      const minAmount = parseFloat(advancedFilters.minAmount);
      filtered = filtered.filter(booking => booking.finalAmount >= minAmount);
    }

    if (advancedFilters.maxAmount) {
      const maxAmount = parseFloat(advancedFilters.maxAmount);
      filtered = filtered.filter(booking => booking.finalAmount <= maxAmount);
    }

    setFilteredBookings(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setAdvancedFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
    setFilteredBookings(bookings);
  };

  // Apply filters when filters change
  React.useEffect(() => {
    applyFilters();
  }, [advancedFilters, bookings]);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">查詢預約</h1>
        <p className="text-gray-600 text-sm sm:text-base">請輸入電話號碼或車牌號碼以查詢預約</p>
      </div>

      {/* Search Form */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>查詢預約</span>
          </CardTitle>
          <CardDescription className="text-sm">
            選擇搜索方法並輸入信息
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="phone"
                  name="searchType"
                  value="phone"
                  checked={searchType === 'phone'}
                  onChange={(e) => setSearchType(e.target.value as 'phone' | 'licensePlate')}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="phone" className="flex items-center space-x-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  <span>電話號碼</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="licensePlate"
                  name="searchType"
                  value="licensePlate"
                  checked={searchType === 'licensePlate'}
                  onChange={(e) => setSearchType(e.target.value as 'phone' | 'licensePlate')}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="licensePlate" className="flex items-center space-x-2 cursor-pointer">
                  <Car className="h-4 w-4" />
                  <span>車牌號碼</span>
                </Label>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="searchValue" className="text-sm">
                  {searchType === 'phone' ? '電話號碼' : '車牌號碼'}
                </Label>
                <Input
                  id="searchValue"
                  placeholder={searchType === 'phone' ? '請輸入電話號碼' : '請輸入車牌號碼'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="px-3 sm:px-4 text-xs sm:text-sm"
                >
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">過濾器</span>
                </Button>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !searchValue.trim()}
                  className="px-4 sm:px-6 flex-1 sm:flex-initial"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">搜索</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Search Filters */}
            {showAdvancedSearch && (
              <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700 text-sm sm:text-base">高級過濾器</h4>
                  <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs sm:text-sm">
                    <X className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">清除過濾器</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="status">狀態</Label>  
                    <select
                      id="status"
                      value={advancedFilters.status}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">所有狀態</option>
                      <option value="pending">等待確認</option>
                      <option value="confirmed">預約成功</option>
                      <option value="checked-in">已進入停車場</option>
                      <option value="checked-out">已離開停車場</option>
                      <option value="cancelled">已取消</option> 
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateFrom">從日期</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={advancedFilters.dateFrom}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateTo">到日期</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={advancedFilters.dateTo}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="minAmount">最小金額</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      placeholder="0"
                      value={advancedFilters.minAmount}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxAmount">最大金額</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      placeholder="1000000"
                      value={advancedFilters.maxAmount}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">搜索結果</CardTitle>
            <CardDescription className="text-sm">
              找到 {filteredBookings.length} 預約 {filteredBookings.length !== bookings.length && `(總共 ${bookings.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm sm:text-base">{booking.driverName}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{booking.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4" />
                              <span>{booking.licensePlate}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.parkingType.name}</span>
                              <span className="text-lg">{getParkingTypeIcon(booking.parkingType)}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>進入停車場: {formatDateTime(booking.checkInTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>離開停車場: {formatDateTime(booking.checkOutTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">總金額: {formatCurrency(booking.finalAmount)}</span>
                            </div>
                            {booking.discountAmount > 0 && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <span className="text-xs">🎫 折扣: -{formatCurrency(booking.discountAmount)}</span>
                              </div>
                            )}
                            {booking.vipDiscount && booking.vipDiscount > 0 && (
                              <div className="flex items-center space-x-2 text-blue-600">
                                <span className="text-xs">👑 VIP: -{formatCurrency(booking.vipDiscount)}</span> 
                              </div>
                            )}
                          </div>
                        </div>

                        {booking.addonServices && booking.addonServices.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-gray-700 mb-1">附加服務:</div>
                            <div className="flex flex-wrap gap-1">
                              {booking.addonServices.map((addon, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {addon.service?.icon || addon.icon || '🔧'} {addon.service?.name || addon.name || 'Unknown Service'} - {formatCurrency(addon.service?.price || addon.price || 0)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(booking._id)}
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        詳細信息
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {bookings.length === 0 && !loading && searchValue && (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">找不到預約</h3>
            <p className="text-gray-500 text-sm sm:text-base">
              找不到任何預約與 {searchType === 'phone' ? '電話號碼' : '車牌號碼'} 相關。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">預約詳細信息</DialogTitle>
            <DialogDescription className="text-sm">
              預約詳細信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  客戶信息
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="space-y-2">
                    <div><strong>姓名:</strong> {selectedBooking.driverName}</div>
                    <div><strong>電話號碼:</strong> {selectedBooking.phone}</div>
                    <div><strong>電子郵件:</strong> {selectedBooking.email}</div>
                    <div><strong>VIP 狀態:</strong> {selectedBooking.isVIP ? '👑 VIP 會員' : '普通客戶'}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>車牌號碼:</strong> {selectedBooking.licensePlate}</div>
                    <div><strong>乘客:</strong> {selectedBooking.passengerCount} 人</div>
                    <div><strong>行李:</strong> {selectedBooking.luggageCount} 件</div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  預約信息
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="space-y-2">
                    <div><strong>停車場:</strong> {selectedBooking.parkingType.name}</div>
                    <div><strong>類型:</strong> {getParkingTypeIcon(selectedBooking.parkingType)} {selectedBooking.parkingType.type || 'indoor'}</div>
                    <div><strong>狀態:</strong> {getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>進入停車場:</strong> {formatDateTime(selectedBooking.checkInTime)}</div>
                    <div><strong>離開停車場:</strong> {formatDateTime(selectedBooking.checkOutTime)}</div>
                    <div><strong>VIP:</strong> {selectedBooking.isVIP ? '是' : '否'}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedBooking.estimatedArrivalTime || selectedBooking.flightNumber || selectedBooking.notes) && (
                <div>
                  <h4 className="font-semibold mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    附加信息
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    {selectedBooking.estimatedArrivalTime && (
                      <div><strong>預計到達時間:</strong> {formatDateTime(selectedBooking.estimatedArrivalTime)}</div>
                    )}
                    {selectedBooking.flightNumber && (
                      <div><strong>航班號:</strong> {selectedBooking.flightNumber}</div>
                    )}
                    {selectedBooking.notes && (
                      <div><strong>備註:</strong> {selectedBooking.notes}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Addon Services */}
              {selectedBooking.addonServices && selectedBooking.addonServices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    附加服務
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.addonServices.map((addon, index) => (
                      <Badge key={index} variant="outline">
                        {addon.service?.icon || addon.icon || '🔧'} {addon.service?.name || addon.name || 'Unknown Service'} - {formatCurrency(addon.service?.price || addon.price || 0)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                  <span className="text-base sm:text-lg mr-2">💰</span>
                  付款信息
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div><strong>總金額:</strong> {formatCurrency(selectedBooking.totalAmount)}</div>
                  
                  {/* Voucher Discount */}
                  {selectedBooking.discountAmount > 0 && (
                    <div className="bg-green-50 p-2 rounded">
                      <div><strong>🎫 折扣:</strong> -{formatCurrency(selectedBooking.discountAmount)}</div>
                    </div>
                  )}
                  
                  {/* VIP Discount */}
                  {selectedBooking.vipDiscount && selectedBooking.vipDiscount > 0 && (
                    <div className="bg-blue-50 p-2 rounded">
                      <div><strong>👑 VIP 折扣:</strong> -{formatCurrency(selectedBooking.vipDiscount)}</div>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <div><strong>總折扣:</strong> -{formatCurrency((selectedBooking.discountAmount || 0) + (selectedBooking.vipDiscount || 0))}</div>
                    <div><strong>付款:</strong> {formatCurrency(selectedBooking.finalAmount)}</div>
                  </div>
                  
                  <div><strong>付款方式:</strong> {selectedBooking.paymentMethod}</div>
                  <div><strong>付款狀態:</strong> {selectedBooking.paymentStatus}</div>
                </div>
              </div>
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

export default LookupPage; 