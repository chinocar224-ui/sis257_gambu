import { Categoria } from 'src/categorias/entities/categoria.entity';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_categoria' })
  idCategoria: number;

  @Column('varchar', { length: 100 })
  nombre: string;

  @Column('varchar', { length: 1000, nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('varchar', { length: 255, name: 'imagen_url', nullable: true })
  imagenUrl: string;

  @Column('integer', { name: 'stock_actual', default: 0 })
  stockActual: number;

  @Column('integer', { name: 'stock_minimo', default: 5 })
  stockMinimo: number;

  @Column('boolean', { default: true })
  disponible: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos)
  @JoinColumn({ name: 'id_categoria', referencedColumnName: 'id' })
  categoria: Categoria;

  @OneToMany(() => DetallePedido, (detalle) => detalle.producto)
  detallesPedido: DetallePedido[];
}
