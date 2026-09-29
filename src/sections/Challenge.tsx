import { useEffect, useMemo, useState } from 'react';
import { Readout, Stage, Tex } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView } from '../components/Plane2D';
import { QUIZ } from '../data/quiz';
import { Tri } from '../components/Icons';
import { ellipseInfo, fmt, reducedEquationTex } from '../math/ellipse';

type Mode = 'quiz' | 'equacao' | 'focos';

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('$').map((p, i) => (i % 2 ? <Tex key={i}>{p}</Tex> : <span key={i}>{p}</span>))}
    </>
  );
}

function Figure({ a, b, h = 0, k = 0, foci = false }: { a: number; b: number; h?: number; k?: number; foci?: boolean }) {
  const view = makeView(720, 420, -9, 9);
  const E = ellipseInfo(a, b, h, k);
  return (
    <Plane2D view={view}>
      <path d={ellipsePath(view, a, b, h, k)} fill="none" stroke="#000" strokeWidth={3.5} />
      <Dot view={view} x={h} y={k} kind="center" />
      {foci && !E.isCircle && (
        <>
          <Dot view={view} {...E.foci[0]} kind="focus" label="F₁" dx={-10} dy={26} />
          <Dot view={view} {...E.foci[1]} kind="focus" label="F₂" dx={-10} dy={26} />
        </>
      )}
    </Plane2D>
  );
}

function useTimer(seconds: number, deps: unknown[]) {
  const [time, setTime] = useState(seconds);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    setTime(seconds);
    setRunning(false);
  }, deps);
  useEffect(() => {
    if (!running || time <= 0) return;
    const id = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, time]);
  return { time, running, setRunning };
}

