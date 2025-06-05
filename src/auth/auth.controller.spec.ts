import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Mock dos dados de teste
  const mockUser = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockAuthResponse = {
    user: mockUser,
    access_token: 'jwt-token-123',
  };

  beforeEach(async () => {
    // Criar mock do AuthService
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'teste@exemplo.com',
      password: 'senha123',
    };

    it('deve registrar usuário com sucesso', async () => {
      // Arrange
      authService.register.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await authController.register(registerDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockAuthResponse);
      expect(result.user).toEqual(mockUser);
      expect(result.access_token).toBe('jwt-token-123');
    });

    it('deve propagar ConflictException quando usuário já existe', async () => {
      // Arrange
      authService.register.mockRejectedValue(
        new ConflictException('Usuário já existe com este email'),
      );

      // Act & Assert
      await expect(authController.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authController.register(registerDto)).rejects.toThrow(
        'Usuário já existe com este email',
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('deve chamar AuthService com dados corretos', async () => {
      // Arrange
      const customRegisterDto: RegisterDto = {
        email: 'outro@exemplo.com',
        password: 'outraSenha',
      };
      authService.register.mockResolvedValue(mockAuthResponse);

      // Act
      await authController.register(customRegisterDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(customRegisterDto);
      expect(authService.register).toHaveBeenCalledWith({
        email: 'outro@exemplo.com',
        password: 'outraSenha',
      });
    });

    it('deve retornar estrutura correta de resposta', async () => {
      // Arrange
      authService.register.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await authController.register(registerDto);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('createdAt');
      expect(result.user).toHaveProperty('updatedAt');
      expect(result.user).not.toHaveProperty('password');
    });

    it('deve propagar outros erros do AuthService', async () => {
      // Arrange
      authService.register.mockRejectedValue(
        new Error('Erro interno do servidor'),
      );

      // Act & Assert
      await expect(authController.register(registerDto)).rejects.toThrow(
        'Erro interno do servidor',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'teste@exemplo.com',
      password: 'senha123',
    };

    it('deve fazer login com sucesso', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await authController.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockAuthResponse);
      expect(result.user).toEqual(mockUser);
      expect(result.access_token).toBe('jwt-token-123');
    });

    it('deve propagar UnauthorizedException para credenciais inválidas', async () => {
      // Arrange
      authService.login.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      // Act & Assert
      await expect(authController.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authController.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('deve chamar AuthService com dados corretos', async () => {
      // Arrange
      const customLoginDto: LoginDto = {
        email: 'outro@exemplo.com',
        password: 'outraSenha',
      };
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act
      await authController.login(customLoginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(customLoginDto);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'outro@exemplo.com',
        password: 'outraSenha',
      });
    });

    it('deve retornar estrutura correta de resposta', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await authController.login(loginDto);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('createdAt');
      expect(result.user).toHaveProperty('updatedAt');
      expect(result.user).not.toHaveProperty('password');
    });

    it('deve propagar outros erros do AuthService', async () => {
      // Arrange
      authService.login.mockRejectedValue(
        new Error('Erro interno do servidor'),
      );

      // Act & Assert
      await expect(authController.login(loginDto)).rejects.toThrow(
        'Erro interno do servidor',
      );
    });
  });

  describe('integração de endpoints', () => {
    it('deve ter endpoints independentes que não interferem entre si', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'usuario1@exemplo.com',
        password: 'senha1',
      };
      const loginDto: LoginDto = {
        email: 'usuario2@exemplo.com',
        password: 'senha2',
      };

      authService.register.mockResolvedValue(mockAuthResponse);
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act
      const registerResult = await authController.register(registerDto);
      const loginResult = await authController.login(loginDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(registerResult).toEqual(mockAuthResponse);
      expect(loginResult).toEqual(mockAuthResponse);
    });
  });

  describe('tratamento de DTOs', () => {
    it('deve processar RegisterDto corretamente', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'teste@exemplo.com',
        password: 'senha123',
      };
      authService.register.mockResolvedValue(mockAuthResponse);

      // Act
      await authController.register(registerDto);

      // Assert
      const receivedDto = authService.register.mock.calls[0][0];
      expect(receivedDto).toEqual(registerDto);
      expect(receivedDto.email).toBe('teste@exemplo.com');
      expect(receivedDto.password).toBe('senha123');
    });

    it('deve processar LoginDto corretamente', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'teste@exemplo.com',
        password: 'senha123',
      };
      authService.login.mockResolvedValue(mockAuthResponse);

      // Act
      await authController.login(loginDto);

      // Assert
      const receivedDto = authService.login.mock.calls[0][0];
      expect(receivedDto).toEqual(loginDto);
      expect(receivedDto.email).toBe('teste@exemplo.com');
      expect(receivedDto.password).toBe('senha123');
    });
  });
});
