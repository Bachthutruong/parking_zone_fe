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
  // Tag,
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
import { checkParkingTypeMaintenance } from '@/services/maintenance';
import { checkVIPStatus, checkVIPByCode } from '@/services/auth';
import type { SystemSettings, ParkingType, AddonService, BookingFormData } from '@/types';


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
  const [showVIPCodeInput, setShowVIPCodeInput] = useState(false);
  const [vipCode, setVipCode] = useState('');
  const [vipCodeLoading, setVipCodeLoading] = useState(false);
  const [conflictingDays, setConflictingDays] = useState<string[]>([]);
  console.log(conflictingDays, 'conflictingDays');
  const [bookingTerms, setBookingTerms] = useState<string>('');
  const [bookingRules, setBookingRules] = useState<string>('');
  const [maintenanceDays, setMaintenanceDays] = useState<any[]>([]);
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

  const [showConflictMessage, setShowConflictMessage] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);
  const [minBookingDays, setMinBookingDays] = useState(3); // Default 3 days minimum

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
      console.log(settings , 'types');
      // Ensure parkingTypes is always an array
      setParkingTypes(Array.isArray(types) ? types : []);
      // Ensure addonServices is always an array
      setAddonServices(Array.isArray(services) ? services : []);
      // Set booking terms and rules from system settings
      setBookingTerms(settings?.bookingTerms || '');
      setBookingRules(settings?.bookingRules || '');
      
      // Set minimum booking days from system settings
      setMinBookingDays(settings?.minBookingDays || 3);
      
      // Load VIP status from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setIsVIP(user.isVIP || false);
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError('無法載入系統資料');
      toast.error('無法載入系統資料');
      // Set empty arrays on error to prevent filter errors
      setParkingTypes([]);
      setAddonServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Check availability when parking type or time changes
  useEffect(() => {
    if (formData.parkingTypeId && formData.checkInTime && formData.checkOutTime) {
      checkAvailability();
      checkMaintenanceForSelectedDates();
      checkDateRangeAvailability();
    } else {
      // Clear availability data when no parking type or time is selected
      setAvailableSlots([]);
      setPricing(null);
      setConflictingDays([]);
      setMaintenanceDays([]);
      setShowConflictMessage(false);
      setConflictDetails(null);
    }
  }, [formData.parkingTypeId, formData.checkInTime, formData.checkOutTime]);

  // Check VIP status when email changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkVIPStatusByEmail(formData.email);
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
        toast.error(data.message || '停車場在此時間段已滿');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('檢查可用性時發生錯誤');
    }
  };

  const checkMaintenanceForSelectedDates = async () => {
    if (!formData.parkingTypeId || !formData.checkInTime || !formData.checkOutTime) {
      return;
    }

    try {
      const result = await checkParkingTypeMaintenance(
        formData.parkingTypeId,
        formData.checkInTime,
        formData.checkOutTime
      );
      
      setMaintenanceDays(result.maintenanceDays);
      
      if (result.hasMaintenance) {
        toast.error('此停車場在選定時間內正在維護');
      }
    } catch (error) {
      console.error('Error checking maintenance:', error);
    }
  };

  const checkDateRangeAvailability = async () => {
    if (!formData.checkInTime || !formData.checkOutTime || !formData.parkingTypeId) {
      return;
    }

    try {
      const startDate = new Date(formData.checkInTime);
      const endDate = new Date(formData.checkOutTime);
      const currentDate = new Date(startDate);
      const conflictingDates: any[] = [];
      const availableDates: any[] = [];

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
            conflictingDates.push({
              date: dateStr,
              formattedDate: currentDate.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })
            });
          } else {
            availableDates.push({
              date: dateStr,
              formattedDate: currentDate.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })
            });
          }
        } catch (error) {
          console.error('Error checking day availability:', error);
          conflictingDates.push({
            date: dateStr,
            formattedDate: currentDate.toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (conflictingDates.length > 0) {
        setShowConflictMessage(true);
        setConflictDetails({
          conflictingDates,
          availableDates,
          totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          conflictingDays: conflictingDates.length,
          availableDays: availableDates.length
        });
      } else {
        setShowConflictMessage(false);
        setConflictDetails(null);
      }
    } catch (error) {
      console.error('Error checking date range availability:', error);
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

  const checkVIPStatusByEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      // First try to get user info from localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.email === email && storedUser.isVIP) {
        setCurrentUser(storedUser);
        setIsVIP(true);
        toast.success(`🎉 歡迎VIP會員！您享有${storedUser.vipDiscount || 0}%折扣！`);
        return;
      }
      
      // Check VIP status from backend
      const response = await checkVIPStatus(email);
      
      if (response.success && response.user && response.user.isVIP) {
        setCurrentUser(response.user);
        setIsVIP(true);
        toast.success(`🎉 歡迎VIP會員！您享有${response.user.vipDiscount || 0}%折扣！`);
      } else {
        setCurrentUser(null);
        setIsVIP(false);
      }
    } catch (error) {
      console.error('Error checking VIP status:', error);
      setCurrentUser(null);
      setIsVIP(false);
    }
  };

  const handleCheckVIPByCode = async () => {
    if (!vipCode.trim()) {
      toast.error('請輸入VIP碼');
      return;
    }

    setVipCodeLoading(true);
    try {
      const response = await checkVIPByCode(vipCode.trim());
      
      if (response.success && response.user && response.user.isVIP) {
        setCurrentUser(response.user);
        setIsVIP(true);
        setShowVIPCodeInput(false);
        setVipCode('');
        
        // Auto-fill form with VIP user info
        setFormData(prev => ({
          ...prev,
          driverName: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          licensePlate: response.user.licensePlate || ''
        }));
        
        toast.success(`🎉 歡迎VIP會員！您享有${response.user.vipDiscount || 0}%折扣！`);
      } else {
        toast.error(response.message || 'VIP碼無效');
        setCurrentUser(null);
        setIsVIP(false);
      }
    } catch (error) {
      console.error('Error checking VIP code:', error);
      toast.error('檢查VIP碼時發生錯誤');
      setCurrentUser(null);
      setIsVIP(false);
    } finally {
      setVipCodeLoading(false);
    }
  };

  const handleDiscountCodeApply = async () => {
    if (!formData.discountCode?.trim()) {
      toast.error('請輸入折扣碼');
      return;
    }

    if (!formData.parkingTypeId || !formData.checkInTime || !formData.checkOutTime) {
      toast.error('請在應用折扣碼之前選擇停車場和時間');
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
        userEmail: formData.email || user.email
      });

      const data = response.data;
      if (data.success) {
        setDiscountInfo(data.discountInfo);
        toast.success('折扣碼應用成功！');
      } else {
        toast.error(data.message || '折扣碼無效');
        setDiscountInfo(null);
      }
    } catch (error: any) {
      console.error('Error applying discount:', error);
      // Don't show authentication errors for public booking
      if (error.response?.status === 401) {
        toast.error('請登入以使用折扣碼');
      } else {
        const errorMessage = error.response?.data?.message || error.message || '無法應用折扣碼';
        toast.error(errorMessage);
      }
      setDiscountInfo(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      toast.error('您必須同意條款');
      return;
    }

    if (!formData.parkingTypeId) {
      toast.error('請選擇停車場類型');
      return;
    }

    if (!formData.checkInTime || !formData.checkOutTime) {
      toast.error('請選擇預約時間');
      return;
    }

    // Check minimum booking days
    if (formData.checkInTime && formData.checkOutTime) {
      const checkInDate = new Date(formData.checkInTime);
      const checkOutDate = new Date(formData.checkOutTime);
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < minBookingDays) {
        toast.error(`最少需要預約 ${minBookingDays} 天，您選擇了 ${diffDays} 天`);
        return;
      }
    }

    if (!formData.driverName || !formData.phone || !formData.email || !formData.licensePlate) {
      toast.error('請填寫完整的個人資料');
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
        bookingNumber: result.booking.bookingNumber || `BK${result.booking._id.slice(-6).toUpperCase()}`,
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
      // Handle authentication errors gracefully for public booking
      if (error.response?.status === 401) {
        toast.error('請登入以創建預約');
      } else {
        const errorMessage = error.response?.data?.message || error.message || '無法創建預約';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getParkingTypeIcon = (parkingType: any) => {
    // Use icon from database if available, otherwise fallback to type-based icons
    if (parkingType.icon) {
      return parkingType.icon;
    }
    
    // Fallback to type-based icons
    const iconMap = {
      indoor: '🏢',
      outdoor: '☀️',
      disabled: '♿'
    };
    return iconMap[parkingType.type as keyof typeof iconMap] || '🚗';
  };

  const getParkingTypeBadge = (type: string) => {
    const badgeConfig = {
      indoor: { label: '室內', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      outdoor: { label: '戶外', color: 'bg-green-100 text-green-800 border-green-200' },
      disabled: { label: '無障礙', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    };
    
    const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.indoor;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0 TWD';
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
    { id: 1, title: '條款', icon: <FileText className="h-4 w-4" /> },
    { id: 2, title: '選擇停車場', icon: <MapPin className="h-4 w-4" /> },
    { id: 3, title: '服務', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 4, title: '個人資料', icon: <User className="h-4 w-4" /> }
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
                  <span>條款和規定</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  請在預約停車位之前仔細閱讀規定和條款。
                </p>
                
                <div className="space-y-6">
                  {/* Booking Terms */}
                  {bookingTerms && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-blue-800 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        預約條款
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
                        預約規定
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
                        <h4 className="font-semibold mb-3 text-blue-800">一般規定</h4>
                        <div className="space-y-3 text-sm text-gray-700">
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">1.</span>
                            <span>客戶必須按預約時間準時到達。</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">2.</span>
                            <span>不得超過預約時間停放車輛。</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">3.</span>
                            <span>遵守停車場安全規定。</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">4.</span>
                            <span>客戶對車內財物負責。</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-blue-600">5.</span>
                            <span>停車場對天災造成的損害不承擔責任。</span>
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
                      我已閱讀並同意上述條款
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
                  <span>選擇停車場類型和時間</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Parking Type Selection */}
                <div>
                  <Label className="text-lg font-semibold text-gray-800 mb-4 block">停車場類型</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(parkingTypes || []).filter(type => type.isActive).map((type) => {
                      const isSelected = formData.parkingTypeId === type._id;
                      const isUnderMaintenance = maintenanceDays.some(maintenance => 
                        maintenance.affectedParkingTypes.some((affectedType: any) => affectedType._id === type._id)
                      );
                      
                      return (
                        <Card 
                          key={type._id} 
                          className={`transition-all duration-300 ${
                            isUnderMaintenance 
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300' 
                              : isSelected 
                                ? 'cursor-pointer border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl hover:scale-105' 
                                : 'cursor-pointer border-gray-200 hover:border-blue-300 hover:shadow-xl hover:scale-105'
                          }`}
                          onClick={() => {
                            if (!isUnderMaintenance) {
                              setFormData(prev => ({ ...prev, parkingTypeId: type._id }));
                              toast.success(`已選擇停車場: ${type.name}`);
                            }
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="text-3xl">{getParkingTypeIcon(type)}</div>
                                                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{type.name}</h3>
                                                              <div className="flex items-center space-x-2 mt-2">
                                {getParkingTypeBadge(type.type || 'indoor')}
                                {isUnderMaintenance && (
                                  <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                    🔧 維護中
                                  </Badge>
                                )}
                              </div>
                              </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">容量:</span>
                                <span className="font-medium text-gray-900">{type.totalSpaces} 位</span>
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
                                  <p className="text-sm text-gray-500">/天</p>
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
                      <Label className="text-lg font-semibold text-gray-800 mb-4 block">選擇預約時間</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="checkInTime" className="text-sm font-medium text-gray-700">進入時間 *</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="checkInTime"
                              type="datetime-local"
                              value={formData.checkInTime}
                              onChange={(e) => {
                                const checkInTime = e.target.value;
                                setFormData(prev => ({ ...prev, checkInTime }));
                                
                                // Auto-calculate minimum checkout time
                                if (checkInTime && formData.checkOutTime) {
                                  const checkInDate = new Date(checkInTime);
                                  const minCheckOutDate = new Date(checkInDate);
                                  minCheckOutDate.setDate(checkInDate.getDate() + minBookingDays);
                                  
                                  const currentCheckOutDate = new Date(formData.checkOutTime);
                                  if (currentCheckOutDate < minCheckOutDate) {
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      checkOutTime: minCheckOutDate.toISOString().slice(0, 16)
                                    }));
                                  }
                                }
                              }}
                              min={new Date().toISOString().slice(0, 16)}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            最少預約 {minBookingDays} 天
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="checkOutTime" className="text-sm font-medium text-gray-700">離開時間 *</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="checkOutTime"
                              type="datetime-local"
                              value={formData.checkOutTime}
                              onChange={(e) => {
                                const checkOutTime = e.target.value;
                                if (formData.checkInTime) {
                                  const checkInDate = new Date(formData.checkInTime);
                                  const checkOutDate = new Date(checkOutTime);
                                  const minCheckOutDate = new Date(checkInDate);
                                  minCheckOutDate.setDate(checkInDate.getDate() + minBookingDays);
                                  
                                  if (checkOutDate < minCheckOutDate) {
                                    toast.error(`最少需要預約 ${minBookingDays} 天`);
                                    return;
                                  }
                                }
                                setFormData(prev => ({ ...prev, checkOutTime }));
                              }}
                              min={formData.checkInTime ? (() => {
                                const checkInDate = new Date(formData.checkInTime);
                                const minCheckOutDate = new Date(checkInDate);
                                minCheckOutDate.setDate(checkInDate.getDate() + minBookingDays);
                                return minCheckOutDate.toISOString().slice(0, 16);
                              })() : new Date().toISOString().slice(0, 16)}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            從進入時間起最少 {minBookingDays} 天
                          </p>
                        </div>
                      </div>
                    </div>



                    {/* Conflict Message */}
                    {showConflictMessage && conflictDetails && (
                      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-4">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h3 className="text-lg font-semibold text-red-800">您所選的日期，停車位已經被約完，詳細如下：</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-red-700 mb-2">您選的日期：</h4>
                            <div className="space-y-2">
                              {conflictDetails.conflictingDates.map((date: any, index: number) => (
                                <div key={index} className="flex items-center space-x-2 text-red-600">
                                  <span>•</span>
                                  <span>{date.formattedDate}</span>
                                  <span className="text-red-500 font-medium">(x 無空位)</span>
                                </div>
                              ))}
                              {conflictDetails.availableDates.map((date: any, index: number) => (
                                <div key={index} className="flex items-center space-x-2 text-green-600">
                                  <span>•</span>
                                  <span>{date.formattedDate}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-red-700">總計：</span>
                              <div className="flex space-x-4">
                                <span className="text-sm text-red-600">
                                  {conflictDetails.conflictingDays} 天已滿
                                </span>
                                <span className="text-sm text-green-600">
                                  {conflictDetails.availableDays} 天空閒
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-2">建議：</h4>
                            <div className="space-y-1 text-sm text-blue-700">
                              <div>• 選擇其他時間範圍</div>
                              <div>• 選擇較短的時間範圍</div>
                              <div>• 聯繫我們以獲得支援</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Maintenance Notification */}
                    {maintenanceDays.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">⚠️ 停車場正在維護</span>
                        </div>
                        <div className="text-sm text-red-700">
                          <p>所選停車場在此時間內正在維護:</p>
                          <ul className="mt-2 space-y-1">
                            {maintenanceDays.map((maintenance, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <span>•</span>
                                <span>{new Date(maintenance.date).toLocaleDateString('vi-VN')}: {maintenance.reason}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 font-medium">請選擇其他時間或停車場。</p>
                        </div>
                      </div>
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
                  <span>服務</span>
                </CardTitle>
                <CardDescription className="text-purple-700">
                  選擇您需要的服務
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(addonServices || []).filter(service => service.isActive).map((service) => {
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
                              selectedAddonServices: (prev.selectedAddonServices || []).filter(id => id !== service._id)
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
            {/* Pricing Summary - Moved to top */}
            {pricing && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                  <CardTitle className="flex items-center space-x-3 text-emerald-900">
                    <Receipt className="h-6 w-6 text-emerald-600" />
                    <span>價格摘要</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Base Price */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">基本價格</span>
                          <div className="text-sm text-gray-600">
                            {parkingTypes.find(t => t._id === formData.parkingTypeId)?.name} • {pricing.durationDays} 天
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(pricing.totalPrice)}</span>
                      </div>
                    </div>

                    {/* Daily Prices Breakdown */}
                    {pricing?.dailyPrices && pricing.dailyPrices.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-blue-700 mb-2">📅 每日價格詳細:</div>
                        <div className="space-y-2">
                          {pricing.dailyPrices.map((dayPrice: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600">
                                  {(() => {
                                    const date = new Date(dayPrice.date);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const weekday = date.getDay();
                                    const weekdayMap = ['天', '一', '二', '三', '四', '五', '六'];
                                    return `${year}/${month}/${day} (星期${weekdayMap[weekday]})`;
                                  })()}
                                </span>
                                {dayPrice.isSpecialPrice && (
                                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200 max-w-32 truncate" title={dayPrice.specialPriceReason}>
                                    💰 {dayPrice.specialPriceReason || '特殊價格'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {dayPrice.isSpecialPrice && (
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatCurrency(dayPrice.originalPrice)}
                                  </span>
                                )}
                                <span className={`font-semibold ${dayPrice.isSpecialPrice ? 'text-orange-600' : 'text-blue-600'}`}>
                                  {formatCurrency(dayPrice.price)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Addon Services */}
                    {formData.selectedAddonServices.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-blue-700 mb-2">🚀 附加服務:</div>
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

                    {/* Luggage Fees */}
                    {formData.luggageCount > 0 && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-purple-700 mb-2">🧳 行李:</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm bg-white p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🧳</span>
                              <span>{formData.luggageCount} 行李</span>
                              {systemSettings?.luggageSettings && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                  {formData.luggageCount <= systemSettings.luggageSettings.freeLuggageCount 
                                    ? '免費' 
                                    : `${systemSettings.luggageSettings.freeLuggageCount} 免費 + ${formData.luggageCount - systemSettings.luggageSettings.freeLuggageCount} 收費`
                                  }
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-purple-600">
                              {(() => {
                                if (!systemSettings?.luggageSettings) return '0';
                                const { freeLuggageCount, luggagePricePerItem } = systemSettings.luggageSettings;
                                const additionalLuggage = Math.max(0, formData.luggageCount - freeLuggageCount);
                                const luggageFee = additionalLuggage * luggagePricePerItem;
                                return formatCurrency(luggageFee);
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* VIP Discount Preview - Always show if user is VIP */}
                    {isVIP && currentUser && (
                      <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">👑 VIP 折扣:</span>
                          <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                            {currentUser.vipDiscount}% 折扣
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
                          <span className="text-green-600">🎫 優惠券:</span>
                          <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded">
                            {discountInfo.code} ({discountInfo.discountType === 'percentage' ? `${discountInfo.discountValue}%` : '固定'})
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
                          <span className="font-semibold text-gray-700">總原價:</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(pricing.totalPrice + ((addonServices || [])
                              .filter(service => formData.selectedAddonServices.includes(service._id))
                              .reduce((sum, service) => sum + service.price, 0)
                            ))}
                          </span>
                        </div>
                        
                        {/* Show total discount if there's any discount */}
                        {(discountInfo && (discountInfo.discountAmount > 0 || discountInfo.vipDiscount > 0)) || (isVIP && currentUser) ? (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-700">總折扣:</span>
                            <span className="font-bold text-green-700 text-lg">
                              -{formatCurrency(
                                discountInfo 
                                  ? (discountInfo.totalDiscount || discountInfo.discountAmount) || 0
                                  : (() => {
                                      const baseTotal = (pricing?.totalPrice || 0) + 
                                        (addonServices
                                          .filter(service => formData.selectedAddonServices.includes(service._id))
                                          .reduce((sum, service) => sum + service.price, 0)
                                        );
                                      
                                      const luggageFee = (() => {
                                        if (!systemSettings?.luggageSettings) return 0;
                                        const { freeLuggageCount, luggagePricePerItem } = systemSettings.luggageSettings;
                                        const additionalLuggage = Math.max(0, formData.luggageCount - freeLuggageCount);
                                        return additionalLuggage * luggagePricePerItem;
                                      })();
                                      
                                      const totalWithLuggage = baseTotal + luggageFee;
                                      return Math.round(totalWithLuggage * (currentUser?.vipDiscount / 100));
                                    })()
                              )}
                            </span>
                          </div>
                        ) : null}
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg text-gray-900">總付款:</span>
                            <span className="text-2xl font-bold text-emerald-600">
                              {(() => {
                                // Calculate base total
                                const baseTotal = (pricing?.totalPrice || 0) + 
                                  (addonServices
                                    .filter(service => formData.selectedAddonServices.includes(service._id))
                                    .reduce((sum, service) => sum + service.price, 0)
                                  );
                                
                                // Calculate luggage fee
                                const luggageFee = (() => {
                                  if (!systemSettings?.luggageSettings) return 0;
                                  const { freeLuggageCount, luggagePricePerItem } = systemSettings.luggageSettings;
                                  const additionalLuggage = Math.max(0, formData.luggageCount - freeLuggageCount);
                                  return additionalLuggage * luggagePricePerItem;
                                })();
                                
                                const totalWithLuggage = baseTotal + luggageFee;
                                
                                if (discountInfo) {
                                  return formatCurrency(discountInfo.finalAmount);
                                } else if (isVIP && currentUser) {
                                  const vipDiscount = totalWithLuggage * (currentUser.vipDiscount / 100);
                                  return formatCurrency(Math.round(totalWithLuggage - vipDiscount));
                                } else {
                                  return formatCurrency(totalWithLuggage);
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                <CardTitle className="flex items-center space-x-3 text-indigo-900">
                  <User className="h-6 w-6 text-indigo-600" />
                  <span>個人資料</span>
                  {isVIP && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      👑 VIP Member 
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-indigo-700">
                  填寫個人資料以完成預約
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* VIP Code Section */}
                {!isVIP && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-800 font-medium">👑 您是VIP會員嗎？</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVIPCodeInput(!showVIPCodeInput)}
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        {showVIPCodeInput ? '隱藏' : '輸入VIP碼'}
                      </Button>
                    </div>
                    
                    {showVIPCodeInput && (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="輸入您的VIP碼"
                            value={vipCode}
                            onChange={(e) => setVipCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleCheckVIPByCode}
                            disabled={vipCodeLoading}
                            className="bg-[#39653f] hover:bg-[#2d4f33] text-white"
                          >
                            {vipCodeLoading ? '正在檢查...' : '檢查'}
                          </Button>
                        </div>
                        <p className="text-xs text-yellow-700">
                          💡 VIP碼格式: 年份 + 電話號碼 (例如: 1140908805805)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Discount Code Section */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-800 font-medium">🎫 您有折扣碼嗎？</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="輸入折扣碼"
                        value={formData.discountCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountCode: e.target.value }))}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleDiscountCodeApply}
                        disabled={!formData.discountCode?.trim() || !formData.parkingTypeId || !formData.checkInTime || !formData.checkOutTime}
                        className="bg-[#39653f] hover:bg-[#2d4f33] text-white"
                      >
                        應用
                      </Button>
                    </div>
                    <p className="text-xs text-green-700">
                      💡 輸入有效的折扣碼以獲得額外優惠
                    </p>
                  </div>
                  
                  {/* Show discount info if applied */}
                  {discountInfo && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600">✅</span>
                        <span className="font-medium text-green-800">折扣已應用！</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>折扣碼:</span>
                          <span className="font-semibold text-green-600">{discountInfo.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>折扣金額:</span>
                          <span className="font-semibold text-green-600">-{formatCurrency(discountInfo.discountAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>最終金額:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(discountInfo.finalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="driverName" className="text-sm font-medium text-gray-700">您的姓名 *</Label>
                    <Input
                      id="driverName"
                      value={formData.driverName}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                      placeholder="輸入您的姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">電話號碼 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="輸入電話號碼"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">信箱 *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="輸入電子郵件"
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
                        ✨ 歡迎VIP會員！您自動享有{currentUser.vipDiscount}%折扣。
                      </div>
                    )}
                    {!isVIP && formData.email && !currentUser && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        ℹ️ 普通客戶 - 無VIP優惠
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate" className="text-sm font-medium text-gray-700">車牌號碼 *</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                      placeholder="輸入車牌號碼"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="passengerCount" className="text-sm font-medium text-gray-700">接駁人數</Label>
                    <Input
                      id="passengerCount"
                      type="number"
                      min="1"
                      value={formData.passengerCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, passengerCount: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="luggageCount" className="text-sm font-medium text-gray-700">行李數量（免費1個，第2個以上每一個加100元）
                    </Label>
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
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">備註</Label>  
                  <Textarea
                    id="notes"
                    placeholder="輸入備註 (如果有的話)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

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
                    我同意所有預約條款和條件
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
              重試
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
                      ? 'bg-[#39653f] border-[#39653f] text-white shadow-lg' 
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
                      currentStep > step.id ? 'bg-[#39653f]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Information */}
          {currentStep >= 2 && formData.checkInTime && formData.checkOutTime && (
            <div className="mb-6">
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">已選擇時間:</h3>
                        <div className="flex items-center space-x-4 text-sm text-blue-800">
                          <span>
                            <strong>進入:</strong> {(() => {
                              const date = new Date(formData.checkInTime);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const weekday = date.getDay();
                              const weekdayMap = ['天', '一', '二', '三', '四', '五', '六'];
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              return `${year}/${month}/${day} (星期${weekdayMap[weekday]}) ${hours}:${minutes}`;
                            })()}
                          </span>
                          <span className="text-blue-600">→</span>
                          <span>
                            <strong>離開:</strong> {(() => {
                              const date = new Date(formData.checkOutTime);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const weekday = date.getDay();
                              const weekdayMap = ['天', '一', '二', '三', '四', '五', '六'];
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              return `${year}/${month}/${day} (星期${weekdayMap[weekday]}) ${hours}:${minutes}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {formData.parkingTypeId && (
                      <div className="text-right">
                        <div className="text-sm text-blue-700">
                          <strong>停車場:</strong> {parkingTypes.find(pt => pt._id === formData.parkingTypeId)?.name || '未選擇'}
                        </div>
                        <div className="text-xs text-blue-600">
                          {(() => {
                            const checkIn = new Date(formData.checkInTime);
                            const checkOut = new Date(formData.checkOutTime);
                            const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return `${diffDays} 天`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
              返回
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={
                (currentStep === 1 && !formData.agreedToTerms) ||
                (currentStep === 2 && !formData.parkingTypeId) ||
                (currentStep === 2 && (!formData.checkInTime || !formData.checkOutTime)) ||
                (currentStep === 2 && maintenanceDays.length > 0)
              }
              className="px-8 py-3 bg-[#39653f] hover:bg-[#2d4f33]"
            >
                  下一步
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.termsAccepted}
                  className="px-8 py-3 bg-[#39653f] hover:bg-[#2d4f33]"
                >
                  {loading ? '正在處理...' : '完成預約'}
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