function Quiz({ i, setI, revealed, setRevealed }: { i: number; setI: (n: number) => void; revealed: boolean; setRevealed: (v: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const q = QUIZ[i];
  useEffect(() => setPicked(null), [i]);

  return (
    <div className="w-full max-w-4xl">
      <div className="os mb-3 text-sm">
        {i + 1} / {QUIZ.length}
      </div>
      <h3 className="text-2xl font-bold leading-snug">
        <Rich text={q.q} />
      </h3>
      {q.figure && (
        <div className="mx-auto mt-3 h-52 max-w-md">
          <Figure {...q.figure} />
        </div>
      )}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {q.options.map((o, j) => {
          const right = revealed && j === q.answer;
          const wrong = revealed && picked === j && j !== q.answer;
          const sel = !revealed && picked === j;
          return (
            <button
              key={j}
              onClick={() => !revealed && setPicked(j)}
              className={`flex items-center gap-3 rounded border border-black p-4 text-left text-lg ${
                right || sel ? 'bg-black text-white [&_.katex]:text-white' : 'bg-white hover:bg-black/5'
              } ${wrong ? 'border-dashed' : ''}`}
            >
              <span className={`os flex h-7 w-7 shrink-0 items-center justify-center border text-sm font-bold ${right || sel ? 'border-white' : 'border-black'}`}>
                {'ABCD'[j]}
              </span>
              <Rich text={o} />
              {right && <span className="os ml-auto text-sm font-bold">CERTA</span>}
              {wrong && <span className="os ml-auto text-sm font-bold">ERRADA</span>}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mt-5 border-l-4 border-black pl-4">
          <Rich text={q.explain} />
        </div>
      )}
      <div className="mt-6 flex gap-3">
        <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
          <Tri dir="l" />
        </button>
        <button className="btn-default" onClick={() => setRevealed(true)} disabled={revealed}>
          Revelar
        </button>
        <button className="btn" onClick={() => setI(Math.min(QUIZ.length - 1, i + 1))} disabled={i === QUIZ.length - 1}>
          <Tri dir="r" />
        </button>
      </div>
    </div>
  );
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomEllipse() {
  const pairs = [
    [5, 4],
    [5, 3],
    [4, 2],
    [6, 3],
    [7, 5],
    [3, 2],
    [6, 4],
  ];
  const [M, m] = pairs[randInt(0, pairs.length - 1)];
  const vertical = Math.random() < 0.35;
  return { a: vertical ? m : M, b: vertical ? M : m };
}

function EquationChallenge({ mode, seed, revealed, setRevealed, next }: { mode: 'equacao' | 'focos'; seed: number; revealed: boolean; setRevealed: (v: boolean) => void; next: () => void }) {
  const el = useMemo(() => randomEllipse(), [seed]);
  const E = ellipseInfo(el.a, el.b);
  const pt = (p: { x: number; y: number }) => `(${fmt(p.x)},\\ ${fmt(p.y)})`;

  return (
    <div className="flex h-full w-full max-w-4xl flex-col">
      <h3 className="text-2xl font-bold">{mode === 'equacao' ? 'Qual é a equação?' : 'Onde estão os focos?'}</h3>
      <div className="mt-3 min-h-0 flex-1">
        {mode === 'equacao' || revealed ? (
          <Figure a={el.a} b={el.b} foci={revealed} />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">
            <Tex block>{reducedEquationTex(el.a, el.b, 0, 0)}</Tex>
          </div>
        )}
      </div>
      {revealed && (
        <div className="mt-3 flex flex-wrap items-center gap-6 border-l-4 border-black pl-4 text-lg">
          <Tex>{reducedEquationTex(el.a, el.b, 0, 0)}</Tex>
          <Tex>{`c = ${fmt(E.c)}`}</Tex>
          <Tex>{`F = ${pt(E.foci[0])},\\ ${pt(E.foci[1])}`}</Tex>
        </div>
      )}
      <div className="mt-4 flex gap-3">
        <button className="btn-default" onClick={() => setRevealed(true)} disabled={revealed}>
          Revelar
        </button>
        <button className="btn" onClick={next}>
          Nova elipse
        </button>
      </div>
    </div>
  );
}

export default function Challenge() {
  const [mode, setMode] = useState<Mode>('quiz');
  const [qi, setQi] = useState(0);
  const [seed, setSeed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [teams, setTeams] = useState([0, 0, 0]);
  const round = `${mode}-${qi}-${seed}`;
  const { time, running, setRunning } = useTimer(30, [round]);

  useEffect(() => setRevealed(false), [round]);
  useEffect(() => {
    if (time === 0) setRevealed(true);
  }, [time]);

  const MODES: [Mode, string][] = [
    ['quiz', 'Quiz'],
    ['equacao', 'Equação'],
    ['focos', 'Focos'],
  ];

  return (
    <Stage
      controls={
        <>
          <div className="flex">
            {MODES.map(([m, l], i) => (
              <button key={m} onClick={() => setMode(m)} className={`btn flex-1 px-2 ${mode === m ? 'on' : ''} ${i ? '-ml-px' : ''}`}>
                {l}
              </button>
            ))}
          </div>
          <Readout label="tempo" invert={time <= 5}>
            {String(time).padStart(2, '0')} s
          </Readout>
          <button className="btn" onClick={() => setRunning(!running)} disabled={time === 0}>
            {running ? 'Pausar' : 'Cronômetro'}
          </button>
          <div className="flex flex-col gap-2 border-t border-black pt-4">
            <span className="label">Placar</span>
            {teams.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="os text-sm font-bold">Equipe {i + 1}</span>
                <div className="flex items-center gap-2">
                  <button className="btn h-7 w-7 p-0" onClick={() => setTeams(teams.map((v, j) => (j === i ? Math.max(0, v - 1) : v)))}>
                    −
                  </button>
                  <span className="os w-6 text-center text-lg font-bold">{p}</span>
                  <button className="btn h-7 w-7 p-0" onClick={() => setTeams(teams.map((v, j) => (j === i ? v + 1 : v)))}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      }
    >
      {mode === 'quiz' ? (
        <Quiz i={qi} setI={setQi} revealed={revealed} setRevealed={setRevealed} />
      ) : (
        <EquationChallenge key={mode} mode={mode} seed={seed} revealed={revealed} setRevealed={setRevealed} next={() => setSeed((s) => s + 1)} />
      )}
    </Stage>
  );
}
