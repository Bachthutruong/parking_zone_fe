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
  RefreshCw,
  Image
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllParkingTypes, createParkingType, updateParkingType, deleteParkingType } from '@/services/admin';
import ImageUpload from '@/components/ImageUpload';
import ImageGallery from '@/components/ImageGallery';

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
  images?: Array<{
    _id: string;
    url: string;
    thumbnailUrl?: string;
    cloudinaryId: string;
    thumbnailCloudinaryId?: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    isActive: boolean;
  }>;
}

const AdminParkingTypes: React.FC = () => {
  const [parkingTypes, setParkingTypes] = useState<ParkingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
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
      toast.error('無法載入停車場清單');
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
      toast.success('創建停車場成功');
      setShowCreateDialog(false);
      resetForm();
      loadParkingTypes();
    } catch (error: any) {
      console.error('Error creating parking type:', error);
      toast.error('無法創建停車場');
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
        toast.error('找不到停車場 ID');
        return;
      }
      
      await updateParkingType(selectedType._id, updateData);
      toast.success('停車場更新成功');
      setShowEditDialog(false);
      resetForm();
      loadParkingTypes();
    } catch (error: any) {
      console.error('Error updating parking type:', error);
      toast.error('無法更新停車場');
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    
    try {
      await deleteParkingType(selectedType.code);
      toast.success('刪除停車場成功');
      setShowDeleteDialog(false);
      setSelectedType(null);
      loadParkingTypes();
    } catch (error: any) {
      toast.error('無法刪除停車場');
    }
  };

  const handleImageUploadSuccess = () => {
    loadParkingTypes();
    if (selectedType) {
      const updated = parkingTypes.find(p => p._id === selectedType._id);
      if (updated) {
        setSelectedType(updated);
      }
    }
  };

  const handleImageDeleteSuccess = () => {
    loadParkingTypes();
    if (selectedType) {
      const updated = parkingTypes.find(p => p._id === selectedType._id);
      if (updated) {
        setSelectedType(updated);
      }
    }
  };

  const openImageDialog = (parkingType: ParkingType) => {
    setSelectedType(parkingType);
    setShowImageDialog(true);
  };

  const getParkingTypeIcon = (type: string) => {
    switch (type) {
      case 'indoor':
        return '🏢';
      case 'outdoor':
        return '🌤️';
      case 'disabled':
        return '♿️';
      default:
        return '🏢';
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
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
          <h1 className="text-2xl sm:text-3xl font-bold">停車場</h1>
          <p className="text-gray-600 text-sm sm:text-base">管理系統中的停車場</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadParkingTypes} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
                      <Button onClick={openCreateDialog} className="flex-1 sm:flex-initial text-xs sm:text-sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">新增停車場</span>
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
                  placeholder="名稱、描述..."
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

      {/* Parking Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>停車場清單</CardTitle>
          <CardDescription>
            總共 {filteredParkingTypes.length} 個停車場
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資訊</TableHead>
                <TableHead>價格</TableHead>
                <TableHead>容量</TableHead>
                <TableHead>功能</TableHead>
                <TableHead>圖片</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
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
                          <div className="text-sm text-gray-500">代碼: {type.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>基本: {formatCurrency(type.pricePerDay)}/天</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>最大: {type.totalSpaces || 0} 位</div>
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
                            +{(type.features || []).length - 2} 更多
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {type.images?.length || 0} 張
                        </span>
                        {type.images && type.images.length > 0 && (
                          <div className="flex -space-x-1">
                            {type.images.slice(0, 3).map((image, index) => (
                              console.log('🔍 Image:', index),
                              <div key={image._id} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                <img
                                  src={image.thumbnailUrl || image.url}
                                  alt={image.originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/logo.png';
                                  }}
                                />
                              </div>
                            ))}
                            {type.images.length > 3 && (
                              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                +{type.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? 'default' : 'secondary'}>
                        {type.isActive ? (
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
                          onClick={() => openEditDialog(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openImageDialog(type)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Image className="h-4 w-4" />
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">找不到停車場</h3>
              <p className="text-gray-500">
                沒有符合當前篩選條件的停車場。
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
            <DialogTitle className="text-base sm:text-lg">{isEditing ? '編輯停車場' : '新增停車場'}</DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? '更新停車場資訊' : '創建新的停車場並提供必要資訊'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="name">停車場名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如: 停車場A、停車場B、VIP區域..."
                />
              </div>
              <div>
                <Label htmlFor="code">停車場代碼 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="例如: A001、B002、VIP001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="icon">圖示</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏢 🌤 ♿️"
                />
              </div>
              <div>
                <Label htmlFor="color">顏色</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="停車場的詳細描述..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="pricePerDay">基本價格 (TWD/天) *</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="totalSpaces">最大車位數 *</Label>
                <Input
                  id="totalSpaces"
                  type="number"
                  value={formData.totalSpaces}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSpaces: parseInt(e.target.value) }))}
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
              <Label htmlFor="isActive">啟用此停車場</Label>
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
              {isEditing ? '更新' : '創建停車場'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>管理停車場圖片 - {selectedType?.name}</DialogTitle>
            <DialogDescription>
              上傳和管理停車場的展示圖片
            </DialogDescription>
          </DialogHeader>
          
          {selectedType && (
            <div className="space-y-4 sm:space-y-6">
              {/* Parking Type Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getParkingTypeIcon(selectedType.type || 'indoor')}</span>
                  <div>
                    <h4 className="font-semibold">{selectedType.name}</h4>
                    <p className="text-sm text-gray-600">{selectedType.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>容量: {selectedType.totalSpaces} 位</span>
                      <span>價格: ${selectedType.pricePerDay}/天</span>
                      <span>圖片: {selectedType.images?.length || 0} 張</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload Component */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">上傳圖片</h3>
                  <p className="text-sm text-gray-600">支援 JPG, PNG, GIF 格式，單個文件最大 10MB</p>
                </div>
                <ImageUpload
                  parkingTypeId={selectedType._id}
                  onUploadSuccess={handleImageUploadSuccess}
                  onDeleteSuccess={handleImageDeleteSuccess}
                  existingImages={selectedType.images || []}
                  maxFiles={10}
                  maxFileSize={10}
                />
              </div>

              {/* Image Preview */}
              <div className="border-t pt-6">
                {selectedType.images && selectedType.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">圖片預覽</h3>
                      <span className="text-sm text-gray-500">
                        {selectedType.images.length} 張圖片
                      </span>
                    </div>
                    <ImageGallery
                      images={selectedType.images}
                      showFullscreen={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-500">暫無圖片</p>
                    <p className="text-sm text-gray-400 mt-1">上傳圖片後將在此顯示</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              關閉
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
              您確定要刪除停車場 "{selectedType?.name}"? 
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

export default AdminParkingTypes; 