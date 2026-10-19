"use client"
import { useEffect, useState } from 'react';
import api from '@/services/api';
import styles from './perfil.module.css';
import { useRouter } from 'next/navigation';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiCreditCard, 
  FiLock, 
  FiShield, 
  FiAlertTriangle, 
  FiEye, 
  FiEyeOff, 
  FiKey,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCliente, setIsCliente] = useState(false);
  
  // Estado do Perfil
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    role: '',
    restricaoGluten: false,
    restricaoLactose: false,
    restricaoAcucar: false
  });

  // Estado para alteração de senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Modal de Validação por Código para Alterar Perfil/Senha
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateCode, setUpdateCode] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Modal para Exclusão de Conta (Zona de Perigo)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    const tipo = localStorage.getItem('usuario_tipo');
    const uId = localStorage.getItem('usuario_id');
    const roleNome = localStorage.getItem('usuario_role') === '0' ? 'Administrador' : (localStorage.getItem('usuario_role') === '1' ? 'Funcionário' : 'Cliente Sabor de Mel');

    if (!tipo || !uId) {
      router.push('/login');
      return;
    }

    if (tipo === 'Cliente') {
      setIsCliente(true);
      api.get(`/Clientes/${uId}`)
        .then(res => {
          setPerfil({
            nome: res.data.nome || '',
            email: res.data.email || '',
            cpf: res.data.cpf || '',
            telefone: res.data.telefone || '',
            role: roleNome,
            restricaoGluten: res.data.restricaoGluten || false,
            restricaoLactose: res.data.restricaoLactose || false,
            restricaoAcucar: res.data.restricaoAcucar || false
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setPerfil(prev => ({
        ...prev,
        nome: localStorage.getItem('usuario_nome') || '',
        email: localStorage.getItem('usuario_email') || '',
        role: roleNome
      }));
      setLoading(false);
    }
  }, [router]);

  // Passo 1: Solicitar código de alteração por e-mail e abrir modal
  const handleStartUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCliente) {
      alert("A edição de perfil para funcionários não está disponível nesta tela.");
      return;
    }

    if (novaSenha && novaSenha !== confirmarNovaSenha) {
      alert("As senhas não conferem. Verifique e tente novamente.");
      return;
    }

    if (novaSenha && novaSenha.length < 6) {
      alert("A nova senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    setSaving(true);
    setUpdateError('');
    setUpdateSuccess('');
    setUpdateCode('');

    try {
      // Dispara solicitação de token para o e-mail do cliente logado
      await api.post('/Clientes/solicitar-codigo-alteracao');
      setUpdateSuccess(`Um código de confirmação de 6 dígitos foi enviado para ${perfil.email}.`);
      setShowUpdateModal(true);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.erro || "Erro ao enviar código de autorização por e-mail.");
    } finally {
      setSaving(false);
    }
  };

  // Passo 2: Validar o código de 6 dígitos e salvar alterações
  const handleConfirmUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    if (!updateCode || updateCode.trim().length !== 6) {
      setUpdateError("Informe o código de 6 dígitos enviado por e-mail.");
      return;
    }

    setUpdateLoading(true);
    try {
      const payload = {
        Nome: perfil.nome,
        Telefone: perfil.telefone,
        RestricaoGluten: perfil.restricaoGluten,
        RestricaoLactose: perfil.restricaoLactose,
        RestricaoAcucar: perfil.restricaoAcucar,
        NovaSenha: novaSenha || null,
        CodigoToken: updateCode
      };

      const res = await api.put('/Clientes/perfil-com-codigo', payload);
      alert(res.data.mensagem || "Perfil e preferências atualizados com sucesso!");

      localStorage.setItem('usuario_nome', perfil.nome);
      window.dispatchEvent(new Event('storage'));

      setShowUpdateModal(false);
      setNovaSenha('');
      setConfirmarNovaSenha('');
    } catch (err: any) {
      console.error(err);
      setUpdateError(err.response?.data?.erro || "Código inválido ou expirado. Tente novamente.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Solicitar código de exclusão de conta
  const handleOpenDeleteModal = () => {
    setDeleteStep(1);
    setDeleteCode('');
    setDeleteError('');
    setDeleteSuccess('');
    setShowDeleteModal(true);
  };

  const handleRequestDeleteCode = async () => {
    setDeleteError('');
    setDeleteSuccess('');
    setDeleteLoading(true);
    try {
      await api.post('/Clientes/solicitar-exclusao-conta');
      setDeleteSuccess(`Código de 6 dígitos enviado para ${perfil.email}.`);
      setDeleteStep(2);
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.erro || 'Erro ao solicitar código de exclusão.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteSuccess('');

    if (!deleteCode || deleteCode.trim().length !== 6) {
      setDeleteError('Informe o código de 6 dígitos enviado por e-mail.');
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api.post('/Clientes/confirmar-exclusao-conta', {
        codigoToken: deleteCode
      });

      alert(response.data.mensagem || 'Sua conta foi desativada com sucesso.');

      localStorage.removeItem('usuario_id');
      localStorage.removeItem('usuario_nome');
      localStorage.removeItem('usuario_role');
      localStorage.removeItem('usuario_tipo');
      window.dispatchEvent(new Event('storage'));

      router.push('/login');
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.erro || 'Código inválido ou expirado. Tente novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#5B0A1A', fontWeight: 'bold' }}>Carregando dados do perfil...</div>;

  const inicialNome = perfil.nome ? perfil.nome.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.container}>
      {/* Hero Banner Superior */}
      <div className={styles.profileHero}>
        <div className={styles.avatarCircle}>
          {inicialNome}
        </div>
        <div className={styles.heroInfo}>
          <h1>{perfil.nome || 'Meu Perfil'}</h1>
          <p><FiMail size={14} /> {perfil.email}</p>
          <span className={styles.roleBadge}>{perfil.role}</span>
        </div>
      </div>

      <div className={styles.alertNotice}>
        <FiInfo size={20} color="#B45309" />
        <span>Para alterar seu e-mail ou CPF, entre em contato com a equipe de suporte. Quaisquer alterações em seus dados ou senha exigirão validação por código enviado por e-mail.</span>
      </div>

      <form onSubmit={handleStartUpdateProfile} className={styles.sectionsGrid}>
        {/* Seção 1: Dados Pessoais */}
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <FiUser className={styles.cardHeaderIcon} />
            <h2>Dados Pessoais & Contato</h2>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Nome Completo</label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.fieldIcon} size={18} />
                <input 
                  type="text" 
                  value={perfil.nome} 
                  onChange={e => setPerfil({...perfil, nome: e.target.value})}
                  disabled={!isCliente}
                  required 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Telefone / WhatsApp</label>
              <div className={styles.inputWrapper}>
                <FiPhone className={styles.fieldIcon} size={18} />
                <input 
                  type="text" 
                  value={perfil.telefone} 
                  onChange={e => setPerfil({...perfil, telefone: e.target.value})}
                  disabled={!isCliente}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>E-mail Cadastrado</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.fieldIcon} size={18} />
                <input type="email" value={perfil.email} disabled />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>CPF</label>
              <div className={styles.inputWrapper}>
                <FiCreditCard className={styles.fieldIcon} size={18} />
                <input type="text" value={perfil.cpf || 'Não informado'} disabled />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Restrições Alimentares */}
        {isCliente && (
          <div className={styles.cardSection}>
            <div className={styles.cardHeader}>
              <FiShield className={styles.cardHeaderIcon} />
              <h2>Preferências de Saúde Alimentar</h2>
            </div>

            <div className={styles.dietaryGrid}>
              <div 
                className={`${styles.dietaryCard} ${perfil.restricaoGluten ? styles.dietaryCardActive : ''}`}
                onClick={() => setPerfil({...perfil, restricaoGluten: !perfil.restricaoGluten})}
              >
                <span className={styles.dietaryIcon}>🌾</span>
                <span>Restrição a Glúten</span>
              </div>

              <div 
                className={`${styles.dietaryCard} ${perfil.restricaoLactose ? styles.dietaryCardActive : ''}`}
                onClick={() => setPerfil({...perfil, restricaoLactose: !perfil.restricaoLactose})}
              >
                <span className={styles.dietaryIcon}>🥛</span>
                <span>Restrição a Lactose</span>
              </div>

              <div 
                className={`${styles.dietaryCard} ${perfil.restricaoAcucar ? styles.dietaryCardActive : ''}`}
                onClick={() => setPerfil({...perfil, restricaoAcucar: !perfil.restricaoAcucar})}
              >
                <span className={styles.dietaryIcon}>🍬</span>
                <span>Restrição a Açúcar</span>
              </div>
            </div>
          </div>
        )}

        {/* Seção 3: Alterar Senha */}
        {isCliente && (
          <div className={styles.cardSection}>
            <div className={styles.cardHeader}>
              <FiLock className={styles.cardHeaderIcon} />
              <h2>Alterar Senha de Acesso (Opcional)</h2>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Nova Senha</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.fieldIcon} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                  />
                  {showPassword ? (
                    <FiEyeOff className={styles.eyeIcon} size={18} onClick={() => setShowPassword(false)} />
                  ) : (
                    <FiEye className={styles.eyeIcon} size={18} onClick={() => setShowPassword(true)} />
                  )}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Confirmar Nova Senha</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.fieldIcon} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Envio de Alteração com Código */}
        {isCliente && (
          <button type="submit" className={styles.btnSalvarComCodigo} disabled={saving}>
            <FiKey size={20} />
            {saving ? 'Enviando Código...' : 'Salvar Alterações (Exige Código por E-mail)'}
          </button>
        )}
      </form>

      {/* Zona de Perigo */}
      {isCliente && (
        <div style={{ marginTop: '30px' }}>
          <div className={styles.dangerZoneCard}>
            <div className={styles.dangerHeader}>
              <FiAlertTriangle size={24} color="#C53030" />
              <h3>Zona de Perigo</h3>
            </div>
            <p className={styles.dangerText}>
              A exclusão da sua conta desativará permanentemente o seu acesso. Seu histórico de encomendas anteriores será mantido no sistema para fins fiscais e operacionais.
            </p>
            <button 
              type="button" 
              onClick={handleOpenDeleteModal} 
              className={styles.btnExcluir}
            >
              Excluir Minha Conta
            </button>
          </div>
        </div>
      )}

      {/* Modal de Validação por Código de 6 Dígitos para Salvar Alterações */}
      {showUpdateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>🔒 Autorizar Alteração de Perfil</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowUpdateModal(false)}>
                &times;
              </button>
            </div>

            {updateError && <div className={styles.toastError}>{updateError}</div>}
            {updateSuccess && <div className={styles.toastSuccess}>{updateSuccess}</div>}

            <form onSubmit={handleConfirmUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p className={styles.stepInfo}>
                Um código de autorização de <strong>6 dígitos</strong> foi enviado para <strong>{perfil.email}</strong>. Digite-o abaixo para confirmar e aplicar as alterações.
              </p>

              <div className={styles.inputGroup}>
                <label style={{ fontWeight: 'bold' }}>Código de Verificação (6 dígitos)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={updateCode}
                  onChange={(e) => setUpdateCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={styles.codeTokenInput}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn} disabled={updateLoading}>
                  {updateLoading ? 'Verificando...' : 'Confirmar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Conta */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: '#C53030' }}>⚠️ Confirmar Exclusão de Conta</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>
                &times;
              </button>
            </div>

            {deleteError && <div className={styles.toastError}>{deleteError}</div>}
            {deleteSuccess && <div className={styles.toastSuccess}>{deleteSuccess}</div>}

            {deleteStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p className={styles.stepInfo}>
                  Para sua segurança, enviaremos um código de verificação de <strong>6 dígitos</strong> para o seu e-mail (<strong>{perfil.email}</strong>).
                </p>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleRequestDeleteCode} 
                    className={styles.confirmDeleteBtn} 
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Enviando Código...' : 'Enviar Código por E-mail'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p className={styles.stepInfo}>
                  Insira o código de 6 dígitos enviado para <strong>{perfil.email}</strong> para confirmar a exclusão.
                </p>

                <div className={styles.inputGroup}>
                  <label style={{ fontWeight: 'bold' }}>Código de Confirmação (6 dígitos)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deleteCode}
                    onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className={styles.codeTokenInput}
                    required
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.confirmDeleteBtn} disabled={deleteLoading}>
                    {deleteLoading ? 'Desativando...' : 'Confirmar Exclusão Definitiva'}
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
