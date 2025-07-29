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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
  DollarSign,
  TrendingUp,
  Layers,
  Globe,
  Settings,
  Copy,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllParkingTypes, addSpecialPrice, addBulkSpecialPrices, updateSpecialPrice, deleteSpecialPrice, getSpecialPrices } from '@/services/admin';

interface SpecialPrice {
  _id: string;
  startDate: string;
  endDate: string;
  price: number;
  reason: string;
  isActive: boolean;
}

interface ParkingTypeWithSpecialPrices {
  _id: string;
  name: string;
  code: string;
  pricePerDay: number;
  specialPrices: SpecialPrice[];
}

const AdminSpecialPricing: React.FC = () => {
  const [parkingTypes, setParkingTypes] = useState<ParkingTypeWithSpecialPrices[]>([]);
  const [selectedParkingType, setSelectedParkingType] = useState<ParkingTypeWithSpecialPrices | null>(null);
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSpecialPrice, setSelectedSpecialPrice] = useState<SpecialPrice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'overview'>('single');
  const [selectedParkingTypes, setSelectedParkingTypes] = useState<string[]>([]);
  const [bulkTemplateData, setBulkTemplateData] = useState<any[]>([]);
  const [showBulkTemplateDialog, setShowBulkTemplateDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [forceOverride, setForceOverride] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    price: 0,
    reason: '',
    isActive: true
  });

  useEffect(() => {
    loadParkingTypes();
  }, []);

  const loadParkingTypes = async () => {
    try {
      setLoading(true);
      const data = await getAllParkingTypes();
      const parkingTypesWithSpecialPrices = await Promise.all(
        data.parkingTypes.map(async (parkingType: any) => {
          try {
            const specialPricesData = await getSpecialPrices(parkingType._id);
            return {
              ...parkingType,
              specialPrices: specialPricesData.specialPrices || []
            };
          } catch (error) {
            return {
              ...parkingType,
              specialPrices: []
            };
          }
        })
      );
      
      setParkingTypes(parkingTypesWithSpecialPrices);
      if (parkingTypesWithSpecialPrices.length > 0) {
        setSelectedParkingType(parkingTypesWithSpecialPrices[0]);
        setSpecialPrices(parkingTypesWithSpecialPrices[0].specialPrices);
      }
    } catch (error: any) {
      console.error('Error loading parking types:', error);
      toast.error('Không thể tải danh sách bãi đậu xe');
    } finally {
      setLoading(false);
    }
  };

