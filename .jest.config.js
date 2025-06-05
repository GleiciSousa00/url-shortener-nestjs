// jest.config.js - Configuração avançada para NestJS e CI/CD
module.exports = {
  // Configuração base para TypeScript
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Extensões de arquivo que o Jest deve reconhecer
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Configuração de onde encontrar os testes
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',

  // Transformação de arquivos TypeScript
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Configuração de coverage (cobertura de código)
  collectCoverageFrom: [
    '**/*.(t|j)s',
    // Exclui arquivos que não precisam de cobertura
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/main.ts', // Arquivo de bootstrap geralmente não testado
    '!**/*.module.ts', // Módulos do NestJS são principalmente configuração
  ],

  // Onde salvar os relatórios de coverage
  coverageDirectory: '../coverage',

  // Formatos de relatório de coverage
  coverageReporters: [
    'text', // Mostra no terminal
    'text-summary', // Resumo no terminal
    'html', // Relatório HTML navegável
    'lcov', // Para integração com Codecov/Coveralls
    'json', // Para processamento programático
  ],

  // Limites mínimos de coverage - o CI falhará se não atingir
  coverageThreshold: {
    global: {
      branches: 70, // 70% das branches devem ser cobertas
      functions: 75, // 75% das funções devem ser testadas
      lines: 75, // 75% das linhas devem ser cobertas
      statements: 75, // 75% dos statements devem ser testados
    },
  },

  // Configuração de módulos - importante para NestJS
  moduleNameMapping: {
    // Permite usar paths absolutos configurados no tsconfig.json
    '^src/(.*)$': '<rootDir>/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Setup files que rodam antes dos testes
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Configurações de performance para CI
  maxWorkers: '50%', // Usa 50% dos cores disponíveis
  cache: true, // Habilita cache para acelerar reruns
  clearMocks: true, // Limpa mocks entre testes
  restoreMocks: true, // Restaura implementações originais

  // Configuração específica para NestJS
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true, // Melhora performance
    },
  },

  // Ignora arquivos/pastas específicas
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Configuração de timeout para testes mais lentos (database, etc.)
  testTimeout: 30000, // 30 segundos
};
