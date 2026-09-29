import { useMemo, type ReactNode } from 'react';
import katex from 'katex';

/** Renderiza LaTeX com KaTeX. */
export function Tex({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: false }),
    [children, block],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  color = '#22d3ee',
  suffix = '',
  digits = 1,
  hint,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  suffix?: string;
  digits?: number;
  hint?: ReactNode;
}) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="font-mono text-sm" style={{ color }}>
          {value.toFixed(digits).replace('.', ',')}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--c' as string]: color, ['--p' as string]: `${p}%` }}
      />
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  color = '#22d3ee',
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
        checked ? 'border-white/20 bg-white/10 text-slate-100' : 'border-white/5 bg-transparent text-slate-500'
      }`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full transition"
        style={{ background: checked ? color : 'transparent', boxShadow: checked ? `0 0 10px ${color}` : 'none', border: `1.5px solid ${color}` }}
      />
      {label}
    </button>
  );
}

export function SectionHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">{kicker}</div>
      <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
      {children && <div className="mt-3 max-w-3xl text-slate-300">{children}</div>}
    </header>
  );
}

export function Stat({ label, value, color }: { label: ReactNode; value: ReactNode; color?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass p-5 ${className}`}>{children}</div>;
}

/** Caixa "No mundo real" / "Ligação com o modelo físico". */
export function Callout({ icon, title, children, tone = 'cyan' }: { icon: string; title: string; children: ReactNode; tone?: 'cyan' | 'pink' | 'violet' | 'amber' }) {
  const tones = {
    cyan: 'border-cyan-400/30 bg-cyan-400/5',
    pink: 'border-pink-400/30 bg-pink-400/5',
    violet: 'border-violet-400/30 bg-violet-400/5',
    amber: 'border-amber-400/30 bg-amber-400/5',
  } as const;
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-lg">{icon}</span>
        {title}
      </div>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}
