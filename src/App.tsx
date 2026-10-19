import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Lab from './sections/Lab';
import GeoGebra from './sections/GeoGebra';
import { AdvancedContext } from './components/ui';
import { SectionIcon, Tri } from './components/Icons';
import { SECTIONS, type SectionId } from './nav';

const ConeSection = lazy(() => import('./sections/ConeSection'));
const Orbits = lazy(() => import('./sections/Orbits'));

const readHash = (): SectionId => {
  const h = window.location.hash.replace('#', '') as SectionId;
  return SECTIONS.some((s) => s.id === h) ? h : SECTIONS[0].id;
};

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

function Loading() {
  return <div className="os flex h-full items-center justify-center text-sm">Carregando…</div>;
}

export default function App() {
  const [section, setSection] = useState<SectionId>(readHash);
  const [advanced, setAdvanced] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const paneRef = useRef<HTMLDivElement>(null);
  const idx = SECTIONS.findIndex((s) => s.id === section);
  const current = SECTIONS[idx];

  const go = useCallback((id: SectionId) => {
    window.location.hash = id;
  }, []);
  const step = useCallback((d: number) => go(SECTIONS[Math.max(0, Math.min(SECTIONS.length - 1, idx + d))].id), [go, idx]);

  useEffect(() => {
    const onHash = () => setSection(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') step(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') step(-1);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'a' || e.key === 'A') setAdvanced((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [section]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex min-h-0 flex-1">
        {/* trilho de seções */}
        <nav className="os-scroll-none w-24 shrink-0 overflow-y-auto border-r border-black">
          {SECTIONS.map((s) => {
            const on = s.id === section;
            return (
              <button
                key={s.id}
                onClick={() => go(s.id)}
                className={`flex w-full flex-col items-center gap-1 border-b border-black py-2.5 ${
                  on ? 'bg-black text-white [--icon-bg:#000]' : 'bg-white text-black hover:bg-black/5'
                }`}
              >
                <SectionIcon id={s.id} />
                <span className="os text-[12px] font-bold leading-none">{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* painel com rolagem */}
        <div ref={paneRef} className="os-scroll min-w-0 flex-1 overflow-y-auto p-6">
          <AdvancedContext.Provider value={advanced}>
            <Suspense fallback={<Loading />}>
              <div key={`${section}-${resetKey}`} className="h-full">
                {section === 'cone' && <ConeSection />}
                {section === 'laboratorio' && <Lab />}
                {section === 'orbitas' && <Orbits />}
                {section === 'geogebra' && <GeoGebra />}
              </div>
            </Suspense>
          </AdvancedContext.Provider>
        </div>
      </div>

      {/* rodapé */}
      <footer className="flex h-12 shrink-0 items-center gap-5 border-t border-black px-4">
        <span className="os text-[15px] font-bold">{current.title}</span>
        <button onClick={() => setAdvanced((v) => !v)} className="label flex items-center gap-2">
          <svg viewBox="0 0 10 10" className={`crisp h-2.5 w-2.5 transition-transform ${advanced ? 'rotate-90' : ''}`}>
            <path d="M2 0l6 5-6 5z" />
          </svg>
          Avançado
        </button>
        <div className="ml-auto flex items-center gap-3">
          <button className="btn" onClick={() => setResetKey((k) => k + 1)}>
            Reiniciar
          </button>
          <button className="btn" onClick={() => step(-1)} disabled={idx === 0}>
            <Tri dir="l" />
          </button>
          <button className="btn-default" onClick={() => step(1)} disabled={idx === SECTIONS.length - 1}>
            Próximo <Tri dir="r" />
          </button>
        </div>
      </footer>
    </div>
  );
}
