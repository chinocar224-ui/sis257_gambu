import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DireccionesEnvioService } from './direcciones-envio.service';
import { DireccionesEnvioController } from './direcciones-envio.controller';
import { DireccionEnvio } from './entities/direccion-envio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DireccionEnvio, Cliente])],
  controllers: [DireccionesEnvioController],
  providers: [DireccionesEnvioService],
  exports: [DireccionesEnvioService],
})
export class DireccionesEnvioModule {}
