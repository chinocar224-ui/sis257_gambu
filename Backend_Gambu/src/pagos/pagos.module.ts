import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './entities/pago.entity';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { Mesa } from 'src/mesas/entities/mesa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Pedido, Mesa])],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
