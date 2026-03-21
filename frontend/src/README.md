# Focus On Max — Componentes JavaScript (sem TypeScript)

## Estrutura

```
js-export/
├── components/
│   ├── CircularTimer.jsx
│   ├── Header.jsx
│   ├── NavLink.jsx
│   └── RankingList.jsx
├── pages/
│   ├── Index.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── History.jsx
│   ├── Profile.jsx
│   └── Ranking.jsx
├── hooks/
│   └── useTimer.js
└── styles/
    └── index.css
```

## Como usar

1. Copie os arquivos para seu projeto React + Vite
2. Copie `styles/index.css` para `src/index.css`
3. Certifique-se de ter instalado: `react-router-dom`, `lucide-react`, e os componentes UI (shadcn/ui ou equivalente)
4. Ajuste os imports `@/components/ui/*` para os caminhos do seu projeto
5. Conecte suas próprias funções de lógica via props

## Props de cada componente

Veja os comentários JSDoc no topo de cada arquivo para a lista completa de props aceitas.
