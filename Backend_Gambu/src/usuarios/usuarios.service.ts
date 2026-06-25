import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const usuarioNombre = createUsuarioDto.usuario.trim().toLowerCase();
    const email = createUsuarioDto.email.trim().toLowerCase();
    let usuario = await this.usuariosRepository.findOne({
      where: [{ usuario: usuarioNombre }, { email }],
    });
    if (usuario) throw new ConflictException('El usuario o email ya existe');

    usuario = new Usuario();
    Object.assign(usuario, {
      ...createUsuarioDto,
      usuario: usuarioNombre,
      email,
      clave: createUsuarioDto.clave || process.env.DEFAULT_PASSWORD || 'Gambu.2026',
    });
    return this.usuariosRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find({
      relations: { rol: true },
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: { rol: true },
    });
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    const nuevoUsuario = updateUsuarioDto.usuario?.trim().toLowerCase() ?? usuario.usuario;
    const nuevoEmail = updateUsuarioDto.email?.trim().toLowerCase() ?? usuario.email;

    const duplicado = await this.usuariosRepository
      .createQueryBuilder('usuario')
      .where('(usuario.usuario = :usuario OR usuario.email = :email)', { usuario: nuevoUsuario, email: nuevoEmail })
      .andWhere('usuario.id <> :id', { id })
      .getOne();
    if (duplicado) throw new ConflictException('Ya existe otro usuario con ese usuario o email');

    const { clave, ...datosUsuario } = updateUsuarioDto;
    Object.assign(usuario, {
      ...datosUsuario,
      usuario: nuevoUsuario,
      email: nuevoEmail,
    });

    if (clave !== undefined) {
      const nuevaClave = clave.trim();
      if (nuevaClave.length > 0) usuario.clave = nuevaClave;
    }

    return this.usuariosRepository.save(usuario);
  }

  async remove(id: number): Promise<Usuario> {
    const usuario = await this.findOne(id);
    return this.usuariosRepository.softRemove(usuario);
  }

  async validate(usuario: string, clave: string): Promise<Usuario> {
    const usuarioOk = await this.usuariosRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .addSelect('usuario.clave')
      .where('LOWER(usuario.usuario) = LOWER(:usuario)', { usuario: usuario.trim() })
      .getOne();

    if (!usuarioOk) throw new NotFoundException('Usuario inexistente');

    if (!(await usuarioOk.validatePassword(clave))) {
      throw new UnauthorizedException('Clave incorrecta');
    }

    if (usuarioOk.clave && !usuarioOk.clave.startsWith('$2a$') && !usuarioOk.clave.startsWith('$2b$') && !usuarioOk.clave.startsWith('$2y$')) {
      usuarioOk.clave = clave;
      await this.usuariosRepository.save(usuarioOk);
    }

    usuarioOk.clave = '';
    return usuarioOk;
  }
}
