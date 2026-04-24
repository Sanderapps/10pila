# 10PILA

E-commerce MVP de importados tech com Next.js, TypeScript, App Router, Tailwind, Prisma, PostgreSQL, Auth.js/NextAuth, PagBank Checkout sandbox e chat IA multi-provider usando dados reais da loja.

## Stack

- Next.js + TypeScript + App Router
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth com email e senha, Prisma Adapter e sessoes JWT
- PagBank Checkout hospedado
- Groq, Gemini ou OpenRouter no backend do chat, com fallback deterministico
- Railway para deploy

## Setup local

1. Instale dependencias:

```bash
npm install
```

2. Copie variaveis:

```bash
cp .env.example .env
```

3. Configure `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL`.

Variaveis obrigatorias para operar localmente:

- `DATABASE_URL`: URL PostgreSQL.
- `AUTH_SECRET`: segredo forte para NextAuth.
- `NEXT_PUBLIC_APP_URL`: URL publica da aplicacao, normalmente `http://localhost:3000`.
- `NEXTAUTH_URL`: URL base do NextAuth, normalmente `http://localhost:3000`.
- `APP_URL`: URL canonica usada nos links enviados por email.
- `FREIGHT_FIXED_PRICE`: frete fixo em reais, por exemplo `19.90`.
- `ADMIN_SEED_EMAIL`: email do admin criado no seed.
- `ADMIN_SEED_PASSWORD`: senha do admin criado no seed.

Variaveis opcionais no MVP:

- `GOOGLE_CLIENT_ID`: ativa login com Google quando preenchido.
- `GOOGLE_CLIENT_SECRET`: segredo OAuth do Google.
- `AUTH_FACEBOOK_ID`: ativa login com Facebook quando preenchido.
- `AUTH_FACEBOOK_SECRET`: segredo OAuth do Facebook.
- `RESEND_API_KEY`: ativa envio real de confirmacao de email.
- `RESEND_FROM`: remetente verificado no Resend, por exemplo `10PILA <noreply@send.loja.sanderlab.shop>`.
- `RESEND_REPLY_TO`: reply-to opcional para suporte.
- `EMAIL_VERIFICATION_TTL_HOURS`: expira o link de confirmacao, por padrao `24`.
- `PAGBANK_ACCESS_TOKEN`: cria checkout real do PagBank quando preenchido.
- `PAGBANK_WEBHOOK_SECRET`: segredo simples para validar webhook estrutural.
- `PAGBANK_API_URL`: base da API PagBank, por padrao `https://sandbox.api.pagseguro.com`.
- `GROQ_API_KEY`: ativa Groq no backend do chat.
- `GROQ_MODEL`: modelo Groq padrao do assistente.
- `GEMINI_API_KEY`: ativa Gemini no backend do chat.
- `GEMINI_MODEL`: modelo Gemini usado pelo chat, por padrao `gemini-3.1-flash-lite-preview`.
- `OPENROUTER_API_KEY`: ativa OpenRouter no backend do chat.
- `OPENROUTER_MODEL`: modelo OpenRouter usado pelo chat.
- `NEXT_PUBLIC_INSTAGRAM_URL`: link publico do Instagram da loja.
- `NEXT_PUBLIC_TIKTOK_URL`: link publico do TikTok da loja.
- `NEXT_PUBLIC_WHATSAPP_URL`: link publico do WhatsApp da loja.

## Variaveis de ambiente usadas hoje

Obrigatorias agora no Railway:

- `DATABASE_URL`: conexao do PostgreSQL usada pelo Prisma.
- `AUTH_SECRET`: segredo das sessoes/auth.
- `NEXT_PUBLIC_APP_URL`: URL publica usada em links e redirecionamentos.
- `NEXTAUTH_URL`: URL canonica do Auth.js em producao.
- `APP_URL`: URL usada nos links absolutos de confirmacao de email.
- `FREIGHT_FIXED_PRICE`: valor do frete fixo do MVP.
- `ADMIN_SEED_EMAIL`: email do admin usado no seed.
- `ADMIN_SEED_PASSWORD`: senha do admin usada no seed.
- `PAGBANK_API_URL`: base da API do PagBank, hoje em sandbox.
- `PAGBANK_ACCESS_TOKEN`: token do checkout hospedado PagBank.

