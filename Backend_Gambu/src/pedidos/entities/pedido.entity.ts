import { Cliente } from 'src/clientes/entities/cliente.entity';
import { DireccionEnvio } from 'src/direcciones-envio/entities/direccion-envio.entity';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { Mesa } from 'src/mesas/entities/mesa.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoPedido {
  RECIBIDO = 'Recibido',
  EN_COCINA = 'En Cocina',
  EN_CAMINO = 'En Camino',
  ENTREGADO = 'Entregado',
  CANCELADO = 'Cancelado',
}

export enum TipoEntrega {
  DELIVERY = 'Delivery',
  TAKE_AWAY = 'Take Away',
  EN_MESA = 'En Mesa',
}

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_cliente' })
  idCliente: number;

  @Column('integer', { name: 'id_direccion', nullable: true })
  idDireccion: number | null;

  @Column('integer', { name: 'id_mesa', nullable: true })
  idMesa: number | null;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
    default: EstadoPedido.RECIBIDO,
    name: 'estado_pedido',
  })
  estadoPedido: EstadoPedido;

  @Column({
    type: 'enum',
    enum: TipoEntrega,
    name: 'tipo_entrega',
  })
  tipoEntrega: TipoEntrega;

  @Column('decimal', { precision: 10, scale: 2, name: 'costo_envio', default: 0 })
  costoEnvio: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('varchar', { length: 500, nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos)
  @JoinColumn({ name: 'id_cliente', referencedColumnName: 'id' })
  cliente: Cliente;

  @ManyToOne(() => DireccionEnvio, (direccion) => direccion.pedidos, { nullable: true })
  @JoinColumn({ name: 'id_direccion', referencedColumnName: 'id' })
  direccionEnvio: DireccionEnvio;

  @ManyToOne(() => Mesa, (mesa) => mesa.pedidos, { nullable: true })
  @JoinColumn({ name: 'id_mesa', referencedColumnName: 'id' })
  mesa: Mesa;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, { cascade: true })
  detallesPedido: DetallePedido[];

  @OneToOne(() => Pago, (pago) => pago.pedido)
  pago: Pago;
}
