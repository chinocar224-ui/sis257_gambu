import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('detalles_pedido')
export class DetallePedido {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_pedido' })
  idPedido: number;

  @Column('integer', { name: 'id_producto' })
  idProducto: number;

  @Column('integer')
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'precio_unitario' })
  precioUnitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('varchar', { length: 500, name: 'notas_cocina', nullable: true })
  notasCocina: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Pedido, (pedido) => pedido.detallesPedido)
  @JoinColumn({ name: 'id_pedido', referencedColumnName: 'id' })
  pedido: Pedido;

  @ManyToOne(() => Producto, (producto) => producto.detallesPedido)
  @JoinColumn({ name: 'id_producto', referencedColumnName: 'id' })
  producto: Producto;
}