Obrigatoria quando voce quiser validar assinatura do webhook PagBank:

- `PAGBANK_WEBHOOK_SECRET`: segredo para validar o webhook recebido em `/api/payments/pagbank/webhook`.

Obrigatorias quando voce ativar um ou mais provedores de IA:

- `GROQ_API_KEY`: chave do Groq usada no backend.
- `GROQ_MODEL`: modelo Groq.
- `GEMINI_API_KEY`: chave do Gemini usada no backend.
- `GEMINI_MODEL`: modelo Gemini; se faltar, o codigo cai no default `gemini-3.1-flash-lite-preview`.
- `OPENROUTER_API_KEY`: chave do OpenRouter usada no backend.
- `OPENROUTER_MODEL`: modelo OpenRouter.

Obrigatorias quando voce ativar Google login:

- `GOOGLE_CLIENT_ID`: client ID OAuth.
- `GOOGLE_CLIENT_SECRET`: client secret OAuth.

Obrigatorias quando voce ativar Facebook login:

- `AUTH_FACEBOOK_ID`: App ID do Meta.
- `AUTH_FACEBOOK_SECRET`: App Secret do Meta.

Obrigatorias quando voce ativar confirmacao de email:

- `RESEND_API_KEY`: token da API Resend.
- `RESEND_FROM`: remetente verificado no Resend.
- `APP_URL`: base publica da loja usada no link do email.

Opcionais quando voce quiser ajustar a entrega do email:

- `RESEND_REPLY_TO`: email de resposta.
- `EMAIL_VERIFICATION_TTL_HOURS`: validade do link em horas.

Variaveis de plataforma que o Railway injeta automaticamente, mas o projeto nao depende diretamente como configuracao manual:

- `RAILWAY_ENVIRONMENT`
- `RAILWAY_ENVIRONMENT_ID`
- `RAILWAY_ENVIRONMENT_NAME`
- `RAILWAY_PRIVATE_DOMAIN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_PROJECT_NAME`
- `RAILWAY_PUBLIC_DOMAIN`
- `RAILWAY_SERVICE_10PILA_APP_URL`
- `RAILWAY_SERVICE_ID`
- `RAILWAY_SERVICE_NAME`
- `RAILWAY_STATIC_URL`

4. Rode migration e seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Suba localmente:

```bash
npm run dev
```

## Admin seed

O seed cria um admin com:

- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

Nunca use a senha exemplo em producao.

## Auth

O projeto usa NextAuth com Prisma Adapter configurado. O login por email/senha usa Credentials Provider, entao as sessoes permanecem em JWT, que e o modo suportado por esse provider no NextAuth v4. Os usuarios continuam persistidos no PostgreSQL via Prisma.

