import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'Administrador' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El nombre del rol no puede tener más de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombreRol: string;
}
