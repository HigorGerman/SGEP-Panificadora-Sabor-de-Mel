"use client"
import Link from 'next/link';
import { FiHome, FiUsers, FiBox, FiList, FiUser } from 'react-icons/fi';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('usuario_role');
    setRole(savedRole);
  }, []);

  const navItems = [
    { name: 'Tela Inicial', path: '/', icon: <FiHome /> },
    { name: 'Nova Encomenda', path: '/nova-encomenda', icon: <FiBox /> },
    { name: 'Minhas Encomendas', path: '/minhas-encomendas', icon: <FiList /> },
  ];

  const adminItems = [
    { name: 'Clientes', path: '/clientes', icon: <FiUsers /> },
    { name: 'Produtos', path: '/produtos', icon: <FiBox /> },
    { name: 'Usuários', path: '/usuarios', icon: <FiUser /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={() => {}} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Navegação</div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} className={`${styles.link} ${pathname === item.path ? styles.linkActive : ''}`}>
                {item.icon} {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {(role === '0' || role === '1') && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Administrativo</div>
            <nav className={styles.nav}>
              {adminItems.map((item) => (
                <Link key={item.path} href={item.path} className={`${styles.link} ${pathname === item.path ? styles.linkActive : ''}`}>
                  {item.icon} {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <div className={styles.section} style={{ marginTop: 'auto' }}>
          <div className={styles.sectionTitle}>Minha Conta</div>
          <nav className={styles.nav}>
            <Link href="/perfil" className={`${styles.link} ${pathname === '/perfil' ? styles.linkActive : ''}`}>
              <FiUser /> Perfil
            </Link>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Sair da Conta
            </button>
          </nav>
        </div>

      </aside>
    </>
  );
}