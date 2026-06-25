import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { EstadoPago, MetodoPago } from '../entities/pago.entity';

export class CreatePagoDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El pedido es obligatorio' })
  @IsInt({ message: 'El id del pedido debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idPedido: number;

  @ApiProperty({ enum: MetodoPago, example: MetodoPago.QR })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  @IsEnum(MetodoPago, {
    message: `El método de pago debe ser: ${Object.values(MetodoPago).join(', ')}`,
  })
  readonly metodoPago: MetodoPago;

  @ApiPropertyOptional({ enum: EstadoPago, example: EstadoPago.PENDIENTE })
  @IsOptional()
  @IsEnum(EstadoPago, {
    message: `El estado de pago debe ser: ${Object.values(EstadoPago).join(', ')}`,
  })
  readonly estadoPago?: EstadoPago;

  @ApiPropertyOptional({
    example: 150.0,
    description: 'Campo opcional por compatibilidad. El backend ignora este valor y calcula el monto final desde el pedido.',
  })
  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Type(() => Number)
  readonly monto?: number;

  @ApiPropertyOptional({ example: 'TXN-20260101-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly transaccionId?: string;
}
