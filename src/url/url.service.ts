import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import * as shortid from 'shortid';

@Injectable()
export class UrlService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private validateAndNormalizeUrl(url: string): string {
    try {
      // Tentar criar um objeto URL para validar
      const urlObj = new URL(url);

      // Verificar se o protocolo é válido
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new BadRequestException('URL deve usar protocolo HTTP ou HTTPS');
      }

      return urlObj.toString();
    } catch (error) {
      // Se o erro já é BadRequestException, relança-lo
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Senão é erro de URL inválida
      throw new BadRequestException('URL inválida');
    }
  }

  async createShortUrl(createUrlDto: CreateUrlDto, userId?: string) {
    // Validar e normalizar a URL
    const normalizedUrl = this.validateAndNormalizeUrl(
      createUrlDto.originalUrl,
    );

    let shortCode: string;
    let isUnique = false;

    // Gerar código único de 6 caracteres
    while (!isUnique) {
      shortCode = shortid.generate().substring(0, 6);

      const existingUrl = await this.prisma.url.findUnique({
        where: {
          shortCode,
          deletedAt: null,
        },
      });

      if (!existingUrl) {
        isUnique = true;
      }
    }

    const url = await this.prisma.url.create({
      data: {
        originalUrl: normalizedUrl,
        shortCode,
        userId,
      },
    });

    const baseUrl = this.configService.get<string>('BASE_URL');

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortUrl: `${baseUrl}/${shortCode}`,
      shortCode,
      clickCount: url.clickCount,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }

  async getOriginalUrl(shortCode: string) {
    const url = await this.prisma.url.findUnique({
      where: {
        shortCode,
        deletedAt: null,
      },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    return url.originalUrl;
  }

  async recordClick(shortCode: string, ipAddress?: string, userAgent?: string) {
    const url = await this.prisma.url.findUnique({
      where: {
        shortCode,
        deletedAt: null,
      },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    // Registrar o clique
    await this.prisma.click.create({
      data: {
        urlId: url.id,
        ipAddress,
        userAgent,
      },
    });

    // Incrementar contador de cliques
    await this.prisma.url.update({
      where: { id: url.id },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    return url.originalUrl;
  }

  async getUserUrls(userId: string) {
    const urls = await this.prisma.url.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const baseUrl = this.configService.get<string>('BASE_URL');

    return urls.map(url => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      shortCode: url.shortCode,
      clickCount: url.clickCount,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    }));
  }

  async updateUrl(id: string, updateUrlDto: UpdateUrlDto, userId: string) {
    // Validar e normalizar a nova URL
    const normalizedUrl = this.validateAndNormalizeUrl(
      updateUrlDto.originalUrl,
    );

    const url = await this.prisma.url.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    if (url.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta URL',
      );
    }

    const updatedUrl = await this.prisma.url.update({
      where: { id },
      data: {
        originalUrl: normalizedUrl,
      },
    });

    const baseUrl = this.configService.get<string>('BASE_URL');

    return {
      id: updatedUrl.id,
      originalUrl: updatedUrl.originalUrl,
      shortUrl: `${baseUrl}/${updatedUrl.shortCode}`,
      shortCode: updatedUrl.shortCode,
      clickCount: updatedUrl.clickCount,
      createdAt: updatedUrl.createdAt,
      updatedAt: updatedUrl.updatedAt,
    };
  }

  async deleteUrl(id: string, userId: string) {
    const url = await this.prisma.url.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    if (url.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta URL',
      );
    }

    // Soft delete
    await this.prisma.url.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'URL deletada com sucesso' };
  }
}
