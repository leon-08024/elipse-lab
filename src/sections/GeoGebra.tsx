import { useEffect, useRef, useState } from 'react';
import { More, Stage } from '../components/ui';

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

export const GGB_COMMANDS = [
  'a = Slider(1, 8, 0.1)',
  'SetValue(a, 5)',
  'b = Slider(0.5, 7, 0.1)',
  'SetValue(b, 3)',
  'SetVisibleInView(a, 1, true)',
  'SetVisibleInView(b, 1, true)',
  'c = sqrt(abs(a^2 - b^2))',
  'elipse: x^2 / a^2 + y^2 / b^2 = 1',
  'F_1 = If(a >= b, (-c, 0), (0, -c))',
  'F_2 = If(a >= b, (c, 0), (0, c))',
  'P = Point(elipse)',
  'd_1 = Segment(P, F_1)',
  'd_2 = Segment(P, F_2)',
  'soma = d_1 + d_2',
];

const THICK: [string, number][] = [
  ['elipse', 9],
  ['d_1', 5],
  ['d_2', 5],
];

export default function GeoGebra() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled || !window.GGBApplet || !holder.current) return;
      const { clientWidth, clientHeight } = holder.current;
      const applet = new window.GGBApplet(
        {
          appName: 'classic',
          width: clientWidth,
          height: clientHeight,
          showToolBar: false,
          showAlgebraInput: false,
          showMenuBar: false,
          enableShiftDragZoom: true,
          language: 'pt',
          perspective: 'AG',
          appletOnLoad: (api: GGBApi) => {
            GGB_COMMANDS.forEach((c) => api.evalCommand(c));
            ['elipse', 'F_1', 'F_2', 'P', 'd_1', 'd_2', 'a', 'b'].forEach((o) => api.setColor(o, 0, 0, 0));
            THICK.forEach(([o, t]) => api.setLineThickness(o, t));
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
    <>
      <Stage>
        <div ref={holder} className="frame relative h-full w-full overflow-hidden">
          <div id="ggb-element" />
          {status !== 'ready' && (
            <div className="os absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white text-sm">
              {status === 'loading' ? (
                'Carregando GeoGebra…'
              ) : (
                <>
                  <span>Sem conexão com o GeoGebra.</span>
                  <a className="text-link underline" href="https://www.geogebra.org/classic" target="_blank" rel="noreferrer">
                    geogebra.org/classic
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </Stage>

      <More>
        <div className="mb-3 flex items-center gap-3">
          <span className="label">Comandos (campo Entrada)</span>
          <button className="btn h-7 px-3" onClick={copy}>
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <ol className="os grid gap-x-8 text-sm sm:grid-cols-2">
          {GGB_COMMANDS.map((c, i) => (
            <li key={i} className="border-b border-dotted border-black py-0.5">
              {String(i + 1).padStart(2, '0')} {c}
            </li>
          ))}
        </ol>
      </More>
    </>
  );
}
