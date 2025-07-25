import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Shield, Clock, Star } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Đặt chỗ đậu xe sân bay
            <span className="text-primary block">dễ dàng và an toàn</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Dịch vụ đặt chỗ đậu xe sân bay hàng đầu tại Đài Loan. 
            Đảm bảo xe của bạn được bảo vệ an toàn trong suốt chuyến đi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" className="text-lg px-8">
                Đặt chỗ ngay
              </Button>
            </Link>
            <Link to="/lookup">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Tra cứu đặt chỗ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tại sao chọn Parking Zone?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">An toàn tuyệt đối</h3>
              <p className="text-muted-foreground">
                Hệ thống bảo mật 24/7 với camera giám sát và nhân viên bảo vệ chuyên nghiệp
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tiện lợi 24/7</h3>
              <p className="text-muted-foreground">
                Đặt chỗ bất cứ lúc nào, nhận xe nhanh chóng khi trở về
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dịch vụ cao cấp</h3>
              <p className="text-muted-foreground">
                Nhiều loại bãi đậu và dịch vụ bổ sung đáp ứng mọi nhu cầu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Các loại bãi đậu xe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Trong nhà</h3>
              <p className="text-muted-foreground mb-4">
                Bãi đậu xe có mái che, bảo vệ xe khỏi thời tiết
              </p>
              <Link to="/booking">
                <Button variant="outline" className="w-full">
                  Đặt chỗ
                </Button>
              </Link>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-4xl mb-4">🌤</div>
              <h3 className="text-xl font-semibold mb-2">Ngoài trời</h3>
              <p className="text-muted-foreground mb-4">
                Bãi đậu xe rộng rãi với giá cả hợp lý
              </p>
              <Link to="/booking">
                <Button variant="outline" className="w-full">
                  Đặt chỗ
                </Button>
              </Link>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-4xl mb-4">♿️</div>
              <h3 className="text-xl font-semibold mb-2">Khu vực khuyết tật</h3>
              <p className="text-muted-foreground mb-4">
                Bãi đậu xe dành riêng cho người khuyết tật
              </p>
              <Link to="/booking">
                <Button variant="outline" className="w-full">
                  Đặt chỗ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng đặt chỗ chưa?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Chỉ mất vài phút để đặt chỗ và đảm bảo xe của bạn được bảo vệ
          </p>
          <Link to="/booking">
            <Button size="lg" className="text-lg px-8">
              Bắt đầu đặt chỗ
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 