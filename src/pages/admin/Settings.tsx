import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Clock,
  Bell,
  Shield,
  CreditCard,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  // AlertTriangle,
  Info,
  Phone,
  Mail,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSystemSettings, updateSystemSettings, updateBookingTerms } from '@/services/systemSettings';
import { getAllTerms, updateTermsSection, saveAllTerms } from '@/services/admin';
import ContactImageUpload from '@/components/ContactImageUpload';

interface SettingsFormData {
  // General settings
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  contactContent: {
    title: string;
    content: string;
    imageUrl: string;
    isActive: boolean;
    showContactInfo: boolean;
  };
  businessHours: {
    open: string;
    close: string;
    is24Hours: boolean;
  };
  
  // Booking settings
  bookingTerms: string;
  bookingRules: string;
  defaultVIPDiscount: number;
  bookingAdvanceHours: number;
  maxBookingDays: number;
  minBookingDays: number;
  timeSlotInterval: number;
  autoCancelMinutes: number;
  cutoffHour: number;
  
  // Notification settings
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderHours: number;
    confirmationEmail: boolean;
    reminderEmail: boolean;
  };
  
  // Payment settings
  paymentSettings: {
    acceptCash: boolean;
    acceptCreditCard: boolean;
    acceptOnlinePayment: boolean;
    currency: string;
    taxRate: number;
  };

  // Luggage settings
  luggageSettings: {
    freeLuggageCount: number;
    luggagePricePerItem: number;
    luggageContent: {
      title: string;
      description: string;
      imageUrl: string;
      isActive: boolean;
    };
  };
  
  // System settings
  maintenanceMode: {
    enabled: boolean;
    message: string;
  };
  
  // Terms checkboxes
  termsCheckboxes: {
    id: string;
    title: string;
    content: string;
    isRequired: boolean;
    isActive: boolean;
    order: number;
  }[];
  
  // Contract terms
  contractTerms: string;

}

interface TermsData {
  bookingTerms: {
    content: string;
    isActive: boolean;
  };
  bookingRules: {
    content: string;
    isActive: boolean;
  };
  privacyPolicy: {
    content: string;
    isActive: boolean;
  };
  contactInfo: {
    content: string;
    isActive: boolean;
  };
  timeSlotInterval: {
    content: string;
    isActive: boolean;
  };
  cancellationPolicy: {
    content: string;
    isActive: boolean;
  };
  refundPolicy: {
    content: string;
    isActive: boolean;
  };
}

