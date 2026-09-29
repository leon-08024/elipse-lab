import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Panel, SectionHeader, Tex } from '../components/ui';
import { Dot, Plane2D, ellipsePath, makeView } from '../components/Plane2D';
import { QUIZ } from '../data/quiz';
import { ellipseInfo, fmt, reducedEquationTex } from '../math/ellipse';

type Mode = 'quiz' | 'equacao' | 'focos';
const TEAM_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#34d399'];

/** Texto com trechos $...$ em LaTeX. */
function Rich({ text }: { text: string }) {
  const parts = text.split('$');
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <Tex key={i}>{p}</Tex> : <span key={i}>{p}</span>))}
    </>
  );
}

function Figure({ a, b, h = 0, k = 0, foci = false, size = 'md' }: { a: number; b: number; h?: number; k?: number; foci?: boolean; size?: 'md' | 'lg' }) {
  const view = makeView(size === 'lg' ? 720 : 520, size === 'lg' ? 460 : 320, -9, 9);
  const E = ellipseInfo(a, b, h, k);
  return (
    <Plane2D view={view}>
      <path d={ellipsePath(view, a, b, h, k)} fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth={3.5} filter="url(#glow)" />
      <Dot view={view} x={h} y={k} color="#34d399" r={3.5} />
      {foci && !E.isCircle && (
        <>
          <Dot view={view} {...E.foci[0]} color="#f472b6" label="F₁" dx={-10} dy={22} />
          <Dot view={view} {...E.foci[1]} color="#f472b6" label="F₂" dx={-10} dy={22} />
        </>
      )}
    </Plane2D>
  );
}

