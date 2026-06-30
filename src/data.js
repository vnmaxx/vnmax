// Conteudo PUBLICO do site (landing comercial), visivel para qualquer visitante.
// O conteudo RESERVADO (plataformas, produtos, roadmap, modelo de negocio,
// arquitetura, IA) vive no Firestore e so e exibido apos login.
//
// Regra de confidencialidade (vnmax-os): a landing vende valor e mostra o
// ecossistema como areas de atuacao, sem expor nomes internos de plataformas/
// produtos, roadmap por ano, metricas ou stack.

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

// As 10 divisoes para o SHOWCASE publico (sem plataformas/produtos internos).
export const divisions = [
  { key: 'ai', name: 'VNMAX AI', color: '#F5D342', onColor: '#1A1A1A', icon: 'brain', area: 'Inteligência Artificial e Automação', slogan: 'Inteligência que trabalha por você.' },
  { key: 'tech', name: 'VNMAX Tech', color: '#2F7BFF', onColor: '#FFFFFF', icon: 'code', area: 'Desenvolvimento de Software', slogan: 'Transformando ideias em software.' },
  { key: 'studio', name: 'VNMAX Studio', color: '#FF8A3D', onColor: '#1A1A1A', icon: 'pencil', area: 'Design, Branding e Criação de Sites', slogan: 'Experiências digitais que marcam.' },
  { key: 'cloud', name: 'VNMAX Cloud', color: '#36D399', onColor: '#06291C', icon: 'cloud', area: 'Hospedagem, Servidores e Infraestrutura', slogan: 'Infraestrutura que nunca para.' },
  { key: 'security', name: 'VNMAX Security', color: '#FF4D4F', onColor: '#FFFFFF', icon: 'shield', area: 'Cibersegurança e Proteção de Dados', slogan: 'Segurança em cada camada.' },
  { key: 'data', name: 'VNMAX Data', color: '#22D3EE', onColor: '#04222A', icon: 'chart', area: 'BI, Análise de Dados e Dashboards', slogan: 'Dados que geram decisões.' },
  { key: 'apps', name: 'VNMAX Apps', color: '#9B5CFF', onColor: '#FFFFFF', icon: 'phone', area: 'Desenvolvimento de Aplicativos', slogan: 'Aplicativos que conectam.' },
  { key: 'digital', name: 'VNMAX Digital', color: '#FF5DA2', onColor: '#1A0A12', icon: 'megaphone', area: 'Marketing Digital e Gestão de Redes Sociais', slogan: 'Crescimento através do digital.' },
  { key: 'academy', name: 'VNMAX Academy', color: '#F5B73C', onColor: '#1A1A1A', icon: 'cap', area: 'Cursos, Treinamentos e Certificações', slogan: 'Conhecimento que transforma carreiras.' },
  { key: 'labs', name: 'VNMAX Labs', color: '#F8FAFC', onColor: '#0A0A0A', icon: 'flask', area: 'Pesquisa, Desenvolvimento e Inovação', slogan: 'Inovação que define o futuro.' },
];

