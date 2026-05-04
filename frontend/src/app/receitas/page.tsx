"use client"
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { FiPrinter, FiSearch } from 'react-icons/fi';
import styles from './receitas.module.css';

interface ReceitaData {
  id: number;
  nome: string;
  imagemUrl?: string;
  ingredientes?: string;
  modoPreparo?: string;
  rendimento?: string;
  categoriaId?: number;
}

export default function LivroReceitasPage() {
  const [receitas, setReceitas] = useState<ReceitaData[]>([]);
  const [categorias, setCategorias] = useState<{id: number, descricao: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedReceita, setSelectedReceita] = useState<ReceitaData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ingredientes: '', modoPreparo: '', rendimento: '' });
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    setUserRole(role);
    if (role === '0' || role === '1') {
        carregarReceitas();
    } else {
        setLoading(false);
    }
  }, []);

  const carregarReceitas = async () => {
    try {
      const [resReceitas, resCategorias] = await Promise.all([
        api.get('/Produtos/com-receitas'),
        api.get('/Categorias')
      ]);
      setReceitas(resReceitas.data);
      setCategorias(resCategorias.data);
    } catch (error) {
      console.error("Erro ao carregar receitas", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaNome = (id?: number) => {
    if (!id) return '';
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.descricao : '';
  };

  const parseIngredientes = (texto: string) => {
    if (!texto) return [];
    return texto.split('\n').filter(t => t.trim() !== '');
  };

  const handleEditClick = () => {
    setEditForm({
      ingredientes: selectedReceita?.ingredientes || '',
      modoPreparo: selectedReceita?.modoPreparo || '',
      rendimento: selectedReceita?.rendimento || ''
    });
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    if (!selectedReceita) return;
    try {
      await api.put(`/Produtos/${selectedReceita.id}/receita`, editForm);
      alert("Receita atualizada com sucesso!");
      setIsEditing(false);
      carregarReceitas();
      setSelectedReceita({ ...selectedReceita, ...editForm });
    } catch (error) {
      alert("Erro ao salvar receita.");
    }
  };

  const handleCloseModal = () => {
    setSelectedReceita(null);
    setIsEditing(false);
  };

  if (loading) return <p style={{padding: 40}}>Carregando livro de receitas...</p>;

  if (userRole !== '0' && userRole !== '1') {
      return <p style={{padding: 40}}>Acesso negado. Apenas administradores e funcionários podem acessar o Livro de Receitas.</p>;
  }

  // Filtrar apenas produtos que tenham ingredientes ou modo de preparo informados
  const receitasFiltradas = receitas.filter(r => {
    if (!r.ingredientes && !r.modoPreparo) return false;
    
    const nomeMatch = r.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = getCategoriaNome(r.categoriaId).toLowerCase().includes(searchTerm.toLowerCase());
    
    return nomeMatch || catMatch;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Livro de Receitas</h1>
        <p>Catálogo interno com a ficha técnica dos produtos.</p>
      </div>

      <div className={styles.searchBar}>
        <FiSearch className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar receita por nome ou categoria..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {receitasFiltradas.length === 0 ? (
          <p>Nenhuma receita cadastrada. Adicione informações de receita no cadastro de produtos.</p>
        ) : (
          receitasFiltradas.map((r) => (
            <div key={r.id} className={styles.card} onClick={() => setSelectedReceita(r)}>
              {r.imagemUrl ? (
                  <img src={r.imagemUrl} alt={r.nome} className={styles.cardImage} />
              ) : (
                  <div className={styles.cardImage} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', backgroundColor: '#eaeaea'}}>
                    Sem Foto
                  </div>
              )}
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>{r.nome}</div>
                <div className={styles.cardYield}>
                  Rendimento: {r.rendimento || 'Não informado'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedReceita && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalSidebar} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{width: '100%'}}>
                <h2 className={styles.modalTitle}>{selectedReceita.nome}</h2>
                <div className={styles.printMeta}>
                  {getCategoriaNome(selectedReceita.categoriaId) && (
                    <p className={styles.cardCategory}>Categoria: {getCategoriaNome(selectedReceita.categoriaId)}</p>
                  )}
                  {!isEditing && <p className={styles.cardYield}>Rendimento: {selectedReceita.rendimento || 'Não informado'}</p>}
                </div>
              </div>
              <button className={styles.btnClose} onClick={handleCloseModal}>&times;</button>
            </div>

            {isEditing ? (
              <div style={{ marginTop: 10 }}>
                <h3 className={styles.sectionTitle}>Rendimento</h3>
                <input 
                  type="text" 
                  value={editForm.rendimento} 
                  onChange={e => setEditForm({...editForm, rendimento: e.target.value})} 
                  className={styles.inputField} 
                  placeholder="Ex: 10 porções"
                />

                <h3 className={styles.sectionTitle}>Ingredientes</h3>
                <textarea 
                  value={editForm.ingredientes} 
                  onChange={e => setEditForm({...editForm, ingredientes: e.target.value})} 
                  className={styles.textareaField} 
                  placeholder="Um ingrediente por linha"
                  rows={6}
                />

                <h3 className={styles.sectionTitle}>Modo de Preparo</h3>
                <textarea 
                  value={editForm.modoPreparo} 
                  onChange={e => setEditForm({...editForm, modoPreparo: e.target.value})} 
                  className={styles.textareaField} 
                  placeholder="Passo a passo..."
                  rows={8}
                />

                <div style={{display: 'flex', gap: 10, marginTop: 30}}>
                  <button className={styles.btnSave} onClick={handleSaveClick}>Salvar Alterações</button>
                  <button className={styles.btnCancel} onClick={() => setIsEditing(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <h3 className={styles.sectionTitle}>Ingredientes</h3>
                <ul className={styles.ingredientsList}>
                  {parseIngredientes(selectedReceita.ingredientes || '').length > 0 ? (
                      parseIngredientes(selectedReceita.ingredientes || '').map((ing, idx) => (
                          <li key={idx}>{ing}</li>
                      ))
                  ) : (
                      <li>Ingredientes não informados.</li>
                  )}
                </ul>

                <h3 className={styles.sectionTitle}>Modo de Preparo</h3>
                <div className={styles.prepMode}>
                    {selectedReceita.modoPreparo || 'Modo de preparo não informado.'}
                </div>

                {!isEditing && (
                  <div className={styles.actionButtons}>
                    {userRole === '0' && (
                      <button 
                          className={styles.btnEdit} 
                          onClick={handleEditClick}
                      >
                          Editar Receita
                      </button>
                    )}
                    <button 
                        className={styles.btnPrint} 
                        onClick={() => window.print()}
                    >
                        <FiPrinter size={20} /> Imprimir Receita
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
