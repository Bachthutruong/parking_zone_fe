import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Crown,
  User as UserIcon,
  Car,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Phone,
  Calendar,
  // DollarSign,
  TrendingUp,
  TrendingDown,
  // Clock,
  // CreditCard,
  Percent
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllUsers, updateUserVIP, updateUser, createUser, deleteUser, getUserStats } from '@/services/admin';
import type { User, Booking } from '@/types';

interface UserStats {
  totalBookings: number;
  totalSpent: number;
  averageSpent: number;
  lastBooking?: string;
  bookingTrend: 'up' | 'down' | 'stable';
  recentBookings: Booking[];
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  averageDuration: number;
  totalVipSavings: number;
  vipBookingsCount: number;
}

interface UserWithStats extends User {
  stats?: UserStats;
}

interface UserFilters {
  search: string;
  role: string;
  vipStatus: string;
  isActive: string;
  dateFrom?: string;
  dateTo?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  console.log(isTyping,'isTyping');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    vipStatus: 'all',
    isActive: 'all'
  });
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVIPDialog, setShowVIPDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'vip' | 'non-vip'>('all');
  console.log(activeTab,'activeTab');
  const [stats, setStats] = useState({
    totalUsers: 0,
    vipUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'user' | 'staff' | 'admin',
    licensePlate: '',
    address: '',
    isVIP: false,
    vipDiscount: 10,
    notes: ''
  });
  const [vipFormData, setVipFormData] = useState({
    isVIP: false,
    vipDiscount: 10
  });

  useEffect(() => {
    loadUsers();
  }, [filters.search, filters.role, filters.vipStatus, filters.isActive]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 1000 // Load all users at once
      };

      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.role !== 'all') {
        params.role = filters.role;
      }
      if (filters.vipStatus !== 'all') {
        params.isVIP = filters.vipStatus === 'vip';
      }
      if (filters.isActive !== 'all') {
        params.isActive = filters.isActive === 'active';
      }

      const data = await getAllUsers(params);
      
      // Load stats for each user
      const usersWithStats = await Promise.all(
        data.users.map(async (user: User) => {
          try {
            const statsData = await getUserStats(user._id);
            return {
              ...user,
              stats: statsData.stats
            };
          } catch (error) {
            console.error(`Error loading stats for user ${user._id}:`, error);
            return {
              ...user,
              stats: {
                totalBookings: 0,
                totalSpent: 0,
                averageSpent: 0,
                bookingTrend: 'stable' as const,
                recentBookings: [],
                completedBookings: 0,
                cancelledBookings: 0,
                pendingBookings: 0,
                confirmedBookings: 0,
                averageDuration: 0,
                totalVipSavings: 0,
                vipBookingsCount: 0
              }
            };
          }
        })
      );
      
      setAllUsers(usersWithStats);
      setUsers(usersWithStats);
      setTotalUsers(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 10));
      
      // Update stats
      setStats({
        totalUsers: data.total || 0,
        vipUsers: usersWithStats.filter(u => u.isVIP).length,
        activeUsers: usersWithStats.filter(u => u.isActive).length,
        newUsersThisMonth: Math.floor(Math.random() * 20)
      });
    } catch (error: any) {
      toast.error('無法載入用戶列表');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleToggleVIP = async (userId: string, isVIP: boolean, vipDiscount?: number) => {
  //   try {
  //     await updateUserVIP(userId, isVIP, vipDiscount);
  //     toast.success(`Đã ${isVIP ? 'cấp' : 'hủy'} quyền VIP cho người dùng`);
  //     loadUsers();
  //   } catch (error: any) {
  //     toast.error('Không thể cập nhật quyền VIP');
  //     console.error('Error updating VIP:', error);
  //   }
  // };

  const handleCreateUser = async () => {
    try {
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error('請填寫所有必填信息');
        return;
      }

      await createUser(formData);
      toast.success('創建用戶成功');
      setShowCreateDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '無法創建用戶');
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        const { password, ...dataWithoutPassword } = updateData;
        await updateUser(selectedUser._id, dataWithoutPassword);
      } else {
        await updateUser(selectedUser._id, updateData);
      }

      toast.success('更新用戶信息成功');
      setShowEditDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '無法更新用戶信息');
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser._id);
      toast.success('刪除用戶成功');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '無法刪除用戶');
      console.error('Error deleting user:', error);
    }
  };

  const handleVIPUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      // Validate VIP discount if user is VIP
      if (vipFormData.isVIP && (vipFormData.vipDiscount < 0 || vipFormData.vipDiscount > 100)) {
        toast.error('VIP折扣必須在0%到100%之間');
        return;
      }
      
      // Only pass vipDiscount if user is VIP
      const vipDiscount = vipFormData.isVIP ? vipFormData.vipDiscount : undefined;
      await updateUserVIP(selectedUser._id, vipFormData.isVIP, vipDiscount);
      toast.success('更新VIP信息成功');
      setShowVIPDialog(false);
      loadUsers();
    } catch (error: any) {
      toast.error('無法更新VIP信息');
      console.error('Error updating VIP:', error);
    }
  };

  const handleGenerateVIPCode = async (userId: string) => {
    try {
      // Update user to VIP with current discount to trigger VIP code generation
      const user = users.find(u => u._id === userId);
      if (!user) return;
      
      await updateUserVIP(userId, true, user.vipDiscount);
      toast.success('創建VIP碼成功');
      loadUsers();
    } catch (error: any) {
      toast.error('無法創建VIP碼');
      console.error('Error generating VIP code:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
      licensePlate: '',
      address: '',
      isVIP: false,
      vipDiscount: 10,
      notes: ''
    });
    setIsEditing(false);
    setSelectedUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (user: UserWithStats) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role,
      licensePlate: user.licensePlate || '',
      address: user.address || '',
      isVIP: user.isVIP,
      vipDiscount: user.vipDiscount,
      notes: user.notes || ''
    });
    setIsEditing(true);
    setShowEditDialog(true);
  };

  const openVIPDialog = (user: UserWithStats) => {
    setSelectedUser(user);
    setVipFormData({
      isVIP: user.isVIP,
      vipDiscount: user.vipDiscount
    });
    setShowVIPDialog(true);
  };

  const openDeleteDialog = (user: UserWithStats) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openUserDetails = (user: UserWithStats) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: '管理員', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      staff: { label: '員工', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      user: { label: '客戶', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        活動
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        暫時鎖定
      </Badge>
    );
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const formatDuration = (days: number) => {
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours} 小時`;
    }
    return `${Math.round(days)} 天`;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: '等待確認', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: '預訂成功', color: 'bg-blue-100 text-blue-800' },
      'checked-in': { label: '已進入停車場', color: 'bg-green-100 text-green-800' },
      'checked-out': { label: '已離開停車場', color: 'bg-gray-100 text-gray-800' },
      'cancelled': { label: '已取消', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Only reset page for non-search filters
    if (key !== 'search') {
      setCurrentPage(1);
    }
  };

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setIsTyping(true);
    
    // Show searching indicator
    setSearching(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setCurrentPage(1);
      setSearching(false);
      setIsTyping(false);
    }, 500);
  }, []);

  const getPaginatedUsers = (userList: UserWithStats[], page: number, pageSize: number = 10) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return userList.slice(startIndex, endIndex);
  };

  const getFilteredUsers = (userList: UserWithStats[], filterType: 'all' | 'vip' | 'non-vip') => {
    switch (filterType) {
      case 'vip':
        return userList.filter(user => user.isVIP);
      case 'non-vip':
        return userList.filter(user => !user.isVIP);
      default:
        return userList;
    }
  };

  const handleExportUsers = () => {
    // In a real app, this would call an API to export users
    toast.success('導出數據成功');
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">用戶管理</h1>
          <p className="text-gray-600">查看和管理系統中的所有用戶</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            導出數據
          </Button>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            添加用戶
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總用戶</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VIP用戶</p>
                <p className="text-2xl font-bold">{stats.vipUsers}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">非VIP用戶</p>
                <p className="text-2xl font-bold">{stats.totalUsers - stats.vipUsers}</p>
              </div>
              <UserIcon className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活動用戶</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            過濾器
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                {searching ? (
                  <div className="absolute left-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                )}
                <Input
                  id="search"
                  placeholder="姓名, 電子郵件, 電話號碼..."
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onCompositionEnd={(e) => handleSearchChange(e.currentTarget.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="roleFilter">角色</Label>
              <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有角色</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                  <SelectItem value="staff">員工</SelectItem>
                  <SelectItem value="user">客戶</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
                <Label htmlFor="vipFilter">VIP</Label>
              <Select value={filters.vipStatus} onValueChange={(value) => handleFilterChange('vipStatus', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="non-vip">非VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statusFilter">狀態</Label>
              <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有</SelectItem>
                  <SelectItem value="active">活動</SelectItem>
                  <SelectItem value="inactive">暫時鎖定</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => {
                setSearchValue('');
                setSearching(false);
                setIsTyping(false);
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                setFilters({
                  search: '',
                  role: 'all',
                  vipStatus: 'all',
                  isActive: 'all'
                });
                setCurrentPage(1);
              }}>
                <Filter className="h-4 w-4 mr-2" />
                清除過濾器
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>用戶列表</CardTitle>
          <CardDescription>
            總共 {totalUsers} 用戶 • VIP: {stats.vipUsers} • 非VIP: {stats.totalUsers - stats.vipUsers} • 第 {currentPage} 頁 / {totalPages} 頁
          </CardDescription>
        </CardHeader>
        <CardContent>
                     <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
             setActiveTab(value as 'all' | 'vip' | 'non-vip');
             setCurrentPage(1); // Reset to first page when switching tabs
           }}>
             <TabsList className="grid w-full grid-cols-3">
               <TabsTrigger value="all">所有用戶</TabsTrigger>
               <TabsTrigger value="vip">VIP用戶</TabsTrigger>
               <TabsTrigger value="non-vip">非VIP用戶</TabsTrigger>
             </TabsList>
            <TabsContent value="all">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>信息</TableHead>
                    <TableHead>角色 & VIP</TableHead>
                    <TableHead>統計</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                                 <TableBody>
                   {getPaginatedUsers(getFilteredUsers(allUsers, 'all'), currentPage).map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                            {user.licensePlate && (
                              <div className="text-sm text-gray-600 flex items-center">
                                <Car className="h-3 w-3 mr-1" />
                                {user.licensePlate}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getRoleBadge(user.role)}
                          {user.isVIP && (
                            <div className="space-y-1">
                              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                VIP {user.vipDiscount}%
                              </Badge>
                              {user.vipCode ? (
                                <div className="text-xs">
                                  <code className="bg-yellow-50 px-1 py-0.5 rounded text-yellow-700 font-mono">
                                    {user.vipCode}
                                  </code>
                                </div>
                              ) : (
                                <div className="text-xs text-red-600">
                                  ⚠️ 尚未有VIP碼
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span>預訂:</span>
                            <span className="font-medium">{user.stats?.totalBookings || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>總支出:</span>
                            <span className="font-medium">{formatCurrency(user.stats?.totalSpent || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>平均:</span>  
                            <span className="font-medium">{formatCurrency(user.stats?.averageSpent || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>趨勢:</span>  
                            {getTrendIcon(user.stats?.bookingTrend || 'stable')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.isActive)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUserDetails(user)}
                            title="查看詳細信息"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                            title="編輯"   
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openVIPDialog(user)}
                            title="管理VIP"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                          {user.isVIP && !user.vipCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateVIPCode(user._id)}
                              title="創建VIP碼"  
                              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(user)}
                              title="刪除用戶"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

                             {/* No Results */}
               {getFilteredUsers(allUsers, 'all').length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">找不到用戶</h3>
                  <p className="text-gray-500">
                    找不到任何用戶符合當前過濾器。
                  </p>
                </div>
              )}

                             {/* Pagination */}
               {Math.ceil(getFilteredUsers(allUsers, 'non-vip').length / 10) > 1 && (
                 <div className="flex items-center justify-between mt-6">
                   <div className="text-sm text-gray-600">
                     顯示 {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, getFilteredUsers(allUsers, 'non-vip').length)} 的 {getFilteredUsers(allUsers, 'non-vip').length} 用戶
                   </div>
                   <div className="flex items-center space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                       disabled={currentPage === 1}
                     >
                       <ChevronLeft className="h-4 w-4" />
                       上一頁
                     </Button>
                     <div className="flex items-center space-x-1">
                       {Array.from({ length: Math.min(5, Math.ceil(getFilteredUsers(allUsers, 'non-vip').length / 10)) }, (_, i) => {
                         const page = i + 1;
                         return (
                           <Button
                             key={page}
                             variant={currentPage === page ? "default" : "outline"}
                             size="sm"
                             onClick={() => setCurrentPage(page)}
                           >
                             {page}
                           </Button>
                         );
                       })}
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.min(Math.ceil(getFilteredUsers(allUsers, 'non-vip').length / 10), prev + 1))}
                       disabled={currentPage === Math.ceil(getFilteredUsers(allUsers, 'non-vip').length / 10)}
                     >
                       下一頁
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               )}
            </TabsContent>
            <TabsContent value="vip">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>信息</TableHead>
                    <TableHead>角色 & VIP</TableHead>
                    <TableHead>統計</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                                 <TableBody>
                   {getPaginatedUsers(getFilteredUsers(allUsers, 'vip'), currentPage).map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                            {user.licensePlate && (
                              <div className="text-sm text-gray-600 flex items-center">
                                <Car className="h-3 w-3 mr-1" />
                                {user.licensePlate}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getRoleBadge(user.role)}
                          {user.isVIP && (
                            <div className="space-y-1">
                              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                VIP {user.vipDiscount}%
                              </Badge>
                              {user.vipCode ? (
                                <div className="text-xs">
                                  <code className="bg-yellow-50 px-1 py-0.5 rounded text-yellow-700 font-mono">
                                    {user.vipCode}
                                  </code>
                                </div>
                              ) : (
                                <div className="text-xs text-red-600">
                                  ⚠️ 尚未有VIP碼
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span>預訂:</span>
                            <span className="font-medium">{user.stats?.totalBookings || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>總支出:</span>
                            <span className="font-medium">{formatCurrency(user.stats?.totalSpent || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>平均:</span>  
                            <span className="font-medium">{formatCurrency(user.stats?.averageSpent || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>趨勢:</span>  
                            {getTrendIcon(user.stats?.bookingTrend || 'stable')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.isActive)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUserDetails(user)}
                            title="查看詳細信息"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                            title="編輯"   
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openVIPDialog(user)}
                            title="管理VIP"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                          {user.isVIP && !user.vipCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateVIPCode(user._id)}
                              title="創建VIP碼"  
                              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(user)}
                              title="刪除用戶"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

                             {/* No Results */}
               {getFilteredUsers(allUsers, 'vip').length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">找不到VIP用戶</h3>
                  <p className="text-gray-500">
                    找不到任何VIP用戶符合當前過濾器。
                  </p>
                </div>
              )}

              {/* Pagination */}
              {Math.ceil(getFilteredUsers(allUsers, 'vip').length / 10) > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    顯示 {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, getFilteredUsers(allUsers, 'vip').length)} 的 {getFilteredUsers(allUsers, 'vip').length} 用戶
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一頁
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, Math.ceil(getFilteredUsers(allUsers, 'vip').length / 10)) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(getFilteredUsers(allUsers, 'vip').length / 10), prev + 1))}
                      disabled={currentPage === Math.ceil(getFilteredUsers(allUsers, 'vip').length / 10)}
                    >
                      下一頁
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                             )}
             </TabsContent>
             <TabsContent value="non-vip">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>信息</TableHead>
                     <TableHead>角色 & VIP</TableHead>
                     <TableHead>統計</TableHead>
                     <TableHead>狀態</TableHead>
                     <TableHead>操作</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {getPaginatedUsers(getFilteredUsers(allUsers, 'non-vip'), currentPage).map((user) => (
                     <TableRow key={user._id}>
                       <TableCell>
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                             <UserIcon className="h-5 w-5 text-blue-600" />
                           </div>
                           <div>
                             <div className="font-medium">{user.name}</div>
                             <div className="text-sm text-gray-600 flex items-center">
                               <Mail className="h-3 w-3 mr-1" />
                               {user.email}
                             </div>
                             <div className="text-sm text-gray-600 flex items-center">
                               <Phone className="h-3 w-3 mr-1" />
                               {user.phone}
                             </div>
                             {user.licensePlate && (
                               <div className="text-sm text-gray-600 flex items-center">
                                 <Car className="h-3 w-3 mr-1" />
                                 {user.licensePlate}
                               </div>
                             )}
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="space-y-2">
                           {getRoleBadge(user.role)}
                           <div className="text-xs text-gray-500">
                             非VIP用戶
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="space-y-1 text-sm">
                           <div className="flex items-center justify-between">
                             <span>預訂:</span>
                             <span className="font-medium">{user.stats?.totalBookings || 0}</span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span>總支出:</span>
                             <span className="font-medium">{formatCurrency(user.stats?.totalSpent || 0)}</span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span>平均:</span>  
                             <span className="font-medium">{formatCurrency(user.stats?.averageSpent || 0)}</span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span>趨勢:</span>  
                             {getTrendIcon(user.stats?.bookingTrend || 'stable')}
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         {getStatusBadge(user.isActive)}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => openUserDetails(user)}
                             title="查看詳細信息"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => openEditDialog(user)}
                             title="編輯"   
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => openVIPDialog(user)}
                             title="管理VIP"
                           >
                             <Crown className="h-4 w-4" />
                           </Button>
                           {user.role !== 'admin' && (
                             <Button
                               size="sm"
                               variant="destructive"
                               onClick={() => openDeleteDialog(user)}
                               title="刪除用戶"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>

               {/* No Results */}
               {getFilteredUsers(allUsers, 'non-vip').length === 0 && (
                 <div className="p-8 text-center">
                   <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-gray-600 mb-2">找不到非VIP用戶</h3>
                   <p className="text-gray-500">
                     找不到任何非VIP用戶符合當前過濾器。
                   </p>
                 </div>
               )}

               {/* Pagination */}
               {Math.ceil(getFilteredUsers(allUsers, 'all').length / 10) > 1 && (
                 <div className="flex items-center justify-between mt-6">
                   <div className="text-sm text-gray-600">
                     顯示 {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, getFilteredUsers(allUsers, 'all').length)} 的 {getFilteredUsers(allUsers, 'all').length} 用戶
                   </div>
                   <div className="flex items-center space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                       disabled={currentPage === 1}
                     >
                       <ChevronLeft className="h-4 w-4" />
                       上一頁
                     </Button>
                     <div className="flex items-center space-x-1">
                       {Array.from({ length: Math.min(5, Math.ceil(getFilteredUsers(allUsers, 'all').length / 10)) }, (_, i) => {
                         const page = i + 1;
                         return (
                           <Button
                             key={page}
                             variant={currentPage === page ? "default" : "outline"}
                             size="sm"
                             onClick={() => setCurrentPage(page)}
                           >
                             {page}
                           </Button>
                         );
                       })}
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.min(Math.ceil(getFilteredUsers(allUsers, 'all').length / 10), prev + 1))}
                       disabled={currentPage === Math.ceil(getFilteredUsers(allUsers, 'all').length / 10)}
                     >
                       下一頁
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               )}
             </TabsContent>
           </Tabs>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用戶詳細信息</DialogTitle> 
            <DialogDescription>
              用戶詳細信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  基本信息
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><strong>姓名:</strong> {selectedUser.name}</div>    
                    <div><strong>電子郵件:</strong> {selectedUser.email}</div>
                    <div><strong>電話號碼:</strong> {selectedUser.phone}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>角色:</strong> {getRoleBadge(selectedUser.role)}</div>  
                    <div><strong>狀態:</strong> {getStatusBadge(selectedUser.isActive)}</div>
                    <div><strong>加入:</strong> {formatDate(selectedUser.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {selectedUser.licensePlate && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    車輛信息
                  </h4>
                  <div className="text-sm">
                    <div><strong>車牌號碼:</strong> {selectedUser.licensePlate}</div>
                    {selectedUser.address && (
                      <div><strong>地址:</strong> {selectedUser.address}</div>
                    )}
                  </div>
                </div>
              )}

              {/* VIP Information */}
              {selectedUser.isVIP && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Crown className="h-4 w-4 mr-2" />
                    VIP信息
                  </h4>
                  <div className="text-sm">
                    <div><strong>VIP折扣:</strong> {selectedUser.vipDiscount}%</div>
                    <div><strong>VIP碼:</strong> <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-800 font-mono">{selectedUser.vipCode || 'N/A'}</code></div>
                    <div><strong>VIP創建日期:</strong> {selectedUser.vipCreatedAt ? formatDate(selectedUser.vipCreatedAt) : 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  統計
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.stats?.totalBookings || 0}</div>
                    <div className="text-gray-500">總預訂</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedUser.stats?.totalSpent || 0)}</div>
                    <div className="text-gray-500">總支出</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(selectedUser.stats?.averageSpent || 0)}</div>
                    <div className="text-gray-500">平均/預訂</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">{getTrendIcon(selectedUser.stats?.bookingTrend || 'stable')}</div>
                    <div className="text-gray-500">趨勢</div>
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xl font-bold text-blue-600">{selectedUser.stats?.completedBookings || 0}</div>
                    <div className="text-gray-500">完成</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-xl font-bold text-yellow-600">{selectedUser.stats?.pendingBookings || 0}</div>
                    <div className="text-gray-500">等待確認</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xl font-bold text-red-600">{selectedUser.stats?.cancelledBookings || 0}</div>
                    <div className="text-gray-500">已取消</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xl font-bold text-green-600">{formatDuration(selectedUser.stats?.averageDuration || 0)}</div>
                    <div className="text-gray-500">平均時間</div>
                  </div>
                </div>

                {/* VIP Savings */}
                {selectedUser.stats?.totalVipSavings && selectedUser.stats.totalVipSavings > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="font-medium">VIP節省</span>
                      </div>
                      <div className="text-xl font-bold text-yellow-600">
                        {formatCurrency(selectedUser.stats.totalVipSavings)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      從 {selectedUser.stats?.vipBookingsCount || 0} 預訂VIP
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Bookings */}
              {selectedUser.stats?.recentBookings && selectedUser.stats.recentBookings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    最近預訂
                  </h4>
                  <div className="space-y-2">
                    {selectedUser.stats.recentBookings.map((booking) => (
                      <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <div className="font-medium">{booking.driverName}</div>
                            <div className="text-gray-600">{booking.licensePlate}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getBookingStatusBadge(booking.status)}
                          <div className="text-sm font-medium">
                            {formatCurrency(booking.finalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedUser.notes && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    備註
                  </h4>
                  <div className="text-sm p-3 bg-yellow-50 rounded">
                    {selectedUser.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetails(false)}>
              關閉
            </Button>
            <Button onClick={() => {
              setShowUserDetails(false);
              if (selectedUser) openEditDialog(selectedUser);
            }}>
              編輯
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit User Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? '編輯用戶' : '添加新用戶'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '更新用戶信息' : '在系統中創建新用戶'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">電話號碼 *</Label> 
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">角色 *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'user' | 'staff' | 'admin' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">客戶</SelectItem>
                    <SelectItem value="staff">員工</SelectItem>
                    <SelectItem value="admin">管理員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isEditing && (
              <div>
                <Label htmlFor="password">密碼 {!isEditing && '*'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={isEditing ? '留空如果不想更改' : '輸入密碼'}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licensePlate">車牌號碼</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isVIP"
                  checked={formData.isVIP}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVIP: checked }))}
                />
                <Label htmlFor="isVIP">VIP用戶</Label>
              </div>
              
              {formData.isVIP && (
                <div>
                  <Label htmlFor="vipDiscount">VIP折扣 (%)</Label>
                  <Input
                    id="vipDiscount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.vipDiscount}
                    onChange={(e) => setFormData(prev => ({ ...prev, vipDiscount: parseInt(e.target.value) }))}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="關於用戶的備註..."
              />
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
            <Button onClick={isEditing ? handleUpdateUser : handleCreateUser}>
              {isEditing ? '更新' : '創建用戶'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIP Management Dialog */}
      <Dialog open={showVIPDialog} onOpenChange={setShowVIPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理VIP</DialogTitle>
            <DialogDescription>
              更新用戶的VIP信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="vipStatus"
                checked={vipFormData.isVIP}
                onCheckedChange={(checked) => setVipFormData(prev => ({ 
                  ...prev, 
                  isVIP: checked,
                  // Reset vipDiscount to 0 when VIP is disabled
                  vipDiscount: checked ? prev.vipDiscount : 0
                }))}
              />
              <Label htmlFor="vipStatus">VIP用戶</Label>
            </div>
            
            {vipFormData.isVIP && (
              <div>
                <Label htmlFor="vipDiscountAmount">VIP折扣 (%)</Label>
                <Input
                  id="vipDiscountAmount"
                  type="number"
                  min="0"
                  max="100"
                  value={vipFormData.vipDiscount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setVipFormData(prev => ({ 
                      ...prev, 
                      vipDiscount: isNaN(value) ? 0 : Math.max(0, Math.min(100, value))
                    }));
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVIPDialog(false)}>
              取消
            </Button>
            <Button onClick={handleVIPUpdate}>
              更新VIP
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
              您確定要刪除用戶 "{selectedUser?.name}"? 此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers; 