import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import * as bcrypt from 'bcryptjs';

// Mock do bcrypt
jest.mock('bcryptjs');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let userService: UserService;
  let prismaService: jest.Mocked<PrismaService>;

  // Mock dos dados de teste
  const mockUser = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockUserWithoutPassword = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    // Criar mock do PrismaService
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);

    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('create', () => {
    const registerDto: RegisterDto = {
      email: 'teste@exemplo.com',
      password: 'senha123',
    };

    it('deve criar usuário com sucesso', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null); // Usuário não existe
      bcryptMock.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.create(registerDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(bcryptMock.hash).toHaveBeenCalledWith(registerDto.password, 10);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: 'hashedPassword123',
        },
      });

      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar ConflictException quando usuário já existe', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(userService.create(registerDto)).rejects.toThrow(
        'Usuário já existe com este email',
      );

      expect(bcryptMock.hash).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('deve hashear a senha corretamente', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await userService.create(registerDto);

      // Assert
      expect(bcryptMock.hash).toHaveBeenCalledWith('senha123', 10);
    });

    it('deve remover senha do retorno', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.create(registerDto);

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('deve propagar erro do Prisma', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockRejectedValue(
        new Error('Erro de banco de dados'),
      );

      // Act & Assert
      await expect(userService.create(registerDto)).rejects.toThrow(
        'Erro de banco de dados',
      );
    });
  });

  describe('findByEmail', () => {
    const email = 'teste@exemplo.com';

    it('deve retornar usuário quando encontrado', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.findByEmail(email);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email,
          deletedAt: null,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando usuário não existe', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userService.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });

    it('deve aplicar filtro de soft delete', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      await userService.findByEmail(email);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email,
          deletedAt: null,
        },
      });
    });
  });

  describe('findById', () => {
    const userId = 'user-uuid-123';

    it('deve retornar usuário sem senha quando encontrado', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
          deletedAt: null,
        },
      });

      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.findById(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(userService.findById(userId)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('deve aplicar filtro de soft delete', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await userService.findById(userId);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
          deletedAt: null,
        },
      });
    });

    it('deve remover senha do retorno quando usuário existe', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        deletedAt: mockUser.deletedAt,
      });
    });
  });

  describe('integração entre métodos', () => {
    it('deve criar usuário e depois conseguir encontrá-lo por email', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'novo@exemplo.com',
        password: 'senha123',
      };

      // Mock para criação
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // Para verificação de existência
        .mockResolvedValueOnce(mockUser); // Para busca por email

      bcryptMock.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act 1: Criar usuário
      const created = await userService.create(registerDto);

      // Act 2: Buscar por email
      const found = await userService.findByEmail(registerDto.email);

      // Assert
      expect(created).not.toHaveProperty('password');
      expect(found).toHaveProperty('password'); // findByEmail retorna com senha
      expect(created.email).toBe(found.email);
    });

    it('deve criar usuário e depois conseguir encontrá-lo por ID', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'novo@exemplo.com',
        password: 'senha123',
      };

      // Mock para criação
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // Para verificação de existência
        .mockResolvedValueOnce(mockUser); // Para busca por ID

      bcryptMock.hash.mockResolvedValue('hashedPassword123' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Act 1: Criar usuário
      const created = await userService.create(registerDto);

      // Act 2: Buscar por ID
      const found = await userService.findById(created.id);

      // Assert
      expect(created).not.toHaveProperty('password');
      expect(found).not.toHaveProperty('password'); // findById remove senha
      expect(created.id).toBe(found.id);
      expect(created.email).toBe(found.email);
    });
  });
});
