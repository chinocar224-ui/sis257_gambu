import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsInt({ message: 'El id del rol debe ser un número entero' })
  @Min(1, { message: 'El id del rol debe ser un número positivo' })
  @Type(() => Number)
  readonly idRol: number;

  @ApiProperty({ example: 'jperez' })
  @IsNotEmpty({ message: 'El usuario es obligatorio' })
  @IsString({ message: 'El usuario debe ser una cadena de texto' })
  @MaxLength(15, { message: 'El usuario no puede tener más de 15 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly usuario: string;

  @ApiProperty({ example: 'MiClave123' })
  @IsNotEmpty({ message: 'La clave es obligatoria' })
  @IsString({ message: 'La clave debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La clave no puede tener más de 100 caracteres' })
  readonly clave: string;

  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El apellido no puede tener más de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly apellido: string;

  @ApiProperty({ example: 'jperez@gambu.com' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(60, { message: 'El email no puede tener más de 60 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly email: string;

  @ApiPropertyOptional({ example: '70123456' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede tener más de 20 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly telefono?: string;
}
