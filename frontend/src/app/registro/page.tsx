"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './registro.module.css';
import api from '@/services/api';

export default function RegistroPage() {
  const [formData, setFormData] = useState({ nome: '', cpf: '', email: '', telefone: '', senha: '', confirmar: '', restricaoGluten: false, restricaoLactose: false, restricaoAcucar: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (formData.senha !== formData.confirmar) {
      setError('Senhas não batem!');
      return;
    }
    setLoading(true);
    try {
      const telefoneLimpo = formData.telefone.replace(/\D/g, '');
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      await api.post('/Clientes', {
        Nome: formData.nome,
        Cpf: cpfLimpo,
        Email: formData.email,
        Telefone: telefoneLimpo,
        Senha: formData.senha,
        RestricaoGluten: formData.restricaoGluten,
        RestricaoLactose: formData.restricaoLactose,
        RestricaoAcucar: formData.restricaoAcucar
      });
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      if (err.response && (err.response.status === 409 || err.response.status === 400)) {
        setError('CPF ou E-mail já está cadastrado (ou dados inválidos).');
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.registroCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>Criar Conta</h2>
          <p className={styles.subtitle}>SGEP Padaria Sabor</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div style={{ color: '#b00020', background: '#fff0f0', border: '1px solid #f5c2c7', borderRadius: 8, padding: 8, marginBottom: 10, textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#155724', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, padding: 8, marginBottom: 10, textAlign: 'center' }}>{success}</div>}
          <div className={styles.inputGroup}>
            <label>Nome Completo</label>
            <input type="text" required onChange={e => setFormData({ ...formData, nome: e.target.value })} />
          </div>
          <div className={styles.inputGroup}>
            <label>CPF</label>
            <input type="text" maxLength={14} required value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCpf(e.target.value) })} />
          </div>
          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <input type="email" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className={styles.inputGroup}>
            <label>Telefone</label>
            <input type="text" maxLength={15} required value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} />
          </div>
          <div className={styles.inputGroup}>
            <label>Senha</label>
            <input type="password" required onChange={e => setFormData({ ...formData, senha: e.target.value })} />
          </div>
          <div className={styles.inputGroup}>
            <label>Confirmar Senha</label>
            <input type="password" required onChange={e => setFormData({ ...formData, confirmar: e.target.value })} />
          </div>
          <div className={styles.inputGroup}>
            <label>Restrições Alimentares</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>
                <input type="checkbox" checked={formData.restricaoGluten} onChange={e => setFormData({ ...formData, restricaoGluten: e.target.checked })} />
                Restrição a Glúten
              </label>
              <label>
                <input type="checkbox" checked={formData.restricaoLactose} onChange={e => setFormData({ ...formData, restricaoLactose: e.target.checked })} />
                Restrição a Lactose
              </label>
              <label>
                <input type="checkbox" checked={formData.restricaoAcucar} onChange={e => setFormData({ ...formData, restricaoAcucar: e.target.checked })} />
                Restrição a Açúcar
              </label>
            </div>
          </div>
          <button type="submit" className={styles.registroBtn} disabled={loading}>
            {loading ? 'Carregando...' : 'Registrar'}
          </button>
        </form>
        <p className={styles.footer}>Já tem conta? <Link href="/login" style={{ color: '#5B0A1A', fontWeight: 'bold' }}>Login</Link></p>
      </div>
    </div>
  );
}