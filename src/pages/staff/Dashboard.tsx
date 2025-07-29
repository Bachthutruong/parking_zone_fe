import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Car, User } from 'lucide-react';

const StaffDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan hệ thống bãi đậu xe - Staff Panel
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đặt chỗ hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0 đặt thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu hôm nay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 NT$</div>
            <p className="text-xs text-muted-foreground">
              Trung bình 0,00 NT$/đặt chỗ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chỗ trống còn lại</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Tổng 0 chỗ đậu xe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xe đang đỗ</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 xe sắp rời bãi hôm nay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-primary text-primary px-1 py-2 text-sm font-medium">
            Tổng quan
          </button>
          <button className="border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2 text-sm font-medium">
            Bãi đậu xe
          </button>
          <button className="border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2 text-sm font-medium">
            Đặt chỗ
          </button>
          <button className="border-b-2 border-transparent text-muted-foreground hover:text-foreground px-1 py-2 text-sm font-medium">
            Trạng thái hiện tại
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-muted-foreground">
          <p>Chào mừng đến với Staff Dashboard</p>
          <p className="text-sm mt-2">
            Bạn có thể quản lý đặt chỗ và theo dõi trạng thái bãi đậu xe từ đây.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard; 