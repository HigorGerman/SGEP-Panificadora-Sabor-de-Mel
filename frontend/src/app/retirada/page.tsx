"use client"
import { useEffect, useState } from 'react';
import { FiShoppingBag, FiPackage, FiClock } from 'react-icons/fi';
import api from '@/services/api';
import styles from './retirada.module.css';

interface ItemEncomenda {
  id: number;
  produtoNome: string;
  quantidade: number;
}

interface Encomenda {
  id: number;
  clienteNome: string;
  clienteTelefone: string;
  dataEntrega: string;
  status: number;
  valorTotal: number;
  observacao?: string;
  itens: ItemEncomenda[];
}

export default function RetiradaPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmarEntregaModal, setConfirmarEntregaModal] = useState<Encomenda | null>(null);

  useEffect(() => {
    carregarEncomendas();
    const interval = setInterval(carregarEncomendas, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const carregarEncomendas = async () => {
    try {
      const response = await api.get('/api/Encomenda/detalhes');
      const data: Encomenda[] = response.data;
      // Filtrar apenas status 'Pronto' (status === 2)
      const prontas = data.filter(enc => enc.status === 2);
      setEncomendas(prontas);
    } catch (error) {
      console.error("Erro ao carregar encomendas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEntrega = async (id: number) => {
    try {
      const usuarioId = localStorage.getItem('usuario_id');
      await api.post(`/api/Encomenda/${id}/entrega`, { usuarioId: usuarioId ? parseInt(usuarioId) : null });
      alert("Entrega confirmada com sucesso!");
      setConfirmarEntregaModal(null);
      carregarEncomendas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao registrar entrega. Verifique o pagamento.");
    }
  };

  const formatarDataHora = (dataStr: string) => {
    const data = new Date(dataStr);
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${dataFormatada} às ${hora}`;
  };

  if (loading) return <p style={{ padding: 40, backgroundColor: '#FDFCF5', minHeight: '100vh' }}>Carregando painel de retirada...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FiPackage style={{ marginRight: '10px' }} />
          Painel de Retirada
        </h1>
        <p className={styles.subtitle}>Gerencie as encomendas prontas para entrega no balcão.</p>
      </div>

      <div className={styles.grid}>
        {encomendas.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPackage size={48} color="#ccc" />
            <p>Nenhuma encomenda pronta no momento.</p>
          </div>
        ) : (
          encomendas.map((enc) => (
            <div key={enc.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.clienteNome}>{enc.clienteNome}</div>
                <div className={styles.horarioCombinado}>
                  <FiClock style={{ marginRight: '6px' }} />
                  {formatarDataHora(enc.dataEntrega)}
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.itemsTitle}>Resumo dos Itens:</div>
                <ul className={styles.itemList}>
                  {enc.itens?.map(item => (
                    <li key={item.id} className={styles.item}>
                      <span className={styles.itemQtd}>{item.quantidade}x</span>
                      <span className={styles.itemName}>{item.produtoNome}</span>
                    </li>
                  ))}
                </ul>
                {enc.observacao && (
                  <div className={styles.observacao}>
                    <strong>Obs:</strong> {enc.observacao}
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.btnDeliver} 
                  onClick={() => setConfirmarEntregaModal(enc)}
                >
                  <FiShoppingBag size={20} />
                  Confirmar Entrega
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmarEntregaModal && (
        <div className={styles.modalOverlay} onClick={() => setConfirmarEntregaModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Resumo da Entrega</h2>
            <p className={styles.modalSubtitle}>{confirmarEntregaModal.clienteNome}</p>

            <div className={styles.modalSummaryBox}>
              <ul className={styles.modalItemList}>
                {confirmarEntregaModal.itens?.map(item => (
                  <li key={item.id}>
                    <strong>{item.quantidade}x</strong> {item.produtoNome}
                  </li>
                ))}
              </ul>
              <div className={styles.modalTotalBox}>
                <span>Total a Pagar:</span>
                <span className={styles.modalTotalValue}>
                  R$ {confirmarEntregaModal.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnVoltar} onClick={() => setConfirmarEntregaModal(null)}>
                Voltar
              </button>
              <button
                className={styles.btnConfirmar}
                onClick={() => handleConfirmarEntrega(confirmarEntregaModal.id)}
              >
                <FiShoppingBag size={20} />
                Entregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
