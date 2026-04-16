# 10PILA

E-commerce MVP de importados tech com Next.js, TypeScript, App Router, Tailwind, Prisma, PostgreSQL, Auth.js/NextAuth, PagBank Checkout sandbox e chat IA com Gemini usando dados reais da loja.

## Stack

- Next.js + TypeScript + App Router
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth com email e senha, Prisma Adapter e sessoes JWT
- PagBank Checkout hospedado
- Gemini no backend para o chat, com fallback deterministico
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
- `NEXTAUTH_URL`: URL base do NextAuth, normalmente `http://localhost:3000`.
- `NEXT_PUBLIC_APP_URL`: URL publica da aplicacao, normalmente `http://localhost:3000`.
- `FREIGHT_FIXED_PRICE`: frete fixo em reais, por exemplo `19.90`.
- `ADMIN_SEED_EMAIL`: email do admin criado no seed.
- `ADMIN_SEED_PASSWORD`: senha do admin criado no seed.

Variaveis opcionais no MVP:

- `GOOGLE_CLIENT_ID`: ativa login com Google quando preenchido.
- `GOOGLE_CLIENT_SECRET`: segredo OAuth do Google.
- `PAGBANK_ACCESS_TOKEN`: cria checkout real do PagBank quando preenchido.
- `PAGBANK_WEBHOOK_SECRET`: segredo simples para validar webhook estrutural.
- `PAGBANK_API_URL`: base da API PagBank, por padrao `https://sandbox.api.pagseguro.com`.
- `GEMINI_API_KEY`: ativa resposta generativa do chat no backend.
- `GEMINI_MODEL`: modelo Gemini usado pelo chat, por padrao `gemini-3.1-flash-lite-preview`.

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

Login com Google tambem esta estruturado. Para ativar, crie credenciais OAuth no Google Cloud e configure:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Callback autorizado no Google:

```text
http://localhost:3000/api/auth/callback/google
https://10pila-app-production.up.railway.app/api/auth/callback/google
```

Sem essas credenciais, o botao de Google aparece desativado e o login por email/senha segue funcionando.

O MVP valida formato de email e senha, mas ainda nao envia verificacao real por email. A base tem `emailVerified` e `VerificationToken` no Prisma para evoluir essa etapa depois com um servico de email.

## Pagamentos

O checkout salva pedido e pagamento. O MVP usa PagBank Checkout hospedado em sandbox por padrao:

```env
PAGBANK_API_URL=https://sandbox.api.pagseguro.com
PAGBANK_ACCESS_TOKEN=seu-token-sandbox
```

Se `PAGBANK_ACCESS_TOKEN` estiver configurado com um token sandbox liberado, a API cria um Checkout hospedado no PagBank e retorna a URL de redirecionamento. Sem token, ou se o PagBank recusar a criacao do checkout, o fluxo fica em modo estrutural: pedido salvo, pagamento pendente e aviso claro na tela.

Webhook preparado:

```text
/api/payments/pagbank/webhook
```

Quando receber evento aprovado com `reference_id` do pedido, marca pagamento como aprovado e reduz estoque em transacao idempotente. Se o mesmo pedido ja estiver `PAID`, o estoque nao e reduzido de novo.

## Chat IA

O componente de chat chama `/api/chat`, persiste mensagens e usa Gemini no servidor quando `GEMINI_API_KEY` esta configurada. A key nunca deve ir para o frontend. A rota monta contexto real do banco e mantem fallback deterministico quando a API falha ou a credencial falta.

- produtos
- promocoes
- pedidos do usuario logado
- fallback honesto quando faltar dado

Quando cita produto, a resposta inclui nome, preco, estoque e link clicavel para a pagina do item. A UI tambem renderiza cards com botoes "Ver produto" e "Adicionar 1". A busca usa termos da mensagem e o produto da pagina atual para evitar resposta vaga, sem inventar preco, estoque, prazo ou status.

Variaveis:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite-preview
```

## Paginas publicas para OAuth

As paginas `/privacy` e `/terms` existem em PT-BR para uso inicial com Google OAuth e explicam conta, pedidos, pagamento e chat do MVP.

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
