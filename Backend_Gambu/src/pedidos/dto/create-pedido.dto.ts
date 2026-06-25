import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoEntrega } from '../entities/pedido.entity';

const emptyToUndefined = ({ value }: { value: unknown }): string | undefined => {
  if (typeof value !== 'string') return value as string | undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export class CreateDetallePedidoDto {
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

  @ApiPropertyOptional({ example: 'Sin cebolla por favor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(emptyToUndefined)
  readonly notasCocina?: string;
}

export class CreatePedidoDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El cliente es obligatorio' })
  @IsInt({ message: 'El id del cliente debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idCliente: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'El id de la dirección debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idDireccion?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'El id de la mesa debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idMesa?: number;

  @ApiProperty({ enum: TipoEntrega, example: TipoEntrega.EN_MESA })
  @IsNotEmpty({ message: 'El tipo de entrega es obligatorio' })
  @IsEnum(TipoEntrega, {
    message: `El tipo de entrega debe ser: ${Object.values(TipoEntrega).join(', ')}`,
  })
  readonly tipoEntrega: TipoEntrega;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'El costo de envío debe ser un número' })
  @Min(0)
  @Type(() => Number)
  readonly costoEnvio?: number;

  @ApiPropertyOptional({ example: 'Av. Las Américas #120' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(emptyToUndefined)
  readonly direccionDelivery?: string;

  @ApiPropertyOptional({ example: 'Sucre' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : 'Sucre'))
  readonly ciudadDelivery?: string;

  @ApiPropertyOptional({ example: 'Llamar al llegar' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(emptyToUndefined)
  readonly referenciaDelivery?: string;

  @ApiPropertyOptional({ example: 'Mesa para 2 personas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(emptyToUndefined)
  readonly observaciones?: string;

  @ApiProperty({ type: [CreateDetallePedidoDto] })
  @IsArray({ message: 'Los detalles del pedido deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetallePedidoDto)
  readonly detalles: CreateDetallePedidoDto[];
}
