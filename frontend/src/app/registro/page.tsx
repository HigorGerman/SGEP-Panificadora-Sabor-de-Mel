"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiUser, 
  FiCreditCard, 
  FiMail, 
  FiPhone, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiShield, 
  FiHeart, 
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import styles from './registro.module.css';
import api from '@/services/api';

export default function RegistroPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: '',
    confirmar: '',
    restricaoGluten: false,
    restricaoLactose: false,
    restricaoAcucar: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSummary, setShowSummary] = useState(true);

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

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.nome.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!formData.telefone.trim()) {
      setError('Por favor, informe seu telefone / WhatsApp.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.cpf.trim() || formData.cpf.replace(/\D/g, '').length !== 11) {
      setError('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }
    if (!formData.senha || formData.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (formData.senha !== formData.confirmar) {
      setError('As senhas não coincidem.');
      return;
    }
    setStep(3);
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.senha !== formData.confirmar) {
      setError('As senhas não coincidem.');
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

  // Cálculo de restrições para exibição no resumo
  const listRestricoes = [];
  if (formData.restricaoGluten) listRestricoes.push('Glúten');
  if (formData.restricaoLactose) listRestricoes.push('Lactose');
  if (formData.restricaoAcucar) listRestricoes.push('Açúcar');
  const strRestricoes = listRestricoes.length > 0 ? listRestricoes.join(', ') : 'Nenhuma';

  const passwordsMismatch = formData.confirmar.length > 0 && formData.senha !== formData.confirmar;

  return (
    <div className={styles.container}>
      {/* Pill Badge Superior */}
      <div className={styles.topPill}>
        <span>🍞</span> SGEP · SABOR DE MEL
      </div>

      <h1 className={styles.title}>Cadastro de Cliente</h1>
      <p className={styles.subtitle}>Três passos rápidos para você começar a fazer encomendas fresquinhas.</p>

      {/* Stepper Header em 3 Etapas */}
      <div className={styles.stepperWrapper}>
        <div className={styles.stepperLineTrack}></div>
        <div 
          className={styles.stepperLineProgress}
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
        ></div>

        {/* Passo 1 */}
        <div className={styles.stepItem}>
          <div className={`${styles.stepCircle} ${step === 1 ? styles.stepCircleActive : step > 1 ? styles.stepCircleCompleted : ''}`}>
            {step > 1 ? <FiCheck /> : <FiUser />}
          </div>
          <span className={`${styles.stepText} ${step === 1 ? styles.stepTextActive : ''}`}>
            1. Contato & Dados
          </span>
        </div>

        {/* Passo 2 */}
        <div className={styles.stepItem}>
          <div className={`${styles.stepCircle} ${step === 2 ? styles.stepCircleActive : step > 2 ? styles.stepCircleCompleted : ''}`}>
            {step > 2 ? <FiCheck /> : <FiShield />}
          </div>
          <span className={`${styles.stepText} ${step === 2 ? styles.stepTextActive : ''}`}>
            2. Segurança & CPF
          </span>
        </div>

        {/* Passo 3 */}
        <div className={styles.stepItem}>
          <div className={`${styles.stepCircle} ${step === 3 ? styles.stepCircleActive : ''}`}>
            <FiHeart />
          </div>
          <span className={`${styles.stepText} ${step === 3 ? styles.stepTextActive : ''}`}>
            3. Saúde Alimentar
          </span>
        </div>
      </div>

      {/* Card Principal do Formulário */}
      <div className={styles.registroCard}>
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

        {/* ETAPA 1: Dados de Contato */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className={styles.form}>
            <div className={styles.sectionHeader}>
              <h3>Dados de contato</h3>
              <p>Usaremos essas informações para avisar sobre pedidos.</p>
            </div>

            <div className={styles.inputGroup}>
              <label>Nome completo</label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.inputIcon} size={18} />
                <input 
                  type="text" 
                  placeholder="Maria de Souza" 
                  required 
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>E-mail</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} size={18} />
                <input 
                  type="email" 
                  placeholder="cliente@email.com" 
                  required 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Telefone / WhatsApp</label>
              <div className={styles.inputWrapper}>
                <FiPhone className={styles.inputIcon} size={18} />
                <input 
                  type="text" 
                  placeholder="(00) 00000-0000" 
                  maxLength={15} 
                  required 
                  value={formData.telefone} 
                  onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} 
                />
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button type="submit" className={styles.btnNext}>
                Continuar para Segurança &rarr;
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 2: Segurança & CPF */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className={styles.form}>
            <div className={styles.sectionHeader}>
              <h3>Identificação e segurança</h3>
              <p>Seus dados ficam protegidos e são usados só no SGEP.</p>
            </div>

            <div className={styles.inputGroup}>
              <label>CPF</label>
              <div className={styles.inputWrapper}>
                <FiCreditCard className={styles.inputIcon} size={18} />
                <input 
                  type="text" 
                  placeholder="000.000.000-00" 
                  maxLength={14} 
                  required 
                  value={formData.cpf} 
                  onChange={e => setFormData({ ...formData, cpf: formatCpf(e.target.value) })} 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Senha</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mínimo de 6 caracteres" 
                  required 
                  value={formData.senha}
                  onChange={e => setFormData({ ...formData, senha: e.target.value })} 
                />
                {showPassword ? (
                  <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowPassword(false)} />
                ) : (
                  <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowPassword(true)} />
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Confirmar senha</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={18} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Repita a senha" 
                  required 
                  className={passwordsMismatch ? styles.inputError : ''}
                  value={formData.confirmar}
                  onChange={e => setFormData({ ...formData, confirmar: e.target.value })} 
                />
                {showConfirmPassword ? (
                  <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowConfirmPassword(false)} />
                ) : (
                  <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowConfirmPassword(true)} />
                )}
              </div>
              {passwordsMismatch && (
                <div className={styles.fieldErrorMessage}>As senhas não coincidem.</div>
              )}
            </div>

            <div className={styles.buttonRow}>
              <button type="button" className={styles.btnBack} onClick={() => setStep(1)}>
                &larr; Voltar
              </button>
              <button type="submit" className={styles.btnNext}>
                Continuar para Preferências &rarr;
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 3: Saúde Alimentar & Finalização */}
        {step === 3 && (
          <form onSubmit={handleSubmitFinal} className={styles.form}>
            <div className={styles.sectionHeader}>
              <h3>Preferências alimentares</h3>
              <p>Marque suas restrições para receber sugestões adequadas ao seu perfil.</p>
            </div>

            {/* Cards clicáveis das restrições */}
            <div className={styles.dietaryGrid}>
              <div 
                className={`${styles.dietaryCard} ${formData.restricaoGluten ? styles.dietaryCardActive : ''}`}
                onClick={() => setFormData({ ...formData, restricaoGluten: !formData.restricaoGluten })}
              >
                <span className={styles.dietaryIcon}>🌾</span>
                <span>Restrição a Glúten</span>
              </div>

              <div 
                className={`${styles.dietaryCard} ${formData.restricaoLactose ? styles.dietaryCardActive : ''}`}
                onClick={() => setFormData({ ...formData, restricaoLactose: !formData.restricaoLactose })}
              >
                <span className={styles.dietaryIcon}>🥛</span>
                <span>Restrição a Lactose</span>
              </div>

              <div 
                className={`${styles.dietaryCard} ${formData.restricaoAcucar ? styles.dietaryCardActive : ''}`}
                onClick={() => setFormData({ ...formData, restricaoAcucar: !formData.restricaoAcucar })}
              >
                <span className={styles.dietaryIcon}>🍬</span>
                <span>Restrição a Açúcar</span>
              </div>
            </div>

            {/* Card de Resumo do Cadastro */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader} onClick={() => setShowSummary(!showSummary)}>
                <span>Resumo do cadastro</span>
                {showSummary ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              </div>

              {showSummary && (
                <div className={styles.summaryContent}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Nome</span>
                    <span className={styles.summaryValue}>{formData.nome || '-'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>E-mail</span>
                    <span className={styles.summaryValue}>{formData.email || '-'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Telefone</span>
                    <span className={styles.summaryValue}>{formData.telefone || '-'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>CPF</span>
                    <span className={styles.summaryValue}>{formData.cpf || '-'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Restrições</span>
                    <span className={styles.summaryValue}>{strRestricoes}</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.buttonRow}>
              <button type="button" className={styles.btnBack} onClick={() => setStep(2)}>
                &larr; Voltar
              </button>
              <button type="submit" className={styles.btnNext} disabled={loading}>
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        )}

        <p className={styles.footer}>
          Já tem uma conta? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}