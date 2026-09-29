// Órbitas keplerianas: o Sol ocupa um dos focos da elipse.

export interface Body {
  id: string;
  name: string;
  a: number; // semieixo maior (UA)
  e: number; // excentricidade
  period: number; // anos (3ª lei: T² = a³)
  color: string;
  size: number; // raio visual
  note: string;
}

// Fonte: NASA Planetary Fact Sheet / JPL Small-Body Database.
export const BODIES: Body[] = [
  { id: 'mercurio', name: 'Mercúrio', a: 0.387, e: 0.2056, period: 0.241, color: '#b5b5b5', size: 0.05, note: 'A órbita mais excêntrica entre os planetas.' },
  { id: 'venus', name: 'Vênus', a: 0.723, e: 0.0068, period: 0.615, color: '#e8c07d', size: 0.08, note: 'Órbita quase circular.' },
  { id: 'terra', name: 'Terra', a: 1.0, e: 0.0167, period: 1.0, color: '#4f9dff', size: 0.085, note: 'Periélio em janeiro, afélio em julho.' },
  { id: 'marte', name: 'Marte', a: 1.524, e: 0.0934, period: 1.881, color: '#ff6a3d', size: 0.065, note: 'Kepler descobriu as órbitas elípticas estudando Marte.' },
  { id: 'halley', name: 'Cometa Halley', a: 17.83, e: 0.967, period: 75.3, color: '#9be7ff', size: 0.07, note: 'Elipse muito achatada: volta a cada ~76 anos (próxima: 2061).' },
];

/** Resolve a equação de Kepler M = E − e sen E (Newton). */
export function solveKepler(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 30; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/**
 * Posição no plano da órbita com o Sol na origem (foco direito da elipse
 * centrada em (−c, 0)). frac = fração do período decorrida (0..1).
 */
export function orbitPosition(a: number, e: number, frac: number) {
  const M = 2 * Math.PI * (frac - Math.floor(frac));
  const E = solveKepler(M, e);
  const b = a * Math.sqrt(1 - e * e);
  const x = a * (Math.cos(E) - e);
  const y = b * Math.sin(E);
  const r = a * (1 - e * Math.cos(E));
  return { x, y, r, E };
}

export const perihelion = (a: number, e: number) => a * (1 - e);
export const aphelion = (a: number, e: number) => a * (1 + e);

/** Velocidade orbital relativa pela equação vis-viva (em unidades de v da Terra). */
export const visViva = (a: number, r: number) => Math.sqrt(2 / r - 1 / a);
