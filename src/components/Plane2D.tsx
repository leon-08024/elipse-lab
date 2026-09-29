import { forwardRef, type ReactNode } from 'react';

export interface View {
  X: (x: number) => number; // mundo → pixel
  Y: (y: number) => number;
  S: (d: number) => number; // comprimento mundo → pixel
  invX: (px: number) => number;
  invY: (py: number) => number;
  W: number;
  H: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function makeView(W: number, H: number, xMin: number, xMax: number, yCenter = 0): View {
  const s = W / (xMax - xMin);
  const halfY = H / s / 2;
  const yMin = yCenter - halfY;
  const yMax = yCenter + halfY;
  return {
    X: (x) => (x - xMin) * s,
    Y: (y) => (yMax - y) * s,
    S: (d) => d * s,
    invX: (px) => px / s + xMin,
    invY: (py) => yMax - py / s,
    W,
    H,
    xMin,
    xMax,
    yMin,
    yMax,
  };
}

/** Converte coordenadas do mouse (clientX/Y) para coordenadas do mundo. */
export function pointerToWorld(svg: SVGSVGElement, view: View, clientX: number, clientY: number) {
  const r = svg.getBoundingClientRect();
  const px = ((clientX - r.left) / r.width) * view.W;
  const py = ((clientY - r.top) / r.height) * view.H;
  return { x: view.invX(px), y: view.invY(py) };
}

interface Props {
  view: View;
  grid?: boolean;
  axes?: boolean;
  unit?: number;
  children: ReactNode;
  className?: string;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>;
}

/** Plano cartesiano em SVG com grade e eixos. */
export const Plane2D = forwardRef<SVGSVGElement, Props>(function Plane2D(
  { view, grid = true, axes = true, unit = 1, children, className = '', ...handlers },
  ref,
) {
  const { X, Y, W, H, xMin, xMax, yMin, yMax } = view;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = Math.ceil(xMin / unit) * unit; x <= xMax; x += unit) xs.push(Number(x.toFixed(6)));
  for (let y = Math.ceil(yMin / unit) * unit; y <= yMax; y += unit) ys.push(Number(y.toFixed(6)));

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={`h-auto w-full touch-none select-none ${className}`}
      {...handlers}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {grid && (
        <g stroke="rgba(255,255,255,0.06)" strokeWidth={1}>
          {xs.map((x) => (
            <line key={`gx${x}`} x1={X(x)} x2={X(x)} y1={0} y2={H} />
          ))}
          {ys.map((y) => (
            <line key={`gy${y}`} y1={Y(y)} y2={Y(y)} x1={0} x2={W} />
          ))}
        </g>
      )}
      {axes && (
        <g>
          <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
          <line y1={0} y2={H} x1={X(0)} x2={X(0)} stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
          <text x={W - 14} y={Y(0) - 8} fill="rgba(255,255,255,0.5)" fontSize={13}>
            x
          </text>
          <text x={X(0) + 8} y={14} fill="rgba(255,255,255,0.5)" fontSize={13}>
            y
          </text>
          {xs
            .filter((x) => x !== 0)
            .map((x) => (
              <text key={`tx${x}`} x={X(x)} y={Y(0) + 15} fill="rgba(255,255,255,0.3)" fontSize={10} textAnchor="middle">
                {x}
              </text>
            ))}
          {ys
            .filter((y) => y !== 0)
            .map((y) => (
              <text key={`ty${y}`} x={X(0) - 6} y={Y(y) + 3} fill="rgba(255,255,255,0.3)" fontSize={10} textAnchor="end">
                {y}
              </text>
            ))}
        </g>
      )}
      {children}
    </svg>
  );
});

/** Ponto com rótulo. */
export function Dot({
  view,
  x,
  y,
  color,
  label,
  r = 5,
  dx = 8,
  dy = -8,
  glow = true,
}: {
  view: View;
  x: number;
  y: number;
  color: string;
  label?: string;
  r?: number;
  dx?: number;
  dy?: number;
  glow?: boolean;
}) {
  return (
    <g>
      <circle cx={view.X(x)} cy={view.Y(y)} r={r} fill={color} filter={glow ? 'url(#glow)' : undefined} />
      {label && (
        <text x={view.X(x) + dx} y={view.Y(y) + dy} fill={color} fontSize={13} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
}

/** Caminho SVG de uma elipse paramétrica (até o ângulo tMax). */
export function ellipsePath(view: View, a: number, b: number, h = 0, k = 0, tMax = Math.PI * 2, n = 240) {
  let d = '';
  const steps = Math.max(2, Math.ceil((n * tMax) / (Math.PI * 2)));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax;
    const px = view.X(h + a * Math.cos(t));
    const py = view.Y(k + b * Math.sin(t));
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
  }
  return d;
}
