import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DetallesPedidoService } from './detalles-pedido.service';
import { CreateDetalleDto } from './dto/create-detalle-pedido.dto';
import { UpdateDetalleDto } from './dto/update-detalle-pedido.dto';

@ApiTags('detalles-pedido')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('detalles-pedido')
export class DetallesPedidoController {
  constructor(private readonly detallesPedidoService: DetallesPedidoService) {}

  @Post()
  create(@Body() createDetalleDto: CreateDetalleDto) {
    return this.detallesPedidoService.create(createDetalleDto);
  }

  @Get()
  findAll() {
    return this.detallesPedidoService.findAll();
  }

  @Get('pedido/:idPedido')
  findByPedido(@Param('idPedido') idPedido: string) {
    return this.detallesPedidoService.findByPedido(+idPedido);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detallesPedidoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetalleDto: UpdateDetalleDto) {
    return this.detallesPedidoService.update(+id, updateDetalleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detallesPedidoService.remove(+id);
  }
}
