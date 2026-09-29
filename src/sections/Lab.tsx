import { useMemo, useRef, useState } from 'react';
import { Checkbox, Facts, More, Readout, Slider, Stage, Tex } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView, pointerToWorld } from '../components/Plane2D';
import { dist, ellipseInfo, fmt, generalEquationTex, pointAt, reducedEquationTex } from '../math/ellipse';

const view = makeView(840, 560, -9, 9);
const pt = (p: { x: number; y: number }) => `(${fmt(p.x)};\\ ${fmt(p.y)})`;

export default function Lab() {
  const [a, setA] = useState(5);
  const [b, setB] = useState(4);
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);
  const [t, setT] = useState(1);
  const [show, setShow] = useState({ foci: true, vertices: true, axes: true, point: false, directrices: false });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const E = useMemo(() => ellipseInfo(a, b, h, k), [a, b, h, k]);
  const P = pointAt(E, t);
  const [F1, F2] = E.foci;
  const d1 = dist(P, F1);
  const d2 = dist(P, F2);
  const { X, Y, W, H } = view;
  const tog = (key: keyof typeof show) => (v: boolean) => setShow((s) => ({ ...s, [key]: v }));

  const onPointer = (e: React.PointerEvent<SVGSVGElement>, kind: 'down' | 'move' | 'up') => {
    if (!svgRef.current || !show.point) return;
    if (kind === 'up') return void (dragging.current = false);
    const w = pointerToWorld(svgRef.current, view, e.clientX, e.clientY);
    if (kind === 'down') {
      if (Math.hypot(w.x - P.x, w.y - P.y) > 1) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (dragging.current) setT(Math.atan2((w.y - k) / b, (w.x - h) / a));
  };

  const line = (p: { x: number; y: number }, q: { x: number; y: number }, extra: React.SVGProps<SVGLineElement> = {}) => (
    <line x1={X(p.x)} y1={Y(p.y)} x2={X(q.x)} y2={Y(q.y)} stroke="#000" {...extra} />
  );

  return (
    <>
      <Stage
        controls={
          <>
            <Readout invert>
              <Tex>{reducedEquationTex(a, b, h, k)}</Tex>
            </Readout>
            <Slider label="a" value={a} min={0.5} max={8} onChange={setA} />
            <Slider label="b" value={b} min={0.5} max={5.5} onChange={setB} />
            <Slider label="h (centro x)" value={h} min={-4} max={4} step={0.5} onChange={setH} />
            <Slider label="k (centro y)" value={k} min={-2} max={2} step={0.5} onChange={setK} />
            <div className="flex flex-col gap-2.5 border-t border-black pt-4">
              <Checkbox label="Focos" checked={show.foci} onChange={tog('foci')} />
              <Checkbox label="Vértices" checked={show.vertices} onChange={tog('vertices')} />
              <Checkbox label="Eixos" checked={show.axes} onChange={tog('axes')} />
              <Checkbox label="Ponto P" checked={show.point} onChange={tog('point')} />
              <Checkbox label="Diretrizes" checked={show.directrices} onChange={tog('directrices')} />
            </div>
            <Readout label="excentricidade">e = {fmt(E.e, 3)}</Readout>
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
          {show.directrices &&
            E.directrices?.map((d, i) =>
              E.horizontal ? (
                <line key={i} x1={X(d)} x2={X(d)} y1={0} y2={H} stroke="#000" strokeDasharray="2 4" />
              ) : (
                <line key={i} y1={Y(d)} y2={Y(d)} x1={0} x2={W} stroke="#000" strokeDasharray="2 4" />
              ),
            )}
          {show.axes && (
            <g>
              {line(E.majorVertices[0], E.majorVertices[1], { strokeWidth: 2 })}
              {line(E.minorVertices[0], E.minorVertices[1], { strokeWidth: 1, strokeDasharray: '6 4' })}
              <text
                x={(X(h) + X(E.majorVertices[1].x)) / 2 + (E.horizontal ? 0 : 10)}
                y={(Y(k) + Y(E.majorVertices[1].y)) / 2 + (E.horizontal ? -10 : 0)}
                fontSize={16}
                fontWeight={700}
              >
                {E.horizontal ? 'a' : 'b'}
              </text>
              <text
                x={(X(h) + X(E.minorVertices[1].x)) / 2 + (E.horizontal ? 8 : 0)}
                y={(Y(k) + Y(E.minorVertices[1].y)) / 2 + (E.horizontal ? 0 : -8)}
                fontSize={16}
                fontWeight={700}
              >
                {E.horizontal ? 'b' : 'a'}
              </text>
            </g>
          )}
          <path d={ellipsePath(view, a, b, h, k)} fill="none" stroke="#000" strokeWidth={3.5} />
          {show.point && (
            <g>
              {line(F1, P, { strokeWidth: 2 })}
              {line(F2, P, { strokeWidth: 2, strokeDasharray: '7 5' })}
            </g>
          )}
          <Dot view={view} x={h} y={k} kind="center" />
          {show.vertices && (
            <>
              <Dot view={view} {...E.majorVertices[0]} kind="vertex" label={E.horizontal ? 'A₁' : 'A₁'} dx={-26} dy={-8} />
              <Dot view={view} {...E.majorVertices[1]} kind="vertex" label="A₂" dx={8} dy={-8} />
              <Dot view={view} {...E.minorVertices[0]} kind="vertex" label="B₁" dx={8} dy={18} />
              <Dot view={view} {...E.minorVertices[1]} kind="vertex" label="B₂" dx={8} dy={-8} />
            </>
          )}
          {show.foci && !E.isCircle && (
            <>
              <Dot view={view} {...F1} kind="focus" label="F₁" dx={-10} dy={26} />
              <Dot view={view} {...F2} kind="focus" label="F₂" dx={-10} dy={26} />
            </>
          )}
          {show.point && (
            <g style={{ cursor: 'grab' }}>
              <Dot view={view} {...P} kind="point" label={`${fmt(d1, 1)} + ${fmt(d2, 1)} = ${fmt(d1 + d2, 1)}`} dx={14} dy={-14} />
            </g>
          )}
        </Plane2D>
      </Stage>

      <More>
        <Facts
          rows={[
            ['c² = maior² − menor²', <Tex key="c">{`c = ${fmt(E.c)}`}</Tex>],
            ['Centro', <Tex key="o">{pt(E.center)}</Tex>],
            ['Focos', <Tex key="f">{E.isCircle ? '\\text{no centro}' : `${pt(F1)},\\ ${pt(F2)}`}</Tex>],
            ['Eixo maior · menor', `${fmt(2 * E.semiMajor)} · ${fmt(2 * E.semiMinor)}`],
            ['Diretrizes', <Tex key="d">{E.directrices ? `${E.horizontal ? 'x' : 'y'} = ${fmt(E.directrices[0])};\\ ${fmt(E.directrices[1])}` : '—'}</Tex>],
            ['Área πab', fmt(E.area)],
            ['Forma geral', <Tex key="g">{generalEquationTex(a, b, h, k)}</Tex>],
            [
              'Paramétrica',
              <Tex key="p">{`x = ${h ? fmt(h) + '+' : ''}${fmt(a)}\\cos t,\\ y = ${k ? fmt(k) + '+' : ''}${fmt(b)}\\sin t`}</Tex>,
            ],
          ]}
        />
      </More>
    </>
  );
}
