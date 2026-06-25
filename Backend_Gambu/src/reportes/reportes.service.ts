import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import { EstadoPago, Pago } from 'src/pagos/entities/pago.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Pago) private readonly pagosRepository: Repository<Pago>,
    @InjectRepository(DetallePedido) private readonly detallesRepository: Repository<DetallePedido>,
  ) {}

  private inicioDelDia(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
  }

  private finDelDia(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);
  }

  private resolverRango(periodo = 'mes', desde?: string, hasta?: string): { inicio: Date; fin: Date; etiqueta: string } {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date;
    let etiqueta = periodo;

    if (desde || hasta) {
      inicio = desde ? new Date(`${desde}T00:00:00`) : new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0);
      fin = hasta ? new Date(`${hasta}T23:59:59.999`) : this.finDelDia(hoy);
      etiqueta = 'personalizado';
    } else {
      switch ((periodo || 'mes').toLowerCase()) {
        case 'dia':
          inicio = this.inicioDelDia(hoy);
          fin = this.finDelDia(hoy);
          etiqueta = 'Día';
          break;
        case 'semana': {
          const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
          inicio = this.inicioDelDia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaSemana));
          fin = this.finDelDia(hoy);
          etiqueta = 'Semana';
          break;
        }
        case 'bimestral':
          inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1, 0, 0, 0, 0);
          fin = this.finDelDia(hoy);
          etiqueta = 'Bimestral';
          break;
        case 'trimestral':
          inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1, 0, 0, 0, 0);
          fin = this.finDelDia(hoy);
          etiqueta = 'Trimestral';
          break;
        case 'semestral':
          inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1, 0, 0, 0, 0);
          fin = this.finDelDia(hoy);
          etiqueta = 'Semestral';
          break;
        case 'anual':
          inicio = new Date(hoy.getFullYear(), 0, 1, 0, 0, 0, 0);
          fin = this.finDelDia(hoy);
          etiqueta = 'Anual';
          break;
        case 'mes':
        default:
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0, 0);
          fin = this.finDelDia(hoy);
          etiqueta = 'Mes';
          break;
      }
    }

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      throw new BadRequestException('El rango de fechas no es válido. Usa formato YYYY-MM-DD.');
    }
    if (inicio > fin) throw new BadRequestException('La fecha desde no puede ser mayor a la fecha hasta.');
    return { inicio, fin, etiqueta };
  }

  async ventas(periodo?: string, desde?: string, hasta?: string) {
    const { inicio, fin, etiqueta } = this.resolverRango(periodo, desde, hasta);

    const pagos = await this.pagosRepository.find({
      where: { estadoPago: EstadoPago.APROBADO, fechaPago: Between(inicio, fin) },
      relations: { pedido: { cliente: true, mesa: true, detallesPedido: { producto: { categoria: true } } } },
      order: { fechaPago: 'DESC' },
    });

    const totalVentas = pagos.reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
    const totalBruto = pagos.reduce((acc, pago) => acc + Number(pago.montoOriginal || pago.pedido?.total || pago.monto || 0), 0);
    const totalDescuentos = pagos.reduce((acc, pago) => acc + Number(pago.descuentoAplicado || 0), 0);
    const numeroPagos = pagos.length;
    const ticketPromedio = numeroPagos ? totalVentas / numeroPagos : 0;

    const porMetodo = new Map<string, number>();
    const porTipoEntrega = new Map<string, number>();
    const porEstadoPedido = new Map<string, number>();
    const ventasDiarias = new Map<string, number>();

    for (const pago of pagos) {
      const monto = Number(pago.monto || 0);
      porMetodo.set(pago.metodoPago, (porMetodo.get(pago.metodoPago) || 0) + monto);
      const tipo = pago.pedido?.tipoEntrega || 'Sin tipo';
      porTipoEntrega.set(tipo, (porTipoEntrega.get(tipo) || 0) + monto);
      const estado = pago.pedido?.estadoPedido || 'Sin estado';
      porEstadoPedido.set(estado, (porEstadoPedido.get(estado) || 0) + monto);
      const dia = pago.fechaPago ? new Date(pago.fechaPago).toISOString().slice(0, 10) : 'Sin fecha';
      ventasDiarias.set(dia, (ventasDiarias.get(dia) || 0) + monto);
    }

    const detalles = await this.detallesRepository
      .createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.producto', 'producto')
      .leftJoin('detalle.pedido', 'pedido')
      .leftJoin('pedido.pago', 'pago')
      .where('pago.estado_pago = :estado', { estado: EstadoPago.APROBADO })
      .andWhere('pago.fecha_pago BETWEEN :inicio AND :fin', { inicio, fin })
      .getMany();

    const productosMap = new Map<string, { producto: string; cantidad: number; total: number }>();
    for (const detalle of detalles) {
      const nombre = detalle.producto?.nombre || `Producto #${detalle.idProducto}`;
      const actual = productosMap.get(nombre) || { producto: nombre, cantidad: 0, total: 0 };
      actual.cantidad += Number(detalle.cantidad || 0);
      actual.total += Number(detalle.subtotal || 0);
      productosMap.set(nombre, actual);
    }

    const productosMasVendidos = [...productosMap.values()]
      .sort((a, b) => b.cantidad - a.cantidad || b.total - a.total)
      .slice(0, 10);

    return {
      rango: {
        periodo: etiqueta,
        desde: inicio.toISOString().slice(0, 10),
        hasta: fin.toISOString().slice(0, 10),
      },
      resumen: {
        totalVentas,
        totalBruto,
        totalDescuentos,
        numeroPagos,
        ticketPromedio,
        totalProductosVendidos: productosMasVendidos.reduce((acc, p) => acc + p.cantidad, 0),
      },
      porMetodo: [...porMetodo.entries()].map(([metodo, total]) => ({ metodo, total })),
      porTipoEntrega: [...porTipoEntrega.entries()].map(([tipoEntrega, total]) => ({ tipoEntrega, total })),
      porEstadoPedido: [...porEstadoPedido.entries()].map(([estadoPedido, total]) => ({ estadoPedido, total })),
      ventasDiarias: [...ventasDiarias.entries()].map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      productosMasVendidos,
      pagos: pagos.map((pago) => ({
        id: pago.id,
        fechaPago: pago.fechaPago,
        metodoPago: pago.metodoPago,
        montoOriginal: Number(pago.montoOriginal || pago.pedido?.total || pago.monto || 0),
        porcentajeDescuento: Number(pago.porcentajeDescuento || 0),
        descuentoAplicado: Number(pago.descuentoAplicado || 0),
        monto: Number(pago.monto || 0),
        pedido: pago.pedido
          ? {
              id: pago.pedido.id,
              tipoEntrega: pago.pedido.tipoEntrega,
              estadoPedido: pago.pedido.estadoPedido,
              cliente: pago.pedido.cliente ? `${pago.pedido.cliente.nombre} ${pago.pedido.cliente.apellido || ''}`.trim() : 'Cliente',
              grupoCliente: pago.pedido.cliente?.grupoCliente || 'Regular',
              mesa: pago.pedido.mesa?.numero || null,
              total: Number(pago.pedido.total || 0),
            }
          : null,
      })),
    };
  }
}
