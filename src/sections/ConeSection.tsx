import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Callout, Panel, SectionHeader, Slider, Stat, Tex, Toggle } from '../components/ui';
import { conicKind, dandelinSpheres, planeNormal, sectionCurve, sectionEccentricity, type Vec3 } from '../math/cone';
import { fmt } from '../math/ellipse';

const H = 5; // altura de cada folha do cone
const DEG = Math.PI / 180;

const KIND_COLOR: Record<string, string> = {
  circunferência: '#22d3ee',
  elipse: '#34d399',
  parábola: '#facc15',
  hipérbole: '#f472b6',
};

const d3 = (p: Vec3, q: Vec3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

function CameraRig({ target }: { target: { pos: Vec3; look: Vec3; id: number } | null }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null };
  useEffect(() => {
    if (!target) return;
    camera.position.set(...target.pos);
    if (controls) {
      controls.target.set(...target.look);
      controls.update();
    } else camera.lookAt(...target.look);
  }, [target?.id]);
  return null;
}

function Scene({
  alpha,
  beta,
  h,
  showDandelin,
  showCone,
  u,
  autoRotate,
  view,
}: {
  alpha: number;
  beta: number;
  h: number;
  showDandelin: boolean;
  showCone: boolean;
  u: number;
  autoRotate: boolean;
  view: { pos: Vec3; look: Vec3; id: number } | null;
}) {
  const kind = conicKind(alpha, beta);
  const color = KIND_COLOR[kind];
  const segments = useMemo(() => sectionCurve(alpha, beta, h, H), [alpha, beta, h]);
  const R = H * Math.tan(alpha * DEG);
  const isEllipse = kind === 'elipse' || kind === 'circunferência';
  const spheres = useMemo(() => (isEllipse ? dandelinSpheres(alpha, beta, h) : []), [alpha, beta, h, isEllipse]);

  // ponto P andando na curva (só elipse, trecho único)
  const curve = segments[0] ?? [];
  const P = isEllipse && curve.length ? curve[Math.floor(u * (curve.length - 1))] : null;
  const sa = Math.sin(alpha * DEG);
  const ca = Math.cos(alpha * DEG);

  // geratriz por P e pontos onde ela toca os círculos de tangência das esferas
  let generator: Vec3[] | null = null;
  let touch: Vec3[] = [];
  if (P && spheres.length === 2) {
    const L = Math.hypot(P[0], P[1], P[2]);
    const dir: Vec3 = [P[0] / L, P[1] / L, P[2] / L];
    touch = spheres.map((s) => {
      const along = s.center[1] * ca; // distância do vértice ao círculo de tangência
      return [dir[0] * along, dir[1] * along, dir[2] * along] as Vec3;
    });
    const top = H / dir[1];
    generator = [[0, 0, 0], [dir[0] * top, dir[1] * top, dir[2] * top]];
  }

  const generators = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const th = (i / 16) * Math.PI * 2;
        return [
          [-R * Math.cos(th), -H, -R * Math.sin(th)],
          [R * Math.cos(th), H, R * Math.sin(th)],
        ] as Vec3[];
      }),
    [R],
  );

  return (
    <>
      <CameraRig target={view} />
      <color attach="background" args={['#05060f']} />
      <Stars radius={60} depth={30} count={2500} factor={3} fade speed={0.5} />
      <ambientLight intensity={0.6} />
      <pointLight position={[8, 10, 6]} intensity={80} />
      <pointLight position={[-8, -6, -6]} intensity={30} color="#a78bfa" />

      {showCone && (
        <group>
          {/* folha superior */}
          <mesh position={[0, H / 2, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[R, H, 96, 1, true]} />
            <meshStandardMaterial color="#22d3ee" transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* folha inferior */}
          <mesh position={[0, -H / 2, 0]}>
            <coneGeometry args={[R, H, 96, 1, true]} />
            <meshStandardMaterial color="#22d3ee" transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {generators.map((g, i) => (
            <Line key={i} points={g} color="#67e8f9" transparent opacity={0.18} lineWidth={1} />
          ))}
          <Line points={[[0, -H - 0.5, 0], [0, H + 0.5, 0]]} color="#94a3b8" dashed dashSize={0.2} gapSize={0.15} lineWidth={1} />
        </group>
      )}

      {/* plano de corte */}
      <group position={[0, h, 0]} rotation={[0, 0, beta * DEG]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#a78bfa" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <gridHelper args={[10, 10, '#a78bfa', '#4c3d7a']} />
      </group>

      {/* curva de interseção */}
      {segments.map((s, i) => (
        <Line key={i} points={s} color={color} lineWidth={4} />
      ))}

      {/* Esferas de Dandelin */}
      {showDandelin &&
        spheres.map((s, i) => (
          <group key={i}>
            <mesh position={s.center}>
              <sphereGeometry args={[s.radius, 48, 32]} />
              <meshStandardMaterial color="#f472b6" transparent opacity={0.22} roughness={0.2} metalness={0.1} depthWrite={false} />
            </mesh>
            {/* círculo de tangência esfera-cone */}
            <Line
              points={Array.from({ length: 65 }, (_, j) => {
                const th = (j / 64) * Math.PI * 2;
                const y = s.center[1] * ca * ca;
                const r = s.center[1] * ca * sa;
                return [r * Math.cos(th), y, r * Math.sin(th)] as Vec3;
              })}
              color="#f9a8d4"
              lineWidth={1.5}
            />
            <mesh position={s.focus}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color="#f472b6" />
            </mesh>
            <Html position={s.focus} center style={{ pointerEvents: 'none' }}>
              <div className="translate-x-4 -translate-y-4 font-mono text-sm font-bold text-pink-300">F{i + 1}</div>
            </Html>
          </group>
        ))}

      {P && showDandelin && spheres.length === 2 && (
        <group>
          <mesh position={P}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Line points={[P, spheres[0].focus]} color="#f9a8d4" lineWidth={2.5} />
          <Line points={[P, spheres[1].focus]} color="#fde047" lineWidth={2.5} />
          {generator && <Line points={generator} color="#ffffff" transparent opacity={0.35} lineWidth={1} dashed dashSize={0.15} gapSize={0.1} />}
          {touch.map((t, i) => (
            <mesh key={i} position={t}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color={i ? '#fde047' : '#f9a8d4'} />
            </mesh>
          ))}
          <Html position={P} center style={{ pointerEvents: 'none' }}>
            <div className="translate-x-4 -translate-y-4 font-mono text-sm font-bold text-white">P</div>
          </Html>
        </group>
      )}

      <OrbitControls makeDefault target={[0, 1, 0]} enableDamping autoRotate={autoRotate} autoRotateSpeed={0.8} minDistance={4} maxDistance={40} />
    </>
  );
}

