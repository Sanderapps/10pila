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
- `HEAD` e `origin/main`: `b8f8267 Adjust teaser bubble position and size`

Status observado:

- `docs/static-media-manifest.json` modificado.
- `AGENTS.md` nao rastreado antes desta atualizacao.
- Screenshots nao rastreadas em `docs/`.
- `tsconfig.tsbuildinfo` nao rastreado.
- O diff rastreado atual e apenas do manifesto de midia estatica: produtos agora aparecem como presentes no manifesto.

Nao apagar nem commitar automaticamente os prints em `docs/` sem o usuario pedir. Eles foram usados como referencia visual em etapas anteriores.

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

Implementado em varios commits recentes:

- `5e51c9c Refine chat teaser copy and bubbles`
- `cdc993c Fix chat teaser timing and cart quick action`
- `611e06f Tune chat teaser cadence`
- `6503d6d Fix chat teaser visibility`
- `208bf75 Polish chat teaser bubble styling`
- `a7e1592 Fix mobile teaser bubble sizing`
- `e45f1f8 Apply page-specific chat teaser copy`
- `37f3012 Upgrade chat behavior and pacing`
- `b8f8267 Adjust teaser bubble position and size`

Arquivos:

- `src/components/chat/chat-widget.tsx`
- `src/app/globals.css`

Estado atual:

- teasers aparecem quando chat esta fechado;
- nao aparecem em carrinho/checkout;
- escondem quando teclado/composer esta ativo;
- clique na bolha abre chat;
- frases variam por pagina: home, produtos, produto, auth, indicacoes, carrinho, checkout;
- usa `localStorage` key `10pila-chat-next-hint-at-v2`;
- usa `sessionStorage` key `10pila-chat-teaser-seen-v1`;
- delay inicial: 5-8s;
- cooldown home: 28s;
- cooldown navegacao/vitrine: 40s;
- depois de fechar chat: 8min;
- depois de abrir: 30min;
- visivel por 12s;
- pode empilhar duas bolhas ocasionalmente.

CSS:

- `.chat-hint-stack`
- `.chat-hint`
- `.chat-hint-primary`
- `.chat-hint-secondary`

Cuidados:

- bolhas devem ficar perto do mascote e nao cobrir conteudo importante;
- em mobile, manter largura pequena e texto quebrando bem;
- nao esconder o mascote quando chat esta aberto porque ele e usado como fechamento/controle em algumas interacoes;
- manter contraste claro das bolhas do chat interno.

### Mídia Estática / Catalogo

Contexto de conversa:

- Foram geradas/otimizadas imagens de produtos em WEBP.
- PNGs de produto foram removidos anteriormente.
- Produtos esperam arquivos em `public/catalog/products/<slug>.webp`.
- O manifesto atual modificado indica:
  - `totalProducts`: 61
  - `presentProductAssets`: 61
  - `missingProductAssets`: 0
  - `missingHomeAssets`: 7

Arquivos importantes:

- `src/lib/catalog/products.ts`
- `src/lib/catalog/media.ts`
- `src/lib/catalog/visuals.ts`
- `docs/static-media-manifest.json`
- `docs/media-generation-plan.md`
- `scripts/export-static-media-manifest.ts`

Convencoes:

- Produtos: WEBP 1200x1200, produto centralizado, sem texto/logo/watermark/pessoas/maos/embalagem.
- Home/posters: WEBP 1600x900 em `public/home/posters/<slug>.webp`.
- Use sempre slug real do produto.

## Deploys E Validacoes Recentes

Deploys citados/observados:

- `492cfd9`: email verification, deploy Railway `b9731c85-61e0-42c0-b082-0dd739514d7c`, sucesso.
- `d0aef3f`: persona chat + frete gratis, deploy Railway `b87d9096-388f-47cd-9830-76e514163ed4`, sucesso.
- Commits posteriores de teaser bubbles estao em `origin/main` ate `b8f8267`. Se precisar confirmar deploy desses commits, use `railway deployment list`.

Validacoes feitas nas etapas recentes:

- `npm run lint` passou.
- `npm run build` passou antes do deploy de `d0aef3f`.
- Railway deploy `b87d9096...` terminou `SUCCESS`.

## Variaveis De Ambiente Importantes

Base:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_URL`
- `APP_URL`
- `FREIGHT_FIXED_PRICE`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

Frete gratis primeira semana:

- `FREIGHT_FREE_FIRST_WEEK_START_AT`
- `FREIGHT_FREE_FIRST_WEEK_DURATION_DAYS`

PagBank:

- `PAGBANK_API_URL`
- `PAGBANK_ACCESS_TOKEN`
- `PAGBANK_WEBHOOK_SECRET`

Resend:

- `RESEND_API_KEY`
- `RESEND_FROM`
- `RESEND_REPLY_TO`
- `EMAIL_VERIFICATION_TTL_HOURS`

IA:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_FACEBOOK_ID`
- `AUTH_FACEBOOK_SECRET`

