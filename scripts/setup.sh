#!/bin/bash

echo "🚀 Configurando ambiente do URL Shortener..."

# Copiar arquivo de ambiente se não existir
if [ ! -f ".env" ]; then
    echo "📋 Copiando arquivo de configuração..."
    cp env.example .env
    echo "✅ Arquivo .env criado! Ajuste as variáveis conforme necessário."
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Subir o banco de dados
echo "🐘 Iniciando PostgreSQL..."
docker-compose up -d db

# Aguardar o banco ficar disponível
echo "⏳ Aguardando PostgreSQL ficar disponível..."
sleep 10

# Executar migrações
echo "🗄️ Executando migrações do banco..."
npx prisma migrate dev --name init

# Build da aplicação
echo "🔨 Compilando aplicação..."
npm run build

echo "✅ Setup concluído!"
echo "🚀 Para iniciar a aplicação em desenvolvimento, execute: npm run start:dev"
echo "📚 Documentação estará disponível em: http://localhost:3000/api" 