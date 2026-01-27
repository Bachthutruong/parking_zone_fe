import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DateInput from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Layers,
  Copy,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllParkingTypes, addSpecialPrice, addBulkSpecialPrices, updateSpecialPrice, deleteSpecialPrice, getSpecialPrices } from '@/services/admin';
import { formatDateRange } from '@/lib/dateUtils';

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
  // const [viewMode, setViewMode] = useState<'single' | 'overview'>('single'); // Removed viewMode
  const [selectedParkingTypes, setSelectedParkingTypes] = useState<string[]>([]);
  const [bulkTemplateData, setBulkTemplateData] = useState<any[]>([]);
  const [showBulkTemplateDialog, setShowBulkTemplateDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [forceOverride, setForceOverride] = useState(false);
  const [singleForceOverride, setSingleForceOverride] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    price: 0,
    reason: '',
    isActive: true
  });
  const [isSingleDayMode, setIsSingleDayMode] = useState(false);
  const [dialogParkingTypeId, setDialogParkingTypeId] = useState<string>('');

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
      setParkingTypes(parkingTypesWithSpecialPrices);
      // Removed auto-selection to default to "Overview" mode
      // if (parkingTypesWithSpecialPrices.length > 0) {
      //   setSelectedParkingType(parkingTypesWithSpecialPrices[0]);
      //   setSpecialPrices(parkingTypesWithSpecialPrices[0].specialPrices);
      // }
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
    if (parkingTypeId === 'all') {
      setSelectedParkingType(null);
      setSpecialPrices([]);
      return;
    }
    const parkingType = parkingTypes.find(pt => pt._id === parkingTypeId);
    setSelectedParkingType(parkingType || null);
    if (parkingType) {
      setSpecialPrices(parkingType.specialPrices);
    }
  };

  const handleCreate = async () => {
    // Only use dialogParkingTypeId as the source of truth for creation
    const targetParkingTypeId = dialogParkingTypeId;

    if (!targetParkingTypeId) {
      toast.error('請選擇一個停車場');
      return;
    }
    
    if (!formData.startDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }

    if (!isSingleDayMode && !formData.endDate) {
      toast.error('Vui lòng chọn ngày kết thúc');
      return;
    }

    // Nếu là chế độ 1 ngày, sử dụng startDate cho cả endDate
    const dataToSubmit = {
      ...formData,
      endDate: isSingleDayMode ? formData.startDate : formData.endDate,
      forceOverride: singleForceOverride
    };
    
    try {
      const result = await addSpecialPrice(targetParkingTypeId, dataToSubmit);
      toast.success(result.message || '新增特殊價格成功');
      setShowCreateDialog(false);
      resetForm();
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      console.error('Error creating special price:', error);
      const errorMessage = error.response?.data?.message || '無法新增特殊價格';
      toast.error(errorMessage);
    }
  };

  const handleBulkCreate = async () => {
    if (selectedParkingTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bãi đậu xe');
      return;
    }

    if (!formData.startDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }

    // Nếu là chế độ 1 ngày, sử dụng startDate cho cả endDate
    const dataToSubmit = {
      ...formData,
      endDate: isSingleDayMode ? formData.startDate : formData.endDate
    };

    try {
      // Sử dụng bulk endpoint cho từng parking type
      const results = [];
      for (const parkingTypeId of selectedParkingTypes) {
        try {
          const result = await addBulkSpecialPrices(parkingTypeId, [dataToSubmit], forceOverride);
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
        toast.success(`成功創建 ${successCount} 個特殊價格`);
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} 個特殊價格創建失敗`);
      }

      setShowBulkCreateDialog(false);
      resetForm();
      setSelectedParkingTypes([]);
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      console.error('Error creating bulk special prices:', error);
      toast.error(error.response?.data?.message || '批量創建特殊價格時發生錯誤');
    }
  };

  const handleEdit = async () => {
    if (!selectedSpecialPrice || !selectedParkingType) return;
    
    if (!formData.startDate || !formData.price || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bao gồm lý do');
      return;
    }

    // Nếu là chế độ 1 ngày, sử dụng startDate cho cả endDate
    const dataToSubmit = {
      ...formData,
      endDate: isSingleDayMode ? formData.startDate : formData.endDate
    };
    
    try {
      await updateSpecialPrice(selectedParkingType._id, selectedSpecialPrice._id, dataToSubmit);
      toast.success('更新特殊價格成功');
      setShowEditDialog(false);
      resetForm();
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      console.error('Error updating special price:', error);
      toast.error('無法更新特殊價格');
    }
  };

  const handleDelete = async () => {
    if (!selectedSpecialPrice || !selectedParkingType) return;
    
    try {
      await deleteSpecialPrice(selectedParkingType._id, selectedSpecialPrice._id);
      toast.success('刪除特殊價格成功');
      setShowDeleteDialog(false);
      setSelectedSpecialPrice(null);
      await loadParkingTypes(); // Reload all data
    } catch (error: any) {
      toast.error('無法刪除特殊價格');
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
    setIsSingleDayMode(false);
    setSingleForceOverride(false);
    setDialogParkingTypeId('');
  };

  const openCreateDialog = () => {
    setFormData({
      startDate: '',
      endDate: '',
      price: 0,
      reason: '',
      isActive: true
    });
    setIsSingleDayMode(false);
    setSingleForceOverride(false);
    
    // If a parking type is selected, use it. Otherwise default to empty or first one.
    // Always pre-fill with selected or first available, but allow user to change it in dialog
    if (selectedParkingType) {
        setDialogParkingTypeId(selectedParkingType._id);
    } else if (parkingTypes.length > 0) {
        setDialogParkingTypeId(parkingTypes[0]._id);
    }
    
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
    setIsSingleDayMode(false);
    setShowBulkCreateDialog(true);
  };

  const openEditDialog = (specialPrice: SpecialPrice) => {
    setSelectedSpecialPrice(specialPrice);
    const startDate = new Date(specialPrice.startDate).toISOString().split('T')[0];
    const endDate = new Date(specialPrice.endDate).toISOString().split('T')[0];
    
    setFormData({
      startDate: startDate,
      endDate: endDate,
      price: specialPrice.price,
      reason: specialPrice.reason,
      isActive: specialPrice.isActive
    });
    
    // Kiểm tra xem có phải là 1 ngày không
    setIsSingleDayMode(startDate === endDate);
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (specialPrice: SpecialPrice) => {
    setSelectedSpecialPrice(specialPrice);
    setShowDeleteDialog(true);
  };

  // Date formatting functions are now imported from dateUtils

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
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
            reason: '週末',
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
          reason: '節日',
          isActive: true
        }];
        
      case 'peak':
        return [{
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: selectedParkingType ? Math.round(selectedParkingType.pricePerDay * 1.3) : 0,
          reason: '旺季',
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
    
    if (!formData.startDate || !formData.price || !formData.reason.trim()) {
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
          <h1 className="text-2xl sm:text-3xl font-bold">特殊價格</h1>
          <p className="text-gray-600 text-sm sm:text-base">管理特定日期的特殊價格</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadParkingTypes} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">重新整理</span>
          </Button>
          <Button variant="outline" onClick={openBulkCreateDialog} className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Layers className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">批量配置</span>
          </Button>

        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border mb-4 sm:mb-6 flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
        <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-64">
             <Label htmlFor="parkingTypeSelect" className="sr-only">選擇停車場</Label>
             <select
                id="parkingTypeSelect"
                value={selectedParkingType?._id || 'all'}
                onChange={(e) => handleParkingTypeChange(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">所有的停車場 (全部概覽)</option>
                {parkingTypes.map((parkingType) => (
                  <option key={parkingType._id} value={parkingType._id}>
                    {parkingType.name}
                  </option>
                ))}
              </select>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={selectedParkingType ? "搜尋原因..." : "搜尋原因或停車場..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
             <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                新增特殊價格
              </Button>
        </div>
      </div>

       {/* Parking Info Card (Visible only when specific parking type selected) */}
       {selectedParkingType && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{selectedParkingType.name}</div>
              <div className="text-sm text-gray-500 mt-1 font-mono">{selectedParkingType.code}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm">
             <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                標準價格
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{formatCurrency(selectedParkingType.pricePerDay)}</div>
              <div className="text-sm text-gray-500 mt-1">每天</div>
            </CardContent>
          </Card>

           <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 shadow-sm">
             <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm font-medium text-purple-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                特殊價格設定
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{filteredSpecialPrices.length}</div>
              <div className="text-sm text-gray-500 mt-1">個設定項目</div>
            </CardContent>
          </Card>
        </div>
       )}

      {/* Main Content Table (Unified) */}
      <Card className="shadow-md border-0 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="flex justify-between items-center">
             <div>
                <CardTitle className="text-base sm:text-lg">特殊價格清單</CardTitle>
                <CardDescription className="text-sm">
                  {selectedParkingType 
                    ? `管理 ${selectedParkingType.name} 的特殊價格` 
                    : `顯示所有停車場的特殊價格 (${filteredAllSpecialPrices.length} 筆)`}
                </CardDescription>
             </div>
             {!selectedParkingType && (
               <Badge variant="outline" className="text-gray-500">全部概覽模式</Badge>
             )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                {!selectedParkingType && <TableHead className="w-[200px]">停車場</TableHead>}
                <TableHead>日期範圍</TableHead>
                <TableHead>價格設定</TableHead>
                <TableHead>原因/備註</TableHead>
                <TableHead>狀態</TableHead>
                {selectedParkingType && <TableHead className="text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(selectedParkingType ? filteredSpecialPrices : filteredAllSpecialPrices).length > 0 ? (
                (selectedParkingType ? filteredSpecialPrices : filteredAllSpecialPrices).map((item: any) => (
                  <TableRow key={item._id} className="hover:bg-blue-50/30 transition-colors">
                    {!selectedParkingType && (
                      <TableCell>
                        <div className="font-medium">
                          {item.parkingTypeName}
                          <div className="text-xs text-gray-500 mt-0.5">{item.parkingTypeCode}</div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-700">{formatDateRange(item.startDate, item.endDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold px-2 py-0.5">
                            {formatCurrency(item.price)}
                         </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-700 max-w-md truncate" title={item.reason}>{item.reason}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={item.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0" : "bg-gray-100 text-gray-500 hover:bg-gray-200 border-0"}>
                        {item.isActive ? (
                          <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> 啟用</div>
                        ) : (
                          <div className="flex items-center gap-1"><XCircle className="h-3 w-3" /> 停用</div>
                        )}
                      </Badge>
                    </TableCell>
                    {selectedParkingType && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={selectedParkingType ? 5 : 6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                           <div className="bg-gray-100 p-3 rounded-full mb-3">
                             <TrendingUp className="h-6 w-6" />
                           </div>
                           <p className="text-base font-medium">暫無特殊價格設定</p>
                           <p className="text-sm mt-1">在此期間內沒有找到相關記錄</p>
                        </div>
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
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
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? '編輯特殊價格' : '新增特殊價格'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '更新特殊價格資訊' : '為特定日期創建新的特殊價格'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="dialogParkingType">停車場 *</Label>
              <select
                id="dialogParkingType"
                value={dialogParkingTypeId}
                onChange={(e) => setDialogParkingTypeId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
                disabled={isEditing} // Disable editing in edit mode if needed, or allow it. Usually you can't move a price to another lot easily backend-wise, but for create it should be enabled.
              >
                {parkingTypes.map((pt) => (
                  <option key={pt._id} value={pt._id}>
                    {pt.name} ({pt.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="singleDayMode"
                checked={isSingleDayMode}
                onCheckedChange={setIsSingleDayMode}
              />
              <Label htmlFor="singleDayMode" className="font-medium">
                {isSingleDayMode ? '單日模式' : '日期範圍模式'}
              </Label>
            </div>

            {isSingleDayMode ? (
              <div>
                <Label htmlFor="singleDate">選擇日期 *</Label>
                <DateInput
                  id="singleDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(startDate) => setFormData(prev => ({ 
                    ...prev, 
                    startDate,
                    endDate: startDate // Tự động set endDate giống startDate
                  }))}
                  placeholder="yyyy/mm/dd"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="startDate">開始日期 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">結束日期 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="price">價格 (TWD) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                placeholder="Nhập giá..."
              />
            </div>

                          <div>
                <Label htmlFor="reason">原因 *</Label>
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
              <Label htmlFor="isActive">啟用此特殊價格</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="singleForceOverride"
                checked={singleForceOverride}
                onCheckedChange={setSingleForceOverride}
              />
              <Label htmlFor="singleForceOverride" className="text-orange-600">
                覆蓋已存在的特殊價格
              </Label>
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
              {isEditing ? '更新' : '創建特殊價格'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* Bulk Template Dialog */}
       <Dialog open={showBulkTemplateDialog} onOpenChange={setShowBulkTemplateDialog}>
         <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>選擇要應用的模板</DialogTitle>
             <DialogDescription>
               選擇一個模板應用到已選擇的停車場。
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
                     {template.isActive ? '啟用' : '暫停'}
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
               應用到 {selectedParkingTypes.length} 個停車場
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

              {/* Bulk Create Dialog */}
       <Dialog open={showBulkCreateDialog} onOpenChange={setShowBulkCreateDialog}>
         <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批量特殊價格配置</DialogTitle>
            <DialogDescription>
              同時為多個停車場應用特殊價格
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
                         {/* Quick Templates */}
             <div>
               <Label className="text-sm font-medium">快速模板</Label>
               {selectedTemplate === 'weekend' && formData.startDate && formData.endDate && (
                 <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md mt-1">
                   💡 "週末"模板將為 {formData.startDate} 到 {formData.endDate} 期間的所有週末創建特殊價格
                 </div>
               )}
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                 <Button 
                   variant={selectedTemplate === 'weekend' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleQuickTemplate('weekend')}
                   className="flex items-center space-x-2"
                 >
                   <Zap className="h-3 w-3" />
                   <span>週末</span>
                 </Button>
                 <Button 
                   variant={selectedTemplate === 'holiday' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleQuickTemplate('holiday')}
                   className="flex items-center space-x-2"
                 >
                   <Calendar className="h-3 w-3" />
                   <span>節日</span>
                 </Button>
                 <Button 
                   variant={selectedTemplate === 'peak' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleQuickTemplate('peak')}
                   className="flex items-center space-x-2"
                 >
                   <TrendingUp className="h-3 w-3" />
                   <span>旺季</span>
                 </Button>
               </div>
             </div>

                         {/* Date Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="bulkSingleDayMode"
                checked={isSingleDayMode}
                onCheckedChange={setIsSingleDayMode}
              />
              <Label htmlFor="bulkSingleDayMode" className="font-medium">
                {isSingleDayMode ? '單日模式' : '日期範圍模式'}
              </Label>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {isSingleDayMode ? (
                <div>
                  <Label htmlFor="bulkSingleDate">選擇日期 *</Label>
                  <Input
                    id="bulkSingleDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      startDate: e.target.value,
                      endDate: e.target.value // Tự động set endDate giống startDate
                    }))}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="bulkStartDate">開始日期 *</Label>
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
                    <Label htmlFor="bulkEndDate">結束日期 *</Label>
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
              )}

              <div>
                <Label htmlFor="bulkPrice">價格 (TWD) *</Label>
                <Input
                  id="bulkPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  placeholder="輸入價格..."
                />
              </div>

              <div>
                <Label htmlFor="bulkReason">原因 *</Label>
                <Textarea
                  id="bulkReason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="例如：週末、國定假日、特別活動、旺季、節慶、假期…"
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 提供具體理由，讓顧客了解價格變動的原因。
                </div>
              </div>

                             <div className="flex items-center space-x-2">
                 <Switch
                   id="bulkIsActive"
                   checked={formData.isActive}
                   onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                 />
                 <Label htmlFor="bulkIsActive">啟用此特殊價格</Label>
               </div>
               
               <div className="flex items-center space-x-2">
                 <Switch
                   id="forceOverride"
                   checked={forceOverride}
                   onCheckedChange={setForceOverride}
                 />
                 <Label htmlFor="forceOverride" className="text-orange-600">
                   覆蓋已存在的特殊價格
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
                <Label htmlFor="selectAll" className="font-medium">選擇所有停車場</Label>
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
                已選擇: {selectedParkingTypes.length}/{parkingTypes.length} 個停車場
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
              應用到 {selectedParkingTypes.length} 個停車場
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Template Dialog */}
      <Dialog open={showBulkTemplateDialog} onOpenChange={setShowBulkTemplateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              您確定要刪除所選停車場的所有特殊價格嗎？ 
              此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>批量更新特殊價格</DialogTitle>
            <DialogDescription>
              更新所選停車場所有特殊價格的資訊。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="bulkEditSingleDayMode"
                checked={isSingleDayMode}
                onCheckedChange={setIsSingleDayMode}
              />
              <Label htmlFor="bulkEditSingleDayMode" className="font-medium">
                {isSingleDayMode ? '單日模式' : '日期範圍模式'}
              </Label>
            </div>

            {isSingleDayMode ? (
              <div>
                <Label htmlFor="bulkEditSingleDate">選擇日期 *</Label>
                <Input
                  id="bulkEditSingleDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    startDate: e.target.value,
                    endDate: e.target.value // Tự động set endDate giống startDate
                  }))}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="bulkStartDateEdit">開始日期 *</Label>
                  <Input
                    id="bulkStartDateEdit"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bulkEndDateEdit">結束日期 *</Label>
                  <Input
                    id="bulkEndDateEdit"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="bulkPriceEdit">價格 (TWD) *</Label>
              <Input
                id="bulkPriceEdit"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                placeholder="Nhập giá..."
              />
            </div>

            <div>
              <Label htmlFor="bulkReasonEdit">原因 *</Label>
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
              <Label htmlFor="bulkIsActiveEdit">啟用此特殊價格</Label>
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
         <DialogContent className="max-w-[95vw] sm:max-w-md">
           <DialogHeader>
             <DialogTitle>確認批量刪除</DialogTitle>
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
         <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
               <Label htmlFor="bulkIsActiveEdit">啟用此特殊價格</Label>
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
               更新
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
              您確定要刪除時間範圍 "{selectedSpecialPrice ? formatDateRange(selectedSpecialPrice.startDate, selectedSpecialPrice.endDate) : ''}" 的特殊價格嗎？ 
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

export default AdminSpecialPricing; 