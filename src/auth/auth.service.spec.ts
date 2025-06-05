import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

// Mock do bcrypt
jest.mock('bcryptjs');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock dos dados de teste
  const mockUser = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockUserWithPassword = {
    ...mockUser,
    password: 'hashedPassword123',
  };

  const mockToken = 'jwt-token-123';

  beforeEach(async () => {
    // Criar mocks das dependências
    const mockUserService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);

    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'teste@exemplo.com',
      password: 'senha123',
    };

    it('deve registrar um usuário com sucesso', async () => {
      // Arrange
      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(registerDto);
      expect(userService.create).toHaveBeenCalledTimes(1);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        user: mockUser,
        access_token: mockToken,
      });
    });

    it('deve propagar erro quando UserService.create falha', async () => {
      // Arrange
      const errorMessage = 'Usuário já existe com este email';
      userService.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        errorMessage,
      );

      expect(userService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve gerar payload JWT correto', async () => {
      // Arrange
      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      await authService.register(registerDto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'teste@exemplo.com',
      password: 'senha123',
    };

    it('deve fazer login com credenciais válidas', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUserWithPassword);
      bcryptMock.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        access_token: mockToken,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('deve lançar UnauthorizedException com credenciais inválidas', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUserWithPassword);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    const email = 'teste@exemplo.com';
    const password = 'senha123';

    it('deve retornar usuário sem senha quando credenciais são válidas', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUserWithPassword);
      bcryptMock.compare.mockResolvedValue(true as never);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        deletedAt: mockUser.deletedAt,
      });

      expect(userService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        password,
        mockUserWithPassword.password,
      );
    });

    it('deve retornar null quando senha é inválida', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUserWithPassword);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        password,
        mockUserWithPassword.password,
      );
    });

    it('deve retornar null quando usuário não existe', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('deve chamar userService.findByEmail com email correto', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);

      // Act
      await authService.validateUser(email, password);

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith(email);
      expect(userService.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('integração entre métodos', () => {
    it('register deve usar validateUser indiretamente através de UserService', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'novo@exemplo.com',
        password: 'senha123',
      };

      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.access_token).toBe(mockToken);
    });
  });
});
