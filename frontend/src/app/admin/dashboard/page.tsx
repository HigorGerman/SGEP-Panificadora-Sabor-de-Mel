"use client";

import { useEffect, useState } from 'react';
import { 
  FaChartLine, FaDollarSign, FaShoppingBag, FaPercentage, 
  FaCalendarAlt, FaPrint, FaTrophy, FaCreditCard, 
  FaClock, FaTimes, FaFileAlt, FaArrowUp, FaChartBar,
  FaSync, FaMoneyBillWave, FaQrcode
} from 'react-icons/fa';
import api from '@/services/api';
import styles from './dashboard.module.css';

interface ProdutoMaisVendido {
  produtoId: number;
  produtoNome: string;
  quantidadeVendida: number;
  valorArrecadado: number;
}

interface PagamentoForma {
  formaPagamento: string;
  quantidade: number;
  valorTotal: number;
}

interface EvolucaoDia {
  data: string;
  valorTotal: number;
  totalEncomendas: number;
}

interface DashboardData {
  faturamentoTotal: number;
  totalEncomendas: number;
  ticketMedio: number;
  pendenteAReceber: number;
  faturamentoDinheiro?: number;
  faturamentoCartao?: number;
  faturamentoPix?: number;
  faturamentoMercadoPago?: number;
  produtosMaisVendidos: ProdutoMaisVendido[];
  pagamentosPorForma: PagamentoForma[];
  evolucaoFaturamento: EvolucaoDia[];
}

