"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiCreditCard, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from './registro.module.css';
import api from '@/services/api';

export default function RegistroPage() {
  const [formData, setFormData] = useState({ nome: '', cpf: '', email: '', telefone: '', senha: '', confirmar: '', restricaoGluten: false, restricaoLactose: false, restricaoAcucar: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          <p className={styles.subtitle}>SGEP Padaria Sabor de Mel</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.toastError}>{error}</div>}
          {success && <div className={styles.toastSuccess}>{success}</div>}
          
          <div className={styles.inputGroup}>
            <label>Nome Completo</label>
            <div className={styles.inputWrapper}>
              <FiUser className={styles.inputIcon} size={18} />
              <input type="text" placeholder="Digite seu nome completo" required onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>CPF</label>
            <div className={styles.inputWrapper}>
              <FiCreditCard className={styles.inputIcon} size={18} />
              <input type="text" placeholder="000.000.000-00" maxLength={14} required value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCpf(e.target.value) })} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIcon} size={18} />
              <input type="email" placeholder="seuemail@exemplo.com" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Telefone</label>
            <div className={styles.inputWrapper}>
              <FiPhone className={styles.inputIcon} size={18} />
              <input type="text" placeholder="(00) 00000-0000" maxLength={15} required value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Senha</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} size={18} />
              <input type={showPassword ? "text" : "password"} placeholder="Crie uma senha forte" required onChange={e => setFormData({ ...formData, senha: e.target.value })} />
              {showPassword ? (
                <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowPassword(false)} />
              ) : (
                <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowPassword(true)} />
              )}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Confirmar Senha</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.inputIcon} size={18} />
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" required onChange={e => setFormData({ ...formData, confirmar: e.target.value })} />
              {showConfirmPassword ? (
                <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowConfirmPassword(false)} />
              ) : (
                <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowConfirmPassword(true)} />
              )}
            </div>
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