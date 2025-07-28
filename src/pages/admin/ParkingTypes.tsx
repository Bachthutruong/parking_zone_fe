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
    //   Building2,
  Plus,
  Edit,
  Trash2,
    //   Eye,
  CheckCircle,
  XCircle,
  Car,
//   Sun,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllParkingTypes, createParkingType, updateParkingType, deleteParkingType } from '@/services/admin';

interface ParkingType {
  _id: string;
  code: string;
  name: string;
  type?: 'indoor' | 'outdoor' | 'disabled';
  description: string;
  icon: string;
  color?: string;
  isActive: boolean;
  pricePerDay: number;
  totalSpaces: number;
  features?: string[];
}

const AdminParkingTypes: React.FC = () => {
  const [parkingTypes, setParkingTypes] = useState<ParkingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<ParkingType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'indoor', // Default type, will be set automatically
    description: '',
    icon: '🏢',
    color: '#3B82F6',
    pricePerDay: 100,
    totalSpaces: 50,
    features: [''],
    isActive: true
  });

  useEffect(() => {
    loadParkingTypes();
  }, []);

  const loadParkingTypes = async () => {
    try {
      setLoading(true);
      const data = await getAllParkingTypes();
      console.log('🔍 Parking types data:', data);
      setParkingTypes(data.parkingTypes);
    } catch (error: any) {
      console.error('Error loading parking types:', error);
      toast.error('Không thể tải danh sách bãi đậu xe');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Remove type from formData since it's no longer user-selectable
      const { type, ...createData } = formData;
      
      console.log('🔍 Creating parking type:', createData);
      
      await createParkingType(createData);
      toast.success('Tạo bãi đậu xe thành công');
      setShowCreateDialog(false);
      resetForm();
      loadParkingTypes();
    } catch (error: any) {
      console.error('Error creating parking type:', error);
      toast.error('Không thể tạo bãi đậu xe');
    }
  };

  const handleEdit = async () => {
    if (!selectedType) return;
    
    try {
      // Remove type from formData since it's no longer user-selectable
      const { type, ...updateData } = formData;
      
      // Only include code if it exists
      if (selectedType.code || formData.code) {
        updateData.code = selectedType.code || formData.code;
      }
      
      console.log('🔍 Updating parking type:', {
        selectedType,
        _id: selectedType._id,
        selectedTypeCode: selectedType.code,
        formDataCode: formData.code,
        finalCode: updateData.code,
        updateData
      });
      
      // Use _id instead of code for the API call
      if (!selectedType._id) {
        toast.error('Không tìm thấy ID bãi đậu xe');
        return;
      }
      
      await updateParkingType(selectedType._id, updateData);
      toast.success('Cập nhật bãi đậu xe thành công');
      setShowEditDialog(false);
      resetForm();
      loadParkingTypes();
    } catch (error: any) {
      console.error('Error updating parking type:', error);
      toast.error('Không thể cập nhật bãi đậu xe');
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    
    try {
      await deleteParkingType(selectedType.code);
      toast.success('Xóa bãi đậu xe thành công');
      setShowDeleteDialog(false);
      setSelectedType(null);
      loadParkingTypes();
    } catch (error: any) {
      toast.error('Không thể xóa bãi đậu xe');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'indoor', // Default type, will be set automatically
      description: '',
      icon: '🏢',
      color: '#3B82F6',
      pricePerDay: 100,
      totalSpaces: 50,
      features: [''],
      isActive: true
    });
    setIsEditing(false);
    setSelectedType(null);
  };

  const openCreateDialog = () => {
    setFormData({
      code: '',
      name: '',
      type: 'indoor', // Default type, will be set automatically
      description: '',
      icon: '🏢',
      color: '#3B82F6',
      pricePerDay: 100,
      totalSpaces: 50,
      features: [''],
      isActive: true
    });
    setShowCreateDialog(true);
  };

  const openEditDialog = (type: ParkingType) => {
    console.log('🔍 Opening edit dialog for parking type:', type);
    
    setSelectedType(type);
    setFormData({
      code: type.code,
      name: type.name,
      type: type.type || 'indoor',
      description: type.description,
      icon: type.icon,
      color: type.color || '#3B82F6',
      pricePerDay: type.pricePerDay || 100,
      totalSpaces: type.totalSpaces || 50,
      features: type.features || [''],
      isActive: type.isActive
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (type: ParkingType) => {
    setSelectedType(type);
    setShowDeleteDialog(true);
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return '0 TWD';
    }
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

  const filteredParkingTypes = parkingTypes.filter(type => {
    const matchesSearch = 
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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
          <h1 className="text-3xl font-bold">Bãi đậu xe</h1>
          <p className="text-gray-600">Quản lý các bãi đậu xe trong hệ thống</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadParkingTypes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
                      <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm bãi đậu xe
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên, mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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

      {/* Parking Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bãi đậu xe</CardTitle>
          <CardDescription>
            Tổng cộng {filteredParkingTypes.length} bãi đậu xe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin</TableHead>
                <TableHead>Giá cả</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Tính năng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParkingTypes.map((type) => {
                console.log('🔍 Rendering parking type:', type);
                return (
                  <TableRow key={type._id || type.code}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: (type.color || '#3B82F6') + '20' }}
                        >
                          {type.icon}
                        </div>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                          <div className="text-sm text-gray-500">Mã: {type.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>Cơ bản: {formatCurrency(type.pricePerDay)}/ngày</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Tối đa: {type.totalSpaces || 0} chỗ</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(type.features || []).slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {(type.features || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(type.features || []).length - 2} nữa
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? 'default' : 'secondary'}>
                        {type.isActive ? (
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
                          onClick={() => openEditDialog(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(type)}
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
          {filteredParkingTypes.length === 0 && (
            <div className="p-8 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Không tìm thấy bãi đậu xe</h3>
              <p className="text-gray-500">
                Không có bãi đậu xe nào phù hợp với bộ lọc hiện tại.
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
            <DialogTitle>{isEditing ? 'Sửa bãi đậu xe' : 'Thêm bãi đậu xe mới'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật thông tin bãi đậu xe' : 'Tạo bãi đậu xe mới với các thông tin cần thiết'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên bãi đậu xe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Bãi A, Bãi B, Khu vực VIP..."
                />
              </div>
              <div>
                <Label htmlFor="code">Mã bãi đậu xe *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="VD: A001, B002, VIP001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Biểu tượng</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏢 🌤 ♿️"
                />
              </div>
              <div>
                <Label htmlFor="color">Màu sắc</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về bãi đậu xe..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerDay">Giá cơ bản (TWD/ngày) *</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="totalSpaces">Số chỗ tối đa *</Label>
                <Input
                  id="totalSpaces"
                  type="number"
                  value={formData.totalSpaces}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSpaces: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label>Tính năng</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Nhập tính năng..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tính năng
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Kích hoạt bãi đậu xe này</Label>
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
              {isEditing ? 'Cập nhật' : 'Tạo bãi đậu xe'}
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
              Bạn có chắc chắn muốn xóa bãi đậu xe "{selectedType?.name}"? 
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

export default AdminParkingTypes; 