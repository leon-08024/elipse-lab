import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lab from './sections/Lab';
import GeoGebra from './sections/GeoGebra';
import { AdvancedContext } from './components/ui';
import { SectionIcon } from './components/Icons';
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
  return <div className="os flex h-screen items-center justify-center text-sm">Carregando…</div>;
}

export default function App() {
  const [section, setSection] = useState<SectionId>(readHash);
  const [advanced, setAdvanced] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const idx = SECTIONS.findIndex((s) => s.id === section);

  const go = useCallback((id: SectionId) => {
    window.location.hash = id;
  }, []);
  const step = useCallback((d: number) => go(SECTIONS[Math.max(0, Math.min(SECTIONS.length - 1, idx + d))].id), [go, idx]);
  const toggleAdvanced = useCallback(() => setAdvanced((v) => !v), []);
  const adv = useMemo(() => ({ open: advanced, toggle: toggleAdvanced }), [advanced, toggleAdvanced]);

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
      if (e.key === 'a' || e.key === 'A') toggleAdvanced();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, toggleAdvanced]);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [section]);

  // Ao abrir "Avançado", rola até o conteúdo extra (abaixo do palco); ao fechar, volta ao topo.
  useEffect(() => {
    const pane = paneRef.current;
    if (pane) pane.scrollTo({ top: advanced ? pane.scrollHeight : 0, behavior: 'smooth' });
  }, [advanced]);

  return (
    <div className="flex h-full bg-white">
      {/* trilho de seções */}
      <nav className="os-scroll-none w-24 shrink-0 overflow-y-auto border-r border-black">
        {SECTIONS.map((s) => {
          const on = s.id === section;
          return (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              title={s.title}
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

      {/* palco + conteúdo avançado (rolagem só quando "Avançado" está aberto) */}
      <div ref={paneRef} className="os-scroll min-w-0 flex-1 overflow-y-auto">
        <AdvancedContext.Provider value={adv}>
          <Suspense fallback={<Loading />}>
            <div key={section}>
              {section === 'cone' && <ConeSection />}
              {section === 'laboratorio' && <Lab />}
              {section === 'orbitas' && <Orbits />}
              {section === 'geogebra' && <GeoGebra />}
            </div>
          </Suspense>
        </AdvancedContext.Provider>
      </div>
    </div>
  );
}
