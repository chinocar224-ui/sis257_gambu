import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Rol } from 'src/roles/entities/rol.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

interface DemoUserSeed {
  usuario: string;
  clave: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
}

@Injectable()
export class DefaultUsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DefaultUsersService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.AUTO_SEED_DEMO_USERS === 'false') return;

    try {
      await this.ensureDefaultUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudieron verificar los usuarios demo: ${message}`);
    }
  }

  private async ensureDefaultUsers(): Promise<void> {
    const rolRepo = this.dataSource.getRepository(Rol);
    const usuarioRepo = this.dataSource.getRepository(Usuario);

    const roles: Record<string, Rol> = {};
    for (const nombreRol of ['Administrador', 'Cajero', 'Mesero', 'Delivery']) {
      let rol = await rolRepo.findOne({ where: { nombreRol } });
      if (!rol) {
        rol = rolRepo.create({ nombreRol });
        rol = await rolRepo.save(rol);
      }
      roles[nombreRol] = rol;
    }

    const demoUsers: DemoUserSeed[] = [
      { usuario: 'admin', clave: 'admin123', nombre: 'Administrador', apellido: 'Sistema', email: 'admin@gambu.com', telefono: '70000001', rol: 'Administrador' },
      { usuario: 'cajero', clave: 'cajero123', nombre: 'María', apellido: 'Salazar', email: 'cajero@gambu.com', telefono: '70000002', rol: 'Cajero' },
      { usuario: 'mesero', clave: 'mesero123', nombre: 'Luis', apellido: 'Mamani', email: 'mesero@gambu.com', telefono: '70000003', rol: 'Mesero' },
      { usuario: 'delivery', clave: 'delivery123', nombre: 'Carlos', apellido: 'Flores', email: 'delivery@gambu.com', telefono: '70000004', rol: 'Delivery' },
      { usuario: 'repartidor', clave: 'reparto123', nombre: 'Carlos', apellido: 'Flores', email: 'repartidor@gambu.com', telefono: '70000005', rol: 'Delivery' },
    ];

    const resetDemoPasswords = process.env.RESET_DEMO_PASSWORDS !== 'false';

    for (const demoUser of demoUsers) {
      let usuario = await usuarioRepo.findOne({ where: { usuario: demoUser.usuario } });

      if (!usuario) {
        usuario = usuarioRepo.create({
          idRol: roles[demoUser.rol].id,
          usuario: demoUser.usuario,
          clave: demoUser.clave,
          nombre: demoUser.nombre,
          apellido: demoUser.apellido,
          email: demoUser.email,
          telefono: demoUser.telefono,
        });
      } else {
        usuario.idRol = roles[demoUser.rol].id;
        usuario.nombre = usuario.nombre || demoUser.nombre;
        usuario.apellido = usuario.apellido || demoUser.apellido;
        usuario.email = usuario.email || demoUser.email;
        usuario.telefono = usuario.telefono || demoUser.telefono;
        if (resetDemoPasswords) usuario.clave = demoUser.clave;
      }

      await usuarioRepo.save(usuario);
    }

    this.logger.log('Usuarios demo verificados: admin, cajero, mesero, delivery y repartidor.');
  }
}
