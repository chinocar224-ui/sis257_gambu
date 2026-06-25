import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }): string | undefined => {
  if (typeof value !== 'string') return value as string | undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export class CreateDireccionEnvioDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El cliente es obligatorio' })
  @IsInt({ message: 'El id del cliente debe ser un número entero' })
  @Min(1, { message: 'El id del cliente debe ser un número positivo' })
  @Type(() => Number)
  readonly idCliente: number;

  @ApiProperty({ example: 'Av. Hernando Siles #123, entre calles 5 y 6' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(500, { message: 'La dirección no puede tener más de 500 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly direccion: string;

  @ApiPropertyOptional({ example: 'Sucre' })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La ciudad no puede tener más de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : 'Sucre'))
  readonly ciudad?: string;

  @ApiPropertyOptional({ example: 'Frente al parque, portón verde' })
  @IsOptional()
  @IsString({ message: 'Las indicaciones deben ser una cadena de texto' })
  @MaxLength(500, { message: 'Las indicaciones no pueden tener más de 500 caracteres' })
  @Transform(emptyToUndefined)
  readonly indicacionesReferencia?: string;
}
