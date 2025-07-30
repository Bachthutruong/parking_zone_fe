import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  DollarSign,
  Car,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
//   Phone,
//   Mail,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
//   Info,
  Plus,
  Settings,
  BarChart3,
  Activity,
  Download,
//   Eye,
//   Filter,
  RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { toast } from 'react-hot-toast';
import { getDashboardStats, getBookingStats, getParkingTypeStats, getCurrentParkingStatus } from '@/services/admin';
import type { DashboardStats, BookingStats, ParkingTypeStats, CurrentParkingStatus } from '@/types';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

// Mock data for reports (將被實際API取代)
const revenueData = [
  { name: 'T1', revenue: 4000, bookings: 240 },
  { name: 'T2', revenue: 3000, bookings: 139 },
  { name: 'T3', revenue: 2000, bookings: 980 },
  { name: 'T4', revenue: 2780, bookings: 390 },
  { name: 'T5', revenue: 1890, bookings: 480 },
  { name: 'T6', revenue: 2390, bookings: 380 },
  { name: 'T7', revenue: 3490, bookings: 430 },
];

const bookingTrendsData = [
  { name: 'T1', confirmed: 240, cancelled: 24, pending: 12 },
  { name: 'T2', confirmed: 139, cancelled: 13, pending: 8 },
  { name: 'T3', confirmed: 980, cancelled: 98, pending: 45 },
  { name: 'T4', confirmed: 390, cancelled: 39, pending: 18 },
  { name: 'T5', confirmed: 480, cancelled: 48, pending: 22 },
  { name: 'T6', confirmed: 380, cancelled: 38, pending: 15 },
  { name: 'T7', confirmed: 430, cancelled: 43, pending: 20 },
];

const parkingTypeData = [
  { name: '室內', value: 400, color: '#3B82F6' },
  { name: '戶外', value: 300, color: '#10B981' },
  { name: '無障礙', value: 100, color: '#F59E0B' },
];

const topCustomers = [
  { name: '王小明', bookings: 45, totalSpent: 1250000, lastBooking: '2024-01-15' },
  { name: '李小華', bookings: 38, totalSpent: 980000, lastBooking: '2024-01-14' },
  { name: '張大偉', bookings: 32, totalSpent: 850000, lastBooking: '2024-01-13' },
  { name: '陳美玲', bookings: 28, totalSpent: 720000, lastBooking: '2024-01-12' },
  { name: '劉志強', bookings: 25, totalSpent: 650000, lastBooking: '2024-01-11' },
];