export default function AdminDashboardPage() {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'tudo' | 'custom'>('tudo');
  const [dataInicio, setDataInicio] = useState<string>('2026-01-01');
  const [dataFim, setDataFim] = useState<string>('2026-12-31');

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal do Relatório de Fechamento
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Definir datas iniciais padrão cobrindo todo o histórico
    setDataInicio('2026-01-01');
    setDataFim('2026-12-31');
  }, []);

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarDashboard();
    }
  }, [periodo, dataInicio, dataFim]);

  const carregarDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/pagamentos/dashboard', {
        params: {
          dataInicio: dataInicio,
          dataFim: dataFim
        }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodoChange = (opcao: 'hoje' | 'semana' | 'mes' | 'ano' | 'tudo' | 'custom') => {
    setPeriodo(opcao);
    const hoje = new Date();

    if (opcao === 'hoje') {
      const dataStr = hoje.toISOString().split('T')[0];
      setDataInicio(dataStr);
      setDataFim(dataStr);
    } else if (opcao === 'semana') {
      const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDataInicio(seteDiasAtras.toISOString().split('T')[0]);
      setDataFim(hoje.toISOString().split('T')[0]);
    } else if (opcao === 'mes') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(primeiroDia.toISOString().split('T')[0]);
      setDataFim(hoje.toISOString().split('T')[0]);
    } else if (opcao === 'ano') {
      setDataInicio(`${hoje.getFullYear()}-01-01`);
      setDataFim(`${hoje.getFullYear()}-12-31`);
    } else if (opcao === 'tudo') {
      setDataInicio('2025-01-01');
      setDataFim('2026-12-31');
    }
  };

  const formatarValor = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return '';
    try {
      const parts = dataStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) { }
    return dataStr;
  };

  // Calcular valor máximo para escala das barras do gráfico de evolução
  const maxEvolucaoValor = dashboardData?.evolucaoFaturamento && dashboardData.evolucaoFaturamento.length > 0
    ? Math.max(...dashboardData.evolucaoFaturamento.map(d => d.valorTotal))
    : 1;

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>
            <FaChartLine /> Dashboard & Relatórios Estratégicos
          </h1>
          <p>Visão consolidada de faturamento, vendas, ticket médio e pendências da panificadora.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            style={{
              background: 'white',
              color: '#7A1C31',
              border: '1.5px solid #E2E8F0',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
            onClick={carregarDashboard}
            title="Recarregar dados do dashboard"
          >
            <FaSync /> Atualizar Dados
          </button>

          <button 
            className={styles.btnPrintReport}
            onClick={() => setReportModalOpen(true)}
          >
            <FaFileAlt /> Gerar Relatório de Fechamento
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Período Temporal */}
      <div className={styles.filterCard}>
        <div className={styles.filterLabel}>
          <FaCalendarAlt style={{ color: '#7A1C31' }} /> Período da Análise:
        </div>

        <div className={styles.filterPills}>
          <button
            className={`${styles.filterPill} ${periodo === 'tudo' ? styles.filterPillActive : ''}`}
            onClick={() => handlePeriodoChange('tudo')}
          >
            Todo o Histórico
          </button>
          <button
            className={`${styles.filterPill} ${periodo === 'ano' ? styles.filterPillActive : ''}`}
            onClick={() => handlePeriodoChange('ano')}
          >
            Ano Atual (2026)
          </button>
          <button
            className={`${styles.filterPill} ${periodo === 'mes' ? styles.filterPillActive : ''}`}
            onClick={() => handlePeriodoChange('mes')}
          >
            Este Mês
          </button>
          <button
            className={`${styles.filterPill} ${periodo === 'semana' ? styles.filterPillActive : ''}`}
            onClick={() => handlePeriodoChange('semana')}
          >
            Esta Semana
          </button>
          <button
            className={`${styles.filterPill} ${periodo === 'hoje' ? styles.filterPillActive : ''}`}
            onClick={() => handlePeriodoChange('hoje')}
          >
            Hoje
          </button>
          <button
            className={`${styles.filterPill} ${periodo === 'custom' ? styles.filterPillActive : ''}`}
            onClick={() => setPeriodo('custom')}
          >
            Intervalo Personalizado
          </button>
        </div>

        {periodo === 'custom' && (
          <div className={styles.customDateGroup}>
            <input
              type="date"
              className={styles.dateInput}
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
            <span style={{ color: '#A0AEC0', fontWeight: 'bold' }}>até</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className={styles.kpiGrid}>
        
        {/* KPI 1: Faturamento Total */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#D1FAE5', color: '#059669' }}>
            <FaDollarSign />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiTitle}>Faturamento Total</div>
            <div className={styles.kpiValue}>
              R$ {formatarValor(dashboardData?.faturamentoTotal)}
            </div>
            <div className={styles.kpiSubtext}>Entradas confirmadas no período</div>
          </div>
        </div>

        {/* KPI 2: Total de Encomendas */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            <FaShoppingBag />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiTitle}>Total de Encomendas</div>
            <div className={styles.kpiValue}>
              {dashboardData?.totalEncomendas || 0}
            </div>
            <div className={styles.kpiSubtext}>Pedidos registrados no período</div>
          </div>
        </div>

        {/* KPI 3: Ticket Médio */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#F3E8FF', color: '#7E22CE' }}>
            <FaPercentage />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiTitle}>Ticket Médio</div>
            <div className={styles.kpiValue}>
              R$ {formatarValor(dashboardData?.ticketMedio)}
            </div>
            <div className={styles.kpiSubtext}>Média arrecadada por encomenda</div>
          </div>
        </div>

        {/* KPI 4: Pendente a Receber */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <FaClock />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiTitle}>Pendente a Receber</div>
            <div className={styles.kpiValue} style={{ color: '#DC2626' }}>
              R$ {formatarValor(dashboardData?.pendenteAReceber)}
            </div>
            <div className={styles.kpiSubtext}>Saldos a cobrar nas retiradas</div>
          </div>
        </div>

      </div>

      {/* Cards de Divisão por Forma de Pagamento */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 30px auto' }}>
        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#7A1C31', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaCreditCard /> Faturamento Confirmado por Canal / Método de Pagamento:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          <div style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', borderLeft: '4px solid #10B981', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A5568' }}>Dinheiro no Caixa</span>
              <FaMoneyBillWave color="#10B981" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10B981' }}>
              R$ {formatarValor(dashboardData?.faturamentoDinheiro)}
            </div>
          </div>

          <div style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', borderLeft: '4px solid #3B82F6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A5568' }}>Cartão (Débito/Crédito)</span>
              <FaCreditCard color="#3B82F6" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3B82F6' }}>
              R$ {formatarValor(dashboardData?.faturamentoCartao)}
            </div>
          </div>

          <div style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', borderLeft: '4px solid #8B5CF6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A5568' }}>Pix no Balcão</span>
              <FaQrcode color="#8B5CF6" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#8B5CF6' }}>
              R$ {formatarValor(dashboardData?.faturamentoPix)}
            </div>
          </div>

          <div style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', borderLeft: '4px solid #0284C7', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A5568' }}>Mercado Pago Online</span>
              <FaShoppingBag color="#0284C7" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284C7' }}>
              R$ {formatarValor(dashboardData?.faturamentoMercadoPago)}
            </div>
          </div>

        </div>
      </div>

      {/* Gráfico Visual de Evolução do Faturamento por Dia */}
      <div className={styles.chartContainer}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <FaChartBar /> Evolução Diária do Faturamento
          </div>
          <span style={{ fontSize: '0.85rem', color: '#718096' }}>Valores por data de retirada</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>Carregando gráfico...</div>
        ) : !dashboardData?.evolucaoFaturamento || dashboardData.evolucaoFaturamento.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>
            Nenhum dado de faturamento no período selecionado.
          </div>
        ) : (
          <div className={styles.barChart}>
            {dashboardData.evolucaoFaturamento.map((dia, idx) => {
              const pctHeight = Math.max(12, Math.round((dia.valorTotal / maxEvolucaoValor) * 100));
              return (
                <div key={idx} className={styles.barCol}>
                  <div className={styles.barVal}>R$ {Math.round(dia.valorTotal)}</div>
                  <div className={styles.barFill} style={{ height: `${pctHeight}%` }} />
                  <div className={styles.barLabel}>{formatarDataBR(dia.data)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seção 2 Colunas: Ranking de Produtos & Proporção por Pagamento */}
      <div className={styles.dashboardSection}>

        {/* Painel Esquerdo: Ranking de Produtos Mais Vendidos */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <FaTrophy style={{ color: '#D97706' }} /> Produtos Mais Vendidos (Top 10)
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#A0AEC0' }}>Carregando ranking...</div>
          ) : !dashboardData?.produtosMaisVendidos || dashboardData.produtosMaisVendidos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#A0AEC0' }}>Nenhum produto vendido no período.</div>
          ) : (
            <div className={styles.rankingList}>
              {dashboardData.produtosMaisVendidos.map((prod, idx) => (
                <div key={prod.produtoId} className={styles.rankingItem}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.rankingBadge}>{idx + 1}º</span>
                    <span className={styles.rankingName}>{prod.produtoNome}</span>
                  </div>
                  <div className={styles.rankingStats}>
                    <div className={styles.rankingValue}>
                      R$ {formatarValor(prod.valorArrecadado)}
                    </div>
                    <div className={styles.rankingQty}>
                      {prod.quantidadeVendida} {prod.quantidadeVendida === 1 ? 'unidade' : 'unidades'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel Direito: Divisão por Forma de Pagamento */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <FaCreditCard /> Proporção por Forma de Pagamento
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#A0AEC0' }}>Carregando pagamentos...</div>
          ) : !dashboardData?.pagamentosPorForma || dashboardData.pagamentosPorForma.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#A0AEC0' }}>Nenhum registro de pagamento no período.</div>
          ) : (
            <div className={styles.formaList}>
              {dashboardData.pagamentosPorForma.map((item, idx) => {
                const totalFormasSum = dashboardData.pagamentosPorForma.reduce((acc, f) => acc + f.valorTotal, 0);
                const pct = totalFormasSum > 0 ? Math.round((item.valorTotal / totalFormasSum) * 100) : 0;

                return (
                  <div key={idx} className={styles.formaItem}>
                    <div className={styles.formaHeader}>
                      <span>{item.formaPagamento} ({item.quantidade} {item.quantidade === 1 ? 'pedido' : 'pedidos'})</span>
                      <span style={{ color: '#7A1C31' }}>R$ {formatarValor(item.valorTotal)} ({pct}%)</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal do Relatório de Fechamento (Impressão / PDF) */}
      {reportModalOpen && dashboardData && (
        <div className={styles.reportOverlay} onClick={() => setReportModalOpen(false)}>
          <div className={styles.reportModal} onClick={e => e.stopPropagation()}>
            
            <div className={styles.reportHeader}>
              <div>
                <div className={styles.reportTitle}>Relatório de Fechamento Financeiro</div>
                <div style={{ fontSize: '0.88rem', color: '#718096' }}>
                  Panificadora Sabor de Mel - Período: {formatarDataBR(dataInicio)} a {formatarDataBR(dataFim)}
                </div>
              </div>
              <button className={styles.btnPrintReport} style={{ background: '#EDF2F7', color: '#2D3748', boxShadow: 'none' }} onClick={() => setReportModalOpen(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Consolidado em Grid */}
            <div className={styles.reportGrid}>
              <div className={styles.reportField}>
                <span className={styles.reportLabel}>Faturamento Total Confimado:</span>
                <span className={styles.reportValue} style={{ color: '#059669' }}>R$ {formatarValor(dashboardData.faturamentoTotal)}</span>
              </div>
              <div className={styles.reportField}>
                <span className={styles.reportLabel}>Total de Encomendas:</span>
                <span className={styles.reportValue}>{dashboardData.totalEncomendas} pedidos</span>
              </div>
              <div className={styles.reportField}>
                <span className={styles.reportLabel}>Ticket Médio:</span>
                <span className={styles.reportValue}>R$ {formatarValor(dashboardData.ticketMedio)}</span>
              </div>
              <div className={styles.reportField}>
                <span className={styles.reportLabel}>Saldo Pendente a Receber:</span>
                <span className={styles.reportValue} style={{ color: '#DC2626' }}>R$ {formatarValor(dashboardData.pendenteAReceber)}</span>
              </div>
            </div>

            {/* Tabela de Produtos Mais Vendidos */}
            <div>
              <div style={{ fontWeight: '800', color: '#7A1C31', marginBottom: '8px' }}>Top Produtos Vendidos:</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#FAF6F0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Produto</th>
                    <th style={{ padding: '8px 12px' }}>Qtd Vendida</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.produtosMaisVendidos.map(p => (
                    <tr key={p.produtoId} style={{ borderBottom: '1px solid #EDF2F7' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '600' }}>{p.produtoNome}</td>
                      <td style={{ padding: '8px 12px' }}>{p.quantidadeVendida} un.</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#7A1C31' }}>
                        R$ {formatarValor(p.valorArrecadado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                style={{ background: '#EDF2F7', color: '#4A5568', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => setReportModalOpen(false)}
              >
                Fechar
              </button>
              <button
                style={{ background: '#7A1C31', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => window.print()}
              >
                <FaPrint /> Imprimir / Salvar PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
