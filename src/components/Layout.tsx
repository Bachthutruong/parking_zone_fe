import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 