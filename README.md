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
- `FREIGHT_FIXED_PRICE`: frete fixo em reais, por exemplo `19.90`.
- `ADMIN_SEED_EMAIL`: email do admin criado no seed.
- `ADMIN_SEED_PASSWORD`: senha do admin criado no seed.

Variaveis opcionais no MVP:

- `GOOGLE_CLIENT_ID`: ativa login com Google quando preenchido.
- `GOOGLE_CLIENT_SECRET`: segredo OAuth do Google.
- `PAGBANK_ACCESS_TOKEN`: cria checkout real do PagBank quando preenchido.
- `PAGBANK_WEBHOOK_SECRET`: segredo simples para validar webhook estrutural.
- `PAGBANK_API_URL`: base da API PagBank, por padrao `https://sandbox.api.pagseguro.com`.
- `GROQ_API_KEY`: ativa Groq no backend do chat.
- `GROQ_MODEL`: modelo Groq padrao do assistente.
- `GEMINI_API_KEY`: ativa Gemini no backend do chat.
- `GEMINI_MODEL`: modelo Gemini usado pelo chat, por padrao `gemini-3.1-flash-lite-preview`.
- `OPENROUTER_API_KEY`: ativa OpenRouter no backend do chat.
- `OPENROUTER_MODEL`: modelo OpenRouter usado pelo chat.

## Variaveis de ambiente usadas hoje

Obrigatorias agora no Railway:

- `DATABASE_URL`: conexao do PostgreSQL usada pelo Prisma.
- `AUTH_SECRET`: segredo das sessoes/auth.
- `NEXT_PUBLIC_APP_URL`: URL publica usada em links e redirecionamentos.
- `NEXTAUTH_URL`: URL canonica do Auth.js em producao.
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
