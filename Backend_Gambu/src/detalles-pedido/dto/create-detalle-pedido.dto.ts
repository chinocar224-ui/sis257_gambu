import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateDetalleDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El pedido es obligatorio' })
  @IsInt({ message: 'El id del pedido debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idPedido: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El producto es obligatorio' })
  @IsInt({ message: 'El id del producto debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idProducto: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsPositive({ message: 'La cantidad debe ser positiva' })
  @Type(() => Number)
  readonly cantidad: number;

  @ApiProperty({ example: 45.5 })
  @IsNotEmpty({ message: 'El precio unitario es obligatorio' })
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @IsPositive({ message: 'El precio unitario debe ser positivo' })
  @Type(() => Number)
  readonly precioUnitario: number;

  @ApiPropertyOptional({ example: 'Sin cebolla por favor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly notasCocina?: string;
}
