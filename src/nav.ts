export type SectionId = 'inicio' | 'cone' | 'jardineiro' | 'laboratorio' | 'refletora' | 'orbitas' | 'geogebra' | 'desafio';

/** label = trilho lateral; title = barra de título da janela */
export const SECTIONS: { id: SectionId; label: string; title: string }[] = [
  { id: 'inicio', label: 'Início', title: 'Elipse' },
  { id: 'cone', label: 'Cone', title: 'Cone de Apolônio' },
  { id: 'jardineiro', label: 'Barbante', title: 'Método do Jardineiro' },
  { id: 'laboratorio', label: 'Parâmetros', title: 'Parâmetros' },
  { id: 'refletora', label: 'Reflexão', title: 'Propriedade Refletora' },
  { id: 'orbitas', label: 'Órbitas', title: 'Órbitas de Kepler' },
  { id: 'geogebra', label: 'GeoGebra', title: 'GeoGebra' },
  { id: 'desafio', label: 'Desafio', title: 'Desafio da Turma' },
];

export const REPO_URL = 'https://github.com/leon-08024/elipse-lab';
