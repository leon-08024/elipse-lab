import { forwardRef, type ReactNode } from 'react';

export interface View {
  X: (x: number) => number;
  Y: (y: number) => number;
  S: (d: number) => number;
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

export function pointerToWorld(svg: SVGSVGElement, view: View, clientX: number, clientY: number) {
  // considera o preserveAspectRatio "meet" (letterbox)
  const r = svg.getBoundingClientRect();
  const k = Math.min(r.width / view.W, r.height / view.H);
  const ox = (r.width - view.W * k) / 2;
  const oy = (r.height - view.H * k) / 2;
  const px = (clientX - r.left - ox) / k;
  const py = (clientY - r.top - oy) / k;
  return { x: view.invX(px), y: view.invY(py) };
}

interface Props {
  view: View;
  grid?: boolean;
  axes?: boolean;
  ticks?: boolean;
  children: ReactNode;
  className?: string;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>;
}

/** Plano cartesiano 1-bit: grade pontilhada, eixos de 1px. */
export const Plane2D = forwardRef<SVGSVGElement, Props>(function Plane2D(
  { view, grid = true, axes = true, ticks = true, children, className = '', ...handlers },
  ref,
) {
  const { X, Y, W, H, xMin, xMax, yMin, yMax } = view;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = Math.ceil(xMin); x <= xMax; x++) xs.push(x);
  for (let y = Math.ceil(yMin); y <= yMax; y++) ys.push(y);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className={`block h-full max-h-full w-full touch-none select-none ${className}`}
      {...handlers}
    >
      <rect width={W} height={H} fill="#fff" />
      {grid && (
        <g className="crisp" fill="#000">
          {xs.map((x) => ys.map((y) => <rect key={`${x},${y}`} x={Math.round(X(x))} y={Math.round(Y(y))} width={1} height={1} />))}
        </g>
      )}
      {axes && (
        <g className="crisp" stroke="#000" strokeWidth={1}>
          <line x1={0} x2={W} y1={Math.round(Y(0)) + 0.5} y2={Math.round(Y(0)) + 0.5} />
          <line y1={0} y2={H} x1={Math.round(X(0)) + 0.5} x2={Math.round(X(0)) + 0.5} />
          {ticks &&
            xs.map((x) => <line key={`tx${x}`} x1={Math.round(X(x)) + 0.5} x2={Math.round(X(x)) + 0.5} y1={Y(0) - 3} y2={Y(0) + 4} />)}
          {ticks &&
            ys.map((y) => <line key={`ty${y}`} y1={Math.round(Y(y)) + 0.5} y2={Math.round(Y(y)) + 0.5} x1={X(0) - 3} x2={X(0) + 4} />)}
        </g>
      )}
      {children}
    </svg>
  );
});

export type DotKind = 'focus' | 'vertex' | 'center' | 'point';

/** Marcadores 1-bit: foco = disco preto, vértice = quadrado vazado, centro = cruz, ponto = disco com anel. */
export function Dot({
  view,
  x,
  y,
  kind = 'focus',
  label,
  dx = 8,
  dy = -8,
}: {
  view: View;
  x: number;
  y: number;
  kind?: DotKind;
  label?: string;
  dx?: number;
  dy?: number;
}) {
  const cx = view.X(x);
  const cy = view.Y(y);
  return (
    <g>
      {kind === 'focus' && <circle cx={cx} cy={cy} r={5} fill="#000" />}
      {kind === 'vertex' && <rect className="crisp" x={cx - 4} y={cy - 4} width={8} height={8} fill="#fff" stroke="#000" />}
      {kind === 'center' && (
        <path className="crisp" d={`M${cx - 5} ${cy}h10M${cx} ${cy - 5}v10`} stroke="#000" strokeWidth={1.5} />
      )}
      {kind === 'point' && (
        <>
          <circle cx={cx} cy={cy} r={9} fill="#fff" stroke="#000" />
          <circle cx={cx} cy={cy} r={4} fill="#000" />
        </>
      )}
      {label && (
        <text x={cx + dx} y={cy + dy} fontSize={15} fontWeight={700} fill="#000" stroke="#fff" strokeWidth={4} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  );
}

export function ellipsePath(view: View, a: number, b: number, h = 0, k = 0, tMax = Math.PI * 2, n = 240) {
  let d = '';
  const steps = Math.max(2, Math.ceil((n * tMax) / (Math.PI * 2)));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax;
    d += `${i === 0 ? 'M' : 'L'}${view.X(h + a * Math.cos(t)).toFixed(2)},${view.Y(k + b * Math.sin(t)).toFixed(2)}`;
  }
  return d;
}
