import React, { useState, useEffect } from 'react';
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
//   Mail,
//   Phone,
  Car,
    // Calendar,
    // Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
//   MoreHorizontal,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllUsers, updateUserVIP, updateUser, createUser, deleteUser } from '@/services/admin';
import type { User, Booking } from '@/types';

interface UserWithStats extends User {
  totalBookings: number;
  totalSpent: number;
  lastBooking?: string;
  recentBookings: Booking[];
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [vipFilter, setVipFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      // Transform data to include stats (this would come from backend in real app)
      const usersWithStats = data.users.map((user: User) => ({
        ...user,
        totalBookings: Math.floor(Math.random() * 50), // Mock data
        totalSpent: Math.floor(Math.random() * 10000), // Mock data
        lastBooking: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        recentBookings: [] // Mock data
      }));
      setUsers(usersWithStats);
    } catch (error: any) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVIP = async (userId: string, isVIP: boolean) => {
    try {
      await updateUserVIP(userId, isVIP);
      toast.success(`Đã ${isVIP ? 'cấp' : 'hủy'} quyền VIP cho người dùng`);
      loadUsers();
    } catch (error: any) {
      toast.error('Không thể cập nhật quyền VIP');
    }
  };

  const handleCreateUser = async () => {
    try {
      await createUser(formData);
      toast.success('Tạo người dùng thành công');
      setShowCreateDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error('Không thể tạo người dùng');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser._id, formData);
      toast.success('Cập nhật thông tin người dùng thành công');
      setShowEditDialog(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error('Không thể cập nhật thông tin người dùng');
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
      toast.error('Không thể xóa người dùng');
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'TWD'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      (user.licensePlate && user.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesVIP = vipFilter === 'all' || (vipFilter === 'vip' && user.isVIP) || (vipFilter === 'non-vip' && !user.isVIP);
    
    return matchesSearch && matchesRole && matchesVIP;
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
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-gray-600">Xem và quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <div className="flex space-x-2">
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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="roleFilter">Vai trò</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
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
              <Select value={vipFilter} onValueChange={setVipFilter}>
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
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Lọc
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
            Tổng cộng {filteredUsers.length} người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Thống kê</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-sm text-gray-600">{user.phone}</div>
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
                      <div>Đặt chỗ: {user.totalBookings}</div>
                      <div>Tổng chi: {formatCurrency(user.totalSpent)}</div>
                      <div>Tham gia: {formatDate(user.createdAt)}</div>
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleVIP(user._id, !user.isVIP)}
                      >
                        {user.isVIP ? 'Hủy VIP' : 'Cấp VIP'}
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(user)}
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
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Không tìm thấy người dùng</h3>
              <p className="text-gray-500">
                Không có người dùng nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.totalBookings}</div>
                    <div className="text-gray-500">Tổng đặt chỗ</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedUser.totalSpent)}</div>
                    <div className="text-gray-500">Tổng chi tiêu</div>
                  </div>
                </div>
              </div>

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