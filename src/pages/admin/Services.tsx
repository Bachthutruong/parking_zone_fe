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
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  // DollarSign,
  // Clock,
  // Star,
  Car,
  // Sparkles,
  Droplets,
  Shield,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllAddonServices, createAddonService, updateAddonService, deleteAddonService } from '@/services/admin';

interface AddonService {
  _id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  isActive: boolean;
  category: string;
  duration?: number;
  features?: string[];
  createdAt: string;
}

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<AddonService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<AddonService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🚐',
    price: 0,
    category: 'other',
    duration: 30,
    features: [''],
    isActive: true
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getAllAddonServices();
      setServices(data.services);
    } catch (error: any) {
      toast.error('無法載入服務清單');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createAddonService(formData);
      toast.success('創建服務成功');
      setShowCreateDialog(false);
      resetForm();
      loadServices();
    } catch (error: any) {
      toast.error('無法創建服務');
    }
  };

  const handleEdit = async () => {
    if (!selectedService) return;
    
    try {
      await updateAddonService(selectedService._id, formData);
      toast.success('更新服務成功');
      setShowEditDialog(false);
      resetForm();
      loadServices();
    } catch (error: any) {
      toast.error('無法更新服務');
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    
    try {
      await deleteAddonService(selectedService._id);
      toast.success('刪除服務成功');
      setShowDeleteDialog(false);
      setSelectedService(null);
      loadServices();
    } catch (error: any) {
      toast.error('無法刪除服務');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🚐',
      price: 0,
      category: 'other',
      duration: 30,
      features: [''],
      isActive: true
    });
    setIsEditing(false);
    setSelectedService(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (service: AddonService) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      icon: service.icon,
      price: service.price,
      category: service.category,
      duration: service.duration || 30,
      features: service.features || [''],
      isActive: service.isActive
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (service: AddonService) => {
    setSelectedService(service);
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

  const getCategoryIcon = (category: string) => {
    const icons = {
      transport: Car,
      cleaning: Droplets,
      security: Shield,
      convenience: Package,
      other: Package
    };
    return icons[category as keyof typeof icons] || Package;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      transport: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      convenience: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '免費';
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
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
          <h1 className="text-3xl font-bold">附加服務</h1>
          <p className="text-gray-600">管理客戶的附加服務</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadServices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新整理
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新增服務
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            篩選
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">搜尋</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="名稱、描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">類別</Label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">所有類別</option>
                <option value="transport">運輸</option>
                <option value="cleaning">清潔</option>
                <option value="security">安全</option>
                <option value="convenience">便利</option>
                <option value="other">其他</option>
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

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>服務清單</CardTitle>
          <CardDescription>
            共 {filteredServices.length} 項服務
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資訊</TableHead>
                <TableHead>類別</TableHead>
                <TableHead>價格</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>功能</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => {
                const CategoryIcon = getCategoryIcon(service.category);
                return (
                  <TableRow key={service._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl">
                          {service.icon}
                        </div>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600">{service.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadge(service.category)}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {service.category === 'transport' && '運輸'}
                        {service.category === 'cleaning' && '清潔'}
                        {service.category === 'security' && '安全'}
                        {service.category === 'convenience' && '便利'}
                        {service.category === 'other' && '其他'}
                        {!['transport', 'cleaning', 'security', 'convenience', 'other'].includes(service.category) && service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatCurrency(service.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {service.duration ? `${service.duration} 分鐘` : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(service.features || []).slice(0, 2).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {(service.features || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(service.features || []).length - 2} 更多
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? (
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
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(service)}
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
          {filteredServices.length === 0 && (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">找不到服務</h3>
              <p className="text-gray-500">
                沒有符合當前篩選條件的服務。
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
            <DialogTitle>{isEditing ? '編輯服務' : '新增服務'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '更新服務資訊' : '創建新的附加服務，包含必要資訊'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">服務名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：洗車、機場接送..."
                />
              </div>
              <div>
                <Label htmlFor="icon">圖示</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🚐 🚗 ✨ 🧴"
                />
              </div>
            </div>

            <div>
                              <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="詳細描述服務..."
                  rows={3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">價格 (TWD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="duration">時間 (分鐘)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label>功能</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="輸入功能..."
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
                  新增功能
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">啟用此服務</Label>
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
              {isEditing ? '更新' : '創建服務'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              您確定要刪除服務 "{selectedService?.name}" 嗎？ 
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

export default AdminServices; 