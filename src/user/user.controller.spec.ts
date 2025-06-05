import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let userService: jest.Mocked<UserService>;

  // Mock dos dados de teste
  const mockUser = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockCurrentUser = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
  };

  beforeEach(async () => {
    // Criar mock do UserService
    const mockUserService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true), // Mock do guard sempre permite
      })
      .compile();

    userController = module.get<UserController>(UserController);
    userService = module.get(UserService);

    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userController.getProfile(mockCurrentUser);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(mockCurrentUser.id);
      expect(userService.findById).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe(mockCurrentUser.id);
      expect(result.email).toBe(mockCurrentUser.email);
    });

    it('deve usar ID do usuário atual corretamente', async () => {
      // Arrange
      const differentUser = {
        id: 'different-user-uuid',
        email: 'outro@exemplo.com',
      };
      userService.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getProfile(differentUser);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(differentUser.id);
      expect(userService.findById).toHaveBeenCalledWith('different-user-uuid');
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      // Arrange
      userService.findById.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      // Act & Assert
      await expect(userController.getProfile(mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(userController.getProfile(mockCurrentUser)).rejects.toThrow(
        'Usuário não encontrado',
      );

      expect(userService.findById).toHaveBeenCalledWith(mockCurrentUser.id);
    });

    it('deve retornar usuário sem senha', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userController.getProfile(mockCurrentUser);

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('deve propagar outros erros do UserService', async () => {
      // Arrange
      userService.findById.mockRejectedValue(
        new Error('Erro interno do servidor'),
      );

      // Act & Assert
      await expect(userController.getProfile(mockCurrentUser)).rejects.toThrow(
        'Erro interno do servidor',
      );
    });

    it('deve funcionar com diferentes formatos de usuário atual', async () => {
      // Arrange
      const userWithExtraData = {
        id: 'user-uuid-123',
        email: 'teste@exemplo.com',
        iat: 1234567890,
        exp: 1234567999,
        sub: 'user-uuid-123',
      };
      userService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userController.getProfile(userWithExtraData);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userWithExtraData.id);
      expect(result).toEqual(mockUser);
    });

    it('deve retornar dados atualizados do banco', async () => {
      // Arrange
      const updatedUser = {
        ...mockUser,
        email: 'email-atualizado@exemplo.com',
        updatedAt: new Date('2024-01-02T10:00:00.000Z'),
      };
      userService.findById.mockResolvedValue(updatedUser);

      // Act
      const result = await userController.getProfile(mockCurrentUser);

      // Assert
      expect(result.email).toBe('email-atualizado@exemplo.com');
      expect(result.updatedAt).toEqual(new Date('2024-01-02T10:00:00.000Z'));
      expect(result).toEqual(updatedUser);
    });
  });

  describe('integração com guards e decorators', () => {
    it('deve extrair usuário do decorator CurrentUser corretamente', async () => {
      // Arrange
      const userFromToken = {
        id: 'token-user-uuid',
        email: 'token@exemplo.com',
        iat: 1234567890,
        exp: 1234567999,
      };
      userService.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getProfile(userFromToken);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith('token-user-uuid');
    });

    it('deve funcionar apenas com ID do usuário', async () => {
      // Arrange
      const minimalUser = { id: 'minimal-user-uuid' };
      userService.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getProfile(minimalUser as any);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith('minimal-user-uuid');
    });
  });

  describe('tratamento de parâmetros', () => {
    it('deve lidar com usuário null', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userController.getProfile(null as any)).rejects.toThrow();
    });

    it('deve lidar com usuário undefined', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        userController.getProfile(undefined as any),
      ).rejects.toThrow();
    });

    it('deve lidar com usuário sem ID', async () => {
      // Arrange
      const userWithoutId = { email: 'sem-id@exemplo.com' };
      userService.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getProfile(userWithoutId as any);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(undefined);
    });
  });

  describe('consistência de retorno', () => {
    it('deve manter formato consistente entre diferentes chamadas', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act
      const result1 = await userController.getProfile(mockCurrentUser);
      const result2 = await userController.getProfile(mockCurrentUser);

      // Assert
      expect(result1).toEqual(result2);
      expect(userService.findById).toHaveBeenCalledTimes(2);
    });

    it('deve retornar estrutura esperada pelo Swagger', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userController.getProfile(mockCurrentUser);

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
