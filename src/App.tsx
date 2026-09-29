import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './sections/Home';
import Gardener from './sections/Gardener';
import Lab from './sections/Lab';
import Reflection from './sections/Reflection';
import GeoGebra from './sections/GeoGebra';
import Challenge from './sections/Challenge';

// As cenas 3D são carregadas sob demanda (Three.js é pesado).
const ConeSection = lazy(() => import('./sections/ConeSection'));
const Orbits = lazy(() => import('./sections/Orbits'));

import { SECTIONS, type SectionId } from './nav';

const readHash = (): SectionId => {
  const h = window.location.hash.replace('#', '') as SectionId;
  return SECTIONS.some((s) => s.id === h) ? h : 'inicio';
};

function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-slate-400">
      <div className="h-10 w-16 animate-spin rounded-[50%] border-2 border-cyan-400/20 border-t-cyan-300" />
    </div>
  );
}

export default function App() {
  const [section, setSection] = useState<SectionId>(readHash);

  const go = useCallback((id: SectionId) => {
    window.location.hash = id;
  }, []);

  useEffect(() => {
    const onHash = () => setSection(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Modo apresentação: ← / → (ou PageUp / PageDown do passador de slides) trocam de seção; F = tela cheia.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const i = SECTIONS.findIndex((s) => s.id === section);
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(SECTIONS[Math.min(SECTIONS.length - 1, i + 1)].id);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(SECTIONS[Math.max(0, i - 1)].id);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [section, go]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => go('inicio')} className="flex shrink-0 items-center gap-2">
            <svg viewBox="0 0 40 24" className="h-6 w-10">
              <ellipse cx="20" cy="12" rx="18" ry="10" fill="none" stroke="#34d399" strokeWidth="2.5" />
              <circle cx="7" cy="12" r="2.5" fill="#f472b6" />
              <circle cx="33" cy="12" r="2.5" fill="#f472b6" />
            </svg>
            <span className="font-display text-lg font-bold tracking-tight">
              Elipse<span className="text-cyan-300">Lab</span>
            </span>
          </button>
          <div className="no-scrollbar ml-2 flex flex-1 gap-1 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => go(s.id)}
                className={`relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  section === s.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {section === s.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg border border-cyan-300/30 bg-cyan-300/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  <span className="mr-1.5 opacity-70">{s.icon}</span>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
          <button onClick={toggleFullscreen} className="btn hidden shrink-0 px-3 py-1.5 md:inline-flex" title="Tela cheia (F)">
            ⛶
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Suspense fallback={<Loading />}>
              {section === 'inicio' && <Home go={go} />}
              {section === 'cone' && <ConeSection />}
              {section === 'jardineiro' && <Gardener />}
              {section === 'laboratorio' && <Lab />}
              {section === 'refletora' && <Reflection />}
              {section === 'orbitas' && <Orbits />}
              {section === 'geogebra' && <GeoGebra />}
              {section === 'desafio' && <Challenge />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        Use ← → para navegar entre as seções · F para tela cheia
      </footer>
    </div>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}
