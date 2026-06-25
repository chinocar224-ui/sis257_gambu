import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { EstadoMesa } from '../entities/mesa.entity';

export class CreateMesaDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El número de mesa es obligatorio' })
  @IsInt({ message: 'El número de mesa debe ser un número entero' })
  @IsPositive({ message: 'El número de mesa debe ser positivo' })
  @Type(() => Number)
  readonly numero: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un número entero' })
  @IsPositive({ message: 'La capacidad debe ser positiva' })
  @Type(() => Number)
  readonly capacidad?: number;

  @ApiPropertyOptional({ enum: EstadoMesa, example: EstadoMesa.DISPONIBLE })
  @IsOptional()
  @IsEnum(EstadoMesa, {
    message: `El estado debe ser: ${Object.values(EstadoMesa).join(', ')}`,
  })
  readonly estado?: EstadoMesa;

  @ApiPropertyOptional({ example: 'Mesa junto a la ventana' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly descripcion?: string;
}
