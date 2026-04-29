"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaShoppingCart } from 'react-icons/fa';
import api from '@/services/api';
import styles from './catalogo.module.css';

interface Produto {
  id: number;
  nome: string;
  precoUnitario: number;
  imagemUrl?: string;
}

interface CartItem {
  produtoId: number;
  nome: string;
  precoUnitario: number;
  quantidade: number;
}

export default function CatalogoPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for the quantities selected in the inputs
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals state
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout form state
  const [dataEntrega, setDataEntrega] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const res = await api.get('/Produtos');
      setProdutos(res.data);
      
      const initialQuantities: Record<number, number> = {};
      res.data.forEach((p: Produto) => {
        initialQuantities[p.id] = 1;
      });
      setQuantidades(initialQuantities);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleQtyChange = (produtoId: number, delta: number) => {
    setQuantidades(prev => {
      const current = prev[produtoId] || 1;
      const next = current + delta;
      return { ...prev, [produtoId]: next > 0 ? next : 1 };
    });
  };

  const addToCart = (produto: Produto) => {
    const qty = quantidades[produto.id] || 1;
    
    setCart(prev => {
      const existing = prev.find(item => item.produtoId === produto.id);
      if (existing) {
        return prev.map(item => 
          item.produtoId === produto.id 
            ? { ...item, quantidade: item.quantidade + qty }
            : item
        );
      }
      return [...prev, {
        produtoId: produto.id,
        nome: produto.nome,
        precoUnitario: produto.precoUnitario,
        quantidade: qty
      }];
    });

    // Reset qty after adding
    setQuantidades(prev => ({ ...prev, [produto.id]: 1 }));
  };

  const removeFromCart = (produtoId: number) => {
    setCart(prev => prev.filter(item => item.produtoId !== produtoId));
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantidade, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinalizarResumo = () => {
    setIsSummaryOpen(false);
    const usuarioNome = localStorage.getItem('usuario_nome');
    
    if (!usuarioNome) {
      setIsLoginModalOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const submitEncomenda = async () => {
    const userId = localStorage.getItem('usuario_id');
    const tipo = localStorage.getItem('usuario_tipo');

    if (!userId) {
      alert("Erro ao identificar cliente.");
      return;
    }

    if (!dataEntrega) {
      alert("Selecione uma data para entrega.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        clienteId: tipo === 'Cliente' ? parseInt(userId) : null,
        usuarioId: tipo === 'Usuario' ? parseInt(userId) : null,
        dataEntrega: new Date(dataEntrega).toISOString(),
        observacao: observacao,
        itens: cart.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade
        }))
      };

      const res = await api.post('/api/Encomenda', payload);
      if (res.status === 200 || res.status === 201) {
        alert("Encomenda confirmada com sucesso!");
        setCart([]);
        setIsCheckoutOpen(false);
        setDataEntrega('');
        setObservacao('');
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao processar a encomenda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (val: string) => {
    if (!val) {
      setDataEntrega('');
      return;
    }
    const data = new Date(val);
    const day = data.getDay(); // 0 is Sunday
    const hours = data.getHours();
    const minutes = data.getMinutes();

    if (day === 0) {
      alert("Devido ao alto movimento, não realizamos encomendas aos domingos.");
      setDataEntrega('');
      return;
    }

    if (hours < 8 || hours > 18 || (hours === 18 && minutes > 0)) {
      alert("Horário permitido para retiradas: 08:00 às 18:00.");
      setDataEntrega('');
      return;
    }

    setDataEntrega(val);
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.pageTitle}>Nosso Catálogo</h1>

        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar delícias (ex: pão, bolo...)" 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.productList}>
          {filteredProdutos.map(produto => (
            <div key={produto.id} className={styles.productCard}>
              <div className={styles.cardLeft}>
                <img 
                  src={produto.imagemUrl || "https://placehold.co/150x150?text=SGEP"} 
                  alt={produto.nome}
                  className={styles.productImg}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/150x150?text=SGEP" }}
                />
              </div>
              
              <div className={styles.cardCenter}>
                <div className={styles.productName}>{produto.nome}</div>
                <div className={styles.productPrice}>
                  R$ {produto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className={styles.cardRight}>
                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => handleQtyChange(produto.id, -1)}>-</button>
                  <div className={styles.qtyDisplay}>{quantidades[produto.id] || 1}</div>
                  <button className={styles.qtyBtn} onClick={() => handleQtyChange(produto.id, 1)}>+</button>
                </div>
                <button 
                  className={styles.btnAdd}
                  onClick={() => addToCart(produto)}
                >
                  Adicionar
                </button>
              </div>
            </div>
          ))}
          {filteredProdutos.length === 0 && (
            <div style={{ textAlign: 'center', color: '#a0aec0', padding: '40px' }}>
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className={styles.floatingCart}>
          <div className={styles.cartInfo}>
            <div className={styles.cartIconWrapper}>
              <FaShoppingCart />
            </div>
            <div className={styles.cartText}>
              <span className={styles.cartItemsCount}>
                Itens no carrinho: {totalCartItems}
              </span>
              <span className={styles.cartTotal}>
                Total: R$ {totalCartPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <button className={styles.btnOpenCart} onClick={() => setIsSummaryOpen(true)}>
            Ver Pedido
          </button>
        </div>
      )}

      {/* MODAL DE RESUMO DO CARRINHO */}
      {isSummaryOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Seu Pedido</h2>
            <div className={styles.cartList}>
              {cart.map(item => (
                <div key={item.produtoId} className={styles.cartListItem}>
                  <div className={styles.cartListItemName}>
                    {item.quantidade}x {item.nome}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.cartListItemPrice}>
                      R$ {(item.precoUnitario * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button className={styles.cartListItemRemove} onClick={() => removeFromCart(item.produtoId)}>X</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '900', color: '#5B0A1A', marginBottom: '30px' }}>
              <span>Total:</span>
              <span>R$ {totalCartPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className={styles.modalActionsRow}>
              <button className={styles.btnSecondary} onClick={() => setIsSummaryOpen(false)}>
                Continuar Comprando
              </button>
              <button className={styles.btnPrimary} onClick={handleFinalizarResumo}>
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN REQUERIDO */}
      {isLoginModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Falta pouco!</h2>
            <p className={styles.modalSubtitle}>
              Entre na sua conta para concluir a encomenda e garantir suas delícias.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={() => router.push('/login')}>
                Fazer Login
              </button>
              <button className={styles.btnOutline} onClick={() => router.push('/registro')}>
                Criar Nova Conta
              </button>
              <button className={styles.btnSecondary} onClick={() => setIsLoginModalOpen(false)} style={{ marginTop: '10px' }}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT FINAL (SE LOGADO) */}
      {isCheckoutOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Confirmar Entrega</h2>
            
            <div className={styles.inputGroup}>
              <label>Data e Hora da Retirada/Entrega</label>
              <input 
                type="datetime-local" 
                value={dataEntrega}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
              <small style={{ color: '#e53e3e', marginTop: '5px', fontWeight: 'bold' }}>
                * Pedidos devem ser feitos com no mínimo 24h de antecedência.
              </small>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Observação (Opcional)</label>
              <textarea 
                rows={3}
                placeholder="Ex: Pães bem assados..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <div style={{ backgroundColor: '#fff5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #feb2b2', textAlign: 'left' }}>
              <span style={{ color: '#5B0A1A', fontWeight: 'bold', fontSize: '0.9rem' }}>
                ℹ️ O pagamento será realizado diretamente no balcão da Padaria Sabor no momento da retirada.
              </span>
            </div>

            <div className={styles.modalActionsRow}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setIsCheckoutOpen(false)}
                disabled={loading}
              >
                Voltar
              </button>
              <button 
                className={styles.btnPrimary}
                onClick={submitEncomenda}
                disabled={loading}
              >
                {loading ? 'Confirmando...' : 'Confirmar Encomenda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
