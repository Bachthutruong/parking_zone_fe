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
  }, [currentPage, filters.search, filters.role, filters.vipStatus, filters.isActive]);

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
        page: currentPage,
        limit: 10
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
      
      setUsers(usersWithStats);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
      
      // Update stats
      setStats({
        totalUsers: data.total || 0,
        vipUsers: usersWithStats.filter(u => u.isVIP).length,
        activeUsers: usersWithStats.filter(u => u.isActive).length,
        newUsersThisMonth: Math.floor(Math.random() * 20)
      });
    } catch (error: any) {
      toast.error('Không thể tải danh sách người dùng');
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
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      await createUser(formData);
      toast.success('Tạo người dùng thành công');
      setShowCreateDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo người dùng');
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

      toast.success('Cập nhật thông tin người dùng thành công');
      setShowEditDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin người dùng');
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser._id);
      toast.success('Xóa người dùng thành công');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
      console.error('Error deleting user:', error);
    }
  };

  const handleVIPUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      // Validate VIP discount if user is VIP
      if (vipFormData.isVIP && (vipFormData.vipDiscount < 0 || vipFormData.vipDiscount > 100)) {
        toast.error('Giảm giá VIP phải từ 0% đến 100%');
        return;
      }
      
      // Only pass vipDiscount if user is VIP
      const vipDiscount = vipFormData.isVIP ? vipFormData.vipDiscount : undefined;
      await updateUserVIP(selectedUser._id, vipFormData.isVIP, vipDiscount);
      toast.success('Cập nhật thông tin VIP thành công');
      setShowVIPDialog(false);
      loadUsers();
    } catch (error: any) {
      toast.error('Không thể cập nhật thông tin VIP');
      console.error('Error updating VIP:', error);
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
      admin: { label: 'Quản trị viên', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      staff: { label: 'Nhân viên', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      user: { label: 'Khách hàng', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Hoạt động
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Tạm khóa
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
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDuration = (days: number) => {
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours} giờ`;
    }
    return `${Math.round(days)} ngày`;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      'checked-in': { label: 'Đã vào bãi', color: 'bg-green-100 text-green-800' },
      'checked-out': { label: 'Đã rời bãi', color: 'bg-gray-100 text-gray-800' },
      'cancelled': { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
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

  const handleExportUsers = () => {
    // In a real app, this would call an API to export users
    toast.success('Xuất dữ liệu thành công');
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
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-gray-600">Xem và quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
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
                <p className="text-sm font-medium text-gray-600">Người dùng VIP</p>
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
                <p className="text-sm font-medium text-gray-600">Người dùng hoạt động</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Người dùng mới (tháng)</p>
                <p className="text-2xl font-bold">{stats.newUsersThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                {searching ? (
                  <div className="absolute left-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                )}
                <Input
                  id="search"
                  placeholder="Tên, email, số điện thoại..."
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onCompositionEnd={(e) => handleSearchChange(e.currentTarget.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="roleFilter">Vai trò</Label>
              <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="user">Khách hàng</SelectItem>
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
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="non-vip">Không VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statusFilter">Trạng thái</Label>
              <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm khóa</SelectItem>
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
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Tổng cộng {totalUsers} người dùng • Trang {currentPage} / {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin</TableHead>
                <TableHead>Vai trò & VIP</TableHead>
                <TableHead>Thống kê</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          VIP {user.vipDiscount}%
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Đặt chỗ:</span>
                        <span className="font-medium">{user.stats?.totalBookings || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tổng chi:</span>
                        <span className="font-medium">{formatCurrency(user.stats?.totalSpent || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Trung bình:</span>
                        <span className="font-medium">{formatCurrency(user.stats?.averageSpent || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Xu hướng:</span>
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
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openVIPDialog(user)}
                        title="Quản lý VIP"
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(user)}
                          title="Xóa người dùng"
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
          {users.length === 0 && (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Không tìm thấy người dùng</h3>
              <p className="text-gray-500">
                Không có người dùng nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Hiển thị {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalUsers)} của {totalUsers} người dùng
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về người dùng
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Thông tin cơ bản
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div><strong>Tên:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>Điện thoại:</strong> {selectedUser.phone}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Vai trò:</strong> {getRoleBadge(selectedUser.role)}</div>
                    <div><strong>Trạng thái:</strong> {getStatusBadge(selectedUser.isActive)}</div>
                    <div><strong>Tham gia:</strong> {formatDate(selectedUser.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {selectedUser.licensePlate && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Thông tin xe
                  </h4>
                  <div className="text-sm">
                    <div><strong>Biển số xe:</strong> {selectedUser.licensePlate}</div>
                    {selectedUser.address && (
                      <div><strong>Địa chỉ:</strong> {selectedUser.address}</div>
                    )}
                  </div>
                </div>
              )}

              {/* VIP Information */}
              {selectedUser.isVIP && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Crown className="h-4 w-4 mr-2" />
                    Thông tin VIP
                  </h4>
                  <div className="text-sm">
                    <div><strong>Giảm giá VIP:</strong> {selectedUser.vipDiscount}%</div>
                    <div><strong>Ngày cấp VIP:</strong> {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Thống kê
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.stats?.totalBookings || 0}</div>
                    <div className="text-gray-500">Tổng đặt chỗ</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedUser.stats?.totalSpent || 0)}</div>
                    <div className="text-gray-500">Tổng chi tiêu</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(selectedUser.stats?.averageSpent || 0)}</div>
                    <div className="text-gray-500">Trung bình/đặt chỗ</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">{getTrendIcon(selectedUser.stats?.bookingTrend || 'stable')}</div>
                    <div className="text-gray-500">Xu hướng</div>
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xl font-bold text-blue-600">{selectedUser.stats?.completedBookings || 0}</div>
                    <div className="text-gray-500">Hoàn thành</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-xl font-bold text-yellow-600">{selectedUser.stats?.pendingBookings || 0}</div>
                    <div className="text-gray-500">Chờ xác nhận</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xl font-bold text-red-600">{selectedUser.stats?.cancelledBookings || 0}</div>
                    <div className="text-gray-500">Đã hủy</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xl font-bold text-green-600">{formatDuration(selectedUser.stats?.averageDuration || 0)}</div>
                    <div className="text-gray-500">Thời gian TB</div>
                  </div>
                </div>

                {/* VIP Savings */}
                {selectedUser.stats?.totalVipSavings && selectedUser.stats.totalVipSavings > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="font-medium">Tiết kiệm VIP</span>
                      </div>
                      <div className="text-xl font-bold text-yellow-600">
                        {formatCurrency(selectedUser.stats.totalVipSavings)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Từ {selectedUser.stats?.vipBookingsCount || 0} đặt chỗ VIP
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Bookings */}
              {selectedUser.stats?.recentBookings && selectedUser.stats.recentBookings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Đặt chỗ gần đây
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
                    Ghi chú
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
              Đóng
            </Button>
            <Button onClick={() => {
              setShowUserDetails(false);
              if (selectedUser) openEditDialog(selectedUser);
            }}>
              Chỉnh sửa
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
            <DialogTitle>{isEditing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật thông tin người dùng' : 'Tạo người dùng mới trong hệ thống'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên *</Label>
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
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">Vai trò *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'user' | 'staff' | 'admin' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Khách hàng</SelectItem>
                    <SelectItem value="staff">Nhân viên</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isEditing && (
              <div>
                <Label htmlFor="password">Mật khẩu {!isEditing && '*'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={isEditing ? 'Để trống nếu không thay đổi' : 'Nhập mật khẩu'}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licensePlate">Biển số xe</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Địa chỉ</Label>
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
                <Label htmlFor="isVIP">Người dùng VIP</Label>
              </div>
              
              {formData.isVIP && (
                <div>
                  <Label htmlFor="vipDiscount">Giảm giá VIP (%)</Label>
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
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Ghi chú về người dùng..."
              />
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
            <Button onClick={isEditing ? handleUpdateUser : handleCreateUser}>
              {isEditing ? 'Cập nhật' : 'Tạo người dùng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIP Management Dialog */}
      <Dialog open={showVIPDialog} onOpenChange={setShowVIPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quản lý VIP</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin VIP cho người dùng
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
              <Label htmlFor="vipStatus">Người dùng VIP</Label>
            </div>
            
            {vipFormData.isVIP && (
              <div>
                <Label htmlFor="vipDiscountAmount">Giảm giá VIP (%)</Label>
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
              Hủy
            </Button>
            <Button onClick={handleVIPUpdate}>
              Cập nhật VIP
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
              Bạn có chắc chắn muốn xóa người dùng "{selectedUser?.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers; 