# Direção visual — Busca Vagas

Data: 2026-11-25. Feita com a skill `frontend-design` (anthropics/skills) + `anti-slop`.

## Assunto, público e trabalho da tela

- **Assunto:** a busca de emprego de um engenheiro de produção, tratada como um processo produtivo.
- **Público:** o Luís (e quem vê o portfólio).
- **Trabalho principal:** decidir rápido quais vagas valem a pena e saber o que fazer esta semana.

## Ideia central: gestão à vista

O vocabulário vem do chão de fábrica que o Luís conhece: **quadro de gestão à vista, andon, mapa de fluxo de valor (VSM)**.

- A **nota** usa as cores do **andon**: verde (≥ 70, vá em frente), amarelo (40–69, avalie), cinza (< 40). Vermelho só para o que trava: penalidades, follow-up atrasado.
- A **composição da nota** aparece como uma **barra empilhada**, igual a uma decomposição de perdas do OEE: cada categoria é um trecho da barra e as penalidades aparecem hachuradas em vermelho no fim. **É o elemento marcante do site**; o resto fica quieto.
- O **Painel** é um **fluxo de valor**: Interessado → Apliquei → Entrevista → Oferta, com a quantidade em cada etapa e a taxa de passagem entre elas.

## Tokens

| Nome | Hex | Uso |
|---|---|---|
| Grafite | `#1E2624` | texto, segmento "processos" da barra |
| Aço | `#51646C` | texto secundário, segmento "IA" |
| Concreto | `#F3F4F1` | fundo da página |
| Chapa | `#FFFFFF` | superfícies (listas, tabela) |
| Junta | `#D6DBD7` | bordas e divisórias |
| Laranja segurança | `#F0A202` | botão principal, lâmpada amarela, marca-texto de palavra-chave |
| Laranja escuro | `#C46A00` | nota da faixa "avalie" (texto) |
| Verde escuro | `#1F6B43` | nota e faixa "vale aplicar" |
| Vermelho parada | `#B3261E` | penalidades, atrasos |

**Tipografia (substituída, ver "Identidade escolhida"):** IBM Plex Sans (texto, interface — tem origem em engenharia e lê bem em tabelas) + IBM Plex Sans Condensed semibold para **números e títulos de tela** (cara de placa industrial, cabe muito número em pouco espaço). Escala: 13 / 15 / 18 / 24 / 40. Números sempre tabulares.

**Forma:** raio 4px em controles, 6px em painéis; nada de sombra; bordas de 1px. Listas são **linhas de uma lista** (uma borda externa e divisórias), não cartões soltos idênticos.

## Layout

```
Sugestões
┌───────────────────────────────────────────────────────────────┐
│ 78  Assistente de PCP                       [Adicionar à lista] │
│     AZZAS 2154   Rio de Janeiro, híbrido      Descartar         │
│     ███████████████▓▓▓▓░░▒▒  processos 40  nível 10 ...        │
│     Veja mais ▾                                                 │
│   ┌ O que você vai fazer │ Requisitos (palavras do perfil      │
│   │ ...                  │ marcadas em amarelo) │ Ficha: salário,│
│   └ ...                  │ ...                  │ prazo, fonte   │
├───────────────────────────────────────────────────────────────┤
```

Alinhamento à esquerda em tudo; números alinhados à direita nas tabelas.

## Princípios

1. Cor só informa (andon), nunca enfeita.
2. Um elemento marcante: a barra de composição da nota.
3. Metadados em campos com rótulo ou separados por espaço, sem fileiras de "A · B · C".
4. "Veja mais" abre os detalhes **na própria linha**, sem sair da página; o anúncio original é um link secundário.
5. Texto em português simples, no imperativo: "Adicionar à lista", "Descartar".

## Revisão contra os padrões genéricos

- Primeira versão era o "kit SaaS": cartões brancos idênticos, verde-azulado genérico, metadados com pontos. **Trocado** por linhas de lista, paleta de chão de fábrica e campos separados.
- Fundo creme / acento terracota: evitado (concreto frio + amarelo segurança).
- Fonte mono para dados: evitada (Plex Condensed para números).

## Filtros: quadro de controle (2026-11-25, pedido do Luís)

- Faixa grafite no topo da lista, como um quadro de gestão à vista: três **lâmpadas** (vale aplicar / avalie / pouco aderente)
  com a contagem de cada faixa — clicar liga/desliga a faixa.
- Abaixo, chaves de **Área** e **Site** com contagem, ordenação e "Mostrando N de M".
- A lista é **agrupada por faixa**, com título colorido e uma barra lateral na cor da faixa em cada vaga
  (substitui a "caixa branca simples" que o Luís achou sem graça).
- Sem resultado: mensagem dizendo o que fazer (ligar outra faixa ou tirar um filtro).

## Identidade escolhida (2026-11-25, Luís)

Comparação em `docs/prototipo/identidade.html`. Mistura escolhida:
- **Logo (opção A):** quadrado grafite com três barras em ranking (verde, laranja, cinza) + "busca.vagas" com o ponto laranja.
  Componente `src/components/logo.tsx`; ícone da aba em `src/app/icon.svg`.
- **Separação entre vagas (opção B):** cada vaga é uma tira branca com um vão cinza (concreto) entre elas.
- **Fontes (opção C):** Bricolage Grotesque (títulos, números, logo) + DM Sans (texto). Substituem a IBM Plex.
- **Nome da vaga:** classe `.titulo-vaga` — Bricolage 700 com marca-texto na cor da faixa da nota
  (`marca-verde`, `marca-amarela`, `marca-cinza`); no hover o marca-texto sobe.
- Cantos mais arredondados: 12px em painéis, 8px em botões e campos, chaves de filtro em pílula.
