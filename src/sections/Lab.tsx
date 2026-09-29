import { useMemo, useRef, useState } from 'react';
import { Callout, Panel, SectionHeader, Slider, Stat, Tex, Toggle } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView, pointerToWorld } from '../components/Plane2D';
import { dist, ellipseInfo, fmt, generalEquationTex, pointAt, reducedEquationTex } from '../math/ellipse';

const view = makeView(840, 580, -9, 9);

const PRESETS = [
  { name: 'Clássica 5-4-3', a: 5, b: 4, h: 0, k: 0 },
  { name: 'Circunferência', a: 4, b: 4, h: 0, k: 0 },
  { name: 'Achatada', a: 7, b: 1.8, h: 0, k: 0 },
  { name: 'Vertical', a: 3, b: 5, h: 0, k: 0 },
  { name: 'Deslocada', a: 4, b: 2.5, h: 2, k: 1 },
  { name: 'Órbita da Terra', a: 5, b: 4.9993, h: 0, k: 0 },
];

const pt = (p: { x: number; y: number }) => `(${fmt(p.x)};\\ ${fmt(p.y)})`;

export default function Lab() {
  const [a, setA] = useState(5);
  const [b, setB] = useState(4);
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);
  const [t, setT] = useState(1);
  const [show, setShow] = useState({ foci: true, vertices: true, axes: true, directrices: false, radii: true, rect: false });
  const [ghost, setGhost] = useState<{ a: number; b: number; h: number; k: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const E = useMemo(() => ellipseInfo(a, b, h, k), [a, b, h, k]);
  const P = pointAt(E, t);
  const [F1, F2] = E.foci;
  const d1 = dist(P, F1);
  const d2 = dist(P, F2);
  const { X, Y, S } = view;
  const tog = (key: keyof typeof show) => (v: boolean) => setShow((s) => ({ ...s, [key]: v }));

  // distância de P à diretriz do lado de F2
  const dDir = E.directrices ? Math.abs((E.horizontal ? P.x : P.y) - E.directrices[1]) : NaN;

  const onPointer = (e: React.PointerEvent<SVGSVGElement>, kind: 'down' | 'move' | 'up') => {
    if (!svgRef.current) return;
    if (kind === 'up') return void (dragging.current = false);
    const w = pointerToWorld(svgRef.current, view, e.clientX, e.clientY);
    if (kind === 'down') {
      if (Math.hypot(w.x - P.x, w.y - P.y) > 1) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (dragging.current) setT(Math.atan2((w.y - k) / b, (w.x - h) / a));
  };

  const majorLabel = E.horizontal ? 'a' : 'b';
  const minorLabel = E.horizontal ? 'b' : 'a';

  return (
    <div>
      <SectionHeader kicker="Etapa 3 · Integração digital" title="Laboratório de Parâmetros">
        Mexa nos controles deslizantes e observe como <Tex>{'a'}</Tex>, <Tex>{'b'}</Tex> e o centro <Tex>{'(h, k)'}</Tex> mudam a
        forma, os focos e a equação. Arraste o ponto <strong>P</strong> sobre a curva.
      </SectionHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Panel className="p-3">
            <Plane2D
              ref={svgRef}
              view={view}
              onPointerDown={(e) => onPointer(e, 'down')}
              onPointerMove={(e) => onPointer(e, 'move')}
              onPointerUp={(e) => onPointer(e, 'up')}
            >
              {ghost && (
                <path
                  d={ellipsePath(view, ghost.a, ghost.b, ghost.h, ghost.k)}
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                />
              )}
              {show.rect && (
                <rect
                  x={X(h - a)}
                  y={Y(k + b)}
                  width={S(2 * a)}
                  height={S(2 * b)}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="3 5"
                />
              )}
              {show.directrices &&
                E.directrices &&
                E.directrices.map((d, i) =>
                  E.horizontal ? (
                    <g key={i}>
                      <line x1={X(d)} x2={X(d)} y1={0} y2={view.H} stroke="#fb923c" strokeWidth={1.5} strokeDasharray="8 5" />
                      <text x={X(d) + 6} y={20} fill="#fb923c" fontSize={12}>
                        {i ? 'r₂' : 'r₁'}
                      </text>
                    </g>
                  ) : (
                    <g key={i}>
                      <line y1={Y(d)} y2={Y(d)} x1={0} x2={view.W} stroke="#fb923c" strokeWidth={1.5} strokeDasharray="8 5" />
                      <text x={10} y={Y(d) - 6} fill="#fb923c" fontSize={12}>
                        {i ? 'r₂' : 'r₁'}
                      </text>
                    </g>
                  ),
                )}
              {show.axes && (
                <g strokeWidth={2}>
                  <line
                    x1={X(E.majorVertices[0].x)}
                    y1={Y(E.majorVertices[0].y)}
                    x2={X(E.majorVertices[1].x)}
                    y2={Y(E.majorVertices[1].y)}
                    stroke="#22d3ee"
                    strokeOpacity={0.8}
                  />
                  <line
                    x1={X(E.minorVertices[0].x)}
                    y1={Y(E.minorVertices[0].y)}
                    x2={X(E.minorVertices[1].x)}
                    y2={Y(E.minorVertices[1].y)}
                    stroke="#a78bfa"
                    strokeOpacity={0.8}
                  />
                  {!E.isCircle && (
                    <line x1={X(h)} y1={Y(k)} x2={X(F2.x)} y2={Y(F2.y)} stroke="#facc15" strokeWidth={4} strokeOpacity={0.9} />
                  )}
                </g>
              )}
              <path d={ellipsePath(view, a, b, h, k)} fill="rgba(52,211,153,0.06)" stroke="#34d399" strokeWidth={3.5} filter="url(#glow)" />
              {show.radii && (
                <g strokeWidth={2}>
                  <line x1={X(F1.x)} y1={Y(F1.y)} x2={X(P.x)} y2={Y(P.y)} stroke="#f9a8d4" />
                  <line x1={X(F2.x)} y1={Y(F2.y)} x2={X(P.x)} y2={Y(P.y)} stroke="#fde047" />
                  {show.directrices && E.directrices && (
                    <line
                      x1={X(P.x)}
                      y1={Y(P.y)}
                      x2={X(E.horizontal ? E.directrices[1] : P.x)}
                      y2={Y(E.horizontal ? P.y : E.directrices[1])}
                      stroke="#fb923c"
                      strokeDasharray="3 3"
                    />
                  )}
                </g>
              )}
              <Dot view={view} x={h} y={k} color="#34d399" r={4} label="O" dx={6} dy={16} />
              {show.vertices && (
                <>
                  <Dot view={view} {...E.majorVertices[0]} color="#22d3ee" label="A₁" dx={-24} dy={-8} />
                  <Dot view={view} {...E.majorVertices[1]} color="#22d3ee" label="A₂" dx={8} dy={-8} />
                  <Dot view={view} {...E.minorVertices[0]} color="#a78bfa" label="B₁" dx={8} dy={16} />
                  <Dot view={view} {...E.minorVertices[1]} color="#a78bfa" label="B₂" dx={8} dy={-8} />
                </>
              )}
              {show.foci && !E.isCircle && (
                <>
                  <Dot view={view} {...F1} color="#f472b6" label="F₁" dx={-10} dy={22} r={6} />
                  <Dot view={view} {...F2} color="#f472b6" label="F₂" dx={-10} dy={22} r={6} />
                </>
              )}
              {show.axes && (
                <g fontSize={14} fontWeight={700}>
                  <text
                    x={(X(h) + X(E.majorVertices[1].x)) / 2 + (E.horizontal ? 0 : -18)}
                    y={(Y(k) + Y(E.majorVertices[1].y)) / 2 + (E.horizontal ? 20 : 0)}
                    fill="#22d3ee"
                  >
                    {majorLabel}
                  </text>
                  {!E.isCircle && (
                    <text
                      x={(X(h) + X(F2.x)) / 2 + (E.horizontal ? -4 : 10)}
                      y={(Y(k) + Y(F2.y)) / 2 + (E.horizontal ? -8 : 4)}
                      fill="#facc15"
                    >
                      c
                    </text>
                  )}
                  <text
                    x={(X(h) + X(E.minorVertices[1].x)) / 2 + (E.horizontal ? -16 : 0)}
                    y={(Y(k) + Y(E.minorVertices[1].y)) / 2 + (E.horizontal ? 0 : -8)}
                    fill="#a78bfa"
                  >
                    {minorLabel}
                  </text>
                </g>
              )}
              <g style={{ cursor: 'grab' }}>
                <circle cx={X(P.x)} cy={Y(P.y)} r={14} fill="#fff" opacity={0.08} />
                <Dot view={view} {...P} color="#ffffff" label="P" r={6} />
              </g>
            </Plane2D>
            <div className="flex flex-wrap gap-2 px-2 pb-2">
              <Toggle label="Focos" checked={show.foci} onChange={tog('foci')} color="#f472b6" />
              <Toggle label="Vértices" checked={show.vertices} onChange={tog('vertices')} color="#22d3ee" />
              <Toggle label="Eixos e c" checked={show.axes} onChange={tog('axes')} color="#a78bfa" />
              <Toggle label="Raios focais" checked={show.radii} onChange={tog('radii')} color="#fde047" />
              <Toggle label="Diretrizes" checked={show.directrices} onChange={tog('directrices')} color="#fb923c" />
              <Toggle label="Retângulo 2a × 2b" checked={show.rect} onChange={tog('rect')} color="#94a3b8" />
              <div className="ml-auto flex gap-2">
                <button className="btn px-3 py-1.5 text-xs" onClick={() => setGhost({ a, b, h, k })}>
                  📌 Fixar para comparar
                </button>
                {ghost && (
                  <button className="btn px-3 py-1.5 text-xs" onClick={() => setGhost(null)}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </Panel>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className="chip hover:bg-white/10"
                onClick={() => {
                  setA(p.a);
                  setB(p.b);
                  setH(p.h);
                  setK(p.k);
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Panel>
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">Equação reduzida</div>
              <Tex block>{reducedEquationTex(a, b, h, k)}</Tex>
            </Panel>
            <Panel>
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">Forma geral</div>
              <div className="overflow-x-auto">
                <Tex block>{generalEquationTex(a, b, h, k)}</Tex>
              </div>
            </Panel>
            <Panel>
              <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">Forma paramétrica</div>
              <Tex block>{`\\begin{cases} x = ${h ? fmt(h) + ' + ' : ''}${fmt(a)}\\cos t \\\\ y = ${k ? fmt(k) + ' + ' : ''}${fmt(b)}\\sin t \\end{cases}`}</Tex>
            </Panel>
          </div>
        </div>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <Slider label={<Tex>{'a'}</Tex>} value={a} min={0.5} max={8} step={0.1} onChange={setA} color="#22d3ee" hint="semieixo na direção x" />
            <Slider label={<Tex>{'b'}</Tex>} value={b} min={0.5} max={5.5} step={0.1} onChange={setB} color="#a78bfa" hint="semieixo na direção y" />
            <Slider label={<Tex>{'h'}</Tex>} value={h} min={-4} max={4} step={0.5} onChange={setH} color="#34d399" hint="x do centro" />
            <Slider label={<Tex>{'k'}</Tex>} value={k} min={-2} max={2} step={0.5} onChange={setK} color="#34d399" hint="y do centro" />
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Excentricidade</span>
              <span className="font-mono text-xl text-yellow-300">e = {fmt(E.e, 3)}</span>
            </div>
            <div className="relative h-2 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-rose-500">
              <div
                className="absolute -top-1.5 h-5 w-1.5 -translate-x-1/2 rounded bg-white shadow-[0_0_10px_white] transition-all"
                style={{ left: `${E.e * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>0 · circunferência</span>
              <span>→ 1 · muito achatada</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="eixo maior" value={fmt(2 * E.semiMajor)} color="#22d3ee" />
              <Stat label="eixo menor" value={fmt(2 * E.semiMinor)} color="#a78bfa" />
              <Stat label="dist. focal" value={fmt(2 * E.c)} color="#facc15" />
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
              <Tex>{`c^2 = ${majorLabel}^2 - ${minorLabel}^2 = ${fmt(E.semiMajor ** 2)} - ${fmt(E.semiMinor ** 2)} \\Rightarrow c = ${fmt(E.c)}`}</Tex>
            </div>
          </Panel>

          <Panel className="space-y-1.5 text-sm">
            <Row k="Centro" v={pt(E.center)} c="#34d399" />
            <Row k="Focos" v={E.isCircle ? '\\text{coincidem com o centro}' : `${pt(F1)},\\ ${pt(F2)}`} c="#f472b6" />
            <Row k="Vértices (eixo maior)" v={`${pt(E.majorVertices[0])},\\ ${pt(E.majorVertices[1])}`} c="#22d3ee" />
            <Row k="Vértices (eixo menor)" v={`${pt(E.minorVertices[0])},\\ ${pt(E.minorVertices[1])}`} c="#a78bfa" />
            <Row
              k="Diretrizes"
              v={E.directrices ? `${E.horizontal ? 'x' : 'y'} = ${fmt(E.directrices[0])},\\ ${fmt(E.directrices[1])}` : '\\text{não existem}'}
              c="#fb923c"
            />
            <Row k="Lado reto (2b²/a)" v={fmt(E.latusRectum)} c="#cbd5e1" />
            <Row k="Área (πab)" v={fmt(E.area)} c="#cbd5e1" />
          </Panel>

          <Callout icon="✅" title="Demonstração da propriedade no ponto P" tone="pink">
            <Tex>{`d(P,F_1) + d(P,F_2) = ${fmt(d1)} + ${fmt(d2)} = ${fmt(d1 + d2)} = 2\\cdot${fmt(E.semiMajor)}`}</Tex>
            {E.directrices && (
              <div className="mt-2">
                <Tex>{`\\frac{d(P,F_2)}{d(P,r_2)} = \\frac{${fmt(d2)}}{${fmt(dDir)}} = ${fmt(d2 / dDir, 3)} = e`}</Tex>
              </div>
            )}
          </Callout>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, c }: { k: string; v: string; c: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-1.5 last:border-0">
      <span className="text-slate-400">{k}</span>
      <span style={{ color: c }}>
        <Tex>{v}</Tex>
      </span>
    </div>
  );
}
