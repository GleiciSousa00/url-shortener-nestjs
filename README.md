# URL Shortener API

Sistema de encurtamento de URLs desenvolvido com NestJS, Prisma e PostgreSQL.

## 🚀 Funcionalidades

- ✅ Encurtamento de URLs para no máximo 6 caracteres
- ✅ URLs encurtadas funcionam com e sem autenticação
- ✅ Sistema de autenticação com JWT
- ✅ Usuários autenticados podem gerenciar suas URLs
- ✅ Contabilização de cliques em tempo real
- ✅ Soft delete (exclusão lógica)
- ✅ API REST documentada com Swagger
- ✅ Validação de entrada completa
- ✅ Docker Compose para ambiente completo
- ✅ **34 testes unitários** com 100% cobertura dos métodos públicos
- ✅ **CI/CD completo** com GitHub Actions (testes + deploy)
- ✅ **Infraestrutura como código** com Terraform (Google Cloud)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- **Para Docker**: Docker e Docker Compose
- **Para desenvolvimento local**: PostgreSQL 15+

## 🛠️ Como Rodar o Projeto

### Opção 1: Com Docker (Recomendado)

#### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd url-shortener-api
```

#### 2. Execute o script de setup

```bash
# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh

# Windows
scripts\setup.bat
```

#### 3. Inicie a aplicação

```bash
npm run start:dev
```

### Opção 2: Sem Docker (Desenvolvimento Local)

#### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd url-shortener-api
```

#### 2. Instale as dependências

```bash
npm install
```

#### 3. Configure o PostgreSQL local

Certifique-se de ter o PostgreSQL rodando e crie um banco:

```sql
CREATE DATABASE url_shortener_db;
CREATE USER url_shortener WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE url_shortener_db TO url_shortener;
```

#### 4. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Ajuste as variáveis no .env conforme sua configuração local
```

#### 5. Execute as migrações

```bash
npx prisma generate
npx prisma migrate dev --name init
```

#### 6. Inicie a aplicação

```bash
npm run start:dev
```

### Opção 3: Docker Compose Completo

```bash
# Suba o ambiente completo
docker-compose up -d

# A aplicação estará disponível em http://localhost:3000
```

## 📚 Documentação da API

A documentação Swagger estará disponível em: http://localhost:3000/api

## 🔗 Endpoints Principais

### Autenticação

- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login

### URLs

- `POST /shorten` - Encurtar URL (público ou autenticado)
- `GET /urls` - Listar URLs do usuário autenticado
- `PUT /urls/:id` - Atualizar URL encurtada
- `DELETE /urls/:id` - Deletar URL encurtada
- `GET /:shortCode` - Redirecionar para URL original

### Usuário

- `GET /users/profile` - Obter perfil do usuário

## 💡 Exemplos de Uso

### 1. Registrar um usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### 2. Fazer login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### 3. Encurtar uma URL (sem autenticação)

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://teddy360.com.br/material/marco-legal-das-garantias-sancionado-entenda-o-que-muda/"
  }'
```

### 4. Encurtar uma URL (com autenticação)

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "originalUrl": "https://exemplo.com/url-muito-longa"
  }'
```

### 5. Listar URLs do usuário

```bash
curl -X GET http://localhost:3000/urls \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 6. Atualizar uma URL

```bash
curl -X PUT http://localhost:3000/urls/ID_DA_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "originalUrl": "https://nova-url.com"
  }'
```

### 7. Deletar uma URL

