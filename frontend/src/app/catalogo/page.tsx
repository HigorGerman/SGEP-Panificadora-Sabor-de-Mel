"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaArrowRight, FaTimes, FaShieldAlt } from 'react-icons/fa';
import api from '@/services/api';
import styles from './catalogo.module.css';

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

interface Categoria {
  id: number;
  descricao: string;
}

export function getProductImageUrl(produto: Produto): string {
  if (produto.imagemUrl && produto.imagemUrl.trim().length > 0) {
    return produto.imagemUrl;
  }
  const nameLower = produto.nome.toLowerCase();
  if (nameLower.includes('bolo')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80';
  }
  if (nameLower.includes('pao de queijo') || nameLower.includes('pão') || nameLower.includes('pao')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
  }
  if (nameLower.includes('brigadeiro') || nameLower.includes('carolina') || nameLower.includes('doce')) {
    return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80';
  }
  if (nameLower.includes('torta') || nameLower.includes('pie')) {
    return 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&auto=format&fit=crop&q=80';
  }
  if (nameLower.includes('salgado') || nameLower.includes('coxinha') || nameLower.includes('empada')) {
    return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
}

export default function CatalogoPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProdutos, resCategorias] = await Promise.all([
        api.get('/Produtos'),
        api.get('/Categorias').catch(() => ({ data: [] }))
      ]);
      setProdutos(resProdutos.data);
      setCategorias(resCategorias.data);
    } catch (error) {
      console.error("Erro ao carregar vitrine de produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIrParaEncomenda = (produtoId: number) => {
    router.push(`/nova-encomenda?produtoId=${produtoId}`);
  };

  const filteredProdutos = produtos.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesName = p.nome.toLowerCase().includes(term);
    const matchesDesc = p.descricao ? p.descricao.toLowerCase().includes(term) : false;
    const matchesCategory = selectedCategoria === null || p.categoriaId === selectedCategoria;
    
    return (matchesName || matchesDesc) && matchesCategory;
  });

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        {/* Banner Hero */}
        <div className={styles.heroHeader}>
          <h1 className={styles.heroTitle}>Vitrine Digital Sabor de Mel</h1>
          <p className={styles.heroSubtitle}>
            Explore nossas receitas artesanais, pães fresquinhos e doces finos.
            Selecione seus itens favoritos e monte sua encomenda personalizada!
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className={styles.filterSection}>
          <div className={styles.searchBar}>
            <FaSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou ingrediente (ex: pão, brigadeiro, ninho...)" 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Abas de Categorias */}
          <div className={styles.categoryPills}>
            <button 
              className={`${styles.pill} ${selectedCategoria === null ? styles.pillActive : ''}`}
              onClick={() => setSelectedCategoria(null)}
            >
              Todos os Produtos ({produtos.length})
            </button>
            {categorias.map(cat => {
              const count = produtos.filter(p => p.categoriaId === cat.id).length;
              return (
                <button 
                  key={cat.id}
                  className={`${styles.pill} ${selectedCategoria === cat.id ? styles.pillActive : ''}`}
                  onClick={() => setSelectedCategoria(cat.id)}
                >
                  {cat.descricao} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Produtos (Vitrine) */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#7A1C31', padding: '60px 0', fontSize: '1.2rem', fontWeight: '600' }}>
            Carregando vitrine de produtos...
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#718096', padding: '60px 0', background: 'white', borderRadius: '16px' }}>
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProdutos.map(produto => {
              const imgUrl = getProductImageUrl(produto);
              const isSemGluten = produto.contemGluten === false;
              const isZeroLactose = produto.contemLactose === false;
              const isSemAcucar = produto.contemAcucar === false;
              const isCustom = produto.permiteCustomizacao;

              return (
                <div key={produto.id} className={styles.card}>
                  <div className={styles.imageWrapper} onClick={() => setSelectedProduto(produto)} style={{ cursor: 'pointer' }}>
                    <img 
                      src={imgUrl} 
                      alt={produto.nome}
                      className={styles.cardImg}
                    />
                    
                    {/* Badges Alimentares */}
                    <div className={styles.badgeContainer}>
                      {isCustom && <span className={`${styles.badge}`} style={{ background: '#7A1C31', color: 'white' }}>Personalizável</span>}
                      {isSemGluten && <span className={`${styles.badge} ${styles.badgeGlutenFree}`}>Sem Glúten</span>}
                      {isZeroLactose && <span className={`${styles.badge} ${styles.badgeLactoseFree}`}>Zero Lactose</span>}
                      {isSemAcucar && <span className={`${styles.badge} ${styles.badgeSugarFree}`}>Sem Açúcar</span>}
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle} onClick={() => setSelectedProduto(produto)} style={{ cursor: 'pointer' }}>
                      {produto.nome}
                    </h3>
                    <p className={styles.cardDesc}>
                      {produto.descricao || "Deliciosa receita artesanal preparada diariamente com ingredientes selecionados na Panificadora Sabor de Mel."}
                    </p>

                    <div className={styles.cardFooter}>
                      <div className={styles.cardPrice}>
                        R$ {produto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <button 
                        className={styles.btnOrder}
                        onClick={() => handleIrParaEncomenda(produto.id)}
                      >
                        Encomendar <FaArrowRight style={{ fontSize: '0.8rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Produto */}
      {selectedProduto && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduto(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setSelectedProduto(null)}>
              <FaTimes />
            </button>

            <img 
              src={getProductImageUrl(selectedProduto)} 
              alt={selectedProduto.nome} 
              className={styles.modalImg}
            />

            <div className={styles.modalBody}>
              <h2 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#1A202C', marginBottom: '8px' }}>
                {selectedProduto.nome}
              </h2>

              {/* Informações de Alérgenos e Customização */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                {selectedProduto.permiteCustomizacao && (
                  <span style={{ fontSize: '0.75rem', background: '#7A1C31', color: 'white', padding: '4px 10px', borderRadius: '50px', fontWeight: '700' }}>⭐ Aceita Especificações / Personalização</span>
                )}

                {selectedProduto.contemGluten === false ? (
                  <span className={`${styles.badge} ${styles.badgeGlutenFree}`}>Sem Glúten</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '50px', fontWeight: '600' }}>Contém Glúten</span>
                )}

                {selectedProduto.contemLactose === false ? (
                  <span className={`${styles.badge} ${styles.badgeLactoseFree}`}>Zero Lactose</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '50px', fontWeight: '600' }}>Contém Lactose</span>
                )}

                {selectedProduto.contemAcucar === false ? (
                  <span className={`${styles.badge} ${styles.badgeSugarFree}`}>Sem Açúcar</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', background: '#F3E8FF', color: '#6B21A8', padding: '4px 10px', borderRadius: '50px', fontWeight: '600' }}>Contém Açúcar</span>
                )}
              </div>

              <p style={{ color: '#4A5568', lineHeight: '1.6', fontSize: '1rem', marginBottom: '25px' }}>
                {selectedProduto.descricao || "Produto artesanal feito com rigoroso padrão de qualidade da Panificadora Sabor de Mel."}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#718096', display: 'block' }}>Preço Unitário</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#7A1C31' }}>
                    R$ {selectedProduto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button 
                  className={styles.btnOrder} 
                  style={{ padding: '14px 28px', fontSize: '1.05rem' }}
                  onClick={() => {
                    handleIrParaEncomenda(selectedProduto.id);
                  }}
                >
                  Fazer Encomenda <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
