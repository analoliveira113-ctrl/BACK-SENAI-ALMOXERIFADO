# 📦 Backend - Controle de Estoque SENAI

API REST desenvolvida em **Node.js**, **Express** e **Supabase** para gerenciamento do sistema de controle de estoque.

## 🚀 Tecnologias utilizadas

Node.js
Express
Supabase
CORS
Dotenv

---

# 📂 Estrutura do projeto

BACK-SENAI-ALMOXERIFADO/
│
├── api/
│   └── index.js          # Rotas da API
│
├── server.js             # Inicialização do servidor
├── package.json
├── package-lock.json
├── schema.sql            # Estrutura do banco de dados
├── .env                  # Variáveis de ambiente
├── vercel.json
└── README.md

---

# ⚙️ Instalação

Clone o repositório:

bash
git clone <URL_DO_REPOSITORIO>

Entre na pasta:

bash
cd BACK-SENAI-ALMOXERIFADO

Instale as dependências:

bash
npm install

---

# ▶️ Executando o projeto

Para iniciar o servidor:

bash
npm start

O servidor será iniciado na porta definida no arquivo .env.

Caso utilize desenvolvimento com atualização automática (se disponível):

bash
npm run dev

---

# 🔐 Configuração do arquivo .env

Crie um arquivo chamado .env na raiz do projeto contendo:

env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_KEY=SUA_CHAVE_DO_SUPABASE

PORT=3000
NODE_ENV=production

### Descrição das variáveis

| Variável | Descrição |
|----------|-----------|
| SUPABASE_URL | URL do projeto no Supabase |
| SUPABASE_KEY | Chave de acesso ao Supabase |
| PORT | Porta utilizada pelo servidor |
| NODE_ENV | Ambiente da aplicação |

 Caso o projeto utilize Google Sheets em vez de Supabase, substitua essas variáveis pelas credenciais da API do Google Sheets.

---

# 📌 Rotas

As rotas da API estão implementadas em:

api/index.js

O arquivo server.js é responsável por inicializar o servidor e carregar as rotas.

---

# 🗄️ Banco de dados

A estrutura do banco encontra-se em:

schema.sql
Esse arquivo pode ser utilizado para recriar as tabelas no Supabase.

---

# 📦 Dependências

express
@supabase/supabase-js
cors
dotenv

---

# 👨‍💻 Desenvolvido por

Projeto desenvolvido para o SENAI como parte das atividades de desenvolvimento de sistemas.
