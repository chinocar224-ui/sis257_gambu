import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { EstadoPago, MetodoPago } from '../entities/pago.entity';

export class UpdatePagoDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: 'El id del pedido debe ser un número entero' })
  @Min(1)
  @Type(() => Number)
  readonly idPedido?: number;

  @ApiPropertyOptional({ enum: MetodoPago, example: MetodoPago.QR })
  @IsOptional()
  @IsEnum(MetodoPago, {
    message: `El método de pago debe ser: ${Object.values(MetodoPago).join(', ')}`,
  })
  readonly metodoPago?: MetodoPago;

  @ApiPropertyOptional({ enum: EstadoPago, example: EstadoPago.APROBADO })
  @IsOptional()
  @IsEnum(EstadoPago, {
    message: `El estado de pago debe ser: ${Object.values(EstadoPago).join(', ')}`,
  })
  readonly estadoPago?: EstadoPago;

  @ApiPropertyOptional({ example: 150.0 })
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
