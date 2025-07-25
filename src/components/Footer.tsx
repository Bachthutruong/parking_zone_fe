import React from 'react';
import { Car, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Parking Zone</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Dịch vụ đặt chỗ đậu xe sân bay hàng đầu tại Đài Loan
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/booking" className="text-muted-foreground hover:text-primary transition-colors">
                  Đặt chỗ
                </a>
              </li>
              <li>
                <a href="/lookup" className="text-muted-foreground hover:text-primary transition-colors">
                  Tra cứu đặt chỗ
                </a>
              </li>
              <li>
                <a href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Đăng nhập
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">Dịch vụ</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Đậu xe trong nhà</li>
              <li className="text-muted-foreground">Đậu xe ngoài trời</li>
              <li className="text-muted-foreground">Khu vực khuyết tật</li>
              <li className="text-muted-foreground">Dịch vụ bổ sung</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Liên hệ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">+886 2 1234 5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">info@parkingzone.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">123 Parking Street, Taipei</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Parking Zone. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 