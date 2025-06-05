import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import * as shortid from 'shortid';

// Mock do shortid
jest.mock('shortid');
const shortidMock = shortid as jest.Mocked<typeof shortid>;

describe('UrlService', () => {
  let urlService: UrlService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock dos dados de teste
  const mockUrl = {
    id: 'url-uuid-123',
    shortCode: 'abc123',
    originalUrl: 'https://www.exemplo.com',
    userId: 'user-uuid-123',
    clickCount: 5,
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockAnonymousUrl = {
    ...mockUrl,
    id: 'url-uuid-456',
    shortCode: 'def456',
    userId: null,
  };

  const mockClick = {
    id: 'click-uuid-123',
    urlId: 'url-uuid-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
  };

  const baseUrl = 'http://localhost:3000';

  beforeEach(async () => {
    // Criar mocks das dependências
    const mockPrismaService = {
      url: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      click: {
        create: jest.fn(),
      },
    } as any;

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    urlService = module.get<UrlService>(UrlService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Configurar mocks padrão
    configService.get.mockReturnValue(baseUrl);
    shortidMock.generate.mockReturnValue('abc123def');

    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('createShortUrl', () => {
    const createUrlDto: CreateUrlDto = {
      originalUrl: 'https://www.exemplo.com',
    };

    it('deve criar URL curta para usuário autenticado com sucesso', async () => {
      // Arrange
      const userId = 'user-uuid-123';
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null); // Código único
      (prismaService.url.create as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      const result = await urlService.createShortUrl(createUrlDto, userId);

      // Assert
      expect(prismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'https://www.exemplo.com/',
          shortCode: 'abc123',
          userId,
        },
      });

      expect(result).toEqual({
        id: mockUrl.id,
        originalUrl: mockUrl.originalUrl,
        shortUrl: `${baseUrl}/abc123`,
        shortCode: 'abc123',
        clickCount: mockUrl.clickCount,
        createdAt: mockUrl.createdAt,
        updatedAt: mockUrl.updatedAt,
      });
    });

    it('deve criar URL curta anônima com sucesso', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.url.create as jest.Mock).mockResolvedValue(
        mockAnonymousUrl,
      );

      // Act
      const result = await urlService.createShortUrl(createUrlDto);

      // Assert
      expect(prismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'https://www.exemplo.com/',
          shortCode: 'abc123',
          userId: undefined,
        },
      });

      expect(result.shortUrl).toBe(`${baseUrl}/abc123`);
    });

    it('deve gerar código único quando há colisão', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUrl) // Primeira tentativa - código existe
        .mockResolvedValueOnce(null); // Segunda tentativa - código único

      shortidMock.generate
        .mockReturnValueOnce('abc123def') // Primeiro código (colide)
        .mockReturnValueOnce('xyz789ghi'); // Segundo código (único)

      (prismaService.url.create as jest.Mock).mockResolvedValue({
        ...mockUrl,
        shortCode: 'xyz789',
      });

      // Act
      const result = await urlService.createShortUrl(createUrlDto);

      // Assert
      expect(prismaService.url.findUnique).toHaveBeenCalledTimes(2);
      expect(shortidMock.generate).toHaveBeenCalledTimes(2);
      expect(result.shortCode).toBe('xyz789');
    });

    it('deve validar e normalizar URL com http', async () => {
      // Arrange
      const httpDto: CreateUrlDto = {
        originalUrl: 'http://exemplo.com',
      };
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.url.create as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      await urlService.createShortUrl(httpDto);

      // Assert
      expect(prismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'http://exemplo.com/',
          shortCode: 'abc123',
          userId: undefined,
        },
      });
    });

    it('deve lançar BadRequestException para URL inválida', async () => {
      // Arrange
      const invalidDto: CreateUrlDto = {
        originalUrl: 'url-invalida',
      };

      // Act & Assert
      await expect(urlService.createShortUrl(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(urlService.createShortUrl(invalidDto)).rejects.toThrow(
        'URL inválida',
      );

      expect(prismaService.url.create).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para protocolo inválido', async () => {
      // Arrange
      const ftpDto: CreateUrlDto = {
        originalUrl: 'ftp://exemplo.com',
      };

      // Act & Assert
      await expect(urlService.createShortUrl(ftpDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(urlService.createShortUrl(ftpDto)).rejects.toThrow(
        'URL deve usar protocolo HTTP ou HTTPS',
      );
    });
  });

  describe('getOriginalUrl', () => {
    it('deve retornar URL original para código válido', async () => {
      // Arrange
      const shortCode = 'abc123';
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      const result = await urlService.getOriginalUrl(shortCode);

      // Assert
      expect(prismaService.url.findUnique).toHaveBeenCalledWith({
        where: {
          shortCode,
          deletedAt: null,
        },
      });

      expect(result).toBe(mockUrl.originalUrl);
    });

    it('deve lançar NotFoundException para código inexistente', async () => {
      // Arrange
      const shortCode = 'inexistente';
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(urlService.getOriginalUrl(shortCode)).rejects.toThrow(
        NotFoundException,
      );
      await expect(urlService.getOriginalUrl(shortCode)).rejects.toThrow(
        'URL não encontrada',
      );
    });
  });

  describe('recordClick', () => {
    const shortCode = 'abc123';
    const ipAddress = '192.168.1.1';
    const userAgent = 'Mozilla/5.0';

    it('deve registrar clique e incrementar contador', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);
      (prismaService.click.create as jest.Mock).mockResolvedValue(mockClick);
      (prismaService.url.update as jest.Mock).mockResolvedValue({
        ...mockUrl,
        clickCount: 6,
      });

      // Act
      const result = await urlService.recordClick(
        shortCode,
        ipAddress,
        userAgent,
      );

      // Assert
      expect(prismaService.url.findUnique).toHaveBeenCalledWith({
        where: {
          shortCode,
          deletedAt: null,
        },
      });

      expect(prismaService.click.create).toHaveBeenCalledWith({
        data: {
          urlId: mockUrl.id,
          ipAddress,
          userAgent,
        },
      });

      expect(prismaService.url.update).toHaveBeenCalledWith({
        where: { id: mockUrl.id },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      });

      expect(result).toBe(mockUrl.originalUrl);
    });

    it('deve registrar clique sem dados opcionais', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);
      (prismaService.click.create as jest.Mock).mockResolvedValue(mockClick);
      (prismaService.url.update as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      const result = await urlService.recordClick(shortCode);

      // Assert
      expect(prismaService.click.create).toHaveBeenCalledWith({
        data: {
          urlId: mockUrl.id,
          ipAddress: undefined,
          userAgent: undefined,
        },
      });

      expect(result).toBe(mockUrl.originalUrl);
    });

    it('deve lançar NotFoundException para código inexistente', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        urlService.recordClick(shortCode, ipAddress, userAgent),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.click.create).not.toHaveBeenCalled();
      expect(prismaService.url.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserUrls', () => {
    const userId = 'user-uuid-123';

    it('deve retornar URLs do usuário ordenadas por data', async () => {
      // Arrange
      const mockUrls = [mockUrl, { ...mockUrl, id: 'url-uuid-456' }];
      (prismaService.url.findMany as jest.Mock).mockResolvedValue(mockUrls);

      // Act
      const result = await urlService.getUserUrls(userId);

      // Assert
      expect(prismaService.url.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockUrl.id,
        originalUrl: mockUrl.originalUrl,
        shortUrl: `${baseUrl}/${mockUrl.shortCode}`,
        shortCode: mockUrl.shortCode,
        clickCount: mockUrl.clickCount,
        createdAt: mockUrl.createdAt,
        updatedAt: mockUrl.updatedAt,
      });
    });

    it('deve retornar array vazio quando usuário não tem URLs', async () => {
      // Arrange
      (prismaService.url.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await urlService.getUserUrls(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateUrl', () => {
    const urlId = 'url-uuid-123';
    const userId = 'user-uuid-123';
    const updateUrlDto: UpdateUrlDto = {
      originalUrl: 'https://www.novo-exemplo.com',
    };

    it('deve atualizar URL com sucesso', async () => {
      // Arrange
      const updatedUrl = {
        ...mockUrl,
        originalUrl: 'https://www.novo-exemplo.com/',
      };

      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);
      (prismaService.url.update as jest.Mock).mockResolvedValue(updatedUrl);

      // Act
      const result = await urlService.updateUrl(urlId, updateUrlDto, userId);

      // Assert
      expect(prismaService.url.findUnique).toHaveBeenCalledWith({
        where: {
          id: urlId,
          deletedAt: null,
        },
      });

      expect(prismaService.url.update).toHaveBeenCalledWith({
        where: { id: urlId },
        data: {
          originalUrl: 'https://www.novo-exemplo.com/',
        },
      });

      expect(result.originalUrl).toBe('https://www.novo-exemplo.com/');
    });

    it('deve lançar NotFoundException para URL inexistente', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        urlService.updateUrl(urlId, updateUrlDto, userId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.url.update).not.toHaveBeenCalled();
    });

    it('deve lançar ForbiddenException para usuário não autorizado', async () => {
      // Arrange
      const unauthorizedUserId = 'outro-user-uuid';
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      // Act & Assert
      await expect(
        urlService.updateUrl(urlId, updateUrlDto, unauthorizedUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        urlService.updateUrl(urlId, updateUrlDto, unauthorizedUserId),
      ).rejects.toThrow('Você não tem permissão para editar esta URL');

      expect(prismaService.url.update).not.toHaveBeenCalled();
    });

    it('deve validar URL antes de atualizar', async () => {
      // Arrange
      const invalidUpdateDto: UpdateUrlDto = {
        originalUrl: 'url-invalida',
      };
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      // Act & Assert
      await expect(
        urlService.updateUrl(urlId, invalidUpdateDto, userId),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.url.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUrl', () => {
    const urlId = 'url-uuid-123';
    const userId = 'user-uuid-123';

    it('deve deletar URL com sucesso (soft delete)', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);
      (prismaService.url.update as jest.Mock).mockResolvedValue({
        ...mockUrl,
        deletedAt: new Date(),
      });

      // Act
      const result = await urlService.deleteUrl(urlId, userId);

      // Assert
      expect(prismaService.url.findUnique).toHaveBeenCalledWith({
        where: {
          id: urlId,
          deletedAt: null,
        },
      });

      expect(prismaService.url.update).toHaveBeenCalledWith({
        where: { id: urlId },
        data: {
          deletedAt: expect.any(Date),
        },
      });

      expect(result).toEqual({
        message: 'URL deletada com sucesso',
      });
    });

    it('deve lançar NotFoundException para URL inexistente', async () => {
      // Arrange
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(urlService.deleteUrl(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.url.update).not.toHaveBeenCalled();
    });

    it('deve lançar ForbiddenException para usuário não autorizado', async () => {
      // Arrange
      const unauthorizedUserId = 'outro-user-uuid';
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      // Act & Assert
      await expect(
        urlService.deleteUrl(urlId, unauthorizedUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        urlService.deleteUrl(urlId, unauthorizedUserId),
      ).rejects.toThrow('Você não tem permissão para deletar esta URL');

      expect(prismaService.url.update).not.toHaveBeenCalled();
    });
  });

  describe('validateAndNormalizeUrl (método privado testado indiretamente)', () => {
    it('deve aceitar URLs com https', async () => {
      // Arrange
      const httpsDto: CreateUrlDto = {
        originalUrl: 'https://exemplo.com/path?param=value',
      };
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.url.create as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      await urlService.createShortUrl(httpsDto);

      // Assert - URL foi normalizada
      expect(prismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'https://exemplo.com/path?param=value',
          shortCode: 'abc123',
          userId: undefined,
        },
      });
    });

    it('deve aceitar URLs com http', async () => {
      // Arrange
      const httpDto: CreateUrlDto = {
        originalUrl: 'http://exemplo.com',
      };
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.url.create as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      await urlService.createShortUrl(httpDto);

      // Assert
      expect(prismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'http://exemplo.com/',
          shortCode: 'abc123',
          userId: undefined,
        },
      });
    });
  });

  describe('integração entre métodos', () => {
    it('deve funcionar fluxo completo: criar -> buscar -> clicar -> listar', async () => {
      // Arrange
      const userId = 'user-uuid-123';
      const createDto: CreateUrlDto = {
        originalUrl: 'https://exemplo.com',
      };

      // Mocks para criação
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.url.create as jest.Mock).mockResolvedValue(mockUrl);

      // Act 1: Criar URL
      const created = await urlService.createShortUrl(createDto, userId);

      // Mocks para busca original
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      // Act 2: Buscar URL original
      const originalUrl = await urlService.getOriginalUrl(created.shortCode);

      // Mocks para clique
      (prismaService.click.create as jest.Mock).mockResolvedValue(mockClick);
      (prismaService.url.update as jest.Mock).mockResolvedValue({
        ...mockUrl,
        clickCount: 6,
      });

      // Act 3: Registrar clique
      await urlService.recordClick(created.shortCode, '192.168.1.1');

      // Mocks para listagem
      (prismaService.url.findMany as jest.Mock).mockResolvedValue([
        { ...mockUrl, clickCount: 6 },
      ]);

      // Act 4: Listar URLs do usuário
      const userUrls = await urlService.getUserUrls(userId);

      // Assert
      expect(created.shortUrl).toBe(`${baseUrl}/${mockUrl.shortCode}`);
      expect(originalUrl).toBe(mockUrl.originalUrl);
      expect(userUrls).toHaveLength(1);
      expect(userUrls[0].shortCode).toBe(mockUrl.shortCode);
    });
  });
});
