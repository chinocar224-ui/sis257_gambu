import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DireccionEnvio } from 'src/direcciones-envio/entities/direccion-envio.entity';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import { Mesa } from 'src/mesas/entities/mesa.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PedidosEventsService } from './pedidos-events.service';
import { Pedido } from './entities/pedido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, DetallePedido, Mesa, Producto, Cliente, DireccionEnvio])],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosEventsService],
  exports: [PedidosService, PedidosEventsService],
})
export class PedidosModule {}
