import { PartialType } from '@nestjs/swagger';
import { CreateDetalleDto } from './create-detalle-pedido.dto';

export class UpdateDetalleDto extends PartialType(CreateDetalleDto) {}
