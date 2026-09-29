import { useEffect, useMemo, useRef, useState } from 'react';
import { Facts, More, Note, Readout, Slider, Stage, Stepper } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView, pointerToWorld } from '../components/Plane2D';
import { dist, fmt, traceRay, type Vec2 } from '../math/ellipse';

const view = makeView(840, 540, -7.2, 7.2);
const A = 6;

function pathLength(pts: Vec2[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

function pointAlong(pts: Vec2[], s: number): Vec2 | null {
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (s <= seg) {
      const u = s / seg;
      return { x: pts[i - 1].x + u * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + u * (pts[i].y - pts[i - 1].y) };
    }
    s -= seg;
  }
  return null;
}

export default function Reflection() {
  const [b, setB] = useState(3.6);
  const [n, setN] = useState(24);
  const [bounces, setBounces] = useState(1);
  const [src, setSrc] = useState<Vec2 | null>(null); // null = no foco F₁
  const [playing, setPlaying] = useState(true);
  const [phase, setPhase] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const c = Math.sqrt(A * A - b * b);
  const F1 = { x: -c, y: 0 };
  const F2 = { x: c, y: 0 };
  const S = src ?? F1;
  const atFocus = dist(S, F1) < 0.05;

  const rays = useMemo(
    () => Array.from({ length: n }, (_, i) => traceRay(A, b, S, (i / n) * Math.PI * 2 + 0.013, bounces + 1)),
    [b, S.x, S.y, n, bounces],
  );
  const maxLen = Math.max(...rays.map(pathLength));

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      setPhase((p) => (p + ((now - last) / 1000) * 4) % (maxLen + 1.5));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, maxLen]);

  const onPointer = (e: React.PointerEvent<SVGSVGElement>, kind: 'down' | 'move' | 'up') => {
    if (!svgRef.current) return;
    if (kind === 'up') return void (dragging.current = false);
    const w = pointerToWorld(svgRef.current, view, e.clientX, e.clientY);
    if (kind === 'down') {
      if (dist(w, S) > 1) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (!dragging.current) return;
    if ((w.x * w.x) / (A * A) + (w.y * w.y) / (b * b) > 0.9) return;
    setSrc(dist(w, F1) < 0.35 ? null : w);
  };

  const { X, Y } = view;
  const hl = rays[Math.round(n / 8) % n];
  const legLen = hl && hl.length > 1 ? dist(hl[0], hl[1]) + dist(hl[1], F2) : 0;

  return (
    <>
      <Stage
        controls={
          <>
            <Readout invert>{atFocus ? 'Converge em F₂' : 'Espalha'}</Readout>
            <Stepper label="Raios" value={n} min={4} max={72} step={4} onChange={setN} />
            <Stepper label="Reflexões" value={bounces} min={1} max={4} onChange={setBounces} />
            <Slider label="b" value={b} min={1.5} max={5.9} onChange={setB} />
            <div className="flex flex-col gap-3 border-t border-black pt-4">
              <button className={`btn ${atFocus ? 'on' : ''}`} onClick={() => setSrc(null)}>
                Fonte no foco
              </button>
              <button className={`btn ${!atFocus ? 'on' : ''}`} onClick={() => setSrc({ x: 0, y: 0.8 })}>
                Fora do foco
              </button>
              <button className="btn-default" onClick={() => setPlaying((p) => !p)}>
                {playing ? 'Pausar' : 'Emitir'}
              </button>
            </div>
          </>
        }
      >
        <Plane2D
          ref={svgRef}
          view={view}
          grid={false}
          axes={false}
          onPointerDown={(e) => onPointer(e, 'down')}
          onPointerMove={(e) => onPointer(e, 'move')}
          onPointerUp={(e) => onPointer(e, 'up')}
        >
          {rays.map((r, i) => (
            <polyline key={i} points={r.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#000" strokeWidth={0.6} />
          ))}
          <path d={ellipsePath(view, A, b)} fill="none" stroke="#000" strokeWidth={5} />
          {rays.map((r, i) => {
            const p = pointAlong(r, phase);
            return p ? <rect key={i} x={X(p.x) - 3.5} y={Y(p.y) - 3.5} width={7} height={7} fill="#000" /> : null;
          })}
          <Dot view={view} {...F2} kind="focus" label="F₂" dx={-10} dy={28} />
          {!atFocus && <Dot view={view} {...F1} kind="focus" label="F₁" dx={-10} dy={28} />}
          <g style={{ cursor: 'grab' }}>
            <Dot view={view} {...S} kind="point" label={atFocus ? 'F₁' : 'fonte'} dx={-12} dy={30} />
          </g>
        </Plane2D>
      </Stage>

      <More>
        <Facts
          rows={[
            ['Caminho F₁ → P → F₂', atFocus ? fmt(legLen) : '—'],
            ['2a', fmt(2 * A)],
          ]}
        />
        <Note>
          Todo caminho F₁ → P → F₂ mede 2a: as ondas chegam juntas ao outro foco. Usos: litotripsia (quebra de cálculo renal), galerias
          dos sussurros, bilhar elíptico.
        </Note>
      </More>
    </>
  );
}
