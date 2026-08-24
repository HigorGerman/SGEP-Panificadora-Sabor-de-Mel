"use client";

import { useEffect, useState } from 'react';
import { 
  FaSearch, FaCashRegister, FaClock, FaUser, FaPhone, 
  FaCheckCircle, FaTimes, FaMoneyBillWave, FaCreditCard, 
  FaQrcode, FaExchangeAlt, FaReceipt, FaExclamationCircle
} from 'react-icons/fa';
import api from '@/services/api';
import styles from './cobranca.module.css';

interface ItemPendente {
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  especificacoesTecnicas?: string;
}

interface EncomendaPendente {
  encomendaId: number;
  clienteId?: number;
  clienteNome: string;
  clienteCpf: string;
  clienteTelefone: string;
  dataRetirada: string;
  valorTotal: number;
  saldoDevedor: number;
  statusPagamento: string;
  formaPagamento: string;
  observacao?: string;
  itens: ItemPendente[];
}

export default function AdminCobrancaPage() {
  const [pendentes, setPendentes] = useState<EncomendaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Liquidação / Dar Baixa no Caixa
  const [selectedEncomenda, setSelectedEncomenda] = useState<EncomendaPendente | null>(null);
  const [formaPagamentoSelecao, setFormaPagamentoSelecao] = useState<string>('Dinheiro');
  const [processing, setProcessing] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    carregarPendentes();
    const interval = setInterval(carregarPendentes, 15000); // Auto refresh a cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  const carregarPendentes = async () => {
    try {
      const response = await api.get('/api/pagamentos/pendentes');
      setPendentes(response.data);
    } catch (error) {
      console.error("Erro ao carregar pendências de pagamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenModal = (enc: EncomendaPendente) => {
    setSelectedEncomenda(enc);
    setFormaPagamentoSelecao('Dinheiro');
  };

  const handleLiquidarPagamento = async () => {
    if (!selectedEncomenda) return;

    setProcessing(true);
    try {
      await api.post('/api/pagamentos/liquidar', {
        encomendaId: selectedEncomenda.encomendaId,
        formaPagamento: formaPagamentoSelecao,
        caixaId: null
      });

      showToast(`✅ Pagamento da Encomenda #${selectedEncomenda.encomendaId} liquidado com sucesso (${formaPagamentoSelecao})!`);
      
      // Remover da lista local em tempo real
      setPendentes(prev => prev.filter(p => p.encomendaId !== selectedEncomenda.encomendaId));
      setSelectedEncomenda(null);
    } catch (error: any) {
      console.error("Erro ao liquidar pagamento:", error);
      alert(error.response?.data?.erro || error.response?.data?.message || "Ocorreu um erro ao dar baixa no pagamento.");
    } finally {
      setProcessing(false);
    }
  };

  const formatarDataHora = (dataStr: string) => {
    try {
      const d = new Date(dataStr);
      const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${dia} às ${hora}`;
    } catch (e) {
      return dataStr;
    }
  };

  const formatSpecs = (specsStr?: string) => {
    if (!specsStr) return null;
    try {
      const obj = JSON.parse(specsStr);
      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj)
          .filter(([_, v]) => Boolean(v))
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
      }
    } catch (e) { }
    return specsStr;
  };

  // Filtrar encomendas por Nome, CPF ou ID da Encomenda
  const filteredPendentes = pendentes.filter(enc => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const idMatch = enc.encomendaId.toString().includes(term) || `#${enc.encomendaId}`.includes(term);
    const nomeMatch = enc.clienteNome.toLowerCase().includes(term);
    const cpfMatch = enc.clienteCpf && enc.clienteCpf.includes(term);
    return idMatch || nomeMatch || cpfMatch;
  });

  return (
    <div className={styles.container}>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastContainer}>
          <div className={styles.toastSuccess}>
            <FaCheckCircle style={{ fontSize: '1.4rem' }} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>
            <FaCashRegister /> Cobrança & Liquidação na Retirada
          </h1>
          <p>Painel do Caixa para receber e dar baixa em encomendas presenciais no balcão.</p>
        </div>

        <div className={styles.statsPill}>
          <FaReceipt />
          <span>{filteredPendentes.length} {filteredPendentes.length === 1 ? 'pendência' : 'pendências'} na fila</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchBar}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filtrar por Nome do Cliente, CPF ou Número da Encomenda (#ID)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Encomendas Pendentes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#718096', fontSize: '1.1rem' }}>
          Carregando encomendas pendentes...
        </div>
      ) : filteredPendentes.length === 0 ? (
        <div className={styles.emptyState}>
          <FaCheckCircle size={54} color="#10B981" />
          <h3>Nenhum pagamento pendente no balcão!</h3>
          <p>Todas as encomendas agendadas estão pagas ou a lista de busca não retornou resultados.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPendentes.map(enc => (
            <div key={enc.encomendaId} className={styles.card}>
              
              {/* Card Header Ribbon */}
              <div className={styles.cardHeader}>
                <span className={styles.orderId}>#{enc.encomendaId}</span>
                <span className={styles.pickupTime}>
                  <FaClock /> {formatarDataHora(enc.dataRetirada)}
                </span>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>

                {/* Cliente Details */}
                <div className={styles.clientInfo}>
                  <div className={styles.clientName}>
                    <FaUser style={{ marginRight: '6px', color: '#7A1C31' }} />
                    {enc.clienteNome}
                  </div>
                  <div className={styles.clientMeta}>
                    <span><strong>CPF:</strong> {enc.clienteCpf}</span>
                    {enc.clienteTelefone && (
                      <span><FaPhone style={{ fontSize: '0.75rem', marginRight: '3px' }} />{enc.clienteTelefone}</span>
                    )}
                  </div>
                </div>

                {/* Itens da Encomenda */}
                <div>
                  <div className={styles.itemsSectionTitle}>Itens Solicitados:</div>
                  <ul className={styles.itemList}>
                    {enc.itens?.map((item, idx) => {
                      const specs = formatSpecs(item.especificacoesTecnicas);
                      return (
                        <li key={idx} className={styles.itemRow}>
                          <div className={styles.itemDetails}>
                            <span className={styles.itemName}>{item.quantidade}x {item.produtoNome}</span>
                            {specs && <span className={styles.itemSpecs}>📝 {specs}</span>}
                          </div>
                          <span className={styles.itemPrice}>
                            R$ {(item.precoUnitario * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Observações da Encomenda */}
                {enc.observacao && (
                  <div className={styles.obsBox}>
                    <strong>Observação:</strong> {enc.observacao}
                  </div>
                )}

                {/* Destaque para Saldo Devedor */}
                <div className={styles.saldoBox}>
                  <div>
                    <div className={styles.saldoLabel}>Saldo a Cobrar no Balcão:</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>Total do pedido: R$ {enc.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className={styles.saldoValue}>
                    R$ {enc.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

              </div>

              {/* Card Action */}
              <div className={styles.cardFooter}>
                <button
                  className={styles.btnLiquidar}
                  onClick={() => handleOpenModal(enc)}
                >
                  <FaCashRegister /> Registrar Pagamento na Retirada
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal de Liquidação / Baixa no Caixa */}
      {selectedEncomenda && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEncomenda(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                Registrar Pagamento - Encomenda #{selectedEncomenda.encomendaId}
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedEncomenda(null)}>
                <FaTimes />
              </button>
            </div>

            {/* Resumo do Cliente e Valor */}
            <div style={{ background: '#FAF6F0', padding: '16px', borderRadius: '14px', borderLeft: '4px solid #7A1C31' }}>
              <div style={{ fontWeight: '800', color: '#2D3748', fontSize: '1.05rem' }}>
                {selectedEncomenda.clienteNome}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '2px' }}>
                CPF: {selectedEncomenda.clienteCpf} | Retirada: {formatarDataHora(selectedEncomenda.dataRetirada)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #CBD5E0' }}>
                <span style={{ fontWeight: '700', color: '#4A5568' }}>Valor a Receber no Caixa:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#DC2626' }}>
                  R$ {selectedEncomenda.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Seletor de Meio de Pagamento Físico */}
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '10px' }}>
                Selecione a Forma de Pagamento Recebida:
              </label>

              <div className={styles.paymentGrid}>
                
                <div
                  className={`${styles.paymentCard} ${formaPagamentoSelecao === 'Dinheiro' ? styles.paymentCardSelected : ''}`}
                  onClick={() => setFormaPagamentoSelecao('Dinheiro')}
                >
                  <FaMoneyBillWave className={styles.paymentCardIcon} color={formaPagamentoSelecao === 'Dinheiro' ? '#10B981' : '#4A5568'} />
                  <span className={styles.paymentCardLabel}>Dinheiro</span>
                </div>

                <div
                  className={`${styles.paymentCard} ${formaPagamentoSelecao === 'Cartão de Débito' ? styles.paymentCardSelected : ''}`}
                  onClick={() => setFormaPagamentoSelecao('Cartão de Débito')}
                >
                  <FaCreditCard className={styles.paymentCardIcon} color={formaPagamentoSelecao === 'Cartão de Débito' ? '#10B981' : '#4A5568'} />
                  <span className={styles.paymentCardLabel}>Cartão Débito</span>
                </div>

                <div
                  className={`${styles.paymentCard} ${formaPagamentoSelecao === 'Cartão de Crédito' ? styles.paymentCardSelected : ''}`}
                  onClick={() => setFormaPagamentoSelecao('Cartão de Crédito')}
                >
                  <FaCreditCard className={styles.paymentCardIcon} color={formaPagamentoSelecao === 'Cartão de Crédito' ? '#10B981' : '#4A5568'} />
                  <span className={styles.paymentCardLabel}>Cartão Crédito</span>
                </div>

                <div
                  className={`${styles.paymentCard} ${formaPagamentoSelecao === 'Pix Balcão' ? styles.paymentCardSelected : ''}`}
                  onClick={() => setFormaPagamentoSelecao('Pix Balcão')}
                >
                  <FaQrcode className={styles.paymentCardIcon} color={formaPagamentoSelecao === 'Pix Balcão' ? '#10B981' : '#4A5568'} />
                  <span className={styles.paymentCardLabel}>Pix Balcão</span>
                </div>

              </div>
            </div>

            {/* Modal Actions */}
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                disabled={processing}
                onClick={() => setSelectedEncomenda(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnConfirm}
                disabled={processing}
                onClick={handleLiquidarPagamento}
              >
                <FaCheckCircle />
                {processing ? "Gravando Baixa..." : "Confirmar e Dar Baixa"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
