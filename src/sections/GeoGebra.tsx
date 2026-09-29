import { useEffect, useRef, useState } from 'react';
import { Callout, Panel, SectionHeader } from '../components/ui';

declare global {
  interface Window {
    GGBApplet?: new (params: Record<string, unknown>, html5NoWebSimple?: boolean) => { inject: (id: string) => void };
  }
}

interface GGBApi {
  evalCommand: (cmd: string) => boolean;
  setColor: (obj: string, r: number, g: number, b: number) => void;
  setLineThickness: (obj: string, t: number) => void;
  setCoordSystem: (xmin: number, xmax: number, ymin: number, ymax: number) => void;
}

// Construção da elipse — os mesmos comandos podem ser digitados na Entrada do GeoGebra.
export const GGB_COMMANDS = [
  'a = Slider(1, 8, 0.1)',
  'SetValue(a, 5)',
  'b = Slider(0.5, 7, 0.1)',
  'SetValue(b, 3)',
  'SetVisibleInView(a, 1, true)',
  'SetVisibleInView(b, 1, true)',
  'c = sqrt(abs(a^2 - b^2))',
  'exc = c / Max(a, b)',
  'elipse: x^2 / a^2 + y^2 / b^2 = 1',
  'F_1 = If(a >= b, (-c, 0), (0, -c))',
  'F_2 = If(a >= b, (c, 0), (0, c))',
  'A_1 = (-a, 0)',
  'A_2 = (a, 0)',
  'B_1 = (0, -b)',
  'B_2 = (0, b)',
  'P = Point(elipse)',
  'd_1 = Segment(P, F_1)',
  'd_2 = Segment(P, F_2)',
  'soma = d_1 + d_2',
];

const STYLE: [string, [number, number, number], number?][] = [
  ['elipse', [52, 211, 153], 9],
  ['F_1', [244, 114, 182]],
  ['F_2', [244, 114, 182]],
  ['A_1', [34, 211, 238]],
  ['A_2', [34, 211, 238]],
  ['B_1', [167, 139, 250]],
  ['B_2', [167, 139, 250]],
  ['d_1', [236, 72, 153], 6],
  ['d_2', [202, 138, 4], 6],
  ['P', [15, 23, 42]],
];

export default function GeoGebra() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled || !window.GGBApplet || !holder.current) return;
      const width = holder.current.clientWidth;
      const applet = new window.GGBApplet(
        {
          appName: 'classic',
          width,
          height: 600,
          showToolBar: true,
          showAlgebraInput: true,
          showMenuBar: false,
          showResetIcon: true,
          enableShiftDragZoom: true,
          language: 'pt',
          perspective: 'AG',
          appletOnLoad: (api: GGBApi) => {
            GGB_COMMANDS.forEach((c) => api.evalCommand(c));
            STYLE.forEach(([obj, [r, g, b], t]) => {
              api.setColor(obj, r, g, b);
              if (t) api.setLineThickness(obj, t);
            });
            api.setCoordSystem(-9, 9, -6, 6);
            if (!cancelled) setStatus('ready');
          },
        },
        true,
      );
      applet.inject('ggb-element');
    };

    if (window.GGBApplet) build();
    else {
      const s = document.createElement('script');
      s.src = 'https://www.geogebra.org/apps/deployggb.js';
      s.async = true;
      s.onload = build;
      s.onerror = () => !cancelled && setStatus('error');
      document.body.appendChild(s);
    }
    const timeout = setTimeout(() => !cancelled && setStatus((st) => (st === 'loading' ? 'error' : st)), 25000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(GGB_COMMANDS.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <SectionHeader kicker="Etapa 3 · Ferramenta digital oficial" title="Elipse no GeoGebra">
        A mesma construção feita no GeoGebra, com controles deslizantes para <strong>a</strong> e <strong>b</strong>. Arraste o ponto{' '}
        <strong>P</strong> sobre a elipse e observe o valor de <strong>soma</strong> na janela de álgebra: é sempre <strong>2a</strong>.
      </SectionHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="overflow-hidden bg-white p-0">
          <div ref={holder} className="relative min-h-[600px] w-full">
            <div id="ggb-element" />
            {status !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-900 text-slate-300">
                {status === 'loading' ? (
                  'Carregando o GeoGebra…'
                ) : (
                  <div className="text-center">
                    Não foi possível carregar o GeoGebra aqui.
                    <br />
                    <a className="text-cyan-300 underline" href="https://www.geogebra.org/classic" target="_blank" rel="noreferrer">
                      Abrir o GeoGebra Classic
                    </a>{' '}
                    e colar os comandos ao lado.
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Passo a passo (campo Entrada)</div>
              <button className="btn px-3 py-1 text-xs" onClick={copy}>
                {copied ? '✓ Copiado' : '⧉ Copiar'}
              </button>
            </div>
            <ol className="max-h-[440px] space-y-1 overflow-y-auto font-mono text-xs">
              {GGB_COMMANDS.map((c, i) => (
                <li key={i} className="flex gap-2 rounded-md bg-black/30 px-2 py-1">
                  <span className="text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-slate-200">{c}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <Callout icon="🔗" title="Três representações, uma elipse" tone="cyan">
            Barbante e alfinetes (físico) ↔ Método do Jardineiro (animação) ↔ GeoGebra (software). Nos três, os focos são fixos e{' '}
            <strong>d₁ + d₂ = 2a</strong>.
          </Callout>
        </div>
      </div>
    </div>
  );
}
