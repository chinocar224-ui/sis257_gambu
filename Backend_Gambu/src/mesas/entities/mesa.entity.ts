import { Pedido } from 'src/pedidos/entities/pedido.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoMesa {
  DISPONIBLE = 'Disponible',
  OCUPADA = 'Ocupada',
  RESERVADA = 'Reservada',
}

@Entity('mesas')
export class Mesa {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { unique: true })
  numero: number;

  @Column('integer', { default: 4 })
  capacidad: number;

  @Column({
    type: 'enum',
    enum: EstadoMesa,
    default: EstadoMesa.DISPONIBLE,
  })
  estado: EstadoMesa;

  @Column('varchar', { length: 200, nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @OneToMany(() => Pedido, (pedido) => pedido.mesa)
  pedidos: Pedido[];
}
