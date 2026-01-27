import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Tag,
  Plus,
  Edit,
  Trash2,
  Copy,
  // CheckCircle,
  // XCircle,
  // Calendar,
  // DollarSign,
  // Users,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode } from '@/services/admin';

interface DiscountCode {
  _id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  maxUsage: number;
  currentUsage: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

const AdminDiscounts: React.FC = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: 0,
    maxUsage: 100,
    isActive: true,
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    try {
      setLoading(true);
      const data = await getAllDiscountCodes();
      setDiscountCodes(data.discountCodes);
    } catch (error: any) {
      toast.error('無法載入折扣碼清單');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createDiscountCode(formData);
      toast.success('創建折扣碼成功');
      setShowCreateDialog(false);
      resetForm();
      loadDiscountCodes();
    } catch (error: any) {
      toast.error('無法創建折扣碼');
    }
  };

  const handleEdit = async () => {
    if (!selectedCode) return;
    
    try {
      await updateDiscountCode(selectedCode._id, formData);
      toast.success('更新折扣碼成功');
      setShowEditDialog(false);
      resetForm();
      loadDiscountCodes();
    } catch (error: any) {
      toast.error('無法更新折扣碼');
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;
    
    try {
      await deleteDiscountCode(selectedCode._id);
      toast.success('刪除折扣碼成功');
      setShowDeleteDialog(false);
      setSelectedCode(null);
      loadDiscountCodes();
    } catch (error: any) {
      toast.error('無法刪除折扣碼');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: 0,
      maxUsage: 100,
      isActive: true,
      validFrom: '',
      validTo: ''
    });
    setIsEditing(false);
    setSelectedCode(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (code: DiscountCode) => {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount || 0,
      maxDiscount: code.maxDiscount || 0,
      maxUsage: code.maxUsage,
      isActive: code.isActive,
      validFrom: code.validFrom,
      validTo: code.validTo
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (code: DiscountCode) => {
    setSelectedCode(code);
    setShowDeleteDialog(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã giảm giá');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getStatusBadge = (code: DiscountCode) => {
    const now = new Date();
    const startDate = new Date(code.validFrom);
    const endDate = new Date(code.validTo);
    
    if (!code.isActive) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">暫停</Badge>; 
    }
    
    if (now < startDate) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">未開始</Badge>; 
    }
    
    if (now > endDate) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">過期</Badge>; 
    }
    
    if (code.currentUsage >= code.maxUsage) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">已用完</Badge>; 
    }
    
    return <Badge className="bg-green-100 text-green-800">啟用</Badge>; 
  };

  const filteredDiscountCodes = discountCodes.filter(code => {
    const matchesSearch = 
      code.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || code.discountType === typeFilter;
    
    return matchesSearch && matchesType;
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold">折扣碼</h1>
          <p className="text-gray-600 text-sm sm:text-base">管理折扣碼和優惠</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadDiscountCodes} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
          <Button onClick={openCreateDialog} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">新增折扣碼</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            篩選
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search">搜尋</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="名稱, 代碼, 描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">折扣類型</Label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">所有類型</option>
                <option value="percentage">百分比 (%)</option>
                <option value="fixed">固定金額</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                篩選
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">折扣碼清單</CardTitle>
          <CardDescription className="text-sm">
            總共 {filteredDiscountCodes.length} 個折扣碼
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資訊</TableHead>
                <TableHead>價值</TableHead>
                <TableHead>使用</TableHead>
                <TableHead>期限</TableHead> 
                <TableHead>狀態</TableHead> 
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscountCodes.map((code) => (
                <TableRow key={code._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Tag className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{code.name}</div>
                        <div className="text-sm text-gray-600 font-mono">{code.code}</div>
                        <div className="text-sm text-gray-500">{code.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">
                        {code.discountType === 'percentage' ? `${code.discountValue}%` : `${code.discountValue} TWD`}
                      </div>
                                             {code.minOrderAmount && code.minOrderAmount > 0 && (
                         <div className="text-gray-500">最低: {code.minOrderAmount} TWD</div>
                       )}
                       {code.maxDiscount && code.maxDiscount > 0 && (
                         <div className="text-gray-500">最高: {code.maxDiscount} TWD</div>
                       )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div>{code.currentUsage}/{code.maxUsage}</div>
                        <div className="text-gray-500">已使用</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#39653f] h-2 rounded-full transition-all"
                          style={{ width: `${getUsagePercentage(code.currentUsage, code.maxUsage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>從: {formatDate(code.validFrom)}</div>
                      <div>到: {formatDate(code.validTo)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(code)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(code)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyCode(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(code)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* No Results */}
          {filteredDiscountCodes.length === 0 && (
            <div className="p-8 text-center">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">找不到折扣碼</h3>
              <p className="text-gray-500">
                沒有找到符合目前篩選條件的折扣碼。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{isEditing ? '編輯折扣碼' : '新增折扣碼'}</DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? '更新折扣碼資訊' : '創建新的折扣碼並提供必要資訊'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="code">折扣碼 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Ví dụ: WELCOME10"
                />
              </div>
              <div> 
                <Label htmlFor="name">折扣碼名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如: 歡迎折扣"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="輸入折扣碼詳細描述..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="discountType">折扣類型</Label> 
                <select
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="percentage">百分比 (%)</option>
                  <option value="fixed">固定金額 (TWD)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discountValue">折扣價值 *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseInt(e.target.value) }))}
                  placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="minOrderAmount">最低訂單金額 (TWD)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">最高折扣金額 (TWD)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: parseInt(e.target.value) }))}
                  placeholder="0 (不限制)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="maxUsage">使用限制</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="validFrom">開始日期</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="validTo">結束日期</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">啟用此折扣碼</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              resetForm();
            }}>
              取消
            </Button> 
            <Button onClick={isEditing ? handleEdit : handleCreate}>
              {isEditing ? '更新' : '創建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              您確定要刪除折扣碼 "{selectedCode?.name}" ({selectedCode?.code})? 
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

export default AdminDiscounts; 