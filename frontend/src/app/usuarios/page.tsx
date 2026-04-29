"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

      {/* Tabela de Usuários */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan={4} style={{textAlign: 'center'}}>Nenhum usuário cadastrado.</td></tr>
          ) : (
            usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.usuarioNome}</td>
                <td>{u.email}</td>
                <td>{u.perfil === 0 ? 'Admin' : 'Funcionário'}</td>
                <td>
                   {/* Espaço para botões Alterar / Excluir no futuro */}
                   <button className={styles.btnEdit} style={{marginRight: '8px', backgroundColor: '#e0a800', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer'}} onClick={() => handleEditar(u)}>Alterar</button>
                   <button className={styles.btnDelete} onClick={() => handleExcluir(u.id)}>Excluir</button>
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
