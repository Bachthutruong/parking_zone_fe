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
              台灣頂級機場停車預訂服務
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="font-semibold">快速連結</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/booking" className="text-muted-foreground hover:text-primary transition-colors">
                  預訂
                </a>
              </li>
              <li>
                <a href="/lookup" className="text-muted-foreground hover:text-primary transition-colors">
                  查詢預訂
                </a>
              </li>
              <li>
                <a href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  登入
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">服務</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">室內停車</li>
              <li className="text-muted-foreground">戶外停車</li>
              <li className="text-muted-foreground">無障礙區域</li>
              <li className="text-muted-foreground">附加服務</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">聯絡我們</h3>
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
            © 2024 Parking Zone. 版權所有。
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 