import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('URLs')
@Controller()
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Post('shorten')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Encurtar URL',
    description:
      'Qualquer pessoa pode encurtar uma URL através deste endpoint único. Se o usuário estiver autenticado (com Bearer Token), a URL será associada ao usuário. Se não estiver autenticado, a URL será criada anonimamente.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'URL encurtada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-url' },
        originalUrl: {
          type: 'string',
          example: 'https://exemplo.com/muito-longa',
        },
        shortUrl: { type: 'string', example: 'http://localhost:3000/aZbKq7' },
        shortCode: { type: 'string', example: 'aZbKq7' },
        clickCount: { type: 'number', example: 0 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida ou dados de entrada incorretos',
  })
  async shortenUrl(
    @Body() createUrlDto: CreateUrlDto,
    @CurrentUser() user?: any,
  ) {
    return this.urlService.createShortUrl(createUrlDto, user?.id);
  }

  @Get('urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar URLs do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de URLs do usuário',
    schema: {
      example: [
        {
          id: 'uuid',
          originalUrl: 'https://exemplo.com/muito-longa',
          shortUrl: 'http://localhost:3000/aZbKq7',
          shortCode: 'aZbKq7',
          clickCount: 5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async getUserUrls(@CurrentUser() user: any) {
    return this.urlService.getUserUrls(user.id);
  }

  @Put('urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar URL encurtada' })
  @ApiParam({ name: 'id', description: 'ID da URL' })
  @ApiResponse({
    status: 200,
    description: 'URL atualizada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar esta URL',
  })
  async updateUrl(
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @CurrentUser() user: any,
  ) {
    return this.urlService.updateUrl(id, updateUrlDto, user.id);
  }

  @Delete('urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar URL encurtada (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID da URL' })
  @ApiResponse({
    status: 200,
    description: 'URL deletada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar esta URL',
  })
  async deleteUrl(@Param('id') id: string, @CurrentUser() user: any) {
    return this.urlService.deleteUrl(id, user.id);
  }

  @Get(':shortCode')
  @ApiOperation({ summary: 'Redirecionar para URL original' })
  @ApiParam({
    name: 'shortCode',
    description: 'Código da URL encurtada',
    example: 'aZbKq7',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirecionamento para URL original',
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  async redirect(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const originalUrl = await this.urlService.recordClick(
        shortCode,
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
      );

      let validUrl = originalUrl.trim();

      if (!validUrl.match(/^https?:\/\//i)) {
        validUrl = `https://${validUrl}`;
      }

      // Validar se a URL é válida
      try {
        new URL(validUrl);
      } catch {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: 400,
          message: 'URL de destino inválida',
          error: 'Bad Request',
        });
      }

      const userAgent = req.get('User-Agent') || '';
      const acceptHeader = req.get('Accept') || '';
      const referer = req.get('Referer') || '';

      if (
        userAgent.includes('swagger') ||
        acceptHeader.includes('application/json') ||
        referer.includes('/api') ||
        referer.includes('swagger') ||
        req.query.preview === 'true' ||
        req.headers['x-requested-with'] === 'XMLHttpRequest'
      ) {
        return res.status(HttpStatus.OK).json({
          message: 'Redirecionamento simulado para o Swagger',
          originalUrl: validUrl,
          shortCode: shortCode,
          redirectUrl: validUrl,
          clickRegistered: true,
          note:
            'Para testar o redirecionamento real, acesse a URL diretamente no navegador: ' +
            `${req.protocol}://${req.get('host')}/${shortCode}`,
        });
      }

      return res.redirect(HttpStatus.FOUND, validUrl);
    } catch (error) {
      if (error.message === 'URL não encontrada') {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'URL encurtada não encontrada',
          error: 'Not Found',
        });
      }

      // eslint-disable-next-line no-console
      console.error('Erro no redirecionamento:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: 'Erro interno do servidor',
        error: 'Internal Server Error',
      });
    }
  }
}
