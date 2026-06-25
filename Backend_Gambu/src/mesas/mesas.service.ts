import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { EstadoMesa, Mesa } from './entities/mesa.entity';

@Injectable()
export class MesasService {
  constructor(
    @InjectRepository(Mesa) private readonly mesasRepository: Repository<Mesa>,
  ) {}

  async create(createMesaDto: CreateMesaDto): Promise<Mesa> {
    const mesaExistente = await this.mesasRepository.findOneBy({
      numero: createMesaDto.numero,
    });
    if (mesaExistente) throw new ConflictException(`La mesa número ${createMesaDto.numero} ya existe`);

    const mesa = new Mesa();
    Object.assign(mesa, createMesaDto);
    return this.mesasRepository.save(mesa);
  }

  async findAll(): Promise<Mesa[]> {
    return this.mesasRepository.find({ order: { numero: 'ASC' } });
  }

  async findDisponibles(): Promise<Mesa[]> {
    return this.mesasRepository.find({
      where: { estado: EstadoMesa.DISPONIBLE },
      order: { numero: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Mesa> {
    const mesa = await this.mesasRepository.findOneBy({ id });
    if (!mesa) throw new NotFoundException('La mesa no existe');
    return mesa;
  }

  async update(id: number, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    const mesa = await this.findOne(id);
    Object.assign(mesa, updateMesaDto);
    return this.mesasRepository.save(mesa);
  }

  async cambiarEstado(id: number, estado: EstadoMesa): Promise<Mesa> {
    const mesa = await this.findOne(id);
    mesa.estado = estado;
    return this.mesasRepository.save(mesa);
  }

  async remove(id: number): Promise<Mesa> {
    const mesa = await this.findOne(id);
    return this.mesasRepository.softRemove(mesa);
  }
}
