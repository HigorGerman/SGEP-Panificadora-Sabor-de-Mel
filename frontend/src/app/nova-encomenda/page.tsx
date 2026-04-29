"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/services/api';
import styles from './nova-encomenda.module.css';

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

export default function NovaEncomenda() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  
  // Form fields
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
      // Initialize quantities to 1
      const initialQuantities: Record<number, number> = {};
      res.data.forEach((p: Produto) => {
        initialQuantities[p.id] = 1;
      });
      setQuantidades(initialQuantities);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleQuantityChange = (id: number, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setQuantidades(prev => ({ ...prev, [id]: num }));
    } else {
      setQuantidades(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const addToCart = (produto: Produto) => {
    const quantidade = quantidades[produto.id] || 1;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.produtoId === produto.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.produtoId === produto.id 
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }
      return [...prevCart, { 
        produtoId: produto.id, 
        nome: produto.nome, 
        precoUnitario: produto.precoUnitario, 
        quantidade 
      }];
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCart(prev => prev.filter(item => item.produtoId !== produtoId));
  };

  const calcularTotal = () => {
    return cart.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
  };

  const handleFinalizarClick = () => {
    const usuarioNome = localStorage.getItem('usuario_nome');
    if (!usuarioNome) {
      setLoginModalOpen(true);
    } else {
      setCheckoutModalOpen(true);
    }
  };

  const submitEncomenda = async () => {
    const userId = localStorage.getItem('usuario_id');
    const tipo = localStorage.getItem('usuario_tipo');
    if (!userId) {
      alert("ID do cliente não encontrado. Por favor, faça login novamente.");
      return;
    }

    if (!dataEntrega) {
      alert("Por favor, selecione uma data de entrega.");
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
        alert("Encomenda criada com sucesso!");
        setCart([]);
        setCheckoutModalOpen(false);
        setDataEntrega('');
        setObservacao('');
        // router.push('/encomendas'); // Opcional: redirecionar para a página de encomendas
      }
    } catch (error) {
      console.error("Erro ao criar encomenda:", error);
      alert("Ocorreu um erro ao criar a encomenda. Tente novamente.");
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
      {/* Vitrine de Produtos */}
      <div className={styles.produtosGrid}>
        {produtos.map(produto => (
          <div key={produto.id} className={styles.card}>
            {/* Foto placeholder se não houver imagem */}
            <img 
              src={produto.imagemUrl || "https://placehold.co/400x300?text=Sem+Foto"} 
              alt={produto.nome} 
              className={styles.cardImage}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Sem+Foto" }}
            />
            <div className={styles.cardTitle}>{produto.nome}</div>
            <div className={styles.cardPrice}>
              R$ {produto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            
            <div className={styles.cardActions}>
              <input 
                type="number" 
                min="1" 
                className={styles.quantityInput}
                value={quantidades[produto.id] || 1}
                onChange={(e) => handleQuantityChange(produto.id, e.target.value)}
              />
              <button 
                className={styles.btnAdd}
                onClick={() => addToCart(produto)}
              >
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Carrinho Lateral */}
      <div className={styles.cartSidebar}>
        <div className={styles.cartTitle}>Sua Encomenda</div>
        
        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>Adicione produtos para começar</div>
          ) : (
            cart.map(item => (
              <div key={item.produtoId} className={styles.cartItem}>
                <div className={styles.cartItemDetails}>
                  <span className={styles.cartItemName}>{item.quantidade}x {item.nome}</span>
                  <span className={styles.cartItemPrice}>
                    R$ {(item.precoUnitario * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button 
                  className={styles.cartItemRemove}
                  onClick={() => removeFromCart(item.produtoId)}
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.cartTotal}>
          <span>Total:</span>
          <span>R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <button 
          className={styles.btnFinalize}
          disabled={cart.length === 0}
          onClick={handleFinalizarClick}
        >
          Finalizar Encomenda
        </button>
      </div>

      {/* Modal - Alerta de Login */}
      {loginModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Atenção</div>
            <p style={{ marginBottom: '20px', color: '#4a5568' }}>
              Você precisa estar logado para finalizar uma encomenda. Por favor, faça login ou crie uma conta.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.btnCancelar} 
                onClick={() => setLoginModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnConfirmar}
                onClick={() => router.push('/login')}
              >
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Formulário de Encomenda */}
      {checkoutModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Finalizar Encomenda</div>
            
            <div className={styles.inputGroup}>
              <label>Data de Entrega / Retirada</label>
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
                placeholder="Ex: Pães bem assados e clarinhos, fatiar o queijo..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <div style={{ backgroundColor: '#fff5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #feb2b2', textAlign: 'left' }}>
              <span style={{ color: '#5B0A1A', fontWeight: 'bold', fontSize: '0.9rem' }}>
                ℹ️ O pagamento será realizado diretamente no balcão da Padaria Sabor no momento da retirada.
              </span>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.btnCancelar} 
                onClick={() => setCheckoutModalOpen(false)}
                disabled={loading}
              >
                Voltar
              </button>
              <button 
                className={styles.btnConfirmar}
                onClick={submitEncomenda}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
