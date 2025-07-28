import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  Phone, 
  Mail, 
  FileText,
  Download,
  Share2,
  Home,
//   ArrowLeft,
  CreditCard,
  Receipt,
  User,
  Car as CarIcon,
  Building,
  Sun,
  Accessibility
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSystemSettings } from '@/services/systemSettings';
import type { SystemSettings } from '@/types';

interface BookingConfirmationData {
  bookingId: string;
  bookingNumber: string;
  parkingType: {
    name: string;
    type: string;
    location?: string;
  };
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  checkInTime: string;
  checkOutTime: string;
  durationDays: number;
  totalAmount: number;
  finalAmount: number;
  addonServices: Array<{
    name: string;
    price: number;
    icon: string;
  }>;
  discountAmount: number;
  vipDiscount?: number;
  isVIP?: boolean;
  paymentMethod: string;
  status: string;
}

const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get booking data from location state
  const bookingData: BookingConfirmationData | null = location.state?.bookingData;

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      const settings = await getSystemSettings();
      setSystemSettings(settings);
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return '0 TWD';
    }
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

//   const formatDateTime = (dateTime: string) => {
//     return new Date(dateTime).toLocaleString('vi-VN', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getParkingTypeIcon = (type: string) => {
    switch (type) {
      case 'indoor':
        return <Building className="h-5 w-5 text-blue-600" />;
      case 'outdoor':
        return <Sun className="h-5 w-5 text-yellow-600" />;
      case 'disabled':
        return <Accessibility className="h-5 w-5 text-green-600" />;
      default:
        return <CarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getParkingTypeLabel = (type: string) => {
    switch (type) {
      case 'indoor':
        return 'Trong nhà';
      case 'outdoor':
        return 'Ngoài trời';
      case 'disabled':
        return 'Khuyết tật';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Đã xác nhận', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'checked-in': { label: 'Đã vào bãi', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'checked-out': { label: 'Đã rời bãi', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    toast.success('Tính năng tải hóa đơn sẽ sớm có mặt!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Xác nhận đặt chỗ đậu xe',
        text: `Đặt chỗ thành công! Mã đặt chỗ: ${bookingData?.bookingNumber}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link vào clipboard!');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNewBooking = () => {
    navigate('/booking');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy thông tin đặt chỗ</h1>
          <p className="text-gray-600 mb-6">Vui lòng quay lại trang đặt chỗ</p>
          <Button onClick={handleBackToHome} className="bg-blue-600 hover:bg-blue-700">
            <Home className="h-4 w-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đặt chỗ thành công!</h1>
          <p className="text-gray-600">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-800">Thông tin đặt chỗ</CardTitle>
                    <CardDescription className="text-gray-600">
                      Mã đặt chỗ: <span className="font-mono font-bold text-blue-600">{bookingData.bookingNumber}</span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(bookingData.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ngày vào bãi</p>
                      <p className="font-semibold">{formatDate(bookingData.checkInTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ngày rời bãi</p>
                      <p className="font-semibold">{formatDate(bookingData.checkOutTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Bãi đậu xe</p>
                    <div className="flex items-center space-x-2">
                      {getParkingTypeIcon(bookingData.parkingType.type || 'indoor')}
                      <p className="font-semibold">{bookingData.parkingType.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {getParkingTypeLabel(bookingData.parkingType.type || 'indoor')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Thông tin khách hàng</span>
                  {bookingData.isVIP && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      👑 VIP Member
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tên tài xế</p>
                      <p className="font-semibold">{bookingData.driverName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Biển số xe</p>
                      <p className="font-semibold font-mono">{bookingData.licensePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Số điện thoại</p>
                      <p className="font-semibold">{bookingData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{bookingData.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span>Chi tiết thanh toán</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí cơ bản ({bookingData.durationDays} ngày)</span>
                    <span className="font-semibold">{formatCurrency(bookingData.totalAmount)}</span>
                  </div>
                  
                  {bookingData.addonServices.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Dịch vụ bổ sung:</p>
                        {bookingData.addonServices.map((service, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{service.name}</span>
                            <span>{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Voucher Discount */}
                  {bookingData.discountAmount > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">🎫 Voucher Discount:</span>
                        </div>
                        <span className="font-semibold text-green-600">-{formatCurrency(bookingData.discountAmount)}</span>
                      </div>
                    </>
                  )}

                  {/* VIP Discount */}
                  {bookingData.vipDiscount && bookingData.vipDiscount > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">👑 VIP Discount:</span>
                        </div>
                        <span className="font-semibold text-blue-600">-{formatCurrency(bookingData.vipDiscount)}</span>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-3 rounded-lg border-2 border-emerald-300">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Tổng tiền gốc:</span>
                        <span className="font-semibold">{formatCurrency(bookingData.totalAmount)}</span>
                      </div>
                      
                      {(bookingData.discountAmount > 0 || (bookingData.vipDiscount && bookingData.vipDiscount > 0)) && (
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-700">Tổng giảm giá:</span>
                          <span className="font-bold text-green-700 text-lg">
                            -{formatCurrency((bookingData.discountAmount || 0) + (bookingData.vipDiscount || 0))}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Tổng thanh toán:</span>
                          <span className="font-bold text-emerald-800 text-xl">
                            {formatCurrency(bookingData.finalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>Phương thức thanh toán: {bookingData.paymentMethod}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadReceipt} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải hóa đơn
                </Button>
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ
                </Button>
                <Button 
                  onClick={handleNewBooking} 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                >
                  <Car className="h-4 w-4 mr-2" />
                  Đặt chỗ mới
                </Button>
                <Button 
                  onClick={handleBackToHome} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Về trang chủ
                </Button>
              </CardContent>
            </Card>

            {/* System Information */}
            {systemSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Thông tin liên hệ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{systemSettings.contactInfo?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{systemSettings.contactInfo?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{systemSettings.contactInfo?.address || 'N/A'}</span>
                  </div>
                  {systemSettings.contactInfo?.website && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <a 
                        href={systemSettings.contactInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {systemSettings.contactInfo.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Important Notes */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-amber-800">Lưu ý quan trọng</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-700 space-y-2">
                <p>• Vui lòng đến đúng giờ đã đặt</p>
                <p>• Mang theo giấy tờ xe và bằng lái</p>
                <p>• Liên hệ ngay nếu có thay đổi</p>
                <p>• Giữ mã đặt chỗ để tra cứu</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage; 