```bash
curl -X DELETE http://localhost:3000/urls/ID_DA_URL \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 8. Acessar URL encurtada

```bash
curl -L http://localhost:3000/aZbKq7
```

## 🗃️ Estrutura do Banco de Dados

### Tabela `users`

- `id` - UUID único
- `email` - Email único do usuário
- `password` - Senha hasheada
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização
- `deletedAt` - Data de exclusão (soft delete)

### Tabela `urls`

- `id` - UUID único
- `shortCode` - Código encurtado (6 caracteres)
- `originalUrl` - URL original
- `userId` - ID do usuário (opcional)
- `clickCount` - Contador de cliques
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização
- `deletedAt` - Data de exclusão (soft delete)

### Tabela `clicks`

- `id` - UUID único
- `urlId` - ID da URL
- `ipAddress` - IP do visitante
- `userAgent` - User Agent do navegador
- `createdAt` - Data do clique

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm run test
npm run test:e2e

# Linting
npm run lint

# Formatação
npm run format

# Prisma
npm run prisma:migrate    # Executar migrações
npm run prisma:generate   # Gerar cliente
npm run prisma:studio     # Interface visual do banco
npm run prisma:push       # Enviar schema para banco
```

## 🌟 Características Técnicas

- **Framework**: NestJS
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT
- **Validação**: class-validator
- **Documentação**: Swagger/OpenAPI
- **Containerização**: Docker
- **Arquitetura**: REST API com maturidade nível 2

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Autenticação via JWT com expiração de 7 dias
- Validação de entrada em todas as rotas
- Soft delete para preservar dados
- CORS habilitado
- Rate limiting (pode ser implementado)

## 🚦 Variáveis de Ambiente

| Variável       | Descrição                       | Padrão                |
| -------------- | ------------------------------- | --------------------- |
| `DATABASE_URL` | String de conexão do PostgreSQL | -                     |
| `JWT_SECRET`   | Chave secreta para assinar JWTs | -                     |
| `PORT`         | Porta da aplicação              | 3000                  |
| `BASE_URL`     | URL base para URLs encurtadas   | http://localhost:3000 |

## 📈 Escalabilidade

O sistema foi projetado para escalar verticalmente:

- Uso de índices no banco de dados
- Queries otimizadas
- Estrutura modular
- Stateless (sem estado na aplicação)
- Pool de conexões do Prisma

## ⚡ Performance

- Código encurtado de apenas 6 caracteres
- Índices únicos para buscas rápidas
- Soft delete para manter histórico
- Contabilização de cliques otimizada
- Cache pode ser implementado (Redis)

## 🧪 Testes Unitários Completos

### 📊 Cobertura Atual
- **34 testes implementados** ✅
- **AuthService**: 11 testes (registro, login, validação)
- **UrlService**: 23 testes (CRUD, validação, cliques)
- **100% dos métodos públicos** cobertos

### 🔧 Executar Testes

```bash
# Todos os testes
npm run test

# Testes específicos
npm test src/auth/auth.service.spec.ts
npm test src/url/url.service.spec.ts

# Modo watch (desenvolvimento)
npm run test:watch

# Com cobertura detalhada
npm run test:cov

# Testes end-to-end
npm run test:e2e
```

### 🎯 Arquitetura de Testes
- **Padrão AAA** (Arrange, Act, Assert)
- **Mocking completo** de dependências
- **Isolamento** entre testes
- **Cenários de erro** cobertos
- **Dados consistentes** e realistas

## 🔍 Desenvolvimento

### Estrutura de Arquivos

```
src/
├── auth/                 # Módulo de autenticação
│   ├── dto/             # Data Transfer Objects
│   ├── guards/          # Guards de autenticação
│   ├── strategies/      # Estratégias Passport
│   ├── decorators/      # Decorators customizados
│   └── *.spec.ts        # 11 testes unitários
├── user/                # Módulo de usuários
├── url/                 # Módulo de URLs
│   └── *.spec.ts        # 23 testes unitários
├── prisma/              # Módulo Prisma
├── .github/workflows/   # CI/CD pipelines
├── terraform/           # Infraestrutura como código
├── test/               # Testes e2e
└── main.ts             # Ponto de entrada
```

### Padrões Utilizados

- **DTO Pattern**: Para validação de entrada
- **Repository Pattern**: Via Prisma ORM
- **Guard Pattern**: Para autenticação/autorização
- **Decorator Pattern**: Para extração de dados
- **Module Pattern**: Estrutura modular do NestJS

