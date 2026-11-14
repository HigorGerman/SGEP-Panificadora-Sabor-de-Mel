// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Manual do Usuário · SGEP Sabor de Mel',
  tagline: 'Sistema de Gestão de Encomendas para Panificadora Sabor de Mel',
  favicon: 'img/favicon.svg',

  url: 'https://sgep-panificadora-sabor-de-mel.vercel.app',
  baseUrl: '/',

  organizationName: 'HigorGerman',
  projectName: 'SGEP-Panificadora-Sabor-de-Mel',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '🍞 SGEP · Panificadora Sabor de Mel',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'manualSidebar',
            position: 'left',
            label: 'Manual do Usuário',
          },
          {
            href: 'https://sgep-panificadora-sabor-de-mel.vercel.app',
            label: 'Acessar Sistema SGEP',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Módulos do Manual',
            items: [
              {
                label: '1. Introdução e Acesso',
                to: '/',
              },
              {
                label: '2. Portal do Cliente',
                to: '/cliente/catalogo-e-encomendas',
              },
              {
                label: '3. Produção e Atendimento',
                to: '/operacional/painel-producao',
              },
              {
                label: '4. Painel Administrativo',
                to: '/administracao/dashboard-financeiro',
              },
            ],
          },
          {
            title: 'Links Rápidos',
            items: [
              {
                label: 'Sistema em Produção (Vercel)',
                href: 'https://sgep-panificadora-sabor-de-mel.vercel.app',
              },
              {
                label: 'Repositório GitHub',
                href: 'https://github.com/HigorGerman/SGEP-Panificadora-Sabor-de-Mel',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} SGEP - Panificadora Sabor de Mel · Desenvolvido por Higor Germano (FIPP / Unoeste).`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;

