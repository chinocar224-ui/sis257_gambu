import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoCliente } from 'src/clientes/entities/cliente.entity';
import { EstadoMesa, Mesa } from 'src/mesas/entities/mesa.entity';
import { EstadoPedido, Pedido, TipoEntrega } from 'src/pedidos/entities/pedido.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { EstadoPago, Pago } from './entities/pago.entity';

interface CalculoPago {
  montoOriginal: number;
  porcentajeDescuento: number;
  descuentoAplicado: number;
  montoFinal: number;
  grupoCliente: string;
}

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago) private readonly pagosRepository: Repository<Pago>,
    @InjectRepository(Pedido) private readonly pedidosRepository: Repository<Pedido>,
    @InjectRepository(Mesa) private readonly mesasRepository: Repository<Mesa>,
  ) {}

  private redondear(valor: number): number {
    return Number(Number(valor || 0).toFixed(2));
  }

  private porcentajeDescuentoPorConsumo(grupoCliente: string | undefined, montoOriginal: number): number {
    if (grupoCliente === GrupoCliente.VIP) {
      if (montoOriginal >= 200) return 10;
      if (montoOriginal >= 100) return 8;
      return 5;
    }

    if (grupoCliente === GrupoCliente.CORPORATIVO) {
      if (montoOriginal >= 400) return 15;
      if (montoOriginal >= 200) return 12;
      return 8;
    }

    return 0;
  }

  private calcularPagoFinal(pedido: Pedido): CalculoPago {
    const montoOriginal = this.redondear(Number(pedido.total || 0));
    const grupoCliente = pedido.cliente?.grupoCliente || GrupoCliente.REGULAR;
    const porcentajeDescuento = this.porcentajeDescuentoPorConsumo(grupoCliente, montoOriginal);
    const descuentoAplicado = this.redondear((montoOriginal * porcentajeDescuento) / 100);
    const montoFinal = this.redondear(Math.max(montoOriginal - descuentoAplicado, 0));

    return {
      montoOriginal,
      porcentajeDescuento,
      descuentoAplicado,
      montoFinal,
      grupoCliente,
    };
  }

  private async validarPago(idPedido: number): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({
      where: { id: idPedido },
      relations: { cliente: true, mesa: true, pago: true },
    });

    if (!pedido) throw new NotFoundException('El pedido no existe');
    if (pedido.estadoPedido === EstadoPedido.CANCELADO) {
      throw new BadRequestException('No se puede pagar un pedido cancelado');
    }
    if (Number(pedido.total || 0) <= 0) {
      throw new BadRequestException('El pedido no tiene un total válido para pagar');
    }

    return pedido;
  }

  private aplicarMontosCalculados(pago: Pago, pedido: Pedido): CalculoPago {
    const calculo = this.calcularPagoFinal(pedido);
    pago.montoOriginal = calculo.montoOriginal;
    pago.porcentajeDescuento = calculo.porcentajeDescuento;
    pago.descuentoAplicado = calculo.descuentoAplicado;
    pago.monto = calculo.montoFinal;
    return calculo;
  }

  private async aplicarPagoAprobado(pago: Pago, pedido: Pedido): Promise<void> {
    pago.fechaPago = new Date();

    if (pedido.estadoPedido !== EstadoPedido.ENTREGADO) {
      pedido.estadoPedido = EstadoPedido.ENTREGADO;
      await this.pedidosRepository.save(pedido);
    }

    if (pedido.tipoEntrega === TipoEntrega.EN_MESA && pedido.idMesa) {
      await this.mesasRepository.update(pedido.idMesa, { estado: EstadoMesa.DISPONIBLE });
    }
  }

  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const pagoExistente = await this.pagosRepository.findOneBy({
      idPedido: createPagoDto.idPedido,
    });
    if (pagoExistente) throw new ConflictException('Ya existe un pago para este pedido');

    const pedido = await this.validarPago(createPagoDto.idPedido);
    const pago = new Pago();
    pago.idPedido = createPagoDto.idPedido;
    pago.metodoPago = createPagoDto.metodoPago;
    pago.estadoPago = createPagoDto.estadoPago || EstadoPago.APROBADO;
    pago.transaccionId = createPagoDto.transaccionId || null;

    this.aplicarMontosCalculados(pago, pedido);

    if (pago.estadoPago === EstadoPago.APROBADO) {
      await this.aplicarPagoAprobado(pago, pedido);
    }

    return this.pagosRepository.save(pago);
  }

  async findAll(): Promise<Pago[]> {
    return this.pagosRepository.find({
      relations: { pedido: { cliente: true, mesa: true } },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagosRepository.findOne({
      where: { id },
      relations: { pedido: { cliente: true, mesa: true, detallesPedido: { producto: true } } },
    });
    if (!pago) throw new NotFoundException('El pago no existe');
    return pago;
  }

  async findByPedido(idPedido: number): Promise<Pago> {
    const pago = await this.pagosRepository.findOne({
      where: { idPedido },
      relations: { pedido: { cliente: true } },
    });
    if (!pago) throw new NotFoundException('No existe pago para este pedido');
    return pago;
  }

  async update(id: number, updatePagoDto: UpdatePagoDto): Promise<Pago> {
    const pago = await this.findOne(id);
    const nuevoIdPedido = updatePagoDto.idPedido ?? pago.idPedido;
    const pedido = await this.validarPago(nuevoIdPedido);

    pago.idPedido = nuevoIdPedido;
    if (updatePagoDto.metodoPago !== undefined) pago.metodoPago = updatePagoDto.metodoPago;
    if (updatePagoDto.estadoPago !== undefined) pago.estadoPago = updatePagoDto.estadoPago;
    if (updatePagoDto.transaccionId !== undefined) pago.transaccionId = updatePagoDto.transaccionId;

    this.aplicarMontosCalculados(pago, pedido);

    if (pago.estadoPago === EstadoPago.APROBADO) {
      await this.aplicarPagoAprobado(pago, pedido);
    }

    return this.pagosRepository.save(pago);
  }

  async remove(id: number): Promise<Pago> {
    const pago = await this.findOne(id);
    return this.pagosRepository.softRemove(pago);
  }
}
