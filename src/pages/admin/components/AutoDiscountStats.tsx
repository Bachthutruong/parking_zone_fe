import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tag,
  TrendingUp,
  Percent,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

interface AutoDiscountStatsProps {
  stats: {
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
  };
}

const AutoDiscountStats: React.FC<AutoDiscountStatsProps> = ({ stats }) => {
  const { overview, byType } = stats;


  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      percentage: '百分比折扣',
      fixed: '固定金額折扣'
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type: string) => {
    return type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'percentage' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Discounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總折扣規則</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalDiscounts}</div>
          <p className="text-xs text-muted-foreground">
            其中 {overview.activeDiscounts} 個啟用中
          </p>
        </CardContent>
      </Card>

      {/* Active Discounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">啟用中折扣</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{overview.activeDiscounts}</div>
          <p className="text-xs text-muted-foreground">
            活躍折扣規則
          </p>
        </CardContent>
      </Card>

      {/* Total Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總使用次數</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalUsage}</div>
          <p className="text-xs text-muted-foreground">
            所有折扣規則使用次數
          </p>
        </CardContent>
      </Card>

      {/* Average Priority */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均優先級</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.avgPriority.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            優先級越高越先應用
          </p>
        </CardContent>
      </Card>

      {/* Discount Types Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>折扣類型分布</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {byType.map((type) => (
              <div key={type._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(type._id)}
                  <div>
                    <p className="font-medium">{getTypeLabel(type._id)}</p>
                    <p className="text-sm text-gray-500">
                      使用 {type.totalUsage} 次
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getTypeColor(type._id)}>
                    {type.count} 個規則
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoDiscountStats;
