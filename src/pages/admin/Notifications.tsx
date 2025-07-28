import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Bell,
  Save,
  Edit,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  Eye,
  Plus,
  Trash2,
  Search,
  // Filter,
  RefreshCw,
  TestTube,
  Users,
  BarChart3,
  // Copy,
  // Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getAllNotificationTemplates, 
  createNotificationTemplate, 
  updateNotificationTemplate, 
  deleteNotificationTemplate,
  testNotification,
  sendBulkNotification,
  getNotificationStats
} from '@/services/admin';

interface NotificationTemplate {
  _id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  isActive: boolean;
  variables: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  stats: Array<{
    _id: string;
    count: number;
    activeCount: number;
  }>;
  total: number;
  active: number;
  inactive: number;
}

const AdminNotifications: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('email');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'push',
    subject: '',
    content: '',
    description: '',
    variables: [] as string[],
    isActive: true
  });

  // Test notification form data
  const [testFormData, setTestFormData] = useState({
    templateName: '',
    type: 'email' as 'email' | 'sms' | 'push',
    recipient: '',
    variables: {} as Record<string, string>
  });

  // Bulk notification form data
  const [bulkFormData, setBulkFormData] = useState({
    templateName: '',
    type: 'email' as 'email' | 'sms' | 'push',
    recipients: '',
    variables: {} as Record<string, string>
  });

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllNotificationTemplates({
        type: activeTab,
        search: searchTerm
      });
      setTemplates(data.templates);
    } catch (error: any) {
      toast.error('Không thể tải danh sách mẫu thông báo');
      console.error('Load templates error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getNotificationStats();
      setStats(data);
    } catch (error: any) {
      console.error('Load stats error:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await createNotificationTemplate(formData);
      toast.success('Tạo mẫu thông báo thành công');
      setShowCreateDialog(false);
      resetForm();
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error('Không thể tạo mẫu thông báo');
      console.error('Create template error:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    
    try {
      await updateNotificationTemplate(selectedTemplate._id, formData);
      toast.success('Cập nhật mẫu thông báo thành công');
      setShowEditDialog(false);
      resetForm();
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error('Không thể cập nhật mẫu thông báo');
      console.error('Update template error:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    
    try {
      await deleteNotificationTemplate(selectedTemplate._id);
      toast.success('Xóa mẫu thông báo thành công');
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error('Không thể xóa mẫu thông báo');
      console.error('Delete template error:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestLoading(true);
      const result = await testNotification(testFormData);
      console.log('Test notification result:', result);
      toast.success('Gửi thông báo test thành công');
      setShowTestDialog(false);
      resetTestForm();
    } catch (error: any) {
      toast.error('Không thể gửi thông báo test');
      console.error('Test notification error:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleBulkNotification = async () => {
    try {
      setBulkLoading(true);
      const recipients = bulkFormData.recipients.split(',').map(r => r.trim()).filter(r => r);
      const result = await sendBulkNotification({
        ...bulkFormData,
        recipients
      });
      toast.success(`Gửi thông báo hàng loạt thành công: ${result.message}`);
      setShowBulkDialog(false);
      resetBulkForm();
    } catch (error: any) {
      toast.error('Không thể gửi thông báo hàng loạt');
      console.error('Bulk notification error:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      content: '',
      description: '',
      variables: [],
      isActive: true
    });
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const resetTestForm = () => {
    setTestFormData({
      templateName: '',
      type: 'email',
      recipient: '',
      variables: {}
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      templateName: '',
      type: 'email',
      recipients: '',
      variables: {}
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData(prev => ({ ...prev, type: activeTab as 'email' | 'sms' | 'push' }));
    setShowCreateDialog(true);
  };

  const openEditDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      description: template.description,
      variables: template.variables || [],
      isActive: template.isActive
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const openTestDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTestFormData({
      templateName: template.name,
      type: template.type,
      recipient: '',
      variables: {}
    });
    setShowTestDialog(true);
  };

  const openBulkDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setBulkFormData({
      templateName: template.name,
      type: template.type,
      recipients: '',
      variables: {}
    });
    setShowBulkDialog(true);
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    // Simulate preview with sample data
    let previewContent = template.content;
    template.variables.forEach(variable => {
      const sampleData: { [key: string]: string } = {
        customerName: 'Nguyễn Văn A',
        bookingId: 'BK2024001',
        bookingDate: '15/01/2024',
        startTime: '08:00',
        endTime: '12:00',
        parkingType: 'Trong nhà',
        totalAmount: '400',
        location: 'Tầng 1, Khu A',
        reminderTime: '30 phút',
        amount: '400',
        paymentMethod: 'Thẻ tín dụng',
        paymentTime: '15/01/2024 07:30',
        refundAmount: '400',
        refundTime: '15/01/2024 10:00',
        discountPercent: '20',
        promoCode: 'SAVE20',
        expiryDate: '31/01/2024'
      };
      previewContent = previewContent.replace(new RegExp(`{{${variable}}}`, 'g'), sampleData[variable] || `[${variable}]`);
    });
    
    setPreviewContent(previewContent);
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      email: Mail,
      sms: MessageSquare,
      push: Smartphone
    };
    return icons[type as keyof typeof icons] || Bell;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      email: 'bg-blue-100 text-blue-800',
      sms: 'bg-green-100 text-green-800',
      push: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredTemplates = templates.filter(template => {
    const matchesType = template.type === activeTab;
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Reload templates when tab or search changes
  useEffect(() => {
    loadTemplates();
  }, [activeTab, searchTerm]);

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
          <h1 className="text-3xl font-bold">Mẫu thông báo</h1>
          <p className="text-gray-600">Quản lý các mẫu thông báo hệ thống</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadTemplates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm mẫu mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Tổng mẫu</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Đang hoạt động</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Tạm khóa</p>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Loại</p>
                  <p className="text-2xl font-bold">{stats.stats.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tên, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="push">Push Notification</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách mẫu thông báo</CardTitle>
              <CardDescription>
                Tổng cộng {filteredTemplates.length} mẫu thông báo {activeTab.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thông tin</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Biến</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const IconComponent = getTypeIcon(template.type);
                    return (
                      <TableRow key={template._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-gray-600">{template.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeBadge(template.type)}>
                            {template.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {template.subject || 'Không có tiêu đề'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(template.variables || []).slice(0, 3).map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                            {(template.variables || []).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(template.variables || []).length - 3} nữa
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Tạm khóa
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewTemplate(template)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openTestDialog(template)}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openBulkDialog(template)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(template)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* No Results */}
              {filteredTemplates.length === 0 && (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có mẫu thông báo</h3>
                  <p className="text-gray-500">
                    Chưa có mẫu thông báo nào cho loại {activeTab.toUpperCase()}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Chỉnh sửa mẫu thông báo' : 'Thêm mẫu thông báo mới'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật nội dung mẫu thông báo' : 'Tạo mẫu thông báo mới với các thông tin cần thiết'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên mẫu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Xác nhận đặt chỗ"
                />
              </div>
              <div>
                <Label htmlFor="type">Loại thông báo</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'email' | 'sms' | 'push' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
            </div>

            {formData.type === 'email' && (
              <div>
                <Label htmlFor="subject">Tiêu đề email</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Nhập tiêu đề email..."
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả mẫu thông báo..."
              />
            </div>

            <div>
              <Label htmlFor="content">Nội dung *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="font-mono text-sm"
                placeholder="Nhập nội dung thông báo... Sử dụng {{variable}} để chèn biến."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Kích hoạt mẫu thông báo này</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              resetForm();
            }}>
              Hủy
            </Button>
            <Button onClick={isEditing ? handleEdit : handleCreate}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Cập nhật' : 'Tạo mẫu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Notification Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test gửi thông báo</DialogTitle>
            <DialogDescription>
              Gửi thông báo test để kiểm tra mẫu "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="testRecipient">Người nhận *</Label>
              <Input
                id="testRecipient"
                value={testFormData.recipient}
                onChange={(e) => setTestFormData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder={testFormData.type === 'email' ? 'email@example.com' : testFormData.type === 'sms' ? '+84901234567' : 'device_token'}
              />
            </div>

            <div>
              <Label>Biến (tùy chọn)</Label>
              <div className="space-y-2">
                {(selectedTemplate?.variables || []).map((variable) => (
                  <div key={variable} className="flex space-x-2">
                    <Label className="w-24 text-sm">{variable}:</Label>
                    <Input
                      value={testFormData.variables[variable] || ''}
                      onChange={(e) => setTestFormData(prev => ({
                        ...prev,
                        variables: { ...prev.variables, [variable]: e.target.value }
                      }))}
                      placeholder={`Giá trị cho ${variable}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleTestNotification} disabled={testLoading}>
              <Send className="h-4 w-4 mr-2" />
              {testLoading ? 'Đang gửi...' : 'Gửi test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Notification Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi thông báo hàng loạt</DialogTitle>
            <DialogDescription>
              Gửi thông báo "{selectedTemplate?.name}" cho nhiều người nhận
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkRecipients">Danh sách người nhận *</Label>
              <Textarea
                id="bulkRecipients"
                value={bulkFormData.recipients}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, recipients: e.target.value }))}
                placeholder={bulkFormData.type === 'email' ? 'email1@example.com, email2@example.com' : bulkFormData.type === 'sms' ? '+84901234567, +84987654321' : 'token1, token2'}
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                Mỗi người nhận trên một dòng hoặc phân cách bằng dấu phẩy
              </p>
            </div>

            <div>
              <Label>Biến (tùy chọn)</Label>
              <div className="space-y-2">
                {(selectedTemplate?.variables || []).map((variable) => (
                  <div key={variable} className="flex space-x-2">
                    <Label className="w-24 text-sm">{variable}:</Label>
                    <Input
                      value={bulkFormData.variables[variable] || ''}
                      onChange={(e) => setBulkFormData(prev => ({
                        ...prev,
                        variables: { ...prev.variables, [variable]: e.target.value }
                      }))}
                      placeholder={`Giá trị cho ${variable}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleBulkNotification} disabled={bulkLoading}>
              <Users className="h-4 w-4 mr-2" />
              {bulkLoading ? 'Đang gửi...' : 'Gửi hàng loạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước mẫu thông báo</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name} - {selectedTemplate?.type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTemplate?.subject && (
              <div>
                <Label className="text-sm font-medium">Tiêu đề:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedTemplate.subject}</p>
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium">Nội dung:</Label>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {previewContent}
                </pre>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Biến đã thay thế:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {(selectedTemplate?.variables || []).map((variable) => (
                  <Badge key={variable} variant="outline" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa mẫu thông báo "{selectedTemplate?.name}"? 
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;