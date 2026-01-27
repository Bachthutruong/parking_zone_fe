import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search,
  Edit,
  Percent,
  DollarSign,
  Calendar,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

interface AutoDiscount {
  _id: string;
  name: string;
  description: string;
  minDays: number;
  maxDays?: number;
  applicableParkingTypes: Array<{
    _id: string;
    name: string;
    type: string;
  }>;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  applyToSpecialPrices: boolean;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  priority: number;
  usageCount: number;
  maxUsage: number;
  userRestrictions: {
    newUsersOnly: boolean;
    vipOnly: boolean;
    specificUsers: string[];
  };
  conditions: {
    minBookingAmount?: number;
    maxBookingAmount?: number;
    specificDaysOfWeek?: number[];
    specificTimeSlots?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AutoDiscountListProps {
  autoDiscounts: AutoDiscount[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  setFilterStatus: (status: 'all' | 'active' | 'inactive') => void;
  onEdit: (discount: AutoDiscount) => void;
  onDelete: (discount: AutoDiscount) => void;
  onRefresh: () => void;
}

const AutoDiscountList: React.FC<AutoDiscountListProps> = ({
  autoDiscounts,
  loading,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const getStatusBadge = (discount: AutoDiscount) => {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);
    
    if (!discount.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">未啟用</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge variant="outline" className="border-blue-200 text-blue-600">未開始</Badge>;
    }
    
    if (now > validTo) {
      return <Badge variant="destructive" className="bg-red-100 text-red-600">已過期</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-600">啟用中</Badge>;
  };

  const getDiscountTypeIcon = (type: string) => {
    return type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />;
  };

  const getDiscountTypeColor = (type: string) => {
    return type === 'percentage' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRestrictionText = (restrictions: AutoDiscount['userRestrictions']) => {
    const texts = [];
    if (restrictions.vipOnly) texts.push('僅VIP');
    if (restrictions.newUsersOnly) texts.push('僅新用戶');
    if (restrictions.specificUsers.length > 0) texts.push(`特定用戶(${restrictions.specificUsers.length})`);
    return texts.length > 0 ? texts.join(', ') : '無限制';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39653f]"></div>
          <span className="ml-2">載入中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>自動折扣列表</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              共 {autoDiscounts.length} 個折扣規則
            </p>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>刷新</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜尋折扣名稱或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="active">啟用中</SelectItem>
              <SelectItem value="inactive">未啟用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>折扣名稱</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>適用停車場</TableHead>
                <TableHead>條件</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>使用次數</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autoDiscounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    沒有找到折扣規則
                  </TableCell>
                </TableRow>
              ) : (
                autoDiscounts.map((discount) => (
                  <TableRow key={discount._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{discount.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {discount.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDiscountTypeIcon(discount.discountType)}
                        <Badge className={getDiscountTypeColor(discount.discountType)}>
                          {discount.discountType === 'percentage' ? '百分比' : '固定金額'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {discount.discountType === 'percentage' 
                            ? `${discount.discountValue}%` 
                            : formatCurrency(discount.discountValue)
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {discount.applicableParkingTypes.length} 個停車場
                        </div>
                        <div className="text-gray-500">
                          {discount.applicableParkingTypes.slice(0, 2).map(pt => pt.name).join(', ')}
                          {discount.applicableParkingTypes.length > 2 && '...'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{discount.minDays}天{discount.maxDays ? `-${discount.maxDays}天` : '+'}</span>
                        </div>
                        <div className="text-gray-500">
                          {getRestrictionText(discount.userRestrictions)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(discount.validFrom)}</div>
                        <div className="text-gray-500">至 {formatDate(discount.validTo)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(discount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{discount.usageCount}</div>
                        <div className="text-gray-500">
                          {discount.maxUsage === -1 ? '無限制' : `/${discount.maxUsage}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => onEdit(discount)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>編輯</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>刪除</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>確認刪除</AlertDialogTitle>
                              <AlertDialogDescription>
                                您確定要刪除折扣規則「{discount.name}」嗎？此操作無法復原。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(discount)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoDiscountList;
