import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  Building2,
  Package,
  Tag,
  FileText,
  MessageSquare,
  // BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, roles: ['admin', 'staff'] },
      { path: '/admin/bookings', icon: Calendar, label: 'Đặt chỗ', exact: false, roles: ['admin', 'staff'] },
    ];

    const adminOnlyItems = [
      { path: '/admin/users', icon: Users, label: 'Người dùng', exact: false, roles: ['admin'] },
      { path: '/admin/parking', icon: Car, label: 'Bãi đậu xe', exact: false, roles: ['admin'] },
      { path: '/admin/parking-types', icon: Building2, label: 'Loại bãi đậu xe', exact: false, roles: ['admin'] },
      { path: '/admin/services', icon: Package, label: 'Dịch vụ bổ sung', exact: false, roles: ['admin'] },
      { path: '/admin/discounts', icon: Tag, label: 'Mã giảm giá', exact: false, roles: ['admin'] },
      { path: '/admin/terms', icon: FileText, label: 'Điều khoản', exact: false, roles: ['admin'] },
      { path: '/admin/notifications', icon: MessageSquare, label: 'Thông báo', exact: false, roles: ['admin'] },

      { path: '/admin/settings', icon: Settings, label: 'Cài đặt hệ thống', exact: false, roles: ['admin'] },
    ];

    return [...baseItems, ...adminOnlyItems].filter(item => 
      item.roles.includes(user?.role || 'user')
    );
  };

  const menuItems = getMenuItems();

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">ParkEase</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.path, item.exact)
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Chào mừng, {user?.role === 'admin' ? 'Admin' : 'Staff'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 