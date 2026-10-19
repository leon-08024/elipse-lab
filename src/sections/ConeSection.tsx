import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { Checkbox, Facts, More, Note, Readout, Slider, Stage, Tex } from '../components/ui';
import { conicKind, dandelinSpheres, planeNormal, sectionCurve, sectionEccentricity, type Vec3 } from '../math/cone';
import { fmt } from '../math/ellipse';

const H = 5;
const DEG = Math.PI / 180;
const d3 = (p: Vec3, q: Vec3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
/** Ponto da curva no parâmetro u ∈ [0, 1) (u fora do intervalo é ajustado). */
const pointOn = (curve: Vec3[], u: number): Vec3 | undefined =>
  curve[Math.min(curve.length - 1, Math.max(0, Math.floor(u * (curve.length - 1))))];

type CamTarget = { pos: Vec3; look: Vec3; id: number } | null;

function CameraRig({ target }: { target: CamTarget }) {
  const { camera, controls } = useThree() as unknown as {
    camera: { position: { set: (...v: number[]) => void }; lookAt: (...v: number[]) => void };
    controls: { target: { set: (...v: number[]) => void }; update: () => void } | null;
  };
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

function Label({ at, text }: { at: Vec3; text: string }) {
  return (
    <Html position={at} center style={{ pointerEvents: 'none' }}>
      <div className="os -translate-y-5 translate-x-5 border border-black bg-white px-1 text-[13px] font-bold leading-tight text-black">{text}</div>
    </Html>
  );
}

function Scene({ alpha, beta, h, dandelin, u, view }: { alpha: number; beta: number; h: number; dandelin: boolean; u: number; view: CamTarget }) {
  const kind = conicKind(alpha, beta);
  const segments = useMemo(() => sectionCurve(alpha, beta, h, H), [alpha, beta, h]);
  const R = H * Math.tan(alpha * DEG);
  const rims = useMemo(
    () =>
      [H, -H].map((y) =>
        Array.from({ length: 129 }, (_, i) => {
          const th = (i / 128) * Math.PI * 2;
          return [R * Math.cos(th), y, R * Math.sin(th)] as Vec3;
        }),
      ),
    [R],
  );
  const closed = kind === 'elipse' || kind === 'circunferência';
  const spheres = useMemo(() => (closed && dandelin ? dandelinSpheres(alpha, beta, h) : []), [alpha, beta, h, closed, dandelin]);
  const curve = segments[0] ?? [];
  const P = closed ? pointOn(curve, u) ?? null : null;

  const generators = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const th = (i / 24) * Math.PI * 2;
        return [[-R * Math.cos(th), -H, -R * Math.sin(th)], [R * Math.cos(th), H, R * Math.sin(th)]] as Vec3[];
      }),
    [R],
  );
  const planeGrid = useMemo(() => {
    const lines: Vec3[][] = [];
    const s = 5;
    for (let i = -s; i <= s; i++) {
      lines.push([[i, 0, -s], [i, 0, s]]);
      lines.push([[-s, 0, i], [s, 0, i]]);
    }
    return lines;
  }, []);

  return (
    <>
      <CameraRig target={view} />
      <color attach="background" args={['#ffffff']} />
      {generators.map((g, i) => (
        <Line key={i} points={g} color="#000" lineWidth={0.6} />
      ))}
      {/* borda circular na boca de cada folha do cone (fecha as geratrizes) */}
      {rims.map((r, i) => (
        <Line key={`rim${i}`} points={r} color="#000" lineWidth={1.5} />
      ))}

      <group position={[0, h, 0]} rotation={[0, 0, beta * DEG]}>
        {planeGrid.map((l, i) => (
          <Line key={i} points={l} color="#000" lineWidth={i < 2 || i > planeGrid.length - 3 ? 1.5 : 0.5} dashed={!(i < 2 || i > planeGrid.length - 3)} dashSize={0.1} gapSize={0.12} />
        ))}
      </group>

      {segments.map((s, i) => (
        <Line key={i} points={s} color="#000" lineWidth={5} />
      ))}

      {spheres.map((s, i) => (
        <group key={i}>
          <mesh position={s.focus}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <Label at={s.focus} text={`F${i + 1}`} />
        </group>
      ))}

      {P && spheres.length === 2 && (
        <group>
          <mesh position={P}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <Line points={[P, spheres[0].focus]} color="#000" lineWidth={2} />
          <Line points={[P, spheres[1].focus]} color="#000" lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />
          <Label at={P} text="P" />
        </group>
      )}

      <OrbitControls makeDefault target={[0, 1.5, 0]} enableDamping minDistance={4} maxDistance={40} />
    </>
  );
}

