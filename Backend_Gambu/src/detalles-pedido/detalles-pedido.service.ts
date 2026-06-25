import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDetalleDto } from './dto/create-detalle-pedido.dto';
import { UpdateDetalleDto } from './dto/update-detalle-pedido.dto';
import { DetallePedido } from './entities/detalle-pedido.entity';

@Injectable()
export class DetallesPedidoService {
  constructor(
    @InjectRepository(DetallePedido)
    private readonly detallesRepository: Repository<DetallePedido>,
  ) {}

  async create(createDetalleDto: CreateDetalleDto): Promise<DetallePedido> {
    const detalle = new DetallePedido();
    Object.assign(detalle, createDetalleDto);
    detalle.subtotal = createDetalleDto.cantidad * createDetalleDto.precioUnitario;
    return this.detallesRepository.save(detalle);
  }

  async findAll(): Promise<DetallePedido[]> {
    return this.detallesRepository.find({
      relations: { pedido: true, producto: true },
      order: { id: 'ASC' },
    });
  }

  async findByPedido(idPedido: number): Promise<DetallePedido[]> {
    return this.detallesRepository.find({
      where: { idPedido },
      relations: { producto: true },
    });
  }

  async findOne(id: number): Promise<DetallePedido> {
    const detalle = await this.detallesRepository.findOne({
      where: { id },
      relations: { pedido: true, producto: true },
    });
    if (!detalle) throw new NotFoundException('El detalle del pedido no existe');
    return detalle;
  }

  async update(id: number, updateDetalleDto: UpdateDetalleDto): Promise<DetallePedido> {
    const detalle = await this.findOne(id);
    Object.assign(detalle, updateDetalleDto);
    if (updateDetalleDto.cantidad && updateDetalleDto.precioUnitario) {
      detalle.subtotal = updateDetalleDto.cantidad * updateDetalleDto.precioUnitario;
    }
    return this.detallesRepository.save(detalle);
  }

  async remove(id: number): Promise<DetallePedido> {
    const detalle = await this.findOne(id);
    return this.detallesRepository.softRemove(detalle);
  }
}
