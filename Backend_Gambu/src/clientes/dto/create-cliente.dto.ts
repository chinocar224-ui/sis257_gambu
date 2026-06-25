import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { GrupoCliente } from '../entities/cliente.entity';

const emptyToUndefined = ({ value }: { value: unknown }): string | undefined => {
  if (typeof value !== 'string') return value as string | undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export class CreateClienteDto {
  @ApiProperty({ example: 'Cliente de mostrador' })
  @IsNotEmpty({ message: 'El nombre o referencia del cliente es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombre: string;

  @ApiPropertyOptional({ example: 'Rojas' })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  @MaxLength(100, { message: 'El apellido no puede tener más de 100 caracteres' })
  @Transform(emptyToUndefined)
  readonly apellido?: string;

  @ApiPropertyOptional({ example: '72845110' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(20, { message: 'El teléfono no puede tener más de 20 caracteres' })
  @Transform(emptyToUndefined)
  readonly telefono?: string;

  @ApiPropertyOptional({ example: 'ana.rojas@mail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(120, { message: 'El email no puede tener más de 120 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : undefined))
  readonly email?: string;

  @ApiPropertyOptional({ enum: GrupoCliente, example: GrupoCliente.FRECUENTE })
  @IsOptional()
  @IsEnum(GrupoCliente, {
    message: `El grupo debe ser: ${Object.values(GrupoCliente).join(', ')}`,
  })
  readonly grupoCliente?: GrupoCliente;

  @ApiPropertyOptional({ example: 'Av. Las Américas #120' })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  @MaxLength(500, { message: 'La dirección no puede tener más de 500 caracteres' })
  @Transform(emptyToUndefined)
  readonly direccionPrincipal?: string;

  @ApiPropertyOptional({ example: 'Sucre' })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser texto' })
  @MaxLength(50, { message: 'La ciudad no puede tener más de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : 'Sucre'))
  readonly ciudad?: string;

  @ApiPropertyOptional({ example: 'Casa con portón negro, llamar al llegar' })
  @IsOptional()
  @IsString({ message: 'La referencia debe ser texto' })
  @MaxLength(500, { message: 'La referencia no puede tener más de 500 caracteres' })
  @Transform(emptyToUndefined)
  readonly referenciaDireccion?: string;
}
