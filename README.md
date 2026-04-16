# 10PILA

E-commerce MVP de importados tech com Next.js, TypeScript, App Router, Tailwind, Prisma, PostgreSQL, Auth.js/NextAuth, Mercado Pago Checkout Pro estrutural e chat IA preparado para consultar dados da loja.

## Stack

- Next.js + TypeScript + App Router
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth com email e senha, Prisma Adapter e sessoes JWT
- Mercado Pago Checkout Pro
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

- `MERCADOPAGO_ACCESS_TOKEN`: cria preferencia real do Checkout Pro quando preenchido.
- `MERCADOPAGO_WEBHOOK_SECRET`: segredo simples para validar webhook estrutural.
- `OPENAI_API_KEY`: reservado para evoluir o chat para OpenAI Responses API.

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

O projeto usa NextAuth com Prisma Adapter configurado. Como o login do MVP e por email/senha via Credentials Provider, as sessoes permanecem em JWT, que e o modo suportado por esse provider no NextAuth v4. Os usuarios continuam persistidos no PostgreSQL via Prisma.

## Pagamentos

O checkout salva pedido e pagamento. Se `MERCADOPAGO_ACCESS_TOKEN` estiver configurado, a API cria uma preferencia Checkout Pro e retorna a URL de redirecionamento. Sem token, o fluxo fica em modo estrutural: pedido salvo, pagamento pendente e aviso claro na tela.

Webhook preparado:

```text
/api/payments/mercadopago/webhook
```

Quando receber evento aprovado com `external_reference` do pedido, marca pagamento como aprovado e reduz estoque em transacao idempotente. Se o mesmo pedido ja estiver `PAID`, o estoque nao e reduzido de novo.

## Chat IA

O componente de chat chama `/api/chat`, persiste mensagens e responde com base no banco:

- produtos
- promocoes
- pedidos do usuario logado
- fallback honesto quando faltar dado

`OPENAI_API_KEY` esta reservado para evoluir a rota para OpenAI Responses API. O MVP atual evita inventar informacao porque usa respostas deterministicas do backend.

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
