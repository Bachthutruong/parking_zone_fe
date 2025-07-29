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
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllMaintenanceDays, createMaintenanceDay, updateMaintenanceDay, deleteMaintenanceDay, MaintenanceDay } from '@/services/maintenance';
import { getAllParkingTypes } from '@/services/admin';

const AdminMaintenance: React.FC = () => {
  const [maintenanceDays, setMaintenanceDays] = useState<MaintenanceDay[]>([]);
  const [parkingTypes, setParkingTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceDay | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    description: '',
    affectedParkingTypes: [] as string[],
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintenanceData, parkingTypesData] = await Promise.all([
        getAllMaintenanceDays(),
        getAllParkingTypes()
      ]);
      
      setMaintenanceDays(maintenanceData.maintenanceDays);
      setParkingTypes(parkingTypesData.parkingTypes);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('無法載入資料');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createMaintenanceDay(formData);
      toast.success('創建維護日期成功');
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating maintenance day:', error);
      toast.error('無法創建維護日期');
    }
  };

  const handleEdit = async () => {
    if (!selectedMaintenance) return;
    
    try {
      await updateMaintenanceDay(selectedMaintenance._id, formData);
      toast.success('更新維護日期成功');
      setShowEditDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error updating maintenance day:', error);
      toast.error('無法更新維護日期');
    }
  };

  const handleDelete = async () => {
    if (!selectedMaintenance) return;
    
    try {
      await deleteMaintenanceDay(selectedMaintenance._id);
      toast.success('刪除維護日期成功');
      setShowDeleteDialog(false);
      setSelectedMaintenance(null);
      loadData();
    } catch (error: any) {
      toast.error('Không thể xóa ngày bảo trì');
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      reason: '',
      description: '',
      affectedParkingTypes: [],
      isActive: true
    });
    setIsEditing(false);
    setSelectedMaintenance(null);
  };

  const openCreateDialog = () => {
    setFormData({
      date: '',
      reason: '',
      description: '',
      affectedParkingTypes: [],
      isActive: true
    });
    setShowCreateDialog(true);
  };

  const openEditDialog = (maintenance: MaintenanceDay) => {
    setSelectedMaintenance(maintenance);
    setFormData({
      date: new Date(maintenance.date).toISOString().split('T')[0],
      reason: maintenance.reason,
      description: maintenance.description || '',
      affectedParkingTypes: maintenance.affectedParkingTypes.map(pt => pt._id),
      isActive: maintenance.isActive
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (maintenance: MaintenanceDay) => {
    setSelectedMaintenance(maintenance);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredMaintenanceDays = maintenanceDays.filter(maintenance => {
    const matchesSearch = 
      maintenance.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (maintenance.description && maintenance.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
          <h1 className="text-3xl font-bold">維護日期</h1>
          <p className="text-gray-600">管理不接收車輛的維護日期</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新整理
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新增維護日期
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
                  placeholder="Lý do, mô tả..."
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

      {/* Maintenance Days Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách ngày bảo trì</CardTitle>
          <CardDescription>
            Tổng cộng {filteredMaintenanceDays.length} ngày bảo trì
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Bãi đậu xe bị ảnh hưởng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenanceDays.map((maintenance) => (
                <TableRow key={maintenance._id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{formatDate(maintenance.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{maintenance.reason}</div>
                      {maintenance.description && (
                        <div className="text-sm text-gray-600">{maintenance.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {maintenance.affectedParkingTypes.map((parkingType, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {parkingType.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={maintenance.isActive ? 'default' : 'secondary'}>
                      {maintenance.isActive ? (
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
                        onClick={() => openEditDialog(maintenance)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(maintenance)}
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
          {filteredMaintenanceDays.length === 0 && (
            <div className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có ngày bảo trì</h3>
              <p className="text-gray-500">
                Chưa có ngày bảo trì nào được thiết lập.
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
            <DialogTitle>{isEditing ? 'Sửa ngày bảo trì' : 'Thêm ngày bảo trì mới'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật thông tin ngày bảo trì' : 'Tạo ngày bảo trì mới'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="date">Ngày bảo trì *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="reason">Lý do bảo trì *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ví dụ: Bảo trì hệ thống, Sửa chữa..."
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về việc bảo trì..."
                rows={3}
              />
            </div>

            <div>
              <Label>Bãi đậu xe bị ảnh hưởng</Label>
              <div className="space-y-2 mt-2">
                {parkingTypes.map((parkingType) => (
                  <div key={parkingType._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`parking-${parkingType._id}`}
                      checked={formData.affectedParkingTypes.includes(parkingType._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            affectedParkingTypes: [...prev.affectedParkingTypes, parkingType._id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            affectedParkingTypes: prev.affectedParkingTypes.filter(id => id !== parkingType._id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`parking-${parkingType._id}`} className="text-sm">
                      {parkingType.name} ({parkingType.code})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Kích hoạt ngày bảo trì này</Label>
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
              {isEditing ? 'Cập nhật' : 'Tạo ngày bảo trì'}
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
              Bạn có chắc chắn muốn xóa ngày bảo trì "{selectedMaintenance?.reason}"? 
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

export default AdminMaintenance; 