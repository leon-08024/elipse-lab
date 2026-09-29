import { useEffect, useState } from 'react';
import type { SectionId } from '../nav';
import { GRUPO } from '../data/grupo';
import { Facts, More, Tex } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView } from '../components/Plane2D';
import { dist } from '../math/ellipse';
import { Tri } from '../components/Icons';

const view = makeView(760, 440, -7, 7);
const a = 6;
const b = 3.6;
const c = Math.sqrt(a * a - b * b);

export default function Home({ go }: { go: (id: SectionId) => void }) {
  const [t, setT] = useState(1.1);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(1.1 + ((now - start) / 1000) * 0.5);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const P = { x: a * Math.cos(t), y: b * Math.sin(t) };
  const F1 = { x: -c, y: 0 };
  const F2 = { x: c, y: 0 };
  const { X, Y } = view;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="h-[48vh] min-h-[300px] w-full max-w-[820px]">
        <Plane2D view={view} grid={false} axes={false}>
          <path d={ellipsePath(view, a, b)} fill="none" stroke="#000" strokeWidth={3} />
          <line x1={X(F1.x)} y1={Y(0)} x2={X(P.x)} y2={Y(P.y)} stroke="#000" strokeWidth={2} />
          <line x1={X(F2.x)} y1={Y(0)} x2={X(P.x)} y2={Y(P.y)} stroke="#000" strokeWidth={2} strokeDasharray="6 5" />
          <Dot view={view} {...F1} kind="focus" label="F₁" dx={-10} dy={26} />
          <Dot view={view} {...F2} kind="focus" label="F₂" dx={-10} dy={26} />
          <Dot view={view} {...P} kind="point" label="P" dx={12} dy={-12} />
        </Plane2D>
      </div>

      <div className="frame rounded px-6 py-3 text-2xl">
        <Tex>{`d_1 + d_2 = ${(dist(P, F1) + dist(P, F2)).toFixed(0)} = 2a`}</Tex>
      </div>

      <button className="btn-default h-10 px-6 text-base" onClick={() => go('cone')}>
        Começar <Tri dir="r" />
      </button>

      <More>
        <div className="w-full max-w-3xl">
          <p className="mb-4">
            <b>Elipse</b> é o conjunto dos pontos P cuja soma das distâncias a dois pontos fixos (focos) é constante.
          </p>
          <Facts
            rows={[
              ['Focos', <Tex key="f">{'F_1,\\ F_2'}</Tex>],
              ['Eixo maior', <Tex key="a">{'2a'}</Tex>],
              ['Eixo menor', <Tex key="b">{'2b'}</Tex>],
              ['Distância focal', <Tex key="c">{'2c'}</Tex>],
              ['Relação', <Tex key="r">{'a^2 = b^2 + c^2'}</Tex>],
              ['Excentricidade', <Tex key="e">{'e = c/a'}</Tex>],
            ]}
          />
          <div className="os mt-5 text-sm">
            {GRUPO.escola} · {GRUPO.turma} — {GRUPO.integrantes.join(', ')}
          </div>
        </div>
      </More>
    </div>
  );
}
