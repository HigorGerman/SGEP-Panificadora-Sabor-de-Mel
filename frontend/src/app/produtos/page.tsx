"use client"
import { useEffect, useState } from 'react';
import { FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import api from '@/services/api';
import styles from './produtos.module.css';

interface Produto {
  id: number;
  nome: string;
  precoUnitario: number;
  categoriaId: number;
  imagemUrl?: string;
  descricao?: string;
  ingredientes?: string;
  modoPreparo?: string;
  rendimento?: string;
}

interface Categoria {
  id: number;
  descricao: string;
  inativo: boolean;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    precoUnitario: '' as number | string,
    categoriaId: '' as number | string,
    imagemUrl: '',
    descricao: '',
    ingredientes: '',
    modoPreparo: '',
    rendimento: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    setUserRole(role);
    carregarProdutos();
    carregarCategorias();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/Produtos');
      setProdutos(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/Categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao carregar categorias", error);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        Nome: novoProduto.nome,
        PrecoUnitario: Number(novoProduto.precoUnitario),
        CategoriaId: Number(novoProduto.categoriaId),
        ImagemUrl: novoProduto.imagemUrl,
        Descricao: novoProduto.descricao,
        Ingredientes: novoProduto.ingredientes,
        ModoPreparo: novoProduto.modoPreparo,
        Rendimento: novoProduto.rendimento
      };

      if (editId) {
        await api.put(`/Produtos/${editId}`, payload);
        alert("Produto atualizado com sucesso!");
      } else {
        await api.post('/Produtos', payload);
        alert("Produto cadastrado com sucesso!");
      }
      
      setIsModalOpen(false); // Fecha o modal
      setEditId(null);
      setNovoProduto({ nome: '', precoUnitario: '', categoriaId: '', imagemUrl: '', descricao: '', ingredientes: '', modoPreparo: '', rendimento: '' }); // Limpa
      carregarProdutos(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao salvar produto. Verifique os campos.");
    }
  };

  const handleEditar = async (produto: Produto) => {
    try {
      // Busca os dados completos do produto (incluindo a receita)
      const response = await api.get(`/Produtos/${produto.id}`);
      const dados = response.data;

      setNovoProduto({
        nome: dados.nome,
        precoUnitario: dados.precoUnitario,
        categoriaId: dados.categoriaId,
        imagemUrl: dados.imagemUrl || '',
        descricao: dados.descricao || '',
        ingredientes: dados.ingredientes || '',
        modoPreparo: dados.modoPreparo || '',
        rendimento: dados.rendimento || ''
      });
      setEditId(produto.id);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados do produto", error);
      alert("Erro ao carregar dados do produto para edição.");
    }
  };

  const handleExcluir = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await api.delete(`/Produtos/${id}`);
        alert("Produto excluído com sucesso!");
        carregarProdutos();
      } catch (error: any) {
        alert(error.response?.data?.mensagem || "Erro ao excluir produto.");
      }
    }
  };

  if (loading) return <p style={{padding: '40px'}}>Carregando...</p>;

  const getCategoriaDesc = (id: number) => {
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.descricao : 'Desconhecida';
  };

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Os campos da receita só devem aparecer se for Admin (0) ou Funcionário (1), 
  // que são os perfis com acesso a essa tela. Se chegou aqui, já tem permissão.
  // Mesmo assim, validamos `userRole === '0' || userRole === '1'`

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestão de Produtos</h1>
        {userRole === '0' && (
          <button className={styles.btnNovo} onClick={() => {
            setEditId(null);
            setNovoProduto({ nome: '', precoUnitario: '', categoriaId: categorias.length > 0 ? categorias[0].id : '', imagemUrl: '', descricao: '', ingredientes: '', modoPreparo: '', rendimento: '' });
            setIsModalOpen(true);
          }}>
            + Novo Produto
          </button>
        )}
      </div>

      <div className={styles.searchBar}>
        <FiSearch className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar produto por nome ou descrição..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {filteredProdutos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#718096', width: '100%', gridColumn: '1 / -1' }}>Nenhum produto encontrado.</p>
        ) : (
          filteredProdutos.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>{p.nome}</h3>
                  <span style={{ color: '#5B0A1A', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {p.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <span className={styles.badgeFunc} style={{ marginBottom: '15px', display: 'inline-block' }}>
                  {getCategoriaDesc(p.categoriaId)}
                </span>
                {p.descricao && (
                   <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.descricao}</p>
                )}
              </div>
              <div className={styles.cardActions}>
                {userRole === '0' && (
                  <>
                    <button className={styles.btnIconEdit} onClick={() => handleEditar(p)} title="Alterar">
                      <FiEdit />
                    </button>
                    <button className={styles.btnIconDelete} onClick={() => handleExcluir(p.id)} title="Excluir">
                      <FiTrash2 />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editId ? "Alterar Produto" : "Novo Produto"}</h2>
            <form onSubmit={handleSalvar}>
              <div className={styles.inputGroup}>
                <label>Nome do Produto</label>
                <input 
                  type="text" 
                  required 
                  value={novoProduto.nome}
                  onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Preço Unitário</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={novoProduto.precoUnitario}
                  onChange={e => setNovoProduto({...novoProduto, precoUnitario: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Categoria</label>
                <select 
                  required
                  value={novoProduto.categoriaId}
                  onChange={e => setNovoProduto({...novoProduto, categoriaId: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="" disabled>Selecione uma categoria...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.descricao}</option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Descrição (Pública)</label>
                <textarea 
                  value={novoProduto.descricao}
                  onChange={e => setNovoProduto({...novoProduto, descricao: e.target.value})}
                  placeholder="Ex: Pão caseiro recheado com calabresa e queijo..."
                  rows={2}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>URL da Imagem (Opcional)</label>
                <input 
                  type="text" 
                  value={novoProduto.imagemUrl}
                  onChange={e => setNovoProduto({...novoProduto, imagemUrl: e.target.value})}
                  placeholder="https://link-da-imagem.com/foto.jpg"
                />
              </div>

              {(userRole === '0' || userRole === '1') && (
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                  <h3 style={{ marginBottom: '15px', fontSize: '1.1em', color: '#333' }}>Ficha Técnica / Receita (Uso Interno)</h3>
                  
                  <div className={styles.inputGroup}>
                    <label>Ingredientes</label>
                    <textarea 
                      value={novoProduto.ingredientes}
                      onChange={e => setNovoProduto({...novoProduto, ingredientes: e.target.value})}
                      placeholder="Ex: 2 ovos, 1 xícara de leite..."
                      rows={3}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Modo de Preparo</label>
                    <textarea 
                      value={novoProduto.modoPreparo}
                      onChange={e => setNovoProduto({...novoProduto, modoPreparo: e.target.value})}
                      placeholder="Ex: Misture tudo e asse por 30 minutos..."
                      rows={3}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Rendimento</label>
                    <input 
                      type="text" 
                      value={novoProduto.rendimento}
                      onChange={e => setNovoProduto({...novoProduto, rendimento: e.target.value})}
                      placeholder="Ex: 12 porções, 1 kg, etc."
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                </div>
              )}

              <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancelar}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar}>Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}