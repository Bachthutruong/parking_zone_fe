import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { User, LogOut, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-[#39653f] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="晶順出國停車場" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-white/80 ${
                isActive('/') || isActive('/booking') ? 'text-white' : 'text-white/70'
              }`}
            >
              線上預約
            </Link>
            <Link
              to="/lookup"
              className={`text-sm font-medium transition-colors hover:text-white/80 ${
                isActive('/lookup') ? 'text-white' : 'text-white/70'
              }`}
            >
              查詢預約
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard">
                    <Button variant="outline" size="sm" className="text-white bg-[#39653f] border-white hover:bg-white/10">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                {user.role === 'staff' && (
                  <Link to="/staff/dashboard">
                    <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10">
                      Staff Panel
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">{user.name}</span>
                  {user.isVIP && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      VIP
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    登入
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-white text-[#39653f] hover:bg-white/90">
                    註冊
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-[#39653f]">
            <div className="px-4 py-2 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') || isActive('/booking') 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                線上預約
              </Link>
              <Link
                to="/lookup"
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/lookup') 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                查詢預約
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 