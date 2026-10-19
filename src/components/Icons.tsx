// Ícones line-art 32×32 (usam currentColor para inverter no estado ativo).
import type { SectionId } from '../nav';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const };

export function SectionIcon({ id, className = 'h-7 w-7' }: { id: SectionId; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} shapeRendering="crispEdges">
      {id === 'cone' && (
        <>
          <path d="M5 3L27 29M27 3L5 29" {...P} />
          <path d="M3 22L29 12" {...P} strokeWidth={1} strokeDasharray="2 2" />
        </>
      )}
      {id === 'laboratorio' && (
        <>
          <path d="M4 9h24M4 16h24M4 23h24" {...P} strokeWidth={1} />
          <rect x="17" y="6" width="6" height="6" fill="var(--icon-bg, #fff)" stroke="currentColor" strokeWidth={2} />
          <rect x="7" y="13" width="6" height="6" fill="var(--icon-bg, #fff)" stroke="currentColor" strokeWidth={2} />
          <rect x="13" y="20" width="6" height="6" fill="var(--icon-bg, #fff)" stroke="currentColor" strokeWidth={2} />
        </>
      )}
      {id === 'orbitas' && (
        <>
          <ellipse cx="16" cy="16" rx="14" ry="8" {...P} shapeRendering="geometricPrecision" />
          <circle cx="11" cy="16" r="3.5" fill="currentColor" />
          <rect x="27" y="11" width="4" height="4" fill="currentColor" />
        </>
      )}
      {id === 'geogebra' && (
        <>
          <path d="M3 16h26M16 3v26" {...P} strokeWidth={1} />
          <ellipse cx="16" cy="16" rx="11" ry="7" {...P} shapeRendering="geometricPrecision" />
        </>
      )}
    </svg>
  );
}

/** Triângulo sólido (evita depender de glifos ◂ ▸ na fonte). */
export function Tri({ dir }: { dir: 'l' | 'r' }) {
  return (
    <svg viewBox="0 0 6 10" className="inline-block h-2.5 w-1.5" shapeRendering="crispEdges">
      <path d={dir === 'r' ? 'M0 0l6 5-6 5z' : 'M6 0L0 5l6 5z'} fill="currentColor" />
    </svg>
  );
}