const BETA_MIN = 1;

/**
 * Maior inclinação β em que o corte ainda é uma elipse inteira dentro do cone desenhado:
 * o vértice mais alto fica em y = h / (1 − tan α · tan β) ≤ H. Também fica abaixo de 90° − α (parábola).
 */
function betaMax(alpha: number, h: number) {
  const fit = Math.atan((1 - h / H) / Math.tan(alpha * DEG)) / DEG;
  return Math.max(BETA_MIN + 1, Math.floor(Math.min(fit, 90 - alpha) - 1));
}

export default function ConeSection() {
  const [alpha, setAlpha] = useState(30);
  const [betaRaw, setBeta] = useState(20);
  const [h, setH] = useState(2.8);
  const [dandelin, setDandelin] = useState(true);
  const [u, setU] = useState(0);
  const [view, setView] = useState<CamTarget>(null);
  const viewId = useRef(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      // o timestamp do rAF pode ser anterior a `start` → clamp em 0 para não gerar u < 0
      setU(((Math.max(0, now - start) / 1000) * 0.08) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Só elipse: β fica sempre no intervalo em que o corte é uma elipse completa.
  const maxBeta = betaMax(alpha, h);
  const beta = Math.min(Math.max(betaRaw, BETA_MIN), maxBeta);
  const kind = conicKind(alpha, beta);
  const limit = 90 - alpha;

  const measured = useMemo(() => {
    if (kind !== 'elipse') return null;
    const sp = dandelinSpheres(alpha, beta, h);
    const curve = sectionCurve(alpha, beta, h, H)[0];
    if (!curve || sp.length < 2) return null;
    const P = pointOn(curve, u);
    if (!P) return null;
    return { d1: d3(P, sp[0].focus), d2: d3(P, sp[1].focus) };
  }, [alpha, beta, h, u, kind]);

  const lookAtPlane = () => {
    const n = planeNormal(beta);
    setView({ pos: [n[0] * 13, h + n[1] * 13, 0.001], look: [0, h, 0], id: ++viewId.current });
  };

  return (
    <>
      <Stage
        controls={
          <>
            <Readout label="elipse" invert>
              e = {fmt(sectionEccentricity(alpha, beta), 2)}
            </Readout>
            <div className="flex flex-col gap-4 border-t border-black pt-4">
              <Slider label="Inclinação β" value={beta} min={BETA_MIN} max={maxBeta} step={0.5} suffix="°" onChange={setBeta} />
              <Slider label="Abertura α" value={alpha} min={15} max={45} step={0.5} suffix="°" onChange={setAlpha} />
              <Slider label="Altura" value={h} min={0.8} max={4} onChange={setH} />
            </div>
            <Checkbox label="Focos" checked={dandelin} onChange={setDandelin} />
            <div className="flex gap-3">
              <button className="btn flex-1 px-2" onClick={lookAtPlane}>
                De frente
              </button>
              <button className="btn flex-1 px-2" onClick={() => setView({ pos: [6.5, 7.5, 8.5], look: [0, 1.5, 0], id: ++viewId.current })}>
                3D
              </button>
            </div>
          </>
        }
      >
        <div className="h-full w-full">
          <Canvas camera={{ position: [6.5, 7.5, 8.5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: false }}>
            <Scene alpha={alpha} beta={beta} h={h} dandelin={dandelin} u={u} view={view} />
          </Canvas>
        </div>
      </Stage>

      <More>
        <Facts
          rows={[
            ['Excentricidade', <Tex key="e">{`e = \\frac{\\sin\\beta}{\\cos\\alpha} = ${fmt(sectionEccentricity(alpha, beta), 3)}`}</Tex>],
            ['Elipse quando', <Tex key="l">{`0 < \\beta < 90^\\circ - \\alpha = ${fmt(limit, 1)}^\\circ`}</Tex>],
            ['PF₁ + PF₂ (medido)', measured ? `${fmt(measured.d1)} + ${fmt(measured.d2)} = ${fmt(measured.d1 + measured.d2)}` : '—'],
          ]}
        />
        <Note>
          Os focos são os pontos onde as esferas de Dandelin (tangentes ao cone e ao plano) tocam o plano. Por isso PF₁ + PF₂ não muda
          quando P percorre a curva.
        </Note>
      </More>
    </>
  );
}
