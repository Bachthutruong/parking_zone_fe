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
  Info
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

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Vui lòng nhập thông tin tìm kiếm');
      return;
    }

    try {
      setLoading(true);
      const params = searchType === 'phone' 
        ? { phone: searchValue.trim() }
        : { licensePlate: searchValue.trim().toUpperCase() };
      
      const result = await getBookingBySearch(params);
      setBookings(result.bookings || []);
      
      if (result.bookings?.length === 0) {
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
      setSelectedBooking(result.booking);
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
              <div className="flex items-end">
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
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả tìm kiếm</CardTitle>
            <CardDescription>
              Tìm thấy {bookings.length} đặt chỗ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
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
                              <span>{booking.parkingLot.name}</span>
                              <span className="text-lg">{getParkingTypeIcon(booking.parkingLot.type)}</span>
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
                          </div>
                        </div>

                        {booking.addonServices.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-gray-700 mb-1">Dịch vụ bổ sung:</div>
                            <div className="flex flex-wrap gap-1">
                              {booking.addonServices.map((addon, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {addon.icon} {addon.name}
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
                    <div><strong>Bãi đậu:</strong> {selectedBooking.parkingLot.name}</div>
                    <div><strong>Loại:</strong> {getParkingTypeIcon(selectedBooking.parkingLot.type)} {selectedBooking.parkingLot.type}</div>
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
              {selectedBooking.addonServices.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Dịch vụ bổ sung
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.addonServices.map((addon, index) => (
                      <Badge key={index} variant="outline">
                        {addon.icon} {addon.name} - {formatCurrency(addon.price)}
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
                  <div><strong>Tổng tiền:</strong> {formatCurrency(selectedBooking.totalAmount)}</div>
                  {selectedBooking.discountAmount > 0 && (
                    <div><strong>Giảm giá:</strong> -{formatCurrency(selectedBooking.discountAmount)}</div>
                  )}
                  <div><strong>Thanh toán:</strong> {formatCurrency(selectedBooking.finalAmount)}</div>
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