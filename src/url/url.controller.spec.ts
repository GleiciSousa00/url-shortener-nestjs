import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response, Request } from 'express';

describe('UrlController', () => {
  let urlController: UrlController;
  let urlService: jest.Mocked<UrlService>;

  // Mock dos dados de teste
  const mockUrl = {
    id: 'url-uuid-123',
    originalUrl: 'https://exemplo.com',
    shortUrl: 'http://localhost:3000/abc123',
    shortCode: 'abc123',
    clickCount: 5,
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
  };

  const mockCurrentUser = {
    id: 'user-uuid-123',
    email: 'teste@exemplo.com',
  };

  // Mocks do Express
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
  } as unknown as Response;

  const mockRequest = {
    ip: '192.168.1.1',
    get: jest.fn(),
    protocol: 'http',
    query: {},
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    // Criar mock do UrlService
    const mockUrlService = {
      createShortUrl: jest.fn(),
      getUserUrls: jest.fn(),
      updateUrl: jest.fn(),
      deleteUrl: jest.fn(),
      recordClick: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService,
        },
      ],
    })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    urlController = module.get<UrlController>(UrlController);
    urlService = module.get(UrlService);

    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
    (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
      const headers: any = {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html',
        Referer: 'https://exemplo.com',
        host: 'localhost:3000',
      };
      return headers[header];
    });
  });

  describe('shortenUrl', () => {
    const createUrlDto: CreateUrlDto = {
      originalUrl: 'https://exemplo.com',
    };

    it('deve encurtar URL para usuário autenticado', async () => {
      // Arrange
      urlService.createShortUrl.mockResolvedValue(mockUrl);

      // Act
      const result = await urlController.shortenUrl(
        createUrlDto,
        mockCurrentUser,
      );

      // Assert
      expect(urlService.createShortUrl).toHaveBeenCalledWith(
        createUrlDto,
        mockCurrentUser.id,
      );
      expect(result).toEqual(mockUrl);
    });

    it('deve encurtar URL para usuário anônimo', async () => {
      // Arrange
      urlService.createShortUrl.mockResolvedValue(mockUrl);

      // Act
      const result = await urlController.shortenUrl(createUrlDto);

      // Assert
      expect(urlService.createShortUrl).toHaveBeenCalledWith(
        createUrlDto,
        undefined,
      );
      expect(result).toEqual(mockUrl);
    });

    it('deve chamar serviço com parâmetros corretos', async () => {
      // Arrange
      const customDto: CreateUrlDto = {
        originalUrl: 'https://outro-exemplo.com',
      };
      urlService.createShortUrl.mockResolvedValue(mockUrl);

      // Act
      await urlController.shortenUrl(customDto, mockCurrentUser);

      // Assert
      expect(urlService.createShortUrl).toHaveBeenCalledWith(
        customDto,
        mockCurrentUser.id,
      );
    });

    it('deve propagar erros do UrlService', async () => {
      // Arrange
      urlService.createShortUrl.mockRejectedValue(new Error('URL inválida'));

      // Act & Assert
      await expect(
        urlController.shortenUrl(createUrlDto, mockCurrentUser),
      ).rejects.toThrow('URL inválida');
    });

    it('deve funcionar com usuário undefined', async () => {
      // Arrange
      urlService.createShortUrl.mockResolvedValue(mockUrl);

      // Act
      const result = await urlController.shortenUrl(createUrlDto, undefined);

      // Assert
      expect(urlService.createShortUrl).toHaveBeenCalledWith(
        createUrlDto,
        undefined,
      );
      expect(result).toEqual(mockUrl);
    });
  });

  describe('getUserUrls', () => {
    const mockUrls = [mockUrl, { ...mockUrl, id: 'url-uuid-456' }];

    it('deve retornar URLs do usuário autenticado', async () => {
      // Arrange
      urlService.getUserUrls.mockResolvedValue(mockUrls);

      // Act
      const result = await urlController.getUserUrls(mockCurrentUser);

      // Assert
      expect(urlService.getUserUrls).toHaveBeenCalledWith(mockCurrentUser.id);
      expect(result).toEqual(mockUrls);
    });

    it('deve chamar serviço com ID correto', async () => {
      // Arrange
      const differentUser = {
        id: 'another-user-uuid',
        email: 'outro@exemplo.com',
      };
      urlService.getUserUrls.mockResolvedValue([]);

      // Act
      await urlController.getUserUrls(differentUser);

      // Assert
      expect(urlService.getUserUrls).toHaveBeenCalledWith('another-user-uuid');
    });

    it('deve propagar erros do UrlService', async () => {
      // Arrange
      urlService.getUserUrls.mockRejectedValue(new Error('Erro interno'));

      // Act & Assert
      await expect(urlController.getUserUrls(mockCurrentUser)).rejects.toThrow(
        'Erro interno',
      );
    });
  });

  describe('updateUrl', () => {
    const urlId = 'url-uuid-123';
    const updateUrlDto: UpdateUrlDto = {
      originalUrl: 'https://novo-exemplo.com',
    };

    it('deve atualizar URL com sucesso', async () => {
      // Arrange
      const updatedUrl = {
        ...mockUrl,
        originalUrl: 'https://novo-exemplo.com',
      };
      urlService.updateUrl.mockResolvedValue(updatedUrl);

      // Act
      const result = await urlController.updateUrl(
        urlId,
        updateUrlDto,
        mockCurrentUser,
      );

      // Assert
      expect(urlService.updateUrl).toHaveBeenCalledWith(
        urlId,
        updateUrlDto,
        mockCurrentUser.id,
      );
      expect(result).toEqual(updatedUrl);
    });

    it('deve chamar serviço com parâmetros corretos', async () => {
      // Arrange
      urlService.updateUrl.mockResolvedValue(mockUrl);

      // Act
      await urlController.updateUrl(urlId, updateUrlDto, mockCurrentUser);

      // Assert
      expect(urlService.updateUrl).toHaveBeenCalledWith(
        'url-uuid-123',
        updateUrlDto,
        'user-uuid-123',
      );
    });

    it('deve propagar erros do UrlService', async () => {
      // Arrange
      urlService.updateUrl.mockRejectedValue(new Error('URL não encontrada'));

      // Act & Assert
      await expect(
        urlController.updateUrl(urlId, updateUrlDto, mockCurrentUser),
      ).rejects.toThrow('URL não encontrada');
    });
  });

  describe('deleteUrl', () => {
    const urlId = 'url-uuid-123';

    it('deve deletar URL com sucesso', async () => {
      // Arrange
      const deleteResult = { message: 'URL deletada com sucesso' };
      urlService.deleteUrl.mockResolvedValue(deleteResult);

      // Act
      const result = await urlController.deleteUrl(urlId, mockCurrentUser);

      // Assert
      expect(urlService.deleteUrl).toHaveBeenCalledWith(
        urlId,
        mockCurrentUser.id,
      );
      expect(result).toEqual(deleteResult);
    });

    it('deve chamar serviço com parâmetros corretos', async () => {
      // Arrange
      urlService.deleteUrl.mockResolvedValue({
        message: 'URL deletada com sucesso',
      });

      // Act
      await urlController.deleteUrl(urlId, mockCurrentUser);

      // Assert
      expect(urlService.deleteUrl).toHaveBeenCalledWith(
        'url-uuid-123',
        'user-uuid-123',
      );
    });

    it('deve propagar erros do UrlService', async () => {
      // Arrange
      urlService.deleteUrl.mockRejectedValue(new Error('Permissão negada'));

      // Act & Assert
      await expect(
        urlController.deleteUrl(urlId, mockCurrentUser),
      ).rejects.toThrow('Permissão negada');
    });
  });

  describe('redirect', () => {
    const shortCode = 'abc123';
    const originalUrl = 'https://exemplo.com';

    beforeEach(() => {
      // Reset mocks específicos do redirect
      jest.clearAllMocks();
    });

    it('deve redirecionar para URL original com sucesso', async () => {
      // Arrange
      urlService.recordClick.mockResolvedValue(originalUrl);
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'User-Agent') return 'Mozilla/5.0';
        if (header === 'Accept') return 'text/html';
        if (header === 'Referer') return 'https://exemplo.com';
        if (header === 'host') return 'localhost:3000';
        return undefined;
      });

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(urlService.recordClick).toHaveBeenCalledWith(
        shortCode,
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.FOUND,
        originalUrl,
      );
    });

    it('deve registrar clique com IP e User-Agent', async () => {
      // Arrange
      urlService.recordClick.mockResolvedValue(originalUrl);

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(urlService.recordClick).toHaveBeenCalledWith(
        'abc123',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('deve normalizar URL sem protocolo', async () => {
      // Arrange
      const urlWithoutProtocol = 'exemplo.com';
      urlService.recordClick.mockResolvedValue(urlWithoutProtocol);

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.FOUND,
        'https://exemplo.com',
      );
    });

    it('deve retornar JSON para requisições do Swagger', async () => {
      // Arrange
      urlService.recordClick.mockResolvedValue(originalUrl);
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'User-Agent') return 'swagger-ui';
        if (header === 'Accept') return 'application/json';
        if (header === 'Referer') return 'http://localhost:3000/api';
        if (header === 'host') return 'localhost:3000';
        return undefined;
      });

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Redirecionamento simulado para o Swagger',
          originalUrl,
          shortCode,
          redirectUrl: originalUrl,
          clickRegistered: true,
        }),
      );
    });

    it('deve retornar 404 quando URL não existe', async () => {
      // Arrange
      urlService.recordClick.mockRejectedValue(new Error('URL não encontrada'));

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'URL encurtada não encontrada',
        error: 'Not Found',
      });
    });

    it('deve retornar 400 para URL de destino inválida', async () => {
      // Arrange
      const invalidUrl = 'ht tp://invalid space.com';
      urlService.recordClick.mockResolvedValue(invalidUrl);

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'URL de destino inválida',
        error: 'Bad Request',
      });
    });

    it('deve retornar 500 para erros internos', async () => {
      // Arrange
      urlService.recordClick.mockRejectedValue(new Error('Erro interno'));

      // Act
      await urlController.redirect(shortCode, mockResponse, mockRequest);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Erro interno do servidor',
        error: 'Internal Server Error',
      });
    });

    it('deve detectar requisições AJAX', async () => {
      // Arrange
      urlService.recordClick.mockResolvedValue(originalUrl);
      const ajaxRequest = {
        ...mockRequest,
        headers: { 'x-requested-with': 'XMLHttpRequest' },
      };

      // Act
      await urlController.redirect(
        shortCode,
        mockResponse,
        ajaxRequest as unknown as Request,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('deve lidar com parâmetro preview=true', async () => {
      // Arrange
      urlService.recordClick.mockResolvedValue(originalUrl);
      const previewRequest = {
        ...mockRequest,
        query: { preview: 'true' },
      };

      // Act
      await urlController.redirect(
        shortCode,
        mockResponse,
        previewRequest as unknown as Request,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('integração de endpoints', () => {
    it('deve funcionar fluxo completo: criar -> listar -> atualizar -> deletar', async () => {
      // Arrange
      const createDto: CreateUrlDto = { originalUrl: 'https://exemplo.com' };
      const updateDto: UpdateUrlDto = {
        originalUrl: 'https://novo-exemplo.com',
      };

      urlService.createShortUrl.mockResolvedValue(mockUrl);
      urlService.getUserUrls.mockResolvedValue([mockUrl]);
      urlService.updateUrl.mockResolvedValue({
        ...mockUrl,
        originalUrl: updateDto.originalUrl,
      });
      urlService.deleteUrl.mockResolvedValue({
        message: 'URL deletada com sucesso',
      });

      // Act
      const created = await urlController.shortenUrl(
        createDto,
        mockCurrentUser,
      );
      const listed = await urlController.getUserUrls(mockCurrentUser);
      const updated = await urlController.updateUrl(
        created.id,
        updateDto,
        mockCurrentUser,
      );
      const deleted = await urlController.deleteUrl(
        created.id,
        mockCurrentUser,
      );

      // Assert
      expect(created).toEqual(mockUrl);
      expect(listed).toContain(mockUrl);
      expect(updated.originalUrl).toBe(updateDto.originalUrl);
      expect(deleted.message).toBe('URL deletada com sucesso');
    });
  });

  describe('validação de parâmetros', () => {
    it('deve lidar com DTOs vazios adequadamente', async () => {
      // Arrange
      urlService.createShortUrl.mockResolvedValue(mockUrl);
      const emptyDto = {} as CreateUrlDto;

      // Act
      const result = await urlController.shortenUrl(emptyDto, mockCurrentUser);

      // Assert
      expect(urlService.createShortUrl).toHaveBeenCalledWith(
        emptyDto,
        mockCurrentUser.id,
      );
      expect(result).toEqual(mockUrl);
    });

    it('deve processar IDs corretamente', async () => {
      // Arrange
      urlService.updateUrl.mockResolvedValue(mockUrl);
      const updateDto: UpdateUrlDto = { originalUrl: 'https://exemplo.com' };

      // Act
      await urlController.updateUrl('test-id', updateDto, mockCurrentUser);

      // Assert
      expect(urlService.updateUrl).toHaveBeenCalledWith(
        'test-id',
        updateDto,
        mockCurrentUser.id,
      );
    });
  });
});
