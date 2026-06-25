import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, DetallePedido])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
