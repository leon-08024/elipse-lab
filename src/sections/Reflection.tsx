import { useEffect, useMemo, useRef, useState } from 'react';
import { Callout, Panel, SectionHeader, Slider, Stat, Toggle } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView, pointerToWorld } from '../components/Plane2D';
import { dist, fmt, traceRay, type Vec2 } from '../math/ellipse';

const view = makeView(840, 520, -7.5, 7.5);

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
  const [a, setA] = useState(6);
  const [b, setB] = useState(3.6);
  const [n, setN] = useState(24);
  const [bounces, setBounces] = useState(1);
  const [src, setSrc] = useState<Vec2 | null>(null); // null = no foco F1
  const [wave, setWave] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [phase, setPhase] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const bb = Math.min(b, a - 0.1);
  const c = Math.sqrt(a * a - bb * bb);
  const F1 = { x: -c, y: 0 };
  const F2 = { x: c, y: 0 };
  const S = src ?? F1;
  const atFocus = dist(S, F1) < 0.05;

  const rays = useMemo(
    () => Array.from({ length: n }, (_, i) => traceRay(a, bb, S, (i / n) * Math.PI * 2 + 0.013, bounces + 1)),
    [a, bb, S.x, S.y, n, bounces],
  );
  // cortar cada raio após `bounces` reflexões (o último trecho vai até a parede)
  const maxLen = Math.max(...rays.map(pathLength));

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      setPhase((p) => (p + ((now - last) / 1000) * 4) % (maxLen + 2));
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
    // mantém a fonte dentro da elipse; "gruda" no foco quando perto
    if ((w.x * w.x) / (a * a) + (w.y * w.y) / (bb * bb) > 0.92) return;
    setSrc(dist(w, F1) < 0.35 ? null : dist(w, F2) < 0.35 ? { ...F2 } : w);
  };

  const { X, Y } = view;
  const hl = rays[Math.round(n / 8) % n]; // raio destacado p/ mostrar a normal
  let normal: { p: Vec2; n: Vec2 } | null = null;
  if (hl && hl.length > 1) {
    const p = hl[1];
    const nx = p.x / (a * a), ny = p.y / (bb * bb);
    const L = Math.hypot(nx, ny);
    normal = { p, n: { x: nx / L, y: ny / L } };
  }
  // comprimento F₁ → P → F₂ do raio destacado (deve ser 2a)
  const firstLeg = hl && hl.length > 1 ? dist(hl[0], hl[1]) + dist(hl[1], F2) : 0;

  return (
    <div>
      <SectionHeader kicker="Etapa 3 · Demonstração de propriedade" title="Propriedade Refletora">
        Qualquer onda (luz, som, choque) que sai de um foco e bate na elipse é refletida em direção ao outro foco. E mais: todos os
        caminhos <span className="text-pink-400">F₁</span> → P → <span className="text-pink-400">F₂</span> têm o mesmo comprimento{' '}
        <span className="text-cyan-300">2a</span> — por isso as ondas chegam <strong>ao mesmo tempo</strong>.
      </SectionHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="p-3">
          <Plane2D
            ref={svgRef}
            view={view}
            axes={false}
            onPointerDown={(e) => onPointer(e, 'down')}
            onPointerMove={(e) => onPointer(e, 'move')}
            onPointerUp={(e) => onPointer(e, 'up')}
          >
            <path d={ellipsePath(view, a, bb)} fill="rgba(34,211,238,0.04)" stroke="#e2e8f0" strokeWidth={5} filter="url(#glow)" />
            {rays.map((r, i) => (
              <polyline
                key={i}
                points={r.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')}
                fill="none"
                stroke={atFocus ? '#fde047' : '#fb7185'}
                strokeOpacity={0.22}
                strokeWidth={1.3}
              />
            ))}
            {/* pulsos */}
            {rays.map((r, i) => {
              const s = wave ? phase : (phase + (i * maxLen) / n) % (maxLen + 2);
              const p = pointAlong(r, s);
              return p ? <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={3.6} fill="#fef08a" filter="url(#glow)" /> : null;
            })}
            {/* frente de onda: círculo de raio = fase (enquanto não bateu) */}
            {wave && atFocus && phase < a - c && (
              <circle cx={X(S.x)} cy={Y(S.y)} r={view.S(phase)} fill="none" stroke="#fef08a" strokeOpacity={0.12} />
            )}
            {normal && (
              <g>
                <line
                  x1={X(normal.p.x - normal.n.x * 1.4)}
                  y1={Y(normal.p.y - normal.n.y * 1.4)}
                  x2={X(normal.p.x + normal.n.x * 0.8)}
                  y2={Y(normal.p.y + normal.n.y * 0.8)}
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <line
                  x1={X(normal.p.x - normal.n.y * 1.8)}
                  y1={Y(normal.p.y + normal.n.x * 1.8)}
                  x2={X(normal.p.x + normal.n.y * 1.8)}
                  y2={Y(normal.p.y - normal.n.x * 1.8)}
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                />
                <polyline
                  points={hl.slice(0, 3).map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')}
                  fill="none"
                  stroke="#fde047"
                  strokeWidth={2.5}
                />
                <text x={X(normal.p.x) + 10} y={Y(normal.p.y) - 10} fill="#a78bfa" fontSize={12}>
                  normal
                </text>
              </g>
            )}
            <Dot view={view} {...F1} color="#f472b6" label="F₁" dx={-10} dy={24} r={6} />
            <Dot view={view} {...F2} color="#f472b6" label="F₂" dx={-10} dy={24} r={6} />
            <g style={{ cursor: 'grab' }}>
              <circle cx={X(S.x)} cy={Y(S.y)} r={16} fill="#fff" opacity={0.1} />
              <Dot view={view} {...S} color="#ffffff" label="fonte" r={6} dx={10} dy={-10} />
            </g>
          </Plane2D>
          <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
            <button className="btn-primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? '❚❚ Pausar' : '▶ Emitir'}
            </button>
            <button className="btn" onClick={() => setSrc(null)} disabled={atFocus}>
              ◎ Fonte no foco
            </button>
            <button className="btn" onClick={() => setSrc({ x: 0, y: 0 })}>
              ✕ Fonte fora do foco
            </button>
            <Toggle label="Onda (todos juntos)" checked={wave} onChange={setWave} color="#fde047" />
            <span className="ml-auto text-xs text-slate-400">Arraste a fonte para ver o que acontece fora do foco.</span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <Slider label="a" value={a} min={3} max={7} onChange={setA} color="#22d3ee" />
            <Slider label="b" value={bb} min={1.5} max={a - 0.1} onChange={setB} color="#a78bfa" />
            <Slider label="Número de raios" value={n} min={4} max={72} step={1} digits={0} onChange={setN} color="#fde047" />
            <Slider label="Reflexões" value={bounces} min={1} max={4} step={1} digits={0} onChange={setBounces} color="#fb7185" />
          </Panel>
          <Panel>
            <div
              className={`mb-3 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
                atFocus ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'
              }`}
            >
              {atFocus ? '✓ Fonte no foco: todos os raios convergem em F₂' : '✗ Fonte fora do foco: os raios se espalham'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Caminho F₁→P→F₂ (destacado)" value={atFocus ? fmt(firstLeg) : '—'} color="#fde047" />
              <Stat label="2a" value={fmt(2 * a)} color="#22d3ee" />
            </div>
            <p className="mt-3 text-sm text-slate-400">
              No ponto de reflexão, o ângulo entre o raio que chega e a <span className="text-violet-300">normal</span> é igual ao
              ângulo do raio que sai (lei da reflexão). A <span className="text-cyan-300">tangente</span> à elipse é a bissetriz
              externa do ângulo F₁PF₂.
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Callout icon="🩺" title="Litotripsia (pedra nos rins)" tone="cyan">
          Um refletor em forma de meio elipsoide gera uma onda de choque em um foco; o paciente é posicionado para que o cálculo renal
          fique no <strong>outro foco</strong>. A energia se concentra ali e quebra a pedra sem cirurgia.
        </Callout>
        <Callout icon="🗣️" title="Galerias dos sussurros" tone="violet">
          Em salas com teto elíptico (como o Statuary Hall, no Capitólio dos EUA), uma pessoa sussurrando em um foco é ouvida claramente
          por quem está no outro foco, mesmo a vários metros.
        </Callout>
        <Callout icon="🎱" title="Bilhar elíptico" tone="pink">
          Numa mesa elíptica com a caçapa em um foco, basta tacar a bola passando pelo outro foco: ela sempre bate na borda e cai na
          caçapa!
        </Callout>
      </div>
    </div>
  );
}
