"use client"
import { useEffect, useState } from 'react';
import { FiSearch, FiEdit, FiTrash2, FiSlash } from 'react-icons/fi';
import api from '@/services/api';
import styles from './categorias.module.css';

interface Categoria {
  id: number;
  descricao: string;
  inativo: boolean;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [novaCategoria, setNovaCategoria] = useState({
    descricao: '',
    inativo: false
  });

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    setUserRole(role);
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/Categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao carregar categorias", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/Categorias/${editId}`, novaCategoria);
        alert("Categoria atualizada com sucesso!");
      } else {
        await api.post('/Categorias', novaCategoria);
        alert("Categoria cadastrada com sucesso!");
      }
      
      setIsModalOpen(false); // Fecha o modal
      setEditId(null);
      setNovaCategoria({ descricao: '', inativo: false }); // Limpa
      carregarCategorias(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao salvar categoria. Verifique os campos.");
    }
  };

  const handleEditar = (categoria: Categoria) => {
    setNovaCategoria({
      descricao: categoria.descricao,
      inativo: categoria.inativo
    });
    setEditId(categoria.id);
    setIsModalOpen(true);
  };

  const handleExcluir = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        const response = await api.delete(`/Categorias/${id}`);
        alert(response.data?.mensagem || "Categoria excluída com sucesso!");
        carregarCategorias();
      } catch (error) {
        alert("Erro ao excluir categoria.");
      }
    }
  };

  if (loading) return <p style={{padding: '40px'}}>Carregando...</p>;

  const filteredCategorias = categorias.filter(c => 
    c.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestão de Categorias</h1>
        {(userRole === '0' || userRole === '1') && (
          <button className={styles.btnNovo} onClick={() => {
            setEditId(null);
            setNovaCategoria({ descricao: '', inativo: false });
            setIsModalOpen(true);
          }}>
            + Nova Categoria
          </button>
        )}
      </div>

      <div className={styles.searchBar}>
        <FiSearch className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar categoria..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {filteredCategorias.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#718096', width: '100%', gridColumn: '1 / -1' }}>Nenhuma categoria encontrada.</p>
        ) : (
          filteredCategorias.map((cat) => (
            <div key={cat.id} className={styles.card} style={{ opacity: cat.inativo ? 0.6 : 1 }}>
              <div className={styles.cardInfo}>
                <h3 style={{ textDecoration: cat.inativo ? 'line-through' : 'none' }}>{cat.descricao}</h3>
                <span className={cat.inativo ? styles.badgeFunc : styles.badgeAdmin}>
                  {cat.inativo ? 'Inativa' : 'Ativa'}
                </span>
              </div>
              <div className={styles.cardActions}>
                {(userRole === '0' || userRole === '1') && (
                  <>
                    <button className={styles.btnIconEdit} onClick={() => handleEditar(cat)} title="Alterar">
                      <FiEdit />
                    </button>
                    <button className={styles.btnIconDelete} onClick={() => handleExcluir(cat.id)} title="Excluir">
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
          <div className={styles.modal}>
            <h2>{editId ? "Alterar Categoria" : "Nova Categoria"}</h2>
            <form onSubmit={handleSalvar}>
              <div className={styles.inputGroup}>
                <label>Descrição</label>
                <input 
                  type="text" 
                  required 
                  value={novaCategoria.descricao}
                  onChange={e => setNovaCategoria({...novaCategoria, descricao: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center'}}>
                <input 
                  type="checkbox" 
                  id="inativo"
                  checked={novaCategoria.inativo}
                  onChange={e => setNovaCategoria({...novaCategoria, inativo: e.target.checked})}
                  style={{marginRight: '10px'}}
                />
                <label htmlFor="inativo" style={{marginBottom: 0}}>Inativa (não aparecerá em listagens)</label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancelar}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar}>Salvar Categoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
