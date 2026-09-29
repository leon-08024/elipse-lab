# Elipse Lab

Visualização interativa da **elipse** para o projeto *Cônicas no Mundo Real: do concreto ao digital*.

| Seção | O que mostra | Etapa |
|---|---|---|
| Início | Definição como lugar geométrico, elementos, relações | 1 |
| Cone de Apolônio (3D) | Plano cortando o cone, classificação das cônicas, esferas de Dandelin | 1 · Bônus |
| Jardineiro | Método do barbante animado, d₁ + d₂ = 2a, conversão para cm | 2 ↔ 3 |
| Laboratório | Sliders a, b, h, k; focos, vértices, eixos, diretrizes; 3 formas da equação | 3 |
| Propriedade refletora | Raios saindo de um foco convergem no outro | 3 |
| Órbitas (3D) | Leis de Kepler com dados reais (NASA/JPL) | Mundo real |
| GeoGebra | A mesma construção no GeoGebra + comandos passo a passo | 3 |
| Desafio | Quiz, "descubra a equação", "encontre os focos", placar por equipes | 4 |

**Atalhos na apresentação:** `←` / `→` (ou passador de slides) trocam de seção, `F` ativa a tela cheia.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist/
```

## Personalizar

- Nomes do grupo, escola e turma: `src/data/grupo.ts`
- Perguntas do quiz: `src/data/quiz.ts`

## Stack

React 18 · TypeScript · Vite · Three.js (React Three Fiber + drei) · Tailwind CSS · Framer Motion · KaTeX

Fontes dos dados orbitais: NASA Planetary Fact Sheet; JPL Small-Body Database.