function Scoreboard({ teams, setTeams }: { teams: { name: string; pts: number }[]; setTeams: (t: { name: string; pts: number }[]) => void }) {
  const upd = (i: number, patch: Partial<{ name: string; pts: number }>) => setTeams(teams.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const max = Math.max(1, ...teams.map((t) => t.pts));
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">🏆 Placar</span>
        <div className="flex gap-1">
          {teams.length < 4 && (
            <button className="btn px-2 py-1 text-xs" onClick={() => setTeams([...teams, { name: `Equipe ${teams.length + 1}`, pts: 0 }])}>
              + equipe
            </button>
          )}
          <button className="btn px-2 py-1 text-xs" onClick={() => setTeams(teams.map((t) => ({ ...t, pts: 0 })))}>
            zerar
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {teams.map((t, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-2">
            <div className="flex items-center gap-2">
              <input
                value={t.name}
                onChange={(e) => upd(i, { name: e.target.value })}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                style={{ color: TEAM_COLORS[i] }}
              />
              <button className="btn h-7 w-7 p-0" onClick={() => upd(i, { pts: Math.max(0, t.pts - 1) })}>
                −
              </button>
              <motion.span key={t.pts} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="w-8 text-center font-mono text-lg">
                {t.pts}
              </motion.span>
              <button className="btn h-7 w-7 p-0" onClick={() => upd(i, { pts: t.pts + 1 })}>
                +
              </button>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full transition-all" style={{ width: `${(t.pts / max) * 100}%`, background: TEAM_COLORS[i] }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Quiz() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [time, setTime] = useState(30);
  const [running, setRunning] = useState(false);
  const q = QUIZ[i];

  useEffect(() => {
    if (!running || revealed) return;
    if (time <= 0) {
      setRevealed(true);
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, time, revealed]);

  const go = (n: number) => {
    setI(n);
    setPicked(null);
    setRevealed(false);
    setTime(30);
    setRunning(true);
  };

  return (
    <Panel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="chip">
          Pergunta {i + 1} / {QUIZ.length}
        </span>
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11">
            <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
              <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke={time <= 5 ? '#fb7185' : '#22d3ee'}
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 19}
                strokeDashoffset={2 * Math.PI * 19 * (1 - time / 30)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm">{time}</span>
          </div>
          <button className="btn px-3 py-1.5 text-xs" onClick={() => setRunning((r) => !r)} disabled={revealed}>
            {running ? '❚❚' : '▶ cronômetro'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <h3 className="font-display text-2xl font-bold leading-snug md:text-3xl">
            <Rich text={q.q} />
          </h3>
          {q.figure && (
            <div className="mx-auto mt-4 max-w-md">
              <Figure {...q.figure} />
            </div>
          )}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {q.options.map((o, j) => {
              const isAns = j === q.answer;
              const state = revealed ? (isAns ? 'right' : picked === j ? 'wrong' : 'dim') : picked === j ? 'picked' : 'idle';
              const cls = {
                idle: 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                picked: 'border-cyan-300/60 bg-cyan-300/10',
                right: 'border-emerald-400/70 bg-emerald-400/15',
                wrong: 'border-rose-400/70 bg-rose-400/15',
                dim: 'border-white/5 opacity-50',
              }[state];
              return (
                <motion.button
                  key={j}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !revealed && setPicked(j)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-lg transition ${cls}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30 font-mono text-sm">
                    {'ABCD'[j]}
                  </span>
                  <Rich text={o} />
                  {state === 'right' && <span className="ml-auto text-emerald-300">✓</span>}
                  {state === 'wrong' && <span className="ml-auto text-rose-300">✗</span>}
                </motion.button>
              );
            })}
          </div>
          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-slate-200">
              💡 <Rich text={q.explain} />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn" onClick={() => go(Math.max(0, i - 1))} disabled={i === 0}>
          ← Anterior
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            setRevealed(true);
            setRunning(false);
          }}
          disabled={revealed}
        >
          Revelar resposta
        </button>
        <button className="btn" onClick={() => go(Math.min(QUIZ.length - 1, i + 1))} disabled={i === QUIZ.length - 1}>
          Próxima →
        </button>
      </div>
    </Panel>
  );
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Sorteia elipses com números "bonitos" (ternas pitagóricas quando possível). */
function randomEllipse(shift: boolean) {
  const triples = [
    [5, 4, 3],
    [5, 3, 4],
    [4, 2, 0],
    [6, 3, 0],
    [7, 5, 0],
    [3, 2, 0],
    [6, 4, 0],
    [2, 1, 0],
  ];
  const [M, m] = triples[randInt(0, triples.length - 1)];
  const vertical = Math.random() < 0.35;
  const a = vertical ? m : M;
  const b = vertical ? M : m;
  const maxShift = Math.max(0, 8 - a);
  return { a, b, h: shift ? randInt(-Math.min(3, maxShift), Math.min(3, maxShift)) : 0, k: shift && b <= 4 ? randInt(-1, 1) : 0 };
}

function EquationChallenge({ mode }: { mode: 'equacao' | 'focos' }) {
  const [shift, setShift] = useState(false);
  const [seed, setSeed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const el = useMemo(() => randomEllipse(shift), [seed, shift]);
  const E = ellipseInfo(el.a, el.b, el.h, el.k);
  const next = () => {
    setSeed((s) => s + 1);
    setRevealed(false);
  };

  const pt = (p: { x: number; y: number }) => `(${fmt(p.x)},\\ ${fmt(p.y)})`;

  return (
    <Panel className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="chip">{mode === 'equacao' ? 'Olhe o gráfico → escreva a equação' : 'Olhe a equação → encontre c, os focos e e'}</span>
        <label className="chip cursor-pointer">
          <input type="checkbox" checked={shift} onChange={(e) => {
              setShift(e.target.checked);
              next();
            }} className="accent-cyan-400" />
          centro fora da origem (nível difícil)
        </label>
      </div>

      {mode === 'equacao' ? (
        <>
          <h3 className="font-display text-2xl font-bold">Qual é a equação reduzida desta elipse?</h3>
          <div className="mx-auto mt-4 max-w-3xl">
            <Figure a={el.a} b={el.b} h={el.h} k={el.k} foci={revealed} size="lg" />
          </div>
        </>
      ) : (
        <>
          <h3 className="font-display text-2xl font-bold">Encontre c, as coordenadas dos focos e a excentricidade:</h3>
          <div className="glass mx-auto mt-6 w-fit px-10 py-6 text-2xl">
            <Tex block>{reducedEquationTex(el.a, el.b, el.h, el.k)}</Tex>
          </div>
          {revealed && (
            <div className="mx-auto mt-4 max-w-3xl">
              <Figure a={el.a} b={el.b} h={el.h} k={el.k} foci size="lg" />
            </div>
          )}
        </>
      )}

      {revealed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4">
            <div className="mb-1 text-xs uppercase tracking-wider text-emerald-300">Equação</div>
            <Tex block>{reducedEquationTex(el.a, el.b, el.h, el.k)}</Tex>
          </div>
          <div className="rounded-2xl border border-pink-400/30 bg-pink-400/5 p-4 text-sm">
            <div className="mb-1 text-xs uppercase tracking-wider text-pink-300">Elementos</div>
            <div>
              <Tex>{`c = \\sqrt{${fmt(E.semiMajor ** 2)} - ${fmt(E.semiMinor ** 2)}} = ${fmt(E.c)}`}</Tex>
            </div>
            <div className="mt-1">
              <Tex>{E.isCircle ? '\\text{Focos no centro (circunferência)}' : `F_1 = ${pt(E.foci[0])},\\quad F_2 = ${pt(E.foci[1])}`}</Tex>
            </div>
            <div className="mt-1">
              <Tex>{`e = \\frac{c}{${fmt(E.semiMajor)}} \\approx ${fmt(E.e, 2)}`}</Tex>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex gap-2">
        <button className="btn-primary" onClick={() => setRevealed(true)} disabled={revealed}>
          Revelar
        </button>
        <button className="btn" onClick={next}>
          🎲 Nova elipse
        </button>
      </div>
    </Panel>
  );
}

export default function Challenge() {
  const [mode, setMode] = useState<Mode>('quiz');
  const [teams, setTeams] = useState([
    { name: 'Equipe 1', pts: 0 },
    { name: 'Equipe 2', pts: 0 },
  ]);

  return (
    <div>
      <SectionHeader kicker="Etapa 4 · Atividade com a turma (5–10 min)" title="Desafio da Elipse">
        Dividam a turma em equipes. Cada pergunta vale 1 ponto — quem responder primeiro (e certo) pontua. Use o cronômetro para
        controlar o tempo.
      </SectionHeader>
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ['quiz', '❓ Quiz'],
            ['equacao', '📈 Descubra a equação'],
            ['focos', '🎯 Encontre os focos'],
          ] as [Mode, string][]
        ).map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)} className={mode === m ? 'btn-primary' : 'btn'}>
            {l}
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          {mode === 'quiz' && <Quiz />}
          {mode !== 'quiz' && <EquationChallenge key={mode} mode={mode} />}
        </div>
        <Scoreboard teams={teams} setTeams={setTeams} />
      </div>
    </div>
  );
}
