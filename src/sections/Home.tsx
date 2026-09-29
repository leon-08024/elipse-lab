import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SECTIONS, type SectionId } from '../nav';
import { GRUPO } from '../data/grupo';
import { Tex } from '../components/ui';

const DESCR: Record<SectionId, string> = {
  inicio: '',
  cone: 'Corte um cone com um plano e veja a elipse nascer — com as esferas de Dandelin mostrando os focos.',
  jardineiro: 'O método do barbante, animado: a soma das distâncias aos focos nunca muda.',
  laboratorio: 'Sliders para a, b e o centro. Focos, vértices, eixos, diretrizes e equações ao vivo.',
  refletora: 'Todo raio que sai de um foco reflete e passa pelo outro foco.',
  orbitas: 'Planetas e o cometa Halley em órbitas elípticas reais, com o Sol em um dos focos.',
  geogebra: 'A mesma elipse construída no GeoGebra, com controles deslizantes.',
  desafio: 'Quiz e desafio da equação para a turma, com placar por equipes.',
};

/** Elipse animada de fundo: um ponto percorre a curva mostrando d₁ + d₂ = 2a. */
function HeroEllipse() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(((now - start) / 1000) * 0.6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const a = 260, b = 160, c = Math.sqrt(a * a - b * b);
  const cx = 300, cy = 200;
  const px = cx + a * Math.cos(t), py = cy - b * Math.sin(t);
  const d1 = Math.hypot(px - (cx - c), py - cy);
  const d2 = Math.hypot(px - (cx + c), py - cy);

  return (
    <svg viewBox="0 0 600 400" className="w-full">
      <defs>
        <linearGradient id="hg" x1="0" x2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#34d399" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="hglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={a}
        ry={b}
        fill="none"
        stroke="url(#hg)"
        strokeWidth={4}
        filter="url(#hglow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: 'easeInOut' }}
      />
      <line x1={cx - a} x2={cx + a} y1={cy} y2={cy} stroke="#22d3ee" strokeOpacity={0.25} strokeDasharray="4 6" />
      <line x1={cx} x2={cx} y1={cy - b} y2={cy + b} stroke="#a78bfa" strokeOpacity={0.25} strokeDasharray="4 6" />
      <line x1={cx - c} y1={cy} x2={px} y2={py} stroke="#f472b6" strokeWidth={2} />
      <line x1={cx + c} y1={cy} x2={px} y2={py} stroke="#facc15" strokeWidth={2} />
      <circle cx={cx - c} cy={cy} r={7} fill="#f472b6" filter="url(#hglow)" />
      <circle cx={cx + c} cy={cy} r={7} fill="#f472b6" filter="url(#hglow)" />
      <circle cx={px} cy={py} r={8} fill="#fff" filter="url(#hglow)" />
      <text x={cx - c} y={cy + 26} fill="#f472b6" fontSize={16} textAnchor="middle">F₁</text>
      <text x={cx + c} y={cy + 26} fill="#f472b6" fontSize={16} textAnchor="middle">F₂</text>
      <text x={px + 12} y={py - 12} fill="#fff" fontSize={16}>P</text>
      <text x={cx} y={388} fill="#cbd5e1" fontSize={15} textAnchor="middle">
        d₁ + d₂ = {Math.round(d1)} + {Math.round(d2)} = {Math.round(d1 + d2)} = 2a
      </text>
    </svg>
  );
}

export default function Home({ go }: { go: (id: SectionId) => void }) {
  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chip mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {GRUPO.subtitulo}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-6xl font-bold leading-[0.95] tracking-tight md:text-8xl"
          >
            A{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-violet-300 bg-clip-text text-transparent">
              {GRUPO.titulo}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
          >
            <strong className="text-white">Elipse</strong> é o lugar geométrico dos pontos <em>P</em> do plano cuja{' '}
            <strong className="text-yellow-300">soma das distâncias</strong> a dois pontos fixos <span className="text-pink-400">F₁</span> e{' '}
            <span className="text-pink-400">F₂</span> (os focos) é constante e igual a <span className="text-cyan-300">2a</span>.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass mt-6 inline-block px-6 py-4"
          >
            <Tex block>{'d(P,F_1) + d(P,F_2) = 2a \\qquad\\Longleftrightarrow\\qquad \\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1'}</Tex>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary px-5 py-3 text-base" onClick={() => go('cone')}>
              Começar pela origem →
            </button>
            <button className="btn px-5 py-3 text-base" onClick={() => go('laboratorio')}>
              Ir ao laboratório
            </button>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="glass p-4 shadow-glow">
          <HeroEllipse />
        </motion.div>
      </section>

      {/* ELEMENTOS */}
      <section>
        <h2 className="mb-5 font-display text-2xl font-bold">Elementos principais</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { c: '#f472b6', t: 'Focos F₁ e F₂', d: 'Os dois pontos fixos. Distância focal = 2c.' },
            { c: '#22d3ee', t: 'Eixo maior (2a)', d: 'Segmento A₁A₂ que passa pelos focos. Vértices A₁ e A₂.' },
            { c: '#a78bfa', t: 'Eixo menor (2b)', d: 'Segmento B₁B₂ perpendicular ao eixo maior, pelo centro.' },
            { c: '#34d399', t: 'Centro O', d: 'Ponto médio dos focos e dos dois eixos.' },
          ].map((x) => (
            <div key={x.t} className="glass p-4">
              <div className="mb-2 h-1 w-10 rounded-full" style={{ background: x.c, boxShadow: `0 0 12px ${x.c}` }} />
              <div className="font-semibold text-white">{x.t}</div>
              <div className="mt-1 text-sm text-slate-400">{x.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="glass p-4">
            <div className="text-sm text-slate-400">Relação notável (Pitágoras no triângulo B₁OF₂)</div>
            <Tex block>{'a^2 = b^2 + c^2'}</Tex>
          </div>
          <div className="glass p-4">
            <div className="text-sm text-slate-400">Excentricidade — mede o "achatamento"</div>
            <Tex block>{'e = \\frac{c}{a}, \\quad 0 \\le e < 1'}</Tex>
          </div>
          <div className="glass p-4">
            <div className="text-sm text-slate-400">Diretrizes — razão foco/diretriz constante</div>
            <Tex block>{'x = \\pm\\frac{a^2}{c}, \\quad \\frac{d(P,F)}{d(P,r)} = e'}</Tex>
          </div>
        </div>
      </section>

      {/* ROTEIRO */}
      <section>
        <h2 className="mb-5 font-display text-2xl font-bold">Roteiro da apresentação</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.filter((s) => s.id !== 'inicio').map((s, i) => (
            <motion.button
              key={s.id}
              whileHover={{ y: -4 }}
              onClick={() => go(s.id)}
              className="glass group p-5 text-left transition hover:border-cyan-300/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className="font-mono text-xs text-slate-500">0{i + 1}</span>
              </div>
              <div className="mt-3 font-display text-lg font-bold text-white">{s.label}</div>
              <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-cyan-300/70">{s.etapa}</div>
              <div className="mt-2 text-sm text-slate-400">{DESCR[s.id]}</div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* GRUPO */}
      <section className="glass flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500">
            {GRUPO.escola} · {GRUPO.turma}
          </div>
          <div className="mt-1 font-display text-xl font-bold">Integrantes</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRUPO.integrantes.map((n) => (
            <span key={n} className="chip text-sm">
              {n}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
