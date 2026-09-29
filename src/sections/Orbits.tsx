import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Checkbox, Facts, More, Note, RadioGroup, Readout, Slider, Stage, Tex } from '../components/ui';
import { BODIES, aphelion, orbitPosition, perihelion, visViva, type Body } from '../math/kepler';
import { fmt } from '../math/ellipse';

type V3 = [number, number, number];
const V_EARTH = 29.78; // km/s

function orbitPoints(a: number, e: number, s: number, n = 256): V3[] {
  const b = a * Math.sqrt(1 - e * e);
  return Array.from({ length: n + 1 }, (_, i) => {
    const E = (i / n) * Math.PI * 2;
    return [a * (Math.cos(E) - e) * s, 0, -b * Math.sin(E) * s];
  });
}

const ringPts = (r: number, c: V3 = [0, 0, 0]): V3[] =>
  Array.from({ length: 49 }, (_, i) => [c[0] + r * Math.cos((i / 48) * 2 * Math.PI), 0, c[2] + r * Math.sin((i / 48) * 2 * Math.PI)]);

function Planet({ body, scale, timeRef, selected }: { body: Body; scale: number; timeRef: React.MutableRefObject<number>; selected: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = orbitPosition(body.a, body.e, timeRef.current / body.period);
    ref.current?.position.set(p.x * scale, 0, -p.y * scale);
  });
  const r = (scale > 1 ? 0.09 : 0.14) * (selected ? 1.4 : 1);
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[r, 24, 24]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {selected && (
        <>
          <Line points={ringPts(r * 2.2)} color="#000" lineWidth={1.5} />
          <Html center style={{ pointerEvents: 'none' }}>
            <div className="os -translate-y-7 whitespace-nowrap border border-black bg-white px-1 text-[13px] font-bold text-black">{body.name}</div>
          </Html>
        </>
      )}
    </group>
  );
}

function Scene({
  scale,
  timeRef,
  playing,
  speed,
  selected,
  spokes,
}: {
  scale: number;
  timeRef: React.MutableRefObject<number>;
  playing: boolean;
  speed: number;
  selected: Body;
  spokes: boolean;
}) {
  useFrame((_, dt) => {
    if (playing) timeRef.current += Math.min(dt, 0.1) * speed;
  });
  const spokeLines = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const p = orbitPosition(selected.a, selected.e, i / 16);
        return [[0, 0, 0], [p.x * scale, 0, -p.y * scale]] as V3[];
      }),
    [selected, scale],
  );
  const c = selected.a * selected.e * scale;

  return (
    <>
      <color attach="background" args={['#ffffff']} />
      {/* Sol no foco */}
      <mesh>
        <sphereGeometry args={[scale > 1 ? 0.22 : 0.3, 32, 32]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <Line points={ringPts(scale > 1 ? 0.36 : 0.5)} color="#000" lineWidth={1} dashed dashSize={0.05} gapSize={0.05} />
      <Html center style={{ pointerEvents: 'none' }}>
        <div className="os translate-y-7 border border-black bg-white px-1 text-[12px] font-bold text-black">Sol · foco</div>
      </Html>

      {BODIES.map((bd) => (
        <Line
          key={bd.id}
          points={orbitPoints(bd.a, bd.e, scale)}
          color="#000"
          lineWidth={bd.id === selected.id ? 2.5 : 0.8}
          dashed={bd.id !== selected.id}
          dashSize={0.06}
          gapSize={0.08}
        />
      ))}

      {/* foco vazio */}
      {2 * c > 0.5 && (
        <>
          <Line points={ringPts(0.08, [-2 * c, 0, 0])} color="#000" lineWidth={1.5} />
          <Line points={[[-2 * c, 0, 0], [0, 0, 0]]} color="#000" lineWidth={0.8} dashed dashSize={0.08} gapSize={0.08} />
        </>
      )}

      {spokes && spokeLines.map((l, i) => <Line key={i} points={l} color="#000" lineWidth={0.8} />)}

      {BODIES.map((bd) => (
        <Planet key={bd.id} body={bd} scale={scale} timeRef={timeRef} selected={bd.id === selected.id} />
      ))}
      <OrbitControls makeDefault enableDamping minDistance={1.5} maxDistance={80} />
    </>
  );
}

export default function Orbits() {
  const [selectedId, setSelectedId] = useState('terra');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.25);
  const [spokes, setSpokes] = useState(false);
  const [snapT, setSnapT] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setSnapT(timeRef.current), 100);
    return () => clearInterval(id);
  }, []);

  const selected = BODIES.find((b) => b.id === selectedId) ?? BODIES[2];
  const halley = selected.id === 'halley';
  const scale = halley ? 0.42 : 4;

  const choose = (id: string) => {
    setSelectedId(id);
    setSpeed(id === 'halley' ? 8 : 0.25);
  };

  const pos = orbitPosition(selected.a, selected.e, snapT / selected.period);
  const v = V_EARTH * visViva(selected.a, pos.r);

  return (
    <>
      <Stage
        controls={
          <>
            <Readout label="distância ao Sol" invert>
              {fmt(pos.r, 3)} UA
            </Readout>
            <Readout label="velocidade">{fmt(v, 1)} km/s</Readout>
            <RadioGroup value={selectedId} onChange={choose} options={BODIES.map((b) => ({ value: b.id, label: b.name }))} />
            <div className="flex flex-col gap-4 border-t border-black pt-4">
              <Slider label="Tempo" value={speed} min={0.05} max={halley ? 30 : 3} step={0.05} digits={2} suffix=" a/s" onChange={setSpeed} />
              <Checkbox label="Áreas iguais" checked={spokes} onChange={setSpokes} />
              <button className="btn-default" onClick={() => setPlaying((p) => !p)}>
                {playing ? 'Pausar' : 'Continuar'}
              </button>
            </div>
          </>
        }
      >
        <div className="frame h-full w-full">
          <Canvas key={halley ? 'h' : 'p'} camera={{ position: [0, 9, 7], fov: 50 }} dpr={[1, 2]} gl={{ antialias: false }}>
            <Scene scale={scale} timeRef={timeRef} playing={playing} speed={speed} selected={selected} spokes={spokes} />
          </Canvas>
        </div>
      </Stage>

      <More>
        <Facts
          rows={[
            ['a (UA)', fmt(selected.a, 3)],
            ['e', fmt(selected.e, 4)],
            ['Periélio a(1−e)', fmt(perihelion(selected.a, selected.e), 3)],
            ['Afélio a(1+e)', fmt(aphelion(selected.a, selected.e), 3)],
            ['Período', `${fmt(selected.period, 2)} anos`],
            ['Tempo decorrido', `${fmt(snapT, 2)} anos`],
          ]}
        />
        <Note>
          1ª lei: órbita elíptica com o Sol em um foco. 2ª lei: áreas iguais em tempos iguais (os raios de "Áreas iguais" são separados
          pelo mesmo tempo). 3ª lei: <Tex>{'T^2 = a^3'}</Tex>. Dados: NASA Planetary Fact Sheet, JPL Small-Body Database.
        </Note>
      </More>
    </>
  );
}