export default function ConeSection() {
  const [alpha, setAlpha] = useState(30);
  const [beta, setBeta] = useState(25);
  const [h, setH] = useState(2);
  const [showDandelin, setShowDandelin] = useState(true);
  const [showCone, setShowCone] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [u, setU] = useState(0);
  const [view, setView] = useState<{ pos: Vec3; look: Vec3; id: number } | null>(null);
  const viewId = useRef(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setU((((now - start) / 1000) * 0.08) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const kind = conicKind(alpha, beta);
  const e = sectionEccentricity(alpha, beta);
  const limit = 90 - alpha;
  const isEllipse = kind === 'elipse' || kind === 'circunferência';

  // soma PF1 + PF2 (medida em 3D) para mostrar que é constante
  const measured = useMemo(() => {
    if (!isEllipse || beta < 0.35) return null;
    const sp = dandelinSpheres(alpha, beta, h);
    const curve = sectionCurve(alpha, beta, h, H)[0];
    if (!curve || sp.length < 2) return null;
    const P = curve[Math.floor(u * (curve.length - 1))];
    const d1 = d3(P, sp[0].focus), d2 = d3(P, sp[1].focus);
    return { d1, d2 };
  }, [alpha, beta, h, u, isEllipse]);

  const lookAtPlane = () => {
    const n = planeNormal(beta);
    const c: Vec3 = [0, h, 0];
    const D = 13;
    setView({ pos: [c[0] + n[0] * D, c[1] + n[1] * D, c[2] + n[2] * D], look: c, id: ++viewId.current });
  };
  const resetView = () => setView({ pos: [9, 10, 12], look: [0, 1, 0], id: ++viewId.current });

  const presets = [
    { k: 'circunferência', b: 0 },
    { k: 'elipse', b: Math.round(limit * 0.5) },
    { k: 'parábola', b: limit },
    { k: 'hipérbole', b: Math.min(88, limit + 20) },
  ];

  return (
    <div>
      <SectionHeader kicker="Etapa 1 · Bônus coletivo" title="Cone de Apolônio">
        Todas as cônicas nascem do corte de um cone duplo por um plano. A <strong className="text-emerald-300">elipse</strong> aparece
        quando o plano é inclinado <em>menos</em> que a geratriz do cone e corta só uma das folhas.
      </SectionHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel className="relative overflow-hidden p-0">
          <div className="h-[62vh] min-h-[460px] w-full">
            <Canvas camera={{ position: [9, 10, 12], fov: 45 }} dpr={[1, 2]}>
              <Scene
                alpha={alpha}
                beta={beta}
                h={h}
                showDandelin={showDandelin && isEllipse}
                showCone={showCone}
                u={u}
                autoRotate={autoRotate}
                view={view}
              />
            </Canvas>
          </div>
          <div
            className="pointer-events-none absolute left-4 top-4 rounded-xl border px-4 py-2 font-display text-2xl font-bold capitalize backdrop-blur"
            style={{ color: KIND_COLOR[kind], borderColor: KIND_COLOR[kind] + '55', background: KIND_COLOR[kind] + '15' }}
          >
            {kind}
          </div>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <button className="btn bg-ink-900/80 px-3 py-1.5 text-xs" onClick={lookAtPlane}>
              👁 Olhar de frente para o plano
            </button>
            <button className="btn bg-ink-900/80 px-3 py-1.5 text-xs" onClick={resetView}>
              ↺ Vista inicial
            </button>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <Slider
              label="Inclinação do plano (β)"
              value={beta}
              min={0}
              max={89}
              step={0.5}
              onChange={setBeta}
              color={KIND_COLOR[kind]}
              suffix="°"
              hint={`Elipse enquanto β < 90° − α = ${fmt(limit, 1)}°`}
            />
            <Slider label="Abertura do cone (α)" value={alpha} min={15} max={45} step={0.5} onChange={setAlpha} color="#22d3ee" suffix="°" />
            <Slider label="Altura do plano" value={h} min={0.8} max={4} step={0.1} onChange={setH} color="#a78bfa" />
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.k}
                  className="chip capitalize hover:bg-white/10"
                  style={{ color: KIND_COLOR[p.k] }}
                  onClick={() => setBeta(p.b)}
                >
                  {p.k}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Toggle label="Esferas de Dandelin" checked={showDandelin} onChange={setShowDandelin} color="#f472b6" />
              <Toggle label="Cone" checked={showCone} onChange={setShowCone} color="#22d3ee" />
              <Toggle label="Girar" checked={autoRotate} onChange={setAutoRotate} color="#a78bfa" />
            </div>
          </Panel>

          <Panel>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Excentricidade" value={<Tex>{`e = \\frac{\\sin\\beta}{\\cos\\alpha} = ${fmt(e, 3)}`}</Tex>} color="#facc15" />
              <Stat label="Tipo" value={<span className="capitalize">{kind}</span>} color={KIND_COLOR[kind]} />
            </div>
            {measured && showDandelin && (
              <div className="mt-3 rounded-xl border border-pink-400/20 bg-pink-400/5 p-3 text-sm">
                <div className="mb-1 font-semibold text-pink-200">Medido em 3D agora:</div>
                <Tex>{`PF_1 + PF_2 = ${fmt(measured.d1)} + ${fmt(measured.d2)} = ${fmt(measured.d1 + measured.d2)}`}</Tex>
                <div className="mt-1 text-xs text-slate-400">o ponto P se move, a soma não muda ✓</div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Callout icon="🔮" title="Esferas de Dandelin (1822): por que existem focos?" tone="pink">
          Duas esferas encaixadas no cone tocam o plano exatamente nos <strong>focos</strong>. Para um ponto P da curva,{' '}
          <em>PF₁</em> é igual ao trecho da geratriz de P até o círculo de tangência da esfera de baixo (tangentes de um mesmo ponto a
          uma esfera são iguais), e o mesmo vale para <em>PF₂</em>. Somando, obtemos a distância entre os dois círculos ao longo da
          geratriz — que é a mesma para qualquer P. Logo <strong>PF₁ + PF₂ = constante</strong>: é uma elipse!
        </Callout>
        <Callout icon="📐" title="Classificação pelo ângulo" tone="cyan">
          <ul className="space-y-1">
            <li>
              <span className="text-cyan-300">β = 0</span> → circunferência (e = 0)
            </li>
            <li>
              <span className="text-emerald-300">0 &lt; β &lt; 90° − α</span> → elipse (0 &lt; e &lt; 1)
            </li>
            <li>
              <span className="text-yellow-300">β = 90° − α</span> → parábola (e = 1), plano paralelo à geratriz
            </li>
            <li>
              <span className="text-pink-300">β &gt; 90° − α</span> → hipérbole (e &gt; 1), corta as duas folhas
            </li>
          </ul>
        </Callout>
      </div>
    </div>
  );
}
