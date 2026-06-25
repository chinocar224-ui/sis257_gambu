import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { DireccionEnvio } from 'src/direcciones-envio/entities/direccion-envio.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente, GrupoCliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente) private readonly clientesRepository: Repository<Cliente>,
    @InjectRepository(DireccionEnvio) private readonly direccionesRepository: Repository<DireccionEnvio>,
  ) {}

  private async validarDuplicados(email?: string, telefono?: string, idIgnorar?: number): Promise<void> {
    if (!email && !telefono) return;

    const duplicado = await this.clientesRepository
      .createQueryBuilder('cliente')
      .where(
        new Brackets((qb) => {
          if (email) qb.orWhere('LOWER(cliente.email) = LOWER(:email)', { email });
          if (telefono) qb.orWhere('cliente.telefono = :telefono', { telefono });
        }),
      )
      .andWhere(idIgnorar ? 'cliente.id <> :idIgnorar' : '1 = 1', { idIgnorar })
      .getOne();
    if (duplicado) {
      throw new ConflictException('Ya existe un cliente con ese correo o teléfono. Si el cliente no desea dar datos, deja esos campos vacíos.');
    }
  }

  private async crearDireccionPrincipal(cliente: Cliente): Promise<void> {
    if (!cliente.direccionPrincipal) return;
    const existe = await this.direccionesRepository.findOne({
      where: { idCliente: cliente.id, direccion: cliente.direccionPrincipal },
    });
    if (existe) return;
    await this.direccionesRepository.save(
      this.direccionesRepository.create({
        idCliente: cliente.id,
        direccion: cliente.direccionPrincipal,
        ciudad: cliente.ciudad || 'Sucre',
        indicacionesReferencia: cliente.referenciaDireccion || undefined,
      }),
    );
  }

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    if (!createClienteDto.nombre?.trim()) {
      throw new BadRequestException('Registra al menos un nombre o referencia del cliente. Ejemplo: Cliente mostrador, Empresa ABC, Mesa 4.');
    }
    await this.validarDuplicados(createClienteDto.email, createClienteDto.telefono);

    const cliente = this.clientesRepository.create({
      nombre: createClienteDto.nombre.trim(),
      apellido: createClienteDto.apellido || null,
      telefono: createClienteDto.telefono || null,
      email: createClienteDto.email || null,
      grupoCliente: createClienteDto.grupoCliente || GrupoCliente.REGULAR,
      direccionPrincipal: createClienteDto.direccionPrincipal || null,
      ciudad: createClienteDto.ciudad || 'Sucre',
      referenciaDireccion: createClienteDto.referenciaDireccion || null,
      activo: true,
    });

    const guardado = await this.clientesRepository.save(cliente);
    await this.crearDireccionPrincipal(guardado);
    return this.findOne(guardado.id);
  }

  async findAll(): Promise<Cliente[]> {
    return this.clientesRepository.find({
      relations: { direccionesEnvio: true },
      order: { grupoCliente: 'ASC', nombre: 'ASC', apellido: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clientesRepository.findOne({
      where: { id },
      relations: { direccionesEnvio: true },
    });
    if (!cliente) throw new NotFoundException('El cliente no existe');
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);
    const email = updateClienteDto.email !== undefined ? updateClienteDto.email : cliente.email || undefined;
    const telefono = updateClienteDto.telefono !== undefined ? updateClienteDto.telefono : cliente.telefono || undefined;
    await this.validarDuplicados(email || undefined, telefono || undefined, id);

    Object.assign(cliente, {
      ...updateClienteDto,
      apellido: updateClienteDto.apellido === undefined ? cliente.apellido : updateClienteDto.apellido || null,
      email: updateClienteDto.email === undefined ? cliente.email : updateClienteDto.email || null,
      telefono: updateClienteDto.telefono === undefined ? cliente.telefono : updateClienteDto.telefono || null,
      direccionPrincipal: updateClienteDto.direccionPrincipal === undefined ? cliente.direccionPrincipal : updateClienteDto.direccionPrincipal || null,
      ciudad: updateClienteDto.ciudad || cliente.ciudad || 'Sucre',
      referenciaDireccion: updateClienteDto.referenciaDireccion === undefined ? cliente.referenciaDireccion : updateClienteDto.referenciaDireccion || null,
      grupoCliente: updateClienteDto.grupoCliente || cliente.grupoCliente || GrupoCliente.REGULAR,
    });

    const guardado = await this.clientesRepository.save(cliente);
    await this.crearDireccionPrincipal(guardado);
    return this.findOne(guardado.id);
  }

  async remove(id: number): Promise<Cliente> {
    const cliente = await this.findOne(id);
    return this.clientesRepository.softRemove(cliente);
  }
}
