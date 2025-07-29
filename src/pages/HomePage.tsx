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
            機場停車預訂
            <span className="text-primary block">簡單安全</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            台灣頂級機場停車預訂服務。
            確保您的車輛在整個旅程中得到安全保護。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" className="text-lg px-8">
                立即預訂
              </Button>
            </Link>
            <Link to="/lookup">
              <Button variant="outline" size="lg" className="text-lg px-8">
                查詢預訂
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            為什麼選擇停車區？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">絕對安全</h3>
              <p className="text-muted-foreground">
                24/7 安全系統，配備監控攝影機和專業保安人員
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 便利服務</h3>
              <p className="text-muted-foreground">
                隨時預訂，回程時快速取車
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">高級服務</h3>
              <p className="text-muted-foreground">
                多種停車場類型和附加服務，滿足所有需求
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            停車場類型
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">室內停車場</h3>
              <p className="text-muted-foreground mb-4">
                有遮蓋的停車場，保護車輛免受天氣影響
              </p>
              <Link to="/booking">
                <Button variant="outline" className="w-full">
                  預訂
                </Button>
              </Link>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-4xl mb-4">🌤</div>
              <h3 className="text-xl font-semibold mb-2">戶外停車場</h3>
              <p className="text-muted-foreground mb-4">
                寬敞的停車場，價格合理
              </p>
              <Link to="/booking">
                <Button variant="outline" className="w-full">
                  預訂
                </Button>
              </Link>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-4xl mb-4">♿️</div>
              <h3 className="text-xl font-semibold mb-2">無障礙區域</h3>
              <p className="text-muted-foreground mb-4">
                專為身心障礙者設計的停車場
              </p>
              <Link to="/booking">
                <Button variant="outline" className="w-full">
                  預訂
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
            準備好預訂了嗎？
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            只需幾分鐘即可預訂並確保您的車輛得到保護
          </p>
          <Link to="/booking">
            <Button size="lg" className="text-lg px-8">
              開始預訂
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 