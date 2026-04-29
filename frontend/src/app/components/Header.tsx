"use client"
import { useEffect, useState } from 'react';
import { FiMenu, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuClick: () => void;
  isLoggedIn: boolean;
  isPublicPage: boolean;
}

export default function Header({ onMenuClick, isLoggedIn, isPublicPage }: HeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const nome = localStorage.getItem('usuario_nome');
    setUserName(nome);
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header className={styles.header} style={{ position: isPublicPage ? 'relative' : 'fixed' }}>
      <div className={styles.logo} onClick={() => router.push('/')}>
        SGEP <span className={styles.logoSpan}>| SABOR DE MEL</span>
      </div>

      <div className={styles.rightSection}>
        {isLoggedIn ? (
          <>
            <div className={styles.loggedContainer}>
              <FiUser className={styles.profileIcon} size={16} />
              <p className={styles.userName}>{userName?.split(' ')[0]}</p>
            </div>
            <button onClick={onMenuClick} className={styles.menuBtn} type="button">
              <FiMenu size={20} />
            </button>
          </>
        ) : (
          <div className={styles.authButtons}>
            <button className={styles.btnCriar} onClick={() => router.push('/registro')}>
              Cadastro
            </button>
            <button className={styles.btnAcessar} onClick={() => router.push('/login')}>
              Entrar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}