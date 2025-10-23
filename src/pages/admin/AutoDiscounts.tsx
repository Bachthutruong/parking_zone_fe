import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tag,
  Plus,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AutoDiscountList from './components/AutoDiscountList';
import AutoDiscountForm from './components/AutoDiscountForm';
import AutoDiscountStats from './components/AutoDiscountStats';
import { getAllAutoDiscounts, getAutoDiscountStats } from '@/services/autoDiscounts';

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

interface AutoDiscountStats {
  overview: {
    totalDiscounts: number;
    activeDiscounts: number;
    totalUsage: number;
    avgPriority: number;
  };
  byType: Array<{
    _id: string;
    count: number;
    totalUsage: number;
  }>;
}

const AutoDiscounts: React.FC = () => {
  const [autoDiscounts, setAutoDiscounts] = useState<AutoDiscount[]>([]);
  const [stats, setStats] = useState<AutoDiscountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<AutoDiscount | null>(null);

  const loadAutoDiscounts = async () => {
    try {
      setLoading(true);
      const response = await getAllAutoDiscounts({
        page: 1,
        limit: 100,
        search: searchTerm,
        isActive: filterStatus === 'all' ? undefined : filterStatus === 'active'
      });
      
      if (response.success) {
        setAutoDiscounts(response.data);
      } else {
        toast.error('載入自動折扣失敗');
      }
    } catch (error) {
      console.error('Error loading auto discounts:', error);
      toast.error('載入自動折扣時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getAutoDiscountStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadAutoDiscounts();
    loadStats();
  }, [searchTerm, filterStatus]);

  const handleCreateDiscount = () => {
    setEditingDiscount(null);
    setShowForm(true);
  };

  const handleEditDiscount = (discount: AutoDiscount) => {
    setEditingDiscount(discount as any);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDiscount(null);
  };

  const handleFormSubmit = () => {
    loadAutoDiscounts();
    loadStats();
    handleFormClose();
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">自動折扣管理</h1>
          <p className="text-gray-600 mt-2">管理停車場自動折扣規則</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadAutoDiscounts}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>刷新</span>
          </Button>
          <Button
            onClick={handleCreateDiscount}
            className="flex items-center space-x-2 bg-[#39653f] hover:bg-[#2d4f33]"
          >
            <Plus className="h-4 w-4" />
            <span>新增折扣</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <AutoDiscountStats stats={stats} />
      )}

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>折扣列表</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>分析報告</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <AutoDiscountList
            autoDiscounts={autoDiscounts}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onEdit={handleEditDiscount}
            onRefresh={loadAutoDiscounts}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>使用分析</span>
              </CardTitle>
              <CardDescription>
                查看自動折扣的使用情況和效果分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>分析功能開發中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      {showForm && (
        <AutoDiscountForm
          discount={editingDiscount}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default AutoDiscounts;
