// Perguntas do quiz. Texto entre $...$ é renderizado como LaTeX.
export interface Question {
  q: string;
  options: string[];
  answer: number; // índice da correta
  explain: string;
  figure?: { a: number; b: number; h?: number; k?: number; foci?: boolean };
}

export const QUIZ: Question[] = [
  {
    q: 'A elipse é o conjunto dos pontos do plano cuja ______ das distâncias a dois pontos fixos (focos) é constante.',
    options: ['diferença', 'soma', 'produto', 'razão'],
    answer: 1,
    explain: '$d(P,F_1)+d(P,F_2)=2a$. Com a diferença constante teríamos uma hipérbole.',
  },
  {
    q: 'Na elipse $\\frac{x^2}{25}+\\frac{y^2}{9}=1$, quanto vale $c$?',
    options: ['$3$', '$4$', '$5$', '$16$'],
    answer: 1,
    explain: '$c^2=a^2-b^2=25-9=16 \\Rightarrow c=4$.',
  },
  {
    q: 'Qual é a medida do eixo maior da elipse $\\frac{x^2}{25}+\\frac{y^2}{9}=1$?',
    options: ['$5$', '$10$', '$6$', '$8$'],
    answer: 1,
    explain: '$a=5$, então o eixo maior mede $2a=10$.',
  },
  {
    q: 'Qual elipse é a equação da figura?',
    figure: { a: 4, b: 2 },
    options: ['$\\frac{x^2}{4}+\\frac{y^2}{16}=1$', '$\\frac{x^2}{16}+\\frac{y^2}{4}=1$', '$\\frac{x^2}{4}+\\frac{y^2}{2}=1$', '$\\frac{x^2}{8}+\\frac{y^2}{4}=1$'],
    answer: 1,
    explain: 'Corta o eixo x em $\\pm4$ ($a=4$, $a^2=16$) e o eixo y em $\\pm2$ ($b=2$, $b^2=4$).',
  },
  {
    q: 'Um barbante de 10 cm está preso em dois alfinetes a 6 cm um do outro. Quanto medirá o eixo menor da elipse desenhada?',
    options: ['4 cm', '6 cm', '8 cm', '10 cm'],
    answer: 2,
    explain: '$2a=10 \\Rightarrow a=5$; $2c=6 \\Rightarrow c=3$; $b=\\sqrt{25-9}=4$; eixo menor $=2b=8$ cm.',
  },
  {
    q: 'Onde estão os focos da elipse $\\frac{x^2}{9}+\\frac{y^2}{25}=1$?',
    options: ['$(\\pm4,\\,0)$', '$(0,\\,\\pm4)$', '$(\\pm3,\\,0)$', '$(0,\\,\\pm5)$'],
    answer: 1,
    explain: 'O maior denominador está sob $y^2$: eixo maior vertical. $c=\\sqrt{25-9}=4$, focos $(0,\\pm4)$.',
  },
  {
    q: 'Qual é a excentricidade de uma circunferência?',
    options: ['$e=0$', '$e=1$', '$0<e<1$', '$e>1$'],
    answer: 0,
    explain: 'Na circunferência os focos coincidem com o centro: $c=0 \\Rightarrow e=c/a=0$.',
  },
  {
    q: 'Qual destas elipses é a mais achatada?',
    options: ['$e=0{,}2$', '$e=0{,}5$', '$e=0{,}9$', '$e=0{,}05$'],
    answer: 2,
    explain: 'Quanto mais perto de 1 a excentricidade, mais achatada a elipse.',
  },
  {
    q: 'Na órbita da Terra, onde está o Sol?',
    options: ['No centro da elipse', 'Em um dos focos', 'Em um dos vértices', 'Fora da elipse'],
    answer: 1,
    explain: '1ª lei de Kepler: os planetas descrevem elipses com o Sol em um dos focos.',
  },
  {
    q: 'Um raio de luz sai do foco $F_1$ e reflete na parede de um espelho elíptico. Para onde ele vai?',
    options: ['Volta para $F_1$', 'Passa pelo foco $F_2$', 'Sai paralelo ao eixo', 'Depende do ângulo'],
    answer: 1,
    explain: 'Propriedade refletora: todo raio que sai de um foco reflete passando pelo outro. Usado na litotripsia.',
  },
  {
    q: 'Cortando um cone com um plano, quando obtemos uma elipse?',
    options: [
      'Plano paralelo à geratriz',
      'Plano cortando as duas folhas do cone',
      'Plano inclinado menos que a geratriz, cortando só uma folha',
      'Plano perpendicular à base passando pelo vértice',
    ],
    answer: 2,
    explain: 'Paralelo à geratriz → parábola; duas folhas → hipérbole; horizontal → circunferência.',
  },
  {
    q: 'A Terra tem $e \\approx 0{,}017$ e o cometa Halley tem $e \\approx 0{,}967$. O que isso significa?',
    options: ['A órbita da Terra é quase circular', 'A órbita do Halley é quase circular', 'As duas são parábolas', 'As duas são iguais'],
    answer: 0,
    explain: 'Excentricidade perto de 0 → quase circunferência. O Halley tem uma elipse muito alongada.',
  },
];
