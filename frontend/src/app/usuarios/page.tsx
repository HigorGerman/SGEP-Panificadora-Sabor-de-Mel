"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import api from '@/services/api';
import styles from './usuarios.module.css';

interface Usuario {
  id: number;
  usuarioNome: string;
  email: string;
  perfil: number; // 0: Admin, 1: Funcionario
}

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [novoUsuario, setNovoUsuario] = useState({
    usuarioNome: '',
    email: '',
    senha: '',
    perfil: 1 // Default Funcionario (1)
  });

  useEffect(() => {
    const role = localStorage.getItem('usuario_role');
    
    if (role !== '0') {
      alert("Acesso restrito. Apenas administradores podem acessar esta página.");
      router.push('/');
      return;
    }

    setUserRole(role);
    carregarUsuarios();
  }, [router]);

  const carregarUsuarios = async () => {
    try {
      const response = await api.get('/Usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/Usuarios/${editId}`, {
          UsuarioNome: novoUsuario.usuarioNome,
          Email: novoUsuario.email,
          Senha: novoUsuario.senha || "",
          Perfil: novoUsuario.perfil
        });
        alert("Usuário atualizado com sucesso!");
      } else {
        await api.post('/Usuarios', {
          UsuarioNome: novoUsuario.usuarioNome,
          Email: novoUsuario.email,
          Senha: novoUsuario.senha,
          Perfil: novoUsuario.perfil
        });
        alert("Usuário cadastrado com sucesso!");
      }
      
      setIsModalOpen(false); // Fecha o modal
      setEditId(null);
      setNovoUsuario({ usuarioNome: '', email: '', senha: '', perfil: 1 }); // Limpa
      carregarUsuarios(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao salvar usuário. Verifique os campos.");
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setNovoUsuario({
      usuarioNome: usuario.usuarioNome,
      email: usuario.email,
      senha: '', // Opcional/ignorado no update de usuário
      perfil: usuario.perfil
    });
    setEditId(usuario.id);
    setIsModalOpen(true);
  };

  const handleExcluir = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await api.delete(`/Usuarios/${id}`);
        alert("Usuário excluído com sucesso!");
        carregarUsuarios();
      } catch (error) {
        alert("Erro ao excluir usuário.");
      }
    }
  };

  if (loading) return <p style={{padding: '40px'}}>Carregando...</p>;

  // Segurança double-check na tela (não renderiza se não for admin)
  if (userRole !== '0') return null;

  const filteredUsuarios = usuarios.filter(u => 
    u.usuarioNome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestão de Usuários</h1>
        <button className={styles.btnNovo} onClick={() => {
          setEditId(null);
          setNovoUsuario({ usuarioNome: '', email: '', senha: '', perfil: 1 });
          setIsModalOpen(true);
        }}>
          + Novo Usuário
        </button>
      </div>

      <div className={styles.searchBar}>
        <FiSearch className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar usuário por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {filteredUsuarios.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#718096', width: '100%', gridColumn: '1 / -1' }}>Nenhum usuário encontrado.</p>
        ) : (
          filteredUsuarios.map((u) => (
            <div key={u.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <h3>{u.usuarioNome}</h3>
                <p>{u.email}</p>
                <span className={u.perfil === 0 ? styles.badgeAdmin : styles.badgeFunc}>
                  {u.perfil === 0 ? 'Admin' : 'Funcionário'}
                </span>
              </div>
              <div className={styles.cardActions}>
                <button className={styles.btnIconEdit} onClick={() => handleEditar(u)} title="Alterar">
                  <FiEdit />
                </button>
                <button className={styles.btnIconDelete} onClick={() => handleExcluir(u.id)} title="Excluir">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editId ? "Alterar Usuário" : "Novo Usuário"}</h2>
            <form onSubmit={handleSalvar}>
              <div className={styles.inputGroup}>
                <label>Nome do Usuário</label>
                <input 
                  type="text" 
                  required 
                  value={novoUsuario.usuarioNome}
                  onChange={e => setNovoUsuario({...novoUsuario, usuarioNome: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>E-mail</label>
                <input 
                  type="email" 
                  required 
                  value={novoUsuario.email}
                  onChange={e => setNovoUsuario({...novoUsuario, email: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Senha {editId && "(Deixe em branco para manter)"}</label>
                <input 
                  type="password" 
                  required={!editId} 
                  value={novoUsuario.senha}
                  onChange={e => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                  minLength={4}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Perfil de Acesso</label>
                <select 
                  value={novoUsuario.perfil}
                  onChange={e => setNovoUsuario({...novoUsuario, perfil: parseInt(e.target.value)})}
                >
                  <option value={0}>Admin</option>
                  <option value={1}>Funcionário</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancelar}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
