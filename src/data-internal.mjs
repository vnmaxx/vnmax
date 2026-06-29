// Conteudo RESERVADO da area interna.
// Modulo importado SOMENTE por internal.js (que e carregado via import() dinamico),
// para que o Vite isole tudo isto em um chunk separado, fora do bundle publico.
// Ainda assim, isto NAO e confidencialidade real: o chunk e acessivel por quem
// inspecionar a rede. Para sigilo de fato, mover para um backend protegido.

export const internalContent = {
  // Divisoes do ecossistema (cores, plataformas e produtos).
  divisions: [
    {
      key: 'AI', name: 'VNMAX AI', color: '#F5D342',
      slogan: 'Inteligência que trabalha por você.',
      platform: 'VNMAX Nexus',
      goal: 'Automatizar empresas através de IA.',
      products: ['Nexus Chat', 'Nexus Agent', 'Nexus Voice', 'Nexus Vision', 'Nexus OCR', 'Nexus Flow', 'Nexus Search', 'Nexus API'],
    },
    {
      key: 'Tech', name: 'VNMAX Tech', color: '#2F7BFF',
      slogan: 'Transformando ideias em software.',
      platform: 'VNMAX Forge',
      goal: 'Criar sistemas corporativos, APIs e SaaS.',
      products: ['Forge ERP', 'Forge CRM', 'Forge API', 'Forge Gateway', 'Forge Runtime', 'Forge Identity', 'Forge SDK'],
    },
    {
      key: 'Studio', name: 'VNMAX Studio', color: '#FF8A3D',
      slogan: 'Experiências digitais modernas.',
      platform: 'VNMAX Canvas',
      goal: 'Criar experiências digitais modernas.',
      products: ['Canvas Brand', 'Canvas UI', 'Canvas UX', 'Canvas Motion', 'Canvas Web', 'Canvas Identity'],
    },
    {
      key: 'Cloud', name: 'VNMAX Cloud', color: '#36D399',
      slogan: 'Infraestrutura que sustenta o ecossistema.',
      platform: 'VNMAX Orbit',
      goal: 'Hospedar e operar infraestrutura tecnológica.',
      products: ['Orbit Compute', 'Orbit Storage', 'Orbit Backup', 'Orbit DNS', 'Orbit Mail', 'Orbit CDN', 'Orbit Containers'],
    },
    {
      key: 'Security', name: 'VNMAX Security', color: '#FF4D4F',
      slogan: 'Segurança digital para empresas.',
      platform: 'VNMAX Shield',
      goal: 'Garantir segurança digital para empresas.',
      products: ['Shield Defender', 'Shield Firewall', 'Shield Sentinel', 'Shield Vault', 'Shield Pentest', 'Shield WAF'],
    },
    {
      key: 'Data', name: 'VNMAX Data', color: '#22D3EE',
      slogan: 'Dados que viram decisão.',
      platform: 'VNMAX Insight',
      goal: 'Transformar dados em inteligência para decisão.',
      products: ['Insight BI', 'Insight Analytics', 'Insight Dashboards', 'Insight Reports', 'Insight Warehouse', 'Insight Forecast'],
    },
    {
      key: 'Apps', name: 'VNMAX Apps', color: '#9B5CFF',
      slogan: 'Aplicativos modernos para empresas.',
      platform: 'VNMAX Pulse',
      goal: 'Desenvolver aplicativos modernos para empresas.',
      products: ['Pulse Mobile', 'Pulse Wallet', 'Pulse Delivery', 'Pulse Business', 'Pulse Client'],
    },
    {
      key: 'Digital', name: 'VNMAX Digital', color: '#FF5DA2',
      slogan: 'Crescimento via marketing digital.',
      platform: 'VNMAX Growth',
      goal: 'Gerar crescimento via marketing digital.',
      products: ['Growth Ads', 'Growth SEO', 'Growth CRM', 'Growth Social', 'Growth Funnels'],
    },
    {
      key: 'Labs', name: 'VNMAX Labs', color: '#F8FAFC',
      slogan: 'Pesquisa e tecnologias emergentes.',
      platform: 'VNMAX Nova',
      goal: 'Pesquisar tecnologias emergentes e criar inovação.',
      products: ['Nova Quantum', 'Nova Robotics', 'Nova XR', 'Nova IoT', 'Nova Research'],
    },
  ],

  // Roadmap estrategico 2026-2031 (reservado).
  roadmap: [
    { year: '2026', phase: 'Construção', goal: 'Construir a empresa.', items: ['Fundação e identidade visual', 'Lançamento do site e da marca', 'Definição das divisões e portfólio inicial', 'Primeiros clientes e sistemas', 'Lançamento de Tech, AI e Studio'] },
    { year: '2027', phase: 'Validação', goal: 'Validar mercado.', items: ['Primeiro SaaS e VNMAX Nexus', 'Primeiros agentes de IA', 'Receita recorrente · 30 clientes ativos', 'Lançamento da VNMAX Cloud', 'Processos e documentação técnica'] },
    { year: '2028', phase: 'Escala', goal: 'Escalar.', items: ['Equipe técnica estruturada', 'Marketplace e APIs públicas', 'Aplicativo VNMAX', 'VNMAX Data e Security', 'Mais de 100 clientes · infraestrutura própria'] },
    { year: '2029', phase: 'Expansão', goal: 'Expandir.', items: ['VNMAX Apps e produtos próprios', 'Marketplace consolidado', 'Clientes Enterprise', 'Expansão nacional', 'Novos parceiros'] },
    { year: '2030', phase: 'Ecossistema', goal: 'Integrar o ecossistema.', items: ['VNMAX Labs', 'Projetos open source', 'IA própria', 'Plataforma integrada', 'Cloud própria'] },
    { year: '2031', phase: 'Referência nacional', goal: 'Consolidar como referência nacional.', items: ['Ecossistema completo', 'Produtos Enterprise', 'Expansão internacional', 'Soluções proprietárias', 'Empresa consolidada'] },
  ],

  // Estagios de maturidade de produto.
  maturity: [
    { stage: 'Ideia', text: 'Nome, problema, público e hipótese de valor.' },
    { stage: 'Validação', text: 'Landing, protótipo, lead, proposta e primeiro cliente.' },
    { stage: 'MVP', text: 'Fluxo principal funcionando, suporte manual e métricas básicas.' },
    { stage: 'Produto', text: 'Onboarding, billing, suporte, logs, docs e melhoria contínua.' },
    { stage: 'Plataforma', text: 'APIs, permissões, marketplace, integrações e multi-tenancy.' },
  ],

  // Principios de arquitetura e engenharia (resumo interno).
  engineering: {
    title: 'Arquitetura e engenharia',
    pillars: [
      { title: 'Segurança por padrão', text: 'RBAC, controle de acesso e proteção desde a base de cada sistema.' },
      { title: 'Multi-tenancy', text: 'Plataformas preparadas para operar por equipes ou empresas.' },
      { title: 'Observabilidade', text: 'Logs, métricas e rastreamento para operar com confiança.' },
      { title: 'IA aplicada', text: 'Agentes e automações integrados a sistemas internos e ao WhatsApp.' },
      { title: 'Escala', text: 'Filas, cache e infraestrutura pensados para crescer.' },
      { title: 'Qualidade', text: 'ADRs, RFCs, testes e checklists antes de publicar.' },
    ],
  },

  // Regras de confidencialidade visiveis para a equipe interna.
  confidentiality: [
    'Roadmap, arquitetura, stack, fornecedores e planos internos são conhecimento reservado.',
    'Nunca expor estes detalhes em landings, anúncios ou materiais comerciais.',
    'Cada divisão só é comunicada como oferta ativa com capacidade real de entrega.',
    'Antes de publicar, rodar os checklists de qualidade.',
  ],
};