//   const loadSpecialPrices = async (parkingTypeId: string) => {
//     try {
//       const data = await getSpecialPrices(parkingTypeId);
//       setSpecialPrices(data.specialPrices);
//     } catch (error: any) {
//       console.error('Error loading special prices:', error);
//       toast.error('Không thể tải giá đặc biệt');
//     }
//   };

  const handleParkingTypeChange = async (parkingTypeId: string) => {
    const parkingType = parkingTypes.find(pt => pt._id === parkingTypeId);
    setSelectedParkingType(parkingType || null);
    if (parkingType) {
      setSpecialPrices(parkingType.specialPrices);
    }
  };

  const handleCreate = async () => {
    if (!selectedParkingType) return;
    
    if (!formData.startDate || !formData.endDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }
    
    try {
      await addSpecialPrice(selectedParkingType._id, formData);
      toast.success('Thêm giá đặc biệt thành công');
      setShowCreateDialog(false);
      resetForm();
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      console.error('Error creating special price:', error);
      toast.error('Không thể thêm giá đặc biệt');
    }
  };

  const handleBulkCreate = async () => {
    if (selectedParkingTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bãi đậu xe');
      return;
    }

    if (!formData.startDate || !formData.endDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }

    try {
      // Sử dụng bulk endpoint cho từng parking type
      const results = [];
      for (const parkingTypeId of selectedParkingTypes) {
        try {
          const result = await addBulkSpecialPrices(parkingTypeId, [formData], forceOverride);
          results.push({ parkingTypeId, success: true, result });
        } catch (error: any) {
          results.push({ 
            parkingTypeId, 
            success: false, 
            error: error.response?.data?.message || 'Lỗi không xác định' 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Tạo thành công ${successCount} giá đặc biệt`);
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} giá đặc biệt tạo thất bại`);
      }

      setShowBulkCreateDialog(false);
      resetForm();
      setSelectedParkingTypes([]);
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      console.error('Error creating bulk special prices:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo giá đặc biệt hàng loạt');
    }
  };

  const handleEdit = async () => {
    if (!selectedSpecialPrice || !selectedParkingType) return;
    
    if (!formData.startDate || !formData.endDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }
    
    try {
      await updateSpecialPrice(selectedParkingType._id, selectedSpecialPrice._id, formData);
      toast.success('Cập nhật giá đặc biệt thành công');
      setShowEditDialog(false);
      resetForm();
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      console.error('Error updating special price:', error);
      toast.error('Không thể cập nhật giá đặc biệt');
    }
  };

  const handleDelete = async () => {
    if (!selectedSpecialPrice || !selectedParkingType) return;
    
    try {
      await deleteSpecialPrice(selectedParkingType._id, selectedSpecialPrice._id);
      toast.success('Xóa giá đặc biệt thành công');
      setShowDeleteDialog(false);
      setSelectedSpecialPrice(null);
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      toast.error('Không thể xóa giá đặc biệt');
    }
  };

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      price: 0,
      reason: '',
      isActive: true
    });
    setIsEditing(false);
    setSelectedSpecialPrice(null);
    setSelectedTemplate('');
  };

  const openCreateDialog = () => {
    setFormData({
      startDate: '',
      endDate: '',
      price: 0,
      reason: '',
      isActive: true
    });
    setShowCreateDialog(true);
  };

  const openBulkCreateDialog = () => {
    setFormData({
      startDate: '',
      endDate: '',
      price: 0,
      reason: '',
      isActive: true
    });
    setShowBulkCreateDialog(true);
  };

  const openEditDialog = (specialPrice: SpecialPrice) => {
    setSelectedSpecialPrice(specialPrice);
    setFormData({
      startDate: new Date(specialPrice.startDate).toISOString().split('T')[0],
      endDate: new Date(specialPrice.endDate).toISOString().split('T')[0],
      price: specialPrice.price,
      reason: specialPrice.reason,
      isActive: specialPrice.isActive
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (specialPrice: SpecialPrice) => {
    setSelectedSpecialPrice(specialPrice);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getQuickTemplate = (template: string, customStartDate?: string, customEndDate?: string) => {
    const today = new Date();
    // const currentYear = today.getFullYear();
    
    switch (template) {
      case 'weekend':
        // Tính cuối tuần theo khoảng ngày đã chọn
        const weekends = [];
        
        if (!customStartDate || !customEndDate) {
          // Nếu chưa chọn ngày, trả về mảng rỗng
          return [];
        }
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        // Tìm thứ 7 đầu tiên trong khoảng thời gian
        let firstSaturday = new Date(startDate);
        while (firstSaturday.getDay() !== 6) { // 6 = Saturday
          firstSaturday.setDate(firstSaturday.getDate() + 1);
        }
        
        // Tạo tất cả cuối tuần trong khoảng thời gian
        let currentWeekend = new Date(firstSaturday);
        while (currentWeekend <= endDate) {
          const weekendEnd = new Date(currentWeekend);
          weekendEnd.setDate(currentWeekend.getDate() + 1); // Sunday
          
          weekends.push({
            startDate: currentWeekend.toISOString().split('T')[0],
            endDate: weekendEnd.toISOString().split('T')[0],
            price: selectedParkingType ? Math.round(selectedParkingType.pricePerDay * 1.2) : 0,
            reason: 'Cuối tuần',
            isActive: true
          });
          
          // Chuyển đến cuối tuần tiếp theo (7 ngày sau)
          currentWeekend.setDate(currentWeekend.getDate() + 7);
        }
        
        return weekends;
        

        
      case 'holiday':
        return [{
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: selectedParkingType ? Math.round(selectedParkingType.pricePerDay * 1.5) : 0,
          reason: 'Ngày lễ',
          isActive: true
        }];
        
      case 'peak':
        return [{
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: selectedParkingType ? Math.round(selectedParkingType.pricePerDay * 1.3) : 0,
          reason: 'Mùa cao điểm',
          isActive: true
        }];
        
      default:
        return [formData];
    }
  };

  const handleQuickTemplate = (template: string) => {
    setSelectedTemplate(template);
    
    if (template === 'weekend') {
      // Template cuối tuần cần có ngày được chọn
      if (!formData.startDate || !formData.endDate) {
        toast.error('Vui lòng chọn khoảng ngày trước khi sử dụng template cuối tuần');
        return;
      }
    }
    
    // Nếu đã chọn ngày, sử dụng khoảng ngày đó
    const templateData = getQuickTemplate(template, formData.startDate, formData.endDate);
    
    if (templateData.length === 1) {
      setFormData(templateData[0]);
    } else if (templateData.length > 1) {
      // Nếu có nhiều template (như cuối tuần), hiển thị dialog chọn
      setBulkTemplateData(templateData);
      setShowBulkTemplateDialog(true);
    } else {
      // Template cuối tuần không có dữ liệu (chưa chọn ngày)
      if (template === 'weekend') {
        toast.error('Không tìm thấy cuối tuần nào trong khoảng ngày đã chọn');
      }
    }
  };

  const handleBulkTemplateApply = () => {
    if (selectedParkingTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bãi đậu xe');
      return;
    }
    
    if (bulkTemplateData.length === 0) {
      toast.error('Không có dữ liệu template');
      return;
    }
    
    // Áp dụng tất cả template cho tất cả bãi đã chọn
    const applyAllTemplates = async () => {
      try {
        const results = [];
        
        for (const parkingTypeId of selectedParkingTypes) {
          try {
            const result = await addBulkSpecialPrices(parkingTypeId, bulkTemplateData, forceOverride);
            results.push({ parkingTypeId, success: true, result });
          } catch (error: any) {
            results.push({ 
              parkingTypeId, 
              success: false, 
              error: error.response?.data?.message || 'Lỗi không xác định' 
            });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        
        if (successCount > 0) {
          toast.success(`Áp dụng thành công ${bulkTemplateData.length} template cho ${successCount} bãi đậu xe`);
        }
        
        if (failedCount > 0) {
          toast.error(`${failedCount} bãi đậu xe áp dụng thất bại`);
        }
        
        setShowBulkTemplateDialog(false);
        setBulkTemplateData([]);
        setSelectedParkingTypes([]);
        await loadParkingTypes();
      } catch (error: any) {
        console.error('Error applying bulk templates:', error);
        toast.error('Không thể áp dụng template hàng loạt');
      }
    };
    
    applyAllTemplates();
  };

  const handleBulkDelete = async () => {
    if (selectedParkingTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bãi đậu xe');
      return;
    }
    
    try {
      // Lấy tất cả special prices của các bãi đã chọn
      const allSpecialPrices = parkingTypes
        .filter(pt => selectedParkingTypes.includes(pt._id))
        .flatMap(pt => pt.specialPrices);
      
      if (allSpecialPrices.length === 0) {
        toast.error('Không có giá đặc biệt nào để xóa');
        return;
      }
      
      // Xóa tất cả special prices
      const deletePromises = [];
      for (const parkingType of parkingTypes) {
        if (selectedParkingTypes.includes(parkingType._id)) {
          for (const specialPrice of parkingType.specialPrices) {
            deletePromises.push(deleteSpecialPrice(parkingType._id, specialPrice._id));
          }
        }
      }
      
      await Promise.all(deletePromises);
      toast.success(`Đã xóa ${allSpecialPrices.length} giá đặc biệt từ ${selectedParkingTypes.length} bãi đậu xe`);
      setShowBulkDeleteDialog(false);
      setSelectedParkingTypes([]);
      await loadParkingTypes();
    } catch (error: any) {
      console.error('Error bulk deleting special prices:', error);
      toast.error('Không thể xóa giá đặc biệt hàng loạt');
    }
  };

  const handleBulkEdit = async () => {
    if (selectedParkingTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bãi đậu xe');
      return;
    }
    
    if (!formData.startDate || !formData.endDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }
    
    try {
      // Lấy tất cả special prices của các bãi đã chọn
      const allSpecialPrices = parkingTypes
        .filter(pt => selectedParkingTypes.includes(pt._id))
        .flatMap(pt => pt.specialPrices);
      
      if (allSpecialPrices.length === 0) {
        toast.error('Không có giá đặc biệt nào để sửa');
        return;
      }
      
      // Cập nhật tất cả special prices với formData mới
      const updatePromises = [];
      for (const parkingType of parkingTypes) {
        if (selectedParkingTypes.includes(parkingType._id)) {
          for (const specialPrice of parkingType.specialPrices) {
            updatePromises.push(updateSpecialPrice(parkingType._id, specialPrice._id, formData));
          }
        }
      }
      
      await Promise.all(updatePromises);
      toast.success(`Đã cập nhật ${allSpecialPrices.length} giá đặc biệt từ ${selectedParkingTypes.length} bãi đậu xe`);
      setShowBulkEditDialog(false);
      setSelectedParkingTypes([]);
      resetForm();
      await loadParkingTypes();
    } catch (error: any) {
      console.error('Error bulk updating special prices:', error);
      toast.error('Không thể cập nhật giá đặc biệt hàng loạt');
    }
  };

  const handleSelectAllParkingTypes = () => {
    if (selectedParkingTypes.length === parkingTypes.length) {
      setSelectedParkingTypes([]);
    } else {
      setSelectedParkingTypes(parkingTypes.map(pt => pt._id));
    }
  };

  const handleSelectParkingType = (parkingTypeId: string) => {
    setSelectedParkingTypes(prev => 
      prev.includes(parkingTypeId) 
        ? prev.filter(id => id !== parkingTypeId)
        : [...prev, parkingTypeId]
    );
  };

  const filteredSpecialPrices = specialPrices.filter(specialPrice => {
    const matchesSearch = 
      specialPrice.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const allSpecialPrices = parkingTypes.flatMap(pt => 
    pt.specialPrices.map(sp => ({
      ...sp,
      parkingTypeName: pt.name,
      parkingTypeCode: pt.code
    }))
  );

  const filteredAllSpecialPrices = allSpecialPrices.filter(specialPrice => {
    const matchesSearch = 
      specialPrice.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialPrice.parkingTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <h1 className="text-3xl font-bold">Giá đặc biệt</h1>
          <p className="text-gray-600">Quản lý giá đặc biệt cho các ngày cụ thể</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadParkingTypes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" onClick={openBulkCreateDialog}>
            <Layers className="h-4 w-4 mr-2" />
            Cấu hình hàng loạt
          </Button>
          <Button onClick={openCreateDialog} disabled={!selectedParkingType}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm giá đặc biệt
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'single' | 'overview')} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Cấu hình từng bãi</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Tổng quan tất cả</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          {/* Parking Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Chọn bãi đậu xe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parkingType">Bãi đậu xe</Label>
                  <select
                    id="parkingType"
                    value={selectedParkingType?._id || ''}
                    onChange={(e) => handleParkingTypeChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {parkingTypes.map((parkingType) => (
                      <option key={parkingType._id} value={parkingType._id}>
                        {parkingType.name} ({parkingType.code}) - {formatCurrency(parkingType.pricePerDay)}/ngày
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    Giá cơ bản: {selectedParkingType ? formatCurrency(selectedParkingType.pricePerDay) : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
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
                      placeholder="Lý do..."
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

          {/* Special Prices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách giá đặc biệt</CardTitle>
              <CardDescription>
                {selectedParkingType && `Bãi đậu xe: ${selectedParkingType.name}`} - 
                Tổng cộng {filteredSpecialPrices.length} giá đặc biệt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpecialPrices.map((specialPrice) => (
                    <TableRow key={specialPrice._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDateRange(specialPrice.startDate, specialPrice.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-bold text-green-600">
                            {formatCurrency(specialPrice.price)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{specialPrice.reason}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={specialPrice.isActive ? 'default' : 'secondary'}>
                          {specialPrice.isActive ? (
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
                            onClick={() => openEditDialog(specialPrice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(specialPrice)}
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
              {filteredSpecialPrices.length === 0 && (
                <div className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có giá đặc biệt</h3>
                  <p className="text-gray-500">
                    Chưa có giá đặc biệt nào được thiết lập cho bãi đậu xe này.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Parking Type Selection for Bulk Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Chọn bãi đậu xe cho thao tác hàng loạt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAllOverview"
                    checked={selectedParkingTypes.length === parkingTypes.length}
                    onCheckedChange={handleSelectAllParkingTypes}
                  />
                  <Label htmlFor="selectAllOverview" className="font-medium">Chọn tất cả bãi đậu xe</Label>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {parkingTypes.map((parkingType) => (
                    <div key={parkingType._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`overview-${parkingType._id}`}
                        checked={selectedParkingTypes.includes(parkingType._id)}
                        onCheckedChange={() => handleSelectParkingType(parkingType._id)}
                      />
                      <Label htmlFor={`overview-${parkingType._id}`} className="text-sm">
                        {parkingType.name} ({parkingType.code})
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600">
                  Đã chọn: {selectedParkingTypes.length}/{parkingTypes.length} bãi đậu xe
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Bộ lọc tổng quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="overviewSearch">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="overviewSearch"
                      placeholder="Lý do hoặc tên bãi đậu xe..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    Tổng cộng: {filteredAllSpecialPrices.length} giá đặc biệt
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan tất cả giá đặc biệt</CardTitle>
              <CardDescription>
                Xem tất cả giá đặc biệt của tất cả bãi đậu xe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bãi đậu xe</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllSpecialPrices.map((specialPrice) => (
                    <TableRow key={`${specialPrice.parkingTypeCode}-${specialPrice._id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {specialPrice.parkingTypeName}
                          <Badge variant="outline" className="ml-2">
                            {specialPrice.parkingTypeCode}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDateRange(specialPrice.startDate, specialPrice.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-bold text-green-600">
                            {formatCurrency(specialPrice.price)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{specialPrice.reason}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={specialPrice.isActive ? 'default' : 'secondary'}>
                          {specialPrice.isActive ? (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* No Results */}
              {filteredAllSpecialPrices.length === 0 && (
                <div className="p-8 text-center">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có giá đặc biệt</h3>
                  <p className="text-gray-500">
                    Chưa có giá đặc biệt nào được thiết lập cho bất kỳ bãi đậu xe nào.
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Sửa giá đặc biệt' : 'Thêm giá đặc biệt mới'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật thông tin giá đặc biệt' : 'Tạo giá đặc biệt mới cho ngày cụ thể'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Từ ngày *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Đến ngày *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Giá (TWD) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                placeholder="Nhập giá..."
              />
            </div>

                          <div>
                <Label htmlFor="reason">Lý do *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ví dụ: Cuối tuần, Ngày lễ Tết, Sự kiện đặc biệt, Mùa cao điểm, Lễ hội, Ngày nghỉ lễ..."
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 Nhập lý do cụ thể để khách hàng hiểu rõ tại sao giá thay đổi
                </div>
              </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Kích hoạt giá đặc biệt này</Label>
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
              {isEditing ? 'Cập nhật' : 'Tạo giá đặc biệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* Bulk Template Dialog */}
       <Dialog open={showBulkTemplateDialog} onOpenChange={setShowBulkTemplateDialog}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Chọn template để áp dụng</DialogTitle>
             <DialogDescription>
               Chọn một template để áp dụng cho các bãi đậu xe đã chọn.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             {bulkTemplateData.map((template, index) => (
               <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                 <div className="flex items-center space-x-2">
                   <Calendar className="h-4 w-4 text-gray-500" />
                   <span>{formatDateRange(template.startDate, template.endDate)}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <DollarSign className="h-4 w-4 text-green-500" />
                   <span>{formatCurrency(template.price)}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Badge variant={template.isActive ? 'default' : 'secondary'}>
                     {template.isActive ? 'Hoạt động' : 'Tạm khóa'}
                   </Badge>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => {
                       setFormData(template);
                       setShowBulkTemplateDialog(false);
                       setBulkTemplateData([]); // Clear selected templates
                     }}
                   >
                     <Edit className="h-4 w-4" />
                   </Button>
                   <Button
                     size="sm"
                     variant="destructive"
                     onClick={() => {
                       setBulkTemplateData(bulkTemplateData.filter((_, i) => i !== index));
                     }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             ))}
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={() => {
               setShowBulkTemplateDialog(false);
               setBulkTemplateData([]);
             }}>
               Hủy
             </Button>
             <Button onClick={handleBulkTemplateApply} disabled={bulkTemplateData.length === 0}>
               <Copy className="h-4 w-4 mr-2" />
               Áp dụng cho {selectedParkingTypes.length} bãi đậu xe
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

              {/* Bulk Create Dialog */}
       <Dialog open={showBulkCreateDialog} onOpenChange={setShowBulkCreateDialog}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cấu hình giá đặc biệt hàng loạt</DialogTitle>
            <DialogDescription>
              Áp dụng giá đặc biệt cho nhiều bãi đậu xe cùng lúc
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
                         {/* Quick Templates */}
             <div>
               <Label className="text-sm font-medium">Template nhanh</Label>
               {selectedTemplate === 'weekend' && formData.startDate && formData.endDate && (
                 <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md mt-1">
                   💡 Template "Cuối tuần" sẽ tạo giá đặc biệt cho tất cả cuối tuần trong khoảng từ {formData.startDate} đến {formData.endDate}
                 </div>
               )}
               <div className="grid grid-cols-3 gap-2 mt-2">
                 <Button 
                   variant={selectedTemplate === 'weekend' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleQuickTemplate('weekend')}
                   className="flex items-center space-x-2"
                 >
                   <Zap className="h-3 w-3" />
                   <span>Cuối tuần</span>
                 </Button>
                 <Button 
                   variant={selectedTemplate === 'holiday' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleQuickTemplate('holiday')}
                   className="flex items-center space-x-2"
                 >
                   <Calendar className="h-3 w-3" />
                   <span>Ngày lễ</span>
                 </Button>
                 <Button 
                   variant={selectedTemplate === 'peak' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleQuickTemplate('peak')}
                   className="flex items-center space-x-2"
                 >
                   <TrendingUp className="h-3 w-3" />
                   <span>Cao điểm</span>
                 </Button>
               </div>
             </div>

                         {/* Form */}
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="bulkStartDate">Từ ngày *</Label>
                   <Input
                     id="bulkStartDate"
                     type="date"
                     value={formData.startDate}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, startDate: e.target.value }));
                       // Nếu đã chọn template cuối tuần, cập nhật lại template
                       if (selectedTemplate === 'weekend' && formData.endDate) {
                         const templateData = getQuickTemplate('weekend', e.target.value, formData.endDate);
                         setBulkTemplateData(templateData);
                       }
                     }}
                   />
                 </div>
                 <div>
                   <Label htmlFor="bulkEndDate">Đến ngày *</Label>
                   <Input
                     id="bulkEndDate"
                     type="date"
                     value={formData.endDate}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, endDate: e.target.value }));
                       // Nếu đã chọn template cuối tuần, cập nhật lại template
                       if (selectedTemplate === 'weekend' && formData.startDate) {
                         const templateData = getQuickTemplate('weekend', formData.startDate, e.target.value);
                         setBulkTemplateData(templateData);
                       }
                     }}
                   />
                 </div>
               </div>

              <div>
                <Label htmlFor="bulkPrice">Giá (TWD) *</Label>
                <Input
                  id="bulkPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  placeholder="Nhập giá..."
                />
              </div>

              <div>
                <Label htmlFor="bulkReason">Lý do *</Label>
                <Textarea
                  id="bulkReason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ví dụ: Cuối tuần, Ngày lễ Tết, Sự kiện đặc biệt, Mùa cao điểm, Lễ hội, Ngày nghỉ lễ..."
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 Nhập lý do cụ thể để khách hàng hiểu rõ tại sao giá thay đổi
                </div>
              </div>

                             <div className="flex items-center space-x-2">
                 <Switch
                   id="bulkIsActive"
                   checked={formData.isActive}
                   onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                 />
                 <Label htmlFor="bulkIsActive">Kích hoạt giá đặc biệt này</Label>
               </div>
               
               <div className="flex items-center space-x-2">
                 <Switch
                   id="forceOverride"
                   checked={forceOverride}
                   onCheckedChange={setForceOverride}
                 />
                 <Label htmlFor="forceOverride" className="text-orange-600">
                   Ghi đè giá đặc biệt đã tồn tại
                 </Label>
               </div>
            </div>

            {/* Parking Type Selection */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="selectAll"
                  checked={selectedParkingTypes.length === parkingTypes.length}
                  onCheckedChange={handleSelectAllParkingTypes}
                />
                <Label htmlFor="selectAll" className="font-medium">Chọn tất cả bãi đậu xe</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {parkingTypes.map((parkingType) => (
                  <div key={parkingType._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={parkingType._id}
                      checked={selectedParkingTypes.includes(parkingType._id)}
                      onCheckedChange={() => handleSelectParkingType(parkingType._id)}
                    />
                    <Label htmlFor={parkingType._id} className="text-sm">
                      {parkingType.name} ({parkingType.code})
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Đã chọn: {selectedParkingTypes.length}/{parkingTypes.length} bãi đậu xe
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkCreateDialog(false);
              resetForm();
              setSelectedParkingTypes([]);
            }}>
              Hủy
            </Button>
            <Button onClick={handleBulkCreate} disabled={selectedParkingTypes.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              Áp dụng cho {selectedParkingTypes.length} bãi đậu xe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Template Dialog */}
      <Dialog open={showBulkTemplateDialog} onOpenChange={setShowBulkTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chọn template để áp dụng</DialogTitle>
            <DialogDescription>
              Chọn một template để áp dụng cho các bãi đậu xe đã chọn.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {bulkTemplateData.map((template, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDateRange(template.startDate, template.endDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>{formatCurrency(template.price)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Hoạt động' : 'Tạm khóa'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData(template);
                      setShowBulkTemplateDialog(false);
                      setBulkTemplateData([]); // Clear selected templates
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setBulkTemplateData(bulkTemplateData.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkTemplateDialog(false);
              setBulkTemplateData([]);
            }}>
              Hủy
            </Button>
            <Button onClick={handleBulkTemplateApply} disabled={bulkTemplateData.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              Áp dụng cho {selectedParkingTypes.length} bãi đậu xe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tất cả giá đặc biệt cho các bãi đậu xe đã chọn? 
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật giá đặc biệt hàng loạt</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin giá đặc biệt cho tất cả các giá đặc biệt của các bãi đậu xe đã chọn.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulkStartDateEdit">Từ ngày *</Label>
                <Input
                  id="bulkStartDateEdit"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bulkEndDateEdit">Đến ngày *</Label>
                <Input
                  id="bulkEndDateEdit"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bulkPriceEdit">Giá (TWD) *</Label>
              <Input
                id="bulkPriceEdit"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                placeholder="Nhập giá..."
              />
            </div>

            <div>
              <Label htmlFor="bulkReasonEdit">Lý do *</Label>
              <Textarea
                id="bulkReasonEdit"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ví dụ: Cuối tuần, Ngày lễ Tết, Sự kiện đặc biệt, Mùa cao điểm, Lễ hội, Ngày nghỉ lễ..."
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 Nhập lý do cụ thể để khách hàng hiểu rõ tại sao giá thay đổi
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="bulkIsActiveEdit"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="bulkIsActiveEdit">Kích hoạt giá đặc biệt này</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkEditDialog(false);
              resetForm();
            }}>
              Hủy
            </Button>
            <Button onClick={handleBulkEdit}>
              Cập nhật
            </Button>
          </DialogFooter>
                 </DialogContent>
       </Dialog>

       {/* Bulk Delete Dialog */}
       <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Xác nhận xóa hàng loạt</DialogTitle>
             <DialogDescription>
               Bạn có chắc chắn muốn xóa tất cả giá đặc biệt cho các bãi đậu xe đã chọn? 
               Hành động này không thể hoàn tác.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
               Hủy
             </Button>
             <Button variant="destructive" onClick={handleBulkDelete}>
               Xóa
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Bulk Edit Dialog */}
       <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Cập nhật giá đặc biệt hàng loạt</DialogTitle>
             <DialogDescription>
               Cập nhật thông tin giá đặc biệt cho tất cả các giá đặc biệt của các bãi đậu xe đã chọn.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="bulkStartDateEdit">Từ ngày *</Label>
                 <Input
                   id="bulkStartDateEdit"
                   type="date"
                   value={formData.startDate}
                   onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                 />
               </div>
               <div>
                 <Label htmlFor="bulkEndDateEdit">Đến ngày *</Label>
                 <Input
                   id="bulkEndDateEdit"
                   type="date"
                   value={formData.endDate}
                   onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                 />
               </div>
             </div>

             <div>
               <Label htmlFor="bulkPriceEdit">Giá (TWD) *</Label>
               <Input
                 id="bulkPriceEdit"
                 type="number"
                 value={formData.price}
                 onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                 placeholder="Nhập giá..."
               />
             </div>

             <div>
               <Label htmlFor="bulkReasonEdit">Lý do *</Label>
               <Textarea
                 id="bulkReasonEdit"
                 value={formData.reason}
                 onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                 placeholder="Ví dụ: Cuối tuần, Ngày lễ Tết, Sự kiện đặc biệt, Mùa cao điểm, Lễ hội, Ngày nghỉ lễ..."
                 rows={3}
               />
               <div className="text-xs text-gray-500 mt-1">
                 💡 Nhập lý do cụ thể để khách hàng hiểu rõ tại sao giá thay đổi
               </div>
             </div>

             <div className="flex items-center space-x-2">
               <Switch
                 id="bulkIsActiveEdit"
                 checked={formData.isActive}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
               />
               <Label htmlFor="bulkIsActiveEdit">Kích hoạt giá đặc biệt này</Label>
             </div>
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={() => {
               setShowBulkEditDialog(false);
               resetForm();
             }}>
               Hủy
             </Button>
             <Button onClick={handleBulkEdit}>
               Cập nhật
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
              Bạn có chắc chắn muốn xóa giá đặc biệt cho khoảng thời gian "{selectedSpecialPrice ? formatDateRange(selectedSpecialPrice.startDate, selectedSpecialPrice.endDate) : ''}"? 
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

export default AdminSpecialPricing; 