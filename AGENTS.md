# AGENTS.md

Memoria operacional para Codex CLI, Gemini CLI e outros agentes continuarem o projeto 10PILA sem depender do historico desta conversa.

Regra de entrada:

```txt
Leia este arquivo, README.md, git status --short e git diff --stat antes de mexer.
Nao recrie o projeto. Nao reverta mudancas existentes sem pedido explicito.
```

Regra de saida:

```txt
Atualize este arquivo com estado real, decisoes novas, arquivos alterados, comandos rodados, validacoes, problemas e proximos passos.
```

## Estado Atual Em 2026-04-24

Repositorio em `/root/test`.

Branch:

- `main`
- `HEAD` e `origin/main`: `04a0ac0 chore: cleanup workspace, update media manifest and track AGENTS.md` (Commit consolidado)

Status observado:

- `docs/static-media-manifest.json` atualizado e commitado (61 assets de produto presentes).
- `AGENTS.md` agora é rastreado pelo Git.
- `.gitignore` atualizado para ignorar `tsconfig.tsbuildinfo` e capturas de tela em `docs/`.
- Fluxo de verificação de e-mail validado logicamente via script (DB -> Token -> Verify -> User Update).
- Campanha de frete grátis ativa e visível na Home, Vitrine e Cards de Produto.
- PilaBot configurado com persona "ácida/entediada" e teasers específicos por página.

Nao apagar nem commitar automaticamente os prints em `docs/` sem o usuario pedir. Eles foram usados como referencia visual em etapas anteriores e estão no `.gitignore`.

## Objetivo Do Produto

10PILA e um e-commerce MVP de achados tech baratos/importados, com vibe dark commerce, catalogo de gadgets simples, carrinho, checkout PagBank, auth, indicacao, admin, imagens estaticas e PilaBot.

O posicionamento decidido na conversa:

- loja de achados tech baratos;
- gadgets uteis e pequenos;
- vibe importado/AliExpress refinado;
- nao parecer premium caro demais;
- tom comercial direto;
- marca com personalidade propria;
- bot propositalmente entediado, seco e vendedor.

## Stack

- Next.js 16 App Router.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Prisma 6 + PostgreSQL.
- NextAuth/Auth.js v4 com Prisma Adapter e sessoes JWT.
- PagBank Checkout hospedado.
- Resend para confirmacao de email.
- Chat IA server-side com Gemini, Groq e OpenRouter.
- Framer Motion para animacoes.
- Deploy Railway.

