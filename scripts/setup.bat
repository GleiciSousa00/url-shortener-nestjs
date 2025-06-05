@echo off
echo 🚀 Configurando ambiente do URL Shortener...

REM Copiar arquivo de ambiente se não existir
if not exist ".env" (
    echo 📋 Copiando arquivo de configuração...
    copy env.example .env
    echo ✅ Arquivo .env criado! Ajuste as variáveis conforme necessário.
)

REM Instalar dependências
echo 📦 Instalando dependências...
npm install

REM Gerar cliente Prisma
echo 🔧 Gerando cliente Prisma...
npx prisma generate

REM Subir o banco de dados
echo 🐘 Iniciando PostgreSQL...
docker-compose up -d db

REM Aguardar o banco ficar disponível
echo ⏳ Aguardando PostgreSQL ficar disponível...
timeout /t 10 /nobreak

REM Executar migrações
echo 🗄️ Executando migrações do banco...
npx prisma migrate dev --name init

REM Build da aplicação
echo 🔨 Compilando aplicação...
npm run build

echo ✅ Setup concluído!
echo 🚀 Para iniciar a aplicação em desenvolvimento, execute: npm run start:dev
echo 📚 Documentação estará disponível em: http://localhost:3000/api
pause 