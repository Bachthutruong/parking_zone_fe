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
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createDiscountCode(formData);
      toast.success('Tạo mã giảm giá thành công');
      setShowCreateDialog(false);
      resetForm();
      loadDiscountCodes();
    } catch (error: any) {
      toast.error('Không thể tạo mã giảm giá');
    }
  };

  const handleEdit = async () => {
    if (!selectedCode) return;
    
    try {
      await updateDiscountCode(selectedCode._id, formData);
      toast.success('Cập nhật mã giảm giá thành công');
      setShowEditDialog(false);
      resetForm();
      loadDiscountCodes();
    } catch (error: any) {
      toast.error('Không thể cập nhật mã giảm giá');
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;
    
    try {
      await deleteDiscountCode(selectedCode._id);
      toast.success('Xóa mã giảm giá thành công');
      setShowDeleteDialog(false);
      setSelectedCode(null);
      loadDiscountCodes();
    } catch (error: any) {
      toast.error('Không thể xóa mã giảm giá');
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
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getStatusBadge = (code: DiscountCode) => {
    const now = new Date();
    const startDate = new Date(code.validFrom);
    const endDate = new Date(code.validTo);
    
    if (!code.isActive) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Tạm khóa</Badge>;
    }
    
    if (now < startDate) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Chưa bắt đầu</Badge>;
    }
    
    if (now > endDate) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Hết hạn</Badge>;
    }
    
    if (code.currentUsage >= code.maxUsage) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Hết lượt</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>;
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
          <h1 className="text-3xl font-bold">Mã giảm giá</h1>
          <p className="text-gray-600">Quản lý các mã giảm giá và khuyến mãi</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDiscountCodes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm mã giảm giá
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên, mã, mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Loại giảm giá</Label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tất cả loại</option>
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mã giảm giá</CardTitle>
          <CardDescription>
            Tổng cộng {filteredDiscountCodes.length} mã giảm giá
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
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
                         <div className="text-gray-500">Tối thiểu: {code.minOrderAmount} TWD</div>
                       )}
                       {code.maxDiscount && code.maxDiscount > 0 && (
                         <div className="text-gray-500">Tối đa: {code.maxDiscount} TWD</div>
                       )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div>{code.currentUsage}/{code.maxUsage}</div>
                        <div className="text-gray-500">Đã sử dụng</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${getUsagePercentage(code.currentUsage, code.maxUsage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>Từ: {formatDate(code.validFrom)}</div>
                      <div>Đến: {formatDate(code.validTo)}</div>
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Không tìm thấy mã giảm giá</h3>
              <p className="text-gray-500">
                Không có mã giảm giá nào phù hợp với bộ lọc hiện tại.
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật thông tin mã giảm giá' : 'Tạo mã giảm giá mới với các thông tin cần thiết'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Mã giảm giá *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Ví dụ: WELCOME10"
                />
              </div>
              <div>
                <Label htmlFor="name">Tên mã giảm giá *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Giảm giá chào mừng"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về mã giảm giá..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">Loại giảm giá</Label>
                <select
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (TWD)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discountValue">Giá trị giảm giá *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseInt(e.target.value) }))}
                  placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrderAmount">Giá trị đơn hàng tối thiểu (TWD)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">Giảm giá tối đa (TWD)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: parseInt(e.target.value) }))}
                  placeholder="0 (không giới hạn)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUsage">Giới hạn sử dụng</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Ngày bắt đầu</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="validTo">Ngày kết thúc</Label>
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
              <Label htmlFor="isActive">Kích hoạt mã giảm giá này</Label>
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
              {isEditing ? 'Cập nhật' : 'Tạo mã giảm giá'}
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
              Bạn có chắc chắn muốn xóa mã giảm giá "{selectedCode?.name}" ({selectedCode?.code})? 
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

export default AdminDiscounts; 