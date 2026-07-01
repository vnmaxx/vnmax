/**
 * Conteúdo central do site.
 * Edite textos, serviços e CTAs aqui — toda a experiência lê deste arquivo.
 * Futuramente este objeto pode ser hidratado a partir do Firestore
 * (ver src/types/admin.ts → EditableContent).
 */

export const siteContent = {
  company: 'VNMAX',

  hero: {
    title:
      'Construindo o futuro através da tecnologia — soluções digitais inteligentes que transformam o seu negócio.',
    subtitle:
      'Desenvolvemos software sob medida, inteligência artificial e infraestrutura escalável para empresas que querem operar melhor, vender mais e decidir com dados.',
    sideNote: 'ECOSSISTEMA DE TECNOLOGIA E INOVAÇÃO',
    exploreLabel: 'Fale com a VNMAX',
  },

  nav: [
    { label: 'INÍCIO', href: '#top' },
    { label: 'PROGRAMA', href: '#program' },
    { label: 'CONTATO', href: '#contact' },
  ],

  services: [
    { id: '01', title: 'Inteligência Artificial', tag: 'AGENTES & AUTOMAÇÃO' },
    { id: '02', title: 'Software sob medida', tag: 'SISTEMAS CORPORATIVOS' },
    { id: '03', title: 'Sites e experiências', tag: 'DESIGN & CONVERSÃO' },
    { id: '04', title: 'Aplicativos mobile', tag: 'iOS / ANDROID' },
    { id: '05', title: 'Dados e dashboards', tag: 'BI & ANÁLISE' },
  ],

  horizon: {
    title: 'UM ECOSSISTEMA, TODAS AS FRENTES DIGITAIS',
    caption: 'INTELIGÊNCIA, ENGENHARIA E DESIGN INTEGRADOS',
  },

  mission: {
    title: 'DESENVOLVEMOS SOLUÇÕES QUE IMPULSIONAM EMPRESAS',
    caption: 'VALOR REAL, ESCALÁVEL E DURADOURO',
  },

  final: {
    title: 'VAMOS CONSTRUIR O FUTURO DA SUA EMPRESA',
    ctaLabel: 'Fale com a VNMAX',
    contactEmail: 'vnmax6@gmail.com',
  },
} as const;

export type SiteContent = typeof siteContent;
