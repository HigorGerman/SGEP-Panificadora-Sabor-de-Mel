"use client"
import { useEffect, useState } from 'react';
import api from '@/services/api';
import styles from './produtos.module.css';

interface Produto {
  id: number;
  nome: string;
  precoUnitario: number;
  categoriaId: number;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    precoUnitario: '' as number | string,
    categoriaId: 1 as number | string, // Padrão: Pães
    imagemUrl: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    setUserRole(role);
    carregarProdutos();
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

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/Produtos/${editId}`, {
          Nome: novoProduto.nome,
          PrecoUnitario: Number(novoProduto.precoUnitario),
          CategoriaId: Number(novoProduto.categoriaId),
          ImagemUrl: novoProduto.imagemUrl
        });
        alert("Produto atualizado com sucesso!");
      } else {
        await api.post('/Produtos', {
          Nome: novoProduto.nome,
          PrecoUnitario: Number(novoProduto.precoUnitario),
          CategoriaId: Number(novoProduto.categoriaId),
          ImagemUrl: novoProduto.imagemUrl
        });
        alert("Produto cadastrado com sucesso!");
      }
      
      setIsModalOpen(false); // Fecha o modal
      setEditId(null);
      setNovoProduto({ nome: '', precoUnitario: '', categoriaId: 1, imagemUrl: '' }); // Limpa
      carregarProdutos(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao salvar produto. Verifique os campos.");
    }
  };

  const handleEditar = (produto: Produto) => {
    setNovoProduto({
      nome: produto.nome,
      precoUnitario: produto.precoUnitario,
      categoriaId: produto.categoriaId,
      imagemUrl: ''
    });
    setEditId(produto.id);
    setIsModalOpen(true);
  };

  const handleExcluir = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await api.delete(`/Produtos/${id}`);
        alert("Produto excluído com sucesso!");
        carregarProdutos();
      } catch (error) {
        alert("Erro ao excluir produto.");
      }
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestão de Produtos</h1>
        {userRole === '0' && (
          <button className={styles.btnNovo} onClick={() => {
            setEditId(null);
            setNovoProduto({ nome: '', precoUnitario: '', categoriaId: 1, imagemUrl: '' });
            setIsModalOpen(true);
          }}>
            + Novo Produto
          </button>
        )}
      </div>

      {/* Tabela de Produtos */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.length === 0 ? (
            <tr><td colSpan={3} style={{textAlign: 'center'}}>Nenhum produto cadastrado.</td></tr>
          ) : (
            produtos.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>
                  {userRole === '0' && (
                    <>
                      <button className={styles.btnEdit} style={{marginRight: '8px', backgroundColor: '#e0a800', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer'}} onClick={() => handleEditar(p)}>Alterar</button>
                      <button className={styles.btnDelete} onClick={() => handleExcluir(p.id)}>Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
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
                <label>ID Categoria (1: Pães, 2: Bolos)</label>
                <input 
                  type="number" 
                  required 
                  value={novoProduto.categoriaId}
                  onChange={e => setNovoProduto({...novoProduto, categoriaId: e.target.value})}
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
              <div className={styles.modalActions}>
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