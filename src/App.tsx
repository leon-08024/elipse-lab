import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Home from './sections/Home';
import Gardener from './sections/Gardener';
import Lab from './sections/Lab';
import Reflection from './sections/Reflection';
import GeoGebra from './sections/GeoGebra';
import Challenge from './sections/Challenge';
import { AdvancedContext } from './components/ui';
import { EllipseLogo, SectionIcon, Tri } from './components/Icons';
import { REPO_URL, SECTIONS, type SectionId } from './nav';

const ConeSection = lazy(() => import('./sections/ConeSection'));
const Orbits = lazy(() => import('./sections/Orbits'));

const readHash = (): SectionId => {
  const h = window.location.hash.replace('#', '') as SectionId;
  return SECTIONS.some((s) => s.id === h) ? h : 'inicio';
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
    <div className="h-full bg-black">
      {/* Moldura (bezel) */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-bezel p-4">
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          {/* Barra de menu */}
          <header className="os flex h-8 shrink-0 items-center gap-5 border-b border-black bg-white px-4 text-[14px] font-bold">
            <button onClick={() => go('inicio')} className="flex items-center gap-2" title="Início">
              <EllipseLogo />
              Elipse Lab
            </button>
            <button onClick={() => step(-1)} className="flex items-center gap-1.5 hover:underline" disabled={idx === 0}>
              <Tri dir="l" /> Voltar
            </button>
            <button onClick={() => step(1)} className="flex items-center gap-1.5 hover:underline" disabled={idx === SECTIONS.length - 1}>
              Avançar <Tri dir="r" />
            </button>
            <button onClick={() => setAdvanced((v) => !v)} className="hover:underline">
              <span className={advanced ? 'bg-black px-1 text-white' : 'px-1'}>Avançado</span>
            </button>
            <button onClick={toggleFullscreen} className="hover:underline">
              Tela cheia
            </button>
            <div className="ml-auto flex items-center gap-2" title="status">
              <span className="font-normal">
                {idx + 1}/{SECTIONS.length}
              </span>
              <span className="h-3.5 w-3.5 rounded-full bg-signal" />
              <span className="h-3.5 w-3.5 rounded-full bg-link" />
              <span className="h-3.5 w-3.5 rounded-full bg-black" />
            </div>
          </header>

          {/* Mesa (desktop) pontilhada */}
          <main className="dither relative min-h-0 flex-1 overflow-hidden">
            {/* ícones da mesa */}
            <div className="absolute right-5 top-6 hidden flex-col items-center gap-6 xl:flex">
              <DeskIcon icon="fullscreen" label="Tela cheia" onClick={toggleFullscreen} />
              <DeskIcon icon="ggb" label="GeoGebra" href="https://www.geogebra.org/classic" />
              <DeskIcon icon="code" label="Código" href={REPO_URL} />
            </div>

            {/* janela inativa atrás */}
            <div className="window-geom window-back pointer-events-none absolute hidden rounded-lg border border-black bg-white md:block">
              <div className="os flex h-8 items-center justify-center border-b border-black text-sm">Hipérbole</div>
            </div>

            {/* janela principal */}
            <section className="window-geom absolute flex flex-col overflow-hidden rounded-lg border border-black bg-white">
              {/* barra de título */}
              <div className="stripes relative flex h-8 shrink-0 items-center border-b border-black px-2">
                <button
                  onClick={() => go('inicio')}
                  className="relative z-10 ml-1 h-4 w-4 border border-black bg-white outline outline-2 outline-white active:bg-black"
                  title="Fechar (voltar ao início)"
                />
                <div className="os absolute left-1/2 -translate-x-1/2 bg-white px-3 text-[15px] font-bold">{current.title}</div>
              </div>

              <div className="flex min-h-0 flex-1">
                {/* trilho de categorias */}
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
                        {section === 'inicio' && <Home go={go} />}
                        {section === 'cone' && <ConeSection />}
                        {section === 'jardineiro' && <Gardener />}
                        {section === 'laboratorio' && <Lab />}
                        {section === 'refletora' && <Reflection />}
                        {section === 'orbitas' && <Orbits />}
                        {section === 'geogebra' && <GeoGebra />}
                        {section === 'desafio' && <Challenge />}
                      </div>
                    </Suspense>
                  </AdvancedContext.Provider>
                </div>
              </div>

              {/* rodapé */}
              <footer className="flex h-12 shrink-0 items-center gap-3 border-t border-black px-4">
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
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function DeskIcon({ icon, label, onClick, href }: { icon: 'fullscreen' | 'ggb' | 'code'; label: string; onClick?: () => void; href?: string }) {
  const body = (
    <>
      <span className="flex h-10 w-10 items-center justify-center bg-white">
        <SectionIcon id={icon} className="h-8 w-8" />
      </span>
      <span className={`os border border-black bg-white px-1.5 text-[12px] font-bold ${href ? 'text-link' : ''}`}>{label}</span>
    </>
  );
  const cls = 'flex w-20 flex-col items-center gap-1 active:[&>span]:invert';
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  );
}
