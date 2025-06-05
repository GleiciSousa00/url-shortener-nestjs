# Exemplos Práticos de Uso da API

## Endpoint `/shorten` - Encurtamento de URLs

O endpoint `/shorten` é único e permite tanto usuários **autenticados** quanto **anônimos** encurtarem URLs.

### 📝 Como Funciona

- **Usuário anônimo**: A URL é criada sem associação a nenhum usuário
- **Usuário autenticado**: A URL é automaticamente associada ao usuário logado

---

## 🔓 Usuário Anônimo (Sem Autenticação)

### Encurtar URL sem login

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://teddy360.com.br/material/marco-legal-das-garantias-sancionado-entenda-o-que-muda/"
  }'
```

### Resposta esperada:

```json
{
  "id": "uuid-gerado",
  "originalUrl": "https://teddy360.com.br/material/marco-legal-das-garantias-sancionado-entenda-o-que-muda/",
  "shortUrl": "http://localhost:3000/aZbKq7",
  "shortCode": "aZbKq7",
  "clickCount": 0,
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**⚠️ Importante**: URLs criadas anonimamente não podem ser editadas ou excluídas posteriormente.

---

## 🔐 Usuário Autenticado

### 1. Primeiro, faça login para obter o token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### Resposta do login:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "updatedAt": "2024-01-01T09:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Encurtar URL com autenticação

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "originalUrl": "https://exemplo.com/minha-url-longa"
  }'
```

### Resposta esperada:

```json
{
  "id": "uuid-gerado",
  "originalUrl": "https://exemplo.com/minha-url-longa",
  "shortUrl": "http://localhost:3000/Xm9K2p",
  "shortCode": "Xm9K2p",
  "clickCount": 0,
  "createdAt": "2024-01-01T10:35:00.000Z",
  "updatedAt": "2024-01-01T10:35:00.000Z"
}
```

**✅ Vantagens**: URLs criadas por usuários autenticados podem ser:

- Listadas via `GET /urls`
- Editadas via `PUT /urls/:id`
- Excluídas via `DELETE /urls/:id`

---

## 📊 Gerenciamento de URLs (Apenas Usuários Autenticados)

### Listar suas URLs

```bash
curl -X GET http://localhost:3000/urls \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Atualizar uma URL

```bash
curl -X PUT http://localhost:3000/urls/ID_DA_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "originalUrl": "https://nova-url-destino.com"
  }'
```

### Deletar uma URL (soft delete)

```bash
curl -X DELETE http://localhost:3000/urls/ID_DA_URL \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

## 🔄 Redirecionamento e Contabilização

### Acessar URL encurtada (para todos)

```bash
# Será redirecionado automaticamente
curl -L http://localhost:3000/aZbKq7

# Ou direto no navegador
# http://localhost:3000/aZbKq7
```

**📈 Contabilização**: Cada acesso é automaticamente contabilizado:

- Incrementa o `clickCount`
- Registra IP e User-Agent
- Funciona para URLs criadas por usuários autenticados e anônimos

---

## 🎯 Casos de Uso

### 1. **Marketing Público**

- Links em redes sociais
- QR codes em materiais impressos
- Campanhas de email marketing
- **Uso**: Sem autenticação

### 2. **Gestão Empresarial**

- Controle de URLs internas
- Relatórios de cliques
- Gerenciamento centralizado
- **Uso**: Com autenticação

### 3. **Uso Pessoal**

- Organização de links favoritos
- Compartilhamento controlado
- Histórico pessoal
- **Uso**: Com autenticação

---

## 🔒 Segurança

- URLs anônimas são **públicas** por natureza
- URLs autenticadas pertencem **exclusivamente** ao usuário
- Soft delete preserva dados para auditoria
- Validação rigorosa de URLs de entrada
- Rate limiting pode ser implementado
