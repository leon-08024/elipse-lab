import { useEffect, useRef, useState } from 'react';
import { Facts, More, Readout, Slider, Stage, Tex } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView, pointerToWorld } from '../components/Plane2D';
import { dist, fmt } from '../math/ellipse';

const TAU = Math.PI * 2;
const view = makeView(820, 520, -7.5, 7.5);

export default function Gardener() {
  const [L, setL] = useState(10); // barbante = 2a
  const [pins, setPins] = useState(6); // alfinetes = 2c
  const [t, setT] = useState(0);
  const [traced, setTraced] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rows, setRows] = useState<{ d1: number; d2: number }[]>([]);
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const a = L / 2;
  const c = Math.min(pins / 2, a - 0.1);
  const b = Math.sqrt(a * a - c * c);
  const F1 = { x: -c, y: 0 };
  const F2 = { x: c, y: 0 };
  const P = { x: a * Math.cos(t), y: b * Math.sin(t) };
  const d1 = dist(P, F1);
  const d2 = dist(P, F2);

  useEffect(() => {
    setTraced(0);
    setT(0);
    setRows([]);
  }, [L, pins]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => {
        const next = prev + dt * 0.9;
        setTraced((tr) => Math.min(TAU, Math.max(tr, next)));
        return next % TAU;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const onPointer = (e: React.PointerEvent<SVGSVGElement>, kind: 'down' | 'move' | 'up') => {
    if (!svgRef.current) return;
    if (kind === 'up') return void (dragging.current = false);
    const w = pointerToWorld(svgRef.current, view, e.clientX, e.clientY);
    if (kind === 'down') {
      if (Math.hypot(w.x - P.x, w.y - P.y) > 1.2) return;
      dragging.current = true;
      setPlaying(false);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (!dragging.current) return;
    let nt = Math.atan2(w.y / b, w.x / a);
    if (nt < 0) nt += TAU;
    setT(nt);
    setTraced((tr) => Math.max(tr, nt));
  };

  const { X, Y } = view;

  return (
    <>
      <Stage
        controls={
          <>
            <Readout label="d₁ + d₂" invert>
              {fmt(d1, 1)} + {fmt(d2, 1)} = {fmt(d1 + d2, 1)}
            </Readout>
            <Slider label="Barbante (2a)" value={L} min={3} max={14} onChange={setL} />
            <Slider label="Alfinetes (2c)" value={Math.min(pins, L - 0.2)} min={0} max={L - 0.2} onChange={setPins} />
            <div className="flex gap-3">
              <button className="btn-default flex-1" onClick={() => setPlaying((p) => !p)}>
                {playing ? 'Pausar' : 'Desenhar'}
              </button>
              <button className="btn" onClick={() => setRows((r) => [...r.slice(-5), { d1, d2 }])} title="Medir">
                Medir
              </button>
            </div>
          </>
        }
      >
        <Plane2D
          ref={svgRef}
          view={view}
          onPointerDown={(e) => onPointer(e, 'down')}
          onPointerMove={(e) => onPointer(e, 'move')}
          onPointerUp={(e) => onPointer(e, 'up')}
        >
          <path d={ellipsePath(view, a, b)} fill="none" stroke="#000" strokeWidth={1} strokeDasharray="1 5" />
          <path d={ellipsePath(view, a, b, 0, 0, traced)} fill="none" stroke="#000" strokeWidth={4} />
          <line x1={X(F1.x)} y1={Y(0)} x2={X(P.x)} y2={Y(P.y)} stroke="#000" strokeWidth={2} />
          <line x1={X(F2.x)} y1={Y(0)} x2={X(P.x)} y2={Y(P.y)} stroke="#000" strokeWidth={2} strokeDasharray="7 5" />
          <text x={(X(F1.x) + X(P.x)) / 2 - 26} y={(Y(0) + Y(P.y)) / 2} fontSize={15} fontWeight={700}>
            d₁
          </text>
          <text x={(X(F2.x) + X(P.x)) / 2 + 10} y={(Y(0) + Y(P.y)) / 2} fontSize={15} fontWeight={700}>
            d₂
          </text>
          <Dot view={view} {...F1} kind="focus" label="F₁" dx={-10} dy={26} />
          <Dot view={view} {...F2} kind="focus" label="F₂" dx={-10} dy={26} />
          <g style={{ cursor: 'grab' }}>
            <Dot view={view} {...P} kind="point" label="P" dx={12} dy={-12} />
          </g>
        </Plane2D>
      </Stage>

      <More>
        <Facts
          rows={[
            ['a = barbante ÷ 2', fmt(a)],
            ['c = alfinetes ÷ 2', fmt(c)],
            [<Tex key="b">{'b = \\sqrt{a^2 - c^2}'}</Tex>, fmt(b)],
            ['e = c ÷ a', fmt(c / a, 3)],
          ]}
        />
        {rows.length > 0 && (
          <table className="os mt-5 w-full max-w-md border border-black text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-2 text-left">#</th>
                <th>d₁</th>
                <th>d₂</th>
                <th>d₁ + d₂</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-black text-center">
                  <td className="px-2 text-left">{i + 1}</td>
                  <td>{fmt(r.d1)}</td>
                  <td>{fmt(r.d2)}</td>
                  <td className="font-bold">{fmt(r.d1 + r.d2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </More>
    </>
  );
}
