# Backend SENAI - Controle de Estoque

## Instalação

```bash
npm install
npm start
```

Servidor:

`http://localhost:3000`

Teste:

`GET /api/health`

## Banco

Execute `schema.sql` inteiro no SQL Editor do Supabase.

## Variáveis

O `.env` já está configurado com as credenciais fornecidas.

Nunca publique o `.env` no GitHub.

## Rotas

- GET /api/health
- GET /api/familias
- POST /api/familias
- GET /api/tipos?familia_codigo=001
- POST /api/tipos
- GET /api/produtos
- GET /api/produtos?busca=texto
- GET /api/produtos/:sku
- POST /api/produtos
- POST /api/movimentacoes/entrada
- POST /api/movimentacoes/saida
- GET /api/historico

## Cadastro de produto

```json
{
  "familia_codigo": "001",
  "tipo_codigo": "001",
  "nome": "Contratos RH 2026",
  "descricao": "Documentos arquivados",
  "localizacao": "Estante B, Prateleira 3",
  "quantidade": 1,
  "estoque_minimo": 1
}
```

O PostgreSQL gera o SKU automaticamente no formato `FFF.TTT.SSSS`.

## Entrada

```json
{
  "produto_sku": "001.001.0001",
  "quantidade": 5,
  "responsavel": "Operador"
}
```

## Saída

```json
{
  "produto_sku": "001.001.0001",
  "quantidade": 2,
  "responsavel": "Operador",
  "motivo": "Consulta"
}
```

Saída acima do saldo retorna HTTP 400 com `Saldo insuficiente`.

## Observação sobre a chave

A chave fornecida é uma `sb_publishable_`. Ela não é uma `service_role`/secret key. Por isso o `schema.sql` configura RLS e permissões para as operações usadas pela API.

Para produção real com dados do SENAI, recomenda-se Supabase Auth e policies baseadas no usuário/perfil.


## Deploy na Vercel

Este backend está preparado para a Vercel usando `api/index.js` como função serverless.

### 1. Suba o projeto para o GitHub

Não envie `.env`. Use `.env.example` apenas como modelo.

### 2. Importe o repositório na Vercel

Na Vercel:

1. `Add New Project`
2. Selecione o repositório.
3. Framework Preset: `Other`
4. Build Command: deixe vazio.
5. Output Directory: deixe vazio.
6. Deploy.

### 3. Configure as variáveis de ambiente

Em `Project Settings > Environment Variables`, crie:

```text
SUPABASE_URL
SUPABASE_KEY
```

Use os valores do seu projeto Supabase.

Depois faça um novo deploy.

### 4. URL da API

Depois do deploy, a URL será parecida com:

```text
https://seu-projeto.vercel.app
```

Health check:

```text
https://seu-projeto.vercel.app/api/health
```

No frontend, use a URL da Vercel como base:

```javascript
const API_URL = "https://seu-projeto.vercel.app/api";
```

Não use `localhost` no frontend publicado.

### 5. Importante sobre Vercel

A Vercel executa o Express como função serverless. Por isso o projeto possui:

```text
api/index.js
```

Esse arquivo exporta o `app` do `server.js`.

O `server.js` continua funcionando localmente com:

```bash
npm start
```

mas, na Vercel, não é necessário executar `app.listen()` manualmente.
