import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { Checkbox, Facts, More, Note, RadioGroup, Readout, Slider, Stage, Tex } from '../components/ui';
import { conicKind, dandelinSpheres, planeNormal, sectionCurve, sectionEccentricity, type ConicKind, type Vec3 } from '../math/cone';
import { fmt } from '../math/ellipse';

const H = 5;
const DEG = Math.PI / 180;
const d3 = (p: Vec3, q: Vec3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

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

/** Esfera em "arame": 3 paralelos + 4 meridianos. */
function WireSphere({ center, r }: { center: Vec3; r: number }) {
  const circles = useMemo(() => {
    const out: Vec3[][] = [];
    const N = 64;
    for (const lat of [-0.5, 0, 0.5]) {
      const y = r * Math.sin(lat);
      const rr = r * Math.cos(lat);
      out.push(Array.from({ length: N + 1 }, (_, i) => [rr * Math.cos((i / N) * 2 * Math.PI), y, rr * Math.sin((i / N) * 2 * Math.PI)] as Vec3));
    }
    for (let m = 0; m < 4; m++) {
      const ph = (m / 4) * Math.PI;
      out.push(
        Array.from({ length: N + 1 }, (_, i) => {
          const th = (i / N) * 2 * Math.PI;
          return [r * Math.cos(th) * Math.cos(ph), r * Math.sin(th), r * Math.cos(th) * Math.sin(ph)] as Vec3;
        }),
      );
    }
    return out;
  }, [r]);
  return (
    <group position={center}>
      {circles.map((c, i) => (
        <Line key={i} points={c} color="#000" lineWidth={1} dashed={i !== 1} dashSize={0.08} gapSize={0.08} />
      ))}
    </group>
  );
}

function Scene({ alpha, beta, h, dandelin, u, view }: { alpha: number; beta: number; h: number; dandelin: boolean; u: number; view: CamTarget }) {
  const kind = conicKind(alpha, beta);
  const segments = useMemo(() => sectionCurve(alpha, beta, h, H), [alpha, beta, h]);
  const R = H * Math.tan(alpha * DEG);
  const closed = kind === 'elipse' || kind === 'circunferência';
  const spheres = useMemo(() => (closed && dandelin ? dandelinSpheres(alpha, beta, h) : []), [alpha, beta, h, closed, dandelin]);
  const curve = segments[0] ?? [];
  const P = closed && curve.length ? curve[Math.floor(u * (curve.length - 1))] : null;

  const ring = (y: number, r: number) => Array.from({ length: 97 }, (_, i) => [r * Math.cos((i / 96) * 2 * Math.PI), y, r * Math.sin((i / 96) * 2 * Math.PI)] as Vec3);
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

  const ca = Math.cos(alpha * DEG);
  const sa = Math.sin(alpha * DEG);

  return (
    <>
      <CameraRig target={view} />
      <color attach="background" args={['#ffffff']} />
      {generators.map((g, i) => (
        <Line key={i} points={g} color="#000" lineWidth={0.6} />
      ))}
      <Line points={ring(H, R)} color="#000" lineWidth={1.2} />
      <Line points={ring(-H, R)} color="#000" lineWidth={1.2} />

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
          <WireSphere center={s.center} r={s.radius} />
          <Line points={ring(s.center[1] * ca * ca, s.center[1] * ca * sa)} color="#000" lineWidth={1.5} />
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

      <OrbitControls makeDefault target={[0, 1, 0]} enableDamping minDistance={4} maxDistance={40} />
    </>
  );
}

const KINDS: ConicKind[] = ['circunferência', 'elipse', 'parábola', 'hipérbole'];

export default function ConeSection() {
  const [alpha, setAlpha] = useState(30);
  const [beta, setBeta] = useState(25);
  const [h, setH] = useState(2);
  const [dandelin, setDandelin] = useState(true);
  const [u, setU] = useState(0);
  const [view, setView] = useState<CamTarget>(null);
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
  const limit = 90 - alpha;
  const setKind = (k: ConicKind) =>
    setBeta(k === 'circunferência' ? 0 : k === 'elipse' ? Math.round(limit * 0.45) : k === 'parábola' ? limit : Math.min(89, limit + 18));

  const measured = useMemo(() => {
    if (kind !== 'elipse') return null;
    const sp = dandelinSpheres(alpha, beta, h);
    const curve = sectionCurve(alpha, beta, h, H)[0];
    if (!curve || sp.length < 2) return null;
    const P = curve[Math.floor(u * (curve.length - 1))];
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
            <Readout invert>
              <span className="capitalize">{kind}</span>
            </Readout>
            <RadioGroup
              value={kind}
              onChange={setKind}
              options={KINDS.map((k) => ({ value: k, label: <span className="capitalize">{k}</span> }))}
            />
            <div className="flex flex-col gap-4 border-t border-black pt-4">
              <Slider label="Inclinação β" value={beta} min={0} max={89} step={0.5} suffix="°" onChange={setBeta} />
              <Slider label="Abertura α" value={alpha} min={15} max={45} step={0.5} suffix="°" onChange={setAlpha} />
              <Slider label="Altura" value={h} min={0.8} max={4} onChange={setH} />
            </div>
            <Checkbox label="Esferas de Dandelin" checked={dandelin} onChange={setDandelin} />
            <div className="flex gap-3">
              <button className="btn flex-1 px-2" onClick={lookAtPlane}>
                De frente
              </button>
              <button className="btn flex-1 px-2" onClick={() => setView({ pos: [9, 10, 12], look: [0, 1, 0], id: ++viewId.current })}>
                3D
              </button>
            </div>
          </>
        }
      >
        <div className="frame h-full w-full">
          <Canvas camera={{ position: [9, 10, 12], fov: 45 }} dpr={[1, 2]} gl={{ antialias: false }}>
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
          As esferas de Dandelin tocam o cone e o plano: os pontos de contato com o plano são os focos. Por isso PF₁ + PF₂ não muda
          quando P percorre a curva.
        </Note>
      </More>
    </>
  );
}