const peakHoursData = [
  { hour: '6:00', bookings: 12 },
  { hour: '7:00', bookings: 25 },
  { hour: '8:00', bookings: 45 },
  { hour: '9:00', bookings: 38 },
  { hour: '10:00', bookings: 32 },
  { hour: '11:00', bookings: 28 },
  { hour: '12:00', bookings: 55 },
  { hour: '13:00', bookings: 42 },
  { hour: '14:00', bookings: 35 },
  { hour: '15:00', bookings: 48 },
  { hour: '16:00', bookings: 62 },
  { hour: '17:00', bookings: 58 },
  { hour: '18:00', bookings: 45 },
  { hour: '19:00', bookings: 38 },
  { hour: '20:00', bookings: 25 },
  { hour: '21:00', bookings: 18 },
  { hour: '22:00', bookings: 12 },
  { hour: '23:00', bookings: 8 },
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  console.log(bookingStats);
  const [parkingStats, setParkingStats] = useState<ParkingTypeStats[]>([]);
  const [currentStatus, setCurrentStatus] = useState<CurrentParkingStatus | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, bookingStatsData, parkingStatsData, currentStatusData] = await Promise.all([
        getDashboardStats(),
        getBookingStats('today'),
        getParkingTypeStats(),
        getCurrentParkingStatus()
      ]);

      setStats(dashboardStats);
      setBookingStats(bookingStatsData);
      setParkingStats(parkingStatsData);
      setCurrentStatus(currentStatusData);
    } catch (error: any) {
      toast.error('無法載入儀表板資料');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    toast.success('報告匯出成功');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '等待確認', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '預約成功', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'checked-in': { label: '已進入停車場', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'checked-out': { label: '已離開停車場', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

//   const calculateGrowthRate = (current: number, previous: number) => {
//     if (previous === 0) return 100;
//     return ((current - previous) / previous) * 100;
//   };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Chuẩn hóa dữ liệu cho biểu đồ
//   const bookingStatusData = bookingStats
//     ? Object.entries(bookingStats.statusStats).map(([status, count]) => ({
//         status,
//         count,
//       }))
//     : [];

  const parkingPieData = parkingStats.map(lot => ({
    name: lot.name,
    value: lot.occupancyRate,
  }));

  // Giả lập dữ liệu doanh thu theo ngày (nếu backend chưa có)
//   const revenueLineData = (bookingStats && Array.isArray((bookingStats as any).revenueByDay))
//     ? (bookingStats as any).revenueByDay.map((item: any) => ({
//         date: item.date,
//         revenue: item.revenue,
//       }))
//     : [];

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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">儀表板</h1>
          <p className="text-gray-600">停車場系統概覽</p>
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7天</SelectItem>
              <SelectItem value="30d">30天</SelectItem>
              <SelectItem value="90d">90天</SelectItem>
              <SelectItem value="1y">1年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新整理
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            匯出報告
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日預約</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayBookings || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(8.2)}
              <span className="ml-1">比昨天增加8.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日營收</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(12.5)}
              <span className="ml-1">比昨天增加12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩餘空位</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.availableSpaces || 0}</div>
            <p className="text-xs text-muted-foreground">
              總共 {stats?.totalSpaces || 0} 個停車位
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正在停車</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.parkedVehicles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.leavingToday || 0} 輛車今天即將離開
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>營收趨勢</span>
            </CardTitle>
            <CardDescription>按時間的營收</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Parking Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>停車場使用率</span>
            </CardTitle>
            <CardDescription>各類型停車場的使用分布</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={parkingPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {parkingPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Chart */}
      <Card className="mb-8">
        <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>高峰時段</span>
            </CardTitle>
            <CardDescription>每日各時段的預約數量</CardDescription>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概覽</TabsTrigger>
          <TabsTrigger value="revenue">營收</TabsTrigger>
          <TabsTrigger value="bookings">預約</TabsTrigger>
          <TabsTrigger value="customers">客戶</TabsTrigger>
          <TabsTrigger value="parking">停車場</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>最近預約</span>
                  </CardTitle>
                  <CardDescription>
                    最新預約清單
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentBookings?.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{booking.driverName}</p>
                          <p className="text-sm text-gray-600">{booking.licensePlate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(booking.checkInTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>快速操作</span>
                  </CardTitle>
                  <CardDescription>
                    常用操作
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                                      <Button className="h-20 flex flex-col space-y-2">
                      <Plus className="h-6 w-6" />
                      <span>創建預約</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col space-y-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>報告</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col space-y-2">
                      <Users className="h-6 w-6" />
                      <span>管理客戶</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col space-y-2">
                      <Settings className="h-6 w-6" />
                      <span>設定</span>
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
                          <CardTitle>營收分析</CardTitle>
            <CardDescription>按時間的詳細營收</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="bookings" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">平均每日營收</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(516000)}</div>
                <p className="text-sm text-gray-500">比上個月增長12.5%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">最高營收</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(3490000)}</div>
                <p className="text-sm text-gray-500">2024年7月</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">增長率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">+15.2%</div>
                <p className="text-sm text-gray-500">與去年同期相比</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
                          <CardTitle>預約趨勢</CardTitle>
            <CardDescription>按狀態的預約統計</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={bookingTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="confirmed" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="cancelled" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">成功預約</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">2,679</div>
                <p className="text-sm text-gray-500">94.2% 總預約數</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">已取消預約</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">168</div>
                <p className="text-sm text-gray-500">5.8% 總預約數</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">等待確認</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">45</div>
                <p className="text-sm text-gray-500">1.6% 總預約數</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
                          <CardTitle>頂級客戶</CardTitle>
            <CardDescription>預約數量最高的前5名客戶</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{customer.name}</h4>
                        <p className="text-sm text-gray-500">
                          {customer.bookings} 預約 • {formatCurrency(customer.totalSpent)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">最後預約</p>
                      <p className="text-sm font-medium">{formatDate(customer.lastBooking)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                              <CardTitle>新客戶</CardTitle>
              <CardDescription>按月份的新客戶統計</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                              <CardTitle>客戶統計</CardTitle>
              <CardDescription>客戶概覽</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>總客戶數</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>本月新客戶</span>
                  <span className="font-semibold text-green-600">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>VIP客戶</span>
                  <span className="font-semibold text-purple-600">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>回訪率</span>
                  <span className="font-semibold text-blue-600">78.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Parking Tab */}
        <TabsContent value="parking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>停車場狀態</span>
                </CardTitle>
                <CardDescription>
                  各停車場狀況概覽
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parkingStats.map((lot) => (
                    <Card key={lot._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{lot.name}</h3>
                          <Badge variant={(lot.type || 'indoor') === 'indoor' ? 'default' : 'secondary'}>
                            {(lot.type || 'indoor') === 'indoor' ? '🏢 Trong nhà' : 
                             (lot.type || 'indoor') === 'outdoor' ? '🌤 Ngoài trời' : '♿️ Khuyết tật'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>空位:</span>
                            <span className="font-medium">{lot.availableSpaces}/{lot.totalSpaces}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>使用率:</span>
                            <span className="font-medium">{lot.occupancyRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>基本價格:</span>
                            <span className="font-medium">{formatCurrency(lot.pricePerDay)}/天</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#39653f] h-2 rounded-full" 
                              style={{ width: `${100 - lot.occupancyRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                            <CardTitle>停車場效能</CardTitle>
            <CardDescription>各類型停車場的使用率</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={parkingTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {parkingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Current Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Currently Parked Vehicles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>正在停車 ({currentStatus?.parkedVehicles?.length || 0})</span>
                </CardTitle>
                <CardDescription>
                  停車場內的車輛清單
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStatus?.parkedVehicles?.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{booking.driverName}</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{booking.licensePlate}</div>
                        <div>進入: {formatDateTime(booking.actualCheckInTime || booking.checkInTime)}</div>
                        <div>預計離開: {formatDateTime(booking.checkOutTime)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Arriving Today */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>即將到達 ({currentStatus?.arrivingToday?.length || 0})</span>
                </CardTitle>
                <CardDescription>
                  今天預計到達的車輛
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStatus?.arrivingToday?.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{booking.driverName}</span>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{booking.licensePlate}</div>
                        <div>預計: {formatDateTime(booking.estimatedArrivalTime || booking.checkInTime)}</div>
                        <div>航班: {booking.flightNumber || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leaving Today */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5" />
                  <span>即將離開 ({currentStatus?.leavingToday?.length || 0})</span>
                </CardTitle>
                <CardDescription>
                  今天預計離開的車輛
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStatus?.leavingToday?.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{booking.driverName}</span>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{booking.licensePlate}</div>
                        <div>預計離開: {formatDateTime(booking.checkOutTime)}</div>
                        <div>已停車: {formatDateTime(booking.actualCheckInTime || booking.checkInTime)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard; 