const defaultTermsData: TermsData = {
  bookingTerms: {
    content: `1. Điều khoản đặt chỗ bãi đậu xe

• Khách hàng phải đặt chỗ trước ít nhất 1 giờ
• Thời gian đặt chỗ tối đa là 30 ngày
• Mỗi lần đặt chỗ tối thiểu 1 giờ
• Hủy đặt chỗ trước 2 giờ để được hoàn tiền

2. Thông tin cần thiết khi đặt chỗ

• Họ tên khách hàng
• Số điện thoại liên hệ
• Biển số xe
• Thời gian đặt chỗ (giờ đến và giờ đi)
• Loại bãi đậu xe mong muốn

3. Xác nhận đặt chỗ

• Hệ thống sẽ gửi SMS/Email xác nhận
• Khách hàng cần xác nhận trong vòng 15 phút
• Nếu không xác nhận, đặt chỗ sẽ tự động hủy`,
    isActive: true
  },
  bookingRules: {
    content: `1. Quy định sử dụng bãi đậu xe

• Tuân thủ hướng dẫn của nhân viên
• Đậu xe đúng vị trí được chỉ định
• Không để xe quá thời gian đã đặt
• Giữ gìn vệ sinh chung

2. Quy định về an toàn

• Tắt động cơ khi đậu xe
• Khóa xe cẩn thận
• Không để vật có giá trị trong xe
• Báo cáo ngay khi có sự cố

3. Quy định về thanh toán

• Thanh toán đầy đủ trước khi sử dụng
• Chấp nhận tiền mặt và thẻ tín dụng
• Hóa đơn sẽ được cung cấp sau khi thanh toán`,
    isActive: true
  },
  privacyPolicy: {
    content: `1. Thu thập thông tin

• Thông tin cá nhân: tên, số điện thoại, email
• Thông tin xe: biển số, loại xe
• Thông tin đặt chỗ: thời gian, vị trí

2. Sử dụng thông tin

• Để xử lý đặt chỗ và thanh toán
• Để liên lạc với khách hàng
• Để cải thiện dịch vụ

3. Bảo mật thông tin

• Mã hóa dữ liệu nhạy cảm
• Không chia sẻ thông tin với bên thứ ba
• Tuân thủ quy định bảo mật dữ liệu`,
    isActive: true
  },
  contactInfo: {
    content: `Thông tin liên hệ:

Điện thoại: +886 2 1234 5678
Email: info@parkingzone.com
Địa chỉ: 123 Parking Street, Taipei, Taiwan
Website: https://parkingzone.com

Giờ làm việc:
Thứ 2 - Thứ 6: 06:00 - 22:00
Thứ 7 - Chủ nhật: 07:00 - 21:00

Hỗ trợ khách hàng 24/7 qua hotline`,
    isActive: true
  },
  timeSlotInterval: {
    content: `Cài đặt khoảng thời gian đặt chỗ:

• Khoảng thời gian mặc định: 15 phút
• Tùy chọn: 15, 30, 45, 60 phút
• Khách hàng có thể chọn thời gian phù hợp
• Hệ thống sẽ hiển thị các slot có sẵn`,
    isActive: true
  },
  cancellationPolicy: {
    content: `Chính sách hủy đặt chỗ:

1. Hủy miễn phí
• Hủy trước 2 giờ: hoàn tiền 100%
• Hủy trước 1 giờ: hoàn tiền 50%

2. Hủy có phí
• Hủy trong vòng 1 giờ: không hoàn tiền
• Không đến đúng giờ: tính phí 1 giờ

3. Hoàn tiền
• Xử lý trong vòng 3-5 ngày làm việc
• Hoàn tiền qua phương thức thanh toán ban đầu`,
    isActive: true
  },
  refundPolicy: {
    content: `Chính sách hoàn tiền:

1. Điều kiện hoàn tiền
• Hủy đặt chỗ đúng quy định
• Dịch vụ không đạt chất lượng
• Lỗi hệ thống kỹ thuật

2. Thời gian xử lý
• Hoàn tiền trong vòng 3-5 ngày làm việc
• Thông báo qua email/SMS

3. Phương thức hoàn tiền
• Hoàn tiền qua phương thức thanh toán ban đầu
• Chuyển khoản ngân hàng (nếu cần)`,
    isActive: true
  }
};

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsFormData>({
    contactInfo: {
      phone: '',
      email: '',
      address: '',
      website: ''
    },
    contactContent: {
      title: '聯繫信息',
      content: '如有任何問題，請隨時聯繫我們。我們將竭誠為您服務。',
      imageUrl: '',
      isActive: true,
      showContactInfo: true
    },
    businessHours: {
      open: '06:00',
      close: '22:00',
      is24Hours: false
    },
    bookingTerms: '',
    bookingRules: '',
    defaultVIPDiscount: 10,
    bookingAdvanceHours: 24,
    maxBookingDays: 30,
    minBookingDays: 3,
    timeSlotInterval: 15,
    autoCancelMinutes: 15,
    cutoffHour: 0,
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      reminderHours: 1,
      confirmationEmail: true,
      reminderEmail: true
    },
    paymentSettings: {
      acceptCash: true,
      acceptCreditCard: true,
      acceptOnlinePayment: false,
      currency: 'TWD',
      taxRate: 0
    },
    luggageSettings: {
      freeLuggageCount: 1,
      luggagePricePerItem: 100,
      luggageContent: {
        title: '行李注意事項',
        description: '請注意您的行李安全，建議將貴重物品隨身攜帶。',
        imageUrl: '',
        isActive: true
      }
    },
    maintenanceMode: {
      enabled: false,
      message: ''
    },
    termsCheckboxes: [
      {
        id: 'terms-1',
        title: '我同意所有預約條款和條件',
        content: '我已經閱讀並同意所有預約條款和條件，包括取消政策、退款政策等相關規定。',
        isRequired: true,
        isActive: true,
        order: 1
      },
      {
        id: 'terms-2',
        title: '我同意隱私政策',
        content: '我同意系統收集、處理和使用我的個人資料，並了解隱私政策內容。',
        isRequired: true,
        isActive: true,
        order: 2
      },
      {
        id: 'terms-3',
        title: '我了解停車場規定',
        content: '我了解並同意遵守停車場的所有規定，包括安全規定、使用時間限制等。',
        isRequired: true,
        isActive: true,
        order: 3
      }
    ],
    contractTerms: '<h2>停車場使用合約條款</h2><p>1. 本合約適用於所有使用本停車場服務的客戶。</p><p>2. 客戶應遵守停車場的所有規定和安全措施。</p><p>3. 停車場管理方保留在緊急情況下移動車輛的權利。</p><p>4. 客戶應確保車輛保險有效，並承擔車輛安全責任。</p><p>5. 本合約受當地法律管轄。</p>'
  });

  // Terms management state
  const [termsData, setTermsData] = useState<TermsData>(defaultTermsData);
  const [editingSection, setEditingSection] = useState<keyof TermsData | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadSettings();
    loadTerms();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getSystemSettings();
      console.log('🔍 Loaded settings:', settings);
      
      // Merge with default form data to ensure all fields are present
      setFormData(prev => ({
        ...prev,
        ...settings,
        contactInfo: {
          ...prev.contactInfo,
          ...settings.contactInfo
        },
        businessHours: {
          ...prev.businessHours,
          ...settings.businessHours
        },
        notificationSettings: {
          ...prev.notificationSettings,
          ...settings.notificationSettings
        },
        paymentSettings: {
          ...prev.paymentSettings,
          ...settings.paymentSettings
        },
        luggageSettings: {
          ...prev.luggageSettings,
          ...settings.luggageSettings
        },
        maintenanceMode: {
          ...prev.maintenanceMode,
          ...settings.maintenanceMode
        }
      }));
    } catch (error: any) {
      console.error('Error loading settings:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法載入系統設定';
      toast.error(errorMessage);
      
      // If it's an auth error, don't show the error toast as the user will be redirected
      if (error.response?.status === 401) {
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async () => {
    try {
      const terms = await getAllTerms();
      console.log('🔍 Loaded terms:', terms);
      if (terms.success) {
        setTermsData(terms.terms || defaultTermsData);
      } else {
        // Use default terms if loading fails
        setTermsData(defaultTermsData);
      }
    } catch (error: any) {
      console.error('Error loading terms:', error);
      // Use default terms if loading fails
      setTermsData(defaultTermsData);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure cutoffHour is a number
      const dataToSave = {
        ...formData,
        cutoffHour: Number(formData.cutoffHour) || 0
      };
      console.log('🔍 Saving settings:', dataToSave);
      await updateSystemSettings(dataToSave);
      toast.success('設定儲存成功！');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法儲存設定';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save helpers for luggage image so it persists after refresh
  const handleLuggageImageUpload = async (imageUrl: string) => {
    // Update local state first for instant UI feedback
    setFormData(prev => ({
      ...prev,
      luggageSettings: {
        ...prev.luggageSettings,
        luggageContent: {
          ...prev.luggageSettings.luggageContent,
          imageUrl
        }
      }
    }));

    try {
      setSaving(true);
      await updateSystemSettings({
        luggageSettings: {
          ...formData.luggageSettings,
          luggageContent: {
            ...formData.luggageSettings.luggageContent,
            imageUrl
          }
        }
      });
      toast.success('行李圖片已儲存');
    } catch (error: any) {
      console.error('Error saving luggage image:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法儲存行李圖片';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLuggageImageDelete = async () => {
    // Update local state first
    setFormData(prev => ({
      ...prev,
      luggageSettings: {
        ...prev.luggageSettings,
        luggageContent: {
          ...prev.luggageSettings.luggageContent,
          imageUrl: ''
        }
      }
    }));

    try {
      setSaving(true);
      await updateSystemSettings({
        luggageSettings: {
          ...formData.luggageSettings,
          luggageContent: {
            ...formData.luggageSettings.luggageContent,
            imageUrl: ''
          }
        }
      });
      toast.success('行李圖片已刪除');
    } catch (error: any) {
      console.error('Error deleting luggage image:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法刪除行李圖片';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBookingTerms = async () => {
    try {
      setSaving(true);
      console.log('🔍 Saving booking terms:', {
        bookingTerms: formData.bookingTerms,
        bookingRules: formData.bookingRules,
        termsCheckboxes: formData.termsCheckboxes
      });
      await updateBookingTerms({
        bookingTerms: formData.bookingTerms,
        bookingRules: formData.bookingRules,
        termsCheckboxes: formData.termsCheckboxes
      });
      toast.success('預約條款儲存成功！');
    } catch (error: any) {
      console.error('Error saving booking terms:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法儲存預約條款';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContractTerms = async () => {
    try {
      setSaving(true);
      console.log('🔍 Saving contract terms:', formData.contractTerms);
      await updateSystemSettings({
        contractTerms: formData.contractTerms
      });
      toast.success('合約條款儲存成功！');
    } catch (error: any) {
      console.error('Error saving contract terms:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法儲存合約條款';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = async () => {
    try {
      setSaving(true);
      console.log('🔍 Saving all terms:', termsData);
      await saveAllTerms(termsData);
      toast.success('儲存所有條款成功！');
    } catch (error: any) {
      console.error('Error saving terms:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法儲存條款';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSection = (section: keyof TermsData) => {
    setEditingSection(section);
    setEditContent(termsData[section].content);
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;

    try {
      setSaving(true);
      console.log('🔍 Updating section:', editingSection, {
        content: editContent,
        isActive: termsData[editingSection].isActive
      });

      await updateTermsSection(editingSection, {
        content: editContent,
        isActive: termsData[editingSection].isActive
      });

      const updatedTerms = {
        ...termsData,
        [editingSection]: {
          ...termsData[editingSection],
          content: editContent
        }
      };

      setTermsData(updatedTerms);
      setEditingSection(null);
      setEditContent('');
      toast.success('更新條款成功！');
    } catch (error: any) {
      console.error('Error updating section:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法更新條款';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = async (section: keyof TermsData) => {
    try {
      console.log('🔍 Toggling section:', section, {
        content: termsData[section].content,
        isActive: !termsData[section].isActive
      });

      await updateTermsSection(section, {
        content: termsData[section].content,
        isActive: !termsData[section].isActive
      });

      const updatedTerms = {
        ...termsData,
        [section]: {
          ...termsData[section],
          isActive: !termsData[section].isActive
        }
      };

      setTermsData(updatedTerms);
      toast.success(`${termsData[section].isActive ? '停用' : '啟用'}條款成功！`);
    } catch (error: any) {
      console.error('Error toggling section:', error);
      const errorMessage = error.response?.data?.message || error.message || '無法變更條款狀態';
      toast.error(errorMessage);
    }
  };

  const getSectionName = (section: keyof TermsData) => {
    const names = {
      bookingTerms: '預約條款',
      bookingRules: '預約規定',
      privacyPolicy: '隱私政策',
      contactInfo: '聯絡資訊',
      timeSlotInterval: '時段間隔',
      cancellationPolicy: '取消政策',
      refundPolicy: '退款政策'
    };
    return names[section];
  };

  const getSectionIcon = (section: keyof TermsData) => {
    const icons = {
      bookingTerms: <FileText className="h-4 w-4" />,
      bookingRules: <Shield className="h-4 w-4" />,
      privacyPolicy: <Info className="h-4 w-4" />,
      contactInfo: <Phone className="h-4 w-4" />,
      timeSlotInterval: <Clock className="h-4 w-4" />,
      cancellationPolicy: <XCircle className="h-4 w-4" />,
      refundPolicy: <CheckCircle className="h-4 w-4" />
    };
    return icons[section];
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系統設定</h1>
          <p className="text-gray-600">系統配置和一般資訊</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新整理
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '儲存中...' : '儲存全部'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="booking">預約</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="payment">付款</TabsTrigger>
          <TabsTrigger value="luggage">行李</TabsTrigger>
          <TabsTrigger value="contract">合約條款</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5 text-blue-600" />
                <span>一般設定</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.contactInfo.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, website: e.target.value } }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">聯絡電子郵件</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))}
                    placeholder="info@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">電話號碼</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactInfo.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))}
                    placeholder="+886 2 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={formData.contactInfo.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, address: e.target.value } }))}
                    placeholder="123 Parking Street, Taipei, Taiwan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>營業時間</Label>
                  <Input
                    type="time"
                    value={formData.businessHours.open}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      businessHours: { ...prev.businessHours, open: e.target.value }
                    }))}
                    disabled={formData.businessHours.is24Hours}
                  />
                </div>
                <div>
                  <Label>關門時間</Label>
                  <Input
                    type="time"
                    value={formData.businessHours.close}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      businessHours: { ...prev.businessHours, close: e.target.value }
                    }))}
                    disabled={formData.businessHours.is24Hours}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={formData.maintenanceMode.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenanceMode: { ...prev.maintenanceMode, enabled: checked } }))}
                />
                <Label htmlFor="maintenanceMode">維護模式</Label>
              </div>

              {formData.maintenanceMode.enabled && (
                <div>
                  <Label htmlFor="maintenanceMessage">維護通知</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={formData.maintenanceMode.message}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maintenanceMode: { ...prev.maintenanceMode, message: e.target.value }
                    }))}
                    placeholder="系統正在維護中，請稍後再試。"
                    rows={3}
                  />
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 注意事項</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 聯絡資訊將顯示在首頁</li>
                  <li>• 營業時間會影響預約功能</li>
                  <li>• 維護模式將暫停整個系統</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Content Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>預約確認頁面聯繫內容</span>
              </CardTitle>
              <CardDescription>
                配置預約確認頁面右上角的聯繫信息框
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="contactContentActive"
                  checked={formData.contactContent.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    contactContent: { 
                      ...prev.contactContent, 
                      isActive: checked 
                    }
                  }))}
                />
                <Label htmlFor="contactContentActive">啟用聯繫內容框</Label>
              </div>

              {formData.contactContent.isActive && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contactContentTitle">聯繫內容標題</Label>
                    <Input
                      id="contactContentTitle"
                      value={formData.contactContent.title}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contactContent: { 
                          ...prev.contactContent, 
                          title: e.target.value 
                        }
                      }))}
                      placeholder="聯繫信息"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactContentDescription">聯繫內容描述</Label>
                    <Textarea
                      id="contactContentDescription"
                      value={formData.contactContent.content}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contactContent: { 
                          ...prev.contactContent, 
                          content: e.target.value 
                        }
                      }))}
                      rows={4}
                      placeholder="如有任何問題，請隨時聯繫我們。我們將竭誠為您服務。"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      支援 HTML 標籤和連結，例如：&lt;a href="https://example.com"&gt;連結文字&lt;/a&gt;
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showContactInfo"
                      checked={formData.contactContent.showContactInfo}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        contactContent: { 
                          ...prev.contactContent, 
                          showContactInfo: checked 
                        }
                      }))}
                    />
                    <Label htmlFor="showContactInfo">顯示聯繫信息（電話、郵件、地址等）</Label>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      聯繫內容圖片
                    </Label>
                    <ContactImageUpload
                      existingImageUrl={formData.contactContent.imageUrl}
                      onUploadSuccess={(imageUrl) => setFormData(prev => ({ 
                        ...prev, 
                        contactContent: { 
                          ...prev.contactContent, 
                          imageUrl 
                        }
                      }))}
                      onDeleteSuccess={() => setFormData(prev => ({ 
                        ...prev, 
                        contactContent: { 
                          ...prev.contactContent, 
                          imageUrl: '' 
                        }
                      }))}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2">預覽效果：</h5>
                    <div className="bg-white p-3 rounded border border-blue-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {formData.contactContent.title}
                        </span>
                      </div>
                      <div 
                        className="text-sm text-blue-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formData.contactContent.content }}
                      />
                      {formData.contactContent.imageUrl && (
                        <div className="mt-3">
                          <img
                            src={formData.contactContent.imageUrl}
                            alt="Contact content image"
                            className="w-full h-24 object-cover rounded border"
                          />
                        </div>
                      )}
                      {formData.contactContent.showContactInfo && (
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span>{formData.contactInfo.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span>{formData.contactInfo.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span>{formData.contactInfo.address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="booking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Cài đặt đặt chỗ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultVIPDiscount">預設VIP折扣 (%)</Label>
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
                  <Label htmlFor="bookingAdvanceHours">提前預約 (小時)</Label>
                  <Input
                    id="bookingAdvanceHours"
                    type="number"
                    min="0"
                    value={formData.bookingAdvanceHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingAdvanceHours: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxBookingDays">最大 (天)</Label>
                  <Input
                    id="maxBookingDays"
                    type="number"
                    min="1"
                    value={formData.maxBookingDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxBookingDays: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="minBookingDays">最少 (天)</Label>
                  <Input
                    id="minBookingDays"
                    type="number"
                    min="1"
                    value={formData.minBookingDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, minBookingDays: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cutoffHour">計費時段分界點</Label>
                  <Select
                    value={String(formData.cutoffHour)}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cutoffHour: parseInt(value) || 0 }))}
                  >
                    <SelectTrigger id="cutoffHour">
                      <SelectValue placeholder="選擇時段" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    若進場時間早於此分界點，首日將計費；若進場時間晚於此分界點，首日免費，從次日開始計費。離場日始終計費。
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚙️ 預約設定</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• VIP折扣：適用於VIP客戶</li>
                  <li>• 提前預約：預約的最短時間</li>
                  <li>• 最少：客戶必須預約的最少天數</li>
                  <li>• 最大：可提前預約的最大天數</li>
                  <li>• 時段間隔：預約時段的精確度</li>
                  <li>• 自動取消：等待確認的時間</li>
                </ul>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is24Hours"
                  checked={formData.businessHours.is24Hours}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    businessHours: { ...prev.businessHours, is24Hours: checked }
                  }))}
                />
                <Label htmlFor="is24Hours">24/7營業</Label>
              </div>

              <div>
                <Label htmlFor="timeSlotInterval">預約時段間隔 (分鐘)</Label>
                <select
                  id="timeSlotInterval"
                  value={formData.timeSlotInterval}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeSlotInterval: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={15}>15 分鐘</option>
                  <option value={30}>30 分鐘</option>
                  <option value={45}>45 分鐘</option>
                  <option value={60}>60 分鐘</option>
                </select>
              </div>

              <div>
                <Label htmlFor="autoCancelMinutes">自動取消時間 (分鐘)</Label>
                <Input
                  id="autoCancelMinutes"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.autoCancelMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoCancelMinutes: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Điều khoản đặt chỗ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                請在預約停車位前仔細閱讀相關規定和條款。
              </p>
              
              <div>
                <Label htmlFor="bookingTerms">預約條款</Label>
                <Textarea
                  id="bookingTerms"
                  value={formData.bookingTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingTerms: e.target.value }))}
                  rows={10}
                  placeholder="輸入預約條款..."
                />
              </div>

              <div>
                <Label htmlFor="bookingRules">預約規定</Label>
                <Textarea
                  id="bookingRules"
                  value={formData.bookingRules}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingRules: e.target.value }))}
                  rows={10}
                  placeholder="輸入預約規定..."
                />
              </div>

              <Button onClick={handleSaveBookingTerms} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                儲存條款
              </Button>
            </CardContent>
          </Card>

          {/* Terms Checkboxes Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>預約確認條款設定</span>
              </CardTitle>
              <CardDescription>
                設定用戶在預約時需要同意的條款選項
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {formData.termsCheckboxes.map((term, index) => (
                  <div key={term.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">條款 {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`term-active-${term.id}`}
                          checked={term.isActive}
                          onCheckedChange={(checked) => {
                            const newTerms = [...formData.termsCheckboxes];
                            newTerms[index].isActive = checked;
                            setFormData(prev => ({ ...prev, termsCheckboxes: newTerms }));
                          }}
                        />
                        <Label htmlFor={`term-active-${term.id}`}>啟用</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`term-title-${term.id}`}>標題</Label>
                      <Input
                        id={`term-title-${term.id}`}
                        value={term.title}
                        onChange={(e) => {
                          const newTerms = [...formData.termsCheckboxes];
                          newTerms[index].title = e.target.value;
                          setFormData(prev => ({ ...prev, termsCheckboxes: newTerms }));
                        }}
                        placeholder="例如：我同意所有預約條款和條件"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`term-content-${term.id}`}>內容描述</Label>
                      <Textarea
                        id={`term-content-${term.id}`}
                        value={term.content}
                        onChange={(e) => {
                          const newTerms = [...formData.termsCheckboxes];
                          newTerms[index].content = e.target.value;
                          setFormData(prev => ({ ...prev, termsCheckboxes: newTerms }));
                        }}
                        rows={3}
                        placeholder="詳細說明此條款的內容..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`term-required-${term.id}`}
                          checked={term.isRequired}
                          onCheckedChange={(checked) => {
                            const newTerms = [...formData.termsCheckboxes];
                            newTerms[index].isRequired = checked;
                            setFormData(prev => ({ ...prev, termsCheckboxes: newTerms }));
                          }}
                        />
                        <Label htmlFor={`term-required-${term.id}`}>必填</Label>
                      </div>
                      
                      <div>
                        <Label htmlFor={`term-order-${term.id}`}>排序</Label>
                        <Input
                          id={`term-order-${term.id}`}
                          type="number"
                          min="0"
                          value={term.order}
                          onChange={(e) => {
                            const newTerms = [...formData.termsCheckboxes];
                            newTerms[index].order = parseInt(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, termsCheckboxes: newTerms }));
                          }}
                          className="w-20"
                        />
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newTerms = formData.termsCheckboxes.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, termsCheckboxes: newTerms }));
                        }}
                      >
                        刪除
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newTerm = {
                        id: `terms-${Date.now()}`,
                        title: '新條款',
                        content: '請輸入條款內容...',
                        isRequired: true,
                        isActive: true,
                        order: formData.termsCheckboxes.length + 1
                      };
                      setFormData(prev => ({ 
                        ...prev, 
                        termsCheckboxes: [...prev.termsCheckboxes, newTerm] 
                      }));
                    }}
                    className="flex-1"
                  >
                    + 新增條款
                  </Button>
                  
                  <Button
                    onClick={handleSaveBookingTerms}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    儲存條款設定
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parking Settings */}


        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <span>Cài đặt thông báo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailNotifications"
                  checked={formData.notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificationSettings: { ...prev.notificationSettings, emailNotifications: checked } }))}
                />
                <Label htmlFor="emailNotifications">電子郵件通知</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smsNotifications"
                  checked={formData.notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificationSettings: { ...prev.notificationSettings, smsNotifications: checked } }))}
                />
                <Label htmlFor="smsNotifications">簡訊通知</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="confirmationEmail"
                  checked={formData.notificationSettings.confirmationEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificationSettings: { ...prev.notificationSettings, confirmationEmail: checked } }))}
                />
                <Label htmlFor="confirmationEmail">預約確認電子郵件</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="reminderEmail"
                  checked={formData.notificationSettings.reminderEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificationSettings: { ...prev.notificationSettings, reminderEmail: checked } }))}
                />
                <Label htmlFor="reminderEmail">提醒電子郵件</Label>
              </div>

              <div>
                <Label htmlFor="reminderHours">提前提醒時間 (小時)</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min="0"
                  max="24"
                  value={formData.notificationSettings.reminderHours}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    notificationSettings: { ...prev.notificationSettings, reminderHours: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Cài đặt thanh toán</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">貨幣單位</Label>
                  <Input
                    id="currency"
                    value={formData.paymentSettings.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentSettings: { ...prev.paymentSettings, currency: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">稅率 (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.paymentSettings.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentSettings: { ...prev.paymentSettings, taxRate: parseFloat(e.target.value) } }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="acceptCash"
                    checked={formData.paymentSettings.acceptCash}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paymentSettings: { ...prev.paymentSettings, acceptCash: checked } }))}
                  />
                  <Label htmlFor="acceptCash">接受現金</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="acceptCreditCard"
                    checked={formData.paymentSettings.acceptCreditCard}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paymentSettings: { ...prev.paymentSettings, acceptCreditCard: checked } }))}
                  />
                  <Label htmlFor="acceptCreditCard">接受信用卡</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="acceptOnlinePayment"
                    checked={formData.paymentSettings.acceptOnlinePayment}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paymentSettings: { ...prev.paymentSettings, acceptOnlinePayment: checked } }))}
                  />
                  <Label htmlFor="acceptOnlinePayment">接受線上付款</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Luggage Settings */}
        <TabsContent value="luggage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span>Cài đặt hành lý</span>
              </CardTitle>
              <CardDescription>
                配置行李費用和免費行李數量
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="freeLuggageCount">免費行李數量</Label>
                  <Input
                    id="freeLuggageCount"
                    type="number"
                    min="0"
                    value={formData.luggageSettings.freeLuggageCount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      luggageSettings: { 
                        ...prev.luggageSettings, 
                        freeLuggageCount: parseInt(e.target.value) || 0 
                      }
                    }))}
                    placeholder="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    每個預約的免費行李數量
                  </p>
                </div>
                <div>
                  <Label htmlFor="luggagePricePerItem">每件額外行李價格 (NT$)</Label>
                  <Input
                    id="luggagePricePerItem"
                    type="number"
                    min="0"
                    value={formData.luggageSettings.luggagePricePerItem}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      luggageSettings: { 
                        ...prev.luggageSettings, 
                        luggagePricePerItem: parseInt(e.target.value) || 0 
                      }
                    }))}
                    placeholder="100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    超過免費數量後每件行李的費用
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">費用計算範例：</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• 如果客戶選擇1件行李：免費 (≤ {formData.luggageSettings.freeLuggageCount})</p>
                  <p>• 如果客戶選擇2件行李：額外費用 {formData.luggageSettings.luggagePricePerItem} NT$</p>
                  <p>• 如果客戶選擇3件行李：額外費用 {formData.luggageSettings.luggagePricePerItem * 2} NT$</p>
                </div>
              </div>

              {/* Luggage Content Configuration */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">行李內容配置</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="luggageContentActive"
                      checked={formData.luggageSettings.luggageContent.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        luggageSettings: { 
                          ...prev.luggageSettings, 
                          luggageContent: { 
                            ...prev.luggageSettings.luggageContent, 
                            isActive: checked 
                          }
                        }
                      }))}
                    />
                    <Label htmlFor="luggageContentActive">啟用行李內容提示</Label>
                  </div>

                  {formData.luggageSettings.luggageContent.isActive && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="luggageContentTitle">行李內容標題</Label>
                        <Input
                          id="luggageContentTitle"
                          value={formData.luggageSettings.luggageContent.title}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            luggageSettings: { 
                              ...prev.luggageSettings, 
                              luggageContent: { 
                                ...prev.luggageSettings.luggageContent, 
                                title: e.target.value 
                              }
                            }
                          }))}
                          placeholder="行李注意事項"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="luggageContentDescription">行李內容描述</Label>
                        <Textarea
                          id="luggageContentDescription"
                          value={formData.luggageSettings.luggageContent.description}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            luggageSettings: { 
                              ...prev.luggageSettings, 
                              luggageContent: { 
                                ...prev.luggageSettings.luggageContent, 
                                description: e.target.value 
                              }
                            }
                          }))}
                          rows={4}
                          placeholder="請注意您的行李安全，建議將貴重物品隨身攜帶。"
                        />
                      </div>

                      {/* Luggage Content Image Upload */}
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          行李內容圖片
                        </Label>
                        <ContactImageUpload
                          existingImageUrl={formData.luggageSettings.luggageContent.imageUrl}
                          onUploadSuccess={handleLuggageImageUpload}
                          onDeleteSuccess={handleLuggageImageDelete}
                        />
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h5 className="font-semibold text-yellow-900 mb-2">預覽效果：</h5>
                        <div className="bg-white p-3 rounded border border-yellow-300">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-yellow-600">💡</span>
                            <span className="font-medium text-yellow-800">
                              {formData.luggageSettings.luggageContent.title}
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            {formData.luggageSettings.luggageContent.description}
                          </p>
                          {formData.luggageSettings.luggageContent.imageUrl && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => window.open(formData.luggageSettings.luggageContent.imageUrl, '_blank')}
                                className="w-full focus:outline-none"
                              >
                                <img
                                  src={formData.luggageSettings.luggageContent.imageUrl}
                                  alt="Luggage content image"
                                  className="w-full max-h-64 object-contain rounded border bg-white cursor-zoom-in"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Terms */}
        <TabsContent value="contract" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>合約條款設定</span>
              </CardTitle>
              <CardDescription>
                配置列印預約單時顯示的合約條款內容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contractTerms">合約條款內容</Label>
                <div className="mt-2 border rounded-lg">
                  <ReactQuill
                    theme="snow"
                    value={formData.contractTerms}
                    onChange={(value) => setFormData(prev => ({ ...prev, contractTerms: value }))}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                    style={{ minHeight: '300px' }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  此內容將在列印預約單時顯示。支持HTML格式。
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  預覽效果
                </h4>
                <div className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: formData.contractTerms }} />
              </div>

              <Button onClick={handleSaveContractTerms} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存合約條款'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms Management */}
        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>條款管理</span>
              </CardTitle>
              <CardDescription>
                管理系統的所有條款和規定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(termsData) as Array<keyof TermsData>).map((section) => (
                  <Card key={section} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getSectionIcon(section)}
                          <CardTitle className="text-sm">{getSectionName(section)}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={termsData[section].isActive ? "default" : "secondary"}>
                            {termsData[section].isActive ? "啟用" : "停用"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSection(section)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {termsData[section].content.substring(0, 100)}...
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSection(section)}
                        >
                          {termsData[section].isActive ? "停用" : "啟用"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button onClick={handleSaveTerms} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                儲存所有條款
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Terms Dialog */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              編輯 {editingSection ? getSectionName(editingSection) : ''}
            </DialogTitle>
            <DialogDescription>
              更新此條款內容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={15}
              placeholder="輸入條款內容..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              取消
            </Button>
            <Button onClick={handleUpdateSection} disabled={saving}>
                              <Save className="h-4 w-4 mr-2" />
                儲存變更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings; 