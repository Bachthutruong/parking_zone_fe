import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar,
  Car,
  Clock,
//   User,
//   Phone,
//   Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTodayBookings } from '@/services/admin';

interface TodayBooking {
  _id: string;
  bookingNumber: string;
  driverName: string;
  phone: string;
  email: string;
  licensePlate: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  finalAmount: number;
  parkingType: {
    name: string;
    code: string;
  };
  user: {
    name: string;
    phone: string;
  };
}

interface TodaySummary {
  checkInsToday: TodayBooking[];
  checkOutsToday: TodayBooking[];
  overdueBookings: TodayBooking[];
  summary: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalOverdue: number;
  };
}

const AdminTodayOverview: React.FC = () => {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checkins' | 'checkouts' | 'overdue'>('checkins');

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const result = await getTodayBookings();
      setData(result);
    } catch (error: any) {
      console.error('Error loading today data:', error);
      toast.error('無法載入今日資料');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />預訂成功</Badge>;
      case 'checked-in':
        return <Badge variant="secondary"><Car className="h-3 w-3 mr-1" />已進入停車場</Badge>;
      case 'checked-out':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />已離開停車場</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">沒有資料</h3>
          <p className="text-gray-500">無法載入今日資料。</p>
        </div>
      </div>
    );
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'checkins':
        return data.checkInsToday;
      case 'checkouts':
        return data.checkOutsToday;
      case 'overdue':
        return data.overdueBookings;
      default:
        return data.checkInsToday;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">今日概覽</h1>
          <p className="text-gray-600">今日停車場進出車輛統計</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadTodayData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新整理
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            列印報告
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日進入車輛</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              Xe sẽ vào bãi đậu xe hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xe ra hôm nay</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalCheckOuts}</div>
            <p className="text-xs text-muted-foreground">
              Xe sẽ rời bãi đậu xe hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xe quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.totalOverdue}</div>
            <p className="text-xs text-muted-foreground">
              Xe đã quá thời gian đặt chỗ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết hôm nay</CardTitle>
          <CardDescription>
            Xem chi tiết các xe vào/ra bãi đậu xe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'checkins' ? 'default' : 'outline'}
              onClick={() => setActiveTab('checkins')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Xe vào ({data.summary.totalCheckIns})
            </Button>
            <Button
              variant={activeTab === 'checkouts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('checkouts')}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Xe ra ({data.summary.totalCheckOuts})
            </Button>
            <Button
              variant={activeTab === 'overdue' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overdue')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Quá hạn ({data.summary.totalOverdue})
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đặt chỗ</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Biển số xe</TableHead>
                <TableHead>Bãi đậu xe</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentData().map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>
                    <div className="font-medium">{booking.bookingNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.driverName}</div>
                      <div className="text-sm text-gray-600">{booking.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.licensePlate}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.parkingType.name}</div>
                      <div className="text-sm text-gray-600">{booking.parkingType.code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        <span className="font-medium">Vào:</span> {formatDateTime(booking.checkInTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Ra:</span> {formatDateTime(booking.checkOutTime)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-green-600">
                      {formatCurrency(booking.finalAmount)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {getCurrentData().length === 0 && (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {activeTab === 'checkins' && 'Không có xe vào hôm nay'}
                {activeTab === 'checkouts' && 'Không có xe ra hôm nay'}
                {activeTab === 'overdue' && 'Không có xe quá hạn'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'checkins' && 'Chưa có xe nào đặt chỗ vào hôm nay.'}
                {activeTab === 'checkouts' && 'Chưa có xe nào đặt chỗ ra hôm nay.'}
                {activeTab === 'overdue' && 'Tất cả xe đều đúng thời gian.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminTodayOverview; 