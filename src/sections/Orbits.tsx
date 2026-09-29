import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Callout, Panel, SectionHeader, Slider, Stat, Tex, Toggle } from '../components/ui';
import { BODIES, aphelion, orbitPosition, perihelion, visViva, type Body } from '../math/kepler';
import { fmt } from '../math/ellipse';

type Mode = 'internos' | 'halley';
const V_EARTH = 29.78; // km/s

function orbitPoints(a: number, e: number, s: number, n = 256): [number, number, number][] {
  const b = a * Math.sqrt(1 - e * e);
  return Array.from({ length: n + 1 }, (_, i) => {
    const E = (i / n) * Math.PI * 2;
    return [a * (Math.cos(E) - e) * s, 0, -b * Math.sin(E) * s];
  });
}

/** Setores varridos em intervalos de tempo iguais (2ª lei de Kepler). */
function sectorGeometries(body: Body, s: number, count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const verts: number[] = [];
    const steps = 40;
    let prev = orbitPosition(body.a, body.e, i / count);
    for (let j = 1; j <= steps; j++) {
      const cur = orbitPosition(body.a, body.e, (i + j / steps) / count);
      verts.push(0, 0, 0, prev.x * s, 0, -prev.y * s, cur.x * s, 0, -cur.y * s);
      prev = cur;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return g;
  });
}

function Planet({ body, scale, timeRef, selected, onSelect }: { body: Body; scale: number; timeRef: React.MutableRefObject<number>; selected: boolean; onSelect: () => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = orbitPosition(body.a, body.e, timeRef.current / body.period);
    ref.current?.position.set(p.x * scale, 0, -p.y * scale);
  });
  const vis = Math.max(body.size, 0.05) * (scale > 1 ? 1.6 : 1);
  return (
    <group ref={ref}>
      <mesh onClick={onSelect}>
        <sphereGeometry args={[vis, 32, 32]} />
        <meshStandardMaterial color={body.color} emissive={body.color} emissiveIntensity={selected ? 0.6 : 0.25} />
      </mesh>
      {body.id === 'halley' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[vis * 2.2, 16, 16]} />
          <meshBasicMaterial color="#9be7ff" transparent opacity={0.15} />
        </mesh>
      )}
      <Html center style={{ pointerEvents: 'none' }}>
        <div
          className={`-translate-y-6 whitespace-nowrap rounded px-1.5 font-mono text-xs ${selected ? 'bg-white/15 text-white' : 'text-slate-400'}`}
        >
          {body.name}
        </div>
      </Html>
    </group>
  );
}

