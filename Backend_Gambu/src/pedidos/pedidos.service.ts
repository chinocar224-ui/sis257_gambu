import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import { DireccionEnvio } from 'src/direcciones-envio/entities/direccion-envio.entity';
import { EstadoMesa, Mesa } from 'src/mesas/entities/mesa.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { isDeliveryUser } from 'src/auth/utils/roles.util';
import { EstadoPedido, Pedido, TipoEntrega } from './entities/pedido.entity';
import { PedidosEventsService } from './pedidos-events.service';

@Injectable()
export class PedidosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pedidosEventsService: PedidosEventsService,
    @InjectRepository(Pedido) private readonly pedidosRepository: Repository<Pedido>,
    @InjectRepository(DetallePedido) private readonly detallesRepository: Repository<DetallePedido>,
    @InjectRepository(Mesa) private readonly mesasRepository: Repository<Mesa>,
    @InjectRepository(Producto) private readonly productosRepository: Repository<Producto>,
    @InjectRepository(Cliente) private readonly clientesRepository: Repository<Cliente>,
    @InjectRepository(DireccionEnvio) private readonly direccionesRepository: Repository<DireccionEnvio>,
  ) {}

  private agruparDetalles(detalles: CreatePedidoDto['detalles']) {
    const map = new Map<number, { idProducto: number; cantidad: number; notasCocina?: string }>();
    for (const detalle of detalles) {
      const actual = map.get(detalle.idProducto) || { idProducto: detalle.idProducto, cantidad: 0, notasCocina: '' };
      actual.cantidad += Number(detalle.cantidad || 0);
      if (detalle.notasCocina) actual.notasCocina = [actual.notasCocina, detalle.notasCocina].filter(Boolean).join(' | ');
      map.set(detalle.idProducto, actual);
    }
    return [...map.values()];
  }

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const detallesAgrupados = this.agruparDetalles(createPedidoDto.detalles || []);
    const costoEnvio = Number(createPedidoDto.costoEnvio || 0);

    if (!detallesAgrupados.length) throw new BadRequestException('Agrega al menos un producto al pedido');

    // IMPORTANTE:
    // Dentro de una transacción no debemos consultar el pedido recién creado
    // con this.pedidosRepository, porque ese repositorio usa otra conexión y
    // todavía no ve los cambios sin confirmar. Por eso la transacción devuelve
    // solo el ID, y luego consultamos el pedido completo cuando ya hizo COMMIT.
    const pedidoCreadoId = await this.dataSource.transaction(async (manager) => {
      const clienteRepo = manager.getRepository(Cliente);
      const mesaRepo = manager.getRepository(Mesa);
      const productoRepo = manager.getRepository(Producto);
      const direccionRepo = manager.getRepository(DireccionEnvio);
      const pedidoRepo = manager.getRepository(Pedido);
      const detalleRepo = manager.getRepository(DetallePedido);

      const cliente = await clienteRepo.findOneBy({ id: createPedidoDto.idCliente });
      if (!cliente) throw new NotFoundException('El cliente seleccionado no existe');

      let idMesa: number | null = createPedidoDto.idMesa ?? null;
      if (createPedidoDto.tipoEntrega === TipoEntrega.EN_MESA) {
        if (!idMesa) throw new BadRequestException('Selecciona una mesa para el pedido en mesa');
        const mesa = await mesaRepo.findOneBy({ id: idMesa });
        if (!mesa) throw new NotFoundException('La mesa seleccionada no existe');
        if (mesa.estado !== EstadoMesa.DISPONIBLE) {
          throw new BadRequestException(`La mesa ${mesa.numero} no está disponible`);
        }
      } else {
        idMesa = null;
      }

      let idDireccion: number | null = createPedidoDto.idDireccion ?? null;
      if (createPedidoDto.tipoEntrega === TipoEntrega.DELIVERY) {
        if (!idDireccion && createPedidoDto.direccionDelivery) {
          const nuevaDireccion = await direccionRepo.save(
            direccionRepo.create({
              idCliente: createPedidoDto.idCliente,
              direccion: createPedidoDto.direccionDelivery,
              ciudad: createPedidoDto.ciudadDelivery || 'Sucre',
              indicacionesReferencia: createPedidoDto.referenciaDelivery || undefined,
            }),
          );
          idDireccion = nuevaDireccion.id;
        }
        if (!idDireccion) throw new BadRequestException('Selecciona o escribe una dirección para delivery');

        const direccion = await direccionRepo.findOneBy({ id: idDireccion, idCliente: createPedidoDto.idCliente });
        if (!direccion) throw new BadRequestException('La dirección no pertenece al cliente seleccionado');
      } else {
        idDireccion = null;
      }

      const idsProducto = detallesAgrupados.map((d) => d.idProducto);
      const productos = await productoRepo.find({ where: { id: In(idsProducto) } });
      const productosMap = new Map(productos.map((p) => [p.id, p]));

      let subtotal = 0;
      const detallesPreparados: DetallePedido[] = [];

      for (const d of detallesAgrupados) {
        const producto = productosMap.get(d.idProducto);
        if (!producto) throw new NotFoundException(`El producto ${d.idProducto} no existe`);
        if (!producto.disponible) throw new BadRequestException(`El producto ${producto.nombre} no está disponible`);
        if (Number(d.cantidad) < 1) throw new BadRequestException(`La cantidad de ${producto.nombre} debe ser mayor a cero`);
        if (Number(producto.stockActual) < Number(d.cantidad)) {
          throw new BadRequestException(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
        }

        const precioUnitario = Number(producto.precio);
        const subtotalDetalle = Number(d.cantidad) * precioUnitario;
        subtotal += subtotalDetalle;

        detallesPreparados.push(
          detalleRepo.create({
            idProducto: d.idProducto,
            cantidad: Number(d.cantidad),
            precioUnitario,
            subtotal: subtotalDetalle,
            notasCocina: d.notasCocina ?? '',
          }),
        );

        producto.stockActual = Number(producto.stockActual) - Number(d.cantidad);
        producto.disponible = Number(producto.stockActual) > 0;
        await productoRepo.save(producto);
      }

      const total = subtotal + costoEnvio;
      const pedidoGuardado = await pedidoRepo.save(
        pedidoRepo.create({
          idCliente: createPedidoDto.idCliente,
          idDireccion,
          idMesa,
          tipoEntrega: createPedidoDto.tipoEntrega,
          estadoPedido: EstadoPedido.RECIBIDO,
          costoEnvio,
          total,
          observaciones: createPedidoDto.observaciones || '',
        }),
      );

      for (const detalle of detallesPreparados) {
        detalle.idPedido = pedidoGuardado.id;
        await detalleRepo.save(detalle);
      }

      if (createPedidoDto.tipoEntrega === TipoEntrega.EN_MESA && idMesa) {
        await mesaRepo.update(idMesa, { estado: EstadoMesa.OCUPADA });
      }

      return pedidoGuardado.id;
    });

    const pedidoCreado = await this.findOne(pedidoCreadoId);
    this.pedidosEventsService.emitPedidoCreado(pedidoCreado);
    return pedidoCreado;
  }

  private readonly relacionesPedido = {
    cliente: true,
    direccionEnvio: true,
    mesa: true,
    detallesPedido: { producto: { categoria: true } },
    pago: true,
  } as const;

  async findAll(): Promise<Pedido[]> {
    return this.pedidosRepository.find({
      relations: this.relacionesPedido,
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findDelivery(): Promise<Pedido[]> {
    return this.pedidosRepository.find({
      where: { tipoEntrega: TipoEntrega.DELIVERY },
      relations: this.relacionesPedido,
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findAllForUser(user: any): Promise<Pedido[]> {
    if (isDeliveryUser(user)) return this.findDelivery();
    return this.findAll();
  }

  async findByCliente(idCliente: number): Promise<Pedido[]> {
    return this.pedidosRepository.find({
      where: { idCliente },
      relations: this.relacionesPedido,
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: this.relacionesPedido,
    });
    if (!pedido) throw new NotFoundException('El pedido no existe');
    return pedido;
  }

  async findOneForUser(id: number, user: any): Promise<Pedido> {
    const pedido = await this.findOne(id);
    this.validarAccesoDelivery(pedido, user);
    return pedido;
  }

  private validarAccesoDelivery(pedido: Pedido, user: any): void {
    if (isDeliveryUser(user) && pedido.tipoEntrega !== TipoEntrega.DELIVERY) {
      throw new ForbiddenException('El rol Delivery solo puede visualizar y actualizar pedidos de tipo Delivery');
    }
  }

  private validarEstadoPedido(estadoPedido: EstadoPedido): EstadoPedido {
    const estadosValidos = Object.values(EstadoPedido);
    if (!estadosValidos.includes(estadoPedido)) {
      throw new BadRequestException(`Estado de pedido inválido. Usa: ${estadosValidos.join(', ')}`);
    }
    return estadoPedido;
  }

  private validarCambioEstadoDelivery(pedido: Pedido, nuevoEstado: EstadoPedido, user?: any): void {
    if (!isDeliveryUser(user)) return;

    if ([EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].includes(pedido.estadoPedido)) {
      throw new BadRequestException('Este pedido ya está cerrado. Delivery no puede modificar pedidos entregados o cancelados.');
    }

    const estadosPermitidosDelivery = [EstadoPedido.EN_CAMINO, EstadoPedido.ENTREGADO];
    if (!estadosPermitidosDelivery.includes(nuevoEstado)) {
      throw new ForbiddenException('Delivery solo puede cambiar el estado a En Camino o Entregado.');
    }
  }

  async actualizarEstado(id: number, estadoPedido: EstadoPedido, user?: any): Promise<Pedido> {
    const nuevoEstado = this.validarEstadoPedido(estadoPedido);
    const pedido = await this.findOne(id);
    this.validarAccesoDelivery(pedido, user);
    this.validarCambioEstadoDelivery(pedido, nuevoEstado, user);
    const estadoAnterior = pedido.estadoPedido;

    if (estadoAnterior === nuevoEstado) {
      return pedido;
    }

    pedido.estadoPedido = nuevoEstado;
    const pedidoActualizado = await this.pedidosRepository.save(pedido);

    if (
      pedido.idMesa &&
      pedido.tipoEntrega === TipoEntrega.EN_MESA &&
      [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].includes(nuevoEstado)
    ) {
      await this.mesasRepository.update(pedido.idMesa, { estado: EstadoMesa.DISPONIBLE });
    }

    if (
      pedido.idMesa &&
      pedido.tipoEntrega === TipoEntrega.EN_MESA &&
      [EstadoPedido.RECIBIDO, EstadoPedido.EN_COCINA].includes(nuevoEstado)
    ) {
      await this.mesasRepository.update(pedido.idMesa, { estado: EstadoMesa.OCUPADA });
    }

    const pedidoFinal = await this.findOne(pedidoActualizado.id);
    this.pedidosEventsService.emitPedidoActualizado(pedidoFinal);
    return pedidoFinal;
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);
    const estadoAnterior = pedido.estadoPedido;
    const estadoPedido = updatePedidoDto.estadoPedido ? this.validarEstadoPedido(updatePedidoDto.estadoPedido) : pedido.estadoPedido;
    Object.assign(pedido, { estadoPedido, observaciones: updatePedidoDto.observaciones ?? pedido.observaciones });
    const pedidoActualizado = await this.pedidosRepository.save(pedido);

    if (
      pedido.idMesa &&
      pedido.tipoEntrega === TipoEntrega.EN_MESA &&
      updatePedidoDto.estadoPedido &&
      [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].includes(estadoPedido) &&
      estadoAnterior !== estadoPedido
    ) {
      await this.mesasRepository.update(pedido.idMesa, { estado: EstadoMesa.DISPONIBLE });
    }

    const pedidoFinal = await this.findOne(pedidoActualizado.id);
    this.pedidosEventsService.emitPedidoActualizado(pedidoFinal);
    return pedidoFinal;
  }

  async liberarMesa(id: number): Promise<Pedido> {
    const pedido = await this.findOne(id);
    if (!pedido.idMesa || pedido.tipoEntrega !== TipoEntrega.EN_MESA) {
      throw new BadRequestException('Este pedido no está asociado a una mesa');
    }
    await this.mesasRepository.update(pedido.idMesa, { estado: EstadoMesa.DISPONIBLE });
    pedido.estadoPedido = EstadoPedido.ENTREGADO;
    await this.pedidosRepository.save(pedido);
    const pedidoFinal = await this.findOne(id);
    this.pedidosEventsService.emitPedidoActualizado(pedidoFinal);
    return pedidoFinal;
  }

  async remove(id: number): Promise<Pedido> {
    const pedido = await this.findOne(id);
    if (pedido.pago?.estadoPago === 'Aprobado') {
      throw new BadRequestException('No se puede eliminar un pedido con pago aprobado. Déjalo como entregado para mantener el historial.');
    }

    const pedidoEliminado = await this.dataSource.transaction(async (manager) => {
      const productoRepo = manager.getRepository(Producto);
      const mesaRepo = manager.getRepository(Mesa);
      const pedidoRepo = manager.getRepository(Pedido);

      for (const detalle of pedido.detallesPedido || []) {
        const producto = await productoRepo.findOneBy({ id: detalle.idProducto });
        if (producto) {
          producto.stockActual = Number(producto.stockActual || 0) + Number(detalle.cantidad || 0);
          producto.disponible = true;
          await productoRepo.save(producto);
        }
      }

      if (pedido.idMesa && pedido.tipoEntrega === TipoEntrega.EN_MESA) {
        await mesaRepo.update(pedido.idMesa, { estado: EstadoMesa.DISPONIBLE });
      }

      return pedidoRepo.softRemove(pedido);
    });

    this.pedidosEventsService.emitPedidoEliminado(pedido);
    return pedidoEliminado;
  }
}
