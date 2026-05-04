"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from './login.module.css';
import api from '@/services/api';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/Usuarios/login', { email, senha });
      if (response.status === 200) {
        // Armazena o nome e role do usuário
        const { id, nome, role, tipo } = response.data;
        localStorage.setItem('usuario_id', id.toString());
        localStorage.setItem('usuario_nome', nome);
        localStorage.setItem('usuario_role', role);
        localStorage.setItem('usuario_tipo', tipo);
        alert('Login realizado com sucesso!');
        router.push('/');
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        alert('E-mail ou senha inválidos');
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>SGEP</h1>
          <p className={styles.subtitle}>Padaria Sabor de Mel - Login</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.toastError}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIcon} size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Senha</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
              {showPassword ? (
                <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowPassword(false)} />
              ) : (
                <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowPassword(true)} />
              )}
            </div>
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Carregando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className={styles.footer}>
          Não tem conta? <Link href="/registro" style={{ color: '#5B0A1A', fontWeight: 'bold' }}>Registre-se</Link>
        </p>
      </div>
    </div>
  );
}