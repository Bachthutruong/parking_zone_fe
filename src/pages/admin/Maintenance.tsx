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
      toast.error('無法刪除維護日期');
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
          <h1 className="text-2xl sm:text-3xl font-bold">維護日期</h1>
          <p className="text-gray-600 text-sm sm:text-base">管理不接收車輛的維護日期</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadData} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
          <Button onClick={openCreateDialog} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">新增維護日期</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search">搜尋</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="原因、描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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

      {/* Maintenance Days Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">維護日期清單</CardTitle>
          <CardDescription className="text-sm">
            總共 {filteredMaintenanceDays.length} 個維護日期
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>受影響的停車場</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">沒有維護日期</h3>
              <p className="text-gray-500">
                沒有維護日期。
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
            <DialogTitle className="text-base sm:text-lg">{isEditing ? '編輯維護日期' : '新增維護日期'}</DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? '更新維護日期資訊' : '創建新的維護日期'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="date">維護日期 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="reason">維護原因 *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="例如: 系統維護, 修理..."
              />
            </div>

            <div>
              <Label htmlFor="description">詳細描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="輸入維護詳細描述..."
                rows={3}
              />
            </div>

            <div>
              <Label>受影響的停車場</Label>
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
              <Label htmlFor="isActive">啟用此維護日期</Label>
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
              您確定要刪除維護日期 "{selectedMaintenance?.reason}"? 
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

export default AdminMaintenance; 