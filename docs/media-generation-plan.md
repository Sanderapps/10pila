# 10PILA static media guide

Esta etapa fecha somente a camada de imagem estatica do catalogo e da home.

Nao use video aqui.

## Convencoes finais

### Produtos

- caminho em disco: `public/catalog/products/<slug>.webp`
- caminho publico: `/catalog/products/<slug>.webp`
- formato preferido: `WEBP`
- resolucao ideal: `1200x1200`
- enquadramento: produto centralizado, leitura forte no mobile
- sem texto, sem logo, sem watermark, sem embalagem, sem pessoas, sem maos

### Home / posters

- caminho em disco: `public/home/posters/<slug>.webp`
- caminho publico: `/home/posters/<slug>.webp`
- formato preferido: `WEBP`
- resolucao ideal: `1600x900`
- uso: hero, banners e blocos promocionais com texto sobreposto em HTML/CSS

## Como o app resolve as imagens

### Produtos

1. O seed e a camada de catalogo procuram um arquivo local por slug em `public/catalog/products`
2. Se existir, o produto usa esse asset em home, listagem, pagina de produto, carrinho, chat e admin
3. Se nao existir, o app cai no fallback premium atual gerado por `catalogPlaceholderDataUrl`
4. Quando voce adicionar os arquivos reais, rode `npm run prisma:seed` para atualizar `imageUrl` dos produtos no banco

### Home

1. O hero procura primeiro `public/home/posters/hero-achados-tech.webp`
2. Se o poster nao existir, a home cai no `imageUrl` do produto destaque atual
3. Os posters promocionais adicionais ficam preparados no manifesto estatico para plugar depois

## Arquivos que controlam a camada

- `src/lib/catalog/products.ts`: catalogo base
- `src/lib/catalog/media.ts`: resolucao de assets locais e prompts base
- `src/lib/catalog/media-prompts.ts`: prompts finais e lotes
- `src/lib/catalog/visuals.ts`: placeholder premium por categoria
- `scripts/export-static-media-manifest.ts`: exporta o manifesto final em `docs/static-media-manifest.json`

## Manifesto final

Gere a lista consolidada com:

```bash
npm run media:static-manifest
```

O arquivo de saida fica em:

- `docs/static-media-manifest.json`

Esse manifesto traz:

- produtos com nome, slug, categoria, preco, descricao, prompt e caminho esperado
- posters da home com slug, finalidade, prompt e caminho esperado
- lotes prontos para geracao
- lista de arquivos presentes
- lista de arquivos faltantes

## Estrategia de fallback

### Produto sem imagem real

- usa placeholder premium local em `data:image/svg+xml`
- o visual varia por categoria
- a UI nao quebra e nenhum card fica vazio

### Poster da home sem asset real

- hero usa a imagem do produto destaque quando o poster local nao existe
- blocos promocionais extras ficam documentados e prontos para receber poster local depois

## Checklist para plugar assets externos

1. Gerar os arquivos usando exatamente os slugs do manifesto
2. Salvar em `public/catalog/products/<slug>.webp`
3. Salvar posters em `public/home/posters/<slug>.webp`
4. Rodar `npm run prisma:seed`
5. Validar home, `/produtos`, `/produtos/[slug]`, carrinho, chat e admin

## Observacao sobre admin

O admin agora aceita:

- URL absoluta remota
- caminho local como `/catalog/products/<slug>.webp`

Isso permite ajustar manualmente um produto sem fugir do padrao estatico do projeto.
