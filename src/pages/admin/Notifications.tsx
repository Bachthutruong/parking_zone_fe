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
      toast.error('無法載入通知模板清單');
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
      toast.success('創建通知模板成功');
      setShowCreateDialog(false);
      resetForm();
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error('無法創建通知模板');
      console.error('Create template error:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    
    try {
      await updateNotificationTemplate(selectedTemplate._id, formData);
      toast.success('更新通知模板成功');
      setShowEditDialog(false);
      resetForm();
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error('無法更新通知模板');
      console.error('Update template error:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    
    try {
      await deleteNotificationTemplate(selectedTemplate._id);
      toast.success('刪除通知模板成功');
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error('無法刪除通知模板');
      console.error('Delete template error:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestLoading(true);
      const result = await testNotification(testFormData);
      console.log('Test notification result:', result);
      toast.success('發送測試通知成功');
      setShowTestDialog(false);
      resetTestForm();
    } catch (error: any) {
      toast.error('無法發送測試通知');
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
      toast.success(`發送批量通知成功: ${result.message}`);
      setShowBulkDialog(false);
      resetBulkForm();
    } catch (error: any) {
      toast.error('無法發送批量通知');
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">通知模板</h1>
          <p className="text-gray-600 text-sm sm:text-base">管理系統通知模板</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadTemplates} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
          <Button onClick={openCreateDialog} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">新增模板</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">總共模板</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">啟用</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">暫停</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">類型</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.stats.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Filter */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            搜尋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="名稱、描述..."
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
          <TabsTrigger value="push">推送通知</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>通知模板清單</CardTitle>
              <CardDescription>
                總共 {filteredTemplates.length} 個通知模板 {activeTab.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>資訊</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>標題</TableHead>
                    <TableHead>變數</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>操作</TableHead>
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
                                啟用
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                暫停
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
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">沒有通知模板</h3>
                  <p className="text-gray-500">
                    沒有通知模板 {activeTab.toUpperCase()}.
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
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {isEditing ? '編輯通知模板' : '新增通知模板'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? '更新通知模板內容' : '創建新的通知模板並提供必要資訊'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="name">通知模板名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如: 確認預約"
                />
              </div>
              <div>
                <Label htmlFor="type">通知類型</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'email' | 'sms' | 'push' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">推送通知</option>
                </select>
              </div>
            </div>

            {formData.type === 'email' && (
              <div>
                <Label htmlFor="subject">電郵標題</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="輸入電郵標題..."
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="輸入通知模板描述..."
              />
            </div>

            <div>
              <Label htmlFor="content">內容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="font-mono text-sm"
                placeholder="輸入通知模板內容... 使用 {{variable}} 插入變數."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">啟用此通知模板</Label>
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
              {isEditing ? '更新' : '創建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Notification Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">測試發送通知</DialogTitle>
            <DialogDescription className="text-sm">
              發送測試通知以測試模板 "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="testRecipient">接收者 *</Label>
              <Input
                id="testRecipient"
                value={testFormData.recipient}
                onChange={(e) => setTestFormData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder={testFormData.type === 'email' ? 'email@example.com' : testFormData.type === 'sms' ? '+84901234567' : 'device_token'}
              />
            </div>

            <div>
              <Label>變數 (可選)</Label>
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
                      placeholder={`輸入 ${variable} 的值`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              取消
            </Button>
            <Button onClick={handleTestNotification} disabled={testLoading}>
              <Send className="h-4 w-4 mr-2" />
              {testLoading ? '正在發送...' : '發送測試'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Notification Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">發送批量通知</DialogTitle>
            <DialogDescription className="text-sm">
              發送通知 "{selectedTemplate?.name}" 給多個接收者
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="bulkRecipients">接收者列表 *</Label>
              <Textarea
                id="bulkRecipients"
                value={bulkFormData.recipients}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, recipients: e.target.value }))}
                placeholder={bulkFormData.type === 'email' ? 'email1@example.com, email2@example.com' : bulkFormData.type === 'sms' ? '+84901234567, +84987654321' : 'token1, token2'}
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                每個接收者一行或用逗號分隔
              </p>
            </div>

            <div>
              <Label>變數 (可選)</Label>
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
                      placeholder={`輸入 ${variable} 的值`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              取消
            </Button>
            <Button onClick={handleBulkNotification} disabled={bulkLoading}>
              <Users className="h-4 w-4 mr-2" />
              {bulkLoading ? '正在發送...' : '發送批量'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">預覽通知模板</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedTemplate?.name} - {selectedTemplate?.type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            {selectedTemplate?.subject && (
              <div>
                <Label className="text-sm font-medium">標題:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedTemplate.subject}</p>
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium">內容:</Label>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {previewContent}
                </pre>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">已替換的變數:</Label>
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
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">確認刪除</DialogTitle>
            <DialogDescription className="text-sm">
              您確定要刪除通知模板 "{selectedTemplate?.name}"? 
              此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;