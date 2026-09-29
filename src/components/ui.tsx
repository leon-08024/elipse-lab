import { createContext, useContext, useMemo, type ReactNode } from 'react';
import katex from 'katex';

/* ---------- Contexto "Avançado" (rodapé da janela) ---------- */
export const AdvancedContext = createContext(false);
export const useAdvanced = () => useContext(AdvancedContext);

/** Conteúdo extra, só aparece com "Avançado" aberto. */
export function More({ children }: { children: ReactNode }) {
  const open = useAdvanced();
  if (!open) return null;
  return <div className="mt-6 border-t border-black pt-5">{children}</div>;
}

/* ---------- Layout de uma seção: palco + coluna de controles ---------- */
export function Stage({ children, controls }: { children: ReactNode; controls?: ReactNode }) {
  return (
    <div className={`grid gap-6 ${controls ? 'lg:grid-cols-[minmax(0,1fr)_236px]' : ''}`}>
      <div className="relative flex h-[calc(100vh-258px)] min-h-[380px] items-center justify-center">{children}</div>
      {controls && <div className="flex flex-col gap-5">{controls}</div>}
    </div>
  );
}

/* ---------- Primitivas ---------- */
export function Tex({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: false }),
    [children, block],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

const num = (v: number, d: number) => v.toFixed(d).replace('.', ',');

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  digits = 1,
  suffix = '',
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  digits?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="label mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-normal">
          {num(value, digits)}
          {suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Checkbox({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="label flex items-center gap-2.5 text-left">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-black bg-white">
        {checked && (
          <svg viewBox="0 0 12 10" className="crisp h-3 w-3.5">
            <path d="M0 5h2v1h1v1h1v1h1v-2h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h2v2h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-1h-1z" />
          </svg>
        )}
      </span>
      <span className="font-normal">{label}</span>
    </button>
  );
}

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className="label flex items-center gap-2.5 text-left font-normal">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black bg-white">
            {value === o.value && <span className="h-2 w-2 rounded-full bg-black" />}
          </span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ label, value, min, max, step = 1, onChange }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const tri = (up: boolean) => (
    <svg viewBox="0 0 8 5" className="crisp h-[5px] w-2">
      <path d={up ? 'M4 0L8 5H0z' : 'M0 0h8L4 5z'} />
    </svg>
  );
  return (
    <div className="flex items-center justify-between">
      <span className="label">{label}</span>
      <div className="flex">
        <div className="os flex h-6 w-12 items-center justify-center border border-black bg-white text-sm">{value}</div>
        <div className="-ml-px flex flex-col">
          <button type="button" className="flex h-3 w-6 items-center justify-center border border-black bg-white active:bg-black active:[&_path]:fill-white" onClick={() => onChange(Math.min(max, value + step))}>
            {tri(true)}
          </button>
          <button type="button" className="-mt-px flex h-3 w-6 items-center justify-center border border-black bg-white active:bg-black active:[&_path]:fill-white" onClick={() => onChange(Math.max(min, value - step))}>
            {tri(false)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Leitura principal (número/fórmula em destaque). */
export function Readout({ label, children, invert = false }: { label?: ReactNode; children: ReactNode; invert?: boolean }) {
  return (
    <div className={`rounded border border-black px-3 py-2 ${invert ? 'bg-black text-white' : 'bg-white'}`}>
      {label && <div className="os text-xs">{label}</div>}
      <div className="os text-xl font-bold leading-tight">{children}</div>
    </div>
  );
}

/** Tabela simples chave → valor para o modo Avançado. */
export function Facts({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 border-b border-dotted border-black py-1">
          <span className="os text-sm">{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-2xl text-[15px] leading-relaxed">{children}</p>;
}