function Scene({
  bodies,
  scale,
  timeRef,
  playing,
  speed,
  selected,
  setSelected,
  showSectors,
  showElements,
}: {
  bodies: Body[];
  scale: number;
  timeRef: React.MutableRefObject<number>;
  playing: boolean;
  speed: number;
  selected: Body;
  setSelected: (id: string) => void;
  showSectors: boolean;
  showElements: boolean;
}) {
  useFrame((_, dt) => {
    if (playing) timeRef.current += Math.min(dt, 0.1) * speed;
  });
  const sectors = useMemo(() => sectorGeometries(selected, scale), [selected, scale]);
  useEffect(() => () => sectors.forEach((g) => g.dispose()), [sectors]);

  const a = selected.a * scale;
  const c = selected.a * selected.e * scale;
  const b = a * Math.sqrt(1 - selected.e ** 2);

  return (
    <>
      <color attach="background" args={['#03040b']} />
      <Stars radius={120} depth={60} count={5000} factor={4} fade speed={0.4} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={60} distance={0} decay={1.2} color="#fff3d1" />

      {/* Sol */}
      <mesh>
        <sphereGeometry args={[scale > 1 ? 0.28 : 0.35, 48, 48]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      <mesh>
        <sphereGeometry args={[scale > 1 ? 0.45 : 0.6, 32, 32]} />
        <meshBasicMaterial color="#ffb703" transparent opacity={0.18} />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className="translate-y-6 font-mono text-xs text-amber-300">Sol (foco)</div>
      </Html>

      {bodies.map((bd) => (
        <Line
          key={bd.id}
          points={orbitPoints(bd.a, bd.e, scale)}
          color={bd.color}
          transparent
          opacity={bd.id === selected.id ? 0.95 : 0.3}
          lineWidth={bd.id === selected.id ? 2.5 : 1}
        />
      ))}

      {showSectors &&
        sectors.map((g, i) => (
          <mesh key={i} geometry={g}>
            <meshBasicMaterial color={i % 2 ? '#22d3ee' : '#a78bfa'} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}

      {showElements && (
        <group>
          {/* eixo maior e menor da órbita selecionada (centro em (−c, 0)) */}
          <Line points={[[-a - c, 0, 0], [a - c, 0, 0]]} color="#22d3ee" dashed dashSize={0.1 * scale} gapSize={0.06 * scale} lineWidth={1} />
          <Line points={[[-c, 0, -b], [-c, 0, b]]} color="#a78bfa" dashed dashSize={0.1 * scale} gapSize={0.06 * scale} lineWidth={1} />
          <mesh position={[-2 * c, 0, 0]}>
            <sphereGeometry args={[0.06 * Math.max(1, scale / 2), 16, 16]} />
            <meshBasicMaterial color="#f472b6" />
          </mesh>
          <Html position={[-2 * c, 0, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="translate-y-5 font-mono text-xs text-pink-300">foco vazio</div>
          </Html>
          <mesh position={[-c, 0, 0]}>
            <sphereGeometry args={[0.04 * Math.max(1, scale / 2), 16, 16]} />
            <meshBasicMaterial color="#34d399" />
          </mesh>
          <Html position={[a - c, 0, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="-translate-y-5 font-mono text-xs text-cyan-300">periélio</div>
          </Html>
          <Html position={[-a - c, 0, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="-translate-y-5 font-mono text-xs text-cyan-300">afélio</div>
          </Html>
        </group>
      )}

      {bodies.map((bd) => (
        <Planet key={bd.id} body={bd} scale={scale} timeRef={timeRef} selected={bd.id === selected.id} onSelect={() => setSelected(bd.id)} />
      ))}

      <OrbitControls makeDefault enableDamping minDistance={1.5} maxDistance={80} />
    </>
  );
}

export default function Orbits() {
  const [mode, setMode] = useState<Mode>('internos');
  const [selectedId, setSelectedId] = useState('terra');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.25);
  const [showSectors, setShowSectors] = useState(false);
  const [showElements, setShowElements] = useState(true);
  const [customE, setCustomE] = useState(0.6);
  const [snap, setSnap] = useState({ t: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setSnap({ t: timeRef.current }), 100);
    return () => clearInterval(id);
  }, []);

  const custom: Body = {
    id: 'x',
    name: 'Planeta X',
    a: 1.25,
    e: customE,
    period: Math.pow(1.25, 1.5),
    color: '#34d399',
    size: 0.07,
    note: 'Órbita inventada: mude a excentricidade e veja a velocidade variar.',
  };

  const bodies = useMemo(() => {
    const inner = BODIES.filter((b) => b.id !== 'halley');
    return mode === 'internos' ? [...inner, custom] : BODIES;
  }, [mode, customE]);

  const scale = mode === 'internos' ? 4 : 0.45;
  const selected = bodies.find((b) => b.id === selectedId) ?? bodies[0];

  const switchMode = (m: Mode) => {
    setMode(m);
    setSelectedId(m === 'halley' ? 'halley' : 'terra');
    setSpeed(m === 'halley' ? 8 : 0.25);
  };

  const pos = orbitPosition(selected.a, selected.e, snap.t / selected.period);
  const v = V_EARTH * visViva(selected.a, pos.r);
  const vPeri = V_EARTH * visViva(selected.a, perihelion(selected.a, selected.e));
  const vAph = V_EARTH * visViva(selected.a, aphelion(selected.a, selected.e));

  return (
    <div>
      <SectionHeader kicker="Aplicação no mundo real" title="Órbitas: as elipses de Kepler">
        1ª lei de Kepler (1609): cada planeta descreve uma <strong className="text-emerald-300">elipse</strong> com o{' '}
        <span className="text-amber-300">Sol em um dos focos</span>. As distâncias e excentricidades abaixo são reais.
      </SectionHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel className="relative overflow-hidden p-0">
          <div className="h-[62vh] min-h-[460px] w-full">
            <Canvas camera={{ position: mode === 'internos' ? [0, 9, 8] : [0, 10, 9], fov: 50 }} dpr={[1, 2]} key={mode}>
              <Scene
                bodies={bodies}
                scale={scale}
                timeRef={timeRef}
                playing={playing}
                speed={speed}
                selected={selected}
                setSelected={setSelectedId}
                showSectors={showSectors}
                showElements={showElements}
              />
            </Canvas>
          </div>
          <div className="absolute left-3 top-3 flex gap-2">
            <button className={mode === 'internos' ? 'btn-primary' : 'btn bg-ink-900/80'} onClick={() => switchMode('internos')}>
              Planetas internos
            </button>
            <button className={mode === 'halley' ? 'btn-primary' : 'btn bg-ink-900/80'} onClick={() => switchMode('halley')}>
              ☄ Cometa Halley
            </button>
          </div>
          <div className="absolute bottom-3 left-3 rounded-lg bg-ink-900/80 px-3 py-1.5 font-mono text-xs text-slate-300">
            tempo: {fmt(snap.t, 2)} anos · clique em um astro para selecioná-lo
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {bodies.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`chip ${b.id === selected.id ? 'border-white/30 bg-white/15 text-white' : ''}`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                  {b.name}
                </button>
              ))}
            </div>
            <Slider label="Velocidade do tempo" value={speed} min={0.05} max={mode === 'halley' ? 30 : 3} step={0.05} digits={2} onChange={setSpeed} color="#facc15" suffix=" anos/s" />
            {mode === 'internos' && (
              <Slider label="Excentricidade do Planeta X" value={customE} min={0} max={0.95} step={0.01} digits={2} onChange={setCustomE} color="#34d399" />
            )}
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary px-3 py-1.5" onClick={() => setPlaying((p) => !p)}>
                {playing ? '❚❚ Pausar' : '▶ Continuar'}
              </button>
              <Toggle label="Elementos da elipse" checked={showElements} onChange={setShowElements} color="#22d3ee" />
              <Toggle label="Áreas iguais (2ª lei)" checked={showSectors} onChange={setShowSectors} color="#a78bfa" />
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: selected.color, boxShadow: `0 0 12px ${selected.color}` }} />
              <span className="font-display text-lg font-bold">{selected.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="a (UA)" value={fmt(selected.a, 3)} color="#22d3ee" />
              <Stat label="e" value={fmt(selected.e, 4)} color="#facc15" />
              <Stat label="período" value={`${fmt(selected.period, 2)} a`} />
              <Stat label="periélio a(1−e)" value={fmt(perihelion(selected.a, selected.e), 3)} color="#34d399" />
              <Stat label="afélio a(1+e)" value={fmt(aphelion(selected.a, selected.e), 3)} color="#fb7185" />
              <Stat label="dist. atual" value={fmt(pos.r, 3)} />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>velocidade: {fmt(v, 1)} km/s</span>
                <span>
                  {fmt(vAph, 1)} – {fmt(vPeri, 1)} km/s
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-400"
                  style={{ width: `${vPeri === vAph ? 100 : ((v - vAph) / (vPeri - vAph)) * 100}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">{selected.note}</p>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Callout icon="☉" title="1ª lei — órbitas elípticas" tone="amber">
          O Sol não fica no centro: fica em um <strong>foco</strong>. A distância Sol-planeta varia entre{' '}
          <Tex>{'a(1-e)'}</Tex> (periélio) e <Tex>{'a(1+e)'}</Tex> (afélio).
        </Callout>
        <Callout icon="◔" title="2ª lei — áreas iguais" tone="violet">
          O segmento Sol-planeta varre <strong>áreas iguais em tempos iguais</strong>. Por isso o planeta acelera perto do Sol e
          desacelera longe dele. Ative "Áreas iguais": cada fatia leva o mesmo tempo.
        </Callout>
        <Callout icon="⏱" title="3ª lei — períodos" tone="cyan">
          <Tex>{'T^2 = a^3'}</Tex> (T em anos, a em UA). Halley: <Tex>{'a \\approx 17{,}8 \\Rightarrow T \\approx \\sqrt{17{,}8^3} \\approx 75'}</Tex> anos.
        </Callout>
      </div>
      <p className="mt-4 text-xs text-slate-500">Fontes: NASA Planetary Fact Sheet; JPL Small-Body Database (1P/Halley).</p>
    </div>
  );
}
