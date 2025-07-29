import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  // Calendar,
  Car,
  User,
  // Phone,
  // Mail,
  CreditCard,
  Clock,
  // DollarSign,
  // AlertTriangle,
  CheckCircle,
  Tag,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllParkingTypes, getAllAddonServices, createManualBooking } from '@/services/admin';
import { calculatePrice } from '@/services/booking';
// import { validateDiscountCode } from '@/services/discountCodes';
import { checkParkingTypeMaintenance } from '@/services/maintenance';
import { checkVIPStatus } from '@/services/auth';
import { api } from '@/services';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ConflictNotification from '@/components/ConflictNotification';

interface AddonService {
  _id: string;
  name: string;
  price: number;
  icon: string;
  description?: string;
}

const AdminManualBooking: React.FC = () => {
  const [parkingTypes, setParkingTypes] = useState<any[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  
  // New state variables for availability and pricing
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  console.log(availableSlots);
  const [pricing, setPricing] = useState<any>(null);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [conflictingDays, setConflictingDays] = useState<string[]>([]);
  const [maintenanceDays, setMaintenanceDays] = useState<any[]>([]);
  const [isVIP, setIsVIP] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    parkingTypeId: '',
    checkInTime: '',
    checkOutTime: '',
    driverName: '',
    phone: '',
    email: '',
    licensePlate: '',
    passengerCount: 1,
    luggageCount: 0,
    selectedAddonServices: [] as string[],
    discountCode: '',
    estimatedArrivalTime: '',
    flightNumber: '',
    notes: '',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    status: 'confirmed'
  });

  useEffect(() => {
    loadData();
  }, []);

  // Check availability when parking type or time changes
  useEffect(() => {
    if (formData.parkingTypeId && formData.checkInTime && formData.checkOutTime) {
      checkAvailabilityAndPricing();
      checkMaintenanceForSelectedDates();
    } else {
      // Clear availability data when no parking type or time is selected
      setAvailableSlots([]);
      setPricing(null);
      setConflictingDays([]);
      setMaintenanceDays([]);
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

  // Recalculate pricing when addon services change
  useEffect(() => {
    if (formData.parkingTypeId && formData.checkInTime && formData.checkOutTime) {
      calculatePricing();
    }
  }, [formData.selectedAddonServices, formData.discountCode, isVIP]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [parkingTypesData, addonServicesData] = await Promise.all([
        getAllParkingTypes(),
        getAllAddonServices()
      ]);
      
      setParkingTypes(parkingTypesData.parkingTypes);
      setAddonServices(addonServicesData.services);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailabilityAndPricing = async () => {
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
        
        // Calculate pricing with addon services and discounts
        await calculatePricing();
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

  const calculatePricing = async () => {
    if (!formData.parkingTypeId || !formData.checkInTime || !formData.checkOutTime) {
      return;
    }

    try {
      const pricingData = await calculatePrice({
        parkingTypeId: formData.parkingTypeId,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        addonServices: formData.selectedAddonServices,
        discountCode: formData.discountCode,
        isVIP: isVIP,
        userEmail: formData.email
      });
      
      // The backend returns pricing data under a 'pricing' property
      setPricing(pricingData.pricing);
    } catch (error) {
      console.error('Error calculating pricing:', error);
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
        toast.error('Bãi đậu xe này đang bảo trì trong thời gian đã chọn');
      }
    } catch (error) {
      console.error('Error checking maintenance:', error);
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
        toast.success(`🎉 Chào mừng VIP Member! Bạn được hưởng ${storedUser.vipDiscount || 0}% giảm giá!`);
        return;
      }
      
      // Check VIP status from backend
      const response = await checkVIPStatus(email);
      
      if (response.success && response.user && response.user.isVIP) {
        setCurrentUser(response.user);
        setIsVIP(true);
        toast.success(`🎉 Chào mừng VIP Member! Bạn được hưởng ${response.user.vipDiscount || 0}% giảm giá!`);
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
      // Don't show authentication errors for public booking
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để sử dụng mã giảm giá');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Không thể áp dụng mã giảm giá';
        toast.error(errorMessage);
      }
      setDiscountInfo(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const bookingData = {
        ...formData,
        addonServices: formData.selectedAddonServices
      };
      
      const result = await createManualBooking(bookingData);
      setCreatedBooking(result.booking);
      setShowSuccessDialog(true);
      resetForm();
      toast.success('Tạo đặt chỗ thủ công thành công');
    } catch (error: any) {
      console.error('Error creating manual booking:', error);
      toast.error('Không thể tạo đặt chỗ thủ công');
    }
  };

  const resetForm = () => {
    setFormData({
      parkingTypeId: '',
      checkInTime: '',
      checkOutTime: '',
      driverName: '',
      phone: '',
      email: '',
      licensePlate: '',
      passengerCount: 1,
      luggageCount: 0,
      selectedAddonServices: [],
      discountCode: '',
      estimatedArrivalTime: '',
      flightNumber: '',
      notes: '',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      status: 'confirmed'
    });
    setPricing(null);
    setDiscountInfo(null);
    setAvailableSlots([]);
    setConflictingDays([]);
    setMaintenanceDays([]);
  };

  const handleAddonServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAddonServices: prev.selectedAddonServices.includes(serviceId)
        ? prev.selectedAddonServices.filter(id => id !== serviceId)
        : [...prev.selectedAddonServices, serviceId]
    }));
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0 TWD';
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // const getParkingTypeIcon = (type: string) => {
  //   const iconMap = {
  //     indoor: '🏢',
  //     outdoor: '☀️',
  //     disabled: '♿'
  //   };
  //   return iconMap[type as keyof typeof iconMap] || '🚗';
  // };

  // const getParkingTypeBadge = (type: string) => {
  //   const badgeConfig = {
  //     indoor: { label: 'Trong nhà', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  //     outdoor: { label: 'Ngoài trời', color: 'bg-green-100 text-green-800 border-green-200' },
  //     disabled: { label: 'Khuyết tật', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  //   };
    
  //   const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.indoor;
  //   return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  // };

  const selectedParkingType = parkingTypes.find(pt => pt._id === formData.parkingTypeId);
  const selectedServices = addonServices.filter(service => 
    formData.selectedAddonServices.includes(service._id)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Đặt chỗ thủ công</h1>
          <p className="text-gray-600">Tạo đặt chỗ cho khách hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Thông tin đặt chỗ
            </CardTitle>
            <CardDescription>
              Nhập thông tin chi tiết cho đặt chỗ mới
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parking Type Selection */}
            <div>
              <Label htmlFor="parkingType">Bãi đậu xe *</Label>
              <Select value={formData.parkingTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, parkingTypeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bãi đậu xe" />
                </SelectTrigger>
                <SelectContent>
                  {parkingTypes.map((parkingType) => (
                    <SelectItem key={parkingType._id} value={parkingType._id}>
                      {parkingType.name} ({parkingType.code}) - {formatCurrency(parkingType.pricePerDay || 0)}/ngày
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInTime">Thời gian vào *</Label>
                <Input
                  id="checkInTime"
                  type="datetime-local"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Thời gian ra *</Label>
                <Input
                  id="checkOutTime"
                  type="datetime-local"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                />
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

            {/* Maintenance Notification */}
            {maintenanceDays.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">⚠️ Bãi đậu xe đang bảo trì</span>
                </div>
                <div className="text-sm text-red-700">
                  <p>Bãi đậu xe đã chọn đang bảo trì trong thời gian này:</p>
                  <ul className="mt-2 space-y-1">
                    {maintenanceDays.map((maintenance, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span>•</span>
                        <span>{new Date(maintenance.date).toLocaleDateString('vi-VN')}: {maintenance.reason}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium">Vui lòng chọn thời gian khác hoặc bãi đậu xe khác.</p>
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-4 w-4 mr-2" />
                Thông tin khách hàng
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="phone">Số điện thoại *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
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
                </div>
                <div>
                  <Label htmlFor="licensePlate">Biển số xe *</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                    placeholder="Nhập biển số xe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passengerCount">Số hành khách</Label>
                  <Input
                    id="passengerCount"
                    type="number"
                    min="1"
                    value={formData.passengerCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengerCount: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="luggageCount">Số hành lý</Label>
                  <Input
                    id="luggageCount"
                    type="number"
                    min="0"
                    value={formData.luggageCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, luggageCount: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Thông tin bổ sung
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedArrivalTime">Thời gian dự kiến đến</Label>
                  <Input
                    id="estimatedArrivalTime"
                    type="datetime-local"
                    value={formData.estimatedArrivalTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedArrivalTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="flightNumber">Số chuyến bay</Label>
                  <Input
                    id="flightNumber"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                    placeholder="Nhập số chuyến bay"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi chú bổ sung..."
                  rows={3}
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Thông tin thanh toán
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentStatus">Trạng thái thanh toán</Label>
                  <Select value={formData.paymentStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ thanh toán</SelectItem>
                      <SelectItem value="paid">Đã thanh toán</SelectItem>
                      <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tiền mặt</SelectItem>
                      <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                      <SelectItem value="online">Trực tuyến</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="status">Trạng thái đặt chỗ</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xác nhận</SelectItem>
                    <SelectItem value="confirmed">Đặt thành công</SelectItem>
                    <SelectItem value="checked-in">Đã vào bãi</SelectItem>
                    <SelectItem value="checked-out">Đã rời bãi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full">
              Tạo đặt chỗ thủ công
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Addon Services and Pricing */}
        <div className="space-y-6">
          {/* Addon Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2" />
                Dịch vụ bổ sung
              </CardTitle>
              <CardDescription>
                Chọn các dịch vụ bổ sung cho khách hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addonServices.map((service) => (
                <div key={service._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`service-${service._id}`}
                    checked={formData.selectedAddonServices.includes(service._id)}
                    onCheckedChange={() => handleAddonServiceToggle(service._id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-600">{service.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(service.price || 0)}
                    </div>
                  </div>
                </div>
              ))}

              {selectedServices.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Dịch vụ đã chọn:</h4>
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div key={service._id} className="flex justify-between items-center">
                        <span>{service.name}</span>
                        <span className="font-medium">{formatCurrency(service.price || 0)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Tổng dịch vụ:</span>
                        <span>{formatCurrency(selectedServices.reduce((sum, service) => sum + (service.price || 0), 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Mã giảm giá
              </CardTitle>
              <CardDescription>
                Nhập mã giảm giá nếu có
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Pricing Summary */}
          {pricing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Tóm tắt giá
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Base Price */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">Giá cơ bản</span>
                        <div className="text-sm text-gray-600">
                          {selectedParkingType?.name} • {pricing?.durationDays || 0} ngày
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(pricing?.basePrice)}</span>
                    </div>
                  </div>

                  {/* Daily Prices Breakdown */}
                  {pricing?.dailyPrices && pricing.dailyPrices.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-semibold text-blue-700 mb-2">📅 Chi tiết giá từng ngày:</div>
                      <div className="space-y-2">
                        {pricing.dailyPrices.map((dayPrice: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">
                                {new Date(dayPrice.date).toLocaleDateString('vi-VN', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {dayPrice.isSpecialPrice && (
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                  💰 {dayPrice.specialPriceReason}
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
                              <span className="font-semibold text-blue-600">{formatCurrency(service.price || 0)}</span>
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
                          ~{formatCurrency(Math.round((pricing?.totalAmount || 0) * (currentUser.vipDiscount / 100)))}
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
                          {formatCurrency(pricing?.totalAmount || 0)}
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
                                : Math.round((pricing?.totalAmount || 0) * (currentUser?.vipDiscount / 100))
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
                                ? formatCurrency(Math.round((pricing?.totalAmount || 0) * (1 - currentUser.vipDiscount / 100)))
                                : formatCurrency(pricing?.finalAmount || pricing?.totalAmount || 0)
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
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Đặt chỗ thành công
            </DialogTitle>
            <DialogDescription>
              Đặt chỗ thủ công đã được tạo thành công
            </DialogDescription>
          </DialogHeader>
          
          {createdBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-semibold">Mã đặt chỗ: {createdBooking.bookingNumber}</div>
                <div className="text-sm text-gray-600">
                  Khách hàng: {createdBooking.driverName}
                </div>
                <div className="text-sm text-gray-600">
                  Biển số: {createdBooking.licensePlate}
                </div>
                <div className="text-sm text-gray-600">
                  Tổng tiền: {formatCurrency(createdBooking.finalAmount)}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManualBooking; 