export const publicContent = {
  hero: {
    eyebrow: 'Ecossistema de Tecnologia, Inteligência Artificial e Inovação',
    title: 'Construindo o futuro através da tecnologia',
    subtitle:
      'Desenvolvemos soluções digitais inteligentes, escaláveis e confiáveis para empresas que querem operar melhor, vender mais e decidir com dados — software, IA e infraestrutura sob um único guarda-chuva de qualidade.',
    cta1: 'Fale com a VNMAX',
    cta2: 'Conheça o ecossistema',
  },

  about: {
    title: 'Quem somos',
    text:
      'A VNMAX é uma empresa de tecnologia que une engenharia, estratégia e design para transformar tecnologia em vantagem real. Não entregamos apenas software: construímos um ecossistema integrado capaz de cobrir cada necessidade digital de uma organização — do desenvolvimento de sistemas à inteligência artificial, da nuvem à segurança. Cada solução nasce do mesmo compromisso: rigor técnico, visão de longo prazo e foco absoluto em valor real para o cliente.',
  },

  mission:
    'Desenvolver soluções tecnológicas inteligentes que impulsionam empresas através de software, inteligência artificial e inovação — entregando valor real, escalável e duradouro em cada etapa da jornada digital.',
  vision:
    'Ser uma referência em soluções tecnológicas, reconhecida pela excelência, pela inovação contínua e pela capacidade de construir um ecossistema digital integrado que transforma organizações de todos os portes e segmentos.',

  values: [
    { title: 'Inovação', text: 'Criamos soluções que antecipam o futuro, não apenas respondem ao presente.' },
    { title: 'Qualidade', text: 'Excelência técnica em cada linha de código, cada produto e cada entrega.' },
    { title: 'Transparência', text: 'Relações claras e honestas com clientes, parceiros e equipes.' },
    { title: 'Segurança', text: 'Proteção e confiabilidade como pilares inegociáveis de toda solução.' },
    { title: 'Escalabilidade', text: 'Soluções projetadas para crescer junto com os negócios dos nossos clientes.' },
    { title: 'Foco no cliente', text: 'O sucesso do cliente é a medida definitiva do nosso próprio sucesso.' },
  ],

  ecosystemIntro: {
    title: 'Um ecossistema, todas as frentes digitais',
    text:
      'A VNMAX é estruturada como um ecossistema integrado de áreas especializadas. Cada frente tem profundidade técnica no seu domínio, mas todas compartilham a mesma infraestrutura, inteligência e visão. Na prática, sua empresa resolve qualquer desafio digital com um único parceiro de confiança — com a especialização de quem é dedicado e a coesão de quem trabalha junto.',
  },

  services: [
    { icon: 'brain', title: 'Inteligência Artificial', text: 'Agentes e automações de IA aplicados a problemas reais: atendimento inteligente, processamento de documentos, análise de linguagem e visão computacional para reduzir trabalho manual e acelerar a operação.' },
    { icon: 'code', title: 'Software sob medida', text: 'Sistemas corporativos, APIs robustas e plataformas escaláveis construídos para o seu negócio — preparados para crescer com segurança, controle de acesso e operação organizada.' },
    { icon: 'palette', title: 'Sites e experiências digitais', text: 'Identidade visual, interfaces e experiências modernas que comunicam confiança e convertem. Design de alto impacto unindo estética e usabilidade.' },
    { icon: 'phone', title: 'Aplicativos', text: 'Apps mobile para iOS e Android, integrados aos seus sistemas e ao ecossistema digital da sua empresa, com experiência excepcional para o usuário final.' },
    { icon: 'chart', title: 'Dados e dashboards', text: 'Transformamos informação bruta em decisão. Painéis, análises e indicadores que dão visibilidade real sobre o seu negócio e orientam escolhas mais assertivas.' },
    { icon: 'cloud', title: 'Cloud e infraestrutura', text: 'Infraestrutura em nuvem confiável e escalável para hospedar toda a sua operação digital, com performance, disponibilidade e tranquilidade para crescer.' },
    { icon: 'shield', title: 'Segurança digital', text: 'Proteção corporativa em múltiplas camadas: prevenção, monitoramento e resposta para manter seus dados e sistemas seguros e em conformidade.' },
    { icon: 'trending-up', title: 'Marketing digital', text: 'Crescimento mensurável orientado a dados: aquisição, conversão e relacionamento integrados aos seus sistemas para gerar resultado real, não apenas tráfego.' },
  ],

  why: [
    { title: 'Um único parceiro, ponta a ponta', text: 'Da estratégia ao código, do design à infraestrutura: você concentra toda a sua jornada digital em um ecossistema coeso, sem fornecedores desencontrados.' },
    { title: 'Engenharia, estratégia e design juntos', text: 'Não tratamos tecnologia como fim. Cada projeto une visão de negócio, excelência técnica e design para entregar valor que se sustenta no tempo.' },
    { title: 'Construído para escalar', text: 'Nossas soluções nascem preparadas para crescer com você — em volume, em complexidade e em segurança — sem que seja preciso recomeçar do zero.' },
    { title: 'IA aplicada a problemas reais', text: 'Usamos inteligência artificial onde ela gera impacto concreto: menos trabalho manual, mais velocidade e melhores decisões — sem promessas mágicas.' },
  ],

  stats: [
    { value: '10', label: 'Áreas especializadas em um só ecossistema' },
    { value: '100%', label: 'Soluções sob medida para cada negócio' },
    { value: '360°', label: 'Cobertura digital, do software à segurança' },
    { value: '24/7', label: 'Infraestrutura pensada para alta disponibilidade' },
  ],

  faq: [
    { q: 'O que a VNMAX faz, exatamente?', a: 'Desenvolvemos soluções digitais para empresas: software sob medida, inteligência artificial e automação, sites e aplicativos, dados e dashboards, infraestrutura em nuvem, segurança e marketing digital — tudo integrado em um único ecossistema.' },
    { q: 'Atendem empresas de qual porte?', a: 'Atendemos organizações de todos os portes e segmentos. Adaptamos a solução à realidade de cada cliente, sempre projetando para que ela acompanhe o crescimento do negócio.' },
    { q: 'Preciso contratar várias frentes ao mesmo tempo?', a: 'Não. Você pode começar pela frente mais urgente — um sistema, uma automação, um site — e expandir conforme a necessidade, dentro do mesmo ecossistema e com a mesma qualidade.' },
    { q: 'As soluções são sob medida ou prontas?', a: 'Construímos soluções sob medida para o seu negócio, aproveitando a maturidade técnica do nosso ecossistema para entregar com mais velocidade, consistência e confiabilidade.' },
    { q: 'Como funciona a inteligência artificial na prática?', a: 'Aplicamos IA onde ela resolve um problema concreto: automatizar atendimentos, processar documentos, analisar dados e apoiar decisões. O foco é sempre resultado real, não tecnologia pela tecnologia.' },
    { q: 'Como começar um projeto com a VNMAX?', a: 'É simples: entre em contato, conte o seu desafio e desenhamos juntos o melhor caminho. A primeira conversa serve para entender o seu contexto e propor a solução mais adequada.' },
  ],

  cta: {
    title: 'Vamos construir o futuro da sua empresa',
    text: 'Conte para a VNMAX o desafio que você quer resolver. Desenhamos juntos a solução digital certa — com estratégia, engenharia e design — para a sua empresa operar melhor e crescer com tecnologia.',
    button: 'Fale com a VNMAX',
  },
};
