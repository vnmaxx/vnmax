/**
 * Conteúdo e layout 3D da galeria horizontal.
 * Edite textos, posições, rotações e cores aqui — a câmera
 * (src/scene/CameraRig.tsx) é orquestrada para passar por estes cards.
 */

export interface GalleryCard {
  id: string;
  index: string;
  title: string;
  tag: string;
  /** corpo de texto multilinha (opcional) */
  body?: string;
  /** posição no mundo [x, y, z] */
  position: [number, number, number];
  /** rotação em radianos [x, y, z] */
  rotation: [number, number, number];
  size: [number, number];
  accent: string;
  /** card de destaque: tipografia centralizada e maior */
  hero?: boolean;
}

export const ACCENTS = {
  cyan: '#41e8ff',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  acid: '#a3ff6b',
  magenta: '#ff4ecd',
  white: '#cfe2ff',
} as const;

/**
 * Disposição editorial em profundidade: cards alternam esquerda/centro/
 * direita ao longo do corredor (-Z) para criar a sensação horizontal.
 */
export const galleryCards: GalleryCard[] = [
  {
    id: 'program-hero',
    index: '01',
    title: 'VNMAX',
    tag: 'Tecnologia, Inteligência Artificial e Inovação',
    body:
      'Um ecossistema que une engenharia, estratégia e design para transformar tecnologia em vantagem real — software, IA, dados, cloud e segurança sob um único guarda-chuva de qualidade.',
    position: [-5, 0.6, -13],
    rotation: [0, 0.5, 0.02],
    size: [5.8, 3.1],
    accent: ACCENTS.cyan,
    hero: true,
  },
  {
    id: 'atrair',
    index: '02',
    title: 'ECOSSISTEMA',
    tag: 'Todas as frentes digitais, um só parceiro.',
    body:
      '• Software sob medida\n• Sites e aplicativos\n• Dados e dashboards\n• Cloud e infraestrutura\n• Segurança digital',
    position: [0.6, -0.1, -19.5],
    rotation: [0, 0.05, 0],
    size: [4.8, 3.0],
    accent: ACCENTS.violet,
  },
  {
    id: 'operar',
    index: '03',
    title: 'INTELIGÊNCIA',
    tag: 'IA aplicada a problemas reais.',
    body:
      '• Agentes e automações de IA\n• Atendimento inteligente\n• Processamento de documentos\n• Análise e decisão com dados\n• Menos trabalho manual, mais velocidade',
    position: [5.4, -0.4, -25.5],
    rotation: [0, -0.55, -0.03],
    size: [4.6, 2.7],
    accent: ACCENTS.acid,
  },
  {
    id: 'evoluir',
    index: '04',
    title: 'ESCALA',
    tag: 'Construído para crescer com você.',
    body:
      '• Arquitetura escalável\n• Alta disponibilidade 24/7\n• Segurança em camadas\n• Evolução contínua\n• Um único parceiro, ponta a ponta',
    position: [7.8, 0.8, -33],
    rotation: [0, -0.85, 0.04],
    size: [4.2, 2.5],
    accent: ACCENTS.blue,
  },
];

/**
 * Layout MOBILE (retrato): a tela é alta e estreita, então os cards viram
 * "totens" verticais centralizados no eixo X e enfileirados em profundidade
 * (-Z), de frente para a câmera (sem yaw forte) — assim cabem inteiros na
 * visão e o texto não fica foreshortened. A câmera (CameraRig, ramo mobile)
 * desce reto pelo corredor passando por cada um. Mesmo conteúdo dos cards
 * desktop; só geometria e enquadramento mudam.
 */
// Cards alternam lados (x = ±2.2) e giram para encarar a câmera, que desce
// reta pelo centro (x≈0). Assim a câmera NÃO atravessa nenhum card — passa
// ao lado de cada um — e o lookAt (CameraRig) mantém o card centralizado.
const MOBILE_GEOMETRY: Record<
  string,
  { position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }
> = {
  'program-hero': { position: [-2.2, 0.2, -13], rotation: [0, 0.35, 0.01], size: [3.0, 4.7] },
  atrair: { position: [2.2, 0, -21], rotation: [0, -0.35, 0], size: [3.0, 4.5] },
  operar: { position: [-2.2, 0, -29], rotation: [0, 0.35, 0], size: [3.0, 4.5] },
  evoluir: { position: [2.2, 0.1, -37], rotation: [0, -0.35, 0], size: [3.0, 4.5] },
};

export const galleryCardsMobile: GalleryCard[] = galleryCards.map((card) => ({
  ...card,
  ...MOBILE_GEOMETRY[card.id],
}));

/** Índice editorial do lado esquerdo (SideIndex), atrelado ao progresso. */
export const sideIndex = [
  { id: '01', label: 'INTRO', at: 0.0 },
  { id: '02', label: 'SYSTEM', at: 0.2 },
  { id: '03', label: 'HORIZONS', at: 0.42 },
  { id: '04', label: 'MISSION', at: 0.7 },
  { id: '05', label: 'NEXT', at: 0.88 },
] as const;
