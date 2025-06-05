import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl, Matches } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description:
      'URL original a ser encurtada (deve começar com http:// ou https://)',
    example:
      'https://teddy360.com.br/material/marco-legal-das-garantias-sancionado-entenda-o-que-muda/',
  })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message:
        'URL deve ter um formato válido e começar com http:// ou https://',
    },
  )
  @IsNotEmpty({ message: 'URL é obrigatória' })
  @Matches(/^https?:\/\/.+/, {
    message: 'URL deve começar com http:// ou https://',
  })
  originalUrl: string;
}
