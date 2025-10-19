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
  // Download,
  // Share2,
  Home,
//   ArrowLeft,
  Receipt,
  User,
  Car as CarIcon,
  Building,
  Sun,
  Accessibility
} from 'lucide-react';
// import { toast } from 'react-hot-toast';
import { getSystemSettings } from '@/services/systemSettings';
import { formatDate, formatDateWithWeekday } from '@/lib/dateUtils';
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
  passengerCount?: number;
  departureTerminal?: string;
  returnTerminal?: string;
  dailyPrices?: Array<{
    date: string; // ISO date (YYYY-MM-DD)
    price: number;
    isSpecialPrice?: boolean;
    originalPrice?: number;
    specialPriceReason?: string;
  }>;
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
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  // Date formatting function is now imported from dateUtils

  const buildFallbackDailyPrices = () => {
    if (!bookingData) return [] as Array<{ date: string; price: number }>;
    const result: Array<{ date: string; price: number }> = [];
    const start = new Date(bookingData.checkInTime);
    const end = new Date(bookingData.checkOutTime);
    const days = Math.max(1, bookingData.durationDays || 1);
    const perDay = Math.round((bookingData.totalAmount || 0) / days);
    const cur = new Date(start);
    // iterate dates: include start date, stop before end (same behavior as pricing list)
    while (cur < end) {
      const dateStr = new Date(cur).toISOString().split('T')[0];
      result.push({ date: dateStr, price: perDay });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  };

  const getParkingTypeIcon = (parkingType: any) => {
    // Use icon from database if available, otherwise fallback to type-based icons
    if (parkingType.icon) {
      return <span className="text-lg">{parkingType.icon}</span>;
    }
    
    // Fallback to type-based icons
    switch (parkingType.type || parkingType) {
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

  // getParkingTypeLabel kept for reference; currently unused

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '等待確認', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '預約成功', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'checked-in': { label: '已進入停車場', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'checked-out': { label: '已離開停車場', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  // const handleDownloadReceipt = () => {
  //   // TODO: Implement receipt download
  //   toast.success('下載收據功能將很快推出！');
  // };

  // const handleShare = () => {
  //   if (navigator.share) {
  //     navigator.share({
  //       title: '預約停車位成功',
  //       text: `預約成功！預約編號：${bookingData?.bookingNumber}`,
  //       url: window.location.href
  //     });
  //   } else {
  //     navigator.clipboard.writeText(window.location.href);
  //     toast.success('已複製鏈接到剪貼板！');
  //   }
  // };

  const handleBackToHome = () => {
    navigate('/');
  };

  // const handleNewBooking = () => {
  //   navigate('/booking');
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加載信息...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">找不到預約信息</h1>
          <p className="text-gray-600 mb-6">請返回預約頁面</p>
          <Button onClick={handleBackToHome} className="bg-[#39653f] hover:bg-[#2d4f33]">
            <Home className="h-4 w-4 mr-2" />
            返回主頁
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">預約成功！</h1>
          <p className="text-gray-600">感謝您使用我們的服務</p>
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
                    <CardTitle className="text-xl text-gray-800">預約信息</CardTitle>
                    <CardDescription className="text-gray-600">
                      預約編號: <span className="font-mono font-bold text-blue-600">{bookingData.bookingNumber}</span>
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
                      <p className="text-sm text-gray-600">進入停車場日期</p>
                      <p className="font-semibold">{formatDate(bookingData.checkInTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">離開停車場日期</p>
                      <p className="font-semibold">{formatDate(bookingData.checkOutTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">停車場類型</p>
                    <div className="flex items-center space-x-2">
                      {getParkingTypeIcon(bookingData.parkingType)}
                      <p className="font-semibold">{bookingData.parkingType.name}</p>
                      {/* <Badge variant="outline" className="text-xs">
                        {getParkingTypeLabel(bookingData.parkingType.type || 'indoor')}
                      </Badge> */}
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
                  <span>客戶信息</span>
                  {bookingData.isVIP && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      👑 VIP 會員
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">您的姓名</p>
                      <p className="font-semibold">{bookingData.driverName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">車牌號碼</p>
                      <p className="font-semibold font-mono">{bookingData.licensePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">電話號碼</p>
                      <p className="font-semibold">{bookingData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">電子郵件</p>
                      <p className="font-semibold">{bookingData.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terminal Information - Only show if passengerCount > 0 */}
            {bookingData.passengerCount && bookingData.passengerCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span>接駁服務信息</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-blue-800 font-medium">✈️ 航廈選擇</span>
                        <span className="text-xs text-blue-600">(接駁服務)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">🚀</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">出發航廈</p>
                            <p className="font-semibold">
                              {bookingData.departureTerminal === 'terminal1' ? '第一航廈' : 
                               bookingData.departureTerminal === 'terminal2' ? '第二航廈' : '未選擇'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">🏠</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">回程航廈</p>
                            <p className="font-semibold">
                              {bookingData.returnTerminal === 'terminal1' ? '第一航廈' : 
                               bookingData.returnTerminal === 'terminal2' ? '第二航廈' : '未選擇'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        💡 接駁服務將根據您選擇的航廈提供服務
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span>付款詳情</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">基本費用 ({bookingData.durationDays} 天)</span>
                    <span className="font-semibold">{formatCurrency(bookingData.totalAmount)}</span>
                  </div>
                  
                  {/* Daily Prices Breakdown */}
                  {(bookingData.dailyPrices && bookingData.dailyPrices.length > 0 || true) && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-semibold text-blue-700 mb-2">📅 每日價格詳細:</div>
                      <div className="space-y-2">
                        {(bookingData.dailyPrices && bookingData.dailyPrices.length > 0
                          ? bookingData.dailyPrices
                          : buildFallbackDailyPrices()
                        ).map((day: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">
                                {formatDateWithWeekday(day.date)}
                              </span>
                              {day.isSpecialPrice && (
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200 max-w-32 truncate" title={day.specialPriceReason}>
                                  💰 {day.specialPriceReason || '特殊價格'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {day.isSpecialPrice && day.originalPrice ? (
                                <span className="text-xs text-gray-500 line-through">
                                  {formatCurrency(day.originalPrice)}
                                </span>
                              ) : null}
                              <span className={`font-semibold ${day.isSpecialPrice ? 'text-orange-600' : 'text-blue-600'}`}>
                                {formatCurrency(day.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {bookingData.addonServices.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">附加服務:</p>
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
                          <span className="text-green-600">🎫 折扣:</span>
                        </div>
                        <span className="font-semibold text-green-600">-{formatCurrency(bookingData.discountAmount)}</span>
                      </div>
                    </>
                  )}

                  {bookingData.vipDiscount && bookingData.vipDiscount > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">👑 VIP 折扣:</span>
                        </div>
                        <span className="font-semibold text-blue-600">-{formatCurrency(bookingData.vipDiscount)}</span>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-3 rounded-lg border-2 border-emerald-300">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">總費用:</span>
                        <span className="font-semibold">{formatCurrency(bookingData.totalAmount)}</span>
                      </div>
                      
                      {(bookingData.discountAmount > 0 || (bookingData.vipDiscount && bookingData.vipDiscount > 0)) && (
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-700">總折扣:</span>
                          <span className="font-bold text-green-700 text-lg">
                            -{formatCurrency((bookingData.discountAmount || 0) + (bookingData.vipDiscount || 0))}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">總付款:</span>
                          <span className="font-bold text-emerald-800 text-xl">
                            {formatCurrency(bookingData.finalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadReceipt} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下載收據
                </Button>
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
                <Button 
                  onClick={handleNewBooking} 
                  className="w-full justify-start bg-[#39653f] hover:bg-[#2d4f33]"
                >
                  <Car className="h-4 w-4 mr-2" />
                  預約新車位
                </Button>
                <Button 
                  onClick={handleBackToHome} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  返回主頁
                </Button>
              </CardContent>
            </Card> */}

            {/* System Information */}
            {systemSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>聯繫信息</span>
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
                <CardTitle className="text-lg text-amber-800">重要提示</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-700 space-y-2">
                <p>• 請按預約時間到達</p>
                <p>• 請攜帶車輛證明文件和駕駛執照</p>
                <p>• 如有變更，請立即聯繫</p>
                <p>• 保留預約編號以供查詢</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage; 