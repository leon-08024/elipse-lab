import { useEffect, useRef, useState } from 'react';
import { Callout, Panel, SectionHeader, Slider, Stat, Tex } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView, pointerToWorld } from '../components/Plane2D';
import { dist, fmt } from '../math/ellipse';

const TAU = Math.PI * 2;
const view = makeView(820, 500, -7.5, 7.5);

export default function Gardener() {
  const [L, setL] = useState(10); // comprimento do barbante = 2a
  const [pins, setPins] = useState(6); // distância entre alfinetes = 2c
  const [t, setT] = useState(0);
  const [traced, setTraced] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [scale, setScale] = useState(3); // cm por unidade (modelo físico)
  const [rows, setRows] = useState<{ d1: number; d2: number }[]>([]);
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const a = L / 2;
  const c = Math.min(pins / 2, a - 0.05);
  const b = Math.sqrt(a * a - c * c);
  const F1 = { x: -c, y: 0 };
  const F2 = { x: c, y: 0 };
  const P = { x: a * Math.cos(t), y: b * Math.sin(t) };
  const d1 = dist(P, F1);
  const d2 = dist(P, F2);

  // Mantém a distância entre alfinetes menor que o barbante.
  useEffect(() => {
    if (pins > L - 0.2) setPins(Math.max(0, L - 0.2));
  }, [L, pins]);

  // Reinicia o desenho quando a elipse muda.
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
        const next = prev + dt * 0.9 * speed;
        setTraced((tr) => Math.min(TAU, Math.max(tr, next)));
        return next % TAU;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const onPointer = (e: React.PointerEvent<SVGSVGElement>, kind: 'down' | 'move' | 'up') => {
    if (!svgRef.current) return;
    if (kind === 'up') {
      dragging.current = false;
      return;
    }
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
  const cm = (u: number) => fmt(u * scale, 1);

  return (
    <div>
      <SectionHeader kicker="Etapa 2 ↔ Etapa 3 · Modelo físico no digital" title="Método do Jardineiro">
        Fixe dois alfinetes (os <span className="text-pink-400">focos</span>), amarre um barbante de comprimento{' '}
        <span className="text-cyan-300">2a</span> nas pontas e estique-o com um lápis. Ao girar, o lápis desenha uma elipse — porque o
        barbante não muda de tamanho, <strong className="text-yellow-300">d₁ + d₂ = 2a</strong> sempre.
      </SectionHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="p-3">
          <Plane2D
            ref={svgRef}
            view={view}
            onPointerDown={(e) => onPointer(e, 'down')}
            onPointerMove={(e) => onPointer(e, 'move')}
            onPointerUp={(e) => onPointer(e, 'up')}
          >
            {/* elipse "fantasma" completa */}
            <path d={ellipsePath(view, a, b)} fill="none" stroke="rgba(52,211,153,0.12)" strokeWidth={2} strokeDasharray="4 6" />
            {/* traço do lápis */}
            <path d={ellipsePath(view, a, b, 0, 0, traced)} fill="none" stroke="#34d399" strokeWidth={3.5} filter="url(#glow)" />
            {/* barbante */}
            <polyline
              points={`${X(F1.x)},${Y(0)} ${X(P.x)},${Y(P.y)} ${X(F2.x)},${Y(0)}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <text x={(X(F1.x) + X(P.x)) / 2 - 14} y={(Y(0) + Y(P.y)) / 2 - 6} fill="#f9a8d4" fontSize={14} fontWeight={700}>
              d₁
            </text>
            <text x={(X(F2.x) + X(P.x)) / 2 + 6} y={(Y(0) + Y(P.y)) / 2 - 6} fill="#fde047" fontSize={14} fontWeight={700}>
              d₂
            </text>
            {/* alfinetes */}
            {[F1, F2].map((F, i) => (
              <g key={i}>
                <circle cx={X(F.x)} cy={Y(0)} r={9} fill="#f472b6" opacity={0.25} />
                <Dot view={view} x={F.x} y={0} color="#f472b6" r={5} label={i ? 'F₂' : 'F₁'} dx={-8} dy={24} />
              </g>
            ))}
            {/* lápis */}
            <g transform={`translate(${X(P.x)},${Y(P.y)})`} style={{ cursor: 'grab' }}>
              <circle r={16} fill="white" opacity={0.08} />
              <circle r={7} fill="#fff" filter="url(#glow)" />
              <text x={12} y={-12} fill="#fff" fontSize={14} fontWeight={700}>
                P
              </text>
            </g>
          </Plane2D>
          <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
            <button className="btn-primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? '❚❚ Pausar' : '▶ Desenhar'}
            </button>
            <button
              className="btn"
              onClick={() => {
                setTraced(0);
                setT(0);
              }}
            >
              ↺ Recomeçar
            </button>
            <button className="btn" onClick={() => setRows((r) => [...r.slice(-5), { d1, d2 }])}>
              📏 Medir d₁ e d₂ agora
            </button>
            <span className="ml-auto text-xs text-slate-400">Dica: pause e arraste o lápis com o mouse.</span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <Slider label="Comprimento do barbante (2a)" value={L} min={3} max={14} step={0.1} onChange={setL} color="#22d3ee" />
            <Slider
              label="Distância entre os alfinetes (2c)"
              value={Math.min(pins, L - 0.2)}
              min={0}
              max={L - 0.2}
              step={0.1}
              onChange={setPins}
              color="#f472b6"
              hint="Alfinetes juntos (c = 0) → circunferência!"
            />
            <Slider label="Velocidade" value={speed} min={0.2} max={3} step={0.1} onChange={setSpeed} color="#a78bfa" suffix="×" />
          </Panel>

          <Panel>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="d₁" value={fmt(d1)} color="#f9a8d4" />
              <Stat label="d₂" value={fmt(d2)} color="#fde047" />
              <Stat label="d₁ + d₂" value={fmt(d1 + d2)} color="#34d399" />
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/5">
              <div className="flex h-full">
                <div className="bg-pink-400 transition-[width] duration-75" style={{ width: `${(d1 / (d1 + d2)) * 100}%` }} />
                <div className="flex-1 bg-yellow-300" />
              </div>
            </div>
            <div className="mt-1 text-center text-xs text-slate-400">as partes mudam, o total (= barbante) não</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="a" value={fmt(a)} color="#22d3ee" />
              <Stat label="c" value={fmt(c)} color="#facc15" />
              <Stat label="b = √(a²−c²)" value={fmt(b)} color="#a78bfa" />
            </div>
          </Panel>

          {rows.length > 0 && (
            <Panel>
              <div className="mb-2 text-sm font-semibold">Medições</div>
              <table className="w-full font-mono text-sm">
                <thead className="text-xs text-slate-400">
                  <tr>
                    <th className="text-left">#</th>
                    <th>d₁</th>
                    <th>d₂</th>
                    <th>soma</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="text-center">
                      <td className="text-left text-slate-500">{i + 1}</td>
                      <td className="text-pink-300">{fmt(r.d1)}</td>
                      <td className="text-yellow-300">{fmt(r.d2)}</td>
                      <td className="text-emerald-300">{fmt(r.d1 + r.d2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Callout icon="🧵" title="Do barbante para a equação" tone="amber">
          <div className="mb-3 flex items-center gap-3">
            <span>Escala do modelo físico:</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={scale}
              onChange={(e) => setScale(Math.max(0.5, Number(e.target.value) || 1))}
              className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-sm"
            />
            <span>cm por unidade</span>
          </div>
          Para reproduzir <strong>esta</strong> elipse na cartolina: barbante de <strong className="text-cyan-300">{cm(2 * a)} cm</strong> e
          alfinetes a <strong className="text-pink-300">{cm(2 * c)} cm</strong> um do outro. O eixo menor vai medir{' '}
          <strong className="text-violet-300">{cm(2 * b)} cm</strong>.
          <div className="mt-2">
            <Tex>{`\\frac{x^2}{${fmt((a * scale) ** 2, 1)}} + \\frac{y^2}{${fmt((b * scale) ** 2, 1)}} = 1 \\;\\text{(em cm)}`}</Tex>
          </div>
        </Callout>
        <Callout icon="🧮" title="Por que a = metade do barbante e b = √(a² − c²)?" tone="violet">
          Quando o lápis está no vértice A₂, o barbante fica "dobrado" sobre o eixo maior: d₁ + d₂ = (a + c) + (a − c) = 2a. Quando o
          lápis está em B₁ (no topo), as duas partes são iguais a <em>a</em> e formam um triângulo retângulo com catetos <em>b</em> e{' '}
          <em>c</em>:
          <div className="mt-2">
            <Tex>{'a^2 = b^2 + c^2 \\;\\Rightarrow\\; b = \\sqrt{a^2 - c^2}'}</Tex>
          </div>
        </Callout>
      </div>
    </div>
  );
}