## 🐛 Troubleshooting

### Docker não está disponível

Use a Opção 2 para executar com PostgreSQL local.

### Erro de conexão com banco

Verifique se o PostgreSQL está rodando e as credenciais no `.env` estão corretas.

### Erro de migração

Execute `npx prisma db push` para sincronizar o schema sem migrations.

### Porta já em uso

Altere a variável `PORT` no arquivo `.env`.

## 🚀 GitHub Actions (CI/CD)

### 📋 Workflows Configurados

#### 1. CI Pipeline (`.github/workflows/ci.yml`)
- **Triggers**: Push para `main`/`develop` e Pull Requests
- **Ambiente**: Ubuntu + PostgreSQL 15
- **Etapas**:
  - ✅ Verificação de formatação (Prettier)
  - ✅ Análise de código (ESLint)
  - ✅ Testes unitários completos
  - ✅ Build da aplicação
  - ✅ Geração do cliente Prisma

#### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)
- **Trigger**: Merge na branch `main`
- **Suporte para múltiplas plataformas**:
  - Heroku
  - Railway
  - DigitalOcean App Platform
  - VPS customizado
  - Docker Registry
- **Recursos**:
  - Migrações automáticas de banco
  - Notificações no Slack
  - Rollback em caso de falha

### ⚙️ Configuração de Secrets

Configure no GitHub → Settings → Secrets:

```bash
# Banco de dados
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Deploy (escolha a plataforma)
HEROKU_API_KEY=...
RAILWAY_TOKEN=...
DO_ACCESS_TOKEN=...

# Notificações
SLACK_WEBHOOK_URL=...
```

## ☁️ Infraestrutura com Terraform

### 🏗️ Arquitetura Google Cloud

A infraestrutura completa é provisionada automaticamente via Terraform:

#### **Recursos Provisionados**
- **VPC Network** personalizada com subnet
- **Cloud SQL PostgreSQL** (instância + banco + usuário)
- **Compute Engine** (Ubuntu 22.04 + Node.js 20)
- **Firewall Rules** (HTTP, HTTPS, SSH, porta customizada)
- **Nginx** como reverse proxy

#### **Configuração Automática**
- ✅ Node.js 20.x instalado
- ✅ Aplicação NestJS configurada
- ✅ Nginx como proxy reverso
- ✅ Serviço systemd para auto-restart
- ✅ Logs centralizados

### 🚀 Como Usar o Terraform

#### 1. Pré-requisitos
```bash
# Instalar Terraform
# Ter conta no Google Cloud Platform
# Criar service account e baixar JSON key
```

#### 2. Configuração
```bash
cd terraform/

# Copiar service account key
cp /path/to/your-key.json service-account-key.json

# Configurar variáveis
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars com seus valores
```

#### 3. Deploy
```bash
# Inicializar Terraform
terraform init

# Validar configuração
terraform validate

# Ver o que será criado
terraform plan

# Aplicar infraestrutura
terraform apply
```

#### 4. Acessar Aplicação
```bash
# Obter IP da aplicação
terraform output application_ip

# Acessar via navegador
http://SEU_IP_PUBLICO
```

### 💰 Estimativa de Custos
- **Cloud SQL (db-f1-micro)**: ~$9/mês
- **Compute Engine (e2-micro)**: ~$6/mês
- **Rede/Storage**: ~$2/mês
- **Total estimado**: ~$17/mês

## ⚡ Deploy Rápido

### Opção 1: GitHub Actions (Recomendado)
1. Configure os secrets no GitHub
2. Faça push para `main`
3. Aguarde o deploy automático

### Opção 2: Terraform Manual
```bash
cd terraform/
terraform init
terraform apply
```

### Opção 3: Docker Compose Local
```bash
docker-compose up -d
```

## 📄 Licença

Este projeto está sob licença privada.
