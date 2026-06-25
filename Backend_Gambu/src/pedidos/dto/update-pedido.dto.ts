import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePedidoDto } from './create-pedido.dto';
import { EstadoPedido } from '../entities/pedido.entity';

export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {
  @IsOptional()
  @IsEnum(EstadoPedido, {
    message: `El estado debe ser: ${Object.values(EstadoPedido).join(', ')}`,
  })
  readonly estadoPedido?: EstadoPedido;
}
