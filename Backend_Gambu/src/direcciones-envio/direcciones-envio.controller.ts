import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { DireccionesEnvioService } from './direcciones-envio.service';
import { CreateDireccionEnvioDto } from './dto/create-direccion-envio.dto';
import { UpdateDireccionEnvioDto } from './dto/update-direccion-envio.dto';

@ApiTags('direcciones-envio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('Administrador', 'Cajero')
@Controller('direcciones-envio')
export class DireccionesEnvioController {
  constructor(private readonly direccionesEnvioService: DireccionesEnvioService) {}

  @Post()
  create(@Body() createDireccionEnvioDto: CreateDireccionEnvioDto) {
    return this.direccionesEnvioService.create(createDireccionEnvioDto);
  }

  @Get()
  findAll() {
    return this.direccionesEnvioService.findAll();
  }

  @Get('cliente/:idCliente')
  findByCliente(@Param('idCliente') idCliente: string) {
    return this.direccionesEnvioService.findByCliente(+idCliente);
  }

  @Get('usuario/:idUsuario')
  findByUsuarioCompat(@Param('idUsuario') idUsuario: string) {
    return this.direccionesEnvioService.findByCliente(+idUsuario);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.direccionesEnvioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDireccionEnvioDto: UpdateDireccionEnvioDto) {
    return this.direccionesEnvioService.update(+id, updateDireccionEnvioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.direccionesEnvioService.remove(+id);
  }
}
