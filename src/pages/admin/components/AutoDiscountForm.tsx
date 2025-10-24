import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createAutoDiscount, updateAutoDiscount } from '@/services/autoDiscounts';
import { getAllParkingTypes } from '@/services/parking';

interface AutoDiscountFormProps {
  discount?: any;
  onSubmit: () => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  minDays: number;
  maxDays: string;
  applicableParkingTypes: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount: string;
  applyToSpecialPrices: boolean;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  priority: number;
  maxUsage: number;
  userRestrictions: {
    newUsersOnly: boolean;
    vipOnly: boolean;
    specificUsers: string[];
  };
  conditions: {
    minBookingAmount: string;
    maxBookingAmount: string;
    specificDaysOfWeek: number[];
    specificTimeSlots: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

const AutoDiscountForm: React.FC<AutoDiscountFormProps> = ({ discount, onSubmit, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [parkingTypes, setParkingTypes] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    minDays: 1,
    maxDays: '',
    applicableParkingTypes: [],
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: '',
    applyToSpecialPrices: false,
    validFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    priority: 0,
    maxUsage: -1,
    userRestrictions: {
      newUsersOnly: false,
      vipOnly: false,
      specificUsers: []
    },
    conditions: {
      minBookingAmount: '',
      maxBookingAmount: '',
      specificDaysOfWeek: [],
      specificTimeSlots: []
    }
  });

  useEffect(() => {
    loadParkingTypes();
    if (discount) {
      setFormData({
        name: discount.name || '',
        description: discount.description || '',
        minDays: discount.minDays || 1,
        maxDays: discount.maxDays?.toString() || '',
        applicableParkingTypes: Array.isArray(discount.applicableParkingTypes) && typeof discount.applicableParkingTypes[0] === 'string' 
          ? discount.applicableParkingTypes as string[]
          : (discount.applicableParkingTypes as Array<{_id: string; name: string; type: string}>).map(pt => pt._id),
        discountType: discount.discountType || 'percentage',
        discountValue: discount.discountValue || 0,
        maxDiscountAmount: discount.maxDiscountAmount?.toString() || '',
        applyToSpecialPrices: discount.applyToSpecialPrices || false,
        validFrom: discount.validFrom ? new Date(discount.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validTo: discount.validTo ? new Date(discount.validTo).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: discount.isActive !== undefined ? discount.isActive : true,
        priority: discount.priority || 0,
        maxUsage: discount.maxUsage || -1,
        userRestrictions: {
          newUsersOnly: discount.userRestrictions?.newUsersOnly || false,
          vipOnly: discount.userRestrictions?.vipOnly || false,
          specificUsers: discount.userRestrictions?.specificUsers || []
        },
        conditions: {
          minBookingAmount: discount.conditions?.minBookingAmount?.toString() || '',
          maxBookingAmount: discount.conditions?.maxBookingAmount?.toString() || '',
          specificDaysOfWeek: discount.conditions?.specificDaysOfWeek || [],
          specificTimeSlots: discount.conditions?.specificTimeSlots || []
        }
      });
    }
  }, [discount]);

  const loadParkingTypes = async () => {
    try {
      const types = await getAllParkingTypes();
      setParkingTypes(types);
    } catch (error) {
      console.error('Error loading parking types:', error);
      toast.error('載入停車場類型失敗');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入折扣名稱';
    }

    if (!formData.description.trim()) {
      newErrors.description = '請輸入折扣描述';
    }

    if (formData.minDays < 1) {
      newErrors.minDays = '最少天數必須大於0';
    }

    if (formData.maxDays && parseInt(formData.maxDays) < formData.minDays) {
      newErrors.maxDays = '最多天數不能少於最少天數';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = '折扣值必須大於0';
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = '百分比折扣不能超過100%';
    }

    if (formData.applicableParkingTypes.length === 0) {
      newErrors.applicableParkingTypes = '請選擇至少一個停車場';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = '請選擇開始日期';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.validFrom);
      if (selectedDate < today) {
        newErrors.validFrom = '開始日期不能早於今天';
      }
    }

    if (!formData.validTo) {
      newErrors.validTo = '請選擇結束日期';
    }

    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) >= new Date(formData.validTo)) {
      newErrors.validTo = '結束日期必須晚於開始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('請修正表單錯誤');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        maxDays: formData.maxDays ? parseInt(formData.maxDays) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        maxUsage: formData.maxUsage === -1 ? -1 : formData.maxUsage,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
        conditions: {
          ...formData.conditions,
          minBookingAmount: formData.conditions.minBookingAmount ? parseFloat(formData.conditions.minBookingAmount) : undefined,
          maxBookingAmount: formData.conditions.maxBookingAmount ? parseFloat(formData.conditions.maxBookingAmount) : undefined
        }
      };

