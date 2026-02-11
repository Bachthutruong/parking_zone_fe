import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  // LayoutDashboard, // ẩn tạm, sau xử lý xong sẽ bật lại
  Calendar,
  Users,
  Building2,
  Package,
  Tag,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  TrendingUp,
  Plus,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getTodayAvailability, type TodayParkingAvailability } from '@/services/parking';

const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [todayParking, setTodayParking] = React.useState<TodayParkingAvailability[]>([]);

  React.useEffect(() => {
    getTodayAvailability()
      .then((res) => setTodayParking(res.parking || []))
      .catch(() => setTodayParking([]));
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('登出成功');
  };

  // 今日概覽 đưa lên đầu; 儀表板 ẩn tạm (sau xử lý xong sẽ bật lại)
  const getMenuItems = () => {
    const baseItems = [
      { path: '/admin', icon: Clock, label: '今日概覽', exact: true, roles: ['admin', 'staff'], activeWhen: (p: string) => p === '/admin' || p === '/admin/today-overview' },
      { path: '/admin/bookings', icon: Calendar, label: '預約', exact: false, roles: ['admin', 'staff'] },
      // { path: '/admin', icon: LayoutDashboard, label: '儀表板', exact: true, roles: ['admin', 'staff'] }, // ẩn
    ];

    const adminOnlyItems = [
      { path: '/admin/users', icon: Users, label: '用戶', exact: false, roles: ['admin'] },
      { path: '/admin/parking-types', icon: Building2, label: '停車場', exact: false, roles: ['admin'] },
      { path: '/admin/services', icon: Package, label: '附加服務', exact: false, roles: ['admin'] },
      { path: '/admin/discounts', icon: Tag, label: '折扣碼', exact: false, roles: ['admin'] },
      { path: '/admin/notifications', icon: MessageSquare, label: '通知', exact: false, roles: ['admin'] },
      { path: '/admin/maintenance', icon: Wrench, label: '維護日期', exact: false, roles: ['admin'] },
      { path: '/admin/special-pricing', icon: TrendingUp, label: '特殊價格', exact: false, roles: ['admin'] },
      { path: '/admin/auto-discounts', icon: Tag, label: '自動折扣', exact: false, roles: ['admin'] },
      { path: '/admin/manual-booking', icon: Plus, label: '手動預約', exact: false, roles: ['admin', 'staff'] },
      { path: '/admin/settings', icon: Settings, label: '系統設定', exact: false, roles: ['admin'] },
    ];

    return [...baseItems, ...adminOnlyItems].filter(item => 
      item.roles.includes(user?.role || 'user')
    );
  };

  const menuItems = getMenuItems();

  const isActive = (item: { path: string; exact?: boolean; activeWhen?: (pathname: string) => boolean }) => {
    if (item.activeWhen) return item.activeWhen(location.pathname);
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
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
        fixed inset-y-0 left-0 z-50 w-64 bg-[#39653f] shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="晶順出國停車場" className="h-8 w-auto" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
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
                    ${isActive(item)
                      ? 'bg-white/20 text-white border-r-2 border-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* 今日各停車場空位/總數 - sidebar left */}
            {todayParking.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs font-medium text-white/90 mb-2 px-1">今日車位</div>
                <div className="space-y-1.5">
                  {todayParking.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs text-white/80 px-2 py-1.5 rounded bg-white/5"
                    >
                      <span className="truncate mr-2" title={p.name}>{p.name}</span>
                      <span className="shrink-0 font-medium text-white">
                        {p.availableSpaces}/{p.totalSpaces}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/20">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              登出
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-xs sm:text-sm text-gray-600">
              歡迎，{user?.role === 'admin' ? '管理員' : '員工'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 