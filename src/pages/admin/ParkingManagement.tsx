import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus,
  Edit,
  Trash2,
//   MapPin,
  Clock,
  Car,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllParkingLots, createParkingLot, updateParkingLot, deleteParkingLot, getSystemSettings } from '@/services/admin';
import type { ParkingLot, SystemSettings } from '@/types';

interface ParkingLotFormData {
  name: string;
  type: 'indoor' | 'outdoor' | 'disabled';
  totalSpaces: number;
  basePrice: number;
  pricePerDay: number;
  description: string;
  location: string;
  features: string[];
  operatingHours: {
    open: string;
    close: string;
  };
  isActive: boolean;
}

const ParkingManagement: React.FC = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ParkingLotFormData>({
    name: '',
    type: 'indoor',
    totalSpaces: 10,
    basePrice: 100,
    pricePerDay: 50,
    description: '',
    location: '',
    features: [],
    operatingHours: {
      open: '06:00',
      close: '22:00'
    },
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lotsData, settings] = await Promise.all([
        getAllParkingLots(),
        getSystemSettings()
      ]);
      setParkingLots(lotsData.parkingLots);
      setSystemSettings(settings);
    } catch (error: any) {
      toast.error('Không thể tải dữ liệu bãi đậu xe');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createParkingLot(formData);
      toast.success('Tạo bãi đậu xe thành công');
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo bãi đậu xe');
    }
  };

  const handleEdit = async () => {
    if (!selectedLot) return;
    
    try {
      await updateParkingLot(selectedLot._id, formData);
      toast.success('Cập nhật bãi đậu xe thành công');
      setShowEditDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật bãi đậu xe');
    }
  };

  const handleDelete = async () => {
    if (!selectedLot) return;
    
    try {
      await deleteParkingLot(selectedLot._id);
      toast.success('Xóa bãi đậu xe thành công');
      setShowDeleteDialog(false);
      setSelectedLot(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa bãi đậu xe');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'indoor',
      totalSpaces: 10,
      basePrice: 100,
      pricePerDay: 50,
      description: '',
      location: '',
      features: [],
      operatingHours: {
        open: '06:00',
        close: '22:00'
      },
      isActive: true
    });
    setIsEditing(false);
    setSelectedLot(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (lot: ParkingLot) => {
    setSelectedLot(lot);
    setFormData({
      name: lot.name,
      type: lot.type,
      totalSpaces: lot.totalSpaces,
      basePrice: lot.basePrice,
      pricePerDay: lot.pricePerDay,
      description: lot.description || '',
      location: lot.location || '',
      features: lot.features || [],
      operatingHours: lot.operatingHours,
      isActive: lot.isActive
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (lot: ParkingLot) => {
    setSelectedLot(lot);
    setShowDeleteDialog(true);
  };

  const getParkingTypeIcon = (type: string) => {
    const typeConfig = systemSettings?.parkingLotTypes.find(t => t.type === type);
    return typeConfig?.icon || '🚗';
  };

  const getParkingTypeName = (type: string) => {
    const typeConfig = systemSettings?.parkingLotTypes.find(t => t.type === type);
    return typeConfig?.name || type;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

  const calculateOccupancyRate = (lot: ParkingLot) => {
    return ((lot.totalSpaces - lot.availableSpaces) / lot.totalSpaces * 100).toFixed(1);
  };

  const filteredParkingLots = parkingLots.filter(lot => {
    const matchesSearch = 
      lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lot.location && lot.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || lot.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && lot.isActive) || 
      (statusFilter === 'inactive' && !lot.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
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
          <h1 className="text-3xl font-bold">Quản lý bãi đậu xe</h1>
          <p className="text-gray-600">Quản lý các bãi đậu xe và cài đặt giá</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên, vị trí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="typeFilter">Loại bãi đậu</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {systemSettings?.parkingLotTypes.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.icon} {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="statusFilter">Trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Parking Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bãi đậu xe</CardTitle>
          <CardDescription>
            Tổng cộng {filteredParkingLots.length} bãi đậu xe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Giá cả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParkingLots.map((lot) => (
                <TableRow key={lot._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getParkingTypeIcon(lot.type)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{lot.name}</div>
                        <div className="text-sm text-gray-600">{lot.location}</div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {lot.operatingHours.open} - {lot.operatingHours.close}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getParkingTypeIcon(lot.type)} {getParkingTypeName(lot.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tỷ lệ sử dụng:</span>
                        <span className="font-medium">{calculateOccupancyRate(lot)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${calculateOccupancyRate(lot)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{lot.availableSpaces} chỗ trống</span>
                        <span>{lot.totalSpaces} tổng số</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>Cơ bản: {formatCurrency(lot.basePrice)}</div>
                      <div>Theo ngày: {formatCurrency(lot.pricePerDay)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lot.isActive ? 'default' : 'secondary'}>
                      {lot.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(lot)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(lot)}
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
          {filteredParkingLots.length === 0 && (
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
              {isEditing ? 'Cập nhật thông tin bãi đậu xe' : 'Điền thông tin để tạo bãi đậu xe mới'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên bãi đậu xe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên bãi đậu xe"
                />
              </div>
              <div>
                <Label htmlFor="type">Loại bãi đậu xe *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemSettings?.parkingLotTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.icon} {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalSpaces">Tổng số chỗ đậu *</Label>
                <Input
                  id="totalSpaces"
                  type="number"
                  min="1"
                  value={formData.totalSpaces}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSpaces: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="location">Vị trí</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Nhập vị trí"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Giá cơ bản (TWD) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="pricePerDay">Giá theo ngày (TWD) *</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  min="0"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openTime">Giờ mở cửa</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.operatingHours.open}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    operatingHours: { ...prev.operatingHours, open: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="closeTime">Giờ đóng cửa</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.operatingHours.close}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    operatingHours: { ...prev.operatingHours, close: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về bãi đậu xe"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Bãi đậu xe hoạt động</Label>
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
              Bạn có chắc chắn muốn xóa bãi đậu xe "{selectedLot?.name}"? 
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

export default ParkingManagement; 