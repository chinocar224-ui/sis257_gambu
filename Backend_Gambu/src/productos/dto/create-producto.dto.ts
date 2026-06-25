import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductoDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsInt({ message: 'El id de la categoría debe ser un número entero' })
  @Min(1, { message: 'El id de la categoría debe ser un número positivo' })
  @Type(() => Number)
  readonly idCategoria: number;

  @ApiProperty({ example: 'Lomo Saltado' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombre: string;

  @ApiPropertyOptional({ example: 'Delicioso lomo saltado con papas y arroz' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(1000, { message: 'La descripción no puede tener más de 1000 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly descripcion?: string;

  @ApiProperty({ example: 45.5 })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  @Max(10000, { message: 'El precio no puede superar Bs. 10.000' })
  @Type(() => Number)
  readonly precio: number;

  @ApiPropertyOptional({ example: 'https://gambu.com/img/lomo.jpg' })
  @IsOptional()
  @IsString({ message: 'La URL de imagen debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La URL no puede tener más de 255 caracteres' })
  readonly imagenUrl?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt({ message: 'El stock actual debe ser un número entero' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  @Max(10000, { message: 'El stock actual no puede superar 10.000 unidades' })
  @Type(() => Number)
  readonly stockActual?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @Max(10000, { message: 'El stock mínimo no puede superar 10.000 unidades' })
  @Type(() => Number)
  readonly stockMinimo?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'El campo disponible debe ser un valor booleano' })
  readonly disponible?: boolean;
}
