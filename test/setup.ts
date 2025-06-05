// src/test/setup.ts - Configuração global para todos os testes
import { Test } from '@nestjs/testing';

// Configuração global do Jest para NestJS
beforeAll(async () => {
  // Configura timezone para garantir consistência em diferentes ambientes
  process.env.TZ = 'UTC';

  // Configura variáveis de ambiente para testes
  process.env.NODE_ENV = 'test';

  // Suprime logs durante os testes para output mais limpo
  // Você pode comentar essas linhas se precisar ver logs durante desenvolvimento
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

// Configuração que roda antes de cada teste individual
beforeEach(() => {
  // Limpa todos os mocks antes de cada teste
  jest.clearAllMocks();
});

// Configuração que roda após cada teste
afterEach(() => {
  // Restaura implementações originais após cada teste
  jest.restoreAllMocks();
});

// Configuração global que roda após todos os testes
afterAll(async () => {
  // Aguarda um pouco para garantir que todas as operações assíncronas terminaram
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Helper functions úteis para testes NestJS
export const createTestingModule = async (
  imports: any[],
  providers: any[] = [],
) => {
  const moduleBuilder = Test.createTestingModule({
    imports,
    providers,
  });

  return moduleBuilder.compile();
};

// Mock factory para Prisma Client - útil para testes unitários
export const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  url: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Adicione outros modelos do seu schema Prisma aqui
};

// Configurações específicas para testes de integração
export const testDatabaseConfig = {
  url:
    process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb',
};
