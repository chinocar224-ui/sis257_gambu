import { Body, Controller, Delete, Get, MessageEvent, Param, Patch, Post, Req, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PedidosService } from './pedidos.service';
import { PedidosEventsService } from './pedidos-events.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

@ApiTags('pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('Administrador', 'Cajero', 'Delivery')
@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly pedidosEventsService: PedidosEventsService,
  ) {}

  @Post()
  @Roles('Administrador', 'Cajero')
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidosService.create(createPedidoDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.pedidosService.findAllForUser(req.user);
  }

  @Sse('stream')
  stream(@Req() req: any): Observable<MessageEvent> {
    return this.pedidosEventsService.streamForUser(req.user);
  }

  @Get('cliente/:idCliente')
  @Roles('Administrador', 'Cajero')
  findByCliente(@Param('idCliente') idCliente: string) {
    return this.pedidosService.findByCliente(+idCliente);
  }

  @Get('usuario/:idUsuario')
  @Roles('Administrador', 'Cajero')
  findByUsuarioCompat(@Param('idUsuario') idUsuario: string) {
    return this.pedidosService.findByCliente(+idUsuario);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.pedidosService.findOneForUser(+id, req.user);
  }

  @Patch(':id/liberar-mesa')
  @Roles('Administrador', 'Cajero')
  liberarMesa(@Param('id') id: string) {
    return this.pedidosService.liberarMesa(+id);
  }

  @Patch(':id/estado')
  actualizarEstado(@Param('id') id: string, @Body('estadoPedido') estadoPedido: any, @Req() req: any) {
    return this.pedidosService.actualizarEstado(+id, estadoPedido, req.user);
  }

  @Patch(':id')
  @Roles('Administrador', 'Cajero')
  update(@Param('id') id: string, @Body() updatePedidoDto: UpdatePedidoDto) {
    return this.pedidosService.update(+id, updatePedidoDto);
  }

  @Delete(':id')
  @Roles('Administrador')
  remove(@Param('id') id: string) {
    return this.pedidosService.remove(+id);
  }
}
