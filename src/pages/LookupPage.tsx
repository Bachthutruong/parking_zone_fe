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
      toast.error('Vui lòng nhập thông tin tìm kiếm');
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
        toast('Không tìm thấy đặt chỗ nào', { icon: 'ℹ️' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi tìm kiếm');
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
      toast.error(error.message || 'Không thể tải chi tiết đặt chỗ');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Đã xác nhận', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'checked-in': { label: 'Đã vào bãi', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'checked-out': { label: 'Đã rời bãi', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

  const getParkingTypeIcon = (type: string) => {
    switch (type) {
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tra cứu đặt chỗ</h1>
        <p className="text-gray-600">Nhập số điện thoại hoặc biển số xe để tra cứu đặt chỗ</p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Tìm kiếm đặt chỗ</span>
          </CardTitle>
          <CardDescription>
            Chọn phương thức tìm kiếm và nhập thông tin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex space-x-4">
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
                  <span>Số điện thoại</span>
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
                  <span>Biển số xe</span>
                </Label>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="searchValue">
                  {searchType === 'phone' ? 'Số điện thoại' : 'Biển số xe'}
                </Label>
                <Input
                  id="searchValue"
                  placeholder={searchType === 'phone' ? 'Nhập số điện thoại' : 'Nhập biển số xe'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="px-4"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Bộ lọc
                </Button>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !searchValue.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Tìm kiếm
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Search Filters */}
            {showAdvancedSearch && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Bộ lọc nâng cao</h4>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Trạng thái</Label>
                    <select
                      id="status"
                      value={advancedFilters.status}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="pending">Chờ xác nhận</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="checked-in">Đã vào bãi</option>
                      <option value="checked-out">Đã rời bãi</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateFrom">Từ ngày</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={advancedFilters.dateFrom}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateTo">Đến ngày</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={advancedFilters.dateTo}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="minAmount">Số tiền tối thiểu</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      placeholder="0"
                      value={advancedFilters.minAmount}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxAmount">Số tiền tối đa</Label>
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
            <CardTitle>Kết quả tìm kiếm</CardTitle>
            <CardDescription>
              Tìm thấy {filteredBookings.length} đặt chỗ {filteredBookings.length !== bookings.length && `(trong tổng số ${bookings.length})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{booking.driverName}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
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
                              <span className="text-lg">{getParkingTypeIcon(booking.parkingType.type || 'indoor')}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Vào: {formatDateTime(booking.checkInTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>Ra: {formatDateTime(booking.checkOutTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Tổng tiền: {formatCurrency(booking.finalAmount)}</span>
                            </div>
                            {booking.discountAmount > 0 && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <span className="text-xs">🎫 Voucher: -{formatCurrency(booking.discountAmount)}</span>
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
                            <div className="text-sm font-medium text-gray-700 mb-1">Dịch vụ bổ sung:</div>
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
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Chi tiết
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
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Không tìm thấy đặt chỗ</h3>
            <p className="text-gray-500">
              Không có đặt chỗ nào với {searchType === 'phone' ? 'số điện thoại' : 'biển số xe'} này.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt chỗ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đặt chỗ
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Thông tin khách hàng
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><strong>Tên:</strong> {selectedBooking.driverName}</div>
                    <div><strong>Điện thoại:</strong> {selectedBooking.phone}</div>
                    <div><strong>Email:</strong> {selectedBooking.email}</div>
                    <div><strong>VIP Status:</strong> {selectedBooking.isVIP ? '👑 VIP Member' : 'Khách hàng thường'}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Biển số:</strong> {selectedBooking.licensePlate}</div>
                    <div><strong>Hành khách:</strong> {selectedBooking.passengerCount} người</div>
                    <div><strong>Hành lý:</strong> {selectedBooking.luggageCount} kiện</div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Thông tin đặt chỗ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><strong>Bãi đậu:</strong> {selectedBooking.parkingType.name}</div>
                                            <div><strong>Loại:</strong> {getParkingTypeIcon(selectedBooking.parkingType.type || 'indoor')} {selectedBooking.parkingType.type || 'indoor'}</div>
                    <div><strong>Trạng thái:</strong> {getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Vào:</strong> {formatDateTime(selectedBooking.checkInTime)}</div>
                    <div><strong>Ra:</strong> {formatDateTime(selectedBooking.checkOutTime)}</div>
                    <div><strong>VIP:</strong> {selectedBooking.isVIP ? 'Có' : 'Không'}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedBooking.estimatedArrivalTime || selectedBooking.flightNumber || selectedBooking.notes) && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Thông tin bổ sung
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.estimatedArrivalTime && (
                      <div><strong>Thời gian dự kiến đến:</strong> {formatDateTime(selectedBooking.estimatedArrivalTime)}</div>
                    )}
                    {selectedBooking.flightNumber && (
                      <div><strong>Số chuyến bay:</strong> {selectedBooking.flightNumber}</div>
                    )}
                    {selectedBooking.notes && (
                      <div><strong>Ghi chú:</strong> {selectedBooking.notes}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Addon Services */}
              {selectedBooking.addonServices && selectedBooking.addonServices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Dịch vụ bổ sung
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
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="text-lg mr-2">💰</span>
                  Thông tin thanh toán
                </h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Tổng tiền gốc:</strong> {formatCurrency(selectedBooking.totalAmount)}</div>
                  
                  {/* Voucher Discount */}
                  {selectedBooking.discountAmount > 0 && (
                    <div className="bg-green-50 p-2 rounded">
                      <div><strong>🎫 Voucher Discount:</strong> -{formatCurrency(selectedBooking.discountAmount)}</div>
                    </div>
                  )}
                  
                  {/* VIP Discount */}
                  {selectedBooking.vipDiscount && selectedBooking.vipDiscount > 0 && (
                    <div className="bg-blue-50 p-2 rounded">
                      <div><strong>👑 VIP Discount:</strong> -{formatCurrency(selectedBooking.vipDiscount)}</div>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <div><strong>Tổng giảm giá:</strong> -{formatCurrency((selectedBooking.discountAmount || 0) + (selectedBooking.vipDiscount || 0))}</div>
                    <div><strong>Thanh toán:</strong> {formatCurrency(selectedBooking.finalAmount)}</div>
                  </div>
                  
                  <div><strong>Phương thức:</strong> {selectedBooking.paymentMethod}</div>
                  <div><strong>Trạng thái thanh toán:</strong> {selectedBooking.paymentStatus}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LookupPage; 