## Operacao Railway

Comandos usados com frequencia:

```bash
railway status
railway variables
railway variable set KEY=value
railway up
railway deployment list
railway logs
railway login
```

Observacoes:

- Railway CLI desloga/expira com frequencia.
- Login costuma pedir codigo via `https://railway.com/activate`.
- `railway run` local nao alcança necessariamente o host interno do Postgres.
- Para executar Prisma contra producao, usar `railway ssh -s 10pila-app "node -e '...'"` dentro do servico quando necessario.

## Dados De Teste / Limpezas Ja Feitas

Foi feita limpeza de contas de cliente em producao, preservando admin.

- Clientes apagados: 10 em uma limpeza.
- Admin preservado: 1.
- `sanderboff8@gmail.com` foi apagado em outra limpeza.
- Dependencias removidas: pedidos/pagamentos/endereco/contas sociais/sessoes/carrinho/cupom/referral ligados ao usuario.
- `chatSessions` foram desvinculadas (`userId = null`) em vez de apagadas.

Nao repetir limpeza em producao sem pedido explicito.

## Cuidados De Produto E UX

- Nao fazer redesign amplo sem diagnostico por camada.
- Manter visual dark commerce/cyber clean sem virar premium caro.
- Evitar copy generica e texto de template.
- Chat deve ser legivel: texto claro em fundo escuro.
- Mascote deve permanecer visivel; usuario usa para fechar/abrir.
- Nao deixar cards/checkout/carrinho com area quebrada se asset faltar.
- Produto e checkout precisam mostrar preco, estoque, frete/desconto e CTA com clareza.
- As bolhas do bot podem ser provocativas, mas nao devem ser ofensivas/pesadas a ponto de prejudicar compra.

## Cuidados Tecnicos

- Nao commitar `.env`, tokens ou screenshots sem intencao.
- Nao commitar `.next`, `node_modules`, `tsconfig.tsbuildinfo`.
- O seed nao deve rodar no startup de producao: isso ja foi corrigido anteriormente no `package.json`.
- Login por credenciais deve respeitar `emailVerified`.
- PagBank deve falhar de modo estrutural e nao quebrar fluxo apos pedido salvo.
- Webhook deve continuar idempotente.
- Cupom de primeira compra deve contar somente pedidos validos: `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`.
- Ao alterar pricing, usar `src/lib/commerce/cart-pricing.ts`.
- Ao alterar frete promocional, usar `src/lib/commerce/freight-offers.ts`.
- Ao alterar comportamento do bot, mexer tanto em `src/lib/chat/providers.ts` quanto em `src/lib/chat/assistant.ts`; se for UI, tambem `src/components/chat/chat-widget.tsx`.

## Estado Do Git Que O Proximo Agente Deve Verificar

Ultimo estado observado antes desta atualizacao:

```txt
## main...origin/main
 M docs/static-media-manifest.json
?? AGENTS.md
?? docs/Screenshot_2026-04-23-20-10-31-109_com.brave.browser.jpg
?? docs/Screenshot_2026-04-23-20-14-48-958_com.brave.browser.jpg
?? docs/Screenshot_2026-04-23-20-43-10-796_com.brave.browser.jpg
?? docs/Screenshot_2026-04-23-22-18-30-952_com.brave.browser.jpg
?? docs/Screenshot_2026-04-23-22-19-24-999_com.brave.browser.jpg
?? tsconfig.tsbuildinfo
```

Depois desta edicao, `AGENTS.md` tambem estara modificado/novo no status.

## Proximos Passos Recomendados

Curto prazo:

- Verificar se `docs/static-media-manifest.json` deve ser commitado, pois agora indica 61 assets de produto presentes.
- Remover/ignorar `tsconfig.tsbuildinfo` se necessario.
- Decidir se screenshots em `docs/` ficam fora do repo ou entram em `.gitignore`.
- Testar em producao as bolhas de teaser do PilaBot em home, produto e vitrine.
- Testar fluxo de cadastro real: email chega, link verifica, login por senha libera.
- Testar carrinho/checkout durante janela de frete gratis para confirmar desconto final.

Proximos incrementos possiveis:

- Se o usuario pedir mais criatividade no bot, ajustar lista `teasers` em `src/components/chat/chat-widget.tsx` e regras de resposta em `src/lib/chat/assistant.ts`.
- Se o usuario pedir auto-login apos confirmar email, implementar confirmacao + session creation/redirecionamento.
- Se o usuario pedir deploy, rodar `npm run build`, commit, push, `railway up` e acompanhar `railway deployment list`.

## Prompt De Entrada Para Gemini CLI

```txt
Leia AGENTS.md, README.md, git status --short e git diff --stat. Continue do estado atual em /root/test sem recriar o projeto e sem reverter mudancas existentes. Preserve Railway-only. Antes de encerrar, atualize AGENTS.md com o que mudou.
```

