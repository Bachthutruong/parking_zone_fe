import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
//   Calendar, 
//   Clock, 
//   Car, 
  MapPin, 
//   Building, 
//   Sun, 
//   Accessibility,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowLeft,
  ArrowRight,
//   Phone,
//   Mail,
  User,
//   CreditCard,
  Receipt,
//   Plus,
//   Minus,
  ShoppingCart,
  Tag,
  FileText,
  Shield,
//   Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSystemSettings, getParkingLots, getAllAddonServices as getAddonServices, createBooking } from '@/services';
import type { SystemSettings, ParkingLot, AddonService, BookingFormData } from '@/types';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ConflictNotification from '@/components/ConflictNotification';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  console.log(availableSlots, 'availableSlots');
  const [pricing, setPricing] = useState<any>(null);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
//   const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictingDays, setConflictingDays] = useState<string[]>([]);
  
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
      const [settings, lots, services] = await Promise.all([
        getSystemSettings(),
        getParkingLots(),
        getAddonServices()
      ]);
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
    } else {
      // Clear availability data when no parking lot or time is selected
      setAvailableSlots([]);
      setPricing(null);
      setConflictingDays([]);
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
        const response = await fetch('/api/bookings/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parkingLotId: formData.parkingLotId,
            checkInTime: `${dateStr}T00:00:00.000Z`,
            checkOutTime: `${dateStr}T23:59:59.999Z`
          })
        });
        
        const data = await response.json();
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

  const handleDiscountCodeApply = async () => {
    if (!formData.discountCode?.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      const response = await fetch('/api/bookings/apply-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountCode: formData.discountCode,
          parkingLotId: formData.parkingLotId,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          addonServices: formData.selectedAddonServices
        })
      });

      const data = await response.json();
      if (data.success) {
        setDiscountInfo(data.discountInfo);
        toast.success('Áp dụng mã giảm giá thành công!');
      } else {
        toast.error(data.message || 'Mã giảm giá không hợp lệ');
        setDiscountInfo(null);
      }
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
    
    const durationMs = checkOut.getTime() - checkIn.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    // Calculate total days (minimum 1 day)
    const daysToCharge = Math.max(1, durationDays);
    
    const basePrice = selectedLot.pricePerDay * daysToCharge;
    
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

  const getDurationText = () => {
    if (!formData.checkInTime || !formData.checkOutTime) return '';
    
    const checkIn = new Date(formData.checkInTime);
    const checkOut = new Date(formData.checkOutTime);
    const durationDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Ensure minimum 1 day
    const totalDays = Math.max(1, durationDays);
    
    if (totalDays < 30) { // Assuming 30 days is a reasonable threshold for days
      return `${totalDays} ngày`;
    } else {
      const months = Math.floor(totalDays / 30);
      const days = totalDays % 30;
      if (days === 0) {
        return `${months} tháng`;
      } else {
        return `${months} tháng ${days} ngày`;
      }
    }
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
        discountCode: discountInfo ? formData.discountCode || '' : undefined,
        estimatedArrivalTime: formData.estimatedArrivalTime,
        flightNumber: formData.flightNumber,
        notes: formData.notes,
        termsAccepted: formData.agreedToTerms
      };
      
      const result = await createBooking(bookingData);
      
      // Prepare confirmation data
      const selectedLot = parkingLots.find(lot => lot._id === formData.parkingLotId);
      const selectedAddonServices = formData.selectedAddonServices.map(serviceId => {
        const service = addonServices.find(s => s._id === serviceId);
        return {
          name: service?.name || '',
          price: service?.price || 0,
          icon: service?.icon || ''
        };
      });

      const confirmationData = {
        bookingId: result.booking._id,
        bookingNumber: result.booking.bookingNumber,
        parkingLot: {
          name: selectedLot?.name || '',
          type: selectedLot?.type || '',
          location: selectedLot?.location || ''
        },
        driverName: formData.driverName,
        phone: formData.phone,
        email: formData.email,
        licensePlate: formData.licensePlate,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        durationDays: pricing?.durationDays || 1,
        totalAmount: result.booking.totalAmount,
        finalAmount: result.booking.finalAmount,
        addonServices: selectedAddonServices,
        discountAmount: result.booking.discountAmount || 0,
        paymentMethod: result.booking.paymentMethod || 'cash',
        status: result.booking.status
      };

      toast.success('Đặt chỗ thành công!');
      
      // Navigate to confirmation page with data
      navigate('/booking-confirmation', { 
        state: { bookingData: confirmationData } 
      });
      
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
    // const typeConfig = systemSettings?.parkingLotTypes.find(t => t.type === type);
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


  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Điều khoản và quy định</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: systemSettings?.bookingTerms || 'Đang tải điều khoản...' }} />
                </div>
                <Separator />
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: systemSettings?.bookingRules || 'Đang tải quy định...' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span>Chọn bãi đậu xe và thời gian</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parking Lot Type Selection */}
                <div>
                  <Label className="text-base font-medium">Loại bãi đậu xe</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {systemSettings?.parkingLotTypes?.filter(type => type.isActive).map((type) => {
                      const lotsOfType = parkingLots.filter(lot => lot.type === type.type);
                      const isSelected = formData.selectedParkingType === type.type;
                      
                      return (
                        <Card 
                          key={type.type}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                          }`}
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              selectedParkingType: type.type,
                              parkingLotId: '' // Reset parking lot selection when changing type
                            }));
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">{type.icon}</div>
                              <div>
                                <h3 className="font-medium">{type.name}</h3>
                                <p className="text-sm text-gray-600">{type.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {lotsOfType.length} bãi có sẵn
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Available Parking Lots */}
                {formData.selectedParkingType && parkingLots.length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Bãi đậu xe khả dụng - {systemSettings?.parkingLotTypes?.find(t => t.type === formData.selectedParkingType)?.name}</Label>
                    <div className="mt-3 space-y-3">
                      {parkingLots
                        .filter(lot => lot.type === formData.selectedParkingType)
                        .map((lot) => (
                          <Card 
                            key={lot._id} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              formData.parkingLotId === lot._id ? 'border-2 border-blue-200 bg-blue-50/50' : 'border-gray-200'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, parkingLotId: lot._id }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="text-2xl">{getParkingLotTypeIcon(lot.type)}</div>
                                  <div>
                                    <h3 className="font-medium">{lot.name}</h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {getParkingLotTypeBadge(lot.type)}
                                      <span className="text-sm text-gray-600">
                                        {lot.totalSpaces} chỗ (kiểm tra lịch để biết chỗ trống)
                                      </span>
                                    </div>
                                    {lot.description && (
                                      <p className="text-sm text-gray-600 mt-1">{safeText(lot.description)}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-blue-600">
                                    {formatCurrency(lot.pricePerDay)}/ngày
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInTime">Thời gian vào bãi</Label>
                    <Input
                      id="checkInTime"
                      type="datetime-local"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOutTime">Thời gian rời bãi</Label>
                    <Input
                      id="checkOutTime"
                      type="datetime-local"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Booking Information */}
                {pricing && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-green-800">
                        <Info className="h-5 w-5" />
                        <span>Thông tin đặt chỗ</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Thời gian:</span>
                        <span className="font-medium">
                          {formatDateTime(formData.checkInTime)} - {formatDateTime(formData.checkOutTime)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Thời lượng:</span>
                        <span className="font-medium">{getDurationText()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phí cơ bản:</span>
                        <span className="font-bold text-green-600">{formatCurrency(pricing.totalPrice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Availability Calendar */}
                {formData.parkingLotId && formData.checkInTime && formData.checkOutTime && (
                  <AvailabilityCalendar
                    parkingLotId={formData.parkingLotId}
                    checkInTime={formData.checkInTime}
                    checkOutTime={formData.checkOutTime}
                    onDateSelect={(date) => {
                      console.log('Selected date:', date);
                    }}
                    onDateRangeSelect={(checkIn, checkOut) => {
                      // Convert date strings to datetime-local format
                      const checkInDateTime = `${checkIn}T09:00`;
                      const checkOutDateTime = `${checkOut}T18:00`;
                      
                      setFormData(prev => ({
                        ...prev,
                        checkInTime: checkInDateTime,
                        checkOutTime: checkOutDateTime
                      }));
                      
                      toast.success(`Đã chọn khoảng thời gian: ${new Date(checkIn).toLocaleDateString('vi-VN')} - ${new Date(checkOut).toLocaleDateString('vi-VN')}`);
                    }}
                  />
                )}

                {/* Conflict Notification */}
                {conflictingDays.length > 0 && formData.checkInTime && formData.checkOutTime && (
                  <ConflictNotification
                    checkInTime={formData.checkInTime}
                    checkOutTime={formData.checkOutTime}
                    conflictingDays={conflictingDays}
                    totalDays={Math.ceil((new Date(formData.checkOutTime).getTime() - new Date(formData.checkInTime).getTime()) / (1000 * 60 * 60 * 24))}
                    availableDays={Math.ceil((new Date(formData.checkOutTime).getTime() - new Date(formData.checkInTime).getTime()) / (1000 * 60 * 60 * 24)) - conflictingDays.length}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <span>Dịch vụ bổ sung</span>
                </CardTitle>
                <CardDescription>
                  Chọn các dịch vụ bổ sung cho chuyến đi của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addonServices
                    .filter(service => service.isActive)
                    .map((service) => (
                      <Card 
                        key={service._id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.selectedAddonServices.includes(service._id) 
                            ? 'border-blue-200 bg-blue-50/50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedAddonServices: prev.selectedAddonServices.includes(service._id)
                              ? prev.selectedAddonServices.filter(id => id !== service._id)
                              : [...prev.selectedAddonServices, service._id]
                          }));
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{service.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-medium">{service.name}</h3>
                              <p className="text-sm text-gray-600">{service.description}</p>
                              <p className="text-lg font-bold text-blue-600 mt-2">
                                {formatCurrency(service.price)}
                              </p>
                            </div>
                            {formData.selectedAddonServices.includes(service._id) && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <span>Mã giảm giá</span>
                </CardTitle>
                <CardDescription>
                  Nhập mã giảm giá nếu bạn có
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nhập mã giảm giá"
                    value={formData.discountCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountCode: e.target.value }))}
                  />
                  <Button onClick={handleDiscountCodeApply} disabled={!formData.discountCode?.trim()}>
                    Áp dụng
                  </Button>
                </div>
                
                {discountInfo && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Mã giảm giá đã được áp dụng!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Giảm {discountInfo.type === 'percentage' ? `${discountInfo.value}%` : formatCurrency(discountInfo.value)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Thông tin cá nhân</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driverName">Tên tài xế *</Label>
                    <Input
                      id="driverName"
                      value={formData.driverName}
                      onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                      placeholder="Nhập tên tài xế"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">Biển số xe *</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                      placeholder="Nhập biển số xe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Nhập email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passengerCount">Số hành khách</Label>
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
                    <Label htmlFor="luggageCount">Số hành lý</Label>
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

                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ghi chú thêm (tùy chọn)"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreedToTerms: checked as boolean }))}
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm">
                    Tôi đồng ý với <span className="text-blue-600 hover:underline cursor-pointer">điều khoản và quy định</span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span>Tóm tắt đơn hàng</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phí cơ bản ({pricing?.durationDays || 0} ngày)</span>
                  <span className="font-semibold">{formatCurrency(calculateBasePrice())}</span>
                </div>
                
                {formData.selectedAddonServices.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Dịch vụ bổ sung:</p>
                      {formData.selectedAddonServices.map(serviceId => {
                        const service = addonServices.find(s => s._id === serviceId);
                        return (
                          <div key={serviceId} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{service?.name}</span>
                            <span>{formatCurrency(service?.price || 0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                
                {discountInfo && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center text-green-600">
                      <span>Giảm giá</span>
                      <span>-{discountInfo.type === 'percentage' ? `${discountInfo.value}%` : formatCurrency(discountInfo.value)}</span>
                    </div>
                  </>
                )}
                
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return true; // Always can proceed from terms
      case 2:
        // Check if there are major conflicts
        const totalDays = formData.checkInTime && formData.checkOutTime ? 
          Math.ceil((new Date(formData.checkOutTime).getTime() - new Date(formData.checkInTime).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const conflictRatio = totalDays > 0 ? conflictingDays.length / totalDays : 0;
        
        return formData.parkingLotId && 
               formData.checkInTime && 
               formData.checkOutTime && 
               pricing && 
               conflictRatio < 0.5; // Allow if less than 50% conflicts
      case 3:
        return true; // Services are optional
      case 4:
        return true; // Discount is optional
      case 5:
        return formData.driverName && formData.phone && formData.email && formData.licensePlate && formData.agreedToTerms;
      default:
        return false;
    }
  };

  const canGoBack = () => {
    return currentStep > 1;
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else if (currentStep === 2) {
      // Show specific message for step 2 conflicts
      const totalDays = formData.checkInTime && formData.checkOutTime ? 
        Math.ceil((new Date(formData.checkOutTime).getTime() - new Date(formData.checkInTime).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const conflictRatio = totalDays > 0 ? conflictingDays.length / totalDays : 0;
      
      if (conflictRatio >= 0.5) {
        toast.error('Có quá nhiều ngày xung đột. Vui lòng chọn khoảng thời gian khác.');
      } else if (!formData.parkingLotId || !formData.checkInTime || !formData.checkOutTime) {
        toast.error('Vui lòng chọn đầy đủ thông tin bãi đậu xe và thời gian.');
      } else if (!pricing) {
        toast.error('Vui lòng chờ hệ thống tính toán giá.');
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadInitialData}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đặt chỗ đậu xe</h1>
          <p className="text-gray-600">Chọn bãi đậu xe và thời gian phù hợp</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={!canGoBack()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </Button>

          {currentStep === 5 ? (
            <Button
              onClick={handleSubmitBooking}
              disabled={!canProceedToNext() || loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>Đặt chỗ</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 