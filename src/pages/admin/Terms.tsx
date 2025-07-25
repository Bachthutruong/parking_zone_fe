import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  Save,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Phone,
  // Mail,
//   MapPin,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllTerms, updateTermsSection, saveAllTerms } from '@/services/admin';

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
• Chấp nhận các phương thức thanh toán được hỗ trợ
• Giữ hóa đơn để đối soát`,
    isActive: true
  },
  privacyPolicy: {
    content: `1. Chính sách bảo mật thông tin

• Chúng tôi cam kết bảo vệ thông tin cá nhân của khách hàng
• Thông tin chỉ được sử dụng cho mục đích đặt chỗ và liên lạc
• Không chia sẻ thông tin với bên thứ ba

2. Thu thập thông tin

• Thông tin cá nhân: họ tên, số điện thoại, email
• Thông tin xe: biển số xe, loại xe
• Thông tin đặt chỗ: thời gian, vị trí

3. Sử dụng thông tin

• Xử lý đặt chỗ và thanh toán
• Gửi thông báo và xác nhận
• Cải thiện dịch vụ
• Liên lạc khẩn cấp

4. Bảo vệ thông tin

• Mã hóa dữ liệu
• Kiểm soát truy cập
• Sao lưu định kỳ
• Tuân thủ quy định pháp luật`,
    isActive: true
  },
  contactInfo: {
    content: `Thông tin liên hệ

🏢 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM
📞 Điện thoại: 090-123-4567
📧 Email: info@parkingzone.com
🌐 Website: www.parkingzone.com

Giờ làm việc:
• Thứ 2 - Thứ 6: 7:00 - 22:00
• Thứ 7 - Chủ nhật: 8:00 - 21:00

Hỗ trợ khách hàng:
• Hotline: 1900-1234
• Email: support@parkingzone.com
• Chat online: 24/7

Liên hệ khẩn cấp:
• Bảo vệ: 090-999-8888
• Kỹ thuật: 090-777-6666`,
    isActive: true
  },
  timeSlotInterval: {
    content: `Khoảng thời gian đặt chỗ

⏰ Khoảng thời gian: 30 phút
• Đặt chỗ theo khoảng 30 phút
• Ví dụ: 8:00, 8:30, 9:00, 9:30...

🕐 Giờ mở cửa: 6:00 - 24:00
• Có thể đặt chỗ từ 6:00 sáng
• Đặt chỗ tối đa đến 24:00

📅 Thời gian đặt trước:
• Tối thiểu: 1 giờ trước
• Tối đa: 30 ngày trước

⏱️ Thời gian tối thiểu:
• Mỗi lần đặt: 1 giờ
• Không giới hạn thời gian tối đa`,
    isActive: true
  },
  cancellationPolicy: {
    content: `Chính sách hủy đặt chỗ

❌ Hủy miễn phí:
• Trước 2 giờ: Hoàn tiền 100%
• Trước 1 giờ: Hoàn tiền 50%
• Dưới 1 giờ: Không hoàn tiền

⚠️ Lưu ý:
• Thời gian tính từ giờ đặt chỗ
• Hoàn tiền trong vòng 3-5 ngày làm việc
• Áp dụng cho tất cả loại bãi đậu xe

🔄 Thay đổi đặt chỗ:
• Có thể thay đổi thời gian trước 2 giờ
• Không tính phí thay đổi
• Chỉ được thay đổi 1 lần

📞 Liên hệ hủy:
• Hotline: 1900-1234
• Email: cancel@parkingzone.com
• App/Website: Trong mục "Đặt chỗ của tôi"`,
    isActive: true
  },
  refundPolicy: {
    content: `Chính sách hoàn tiền

💰 Hoàn tiền tự động:
• Hủy trước 2 giờ: 100% số tiền
• Hủy trước 1 giờ: 50% số tiền
• Dưới 1 giờ: Không hoàn tiền

⏰ Thời gian hoàn tiền:
• Thẻ tín dụng: 3-5 ngày làm việc
• Chuyển khoản: 1-2 ngày làm việc
• Ví điện tử: Ngay lập tức

📋 Điều kiện hoàn tiền:
• Đã thanh toán đầy đủ
• Hủy đúng quy định
• Thông tin tài khoản chính xác

❓ Trường hợp đặc biệt:
• Sự cố hệ thống: Hoàn tiền 100%
• Bảo trì bãi xe: Hoàn tiền 100%
• Thiên tai: Hoàn tiền 100%

