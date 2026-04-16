# 10PILA media plan

Este projeto agora esta preparado para receber midia por produto, nao por categoria.

## Estrutura esperada

- `public/catalog/products/<slug>.webp`
- `public/catalog/video/<slug>.mp4`
- `public/home/posters/<slug>.webp`
- `public/home/video/<slug>.mp4`

## Como o app resolve imagem

1. Procura um asset local por slug em `public/catalog/products`
2. Se existir, usa esse arquivo no catalogo inteiro
3. Se ainda nao existir, cai no fallback atual

## Onde estao os prompts

- `src/lib/catalog/media-prompts.ts`

Esse arquivo gera:

- prompt de imagem individual para cada produto
- prompt de video curto para cada produto
- prompts de keyframe/poster para a home

## Direcao visual

- dark commerce
- cyber clean
- neon controlado
- produto como foco principal
- sem texto dentro da arte
- sem marca falsa
- sem visual gamer exagerado
- sem cara de categoria generica

## Ordem de producao recomendada

1. Hero principal da home
2. Posters promocionais da home
3. Imagens dos produtos em destaque
4. Restante do catalogo
5. Videos curtos do hero e campanhas
