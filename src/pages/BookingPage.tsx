import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  Receipt,
  ShoppingCart,
  Tag,
  FileText,
  Shield,
  Clock,
  // Car,
  // Building,
  // Sun,
  // Accessibility
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSystemSettings, getAllParkingTypes, getAllAddonServices as getAddonServices, createBooking, api } from '@/services';
import type { SystemSettings, ParkingType, AddonService, BookingFormData } from '@/types';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ConflictNotification from '@/components/ConflictNotification';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  console.log(systemSettings, 'systemSettings');
  const [parkingTypes, setParkingTypes] = useState<ParkingType[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  console.log(availableSlots, 'availableSlots');
  const [pricing, setPricing] = useState<any>(null);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [isVIP, setIsVIP] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflictingDays, setConflictingDays] = useState<string[]>([]);
  const [bookingTerms, setBookingTerms] = useState<string>('');
  const [bookingRules, setBookingRules] = useState<string>('');
  
  const [formData, setFormData] = useState<BookingFormData>({
    agreedToTerms: false,
    parkingTypeId: '',
    checkInTime: '',
    checkOutTime: '',
    selectedAddonServices: [],
    discountCode: '',
    driverName: '',
    phone: '',
    email: '',
    licensePlate: '',
    passengerCount: 1,
    luggageCount: 0,
    termsAccepted: false
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settings, types, services] = await Promise.all([
        getSystemSettings(),
        getAllParkingTypes(),
        getAddonServices()
      ]);
      setSystemSettings(settings);
      setParkingTypes(types);
      setAddonServices(services);
      // Set booking terms and rules from system settings
      setBookingTerms(settings.bookingTerms || '');
      setBookingRules(settings.bookingRules || '');
      
      // Load VIP status from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setIsVIP(user.isVIP || false);
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError('Không thể tải dữ liệu hệ thống');
      toast.error('Không thể tải dữ liệu hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // Check availability when parking type or time changes
  useEffect(() => {
    if (formData.parkingTypeId && formData.checkInTime && formData.checkOutTime) {
      checkAvailability();
    } else {
      // Clear availability data when no parking type or time is selected
      setAvailableSlots([]);
      setPricing(null);
      setConflictingDays([]);
    }
  }, [formData.parkingTypeId, formData.checkInTime, formData.checkOutTime]);

  // Check VIP status when email changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkVIPStatus(formData.email);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const checkAvailability = async () => {
    try {
      const response = await api.post('/bookings/check-availability', {
        parkingTypeId: formData.parkingTypeId,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime
      });
      
      const data = response.data;
      if (data.success) {
        setAvailableSlots(data.availableSlots);
        setPricing(data.pricing);
        setConflictingDays([]); // No conflicts if available
      } else {
        setAvailableSlots([]);
        setPricing(null);
        // Calculate conflicting days
        const conflicts = await calculateConflictingDays();
        setConflictingDays(conflicts);
        toast.error(data.message || 'Bãi đậu xe đã hết chỗ trong thời gian này');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Lỗi kiểm tra tính khả dụng');
    }
  };

  const calculateConflictingDays = async (): Promise<string[]> => {
    if (!formData.checkInTime || !formData.checkOutTime) {
      return [];
    }

    const conflicts: string[] = [];
    const startDate = new Date(formData.checkInTime);
    const endDate = new Date(formData.checkOutTime);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      try {
        const response = await api.post('/bookings/check-availability', {
          parkingTypeId: formData.parkingTypeId,
          checkInTime: `${dateStr}T00:00:00.000Z`,
          checkOutTime: `${dateStr}T23:59:59.999Z`
        });
        
        const data = response.data;
        if (!data.success) {
          conflicts.push(dateStr);
        }
      } catch (error) {
        console.error('Error checking day availability:', error);
        conflicts.push(dateStr);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return conflicts;
  };

  const checkVIPStatus = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      const response = await api.get(`/admin/users?email=${email}`);
      if (response.data.users && response.data.users.length > 0) {
        const user = response.data.users[0];
        setCurrentUser(user);
        setIsVIP(user.isVIP || false);
        
        if (user.isVIP) {
          toast.success(`🎉 Chào mừng VIP Member! Bạn được hưởng ${user.vipDiscount || 0}% giảm giá!`);
        }
      } else {
        setCurrentUser(null);
        setIsVIP(false);
      }
    } catch (error) {
      console.error('Error checking VIP status:', error);
    }
  };

  const handleDiscountCodeApply = async () => {
    if (!formData.discountCode?.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    if (!formData.parkingTypeId || !formData.checkInTime || !formData.checkOutTime) {
      toast.error('Vui lòng chọn bãi đậu xe và thời gian trước khi áp dụng mã giảm giá');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.post('/bookings/apply-discount', {
        discountCode: formData.discountCode,
        parkingTypeId: formData.parkingTypeId,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        addonServices: formData.selectedAddonServices,
        isVIP: isVIP,
        email: formData.email || user.email
      });

      const data = response.data;
      if (data.success) {
        setDiscountInfo(data.discountInfo);
        toast.success('Áp dụng mã giảm giá thành công!');
      } else {
        toast.error(data.message || 'Mã giảm giá không hợp lệ');
        setDiscountInfo(null);
      }
    } catch (error: any) {
      console.error('Error applying discount:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể áp dụng mã giảm giá';
      toast.error(errorMessage);
      setDiscountInfo(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      toast.error('Bạn phải đồng ý với các điều khoản');
      return;
    }

    if (!formData.parkingTypeId) {
      toast.error('Vui lòng chọn loại bãi đậu xe');
      return;
    }

    if (!formData.checkInTime || !formData.checkOutTime) {
      toast.error('Vui lòng chọn thời gian đặt chỗ');
      return;
    }

    if (!formData.driverName || !formData.phone || !formData.email || !formData.licensePlate) {
      toast.error('Vui lòng điền đầy đủ thông tin cá nhân');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        parkingTypeId: formData.parkingTypeId,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        driverName: formData.driverName,
        phone: formData.phone,
        email: formData.email,
        licensePlate: formData.licensePlate,
        passengerCount: formData.passengerCount,
        luggageCount: formData.luggageCount,
        addonServices: formData.selectedAddonServices,
        discountCode: formData.discountCode,
        termsAccepted: formData.termsAccepted
      };

      const result = await createBooking(bookingData);
      console.log('Booking result:', result);
      
      // Transform booking data for confirmation page
      const confirmationData = {
        bookingId: result.booking._id,
        bookingNumber: `BK${result.booking._id.slice(-6).toUpperCase()}`,
        parkingType: {
          name: result.booking.parkingType?.name || 'Unknown',
          type: result.booking.parkingType?.type || 'indoor',
          location: result.booking.parkingType?.location || ''
        },
        driverName: result.booking.driverName,
        phone: result.booking.phone,
        email: result.booking.email,
        licensePlate: result.booking.licensePlate,
        checkInTime: result.booking.checkInTime,
        checkOutTime: result.booking.checkOutTime,
        durationDays: result.booking.durationDays || 1,
        totalAmount: result.booking.totalAmount,
        isVIP: result.booking.isVIP,
        vipDiscount: result.booking.vipDiscount,
        finalAmount: result.booking.finalAmount,
        addonServices: result.booking.addonServices?.map((service: any) => ({
          name: service.service?.name || 'Unknown Service',
          price: service.service?.price || 0,
          icon: service.service?.icon || '🔧'
        })) || [],
        discountAmount: result.booking.discountAmount || 0,
        paymentMethod: result.booking.paymentMethod || 'cash',
        status: result.booking.status
      };
      
      // Navigate to confirmation page with booking details
      navigate('/booking-confirmation', { 
        state: { 
          bookingData: confirmationData,
          pricing: pricing,
          discountInfo: discountInfo
        } 
      });
    } catch (error: any) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo đặt chỗ';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getParkingTypeIcon = (type: string) => {
    const iconMap = {
      indoor: '🏢',
      outdoor: '☀️',
      disabled: '♿'
    };
    return iconMap[type as keyof typeof iconMap] || '🚗';
  };

  const getParkingTypeBadge = (type: string) => {
    const badgeConfig = {
      indoor: { label: 'Trong nhà', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      outdoor: { label: 'Ngoài trời', color: 'bg-green-100 text-green-800 border-green-200' },
      disabled: { label: 'Khuyết tật', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    };
    
    const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.indoor;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0 TWD';
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

  // Helper function to safely render text
  const safeText = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      console.warn('Attempting to render object as text:', value);
      return '[Object]';
    }
    return String(value);
  };

  const steps = [
    { id: 1, title: 'Quy định', icon: <FileText className="h-4 w-4" /> },
    { id: 2, title: 'Chọn bãi', icon: <MapPin className="h-4 w-4" /> },
    { id: 3, title: 'Dịch vụ', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 4, title: 'Giảm giá', icon: <Tag className="h-4 w-4" /> },
    { id: 5, title: 'Thông tin', icon: <User className="h-4 w-4" /> }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center space-x-3 text-blue-900">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <span>Điều khoản và quy định</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Vui lòng đọc kỹ các quy định và điều khoản trước khi đặt chỗ đậu xe.
                </p>
                
                <div className="space-y-6">
                  {/* Booking Terms */}
                  {bookingTerms && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-blue-800 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Điều khoản đặt chỗ
                      </h4>
                      <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {bookingTerms}
                      </div>
                    </div>
                  )}
                  
                  {/* Booking Rules */}
                  {bookingRules && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-green-800 flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Quy định đặt chỗ
                      </h4>
                      <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {bookingRules}
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback content if no terms/rules are set */}
                  {!bookingTerms && !bookingRules && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-blue-800">Quy định chung</h4>
                        <div className="space-y-3 text-sm text-gray-700">
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">1.</span>
                            <span>Khách hàng phải đến đúng giờ đã đặt.</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">2.</span>
                            <span>Không được để xe quá thời gian đã đặt.</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">3.</span>
                            <span>Tuân thủ các quy định an toàn của bãi đậu xe.</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">4.</span>
                            <span>Khách hàng chịu trách nhiệm về tài sản trong xe.</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">5.</span>
                            <span>Bãi đậu xe không chịu trách nhiệm về thiệt hại do thiên tai.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreedToTerms: !!checked }))}
                    />
                    <Label htmlFor="agreedToTerms" className="text-sm font-medium">
                      Tôi đã đọc và đồng ý với các điều khoản trên
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center space-x-3 text-green-900">
                  <MapPin className="h-6 w-6 text-green-600" />
                  <span>Chọn loại bãi đậu xe và thời gian</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Parking Type Selection */}
                <div>
                  <Label className="text-lg font-semibold text-gray-800 mb-4 block">Loại bãi đậu xe</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parkingTypes.filter(type => type.isActive).map((type) => {
                      const isSelected = formData.parkingTypeId === type._id;
                      return (
                        <Card 
                          key={type._id} 
                          className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                            isSelected 
                              ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, parkingTypeId: type._id }))}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="text-3xl">{getParkingTypeIcon(type.type || 'indoor')}</div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">{type.name}</h3>
                                  <div className="flex items-center space-x-2 mt-2">
                                    {getParkingTypeBadge(type.type || 'indoor')}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Sức chứa:</span>
                                <span className="font-medium text-gray-900">{type.totalSpaces} chỗ</span>
                              </div>
                              
                              {type.description && (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {safeText(type.description)}
                                </p>
                              )}
                              
                              <div className="pt-3 border-t">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(type.pricePerDay)}
                                  </p>
                                  <p className="text-sm text-gray-500">/ngày</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                {formData.parkingTypeId && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-semibold text-gray-800 mb-4 block">Chọn thời gian đặt chỗ</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="checkInTime" className="text-sm font-medium text-gray-700">Thời gian vào *</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="checkInTime"
                              type="datetime-local"
                              value={formData.checkInTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                              min={new Date().toISOString().slice(0, 16)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="checkOutTime" className="text-sm font-medium text-gray-700">Thời gian ra *</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="checkOutTime"
                              type="datetime-local"
                              value={formData.checkOutTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                              min={formData.checkInTime || new Date().toISOString().slice(0, 16)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Availability Calendar */}
                    {formData.parkingTypeId && formData.checkInTime && formData.checkOutTime && (
                      <AvailabilityCalendar
                        parkingTypeId={formData.parkingTypeId}
                        checkInTime={formData.checkInTime}
                        checkOutTime={formData.checkOutTime}
                      />
                    )}

                    {/* Conflict Notification */}
                    {conflictingDays.length > 0 && (
                      <ConflictNotification 
                        checkInTime={formData.checkInTime}
                        checkOutTime={formData.checkOutTime}
                        conflictingDays={conflictingDays}
                        totalDays={Math.ceil((new Date(formData.checkOutTime).getTime() - new Date(formData.checkInTime).getTime()) / (1000 * 60 * 60 * 24))}
                        availableDays={Math.ceil((new Date(formData.checkOutTime).getTime() - new Date(formData.checkInTime).getTime()) / (1000 * 60 * 60 * 24)) - conflictingDays.length}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center space-x-3 text-purple-900">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                  <span>Dịch vụ bổ sung</span>
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Chọn các dịch vụ bổ sung cho chuyến đi của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {addonServices.filter(service => service.isActive).map((service) => {
                    const isSelected = formData.selectedAddonServices.includes(service._id);
                    return (
                      <Card 
                        key={service._id} 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                          isSelected 
                            ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setFormData(prev => ({
                              ...prev,
                              selectedAddonServices: prev.selectedAddonServices.filter(id => id !== service._id)
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              selectedAddonServices: [...prev.selectedAddonServices, service._id]
                            }));
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-3xl">{service.icon}</div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center pt-3 border-t">
                            <p className="text-2xl font-bold text-purple-600">
                              {formatCurrency(service.price)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <CardTitle className="flex items-center space-x-3 text-orange-900">
                  <Tag className="h-6 w-6 text-orange-600" />
                  <span>Mã giảm giá</span>
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Nhập mã giảm giá nếu bạn có
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex space-x-3">
                  <Input
                    placeholder="Nhập mã giảm giá"
                    value={formData.discountCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountCode: e.target.value }))}
                    className="flex-1"
                  />
                  <Button onClick={handleDiscountCodeApply} className="bg-orange-600 hover:bg-orange-700">
                    Áp dụng
                  </Button>
                </div>
                
                {discountInfo && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Ưu đãi đã được áp dụng!</span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Voucher Discount */}
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">🎫</span>
                          <span className="font-semibold text-green-700">Voucher Discount</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Mã voucher:</span>
                            <span className="font-semibold text-green-600">{discountInfo.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loại giảm:</span>
                            <span className="font-semibold">
                              {discountInfo.discountType === 'percentage' ? `${discountInfo.discountValue}%` : 'Số tiền cố định'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Số tiền giảm:</span>
                            <span className="font-semibold text-green-600">-{formatCurrency(discountInfo.discountAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* VIP Discount */}
                      {discountInfo.vipDiscount > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">👑</span>
                            <span className="font-semibold text-blue-700">VIP Member Discount</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Trạng thái:</span>
                              <span className="font-semibold text-blue-600">VIP Member</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tỷ lệ giảm:</span>
                              <span className="font-semibold">
                                {Math.round((discountInfo.vipDiscount / (discountInfo.originalAmount - discountInfo.discountAmount)) * 100)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Số tiền giảm:</span>
                              <span className="font-semibold text-blue-600">-{formatCurrency(discountInfo.vipDiscount)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total Summary */}
                      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg border-2 border-green-300">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Tổng tiền gốc:</span>
                            <span className="font-semibold">{formatCurrency(discountInfo.originalAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-700">Tổng giảm giá:</span>
                            <span className="font-bold text-green-700 text-lg">
                              -{formatCurrency(discountInfo.totalDiscount || discountInfo.discountAmount)}
                            </span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-lg">Tổng thanh toán:</span>
                              <span className="font-bold text-green-800 text-xl">
                                {formatCurrency(discountInfo.finalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                <CardTitle className="flex items-center space-x-3 text-indigo-900">
                  <User className="h-6 w-6 text-indigo-600" />
                  <span>Thông tin cá nhân</span>
                  {isVIP && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      👑 VIP Member
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-indigo-700">
                  Điền thông tin cá nhân để hoàn tất đặt chỗ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="driverName" className="text-sm font-medium text-gray-700">Tên tài xế *</Label>
                    <Input
                      id="driverName"
                      value={formData.driverName}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                      placeholder="Nhập tên tài xế"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Nhập email"
                        className={isVIP ? 'border-yellow-400 bg-yellow-50' : ''}
                      />
                      {isVIP && currentUser && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
                            👑 VIP {currentUser.vipDiscount}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    {isVIP && currentUser && (
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        ✨ Chào mừng VIP Member! Bạn được hưởng {currentUser.vipDiscount}% giảm giá tự động.
                      </div>
                    )}
                    {!isVIP && formData.email && !currentUser && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        ℹ️ Khách hàng thường - Không có ưu đãi VIP
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate" className="text-sm font-medium text-gray-700">Biển số xe *</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                      placeholder="Nhập biển số xe"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="passengerCount" className="text-sm font-medium text-gray-700">Số hành khách</Label>
                    <Input
                      id="passengerCount"
                      type="number"
                      min="1"
                      value={formData.passengerCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, passengerCount: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="luggageCount" className="text-sm font-medium text-gray-700">Số hành lý</Label>
                    <Input
                      id="luggageCount"
                      type="number"
                      min="0"
                      value={formData.luggageCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, luggageCount: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú thêm (nếu có)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            {pricing && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                  <CardTitle className="flex items-center space-x-3 text-emerald-900">
                    <Receipt className="h-6 w-6 text-emerald-600" />
                    <span>Tóm tắt giá</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Base Price */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">Giá cơ bản</span>
                          <div className="text-sm text-gray-600">
                            {parkingTypes.find(t => t._id === formData.parkingTypeId)?.name} • {pricing.durationDays} ngày
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(pricing.totalPrice)}</span>
                      </div>
                    </div>
                    
                    {/* Addon Services */}
                    {formData.selectedAddonServices.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-blue-700 mb-2">🚀 Dịch vụ bổ sung:</div>
                        <div className="space-y-2">
                          {formData.selectedAddonServices.map((serviceId) => {
                            const service = addonServices.find(s => s._id === serviceId);
                            return service ? (
                              <div key={serviceId} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{service.icon}</span>
                                  <span>{service.name}</span>
                                </div>
                                <span className="font-semibold text-blue-600">{formatCurrency(service.price)}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* VIP Discount Preview - Always show if user is VIP */}
                    {isVIP && currentUser && (
                      <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">👑 VIP Discount:</span>
                          <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                            {currentUser.vipDiscount}% off
                          </span>
                        </div>
                        {discountInfo ? (
                          <span className="font-semibold text-blue-600">-{formatCurrency(discountInfo.vipDiscount || 0)}</span>
                        ) : (
                          <span className="text-sm text-blue-600">
                            ~{formatCurrency(Math.round((pricing?.totalPrice || 0) * (currentUser.vipDiscount / 100)))}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Voucher Discount */}
                    {discountInfo && discountInfo.discountAmount > 0 && (
                      <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">🎫 Voucher:</span>
                          <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded">
                            {discountInfo.code} ({discountInfo.discountType === 'percentage' ? `${discountInfo.discountValue}%` : 'Fixed'})
                          </span>
                        </div>
                        <span className="font-semibold text-green-600">-{formatCurrency(discountInfo.discountAmount)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {/* Total Summary */}
                    <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-4 rounded-lg border-2 border-emerald-300">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Tổng tiền gốc:</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(pricing.totalPrice + (addonServices
                              .filter(service => formData.selectedAddonServices.includes(service._id))
                              .reduce((sum, service) => sum + service.price, 0)
                            ))}
                          </span>
                        </div>
                        
                        {/* Show total discount if there's any discount */}
                        {(discountInfo && (discountInfo.discountAmount > 0 || discountInfo.vipDiscount > 0)) || (isVIP && currentUser) ? (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-700">Tổng giảm giá:</span>
                            <span className="font-bold text-green-700 text-lg">
                              -{formatCurrency(
                                discountInfo 
                                  ? (discountInfo.totalDiscount || discountInfo.discountAmount) || 0
                                  : Math.round((pricing?.totalPrice || 0) * (currentUser?.vipDiscount / 100))
                              )}
                            </span>
                          </div>
                        ) : null}
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg text-gray-900">Tổng thanh toán:</span>
                            <span className="text-2xl font-bold text-emerald-600">
                              {discountInfo 
                                ? formatCurrency(discountInfo.finalAmount) 
                                : isVIP && currentUser 
                                  ? formatCurrency(Math.round((pricing?.totalPrice || 0) * (1 - currentUser.vipDiscount / 100)))
                                  : formatCurrency(pricing?.totalPrice || 0)
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms Agreement */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: !!checked }))}
                  />
                  <Label htmlFor="termsAccepted" className="text-sm font-medium">
                    Tôi đồng ý với các điều khoản và quy định đặt chỗ
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button onClick={loadInitialData} className="mt-4">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`ml-3 text-sm font-medium transition-colors duration-300 ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-4 transition-colors duration-300 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={
                    (currentStep === 1 && !formData.agreedToTerms) ||
                    (currentStep === 2 && !formData.parkingTypeId) ||
                    (currentStep === 2 && (!formData.checkInTime || !formData.checkOutTime))
                  }
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  Tiếp theo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.termsAccepted}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Đang xử lý...' : 'Hoàn tất đặt chỗ'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 