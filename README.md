# Elipse Lab

Visualização interativa da **elipse** para o projeto *Cônicas no Mundo Real: do concreto ao digital*.

| Seção | O que mostra | Etapa |
|---|---|---|
| Cone de Apolônio (3D) | Plano cortando o cone, classificação das cônicas, esferas de Dandelin | 1 · Bônus |
| Parâmetros | Sliders a, b, h, k; focos, vértices, eixos, diretrizes; 3 formas da equação | 3 |
| Órbitas (3D) | Leis de Kepler com dados reais (NASA/JPL) | Mundo real |
| GeoGebra | A mesma construção no GeoGebra + comandos passo a passo | 3 |

**Atalhos:** `←` / `→` (ou passador de slides) trocam de seção · `A` abre o painel Avançado (detalhes e fórmulas) · `F` tela cheia.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist/
```

## Stack

React 18 · TypeScript · Vite · Three.js (React Three Fiber + drei) · Tailwind CSS · KaTeX — visual 1-bit monocromático.

Fontes dos dados orbitais: NASA Planetary Fact Sheet; JPL Small-Body Database.