Login com Google e Facebook tambem estao estruturados. Para ativar, configure os provedores no ambiente:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
```

Callback autorizado no Google:

```text
http://localhost:3000/api/auth/callback/google
https://10pila-app-production.up.railway.app/api/auth/callback/google
```

Callback autorizado no Meta:

```text
http://localhost:3000/api/auth/callback/facebook
https://10pila-app-production.up.railway.app/api/auth/callback/facebook
```

Sem essas credenciais, os botoes sociais aparecem desativados e o login por email/senha segue funcionando.

O cadastro por email e senha agora envia confirmacao real por email. O login por credenciais so libera depois que `emailVerified` for preenchido. O projeto reutiliza `VerificationToken` do Prisma para os links de confirmacao e usa Resend para a entrega.

## Pagamentos

O checkout salva pedido e pagamento. O MVP usa PagBank Checkout hospedado em sandbox por padrao:

```env
PAGBANK_API_URL=https://sandbox.api.pagseguro.com
PAGBANK_ACCESS_TOKEN=seu-token-sandbox
```

Se `PAGBANK_ACCESS_TOKEN` estiver configurado com um token sandbox liberado, a API cria um Checkout hospedado no PagBank e retorna a URL de redirecionamento. Antes do redirect, a 10PILA mostra uma revisao final do pedido com endereco, itens, total e aviso de pagamento seguro. Sem token, ou se o PagBank recusar a criacao do checkout, o fluxo fica em modo estrutural: pedido salvo, pagamento pendente e aviso claro na tela.

Webhook preparado:

```text
/api/payments/pagbank/webhook
```

Quando receber evento aprovado com `reference_id` do pedido, marca pagamento como aprovado e reduz estoque em transacao idempotente. Se o mesmo pedido ja estiver `PAID`, o estoque nao e reduzido de novo.

## Chat IA

O componente de chat chama `/api/chat`, persiste mensagens e usa um roteador de providers no servidor. A chave nunca vai para o frontend.

O backend do chat combina:

- historico curto da conversa
- rota/pagina atual
- produto atual, quando existir
- produtos relevantes do banco
- promocoes reais
- pedidos do usuario logado, quando a pergunta pede isso

O admin escolhe no painel qual provider sera o principal e quais serao os fallbacks. Hoje o backend suporta Groq, Gemini e OpenRouter free. Se todos falharem, a rota cai em fallback deterministico. Nesse modo o chat continua respondendo com dados reais do banco, sem inventar preco, estoque, promocao, prazo ou status.

No painel admin, o PilaBot tambem aceita modos de comportamento:

- `vendas`: recomenda mais quando houver contexto.
- `suporte`: prioriza clareza e ajuda pratica.
- `equilibrado`: mistura ajuda e sugestao com menos pressao.
- `amigavel`: conversa mais leve, nerd e natural, sem virar personagem.

Quando cita produto, a resposta traz nome, preco, estoque e link clicavel. A UI tambem renderiza cards com botoes "Ver produto" e "Adicionar 1". O chat tenta manter respostas curtas, humanas e contextuais, com quick actions ligadas a conversao sem parecer catalogo.

Identidade do bot na interface:

- nome: `PilaBot`
- subtitulo: `vendedor tech`
- status visivel: `assistente 10PILA`
- loading: `Consultando a loja...`

Variaveis:

```env
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite-preview
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemma-3-12b-it:free
```

## Paginas publicas para OAuth

As paginas publicas abaixo existem em PT-BR para uso inicial com Google/Facebook OAuth:

- `/privacy`
- `/terms`
- `/data-deletion`

Para Facebook Login no Meta App Dashboard, preencha:

- `App Domains`: dominio publico do Railway
- `Valid OAuth Redirect URIs`:
  - `https://10pila-app-production.up.railway.app/api/auth/callback/facebook`
  - `http://localhost:3000/api/auth/callback/facebook`
- `Privacy Policy URL`: `https://10pila-app-production.up.railway.app/privacy`
- `Terms of Service URL`: `https://10pila-app-production.up.railway.app/terms`
- `User Data Deletion URL`: `https://10pila-app-production.up.railway.app/data-deletion`

O codigo fica pronto para o provider, mas publicacao, revisao e liberacao final do app no Meta ainda dependem da configuracao externa no dashboard deles.

## Campanha de indicacao

O MVP agora tem uma base simples de indicacao:

- cada usuario pode ter um codigo proprio
- o link publico aponta para `/auth/register?ref=CODIGO`
- a vinculacao da indicacao entra no cadastro por email e senha
- quando o amigo faz a primeira compra paga acima de `R$ 50`, o indicador recebe um cupom unico de `R$ 10`
- o cupom de indicacao vale por `30 dias`
- o sistema hoje trabalha com `1 cupom por pedido`, entao os bonus nao acumulam no mesmo checkout

A area protegida do usuario para acompanhar isso fica em `/indicacoes`.

## Deploy Railway

1. Crie um projeto Railway com PostgreSQL.
2. Configure as variaveis de `.env.example` no Railway.
3. Execute:

```bash
railway up
```

4. Aplique migration e seed no ambiente conectado, conforme seu fluxo Railway:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## Checks

```bash
npm run lint
npm run build
```

## Fora do MVP

- Frete por transportadora
- Recuperacao de senha
- Login social
- Cupons complexos
- Variantes de produto
- Analytics avancado
- Painel financeiro
- Automacao de email
