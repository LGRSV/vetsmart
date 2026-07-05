# 🐾 VetSmart — Controle de Medicamentos

Sistema web para **controle de medicamentos de um hospital veterinário**, com visual
inspirado na identidade da [VetSmart](https://vetsmart.com.br) (verde vibrante, layout
clean estilo SaaS, cantos arredondados).

Aplicação **100% front-end** (HTML + CSS + JavaScript puro), sem build e sem dependências.
Os dados são salvos no `localStorage` do navegador.

## ✨ Funcionalidades

- **Dashboard** — total de medicamentos, valor do estoque, itens com estoque baixo e
  vencendo, gráfico de estoque por categoria e movimentações recentes.
- **Medicamentos** — cadastro completo (nome, princípio ativo, categoria, fabricante,
  lote, quantidade, estoque mínimo, preço, validade e observações) com busca, filtros
  por categoria/status e ordenação por coluna.
- **Movimentações** — registro de entradas e saídas de estoque com histórico e motivo/responsável.
- **Alertas** — itens vencidos, vencendo em 30 dias, sem estoque e com estoque baixo,
  com um badge de contagem na navegação.
- **Status automático** — cada item recebe um status calculado (em estoque, baixo,
  zerado, vencendo, vencido).
- **Exportar** — download de todo o inventário em JSON.
- Layout **responsivo** (desktop e mobile).

## 🚀 Como rodar

Basta abrir o `index.html` no navegador. Para evitar restrições de origem, você também
pode servir localmente:

```bash
# Python
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## 📁 Estrutura

```
vetsmart/
├── index.html      # estrutura e telas (SPA)
├── css/styles.css  # tema VetSmart (verde) + responsividade
├── js/app.js       # estado, CRUD, alertas e persistência (localStorage)
└── README.md
```

## 🎨 Tema

Cor principal `#12b26a` (verde VetSmart), tipografia *Nunito Sans*, componentes
arredondados e sombras suaves.

> Os dados iniciais são apenas exemplos. Para zerar, limpe o `localStorage` do site.

---
Feito para fins de estudo/demonstração — não é afiliado à VetSmart.
