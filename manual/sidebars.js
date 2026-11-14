/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  manualSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '1. Visão Geral e Primeiro Acesso',
    },
    {
      type: 'category',
      label: '2. Portal do Cliente',
      collapsed: false,
      items: [
        'cliente/cadastro-e-login',
        'cliente/catalogo-e-encomendas',
        'cliente/pagamentos-e-acompanhamento',
        'cliente/meu-perfil-e-seguranca',
      ],
    },
    {
      type: 'category',
      label: '3. Produção e Atendimento (Balcão)',
      collapsed: false,
      items: [
        'operacional/painel-producao',
        'operacional/retirada-e-cobranca',
        'operacional/receitas-e-historico',
      ],
    },
    {
      type: 'category',
      label: '4. Administração e Gestão',
      collapsed: false,
      items: [
        'administracao/dashboard-financeiro',
        'administracao/controle-inadimplencia',
        'administracao/cadastros-base',
      ],
    },
  ],
};

export default sidebars;

