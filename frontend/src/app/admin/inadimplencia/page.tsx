"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUserSlash, FaSearch, FaExclamationTriangle, FaCheckCircle, 
  FaTimes, FaLock, FaLockOpen, FaEnvelope, FaRedo, FaMoneyBillWave,
  FaShieldAlt, FaPhone, FaRegFileAlt, FaClock
} from 'react-icons/fa';
import api from '@/services/api';
import styles from './inadimplencia.module.css';

interface ClienteInadimplente {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  qtdEncomendasAtraso: number;
  qtdEncomendasPendentes: number;
  valorTotalDevido: number;
  bloqueadoEncomendas: boolean;
  motivoBloqueio?: string;
  riscoAutomatico: boolean;
}

const PRESET_MOTIVOS = [
  "Encomenda não retirada no prazo",
  "Atrasos recorrentes no pagamento",
  "Pedido abandonado no balcão",
  "Pendências financeiras em aberto",
  "Solicitação do departamento financeiro"
];

export default function AdminInadimplenciaPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteInadimplente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apenasBloqueados, setApenasBloqueados] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Modal de Bloqueio / Desbloqueio
  const [modalCliente, setModalCliente] = useState<ClienteInadimplente | null>(null);
  const [modalAcao, setModalAcao] = useState<'bloquear' | 'desbloquear'>('bloquear');
  const [motivoSelecionado, setMotivoSelecionado] = useState(PRESET_MOTIVOS[0]);
  const [motivoCustomizado, setMotivoCustomizado] = useState('');
  const [submittingBloqueio, setSubmittingBloqueio] = useState(false);

  // Notificação por E-mail
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    setUserRole(role);

    if (role !== '0' && role !== '1') {
      router.push('/login');
      return;
    }

    carregarInadimplentes();
  }, [apenasBloqueados]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const carregarInadimplentes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/inadimplencia', {
        params: {
          busca: searchTerm.trim() || undefined,
          apenasBloqueados: apenasBloqueados
        }
      });
      setClientes(response.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar lista de inadimplentes:", error);
      showToast(error.response?.data?.message || "Erro ao consultar inadimplência.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarInadimplentes();
  };

  const abrirModalBloqueio = (cliente: ClienteInadimplente, acao: 'bloquear' | 'desbloquear') => {
    setModalCliente(cliente);
    setModalAcao(acao);
    setMotivoSelecionado(PRESET_MOTIVOS[0]);
    setMotivoCustomizado('');
  };

  const confirmarAcaoBloqueio = async () => {
    if (!modalCliente) return;

    setSubmittingBloqueio(true);
    try {
      const novoStatus = modalAcao === 'bloquear';
      const motivoFinal = novoStatus 
        ? (motivoCustomizado.trim() ? motivoCustomizado.trim() : motivoSelecionado)
        : null;

      await api.patch(`/api/admin/clientes/${modalCliente.id}/bloqueio`, {
        bloqueadoEncomendas: novoStatus,
        motivoBloqueio: motivoFinal
      });

      showToast(
        novoStatus 
          ? `🚫 Cliente ${modalCliente.nome} foi bloqueado para novas encomendas.`
          : `✅ Cliente ${modalCliente.nome} foi desbloqueado com sucesso!`
      );

      // Atualizar lista local
      setClientes(prev => prev.map(c => {
        if (c.id === modalCliente.id) {
          return {
            ...c,
            bloqueadoEncomendas: novoStatus,
            motivoBloqueio: motivoFinal || undefined
          };
        }
        return c;
      }));

      setModalCliente(null);
    } catch (error: any) {
      console.error("Erro ao alternar bloqueio:", error);
      showToast(error.response?.data?.message || "Não foi possível atualizar o bloqueio.", 'error');
    } finally {
      setSubmittingBloqueio(false);
    }
  };

  const handleEnviarNotificacaoCobranca = async (cliente: ClienteInadimplente) => {
    if (!cliente.email) {
      showToast(`O cliente ${cliente.nome} não possui e-mail cadastrado.`, 'error');
      return;
    }

    if (!confirm(`Deseja enviar um e-mail de aviso de débito (R$ ${cliente.valorTotalDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) para ${cliente.email}?`)) {
      return;
    }

    setSendingEmailId(cliente.id);
    try {
      const res = await api.post(`/api/admin/clientes/${cliente.id}/notificar-cobranca`);
      showToast(`📧 E-mail de notificação enviado para ${cliente.email}!`);
    } catch (error: any) {
      console.error("Erro ao enviar notificação de cobrança:", error);
      showToast(error.response?.data?.message || "Erro ao enviar e-mail de notificação.", 'error');
    } finally {
      setSendingEmailId(null);
    }
  };

  // KPIs
  const totalInadimplentes = clientes.length;
  const totalDevido = clientes.reduce((acc, c) => acc + (c.valorTotalDevido || 0), 0);
  const totalBloqueados = clientes.filter(c => c.bloqueadoEncomendas).length;
  const totalRiscoAlto = clientes.filter(c => c.qtdEncomendasPendentes >= 2 || c.qtdEncomendasAtraso >= 2).length;

  return (
    <div className={styles.container}>

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <FaCheckCircle size={20} /> : <FaExclamationTriangle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>
            <FaUserSlash /> Gestão de Inadimplência e Bloqueio de Clientes
          </h1>
          <p>
            Monitore clientes em atraso ou débito, gerencie restrições de novos pedidos online e envie lembretes de pagamento.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#FFF5F5', color: '#C53030' }}>
            <FaUserSlash />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Inadimplentes</span>
            <span className={styles.kpiValue}>{totalInadimplentes}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#FEF3C7', color: '#D97706' }}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Valor Total em Débito</span>
            <span className={styles.kpiValue} style={{ color: '#DC2626' }}>
              R$ {totalDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#FEE2E2', color: '#991B1B' }}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Risco Alto (2+ Pedidos)</span>
            <span className={styles.kpiValue} style={{ color: '#991B1B' }}>{totalRiscoAlto}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <FaLock />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Clientes Bloqueados</span>
            <span className={styles.kpiValue}>{totalBloqueados}</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterCard}>
        <form onSubmit={handleBuscar} className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Buscar cliente por Nome ou CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </form>

        <div className={styles.filterControls}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox"
              className={styles.checkboxInput}
              checked={apenasBloqueados}
              onChange={e => setApenasBloqueados(e.target.checked)}
            />
            <span>Apenas Bloqueados</span>
          </label>

          <button 
            type="button" 
            className={styles.refreshBtn}
            onClick={carregarInadimplentes}
            title="Recarregar dados"
          >
            <FaRedo /> Atualizar
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>
            Consultando registros de inadimplência...
          </div>
        ) : clientes.length === 0 ? (
          <div className={styles.emptyState}>
            <FaCheckCircle size={54} color="#10B981" />
            <h3>Nenhum cliente inadimplente encontrado!</h3>
            <p>Não há clientes em débito com os filtros atuais selecionados.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>ID</th>
                  <th>Cliente</th>
                  <th>CPF</th>
                  <th>Contato</th>
                  <th>Pendências</th>
                  <th>Total Devido</th>
                  <th>Bloqueio</th>
                  <th>Motivo</th>
                  <th style={{ textAlign: 'right', minWidth: '190px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => {
                  const isHighRisk = cliente.qtdEncomendasPendentes >= 2 || cliente.qtdEncomendasAtraso >= 2;

                  return (
                    <tr key={cliente.id}>
                      <td style={{ fontWeight: '700', color: '#718096' }}>#{cliente.id}</td>
                      <td>
                        <div className={styles.clientName}>{cliente.nome}</div>
                        {cliente.email && <div className={styles.clientEmail}>{cliente.email}</div>}
                      </td>
                      <td>
                        <span className={styles.cpfText}>{cliente.cpf || 'Não informado'}</span>
                      </td>
                      <td>
                        <div className={styles.phoneText}>
                          {cliente.telefone ? (
                            <>
                              <FaPhone style={{ fontSize: '0.75rem', color: '#7A1C31' }} />
                              {cliente.telefone}
                            </>
                          ) : (
                            <span style={{ color: '#A0AEC0' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {isHighRisk ? (
                            <span className={`${styles.badge} ${styles.badgeRiskHigh}`}>
                              ⚠️ Risco Alto ({cliente.qtdEncomendasPendentes} pendentes)
                            </span>
                          ) : cliente.qtdEncomendasPendentes === 1 ? (
                            <span className={`${styles.badge} ${styles.badgePendingSingle}`}>
                              ℹ️ 1 Pedido Pendente
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#718096' }}>Sem pendências ativas</span>
                          )}

                          {cliente.qtdEncomendasAtraso > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaClock /> {cliente.qtdEncomendasAtraso} com data expirada
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.debtAmount}>
                          R$ {cliente.valorTotalDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        {cliente.bloqueadoEncomendas ? (
                          <span className={`${styles.badge} ${styles.badgeBlocked}`}>
                            <FaLock size={10} /> Bloqueado
                          </span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeClear}`}>
                            <FaCheckCircle size={10} /> Liberado
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.motivoText} title={cliente.motivoBloqueio || ''}>
                          {cliente.motivoBloqueio || <span style={{ color: '#CBD5E0' }}>-</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionGroup} style={{ justifyContent: 'flex-end' }}>
                          
                          {/* Botão Bloquear / Desbloquear */}
                          {cliente.bloqueadoEncomendas ? (
                            <button
                              className={styles.btnActionUnblock}
                              onClick={() => abrirModalBloqueio(cliente, 'desbloquear')}
                              title="Desbloquear cliente para encomendas"
                            >
                              <FaLockOpen /> Desbloquear
                            </button>
                          ) : (
                            <button
                              className={styles.btnActionBlock}
                              onClick={() => abrirModalBloqueio(cliente, 'bloquear')}
                              title="Bloquear cliente para novas encomendas"
                            >
                              <FaLock /> Bloquear
                            </button>
                          )}

                          {/* Botão Notificar E-mail */}
                          <button
                            className={styles.btnActionEmail}
                            onClick={() => handleEnviarNotificacaoCobranca(cliente)}
                            disabled={sendingEmailId === cliente.id || !cliente.email || cliente.valorTotalDevido <= 0}
                            title={cliente.email ? "Enviar aviso de débito por e-mail" : "Cliente sem e-mail cadastrado"}
                          >
                            <FaEnvelope />
                            {sendingEmailId === cliente.id ? "Enviando..." : "Cobrar"}
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Bloqueio / Desbloqueio */}
      {modalCliente && (
        <div className={styles.modalOverlay} onClick={() => setModalCliente(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {modalAcao === 'bloquear' ? (
                  <>
                    <FaLock style={{ color: '#DC2626' }} /> Bloquear Cliente para Encomendas
                  </>
                ) : (
                  <>
                    <FaLockOpen style={{ color: '#10B981' }} /> Desbloquear Cliente
                  </>
                )}
              </div>
              <button className={styles.closeModalBtn} onClick={() => setModalCliente(null)}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalClientBox}>
              <div className={styles.modalClientName}>{modalCliente.nome}</div>
              <div className={styles.modalClientMeta}>
                CPF: {modalCliente.cpf || 'Não informado'} | Total em Débito: R$ {modalCliente.valorTotalDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {modalAcao === 'bloquear' ? (
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '8px' }}>
                  Selecione o Motivo do Bloqueio:
                </label>
                
                <div className={styles.presetReasons}>
                  {PRESET_MOTIVOS.map((motivo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.presetBtn} ${motivoSelecionado === motivo ? styles.presetBtnActive : ''}`}
                      onClick={() => {
                        setMotivoSelecionado(motivo);
                        setMotivoCustomizado('');
                      }}
                    >
                      {motivo}
                    </button>
                  ))}
                </div>

                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A5568', display: 'block', marginBottom: '6px' }}>
                  Ou especifique um motivo personalizado:
                </label>
                <textarea
                  className={styles.textareaMotivo}
                  rows={2}
                  placeholder="Ex: Não compareceu para retirar encomenda #102..."
                  value={motivoCustomizado}
                  onChange={e => setMotivoCustomizado(e.target.value)}
                />
              </div>
            ) : (
              <p style={{ color: '#4A5568', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Tem certeza que deseja restabelecer a permissão de <strong>{modalCliente.nome}</strong> para realizar novas encomendas online pelo portal?
              </p>
            )}

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.btnCancel}
                onClick={() => setModalCliente(null)}
                disabled={submittingBloqueio}
              >
                Cancelar
              </button>

              {modalAcao === 'bloquear' ? (
                <button
                  type="button"
                  className={styles.btnConfirmDanger}
                  onClick={confirmarAcaoBloqueio}
                  disabled={submittingBloqueio}
                >
                  <FaLock />
                  {submittingBloqueio ? "Bloqueando..." : "Confirmar Bloqueio"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnConfirmSuccess}
                  onClick={confirmarAcaoBloqueio}
                  disabled={submittingBloqueio}
                >
                  <FaLockOpen />
                  {submittingBloqueio ? "Desbloqueando..." : "Confirmar Desbloqueio"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
