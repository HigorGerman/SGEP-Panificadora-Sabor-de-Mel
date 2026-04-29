"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import api from '@/services/api';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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
          <p className={styles.subtitle}>Padaria Sabor - Login</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div style={{ color: '#b00020', background: '#fff0f0', border: '1px solid #f5c2c7', borderRadius: 8, padding: 8, marginBottom: 10, textAlign: 'center' }}>{error}</div>}
          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
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