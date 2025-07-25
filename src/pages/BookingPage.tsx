import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
//   Calendar,
  Clock,
  Car,
  User,
//   Phone,
//   Mail,
  Package,
//   Users,
//   Plane,
  CheckCircle,
//   AlertCircle,
  Info,
  CreditCard,
//   MapPin,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Check,
//   X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSystemSettings } from '@/services/systemSettings';
import { getParkingLots } from '@/services/parking';
import { getAllAddonServices as getAddonServices } from '@/services/addonServices';
import { createBooking } from '@/services/booking';
import { validateDiscountCode } from '@/services/discountCodes';
import type { SystemSettings, ParkingLot, AddonService } from '@/types';

interface BookingFormData {
  // Step 1: Terms agreement
  agreedToTerms: boolean;
  
  // Step 2: Parking selection
  parkingLotId: string;
  checkInTime: string;
  checkOutTime: string;
  
  // Step 3: Addon services
  selectedAddonServices: string[];
  
  // Step 4: Discount code
  discountCode: string;
  
  // Step 5: Customer information
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  passengerCount: number;
  luggageCount: number;
  estimatedArrivalTime?: string;
  flightNumber?: string;
  notes?: string;
}

const BookingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  console.log(pricing, 'pricing');
  console.log(availableSlots, 'availableSlots');
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BookingFormData>({
    agreedToTerms: false,
    parkingLotId: '',
    checkInTime: '',
    checkOutTime: '',
    selectedAddonServices: [],
    discountCode: '',
    driverName: '',
    phone: '',
    email: '',
    licensePlate: '',
    passengerCount: 1,
    luggageCount: 0
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settings, lots, services] = await Promise.all([
        getSystemSettings(),
        getParkingLots(),
        getAddonServices()
      ]);
      console.log(settings, 'settings');
      setSystemSettings(settings);
      setParkingLots(lots);
      setAddonServices(services);
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError('Không thể tải dữ liệu hệ thống');
      toast.error('Không thể tải dữ liệu hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // Check availability when parking lot or time changes
  useEffect(() => {
    if (formData.parkingLotId && formData.checkInTime && formData.checkOutTime) {
      checkAvailability();
    }
  }, [formData.parkingLotId, formData.checkInTime, formData.checkOutTime]);

  const checkAvailability = async () => {
    try {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkingLotId: formData.parkingLotId,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.availableSlots);
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const handleDiscountCodeApply = async () => {
    if (!formData.discountCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      const discount = await validateDiscountCode({
        code: formData.discountCode,
        amount: calculateBasePrice() || 0
      });
      
      // Validate and clean discount data
      const validateDiscountData = (data: any) => {
        const clean = {
          code: '',
          type: 'percentage',
          value: 0,
          expiryDate: new Date().toISOString(),
          description: ''
        };

        try {
          if (data.code && typeof data.code === 'string') clean.code = data.code;
          else if (data.discountCode && typeof data.discountCode === 'string') clean.code = data.discountCode;
          else clean.code = formData.discountCode;

          if (data.type && typeof data.type === 'string') clean.type = data.type;
          else if (data.discountType && typeof data.discountType === 'string') clean.type = data.discountType;

          if (data.value && typeof data.value === 'number') clean.value = data.value;
          else if (data.discountValue && typeof data.discountValue === 'number') clean.value = data.discountValue;

          if (data.expiryDate) clean.expiryDate = data.expiryDate;
          else if (data.validTo) clean.expiryDate = data.validTo;

          if (data.description && typeof data.description === 'string') clean.description = data.description;
        } catch (error) {
          console.error('Error validating discount data:', error);
        }

        return clean;
      };

      const formattedDiscount = validateDiscountData(discount);
      
      // Debug log
      console.log('Original discount response:', discount);
      console.log('Formatted discount:', formattedDiscount);
      
      setDiscountInfo(formattedDiscount);
      toast.success('Mã giảm giá hợp lệ!');
    } catch (error: any) {
      toast.error(error.message || 'Mã giảm giá không hợp lệ');
      setDiscountInfo(null);
    }
  };

  // Calculate base price based on time duration
  const calculateBasePrice = () => {
    if (!formData.checkInTime || !formData.checkOutTime || !formData.parkingLotId) {
      return 0;
    }

    const selectedLot = parkingLots.find(lot => lot._id === formData.parkingLotId);
    if (!selectedLot) return 0;

    const checkIn = new Date(formData.checkInTime);
    const checkOut = new Date(formData.checkOutTime);
    
    // Validate dates
    if (checkOut <= checkIn) {
      return 0;
    }
    
    const durationHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    
    // Calculate total hours (minimum 1 hour)
    const totalHours = Math.max(1, Math.ceil(durationHours));
    
    const basePrice = selectedLot.basePrice * totalHours;
    
    // Debug log
    console.log('Price calculation:', {
      checkIn: formData.checkInTime,
      checkOut: formData.checkOutTime,
      durationHours,
      totalHours,
      basePricePerHour: selectedLot.basePrice,
      totalBasePrice: basePrice
    });
    
    return basePrice;
  };

  const calculateTotal = () => {
    const basePrice = calculateBasePrice();
    if (basePrice === 0) return 0;
    
    let total = basePrice;
    
    // Add addon services
    formData.selectedAddonServices.forEach(serviceId => {
      const service = addonServices.find(s => s._id === serviceId);
      if (service) {
        total += service.price;
      }
    });
    
    // Apply discount
    if (discountInfo && discountInfo.value) {
      if (discountInfo.type === 'percentage') {
        const discountAmount = (total * discountInfo.value / 100);
        total -= discountAmount;
      } else {
        total -= discountInfo.value;
      }
    }
    
    return Math.max(0, total);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.agreedToTerms) {
      toast.error('Vui lòng đồng ý với các quy định');
      return;
    }
    
    if (currentStep === 2) {
      if (!formData.parkingLotId || !formData.checkInTime || !formData.checkOutTime) {
        toast.error('Vui lòng chọn đầy đủ thông tin bãi đậu xe');
        return;
      }
      
      // Validate time
      const checkIn = new Date(formData.checkInTime);
      const checkOut = new Date(formData.checkOutTime);
      if (checkOut <= checkIn) {
        toast.error('Thời gian rời bãi phải lớn hơn thời gian vào bãi');
        return;
      }
      
      // Validate minimum duration (1 hour)
      const durationHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      if (durationHours < 1) {
        toast.error('Thời gian đặt chỗ tối thiểu là 1 giờ');
        return;
      }
    }
    
    if (currentStep === 5) {
      // Validate customer information
      if (!formData.driverName || !formData.phone || !formData.licensePlate) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      setShowConfirmationDialog(true);
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      
      const bookingData = {
        parkingLotId: formData.parkingLotId,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        driverName: formData.driverName,
        phone: formData.phone,
        email: formData.email,
        licensePlate: formData.licensePlate,
        passengerCount: formData.passengerCount,
        luggageCount: formData.luggageCount,
        addonServices: formData.selectedAddonServices,
        discountCode: discountInfo ? formData.discountCode : undefined,
        estimatedArrivalTime: formData.estimatedArrivalTime,
        flightNumber: formData.flightNumber,
        notes: formData.notes,
        termsAccepted: formData.agreedToTerms
      };
      
      const result = await createBooking(bookingData);
      console.log(result, 'result');
      toast.success('Đặt chỗ thành công!');
      
      // Reset form and redirect
      setFormData({
        agreedToTerms: false,
        parkingLotId: '',
        checkInTime: '',
        checkOutTime: '',
        selectedAddonServices: [],
        discountCode: '',
        driverName: '',
        phone: '',
        email: '',
        licensePlate: '',
        passengerCount: 1,
        luggageCount: 0
      });
      setCurrentStep(1);
      setShowConfirmationDialog(false);
      
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  const getParkingLotTypeIcon = (type: string) => {
    const typeConfig = systemSettings?.parkingLotTypes.find(t => t.type === type);
    return typeConfig?.icon || '🚗';
  };

  const getParkingLotTypeBadge = (type: string) => {
    const typeConfig = systemSettings?.parkingLotTypes.find(t => t.type === type);
    console.log(typeConfig, 'typeConfig');
    const badgeConfig = {
      indoor: { label: 'Trong nhà', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      outdoor: { label: 'Ngoài trời', variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      disabled: { label: 'Khuyết tật', variant: 'outline' as const, color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.indoor;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
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

  // Debug function to log all data
  const debugData = () => {
    console.log('Current state:', {
      parkingLots,
      addonServices,
      discountInfo,
      formData
    });
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

  const getDurationText = () => {
    if (!formData.checkInTime || !formData.checkOutTime) return '';
    
    const checkIn = new Date(formData.checkInTime);
    const checkOut = new Date(formData.checkOutTime);
    const durationHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    
    // Ensure minimum 1 hour
    const totalHours = Math.max(1, Math.ceil(durationHours));
    
    if (totalHours < 24) {
      return `${totalHours} giờ`;
    } else {
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      if (hours === 0) {
        return `${days} ngày`;
      } else {
        return `${days} ngày ${hours} giờ`;
      }
    }
  };

  if (loading && !systemSettings) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Lỗi</h2>
          <p className="text-red-700">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2"
            variant="outline"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Đặt chỗ đậu xe</h1>
        <p className="text-gray-600">Hoàn thành các bước để đặt chỗ đậu xe</p>
        {process.env.NODE_ENV === 'development' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={debugData}
            className="mt-2"
          >
            Debug Data
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 5 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Quy định</span>
          <span>Chọn bãi</span>
          <span>Dịch vụ</span>
          <span>Giảm giá</span>
          <span>Thông tin</span>
        </div>
      </div>

      {/* Step 1: Terms and Conditions */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Quy định và điều khoản</span>
            </CardTitle>
            <CardDescription>
              Vui lòng đọc kỹ các quy định trước khi đặt chỗ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Lưu ý quan trọng:</h4>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {systemSettings?.bookingTerms || 'Vui lòng đọc kỹ các quy định và điều khoản trước khi đặt chỗ đậu xe.'}
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Quy định bãi đậu xe:</h4>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {systemSettings?.bookingRules || `1. Khách hàng phải đến đúng giờ đã đặt.
2. Không được để xe quá thời gian đã đặt.
3. Tuân thủ các quy định an toàn của bãi đậu xe.
4. Khách hàng chịu trách nhiệm về tài sản trong xe.
5. Bãi đậu xe không chịu trách nhiệm về thiệt hại do thiên tai.`}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreedToTerms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, agreedToTerms: checked as boolean }))
                }
              />
              <Label htmlFor="agreedToTerms" className="text-sm">
                Tôi đã đọc và đồng ý với các quy định trên
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Parking Selection */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Chọn bãi đậu xe và thời gian</span>
            </CardTitle>
            <CardDescription>
              Chọn loại bãi đậu xe và thời gian vào/rời bãi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parking Lot Selection */}
            <div>
              <Label className="text-base font-medium">Loại bãi đậu xe</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {parkingLots.map((lot) => (
                  <Card
                    key={lot._id}
                    className={`cursor-pointer transition-all ${
                      formData.parkingLotId === lot._id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, parkingLotId: lot._id }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{getParkingLotTypeIcon(lot.type)}</span>
                        {getParkingLotTypeBadge(lot.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{safeText(lot.name)}</h4>
                        <p className="text-sm text-gray-600 mb-2">{safeText(lot.description)}</p>
                        <p className="text-sm font-medium text-blue-600">
                          {formatCurrency(lot.basePrice)}/giờ
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInTime">Thời gian vào bãi</Label>
                <Input
                  id="checkInTime"
                  type="datetime-local"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Thời gian rời bãi</Label>
                <Input
                  id="checkOutTime"
                  type="datetime-local"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  min={formData.checkInTime || new Date().toISOString().slice(0, 16)}
                />
                {formData.checkInTime && formData.checkOutTime && 
                 new Date(formData.checkOutTime) <= new Date(formData.checkInTime) && (
                  <p className="text-red-500 text-sm mt-1">Thời gian rời bãi phải lớn hơn thời gian vào bãi</p>
                )}
              </div>
            </div>

            {/* Duration and Pricing Preview */}
            {formData.checkInTime && formData.checkOutTime && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Thông tin đặt chỗ</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Thời gian: {formatDateTime(formData.checkInTime)} - {formatDateTime(formData.checkOutTime)}</p>
                  <p>Thời lượng: {getDurationText()}</p>
                  {formData.parkingLotId && (
                    <p>Phí cơ bản: {formatCurrency(calculateBasePrice())}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Addon Services */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Dịch vụ bổ sung</span>
            </CardTitle>
            <CardDescription>
              Chọn các dịch vụ bổ sung (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addonServices.map((service) => (
                <Card
                  key={service._id}
                  className={`cursor-pointer transition-all ${
                    formData.selectedAddonServices.includes(service._id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    const isSelected = formData.selectedAddonServices.includes(service._id);
                    setFormData(prev => ({
                      ...prev,
                      selectedAddonServices: isSelected
                        ? prev.selectedAddonServices.filter(id => id !== service._id)
                        : [...prev.selectedAddonServices, service._id]
                    }));
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{service.icon || '📦'}</span>
                        <div>
                          <h4 className="font-semibold">{safeText(service.name) || 'Dịch vụ'}</h4>
                          <p className="text-sm text-gray-600">{safeText(service.description) || 'Mô tả dịch vụ'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-600">
                          {service.price === 0 ? 'Miễn phí' : formatCurrency(service.price)}
                        </p>
                        {formData.selectedAddonServices.includes(service._id) && (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Discount Code */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Mã giảm giá</span>
            </CardTitle>
            <CardDescription>
              Nhập mã giảm giá nếu có (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="discountCode">Mã giảm giá</Label>
                <Input
                  id="discountCode"
                  placeholder="Nhập mã giảm giá"
                  value={formData.discountCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountCode: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleDiscountCodeApply}>
                  Áp dụng
                </Button>
              </div>
            </div>

            {discountInfo && discountInfo.code && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Mã giảm giá hợp lệ</span>
                </div>
                <div className="text-sm text-green-700">
                  {(() => {
                    try {
                      return (
                        <>
                          <p>Mã: {safeText(discountInfo.code)}</p>
                          <p>Giảm giá: {discountInfo.type === 'percentage' ? `${discountInfo.value || 0}%` : formatCurrency(discountInfo.value || 0)}</p>
                          {discountInfo.expiryDate && (
                            <p>Hạn sử dụng: {new Date(discountInfo.expiryDate).toLocaleDateString('vi-VN')}</p>
                          )}
                        </>
                      );
                    } catch (error) {
                      console.error('Error rendering discount info:', error);
                      return <p>Lỗi hiển thị thông tin mã giảm giá</p>;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Tóm tắt giá</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Phí đậu xe ({getDurationText()}):</span>
                  <span>{formatCurrency(calculateBasePrice())}</span>
                </div>
                {formData.selectedAddonServices.length > 0 && (
                  <div className="flex justify-between">
                    <span>Dịch vụ bổ sung:</span>
                    <span>{formatCurrency(
                      formData.selectedAddonServices.reduce((total, serviceId) => {
                        const service = addonServices.find(s => s._id === serviceId);
                        return total + (service?.price || 0);
                      }, 0)
                    )}</span>
                  </div>
                )}
                {discountInfo && discountInfo.value && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{discountInfo.type === 'percentage' ? 
                      formatCurrency((calculateBasePrice() * discountInfo.value / 100)) : 
                      formatCurrency(discountInfo.value)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Customer Information */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Thông tin khách hàng</span>
            </CardTitle>
            <CardDescription>
              Điền thông tin cá nhân để hoàn tất đặt chỗ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverName">Họ tên tài xế *</Label>
                <Input
                  id="driverName"
                  placeholder="Nhập họ tên"
                  value={formData.driverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">Biển số xe *</Label>
                <Input
                  id="licensePlate"
                  placeholder="Nhập biển số xe"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            {/* Passenger and Luggage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passengerCount">Số lượng hành khách</Label>
                <Select
                  value={formData.passengerCount.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, passengerCount: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} người
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="luggageCount">Số lượng hành lý</Label>
                <Select
                  value={formData.luggageCount.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, luggageCount: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} kiện
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedArrivalTime">Thời gian dự kiến đến</Label>
                <Input
                  id="estimatedArrivalTime"
                  type="datetime-local"
                  value={formData.estimatedArrivalTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedArrivalTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="flightNumber">Số chuyến bay</Label>
                <Input
                  id="flightNumber"
                  placeholder="Nhập số chuyến bay"
                  value={formData.flightNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm (nếu có)"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        
        <Button
          onClick={handleNextStep}
          disabled={loading}
        >
          {currentStep === 5 ? (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Gửi đặt chỗ
            </>
          ) : (
            <>
              Tiếp tục
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xác nhận đặt chỗ</DialogTitle>
            <DialogDescription>
              Vui lòng kiểm tra lại thông tin trước khi xác nhận
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Thông tin đặt chỗ:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Bãi đậu:</strong> {parkingLots.find(l => l._id === formData.parkingLotId)?.name}</p>
                <p><strong>Thời gian:</strong> {formatDateTime(formData.checkInTime)} - {formatDateTime(formData.checkOutTime)}</p>
                <p><strong>Thời lượng:</strong> {getDurationText()}</p>
                <p><strong>Tổng tiền:</strong> {formatCurrency(calculateTotal())}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Thông tin khách hàng:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Tên:</strong> {formData.driverName}</p>
                <p><strong>Điện thoại:</strong> {formData.phone}</p>
                <p><strong>Biển số:</strong> {formData.licensePlate}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmitBooking} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Xác nhận đặt chỗ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage; 