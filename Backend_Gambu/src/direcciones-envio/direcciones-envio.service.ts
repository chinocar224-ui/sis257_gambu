import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { CreateDireccionEnvioDto } from './dto/create-direccion-envio.dto';
import { UpdateDireccionEnvioDto } from './dto/update-direccion-envio.dto';
import { DireccionEnvio } from './entities/direccion-envio.entity';

@Injectable()
export class DireccionesEnvioService {
  constructor(
    @InjectRepository(DireccionEnvio)
    private readonly direccionesRepository: Repository<DireccionEnvio>,
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  async create(createDireccionEnvioDto: CreateDireccionEnvioDto): Promise<DireccionEnvio> {
    const cliente = await this.clientesRepository.findOneBy({ id: createDireccionEnvioDto.idCliente });
    if (!cliente) throw new NotFoundException('El cliente seleccionado no existe');

    const direccion = this.direccionesRepository.create({
      ...createDireccionEnvioDto,
      ciudad: createDireccionEnvioDto.ciudad || 'Sucre',
    });
    return this.direccionesRepository.save(direccion);
  }

  async findAll(): Promise<DireccionEnvio[]> {
    return this.direccionesRepository.find({
      relations: { cliente: true },
      order: { ciudad: 'ASC', direccion: 'ASC' },
    });
  }

  async findByCliente(idCliente: number): Promise<DireccionEnvio[]> {
    return this.direccionesRepository.find({
      where: { idCliente },
      order: { ciudad: 'ASC', direccion: 'ASC' },
    });
  }

  async findOne(id: number): Promise<DireccionEnvio> {
    const direccion = await this.direccionesRepository.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!direccion) throw new NotFoundException('La dirección de envío no existe');
    return direccion;
  }

  async update(id: number, updateDireccionEnvioDto: UpdateDireccionEnvioDto): Promise<DireccionEnvio> {
    const direccion = await this.findOne(id);
    if (updateDireccionEnvioDto.idCliente) {
      const cliente = await this.clientesRepository.findOneBy({ id: updateDireccionEnvioDto.idCliente });
      if (!cliente) throw new NotFoundException('El cliente seleccionado no existe');
    }
    Object.assign(direccion, updateDireccionEnvioDto);
    if (!direccion.ciudad) direccion.ciudad = 'Sucre';
    return this.direccionesRepository.save(direccion);
  }

  async remove(id: number): Promise<DireccionEnvio> {
    const direccion = await this.findOne(id);
    return this.direccionesRepository.softRemove(direccion);
  }
}