      if (discount) {
        await updateAutoDiscount(discount._id, submitData);
        toast.success('折扣規則更新成功');
      } else {
        await createAutoDiscount(submitData);
        toast.success('折扣規則創建成功');
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving auto discount:', error);
      toast.error(error.response?.data?.message || '保存失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleParkingTypeChange = (parkingTypeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applicableParkingTypes: checked
        ? [...prev.applicableParkingTypes, parkingTypeId]
        : prev.applicableParkingTypes.filter(id => id !== parkingTypeId)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>{discount ? '編輯自動折扣' : '新增自動折扣'}</span>
          </DialogTitle>
          <DialogDescription>
            {discount ? '修改自動折扣規則設定' : '創建新的自動折扣規則'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">基本設定</TabsTrigger>
            <TabsTrigger value="conditions">適用條件</TabsTrigger>
          </TabsList>

          {/* Basic Settings */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">基本資訊</CardTitle>
                <CardDescription>設定折扣的基本資訊和類型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">折扣名稱 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：長期停車優惠"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">優先級</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">數字越大優先級越高</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">折扣描述 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述這個折扣的用途和條件..."
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDays">最少天數 *</Label>
                    <Input
                      id="minDays"
                      type="number"
                      min="1"
                      value={formData.minDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, minDays: parseInt(e.target.value) || 1 }))}
                      className={errors.minDays ? 'border-red-500' : ''}
                    />
                    {errors.minDays && <p className="text-sm text-red-500">{errors.minDays}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDays">最多天數</Label>
                    <Input
                      id="maxDays"
                      type="number"
                      min="1"
                      value={formData.maxDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDays: e.target.value }))}
                      placeholder="留空表示無限制"
                      className={errors.maxDays ? 'border-red-500' : ''}
                    />
                    {errors.maxDays && <p className="text-sm text-red-500">{errors.maxDays}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">折扣類型 *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setFormData(prev => ({ ...prev, discountType: value }))
                      }
                    >
                      <SelectTrigger className={errors.discountType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="選擇折扣類型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">百分比折扣</SelectItem>
                        <SelectItem value="fixed">固定金額折扣</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.discountType && <p className="text-sm text-red-500">{errors.discountType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountValue">折扣值 *</Label>
                    <div className="relative">
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        step={formData.discountType === 'percentage' ? '0.1' : '1'}
                        value={formData.discountValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                        placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                        className={errors.discountValue ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {formData.discountType === 'percentage' ? '%' : 'TWD'}
                      </div>
                    </div>
                    {errors.discountValue && <p className="text-sm text-red-500">{errors.discountValue}</p>}
                  </div>
                </div>

                {formData.discountType === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">最大折扣金額</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                      placeholder="留空表示無限制"
                    />
                    <p className="text-xs text-gray-500">限制百分比折扣的最大金額</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="applyToSpecialPrices"
                    checked={formData.applyToSpecialPrices}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, applyToSpecialPrices: checked }))}
                  />
                  <Label htmlFor="applyToSpecialPrices">適用於特殊價格日期</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">適用停車場</CardTitle>
                <CardDescription>選擇此折扣適用的停車場類型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parkingTypes.map((parkingType) => (
                    <div key={parkingType._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`parking-${parkingType._id}`}
                        checked={formData.applicableParkingTypes.includes(parkingType._id)}
                        onCheckedChange={(checked) => 
                          handleParkingTypeChange(parkingType._id, !!checked)
                        }
                      />
                      <Label htmlFor={`parking-${parkingType._id}`} className="flex-1">
                        <div className="flex items-center justify-between">
                          <span>{parkingType.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(parkingType.pricePerDay)}/天
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.applicableParkingTypes && (
                  <p className="text-sm text-red-500 mt-2">{errors.applicableParkingTypes}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">有效期設定</CardTitle>
                <CardDescription>設定折扣的有效時間</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">開始日期 *</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.validFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                      className={errors.validFrom ? 'border-red-500' : ''}
                    />
                    {errors.validFrom && <p className="text-sm text-red-500">{errors.validFrom}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validTo">結束日期 *</Label>
                    <Input
                      id="validTo"
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                      className={errors.validTo ? 'border-red-500' : ''}
                    />
                    {errors.validTo && <p className="text-sm text-red-500">{errors.validTo}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">啟用此折扣</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conditions */}
          <TabsContent value="conditions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">用戶限制</CardTitle>
                <CardDescription>設定折扣適用的用戶條件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="vipOnly"
                      checked={formData.userRestrictions.vipOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        userRestrictions: { ...prev.userRestrictions, vipOnly: checked }
                      }))}
                    />
                    <Label htmlFor="vipOnly">僅限VIP用戶</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="newUsersOnly"
                      checked={formData.userRestrictions.newUsersOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        userRestrictions: { ...prev.userRestrictions, newUsersOnly: checked }
                      }))}
                    />
                    <Label htmlFor="newUsersOnly">僅限新用戶</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">金額條件</CardTitle>
                <CardDescription>設定訂單金額條件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minBookingAmount">最低訂單金額</Label>
                    <Input
                      id="minBookingAmount"
                      type="number"
                      min="0"
                      value={formData.conditions.minBookingAmount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, minBookingAmount: e.target.value }
                      }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBookingAmount">最高訂單金額</Label>
                    <Input
                      id="maxBookingAmount"
                      type="number"
                      min="0"
                      value={formData.conditions.maxBookingAmount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions, maxBookingAmount: e.target.value }
                      }))}
                      placeholder="留空表示無限制"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">使用限制</CardTitle>
                <CardDescription>設定折扣使用次數限制</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">最大使用次數</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    min="-1"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) || -1 }))}
                    placeholder="-1 表示無限制"
                  />
                  <p className="text-xs text-gray-500">-1 表示無限制使用次數</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : (discount ? '更新' : '創建')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoDiscountForm;