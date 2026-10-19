"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiKey, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import styles from './login.module.css';
import api from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Estados para Recuperação de Senha (Modal)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/Usuarios/login', { email, senha });
      if (response.status === 200) {
        const { id, nome, role, tipo } = response.data;
        localStorage.setItem('usuario_id', id.toString());
        localStorage.setItem('usuario_nome', nome);
        localStorage.setItem('usuario_role', role);
        localStorage.setItem('usuario_tipo', tipo);
        
        setSuccess('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('E-mail, CPF ou senha inválidos.');
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(email);
    setForgotStep(1);
    setForgotError('');
    setForgotSuccess('');
    setShowForgotModal(true);
  };

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail) {
      setForgotError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setForgotLoading(true);
    try {
      await api.post('/Clientes/solicitar-recuperacao-senha', { email: forgotEmail });
      setForgotSuccess('Código de verificação de 6 dígitos enviado para o seu e-mail!');
      setForgotStep(2);
    } catch (err: any) {
      console.error(err);
      setForgotError(err.response?.data?.erro || 'Erro ao enviar o código. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotCode || forgotCode.trim().length !== 6) {
      setForgotError('Por favor, informe o código de 6 dígitos enviado por e-mail.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('As senhas não conferem. Verifique e tente novamente.');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await api.post('/Clientes/redefinir-senha', {
        email: forgotEmail,
        codigoToken: forgotCode,
        novaSenha: newPassword
      });

      setForgotSuccess(response.data.mensagem || 'Senha redefinida com sucesso! Você já pode realizar o login.');
      setTimeout(() => {
        setShowForgotModal(false);
        setEmail(forgotEmail);
        setSenha('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setForgotError(err.response?.data?.erro || 'Erro ao redefinir senha. Verifique o código e tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        {/* Header no estilo do Lovable */}
        <div className={styles.header}>
          <div className={styles.topPill}>
            <span>🍞</span> SGEP · SABOR DE MEL
          </div>
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>Entre para acompanhar suas encomendas fresquinhas.</p>
          <div className={styles.goldDivider}></div>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && (
            <div className={styles.toastError}>
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.toastSuccess}>
              <FiCheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>E-mail ou CPF</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIcon} size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail ou CPF (000.000.000-00)"
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
                placeholder="Sua senha"
                required
              />
              {showPassword ? (
                <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowPassword(false)} />
              ) : (
                <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowPassword(true)} />
              )}
            </div>
          </div>

          <div className={styles.forgotWrapper}>
            <button type="button" onClick={handleOpenForgotModal} className={styles.forgotBtn}>
              Esqueci minha senha
            </button>
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          Não tem uma conta? <Link href="/registro">Registre-se</Link>
        </p>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>🔑 Recuperar Senha</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowForgotModal(false)}>
                &times;
              </button>
            </div>

            {forgotError && (
              <div className={styles.toastError}>
                <FiAlertCircle size={18} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className={styles.toastSuccess}>
                <FiCheckCircle size={18} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendRecoveryCode} className={styles.form}>
                <p className={styles.stepInfo}>
                  Informe seu e-mail cadastrado. Enviaremos um código de verificação de <strong>6 dígitos</strong>.
                </p>

                <div className={styles.inputGroup}>
                  <label>E-mail cadastrado</label>
                  <div className={styles.inputWrapper}>
                    <FiMail className={styles.inputIcon} size={18} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowForgotModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.modalConfirmBtn} disabled={forgotLoading}>
                    {forgotLoading ? 'Enviando...' : 'Enviar Código'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className={styles.form}>
                <p className={styles.stepInfo}>
                  Insira o código de 6 dígitos enviado para <strong>{forgotEmail}</strong> e defina sua nova senha.
                </p>

                <div className={styles.inputGroup}>
                  <label>Código de Verificação (6 dígitos)</label>
                  <div className={styles.inputWrapper}>
                    <FiKey className={styles.inputIcon} size={18} />
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className={styles.codeTokenInput}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Nova Senha</label>
                  <div className={styles.inputWrapper}>
                    <FiLock className={styles.inputIcon} size={18} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      required
                    />
                    {showNewPassword ? (
                      <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowNewPassword(false)} />
                    ) : (
                      <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowNewPassword(true)} />
                    )}
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Confirmar Nova Senha</label>
                  <div className={styles.inputWrapper}>
                    <FiLock className={styles.inputIcon} size={18} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setForgotStep(1)}>
                    Voltar
                  </button>
                  <button type="submit" className={styles.modalConfirmBtn} disabled={forgotLoading}>
                    {forgotLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}