import { Pedido } from 'src/pedidos/entities/pedido.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MetodoPago {
  TARJETA = 'Tarjeta',
  QR = 'QR',
  EFECTIVO = 'Efectivo',
}

export enum EstadoPago {
  PENDIENTE = 'Pendiente',
  APROBADO = 'Aprobado',
  RECHAZADO = 'Rechazado',
}

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_pedido' })
  idPedido: number;

  @Column({ type: 'enum', enum: MetodoPago, name: 'metodo_pago' })
  metodoPago: MetodoPago;

  @Column({
    type: 'enum',
    enum: EstadoPago,
    default: EstadoPago.PENDIENTE,
    name: 'estado_pago',
  })
  estadoPago: EstadoPago;

  @Column('varchar', { length: 100, name: 'transaccion_id', nullable: true })
  transaccionId: string | null;

  @Column('decimal', { precision: 10, scale: 2, name: 'monto_original', default: 0 })
  montoOriginal: number;

  @Column('decimal', { precision: 5, scale: 2, name: 'porcentaje_descuento', default: 0 })
  porcentajeDescuento: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'descuento_aplicado', default: 0 })
  descuentoAplicado: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column('timestamp', { name: 'fecha_pago', nullable: true })
  fechaPago: Date | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @OneToOne(() => Pedido, (pedido) => pedido.pago)
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido: Pedido;
}
