import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateUrlDto {
  @ApiProperty({
    description: 'Nova URL de destino',
    example: 'https://novo-destino.com.br',
  })
  @IsUrl({}, { message: 'URL deve ter um formato válido' })
  @IsNotEmpty({ message: 'URL é obrigatória' })
  originalUrl: string;
}
