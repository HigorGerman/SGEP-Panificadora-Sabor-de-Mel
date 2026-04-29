"use client"
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import Header from './components/Header';
import Sidebar from './components/sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/registro';
  const isPublicHome = !isLoggedIn && pathname === '/';
  const isPublicPage = isAuthPage || isPublicHome;

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    setIsLoggedIn(!!role);
  }, [pathname]);

  const toggleSidebar = () => {
    console.log("Botão clicado! Estado anterior:", isSidebarOpen);
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <html lang="pt-br">
      <body style={{ backgroundColor: '#FDFCF5', margin: 0, overflowX: 'hidden' }}>
        <Header 
          onMenuClick={toggleSidebar} 
          isLoggedIn={isLoggedIn}
          isPublicPage={isPublicPage}
        />

        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {!isPublicPage && isLoggedIn && (
            <Sidebar isOpen={isSidebarOpen} />
          )}
          
          <main style={{ 
            flex: 1, 
            paddingTop: isPublicPage ? '0' : '80px', 
            transition: 'all 0.3s ease',
            width: '100%'
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}