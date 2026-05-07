"use client"
import { useEffect, useState } from 'react';
import { FiArchive, FiSearch, FiPrinter, FiCalendar } from 'react-icons/fi';
import api from '@/services/api';
import styles from './historico.module.css';

interface ItemEncomenda {
  id: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

interface Encomenda {
  id: number;
  clienteNome: string;
  clienteTelefone: string;
  dataEntrega: string;
  dataEntregaReal?: string;
  pagamentoForma?: string;
  usuarioEntregaNome?: string;
  status: number;
  valorTotal: number;
  observacao?: string;
  itens: ItemEncomenda[];
}

export default function HistoricoPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [modalEnc, setModalEnc] = useState<Encomenda | null>(null);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const response = await api.get('/api/Encomenda/detalhes');
      const data: Encomenda[] = response.data;
      
      // Filtra apenas Entregue (4) ou Cancelado (3)
      const filtradas = data.filter(enc => enc.status === 4 || enc.status === 3);
      
      // Ordena por data decrescente (mais recentes primeiro)
      filtradas.sort((a, b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime());
      
      setEncomendas(filtradas);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'Não registrada';
    const data = new Date(dataStr);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataFormatada} às ${hora}`;
  };

  const statusMap = {
    3: { label: 'Cancelado', class: styles.statusCancelado },
    4: { label: 'Entregue', class: styles.statusEntregue }
  };

  const filteredList = encomendas.filter(enc => {
    const matchName = enc.clienteNome.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchDate = true;
    if (dataInicio || dataFim) {
      const encDate = new Date(enc.dataEntrega);
      encDate.setHours(0,0,0,0);
      
      if (dataInicio) {
        const start = new Date(dataInicio);
        // Considerando problemas com fuso horário no date input
        const timezoneOffset = start.getTimezoneOffset() * 60000;
        const adjustedStart = new Date(start.getTime() + timezoneOffset);
        if (encDate < adjustedStart) matchDate = false;
      }
      
      if (dataFim) {
        const end = new Date(dataFim);
        const timezoneOffset = end.getTimezoneOffset() * 60000;
        const adjustedEnd = new Date(end.getTime() + timezoneOffset);
        if (encDate > adjustedEnd) matchDate = false;
      }
    }
    
    return matchName && matchDate;
  });

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className={styles.container}><p style={{padding: 40}}>Carregando histórico...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FiArchive style={{ marginRight: '10px' }} />
          Histórico de Encomendas
        </h1>
        <p className={styles.subtitle}>Consulte pedidos finalizados (Entregues ou Cancelados).</p>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.searchField}>
          <FiSearch className={styles.icon} />
          <input 
            type="text" 
            placeholder="Buscar por nome do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.dateFilters}>
          <div className={styles.dateField}>
            <FiCalendar className={styles.icon} />
            <input 
              type="date" 
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              title="Data Inicial"
            />
          </div>
          <span style={{color: '#666'}}>até</span>
          <div className={styles.dateField}>
            <FiCalendar className={styles.icon} />
            <input 
              type="date" 
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              title="Data Final"
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {filteredList.length === 0 ? (
          <div className={styles.emptyState}>Nenhum registro encontrado para estes filtros.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cód.</th>
                <th>Cliente</th>
                <th>Data Combinada</th>
                <th>Status</th>
                <th>Valor Total</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((enc) => (
                <tr key={enc.id} className={styles.tableRow}>
                  <td>#{enc.id.toString().padStart(4, '0')}</td>
                  <td className={styles.fwBold}>{enc.clienteNome}</td>
                  <td>{formatarData(enc.dataEntrega)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${statusMap[enc.status as 3|4].class}`}>
                      {statusMap[enc.status as 3|4].label}
                    </span>
                  </td>
                  <td className={styles.fwBold} style={{color: '#5B0A1A'}}>
                    R$ {enc.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <button className={styles.btnVer} onClick={() => setModalEnc(enc)}>Ver Resumo</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalEnc && (
        <div className={styles.modalOverlay} onClick={() => setModalEnc(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Resumo do Pedido #{modalEnc.id.toString().padStart(4, '0')}</h2>
              <button className={styles.btnClose} onClick={() => setModalEnc(null)}>&times;</button>
            </div>
            
            <div className={styles.printArea}>
              <div className={styles.receiptHeader}>
                <h3 style={{margin: 0, color: '#5B0A1A'}}>SGEP - Sabor de Mel</h3>
                <p style={{margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666'}}>Comprovante de Encomenda</p>
              </div>

              <div className={styles.infoSection}>
                <p><strong>Cliente:</strong> {modalEnc.clienteNome}</p>
                <p><strong>Telefone:</strong> {modalEnc.clienteTelefone || 'Não informado'}</p>
                <p><strong>Status:</strong> {statusMap[modalEnc.status as 3|4].label}</p>
                <p><strong>Agendado para:</strong> {formatarData(modalEnc.dataEntrega)}</p>
                {modalEnc.status === 4 && (
                  <p>
                    <strong>Retirado em:</strong> {formatarData(modalEnc.dataEntregaReal)} 
                    {modalEnc.usuarioEntregaNome && ` por ${modalEnc.usuarioEntregaNome}`}
                    {modalEnc.dataEntregaReal && new Date(modalEnc.dataEntregaReal) < new Date(modalEnc.dataEntrega) && (
                      <span title="Entrega realizada antes do prazo!" style={{color: '#22c55e', marginLeft: '6px', fontWeight: 'bold'}}>
                        ⚡
                      </span>
                    )}
                  </p>
                )}
                <p><strong>Pagamento:</strong> {modalEnc.pagamentoForma || 'Não informada'}</p>
              </div>

              <div className={styles.itemsSection}>
                <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px'}}>Itens do Pedido</h4>
                <ul className={styles.itemList}>
                  {modalEnc.itens?.map(item => (
                    <li key={item.id} className={styles.itemRow}>
                      <span>{item.quantidade}x {item.produtoNome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {modalEnc.observacao && (
                <div className={styles.obsSection}>
                  <strong>Observação:</strong> {modalEnc.observacao}
                </div>
              )}

              <div className={styles.totalSection}>
                <span>Total Pago:</span>
                <span style={{fontSize: '1.4rem'}}>R$ {modalEnc.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnPrint} onClick={handlePrint}>
                <FiPrinter size={18} />
                Gerar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
