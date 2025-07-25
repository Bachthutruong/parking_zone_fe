import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
//   AlertTriangle,
//   Info,
//   DollarSign,
  Clock,
  Bell,
  Shield,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSystemSettings, updateSystemSettings, updateBookingTerms, updateParkingLotTypes } from '@/services/systemSettings';
    // import type { SystemSettings } from '@/types';

interface SettingsFormData {
  // General settings
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: {
    open: string;
    close: string;
  };
  address: string;
  
  // Booking settings
  bookingTerms: string;
  bookingRules: string;
  defaultVIPDiscount: number;
  bookingAdvanceHours: number;
  maxBookingDays: number;
  timeSlotInterval: number;
  
  // Notification settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoConfirmBookings: boolean;
  
  // Payment settings
  paymentMethods: string[];
  currency: string;
  taxRate: number;
  
  // System settings
  maintenanceMode: boolean;
  allowWalkIns: boolean;
  requireLicensePlate: boolean;
  
  // Parking lot types
  parkingLotTypes: Array<{
    type: string;
    name: string;
    icon: string;
    isActive: boolean;
  }>;
}

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
//   const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    businessHours: { open: '06:00', close: '22:00' },
    address: '',
    bookingTerms: '',
    bookingRules: '',
    defaultVIPDiscount: 10,
    bookingAdvanceHours: 24,
    maxBookingDays: 30,
    timeSlotInterval: 15,
    emailNotifications: true,
    smsNotifications: false,
    autoConfirmBookings: false,
    paymentMethods: ['cash', 'credit_card'],
    currency: 'TWD',
    taxRate: 0,
    maintenanceMode: false,
    allowWalkIns: true,
    requireLicensePlate: true,
    parkingLotTypes: []
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
    //   setSettings(data);
      setFormData({
        businessName: 'Parking Zone', // Not in current interface
        contactEmail: data.contactInfo?.email || '',
        contactPhone: data.contactInfo?.phone || '',
        businessHours: data.businessHours || { open: '06:00', close: '22:00' },
        address: data.contactInfo?.address || '',
        bookingTerms: data.bookingTerms || '',
        bookingRules: data.bookingRules || '',
        defaultVIPDiscount: data.defaultVIPDiscount || 10,
        bookingAdvanceHours: data.bookingAdvanceHours || 24,
        maxBookingDays: data.maxBookingDays || 30,
        timeSlotInterval: data.timeSlotInterval || 15,
        emailNotifications: data.notificationSettings?.emailNotifications !== false,
        smsNotifications: data.notificationSettings?.smsNotifications || false,
        autoConfirmBookings: false, // Not in current interface
        paymentMethods: [
          ...(data.paymentSettings?.acceptCash ? ['cash'] : []),
          ...(data.paymentSettings?.acceptCreditCard ? ['credit_card'] : []),
          ...(data.paymentSettings?.acceptOnlinePayment ? ['online'] : [])
        ],
        currency: data.paymentSettings?.currency || 'TWD',
        taxRate: data.paymentSettings?.taxRate || 0,
        maintenanceMode: data.maintenanceMode?.enabled || false,
        allowWalkIns: true, // Not in current interface
        requireLicensePlate: true, // Not in current interface
        parkingLotTypes: data.parkingLotTypes || []
      });
    } catch (error: any) {
      toast.error('Không thể tải cài đặt hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        contactInfo: {
          phone: formData.contactPhone,
          email: formData.contactEmail,
          address: formData.address,
          website: ''
        },
        businessHours: {
          open: formData.businessHours.open,
          close: formData.businessHours.close,
          is24Hours: false
        },
        defaultVIPDiscount: formData.defaultVIPDiscount,
        bookingAdvanceHours: formData.bookingAdvanceHours,
        maxBookingDays: formData.maxBookingDays,
        timeSlotInterval: formData.timeSlotInterval,
        notificationSettings: {
          emailNotifications: formData.emailNotifications,
          smsNotifications: formData.smsNotifications,
          reminderHours: 24,
          confirmationEmail: true,
          reminderEmail: true
        },
        paymentSettings: {
          acceptCash: formData.paymentMethods.includes('cash'),
          acceptCreditCard: formData.paymentMethods.includes('credit_card'),
          acceptOnlinePayment: formData.paymentMethods.includes('online'),
          currency: formData.currency,
          taxRate: formData.taxRate
        },
        maintenanceMode: {
          enabled: formData.maintenanceMode,
          message: 'Hệ thống đang bảo trì'
        }
      };
      await updateSystemSettings(updateData);
      toast.success('Lưu cài đặt thành công');
      await loadSettings();
    } catch (error: any) {
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBookingTerms = async () => {
    try {
      setSaving(true);
      await updateBookingTerms({
        bookingTerms: formData.bookingTerms,
        bookingRules: formData.bookingRules
      });
      toast.success('Lưu điều khoản thành công');
    } catch (error: any) {
      toast.error('Không thể lưu điều khoản');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParkingTypes = async () => {
    try {
      setSaving(true);
      await updateParkingLotTypes(formData.parkingLotTypes);
      toast.success('Lưu loại bãi đậu xe thành công');
    } catch (error: any) {
      toast.error('Không thể lưu loại bãi đậu xe');
    } finally {
      setSaving(false);
    }
  };

  const addParkingType = () => {
    const newType = {
      type: `type_${Date.now()}`,
      name: 'Loại mới',
      icon: '🚗',
      isActive: true
    };
    setFormData(prev => ({
      ...prev,
      parkingLotTypes: [...prev.parkingLotTypes, newType]
    }));
  };

  const removeParkingType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parkingLotTypes: prev.parkingLotTypes.filter((_, i) => i !== index)
    }));
  };

  const updateParkingType = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parkingLotTypes: prev.parkingLotTypes.map((type, i) => 
        i === index ? { ...type, [field]: value } : type
      )
    }));
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-gray-600">Cấu hình hệ thống và thông tin chung</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="booking">Đặt chỗ</TabsTrigger>
          <TabsTrigger value="parking">Bãi đậu xe</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Thông tin chung
              </CardTitle>
              <CardDescription>
                Cấu hình thông tin cơ bản của hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Tên doanh nghiệp</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Nhập tên doanh nghiệp"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email liên hệ</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Số điện thoại</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+84 123 456 789"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openTime">Giờ mở cửa</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={formData.businessHours.open}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      businessHours: { ...prev.businessHours, open: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="closeTime">Giờ đóng cửa</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={formData.businessHours.close}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      businessHours: { ...prev.businessHours, close: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                  <Label htmlFor="maintenanceMode">Chế độ bảo trì</Label>
                  {formData.maintenanceMode && (
                    <Badge variant="destructive">Hệ thống sẽ tạm dừng</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="booking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Cài đặt đặt chỗ
              </CardTitle>
              <CardDescription>
                Cấu hình quy tắc và điều khoản đặt chỗ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultVIPDiscount">Giảm giá VIP mặc định (%)</Label>
                  <Input
                    id="defaultVIPDiscount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultVIPDiscount}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultVIPDiscount: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bookingAdvanceHours">Đặt trước (giờ)</Label>
                  <Input
                    id="bookingAdvanceHours"
                    type="number"
                    min="0"
                    value={formData.bookingAdvanceHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingAdvanceHours: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxBookingDays">Tối đa (ngày)</Label>
                  <Input
                    id="maxBookingDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.maxBookingDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxBookingDays: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bookingTerms">Điều khoản đặt chỗ</Label>
                <Textarea
                  id="bookingTerms"
                  value={formData.bookingTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingTerms: e.target.value }))}
                  placeholder="Nhập điều khoản đặt chỗ..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="bookingRules">Quy định đặt chỗ</Label>
                <Textarea
                  id="bookingRules"
                  value={formData.bookingRules}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingRules: e.target.value }))}
                  placeholder="Nhập quy định đặt chỗ..."
                  rows={6}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBookingTerms} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu điều khoản
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parking Settings */}
        <TabsContent value="parking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Loại bãi đậu xe
              </CardTitle>
              <CardDescription>
                Quản lý các loại bãi đậu xe trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {formData.parkingLotTypes.map((type, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Input
                      value={type.icon}
                      onChange={(e) => updateParkingType(index, 'icon', e.target.value)}
                      className="w-16 text-center"
                      placeholder="🚗"
                    />
                    <Input
                      value={type.name}
                      onChange={(e) => updateParkingType(index, 'name', e.target.value)}
                      placeholder="Tên loại"
                      className="flex-1"
                    />
                    <Input
                      value={type.type}
                      onChange={(e) => updateParkingType(index, 'type', e.target.value)}
                      placeholder="Mã loại"
                      className="w-32"
                    />
                    <Switch
                      checked={type.isActive}
                      onCheckedChange={(checked) => updateParkingType(index, 'isActive', checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeParkingType(index)}
                      className="text-red-600"
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={addParkingType}>
                  Thêm loại mới
                </Button>
                <Button onClick={handleSaveParkingTypes} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu loại bãi đậu xe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Cài đặt thông báo
              </CardTitle>
              <CardDescription>
                Cấu hình các loại thông báo hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Thông báo email</Label>
                    <p className="text-sm text-gray-500">Gửi thông báo qua email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">Thông báo SMS</Label>
                    <p className="text-sm text-gray-500">Gửi thông báo qua SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoConfirmBookings">Tự động xác nhận đặt chỗ</Label>
                    <p className="text-sm text-gray-500">Tự động xác nhận đặt chỗ mới</p>
                  </div>
                  <Switch
                    id="autoConfirmBookings"
                    checked={formData.autoConfirmBookings}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoConfirmBookings: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Cài đặt thanh toán
              </CardTitle>
              <CardDescription>
                Cấu hình phương thức thanh toán và thuế
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="TWD"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Thuế suất (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Phương thức thanh toán</Label>
                <div className="grid grid-cols-2 gap-4">
                  {['cash', 'credit_card', 'bank_transfer', 'mobile_payment'].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={method}
                        checked={formData.paymentMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              paymentMethods: [...prev.paymentMethods, method]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              paymentMethods: prev.paymentMethods.filter(m => m !== method)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={method} className="capitalize">
                        {method.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings; 