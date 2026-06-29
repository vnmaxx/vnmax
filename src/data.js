// Conteudo PUBLICO do site (landing comercial), visivel para qualquer visitante.
// O conteudo RESERVADO nao vive no client: e a fonte do seed em ./data-internal.mjs,
// importado apenas pelo script Node de seed e publicado no Firestore.
//
// Regra de confidencialidade (vnmax-os): roadmap, arquitetura, stack,
// plataformas e divisoes detalhadas NAO aparecem na landing publica.

export const brand = {
  name: 'VNMAX',
  domain: 'vnmax.org',
  slogan: 'Construindo o futuro através da tecnologia',
  email: 'vnmax6@gmail.com',
  founded: 2026,
  social: [
    { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/vnmax6/' },
    { name: 'TikTok', icon: 'tiktok', url: 'https://www.tiktok.com/@vnmax1' },
    { name: 'LinkedIn', icon: 'linkedin', url: 'https://www.linkedin.com/in/vnmax-org-0026ba41a/' },
    { name: 'Bluesky', icon: 'bluesky', url: 'https://bsky.app/profile/vnmax.bsky.social' },
    { name: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/channel/UC1x_G7Bypie0xGYQgxezLHg' },
  ],
};

/* ------------------------------------------------------------------ */
/* PUBLICO — landing comercial                                         */
/* ------------------------------------------------------------------ */

export const publicContent = {
  hero: {
    eyebrow: 'Ecossistema de tecnologia',
    title: 'Software, IA e infraestrutura para empresas que querem crescer.',
    subtitle:
      'A VNMAX cria soluções digitais com estratégia, engenharia e design — para empresas operarem melhor, venderem mais e decidirem com dados.',
    primaryCta: 'Falar com a VNMAX',
    secondaryCta: 'Conhecer os serviços',
  },

  problem: {
    title: 'Tecnologia deveria acelerar a sua operação — não travá-la.',
    text:
      'Processos manuais, sistemas que não conversam entre si e decisões tomadas no escuro custam tempo e dinheiro. A maioria das empresas tem dados, mas não tem clareza; tem ferramentas, mas não tem integração.',
    pains: [
      'Trabalho repetitivo que consome a equipe.',
      'Sistemas isolados e informação espalhada.',
      'Falta de visão clara para decidir rápido.',
      'Atendimento que não escala com o crescimento.',
    ],
  },

  solution: {
    title: 'Uma parceira de tecnologia, do problema ao resultado.',
    text:
      'Entendemos o seu negócio, desenhamos a solução certa e construímos com qualidade de produto: software sob medida, IA aplicada, automações e infraestrutura preparada para escalar com segurança.',
    steps: [
      { n: '01', title: 'Diagnóstico', text: 'Mapeamos a operação, os gargalos e onde a tecnologia gera mais valor.' },
      { n: '02', title: 'Solução sob medida', text: 'Desenhamos arquitetura, experiência e escopo com foco em resultado real.' },
      { n: '03', title: 'Construção', text: 'Entregamos com engenharia sólida, design moderno e qualidade de produto.' },
      { n: '04', title: 'Evolução', text: 'Acompanhamos métricas, damos suporte e evoluímos continuamente.' },
    ],
  },

  benefits: {
    title: 'O que a sua empresa ganha',
    items: [
      { icon: 'bolt', title: 'Menos trabalho manual', text: 'Automações que liberam a equipe para o que importa.' },
      { icon: 'gauge', title: 'Mais velocidade', text: 'Processos e sistemas que aceleram a operação.' },
      { icon: 'spark', title: 'IA aplicada', text: 'Inteligência artificial resolvendo problemas reais, não hype.' },
      { icon: 'shield', title: 'Segurança por padrão', text: 'Controle de acesso e proteção desde a base.' },
      { icon: 'chart', title: 'Decisão com dados', text: 'Dashboards e relatórios que transformam dados em clareza.' },
      { icon: 'layers', title: 'Pronto para escalar', text: 'Infraestrutura pensada para crescer com a sua demanda.' },
    ],
  },

  services: {
    title: 'O que fazemos',
    subtitle: 'Tecnologia ponta a ponta, com hierarquia e foco.',
    items: [
      { icon: 'code', title: 'Software sob medida', text: 'Sistemas, ERPs, CRMs e plataformas corporativas feitos para o seu processo.' },
      { icon: 'spark', title: 'IA e automação', text: 'Chatbots, agentes e fluxos inteligentes integrados aos seus sistemas.' },
      { icon: 'window', title: 'Sites e experiências digitais', text: 'Páginas e produtos web com design premium e performance.' },
      { icon: 'phone', title: 'Aplicativos', text: 'Apps móveis modernos para clientes e operação.' },
      { icon: 'chart', title: 'Dados e dashboards', text: 'BI, análises e relatórios para decidir com confiança.' },
      { icon: 'cloud', title: 'Cloud e infraestrutura', text: 'Hospedagem, operação e infraestrutura preparada para escala.' },
      { icon: 'shield', title: 'Segurança digital', text: 'Proteção, controle de acesso e boas práticas por padrão.' },
      { icon: 'rocket', title: 'Marketing digital', text: 'Crescimento, SEO e funis para gerar e converter demanda.' },
    ],
  },

  differentials: {
    title: 'Por que a VNMAX',
    items: [
      { title: 'Estratégia antes de código', text: 'Resolvemos o problema certo — tecnologia é meio, não fim.' },
      { title: 'Qualidade de produto', text: 'Engenharia sólida, design moderno e atenção a cada detalhe.' },
      { title: 'Ecossistema integrado', text: 'Software, IA, dados, cloud e segurança falando a mesma língua.' },
      { title: 'Transparência', text: 'Comunicação clara, sem jargão e sem promessa impossível.' },
    ],
  },

  credentials: {
    title: 'Construído para padrão de big tech',
    text: 'Trabalhamos com os princípios de engenharia, design e segurança que orientam as melhores empresas de tecnologia do mundo.',
    stats: [
      { value: '9', label: 'frentes de tecnologia' },
      { value: '100%', label: 'projetos sob medida' },
      { value: '24/7', label: 'mentalidade de operação' },
      { value: 'AA', label: 'acessibilidade mínima' },
    ],
  },

  faq: {
    title: 'Perguntas frequentes',
    items: [
      {
        q: 'A VNMAX atende empresas de que porte?',
        a: 'De pequenas operações que querem profissionalizar a tecnologia a empresas que precisam escalar com segurança. O escopo é sempre sob medida.',
      },
      {
        q: 'Vocês fazem projeto pontual ou parceria contínua?',
        a: 'Os dois. Entregamos projetos com começo, meio e fim, e também atuamos como parceira de tecnologia de longo prazo, evoluindo a solução.',
      },
      {
        q: 'Como funciona a IA aplicada?',
        a: 'Identificamos onde a inteligência artificial gera valor real — atendimento, automação de processos, análise de dados — e integramos aos seus sistemas com controle e histórico.',
      },
      {
        q: 'E a segurança dos dados?',
        a: 'Segurança é padrão, não opcional. Trabalhamos com controle de acesso, boas práticas e proteção desde a base de cada projeto.',
      },
      {
        q: 'Como começamos?',
        a: 'Pelo diagnóstico. Conversamos sobre o seu desafio, entendemos a operação e propomos o caminho certo antes de qualquer linha de código.',
      },
    ],
  },

  cta: {
    title: 'Vamos construir o próximo passo da sua empresa?',
    text: 'Conte o seu desafio. Respondemos com clareza sobre como a tecnologia pode resolvê-lo.',
    button: 'Falar com a VNMAX',
  },

  footer: {
    tagline: 'Construindo o futuro através da tecnologia.',
    columns: [
      {
        title: 'Soluções',
        links: ['Software sob medida', 'IA e automação', 'Dados e dashboards', 'Cloud e infraestrutura'],
      },
      {
        title: 'Empresa',
        links: ['Sobre a VNMAX', 'Contato', 'Trabalhe conosco'],
      },
    ],
  },
};
