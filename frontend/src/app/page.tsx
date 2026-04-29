"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FaClock, FaBreadSlice, FaStar } from 'react-icons/fa';
import api from '@/services/api';
import styles from './page.module.css';

interface Produto {
  id: number;
  nome: string;
  precoUnitario: number;
  imagemUrl?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const nome = localStorage.getItem('usuario_nome');
    if (nome) {
      setIsLoggedIn(true);
      setUserName(nome);
    }
  }, []);

  const categorias = [
    { nome: 'Pães', imagem: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' },
    { nome: 'Bolos', imagem: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
    { nome: 'Salgados', imagem: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80' },
  ];

  return (
    <div className={styles.container}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        {isLoggedIn && (
          <div className={styles.greeting}>Olá, {userName}!</div>
        )}
        <h1 className={styles.heroTitle}>O sabor da tradição na sua mesa</h1>
        <p className={styles.heroSubtitle}>
          Pães artesanais quentinhos, bolos caseiros e doces feitos com muito carinho para você e sua família.
        </p>
        <button
          className={styles.heroButton}
          onClick={() => router.push('/nova-encomenda')}
        >
          Fazer uma Encomenda Agora
        </button>
      </section>

      {/* SHORTCUT CARDS */}
      <section className={styles.shortcutsSection}>
        <div className={styles.shortcutCard}>
          <div className={styles.iconWrapper}>
            <FaClock />
          </div>
          <h3 className={styles.shortcutTitle}>Encomendas</h3>
          <p className={styles.shortcutDesc}>Peça agora e retire na hora marcada.</p>
        </div>

        <div className={styles.shortcutCard}>
          <div className={styles.iconWrapper}>
            <FaBreadSlice />
          </div>
          <h3 className={styles.shortcutTitle}>Produtos</h3>
          <p className={styles.shortcutDesc}>Veja nosso catálogo completo de delícias.</p>
        </div>

        <div className={styles.shortcutCard}>
          <div className={styles.iconWrapper}>
            <FaStar />
          </div>
          <h3 className={styles.shortcutTitle}>Qualidade</h3>
          <p className={styles.shortcutDesc}>Ingredientes selecionados e produção diária.</p>
        </div>
      </section>

      {/* VITRINE DE CATEGORIAS */}
      <section className={styles.categoriesSection}>
        <h2 className={styles.sectionTitle}>Nossas Especialidades</h2>
        <div className={styles.categoriesGrid}>
          {categorias.map((cat, idx) => (
            <div key={idx} className={styles.categoryCard} onClick={() => router.push('/catalogo')}>
              <div className={styles.categoryImageWrapper}>
                <img src={cat.imagem} alt={cat.nome} className={styles.categoryImage} />
              </div>
              <h3 className={styles.categoryTitle}>{cat.nome}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER SIMPLES */}
      <footer className={styles.footer}>
        <p><strong>Panificadora Sabor de Mel</strong></p>
        <p>Av. Barão do Rio Branco, 880, Centro, 19190-005 - Santo Expedito, SP</p>
        <p>Aberto de segunda a sabado : 05:00 às 20:00 (Encomendas: 08h às 18h)</p>
        <p>Domingo: 05:00 às 13:00</p>
      </footer>
    </div>
  );
}