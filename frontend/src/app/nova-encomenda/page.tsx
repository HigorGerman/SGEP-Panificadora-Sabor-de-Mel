"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FaSearch, FaShoppingCart, FaShieldAlt, FaCreditCard, 
  FaExclamationTriangle, FaTimes, FaCalendarAlt, FaEdit, 
  FaStore, FaCheckCircle
} from 'react-icons/fa';
import api from '@/services/api';
import { getProductImageUrl } from '../catalogo/page';
import styles from './nova-encomenda.module.css';

interface Produto {
  id: number;
  nome: string;
  precoUnitario: number;
  imagemUrl?: string;
  descricao?: string;
  categoriaId?: number;
  permiteCustomizacao?: boolean;
  templateCustomizacao?: string;
  contemGluten?: boolean;
  contemLactose?: boolean;
  contemAcucar?: boolean;
}

interface Cliente {
  id: number;
  nome: string;
  email?: string;
  cpf?: string;
  restricaoGluten?: boolean;
  restricaoLactose?: boolean;
  restricaoAcucar?: boolean;
}

interface CartItem {
  cartItemId: string;
  produtoId: number;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  especificacoesTecnicas?: string;
}

function parseTemplateCustomizacao(template?: string): string[] {
  if (!template || template.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(template);
    if (Array.isArray(parsed)) return parsed.map(s => String(s));
  } catch (e) {
    return template.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function formatItemSpecs(specsStr?: string): string {
  if (!specsStr) return '';
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
}

function NovaEncomendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProdutoId = searchParams.get('produtoId');

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<{ id: number, descricao: string }[]>([]);
  const [loggedClient, setLoggedClient] = useState<Cliente | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);

  // Tipo de pagamento selecionado pelo usuário: 'mercadopago' | 'presencial'
  const [tipoPagamento, setTipoPagamento] = useState<'mercadopago' | 'presencial'>('mercadopago');

  // Mobile Bottom Sheet
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdEncomendaInfo, setCreatedEncomendaInfo] = useState<{ id: number; total: number; dataRetirada: string } | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [itemObs, setItemObs] = useState('');
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);

  // Health Alert Modal
  const [healthAlertModalOpen, setHealthAlertModalOpen] = useState(false);
  const [healthRiskMsg, setHealthRiskMsg] = useState('');
  const [pendingProduct, setPendingProduct] = useState<Produto | null>(null);

  // Form Fields
  const [dataEntrega, setDataEntrega] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tipo = localStorage.getItem('usuario_tipo');
      const uId = localStorage.getItem('usuario_id');
      const uNome = localStorage.getItem('usuario_nome');
      const uEmail = localStorage.getItem('usuario_email');

      const reqs: Promise<any>[] = [
        api.get('/Produtos'),
        api.get('/Categorias').catch(() => ({ data: [] }))
      ];

      if (tipo === 'Cliente' && uId) {
        reqs.push(api.get(`/Clientes/${uId}`).catch(() => ({ data: null })));
      }

      const results = await Promise.all(reqs);

      const prods: Produto[] = results[0].data;
      setProdutos(prods);
      setCategorias(results[1].data);

      if (tipo === 'Cliente' && results[2]?.data) {
        setLoggedClient(results[2].data);
      } else if (uNome) {
        setLoggedClient({
          id: uId ? parseInt(uId) : 0,
          nome: uNome,
          email: uEmail || 'cliente@sabordemel.com'
        });
      }

      const initialQuantities: Record<number, number> = {};
      prods.forEach(p => {
        initialQuantities[p.id] = 1;
      });
      setQuantidades(initialQuantities);

      if (preSelectedProdutoId) {
        const prodIdNum = parseInt(preSelectedProdutoId);
        const preProd = prods.find(p => p.id === prodIdNum);
        if (preProd) {
          triggerAddProduct(preProd);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleQtyChange = (id: number, delta: number) => {
    setQuantidades(prev => {
      const current = prev[id] || 1;
      const next = current + delta;
      return { ...prev, [id]: next > 0 ? next : 1 };
    });
  };

  const triggerAddProduct = (produto: Produto) => {
    const templateFields = parseTemplateCustomizacao(produto.templateCustomizacao);
    
    if (produto.permiteCustomizacao || templateFields.length > 0) {
      setSelectedProduct(produto);
      setEditingCartItemId(null);
      const initialFields: Record<string, string> = {};
      templateFields.forEach(f => {
        initialFields[f] = '';
      });
      setCustomFields(initialFields);
      setItemObs('');
      setCustomModalOpen(true);
    } else {
      addItemToCart(produto, quantidades[produto.id] || 1, undefined);
    }
  };

  const addItemToCart = (produto: Produto, quantidade: number, specs?: string) => {
    const newCartItem: CartItem = {
      cartItemId: `${produto.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitario: produto.precoUnitario,
      quantidade: quantidade,
      especificacoesTecnicas: specs
    };

    setCart(prev => [...prev, newCartItem]);
    setQuantidades(prev => ({ ...prev, [produto.id]: 1 }));
  };

  const handleAddClick = (produto: Produto) => {
    if (loggedClient) {
      let risks: string[] = [];
      if (loggedClient.restricaoGluten && produto.contemGluten) risks.push("Glúten");
      if (loggedClient.restricaoLactose && produto.contemLactose) risks.push("Lactose");
      if (loggedClient.restricaoAcucar && produto.contemAcucar) risks.push("Açúcar");

      if (risks.length > 0) {
        setHealthRiskMsg(`Atenção: Seu perfil possui restrição a ${risks.join(' e ')} e este produto contém estes ingredientes. Deseja continuar?`);
        setPendingProduct(produto);
        setHealthAlertModalOpen(true);
        return;
      }
    }

    triggerAddProduct(produto);
  };

  const handleHealthAlertConfirm = () => {
    setHealthAlertModalOpen(false);
    if (pendingProduct) {
      triggerAddProduct(pendingProduct);
      setPendingProduct(null);
    }
  };

  const handleCustomConfirm = () => {
    if (!selectedProduct) return;

    const specsObj: Record<string, string> = {};
    Object.keys(customFields).forEach(key => {
      if (customFields[key] && customFields[key].trim().length > 0) {
        specsObj[key] = customFields[key].trim();
      }
    });

    if (itemObs && itemObs.trim().length > 0) {
      specsObj['Observação do Item'] = itemObs.trim();
    }

    const specsJson = Object.keys(specsObj).length > 0 ? JSON.stringify(specsObj) : undefined;
    const qty = quantidades[selectedProduct.id] || 1;

    if (editingCartItemId) {
      setCart(prev => prev.map(item => {
        if (item.cartItemId === editingCartItemId) {
          return {
            ...item,
            quantidade: qty,
            especificacoesTecnicas: specsJson
          };
        }
        return item;
      }));
    } else {
      addItemToCart(selectedProduct, qty, specsJson);
    }

    setCustomModalOpen(false);
    setSelectedProduct(null);
    setEditingCartItemId(null);
  };

  const openEditCustomModal = (item: CartItem) => {
    const prod = produtos.find(p => p.id === item.produtoId);
    if (!prod) return;

    setSelectedProduct(prod);
    setEditingCartItemId(item.cartItemId);
    setQuantidades(prev => ({ ...prev, [prod.id]: item.quantidade }));

    const templateFields = parseTemplateCustomizacao(prod.templateCustomizacao);
    const initialFields: Record<string, string> = {};
    let parsedSpecs: Record<string, string> = {};

    if (item.especificacoesTecnicas) {
      try {
        parsedSpecs = JSON.parse(item.especificacoesTecnicas);
      } catch (e) { }
    }

    templateFields.forEach(f => {
      initialFields[f] = parsedSpecs[f] || '';
    });

    setCustomFields(initialFields);
    setItemObs(parsedSpecs['Observação do Item'] || '');
    setCustomModalOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const calcularTotal = () => {
    return cart.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = calcularTotal();

  const handleDateChange = (val: string) => {
    if (!val) {
      setDataEntrega('');
      return;
    }
    const data = new Date(val);
    const day = data.getDay(); // 0 é Domingo
    const hours = data.getHours();
    const minutes = data.getMinutes();

    if (day === 0) {
      alert("Devido ao alto movimento, não realizamos encomendas aos domingos.");
      setDataEntrega('');
      return;
    }

    if (hours < 8 || hours > 18 || (hours === 18 && minutes > 0)) {
      alert("Horário permitido para retiradas na panificadora: 08:00 às 18:00.");
      setDataEntrega('');
      return;
    }

    setDataEntrega(val);
  };

  // Função para criar a encomenda no banco de dados e processar o pagamento escolhido
  const handleFinalizarEncomenda = async () => {
    const uId = localStorage.getItem('usuario_id');
    const uNome = localStorage.getItem('usuario_nome') || loggedClient?.nome || "Cliente Sabor de Mel";
    const uEmail = localStorage.getItem('usuario_email') || loggedClient?.email || "cliente@sabordemel.com";
    const tipo = localStorage.getItem('usuario_tipo');

    if (!uId && !uNome) {
      setLoginModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      alert("Seu carrinho de encomenda está vazio.");
      return;
    }

    if (!dataEntrega) {
      alert("Por favor, selecione a Data e Hora para retirada da encomenda.");
      return;
    }

    setLoading(true);
    try {
      // 1. Criar a Encomenda no Backend
      const payloadEncomenda = {
        clienteId: tipo === 'Cliente' && uId ? parseInt(uId) : null,
        usuarioId: tipo === 'Usuario' && uId ? parseInt(uId) : null,
        dataEntrega: new Date(dataEntrega).toISOString(),
        observacao: observacaoGeral,
        itens: cart.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          especificacoesTecnicas: item.especificacoesTecnicas
        }))
      };

      const resEnc = await api.post('/api/Encomenda', payloadEncomenda);
      let encomendaId = resEnc.data?.id;

      if (!encomendaId) {
        const resList = await api.get('/api/Encomenda');
        if (resList.data && resList.data.length > 0) {
          encomendaId = resList.data[resList.data.length - 1].id;
        }
      }

      if (!encomendaId) {
        throw new Error("Não foi possível identificar o ID da encomenda criada.");
      }

      // 2. Tratar a forma de pagamento selecionada pelo usuário
      if (tipoPagamento === 'mercadopago') {
        // Opção A: Pagamento Online via Mercado Pago (Checkout Pro)
        const payloadPreferencia = {
          encomendaId: encomendaId,
          cobrarApenasSinal: false,
          email: uEmail,
          nome: uNome,
          cpf: loggedClient?.cpf || "00000000000"
        };

        const resPref = await api.post('/api/pagamentos/gerar-preferencia', payloadPreferencia);

        if (resPref.data && (resPref.data.initPoint || resPref.data.sandboxInitPoint)) {
          const checkoutUrl = resPref.data.initPoint || resPref.data.sandboxInitPoint;
          // Redireciona o cliente para a tela de pagamento do Mercado Pago
          window.location.href = checkoutUrl;
        } else {
          alert("Preferência gerada, mas URL de checkout do Mercado Pago não foi retornada.");
        }
      } else {
        // Opção B: Pagamento Presencial na Retirada (No Balcão)
        await api.post('/api/pagamentos/registrar-presencial', {
          encomendaId: encomendaId,
          formaPagamento: "A combinar / Balcão"
        });

        // Armazena as informações para exibir o Modal de Sucesso
        setCreatedEncomendaInfo({
          id: encomendaId,
          total: totalValor,
          dataRetirada: new Date(dataEntrega).toLocaleString('pt-BR')
        });

        setCart([]);
        setSuccessModalOpen(true);
      }
    } catch (error: any) {
      console.error("Erro ao finalizar encomenda:", error);
      alert(error?.response?.data?.erro || error?.response?.data?.message || "Ocorreu um erro ao registrar sua encomenda.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProdutos = produtos.filter(p => {
    const term = searchTerm.toLowerCase();
    const nameMatch = p.nome.toLowerCase().includes(term);
    const descMatch = p.descricao && p.descricao.toLowerCase().includes(term);
    const catMatch = selectedCategoria === null || p.categoriaId === selectedCategoria;
    return (nameMatch || descMatch) && catMatch;
  });

  const clienteHasRestricoes = loggedClient && (loggedClient.restricaoGluten || loggedClient.restricaoLactose || loggedClient.restricaoAcucar);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>

        {/* Header & Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <h1 className={styles.welcomeTitle}>
            {loggedClient?.nome ? `Olá, ${loggedClient.nome}! 👋` : "Monte sua Encomenda Especial"}
          </h1>
          <p className={styles.welcomeSubtitle}>
            Escolha os itens desejados, defina a data de retirada e selecione sua forma de pagamento preferida (Online ou no Balcão).
          </p>

          {/* Banner de Restrições Alimentares do Perfil */}
          {clienteHasRestricoes && (
            <div className={styles.healthAlertBanner}>
              <FaShieldAlt style={{ fontSize: '1.2rem', color: '#C53030' }} />
              <div>
                🛡️ <strong>Alerta do Seu Perfil:</strong> Restrições ativas para:{" "}
                {[
                  loggedClient.restricaoGluten && "Glúten",
                  loggedClient.restricaoLactose && "Lactose",
                  loggedClient.restricaoAcucar && "Açúcar"
                ].filter(Boolean).join(", ")}.
                O sistema avisará caso adicione produtos com esses ingredientes.
              </div>
            </div>
          )}
        </div>

        {/* Seleção de Data/Hora de Retirada */}
        <div className={styles.dateSelectorBox}>
          <label htmlFor="dataEntregaInput" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCalendarAlt style={{ color: '#7A1C31' }} /> Data e Horário de Retirada na Panificadora *
          </label>
          <input
            id="dataEntregaInput"
            type="datetime-local"
            className={styles.dateTimeInput}
            value={dataEntrega}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
            onChange={(e) => handleDateChange(e.target.value)}
            required
          />
          <small style={{ color: '#718096', fontSize: '0.85rem' }}>
            * Funcionamento: Segunda a Sábado das 08:00 às 18:00 (mínimo de 24h de antecedência).
          </small>
        </div>

        {/* Layout Principal (2 Colunas Desktop) */}
        <div className={styles.mainLayout}>

          {/* Coluna Esquerda: Seletor de Produtos */}
          <div className={styles.catalogColumn}>
            
            {/* Barra de Busca e Categorias */}
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por nome de produto (ex: bolo de ninho, pão de queijo)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Grid de Produtos */}
            {filteredProdutos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '40px', background: 'white', borderRadius: '16px' }}>
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className={styles.productsGrid}>
                {filteredProdutos.map(produto => {
                  const templateFields = parseTemplateCustomizacao(produto.templateCustomizacao);
                  const isCustom = produto.permiteCustomizacao || templateFields.length > 0;
                  const imgUrl = getProductImageUrl(produto);

                  return (
                    <div key={produto.id} className={styles.productCard}>
                      <img
                        src={imgUrl}
                        alt={produto.nome}
                        className={styles.productImg}
                      />
                      
                      {/* Badges de Restrição & Customização */}
                      <div className={styles.badgeRow}>
                        {isCustom && <span className={styles.smallBadge} style={{ background: '#7A1C31', color: 'white' }}>Personalizável</span>}
                        {produto.contemGluten === false && <span className={styles.smallBadge} style={{ background: '#D1FAE5', color: '#065F46' }}>Sem Glúten</span>}
                        {produto.contemLactose === false && <span className={styles.smallBadge} style={{ background: '#DBEAFE', color: '#1E40AF' }}>Zero Lactose</span>}
                        {produto.contemAcucar === false && <span className={styles.smallBadge} style={{ background: '#F3E8FF', color: '#6B21A8' }}>Sem Açúcar</span>}
                      </div>

                      <div className={styles.productName}>{produto.nome}</div>
                      <div className={styles.productPrice}>
                        R$ {produto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <div className={styles.cardActions}>
                        <div className={styles.qtyControl}>
                          <button className={styles.qtyBtn} onClick={() => handleQtyChange(produto.id, -1)}>-</button>
                          <span className={styles.qtyDisplay}>{quantidades[produto.id] || 1}</span>
                          <button className={styles.qtyBtn} onClick={() => handleQtyChange(produto.id, 1)}>+</button>
                        </div>

                        <button
                          className={styles.btnAdd}
                          onClick={() => handleAddClick(produto)}
                        >
                          {isCustom ? " Personalizar" : "+ Adicionar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita: Resumo Fixo (Desktop) */}
          <div className={styles.summaryColumn}>
            <div className={styles.summaryTitle}>
              <span>Sua Encomenda</span>
              <span style={{ fontSize: '0.9rem', background: '#FAF6F0', color: '#7A1C31', padding: '4px 10px', borderRadius: '50px' }}>
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className={styles.cartList}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '30px 0' }}>
                  Sua lista está vazia.<br />Selecione produtos ao lado!
                </div>
              ) : (
                cart.map(item => {
                  const formattedSpecs = formatItemSpecs(item.especificacoesTecnicas);

                  return (
                    <div key={item.cartItemId} className={styles.cartItem}>
                      <div className={styles.cartItemDetails}>
                        <span className={styles.cartItemName}>{item.quantidade}x {item.nome}</span>
                        
                        {formattedSpecs && (
                          <div style={{ fontSize: '0.78rem', color: '#7A1C31', background: '#FFF5F5', padding: '4px 8px', borderRadius: '6px', marginTop: '2px', fontWeight: '600' }}>
                            📝 {formattedSpecs}
                          </div>
                        )}

                        <span className={styles.cartItemPrice}>
                          R$ {(item.precoUnitario * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          style={{ background: 'none', border: 'none', color: '#7A1C31', cursor: 'pointer', fontSize: '0.85rem' }}
                          onClick={() => openEditCustomModal(item)}
                          title="Editar observações deste item"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={styles.btnRemoveItem}
                          onClick={() => removeFromCart(item.cartItemId)}
                          title="Remover item"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Campo de Observação Geral da Encomenda */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A5568', display: 'block', marginBottom: '6px' }}>
                Observação Geral da Encomenda:
              </label>
              <textarea
                className={styles.obsInput}
                rows={2}
                placeholder="Ex: Embalagem para presente, entregar no balcão de cima..."
                value={observacaoGeral}
                onChange={e => setObservacaoGeral(e.target.value)}
              />
            </div>

            {/* Seletor de Forma de Pagamento */}
            <div className={styles.paymentMethodSelector}>
              <span className={styles.paymentMethodTitle}>Selecione como deseja pagar:</span>

              <div 
                className={`${styles.paymentOptionCard} ${tipoPagamento === 'mercadopago' ? styles.paymentOptionSelected : ''}`}
                onClick={() => setTipoPagamento('mercadopago')}
              >
                <input 
                  type="radio" 
                  name="tipoPagamento" 
                  checked={tipoPagamento === 'mercadopago'} 
                  onChange={() => setTipoPagamento('mercadopago')} 
                />
                <div className={styles.paymentOptionDetails}>
                  <div className={styles.paymentOptionName}>💳 Mercado Pago Online</div>
                  <div className={styles.paymentOptionDesc}>Pix ou Cartão na tela segura do Mercado Pago</div>
                </div>
              </div>

              <div 
                className={`${styles.paymentOptionCard} ${tipoPagamento === 'presencial' ? styles.paymentOptionSelected : ''}`}
                onClick={() => setTipoPagamento('presencial')}
              >
                <input 
                  type="radio" 
                  name="tipoPagamento" 
                  checked={tipoPagamento === 'presencial'} 
                  onChange={() => setTipoPagamento('presencial')} 
                />
                <div className={styles.paymentOptionDetails}>
                  <div className={styles.paymentOptionName}>🏪 Pagar na Retirada (Balcão)</div>
                  <div className={styles.paymentOptionDesc}>Pague no caixa da padaria no momento de retirar</div>
                </div>
              </div>
            </div>

            {/* Caixa de Valores Totais */}
            <div className={styles.breakdownBox}>
              <div className={styles.breakdownHighlight}>
                <span>Valor Total a Pagar:</span>
                <span>R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Botão de Ação Dinâmico (Depende da Opção Selecionada) */}
            {tipoPagamento === 'mercadopago' ? (
              <button
                className={styles.btnMercadoPago}
                disabled={cart.length === 0 || loading}
                onClick={handleFinalizarEncomenda}
              >
                <FaCreditCard />
                {loading ? "Conectando Mercado Pago..." : `Pagar Online (R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
              </button>
            ) : (
              <button
                className={styles.btnPresencial}
                disabled={cart.length === 0 || loading}
                onClick={handleFinalizarEncomenda}
              >
                <FaStore />
                {loading ? "Confirmando..." : `Confirmar (Pagar no Balcão)`}
              </button>
            )}
          </div>

        </div>

      </div>

      {/* MOBILE FLOATING BOTTOM BAR */}
      {cart.length > 0 && (
        <div className={styles.mobileBottomBar}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: '600' }}>
              {totalCartCount} {totalCartCount === 1 ? 'item' : 'itens'} selecionados
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#7A1C31' }}>
              Total: R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <button className={styles.btnOpenBottomSheet} onClick={() => setBottomSheetOpen(true)}>
            Ver Encomenda
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET (GAVETA DESLIZANTE) */}
      {bottomSheetOpen && (
        <>
          <div className={styles.bottomSheetOverlay} onClick={() => setBottomSheetOpen(false)} />
          <div className={styles.bottomSheetContent}>
            <div className={styles.bottomSheetHeader}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7A1C31' }}>Sua Encomenda</h2>
              <button className={styles.closeSheetBtn} onClick={() => setBottomSheetOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className={styles.cartList} style={{ maxHeight: '200px' }}>
              {cart.map(item => (
                <div key={item.cartItemId} className={styles.cartItem}>
                  <div className={styles.cartItemDetails}>
                    <span className={styles.cartItemName}>{item.quantidade}x {item.nome}</span>
                    {item.especificacoesTecnicas && (
                      <div style={{ fontSize: '0.78rem', color: '#7A1C31' }}>
                        📝 {formatItemSpecs(item.especificacoesTecnicas)}
                      </div>
                    )}
                    <span className={styles.cartItemPrice}>
                      R$ {(item.precoUnitario * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button className={styles.btnRemoveItem} onClick={() => removeFromCart(item.cartItemId)}>
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>

            {/* Seletor de Forma de Pagamento no Mobile */}
            <div className={styles.paymentMethodSelector}>
              <span className={styles.paymentMethodTitle}>Selecione como deseja pagar:</span>

              <div 
                className={`${styles.paymentOptionCard} ${tipoPagamento === 'mercadopago' ? styles.paymentOptionSelected : ''}`}
                onClick={() => setTipoPagamento('mercadopago')}
              >
                <input 
                  type="radio" 
                  name="tipoPagamentoMobile" 
                  checked={tipoPagamento === 'mercadopago'} 
                  onChange={() => setTipoPagamento('mercadopago')} 
                />
                <div className={styles.paymentOptionDetails}>
                  <div className={styles.paymentOptionName}>💳 Mercado Pago Online</div>
                  <div className={styles.paymentOptionDesc}>Pix ou Cartão de Crédito/Débito</div>
                </div>
              </div>

              <div 
                className={`${styles.paymentOptionCard} ${tipoPagamento === 'presencial' ? styles.paymentOptionSelected : ''}`}
                onClick={() => setTipoPagamento('presencial')}
              >
                <input 
                  type="radio" 
                  name="tipoPagamentoMobile" 
                  checked={tipoPagamento === 'presencial'} 
                  onChange={() => setTipoPagamento('presencial')} 
                />
                <div className={styles.paymentOptionDetails}>
                  <div className={styles.paymentOptionName}>🏪 Pagar na Retirada (Balcão)</div>
                  <div className={styles.paymentOptionDesc}>Pague no caixa da padaria ao retirar</div>
                </div>
              </div>
            </div>

            <div className={styles.breakdownBox}>
              <div className={styles.breakdownHighlight}>
                <span>Valor Total:</span>
                <span>R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {tipoPagamento === 'mercadopago' ? (
              <button
                className={styles.btnMercadoPago}
                disabled={loading}
                onClick={() => {
                  setBottomSheetOpen(false);
                  handleFinalizarEncomenda();
                }}
              >
                <FaCreditCard />
                {loading ? "Conectando..." : `Pagar Online (R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
              </button>
            ) : (
              <button
                className={styles.btnPresencial}
                disabled={loading}
                onClick={() => {
                  setBottomSheetOpen(false);
                  handleFinalizarEncomenda();
                }}
              >
                <FaStore />
                {loading ? "Confirmando..." : `Confirmar (Pagar no Balcão)`}
              </button>
            )}
          </div>
        </>
      )}

      {/* Modal de Sucesso (Opção B - Pagamento Presencial no Balcão) */}
      {successModalOpen && createdEncomendaInfo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ textAlign: 'center', borderTop: '6px solid #10B981' }}>
            <FaCheckCircle style={{ fontSize: '3.5rem', color: '#10B981', marginBottom: '15px' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#7A1C31', marginBottom: '10px' }}>
              Encomenda #{createdEncomendaInfo.id} Confirmada!
            </h2>
            <p style={{ color: '#4A5568', fontSize: '1rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Sua encomenda foi registrada com sucesso e já entrou em nosso sistema de produção.
            </p>

            <div style={{ background: '#FAF6F0', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                📅 <strong>Data Agendada para Retirada:</strong> {createdEncomendaInfo.dataRetirada}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                💰 <strong>Valor a Pagar no Balcão:</strong> R$ {createdEncomendaInfo.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#7A1C31', fontWeight: '700', marginTop: '4px' }}>
                ℹ️ Lembre-se de realizar o pagamento diretamente no caixa da Panificadora Sabor de Mel momento da retirada.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                style={{ background: '#7A1C31', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}
                onClick={() => router.push('/minhas-encomendas')}
              >
                Ver Minhas Encomendas
              </button>
              <button
                style={{ background: 'none', border: 'none', color: '#718096', padding: '8px', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setSuccessModalOpen(false);
                  setCreatedEncomendaInfo(null);
                  setDataEntrega('');
                  setObservacaoGeral('');
                }}
              >
                Fazer Outra Encomenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Formulário de Personalização por Item */}
      {customModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#7A1C31', marginBottom: '6px' }}>
              Personalizar: {selectedProduct.nome}
            </div>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px' }}>
              Preencha as especificações técnicas desejadas para este item.
            </p>

            {parseTemplateCustomizacao(selectedProduct.templateCustomizacao).map(field => (
              <div key={field} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '700', color: '#4A5568', marginBottom: '4px', fontSize: '0.9rem' }}>
                  {field}
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '0.95rem' }}
                  placeholder={`Digite ${field}...`}
                  value={customFields[field] || ''}
                  onChange={e => setCustomFields({ ...customFields, [field]: e.target.value })}
                />
              </div>
            ))}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', color: '#4A5568', marginBottom: '4px', fontSize: '0.9rem' }}>
                Observação Específica para este Item:
              </label>
              <textarea
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                rows={2}
                placeholder="Ex: Sem pimenta, caprichar no recheio, bem assado..."
                value={itemObs}
                onChange={e => setItemObs(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                style={{ background: '#EDF2F7', color: '#4A5568', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => {
                  setCustomModalOpen(false);
                  setSelectedProduct(null);
                  setEditingCartItemId(null);
                }}
              >
                Cancelar
              </button>
              <button
                style={{ background: '#7A1C31', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                onClick={handleCustomConfirm}
              >
                Confirmar Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Alerta de Saúde (Restrições Alimentares) */}
      {healthAlertModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ borderTop: '5px solid #E53E3E' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#E53E3E', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaExclamationTriangle /> Alerta de Saúde Alimentar
            </div>
            <p style={{ color: '#742A2A', backgroundColor: '#FFF5F5', padding: '15px', borderRadius: '10px', fontWeight: '600', lineHeight: '1.5' }}>
              {healthRiskMsg}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                style={{ background: '#EDF2F7', color: '#4A5568', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => {
                  setHealthAlertModalOpen(false);
                  setPendingProduct(null);
                }}
              >
                Cancelar
              </button>
              <button
                style={{ background: '#E53E3E', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                onClick={handleHealthAlertConfirm}
              >
                Sim, adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Alerta de Login Necessário */}
      {loginModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#7A1C31', marginBottom: '10px' }}>
              Identifique-se para Continuar
            </h2>
            <p style={{ color: '#718096', marginBottom: '20px', lineHeight: '1.5' }}>
              Para garantir seu pedido e registrar a encomenda com segurança, entre na sua conta ou cadastre-se.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                style={{ background: '#7A1C31', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                onClick={() => router.push('/login')}
              >
                Fazer Login
              </button>
              <button
                style={{ background: 'transparent', border: '2px solid #7A1C31', color: '#7A1C31', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                onClick={() => router.push('/registro')}
              >
                Criar Nova Conta
              </button>
              <button
                style={{ background: 'none', border: 'none', color: '#A0AEC0', padding: '8px', cursor: 'pointer' }}
                onClick={() => setLoginModalOpen(false)}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NovaEncomendaPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Carregando formulário...</div>}>
      <NovaEncomendaContent />
    </Suspense>
  );
}
