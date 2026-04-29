"use client";
import { useState, useEffect } from 'react';
import api from '@/services/api';
import styles from './minhas-encomendas.module.css';

interface Encomenda {
  id: number;
  clienteId: number;
  dataEntrega: string;
  status: number;
  valorTotal: number;
  observacao?: string;
}

export default function MinhasEncomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const fetchEncomendas = async () => {
    try {
      const usuarioId = localStorage.getItem('usuario_id');
      const tipo = localStorage.getItem('usuario_tipo');
      if (!usuarioId) return;

      const res = await api.get('/api/Encomenda');
      // Filtra apenas as encomendas do cliente logado
      const minhas = res.data.filter((e: any) => {
        if (tipo === 'Usuario') return e.usuarioId === parseInt(usuarioId);
        return e.clienteId === parseInt(usuarioId);
      });
      setEncomendas(minhas);
    } catch (error) {
      console.error("Erro ao carregar encomendas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id: number) => {
    if (confirm("Tem certeza que deseja cancelar esta encomenda?")) {
      try {
        await api.delete(`/api/Encomenda/${id}`);
        alert("Encomenda cancelada com sucesso.");
        fetchEncomendas();
      } catch (error) {
        console.error(error);
        alert("Erro ao cancelar encomenda.");
      }
    }
  };

  const handleEditar = (id: number) => {
    alert("Função de edição será implementada em breve! Por favor cancele e faça uma nova se precisar.");
  };

  const podeAlterar = (dataEntrega: string) => {
    const dataAlvo = new Date(dataEntrega);
    const agora = new Date();
    // Diferença em horas
    const diffHoras = (dataAlvo.getTime() - agora.getTime()) / (1000 * 60 * 60);
    return diffHoras >= 24;
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.emptyState}>Carregando...</div></div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Minhas Encomendas</h1>
      
      <div className={styles.list}>
        {encomendas.length === 0 ? (
          <div className={styles.emptyState}>Você ainda não realizou nenhuma encomenda.</div>
        ) : (
          encomendas.map(enc => {
            const alteracaoPermitida = podeAlterar(enc.dataEntrega);
            const dataFormatada = new Date(enc.dataEntrega).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            const getStatusName = (status: number) => {
              switch(status) {
                case 0: return 'Pendente';
                case 1: return 'Em Produção';
                case 2: return 'Finalizada';
                case 3: return 'Cancelada';
                default: return 'Desconhecido';
              }
            };

            return (
              <div key={enc.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <div className={styles.headerInfo}>
                    <span className={styles.date}>Para: {dataFormatada}</span>
                    <span className={styles.status}>Status: {getStatusName(enc.status)}</span>
                  </div>
                  <div className={styles.details}>
                    Pedido #{enc.id} {enc.observacao ? `| Obs: ${enc.observacao}` : ''}
                  </div>
                  <div className={styles.total}>
                    Total: R$ {enc.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className={styles.actions}>
                  {alteracaoPermitida ? (
                    <div className={styles.btnGroup}>
                      <button className={styles.btnEdit} onClick={() => handleEditar(enc.id)}>Editar</button>
                      <button className={styles.btnDelete} onClick={() => handleExcluir(enc.id)}>Cancelar</button>
                    </div>
                  ) : (
                    <div className={styles.badgeBlocked}>
                      Em Produção - Cancelamento Bloqueado
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
