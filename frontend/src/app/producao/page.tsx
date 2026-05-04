"use client"
import { useEffect, useState } from 'react';
import api from '@/services/api';
import styles from './producao.module.css';

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
  itens: ItemEncomenda[];
}

export default function ProducaoPage() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [filtroData, setFiltroData] = useState<'hoje' | 'amanha' | 'pendentes'>('hoje');
  const [loading, setLoading] = useState(true);
  const [telefoneModal, setTelefoneModal] = useState<{nome: string, telefone: string} | null>(null);

  useEffect(() => {
    carregarEncomendas();
    // Auto-refresh a cada 30 segundos (painel de dashboard)
    const interval = setInterval(carregarEncomendas, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarEncomendas = async () => {
    try {
      const response = await api.get('/api/Encomenda/detalhes');
      setEncomendas(response.data);
    } catch (error) {
      console.error("Erro ao carregar encomendas", error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: number, novoStatus: number) => {
    try {
      await api.patch(`/api/Encomenda/${id}/status`, { status: novoStatus });
      carregarEncomendas();
    } catch (error) {
      alert("Erro ao atualizar status.");
    }
  };

  const filtrarEncomendas = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return encomendas.filter(enc => {
      const dataEnc = new Date(enc.dataEntrega);
      const isHoje = dataEnc.toDateString() === hoje.toDateString();
      const isAmanha = dataEnc.toDateString() === amanha.toDateString();

      if (filtroData === 'hoje') return isHoje;
      if (filtroData === 'amanha') return isAmanha;
      if (filtroData === 'pendentes') return enc.status === 0 || enc.status === 1; 
      
      return true;
    });
  };

  const formatarDataHora = (dataStr: string) => {
    const data = new Date(dataStr);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const dataApenas = new Date(data);
    dataApenas.setHours(0,0,0,0);
    
    if (dataApenas.getTime() === hoje.getTime()) {
        return `Hoje às ${hora}`;
    } else if (dataApenas.getTime() === amanha.getTime()) {
        return `Amanhã às ${hora}`;
    } else {
        return `${data.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} às ${hora}`;
    }
  };

  if (loading) return <p style={{padding: 40}}>Carregando dashboard de produção...</p>;

  const encomendasFiltradas = filtrarEncomendas();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Painel de Produção</h1>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filtroData === 'hoje' ? styles.filterBtnActive : ''}`}
            onClick={() => setFiltroData('hoje')}
          >
            Hoje
          </button>
          <button 
            className={`${styles.filterBtn} ${filtroData === 'amanha' ? styles.filterBtnActive : ''}`}
            onClick={() => setFiltroData('amanha')}
          >
            Amanhã
          </button>
          <button 
            className={`${styles.filterBtn} ${filtroData === 'pendentes' ? styles.filterBtnActive : ''}`}
            onClick={() => setFiltroData('pendentes')}
          >
            Todas Pendentes
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {encomendasFiltradas.length === 0 ? (
          <p style={{fontSize: '1.2rem', color: '#666'}}>Nenhuma encomenda para o filtro selecionado.</p>
        ) : (
          encomendasFiltradas.map((enc) => {
            // Status cancelado ou entregue não entram no dashboard
            if (enc.status === 3 || enc.status === 4) return null; 
            
            let statusClass = styles.status0;
            let statusText = "Pendente";
            if (enc.status === 1) { statusClass = styles.status1; statusText = "Em Produção"; }
            if (enc.status === 2) { statusClass = styles.status2; statusText = "Pronto para Retirada"; }

            return (
              <div key={enc.id} className={styles.card}>
                <div className={`${styles.cardHeader} ${statusClass}`}>
                  <span>{formatarDataHora(enc.dataEntrega)}</span>
                  <span style={{fontSize: '1rem'}}>{statusText}</span>
                </div>
                
                <div className={styles.cardBody}>
                  <div 
                    className={styles.clientName} 
                    onClick={() => setTelefoneModal({ nome: enc.clienteNome, telefone: enc.clienteTelefone || 'Não informado' })}
                    title="Clique para ver o contato do cliente"
                  >
                    {enc.clienteNome}
                  </div>
                  
                  <ul className={styles.itemList}>
                    {enc.itens?.map(item => (
                      <li key={item.id} className={styles.item}>
                        <strong>{item.quantidade}x</strong>&nbsp;{item.produtoNome}
                      </li>
                    ))}
                  </ul>
                  
                  {enc.observacao && (
                    <p style={{marginTop: '15px', color: '#eab308', fontStyle: 'italic', fontSize: '1.1rem'}}>
                      <strong>Obs:</strong> {enc.observacao}
                    </p>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  {enc.status === 0 && (
                    <button className={`${styles.actionBtn} ${styles.btnStart}`} onClick={() => atualizarStatus(enc.id, 1)}>
                      Iniciar Produção
                    </button>
                  )}
                  {enc.status === 1 && (
                    <button className={`${styles.actionBtn} ${styles.btnFinish}`} onClick={() => atualizarStatus(enc.id, 2)}>
                      Marcar como Pronto
                    </button>
                  )}
                  {enc.status === 2 && (
                    <button className={`${styles.actionBtn} ${styles.btnDeliver}`} onClick={() => atualizarStatus(enc.id, 4)}>
                      Confirmar Entrega
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {telefoneModal && (
        <div className={styles.modalOverlay} onClick={() => setTelefoneModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>Contato do Cliente</h2>
            <p><strong>{telefoneModal.nome}</strong></p>
            <p style={{fontSize: '1.8rem', color: '#5B0A1A', fontWeight: 'bold', margin: '20px 0'}}>
              {telefoneModal.telefone}
            </p>
            <button className={styles.btnClose} onClick={() => setTelefoneModal(null)}>Voltar à Produção</button>
          </div>
        </div>
      )}
    </div>
  );
}
