import { compare, genSalt, hash } from 'bcryptjs';
import { Rol } from 'src/roles/entities/rol.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column('integer', { name: 'id_rol' })
  idRol: number;

  @Column('varchar', { length: 15, unique: true })
  usuario: string;

  @Column('varchar', { length: 100, select: false })
  clave: string;

  @Column('varchar', { length: 100 })
  nombre: string;

  @Column('varchar', { length: 100 })
  apellido: string;

  @Column('varchar', { length: 60, unique: true })
  email: string;

  @Column('varchar', { length: 20, nullable: true })
  telefono: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.clave && !this.clave.startsWith('$2a$') && !this.clave.startsWith('$2b$') && !this.clave.startsWith('$2y$')) {
      const salt = await genSalt();
      this.clave = await hash(this.clave, salt);
    }
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    if (!this.clave) return false;
    if (!this.clave.startsWith('$2a$') && !this.clave.startsWith('$2b$') && !this.clave.startsWith('$2y$')) {
      return this.clave === plainPassword;
    }
    return compare(plainPassword, this.clave);
  }

  @ManyToOne(() => Rol, (rol) => rol.usuarios)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;
}
