import { Cliente } from 'src/clientes/entities/cliente.entity';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
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

@Entity('direcciones_envio')
export class DireccionEnvio {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_cliente' })
  idCliente: number;

  @Column('varchar', { length: 500 })
  direccion: string;

  @Column('varchar', { length: 50, default: 'Sucre' })
  ciudad: string;

  @Column('varchar', { length: 500, name: 'indicaciones_referencia', nullable: true })
  indicacionesReferencia: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.direccionesEnvio)
  @JoinColumn({ name: 'id_cliente', referencedColumnName: 'id' })
  cliente: Cliente;

  @OneToMany(() => Pedido, (pedido) => pedido.direccionEnvio)
  pedidos: Pedido[];
}
