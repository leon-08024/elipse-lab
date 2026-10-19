export type SectionId = 'cone' | 'laboratorio' | 'orbitas' | 'geogebra';

/** label = trilho lateral; title = rodapé da janela */
export const SECTIONS: { id: SectionId; label: string; title: string }[] = [
  { id: 'cone', label: 'Cone', title: 'Cone de Apolônio' },
  { id: 'laboratorio', label: 'Parâmetros', title: 'Parâmetros' },
  { id: 'orbitas', label: 'Órbitas', title: 'Órbitas de Kepler' },
  { id: 'geogebra', label: 'GeoGebra', title: 'GeoGebra' },
];