Scripts principais em `package.json`:

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:generate
npm run media:manifest
npm run media:static-manifest
```

Preferencia operacional do usuario:

- so rodar `npm run build` quando ele pedir ou quando for necessario para deploy/risco real.
- Railway only para deploy.
- ignorar VM, Caddy, PM2, Nginx e deploy fora do Railway.

## Estrutura Importante

- `src/app`: paginas App Router e APIs.
- `src/components`: UI, chat, auth, carrinho, checkout, admin.
- `src/lib`: auth, chat, commerce, catalogo, pagamento, db e utilitarios.
- `prisma/schema.prisma`: modelos User, Product, Cart, Coupon, Order, Payment, Referral, Chat.
- `prisma/seed.ts`: seed de catalogo/admin.
- `docs/media-generation-plan.md`: plano de midia.
- `docs/static-media-manifest.json`: manifesto de assets estaticos atual.
- `public/catalog/products`: imagens finais dos produtos.
- `public/home/posters`: posters/banner da home.

## Funcionalidades Existentes

Produto/catalogo:

- Home comercial.
- Vitrine `/produtos`.
- Produto `/produtos/[slug]`.
- Cards com imagem, preco, estoque e CTA.
- Imagens locais por slug em `/catalog/products/<slug>.webp`.
- Fallbacks por categoria/placeholder se faltar imagem.

Carrinho/checkout:

- Carrinho autenticado.
- Cupom no carrinho.
- Checkout com endereco, revisao final e PagBank hospedado.
- Pedido salvo antes do redirect.
- PagBank com modo estrutural se token/API falhar.
- Webhook PagBank idempotente para aprovar pagamento e reduzir estoque sem duplicar baixa.

Auth:

- Cadastro/login por email e senha.
- Login social Google/Facebook preparado por env.
- Confirmacao real de email via Resend.
- Login por credenciais bloqueado ate `emailVerified`.
- Login social marca email como verificado.
- Reenvio de verificacao.

Indicacoes:

- Fluxo de referral/codigo de indicacao existe.
- Campo manual de codigo de indicacao foi corrigido em etapa anterior.
- Link de indicacao funciona.

Admin:

- Produtos.
- Pedidos.
- Inventario.
- Configuracao do chat.

Chat:

- `PilaBot` com IA server-side.
- Usa produto atual, pagina atual, historico curto, produtos relevantes e pedidos do usuario logado quando aplicavel.
- Renderiza cards de produto dentro do chat.
- Botao `Adicionar 1` pelo chat exige login; se nao logado, avisa, salva acao pendente e retoma apos login.
- Fallback deterministico sem inventar preco, estoque, promocao, prazo ou status.

## Decisoes Recentes E Implementadas

### Email Verification / Resend

Implementado em commit `492cfd9 Add email verification flow`.
Validado logicamente em 2026-04-24.

Arquivos principais:

- `src/lib/auth/email-verification.ts`
- `src/lib/auth/credentials.ts`
- `src/lib/auth/options.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login-check/route.ts`
- `src/app/api/auth/resend-verification/route.ts`
- `src/app/auth/verify-email/page.tsx`
- `src/components/email-verification-panel.tsx`
- `src/components/auth-forms.tsx`

Estado:

- cadastro por email cria conta e envia link;
- usuario nao entra direto por credenciais antes de verificar;
- verificacao usa `VerificationToken`;
- Resend envia email transacional;
- `RESEND_FROM` correto decidido: `10PILA <noreply@loja.sanderlab.shop>`.

Problema resolvido:

- envio falhava com `Resend error 403` porque `send.loja.sanderlab.shop` era tracking subdomain, nao dominio de envio verificado.
- corrigido para usar dominio verificado `loja.sanderlab.shop`.

DNS:

- Cloudflare inspecionada por API.
- Adicionado DMARC:
  - `_dmarc.loja.sanderlab.shop`
  - `TXT`
  - `v=DMARC1; p=none; adkim=s; aspf=s`
- DKIM e SPF/return-path do Resend estavam presentes.
- Spam inicial foi atribuido a dominio novo e DMARC ausente; DMARC foi corrigido, reputacao ainda precisa amadurecer.

Seguranca:

- usuario colou tokens/chaves de Resend e Cloudflare em conversa anterior.
- Tratar essas chaves como expostas; recomendar rotacionar.

### Frete Gratis Primeira Semana

Implementado em commit `d0aef3f Tighten chat sales persona and add launch freight offer`.
Configurado para iniciar em `2026-04-24T00:00:00.000Z`.

Arquivos principais:

- `src/lib/commerce/freight-offers.ts`
- `src/lib/commerce/cart-pricing.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/cart/coupon/route.ts`
- `src/app/carrinho/page.tsx`
- `src/app/checkout/page.tsx`
- `src/components/cart-summary.tsx`
- `src/components/checkout-form.tsx`
- `src/app/page.tsx`
- `src/app/produtos/page.tsx`
- `src/app/produtos/[slug]/page.tsx`
- `src/components/product-card.tsx`

Regra:

- frete gratis automatico em todo catalogo na primeira semana, sem cupom;
- desconto entra no calculo real do carrinho, checkout e pedido salvo;
- UI anuncia na home, vitrine, card, produto, carrinho e checkout;
- resumo final mostra desconto de frete/economia final.

Defaults:

- `FREIGHT_FREE_FIRST_WEEK_START_AT`: default interno `2026-04-24T00:00:00.000Z`
- `FREIGHT_FREE_FIRST_WEEK_DURATION_DAYS`: default interno `7`

Cuidados:

- nao fazer frete gratis apenas visual;
- sempre usar o resolvedor central em `src/lib/commerce/cart-pricing.ts`;
- cupom e frete gratis automatico devem combinar sem descontar frete duas vezes.

### PilaBot Persona E Comportamento

Objetivo do usuario:

- robo entediado, vendedor mal pago, seco, acido e impaciente;
- menos suporte fofinho;
- mais vendedor de balcão cansado;
- mostrar itens e dar suporte minimo, mas com pouca paciencia;
- nao humilhar de forma classista/preconceituosa nem atacar atributo protegido.

Arquivos principais:

- `src/lib/chat/providers.ts`: prompt sistemico dos provedores IA.
- `src/lib/chat/assistant.ts`: intencoes, fallback deterministico, chunks, typing status.
- `src/components/chat/chat-widget.tsx`: UI, teasers, pending cart, pacing.
- `src/lib/chat/config.ts`: labels de modo.
- `src/components/admin-chat-form.tsx`: label admin `AMIGAVEL` -> `entediado`.

Refatoracoes feitas:

- Criado `ChatIntent` em `src/lib/chat/assistant.ts`.
- `detectIntent()` separa order, greeting, browsing, chat, recommendation, promotion, cheaper, link, compare, details, similar, add_to_cart, specific_item e unknown.
- Quick actions agora tendem para preco, promocoes, comparar, adicionar ao carrinho e fechar.
- Respostas do fallback ficaram mais secas.
- `replyChunks` e `typingStatus` foram adicionados para respostas em bolhas curtas.
- UI toca chunks com pausas para parecer conversa, nao paragrafo unico.
- Flood/pacing: se usuario manda mensagens picadas, o chat avisa e agenda a ultima mensagem.
- Loading labels como `vendo no sistema`, `comparando os dois`, `aguardando voce decidir`.

Tom atual:

- header: `vendedor mal pago e entediado`;
- primeira mensagem: `Oi. Eu sou o PilaBot. Fala o que voce quer e eu vejo o que da pra te empurrar do estoque.`;
- placeholder: `Fala o que voce quer comprar`;
- prompt IA reforca: vendedor robo brasileiro, mal pago, entediado, seco, comercial, sem ser doce.

### Bolhas De Chamada / Teasers Do Bot

Implementado em varios commits recentes ate `b8f8267`.

Arquivos:

- `src/components/chat/chat-widget.tsx`
- `src/app/globals.css`

Estado atual:

- teasers aparecem quando chat esta fechado;
- frases sarcásticas variam por contexto de página;
- cliques na bolha abrem o chat.

### Mídia Estática / Catalogo

- `docs/static-media-manifest.json` consolidado com 61 assets de produto presentes.
- Home/posters: WEBP 1600x900 em `public/home/posters/<slug>.webp`.

## Deploys E Validacoes Recentes

- `2026-04-24`: Commit `04a0ac0` consolidou limpeza e manifesto.
- Validação lógica de verificação de email via script passou.
- Verificação visual de labels de frete grátis via código passou.

## Proximos Passos Recomendados

Curto prazo:

- Testar em producao as bolhas de teaser do PilaBot em home, produto e vitrine.
- Monitorar logs do Resend para confirmar se a reputação do domínio está melhorando após DMARC.
- Implementar auto-login após confirmação de e-mail para melhorar UX.
- Criar página de erro customizada para tokens de verificação expirados.

Proximos incrementos possiveis:

- Se o usuario pedir mais criatividade no bot, ajustar lista `teasers` em `src/components/chat/chat-widget.tsx`.
- Se o usuario pedir deploy, rodar `npm run build`, commit, push, `railway up` e acompanhar `railway deployment list`.

## Prompt De Entrada Para Gemini CLI

```txt
Leia AGENTS.md, README.md, git status --short e git diff --stat. Continue do estado atual em /root/test sem recriar o projeto e sem reverter mudancas existentes. Preserve Railway-only. Antes de encerrar, atualize AGENTS.md com o que mudou.
```