📞 Liên hệ hoàn tiền:
• Hotline: 1900-1234
• Email: refund@parkingzone.com`,
    isActive: true
  }
};

const AdminTerms: React.FC = () => {
  const [termsData, setTermsData] = useState<TermsData>(defaultTermsData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('bookingTerms');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<keyof TermsData | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const data = await getAllTerms();
      // Merge with default data to ensure all sections exist
      const mergedData = { ...defaultTermsData, ...data.terms };
      setTermsData(mergedData);
    } catch (error: any) {
      toast.error('Không thể tải điều khoản');
      console.error('Load terms error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerms = async () => {
    try {
      setSaving(true);
      await saveAllTerms(termsData);
      toast.success('Đã lưu điều khoản thành công');
    } catch (error: any) {
      toast.error('Không thể lưu điều khoản');
      console.error('Save terms error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSection = (section: keyof TermsData) => {
    setEditingSection(section);
    setEditContent(termsData[section].content);
    setShowEditDialog(true);
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;
    
    try {
      await updateTermsSection(editingSection, {
        content: editContent,
        isActive: termsData[editingSection].isActive
      });
      
      setTermsData(prev => ({
        ...prev,
        [editingSection]: {
          ...prev[editingSection],
          content: editContent
        }
      }));
      
      setShowEditDialog(false);
      setEditingSection(null);
      toast.success('Đã cập nhật nội dung');
    } catch (error: any) {
      toast.error('Không thể cập nhật nội dung');
      console.error('Update section error:', error);
    }
  };

  const handleToggleSection = async (section: keyof TermsData) => {
    try {
      const newIsActive = !termsData[section].isActive;
      
      await updateTermsSection(section, {
        content: termsData[section].content,
        isActive: newIsActive
      });
      
      setTermsData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          isActive: newIsActive
        }
      }));
      
      toast.success(`Đã ${newIsActive ? 'bật' : 'tắt'} ${getSectionName(section)}`);
    } catch (error: any) {
      toast.error('Không thể thay đổi trạng thái');
      console.error('Toggle section error:', error);
    }
  };

  const getSectionName = (section: keyof TermsData) => {
    const names = {
      bookingTerms: 'Điều khoản đặt chỗ',
      bookingRules: 'Quy định sử dụng',
      privacyPolicy: 'Chính sách bảo mật',
      contactInfo: 'Thông tin liên hệ',
      timeSlotInterval: 'Khoảng thời gian',
      cancellationPolicy: 'Chính sách hủy',
      refundPolicy: 'Chính sách hoàn tiền'
    };
    return names[section];
  };

  const getSectionIcon = (section: keyof TermsData) => {
    const icons = {
      bookingTerms: FileText,
      bookingRules: AlertTriangle,
      privacyPolicy: Info,
      contactInfo: Phone,
      timeSlotInterval: Clock,
      cancellationPolicy: XCircle,
      refundPolicy: CheckCircle
    };
    return icons[section];
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Điều khoản và quy định</h1>
          <p className="text-gray-600">Quản lý nội dung điều khoản và quy định hệ thống</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadTerms}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleSaveTerms} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bookingTerms">Điều khoản đặt chỗ</TabsTrigger>
          <TabsTrigger value="bookingRules">Quy định sử dụng</TabsTrigger>
          <TabsTrigger value="privacyPolicy">Chính sách bảo mật</TabsTrigger>
          <TabsTrigger value="contactInfo">Thông tin liên hệ</TabsTrigger>
        </TabsList>

        {/* Booking Terms */}
        <TabsContent value="bookingTerms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <div>
                    <CardTitle>Điều khoản đặt chỗ</CardTitle>
                    <CardDescription>Nội dung điều khoản đặt chỗ bãi đậu xe</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={termsData.bookingTerms.isActive ? "default" : "secondary"}>
                    {termsData.bookingTerms.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEditSection('bookingTerms')}>
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleSection('bookingTerms')}
                  >
                    {termsData.bookingTerms.isActive ? 'Ẩn' : 'Hiển thị'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {termsData.bookingTerms.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Rules */}
        <TabsContent value="bookingRules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <CardTitle>Quy định sử dụng</CardTitle>
                    <CardDescription>Nội dung quy định sử dụng bãi đậu xe</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={termsData.bookingRules.isActive ? "default" : "secondary"}>
                    {termsData.bookingRules.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEditSection('bookingRules')}>
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleSection('bookingRules')}
                  >
                    {termsData.bookingRules.isActive ? 'Ẩn' : 'Hiển thị'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {termsData.bookingRules.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Policy */}
        <TabsContent value="privacyPolicy" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <div>
                    <CardTitle>Chính sách bảo mật</CardTitle>
                    <CardDescription>Nội dung chính sách bảo mật thông tin</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={termsData.privacyPolicy.isActive ? "default" : "secondary"}>
                    {termsData.privacyPolicy.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEditSection('privacyPolicy')}>
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleSection('privacyPolicy')}
                  >
                    {termsData.privacyPolicy.isActive ? 'Ẩn' : 'Hiển thị'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {termsData.privacyPolicy.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contactInfo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <div>
                    <CardTitle>Thông tin liên hệ</CardTitle>
                    <CardDescription>Thông tin liên hệ và hỗ trợ khách hàng</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={termsData.contactInfo.isActive ? "default" : "secondary"}>
                    {termsData.contactInfo.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEditSection('contactInfo')}>
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleSection('contactInfo')}
                  >
                    {termsData.contactInfo.isActive ? 'Ẩn' : 'Hiển thị'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {termsData.contactInfo.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(['timeSlotInterval', 'cancellationPolicy', 'refundPolicy'] as const).map((section) => {
          const IconComponent = getSectionIcon(section);
          return (
            <Card key={section}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{getSectionName(section)}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={termsData[section].isActive ? "default" : "secondary"}>
                      {termsData[section].isActive ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {termsData[section].content}
                  </pre>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditSection(section)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleSection(section)}
                  >
                    {termsData[section].isActive ? 'Ẩn' : 'Hiển thị'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa {editingSection ? getSectionName(editingSection) : ''}
            </DialogTitle>
            <DialogDescription>
              Cập nhật nội dung điều khoản và quy định
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Nội dung</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Nhập nội dung điều khoản..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateSection}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTerms; 