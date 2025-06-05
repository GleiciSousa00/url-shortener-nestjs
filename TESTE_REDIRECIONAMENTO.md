# 🔄 Teste de Redirecionamento - Correções Aplicadas

## ✅ Problemas Corrigidos

### 1. **CORS**

- Configuração específica do CORS no `main.ts`
- Headers apropriados para redirecionamento

### 2. **Validação de URL**

- URLs devem obrigatoriamente começar com `http://` ou `https://`
- Validação robusta no DTO e no serviço
- Normalização automática de URLs

### 3. **Tratamento de Erros**

- Tratamento específico para URLs inválidas
- Respostas HTTP apropriadas
- Headers de cache controlados

---

## 🧪 Como Testar

### 1. Inicie a aplicação

```bash
npm run start:dev
```

### 2. Registre um usuário (opcional)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123"
  }'
```

### 3. Encurte uma URL válida

```bash
# URL COM protocolo (correto)
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://www.google.com"
  }'
```

**Resposta esperada:**

```json
{
  "id": "uuid-gerado",
  "originalUrl": "https://www.google.com/",
  "shortUrl": "http://localhost:3000/Xm9K2p",
  "shortCode": "Xm9K2p",
  "clickCount": 0,
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

### 4. Teste o redirecionamento

#### No navegador:

- Acesse: `http://localhost:3000/Xm9K2p`
- Deve redirecionar automaticamente para `https://www.google.com`

#### Via cURL:

```bash
# Seguir redirecionamentos
curl -L http://localhost:3000/Xm9K2p

# Ver apenas os headers de redirecionamento
curl -I http://localhost:3000/Xm9K2p
```

**Headers esperados:**

```
HTTP/1.1 302 Found
Location: https://www.google.com/
Cache-Control: no-cache
```

---

## ❌ Casos de Erro Tratados

### 1. URL sem protocolo

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "www.google.com"
  }'
```

**Resposta:**

```json
{
  "statusCode": 400,
  "message": [
    "URL deve ter um formato válido e começar com http:// ou https://"
  ],
  "error": "Bad Request"
}
```

### 2. URL inválida

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "invalid-url"
  }'
```

### 3. Short code não existe

```bash
curl -I http://localhost:3000/INEXISTENTE
```

**Resposta:**

```json
{
  "statusCode": 404,
  "message": "URL encurtada não encontrada",
  "error": "Not Found"
}
```

---

## 🔍 Verificação de Cliques

### 1. Crie uma URL

```bash
RESPONSE=$(curl -s -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com"}')

SHORT_CODE=$(echo $RESPONSE | jq -r '.shortCode')
echo "Short code: $SHORT_CODE"
```

### 2. Acesse várias vezes

```bash
# Acesse 3 vezes
curl -s -L http://localhost:3000/$SHORT_CODE > /dev/null
curl -s -L http://localhost:3000/$SHORT_CODE > /dev/null
curl -s -L http://localhost:3000/$SHORT_CODE > /dev/null
```

### 3. Verifique contabilização (se for usuário autenticado)

```bash
curl -X GET http://localhost:3000/urls \
  -H "Authorization: Bearer SEU_TOKEN"
```

Deve mostrar `clickCount: 3`

---

## 🚀 Funcionalidades Implementadas

- ✅ **Redirecionamento HTTP 302** funcionando
- ✅ **CORS configurado** para desenvolvimento
- ✅ **Validação rigorosa** de URLs de entrada
- ✅ **Normalização automática** de URLs
- ✅ **Tratamento de erros** específico
- ✅ **Contabilização de cliques** precisa
- ✅ **Headers apropriados** para cache e redirecionamento
- ✅ **Compatibilidade** com navegadores e cURL

---

## 📝 Notas Importantes

1. **URLs devem ter protocolo**: Sempre use `https://` ou `http://`
2. **Redirecionamento é automático**: Status 302 + header Location
3. **Cliques são contabilizados**: Mesmo para URLs anônimas
4. **Cache controlado**: Header `Cache-Control: no-cache`
5. **CORS habilitado**: Funciona via JavaScript/fetch

---

## 🔧 Swagger/OpenAPI

Acesse a documentação interativa:

- URL: http://localhost:3000/api
- Teste diretamente na interface
- Veja exemplos de requisições e respostas
