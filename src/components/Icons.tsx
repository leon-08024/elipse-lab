// Ícones line-art 32×32 (usam currentColor para inverter no estado ativo).
import type { SectionId } from '../nav';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const };

export function SectionIcon({ id, className = 'h-7 w-7' }: { id: SectionId | 'fullscreen' | 'ggb' | 'code'; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} shapeRendering="crispEdges">
      {id === 'inicio' && (
        <>
          <ellipse cx="16" cy="16" rx="13" ry="8" {...P} shapeRendering="geometricPrecision" />
          <rect x="8" y="15" width="3" height="3" fill="currentColor" />
          <rect x="21" y="15" width="3" height="3" fill="currentColor" />
        </>
      )}
      {id === 'cone' && (
        <>
          <path d="M5 3L27 29M27 3L5 29" {...P} />
          <path d="M3 22L29 12" {...P} strokeWidth={1} strokeDasharray="2 2" />
        </>
      )}
      {id === 'jardineiro' && (
        <>
          <path d="M6 22L16 7L26 22" {...P} />
          <rect x="4" y="21" width="4" height="4" fill="currentColor" />
          <rect x="24" y="21" width="4" height="4" fill="currentColor" />
          <path d="M16 7l3-5" {...P} />
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
      {id === 'refletora' && (
        <>
          <ellipse cx="16" cy="16" rx="14" ry="10" {...P} shapeRendering="geometricPrecision" />
          <path d="M7 16L14 6.5L25 16M7 16L12 25.5L25 16" {...P} strokeWidth={1} />
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
      {id === 'desafio' && (
        <>
          <rect x="4" y="4" width="24" height="24" {...P} />
          <path d="M12 12a4 4 0 1 1 6 3.5c-1.5 1-2 1.5-2 3.5" {...P} shapeRendering="geometricPrecision" />
          <rect x="15" y="21" width="2" height="2" fill="currentColor" />
        </>
      )}
      {id === 'fullscreen' && <path d="M4 11V4h7M21 4h7v7M28 21v7h-7M11 28H4v-7" {...P} />}
      {id === 'ggb' && (
        <>
          <rect x="4" y="6" width="24" height="20" {...P} />
          <path d="M4 11h24" {...P} />
          <ellipse cx="16" cy="19" rx="7" ry="4" {...P} strokeWidth={1.5} shapeRendering="geometricPrecision" />
        </>
      )}
      {id === 'code' && <path d="M11 9L4 16l7 7M21 9l7 7-7 7M18 6l-4 20" {...P} />}
    </svg>
  );
}

export function EllipseLogo() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6" shapeRendering="crispEdges">
      <ellipse cx="12" cy="8" rx="11" ry="6.5" fill="none" stroke="#000" strokeWidth="1.5" shapeRendering="geometricPrecision" />
      <rect x="5" y="7" width="2" height="2" />
      <rect x="17" y="7" width="2" height="2" />
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
