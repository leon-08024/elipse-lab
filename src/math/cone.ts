// Seção cônica: cone duplo (vértice na origem, eixo = y) cortado por um plano.
//
// Cone: semiângulo α. Geratriz na direção d(θ) = (sen α cos θ, cos α, sen α sen θ).
// Plano: passa por P0 = (0, h, 0) com normal n = (−sen β, cos β, 0), onde β é a
// inclinação do plano em relação à horizontal.
//   β = 0            → circunferência
//   0 < β < 90° − α  → elipse
//   β = 90° − α      → parábola (plano paralelo à geratriz)
//   β > 90° − α      → hipérbole
// Excentricidade: e = sen β / cos α.

export type Vec3 = [number, number, number];

export type ConicKind = 'circunferência' | 'elipse' | 'parábola' | 'hipérbole';

const DEG = Math.PI / 180;

export function conicKind(alphaDeg: number, betaDeg: number, tol = 0.35): ConicKind {
  const limit = 90 - alphaDeg;
  if (betaDeg < tol) return 'circunferência';
  if (Math.abs(betaDeg - limit) <= tol) return 'parábola';
  return betaDeg < limit ? 'elipse' : 'hipérbole';
}

export function sectionEccentricity(alphaDeg: number, betaDeg: number): number {
  return Math.sin(betaDeg * DEG) / Math.cos(alphaDeg * DEG);
}

export function planeNormal(betaDeg: number): Vec3 {
  const b = betaDeg * DEG;
  return [-Math.sin(b), Math.cos(b), 0];
}

const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

/**
 * Curva de interseção. Retorna uma lista de trechos (cada trecho é contínuo),
 * limitada a |y| <= maxY (altura de cada folha do cone).
 */
export function sectionCurve(
  alphaDeg: number,
  betaDeg: number,
  h: number,
  maxY: number,
  samples = 720,
): Vec3[][] {
  const al = alphaDeg * DEG;
  const n = planeNormal(betaDeg);
  const rhs = h * n[1]; // n · P0
  const segments: Vec3[][] = [];
  let current: Vec3[] = [];

  for (let i = 0; i <= samples; i++) {
    const th = (i / samples) * Math.PI * 2;
    const d: Vec3 = [Math.sin(al) * Math.cos(th), Math.cos(al), Math.sin(al) * Math.sin(th)];
    const den = dot(n, d);
    let ok = Math.abs(den) > 1e-6;
    let p: Vec3 = [0, 0, 0];
    if (ok) {
      const t = rhs / den;
      p = [t * d[0], t * d[1], t * d[2]];
      ok = Math.abs(p[1]) <= maxY;
    }
    if (ok) {
      current.push(p);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);

  // Une o último trecho ao primeiro quando a curva passa pelo θ = 0 (evita "buraco").
  if (segments.length > 1) {
    const first = segments[0];
    const last = segments[segments.length - 1];
    const gap = Math.hypot(
      first[0][0] - last[last.length - 1][0],
      first[0][1] - last[last.length - 1][1],
      first[0][2] - last[last.length - 1][2],
    );
    if (gap < 0.5) {
      segments[0] = [...last, ...first];
      segments.pop();
    }
  }
  return segments.filter((s) => s.length > 1);
}

export interface DandelinSphere {
  center: Vec3;
  radius: number;
  focus: Vec3; // ponto de tangência com o plano = foco
}

/**
 * Esferas de Dandelin (só no caso da elipse, h > 0): tangentes ao cone e ao plano.
 * Centro (0, k, 0), raio r = k sen α, e |cos β (k − h)| = r.
 */
export function dandelinSpheres(alphaDeg: number, betaDeg: number, h: number): DandelinSphere[] {
  const al = alphaDeg * DEG;
  const be = betaDeg * DEG;
  const sa = Math.sin(al);
  const cb = Math.cos(be);
  const n = planeNormal(betaDeg);
  const ks: number[] = [h * cb / (cb + sa)];
  if (cb - sa > 1e-6) ks.push((h * cb) / (cb - sa));

  return ks.map((k) => {
    const center: Vec3 = [0, k, 0];
    const radius = k * sa;
    const sd = n[1] * (k - h); // distância com sinal centro→plano
    const focus: Vec3 = [center[0] - sd * n[0], center[1] - sd * n[1], center[2] - sd * n[2]];
    return { center, radius, focus };
  });
}
