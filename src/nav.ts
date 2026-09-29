export type SectionId = 'inicio' | 'cone' | 'jardineiro' | 'laboratorio' | 'refletora' | 'orbitas' | 'geogebra' | 'desafio';

export const SECTIONS: { id: SectionId; label: string; icon: string; etapa: string }[] = [
  { id: 'inicio', label: 'Início', icon: '◎', etapa: 'Etapa 1' },
  { id: 'cone', label: 'Cone de Apolônio', icon: '△', etapa: 'Etapa 1 · Bônus' },
  { id: 'jardineiro', label: 'Jardineiro', icon: '✎', etapa: 'Etapa 2 ↔ 3' },
  { id: 'laboratorio', label: 'Laboratório', icon: '⚗', etapa: 'Etapa 3' },
  { id: 'refletora', label: 'Prop. Refletora', icon: '✦', etapa: 'Etapa 3' },
  { id: 'orbitas', label: 'Órbitas', icon: '☉', etapa: 'Mundo real' },
  { id: 'geogebra', label: 'GeoGebra', icon: '⌗', etapa: 'Etapa 3' },
  { id: 'desafio', label: 'Desafio', icon: '🏆', etapa: 'Etapa 4' },
];
