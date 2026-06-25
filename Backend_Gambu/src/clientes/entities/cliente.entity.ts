import { DireccionEnvio } from 'src/direcciones-envio/entities/direccion-envio.entity';
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

export enum GrupoCliente {
  REGULAR = 'Regular',
  FRECUENTE = 'Frecuente',
  VIP = 'VIP',
  CORPORATIVO = 'Corporativo',
}

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('varchar', { length: 100 })
  nombre: string;

  @Column('varchar', { length: 100, nullable: true })
  apellido: string | null;

  @Column('varchar', { length: 20, nullable: true })
  telefono: string | null;

  @Column('varchar', { length: 120, nullable: true })
  email: string | null;

  @Column({
    type: 'enum',
    enum: GrupoCliente,
    name: 'grupo_cliente',
    default: GrupoCliente.REGULAR,
  })
  grupoCliente: GrupoCliente;

  @Column('varchar', { length: 500, name: 'direccion_principal', nullable: true })
  direccionPrincipal: string | null;

  @Column('varchar', { length: 50, default: 'Sucre' })
  ciudad: string;

  @Column('varchar', { length: 500, name: 'referencia_direccion', nullable: true })
  referenciaDireccion: string | null;

  @Column('boolean', { default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @OneToMany(() => Pedido, (pedido) => pedido.cliente)
  pedidos: Pedido[];

  @OneToMany(() => DireccionEnvio, (direccion) => direccion.cliente)
  direccionesEnvio: DireccionEnvio[];
}
