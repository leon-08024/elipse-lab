// Matemática da elipse — tudo o que a interface exibe sai daqui.

export type Vec2 = { x: number; y: number };

export interface EllipseInfo {
  a: number; // parâmetro horizontal da equação (x-h)²/a² + (y-k)²/b² = 1
  b: number; // parâmetro vertical
  h: number; // centro x
  k: number; // centro y
  semiMajor: number; // maior entre a e b
  semiMinor: number; // menor entre a e b
  c: number; // semidistância focal: c² = semiMajor² − semiMinor²
  e: number; // excentricidade c / semiMajor
  horizontal: boolean; // eixo maior paralelo ao eixo x?
  isCircle: boolean;
  center: Vec2;
  foci: [Vec2, Vec2];
  majorVertices: [Vec2, Vec2]; // A1, A2
  minorVertices: [Vec2, Vec2]; // B1, B2
  /** Diretrizes (retas x = valor se horizontal, y = valor se vertical). null na circunferência. */
  directrices: [number, number] | null;
  latusRectum: number; // corda focal mínima 2b²/a
  area: number;
  perimeter: number; // aproximação de Ramanujan
}

export function ellipseInfo(a: number, b: number, h = 0, k = 0): EllipseInfo {
  const horizontal = a >= b;
  const semiMajor = Math.max(a, b);
  const semiMinor = Math.min(a, b);
  const c = Math.sqrt(Math.max(0, semiMajor * semiMajor - semiMinor * semiMinor));
  const e = c / semiMajor;
  const isCircle = c < 1e-9;
  const center = { x: h, y: k };

  const along = (d: number): Vec2 => (horizontal ? { x: h + d, y: k } : { x: h, y: k + d });
  const across = (d: number): Vec2 => (horizontal ? { x: h, y: k + d } : { x: h + d, y: k });

  const directrices: [number, number] | null = isCircle
    ? null
    : horizontal
      ? [h - semiMajor / e, h + semiMajor / e]
      : [k - semiMajor / e, k + semiMajor / e];

  return {
    a,
    b,
    h,
    k,
    semiMajor,
    semiMinor,
    c,
    e,
    horizontal,
    isCircle,
    center,
    foci: [along(-c), along(c)],
    majorVertices: [along(-semiMajor), along(semiMajor)],
    minorVertices: [across(-semiMinor), across(semiMinor)],
    directrices,
    latusRectum: (2 * semiMinor * semiMinor) / semiMajor,
    area: Math.PI * a * b,
    perimeter: ramanujanPerimeter(a, b),
  };
}

export function ramanujanPerimeter(a: number, b: number): number {
  const hh = ((a - b) * (a - b)) / ((a + b) * (a + b));
  return Math.PI * (a + b) * (1 + (3 * hh) / (10 + Math.sqrt(4 - 3 * hh)));
}

/** Ponto paramétrico P(t) = (h + a cos t, k + b sin t). */
export function pointAt(info: Pick<EllipseInfo, 'a' | 'b' | 'h' | 'k'>, t: number): Vec2 {
  return { x: info.h + info.a * Math.cos(t), y: info.k + info.b * Math.sin(t) };
}

export function dist(p: Vec2, q: Vec2): number {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

/** Parâmetro t do ponto da elipse "mais próximo" (na direção) de um ponto qualquer. */
export function paramFromPoint(info: Pick<EllipseInfo, 'a' | 'b' | 'h' | 'k'>, p: Vec2): number {
  return Math.atan2((p.y - info.k) / info.b, (p.x - info.h) / info.a);
}

/** Coeficientes da forma geral Ax² + Cy² + Dx + Ey + F = 0 (multiplicando por a²b²). */
export function generalForm(a: number, b: number, h: number, k: number) {
  const A = b * b;
  const C = a * a;
  const D = -2 * h * b * b;
  const E = -2 * k * a * a;
  const F = b * b * h * h + a * a * k * k - a * a * b * b;
  return { A, C, D, E, F };
}

// ---------- formatação para LaTeX ----------

export function fmt(n: number, digits = 2): string {
  if (Math.abs(n) < 1e-9) return '0';
  const r = Number(n.toFixed(digits));
  return String(r).replace('.', ',');
}

/** "(x - 2)" / "(x + 1)" / "x" */
function shifted(variable: string, center: number): string {
  if (Math.abs(center) < 1e-9) return `${variable}^2`;
  const sign = center > 0 ? '-' : '+';
  return `(${variable} ${sign} ${fmt(Math.abs(center))})^2`;
}

export function reducedEquationTex(a: number, b: number, h: number, k: number): string {
  return `\\frac{${shifted('x', h)}}{${fmt(a * a)}} + \\frac{${shifted('y', k)}}{${fmt(b * b)}} = 1`;
}

export function generalEquationTex(a: number, b: number, h: number, k: number): string {
  const { A, C, D, E, F } = generalForm(a, b, h, k);
  const term = (coef: number, v: string, first = false) => {
    if (Math.abs(coef) < 1e-9) return '';
    const sign = coef < 0 ? '-' : first ? '' : '+';
    return ` ${sign} ${fmt(Math.abs(coef))}${v}`;
  };
  const s = term(A, 'x^2', true) + term(C, 'y^2') + term(D, 'x') + term(E, 'y') + term(F, '');
  return `${s.trim()} = 0`;
}

// ---------- geometria de raios (propriedade refletora) ----------

/**
 * Interseção do raio origin + t·dir (t > eps) com a elipse centrada na origem.
 * Retorna o menor t positivo ou null.
 */
export function rayEllipse(a: number, b: number, o: Vec2, d: Vec2, eps = 1e-7): number | null {
  const A = (d.x * d.x) / (a * a) + (d.y * d.y) / (b * b);
  const B = 2 * ((o.x * d.x) / (a * a) + (o.y * d.y) / (b * b));
  const C = (o.x * o.x) / (a * a) + (o.y * o.y) / (b * b) - 1;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t1 = (-B - s) / (2 * A);
  const t2 = (-B + s) / (2 * A);
  const candidates = [t1, t2].filter((t) => t > eps).sort((p, q) => p - q);
  return candidates.length ? candidates[0] : null;
}

/** Reflete a direção d na elipse (centrada na origem) no ponto p. */
export function reflect(a: number, b: number, p: Vec2, d: Vec2): Vec2 {
  let nx = p.x / (a * a);
  let ny = p.y / (b * b);
  const len = Math.hypot(nx, ny);
  nx /= len;
  ny /= len;
  const dot = d.x * nx + d.y * ny;
  return { x: d.x - 2 * dot * nx, y: d.y - 2 * dot * ny };
}

/** Traça um raio com `bounces` reflexões. Retorna a lista de pontos (começa na origem). */
export function traceRay(a: number, b: number, origin: Vec2, angle: number, bounces: number): Vec2[] {
  const pts: Vec2[] = [origin];
  let o = origin;
  let d = { x: Math.cos(angle), y: Math.sin(angle) };
  for (let i = 0; i < bounces; i++) {
    const t = rayEllipse(a, b, o, d);
    if (t === null) break;
    const p = { x: o.x + t * d.x, y: o.y + t * d.y };
    pts.push(p);
    d = reflect(a, b, p, d);
    o = p;
  }
  return pts;
}

/** Distância de um ponto q à reta que passa por p1 e p2. */
export function distPointLine(q: Vec2, p1: Vec2, p2: Vec2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.abs(dy * q.x - dx * q.y + p2.x * p1.y - p2.y * p1.x) / Math.hypot(dx, dy);
}
