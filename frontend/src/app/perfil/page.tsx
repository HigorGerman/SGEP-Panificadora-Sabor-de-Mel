"use client"
import { useEffect, useState } from 'react';
import api from '@/services/api';
import styles from './perfil.module.css';
import { useRouter } from 'next/navigation';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCliente, setIsCliente] = useState(false);
  
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    role: '',
    restricaoGluten: false,
    restricaoLactose: false,
    restricaoAcucar: false
  });

  useEffect(() => {
    const tipo = localStorage.getItem('usuario_tipo');
    const uId = localStorage.getItem('usuario_id');
    const roleNome = localStorage.getItem('usuario_role') === '0' ? 'Admin' : (localStorage.getItem('usuario_role') === '1' ? 'Funcionário' : 'Cliente');

    if (!tipo || !uId) {
      router.push('/login');
      return;
    }

    if (tipo === 'Cliente') {
      setIsCliente(true);
      api.get(`/Clientes/${uId}`)
        .then(res => {
          setPerfil({
            nome: res.data.nome || '',
            email: res.data.email || '',
            cpf: res.data.cpf || '',
            telefone: res.data.telefone || '',
            role: roleNome,
            restricaoGluten: res.data.restricaoGluten || false,
            restricaoLactose: res.data.restricaoLactose || false,
            restricaoAcucar: res.data.restricaoAcucar || false
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      // É usuário/funcionário
      setPerfil(prev => ({
        ...prev,
        nome: localStorage.getItem('usuario_nome') || '',
        email: localStorage.getItem('usuario_email') || '',
        role: roleNome
      }));
      setLoading(false);
    }
  }, [router]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCliente) {
      alert("A edição de perfil para funcionários não está disponível nesta tela ainda.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        Nome: perfil.nome,
        Telefone: perfil.telefone,
        RestricaoGluten: perfil.restricaoGluten,
        RestricaoLactose: perfil.restricaoLactose,
        RestricaoAcucar: perfil.restricaoAcucar
      };

      await api.put('/Clientes/perfil', payload);
      alert("Perfil atualizado com sucesso!");
      
      // Atualiza o localStorage se mudou o nome
      localStorage.setItem('usuario_nome', perfil.nome);
      // Força um evento ou recarregamento para o Header atualizar (opcional)
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meu Perfil</h1>
      </div>

      <div className={styles.formCard}>
        <div className={styles.alertWarning}>
          ℹ️ Para alterar o seu e-mail, CPF ou Perfil de Acesso, entre em contato com o suporte.
        </div>

        <form onSubmit={handleSalvar}>
          <div className={styles.inputGroup}>
            <label>Nome Completo</label>
            <input 
              type="text" 
              value={perfil.nome} 
              onChange={e => setPerfil({...perfil, nome: e.target.value})}
              disabled={!isCliente}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Telefone</label>
            <input 
              type="text" 
              value={perfil.telefone} 
              onChange={e => setPerfil({...perfil, telefone: e.target.value})}
              disabled={!isCliente}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <input type="email" value={perfil.email} disabled />
          </div>

          <div className={styles.inputGroup}>
            <label>CPF</label>
            <input type="text" value={perfil.cpf || 'Não informado'} disabled />
          </div>

          <div className={styles.inputGroup}>
            <label>Perfil de Acesso</label>
            <input type="text" value={perfil.role} disabled />
          </div>

          {isCliente && (
            <div className={styles.checkboxContainer}>
              <strong style={{ color: '#2d3748', marginBottom: '5px' }}>Restrições Alimentares (Alergias / Dietas)</strong>
              
              <div className={styles.checkboxItem}>
                <input 
                  type="checkbox" 
                  id="chkGluten" 
                  checked={perfil.restricaoGluten}
                  onChange={e => setPerfil({...perfil, restricaoGluten: e.target.checked})}
                />
                <label htmlFor="chkGluten">Tenho restrição a Glúten</label>
              </div>

              <div className={styles.checkboxItem}>
                <input 
                  type="checkbox" 
                  id="chkLactose" 
                  checked={perfil.restricaoLactose}
                  onChange={e => setPerfil({...perfil, restricaoLactose: e.target.checked})}
                />
                <label htmlFor="chkLactose">Tenho restrição a Lactose</label>
              </div>

              <div className={styles.checkboxItem}>
                <input 
                  type="checkbox" 
                  id="chkAcucar" 
                  checked={perfil.restricaoAcucar}
                  onChange={e => setPerfil({...perfil, restricaoAcucar: e.target.checked})}
                />
                <label htmlFor="chkAcucar">Tenho restrição a Açúcar (Diabético, Dietas)</label>
              </div>
            </div>
          )}

          {isCliente && (
            <button type="submit" className={styles.btnSalvar} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
