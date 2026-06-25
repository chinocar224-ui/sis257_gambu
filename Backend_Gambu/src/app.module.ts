import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProductosModule } from './productos/productos.module';
import { DireccionesEnvioModule } from './direcciones-envio/direcciones-envio.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { DetallesPedidoModule } from './detalles-pedido/detalles-pedido.module';
import { PagosModule } from './pagos/pagos.module';
import { MesasModule } from './mesas/mesas.module';
import { ClientesModule } from './clientes/clientes.module';
import { ReportesModule } from './reportes/reportes.module';
import { DefaultUsersService } from './seed/default-users.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
    }),
    AuthModule,
    UsuariosModule,
    RolesModule,
    CategoriasModule,
    ProductosModule,
    DireccionesEnvioModule,
    MesasModule,
    PedidosModule,
    DetallesPedidoModule,
    PagosModule,
    ClientesModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService, DefaultUsersService],
})
export class AppModule {}
