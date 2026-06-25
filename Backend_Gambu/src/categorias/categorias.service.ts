import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { Categoria } from './entities/categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria) private readonly categoriasRepository: Repository<Categoria>,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto): Promise<Categoria> {
    let categoria = await this.categoriasRepository.findOneBy({
      nombre: createCategoriaDto.nombre.trim(),
    });
    if (categoria) throw new ConflictException('La categoría ya existe');

    categoria = new Categoria();
    Object.assign(categoria, createCategoriaDto);
    return this.categoriasRepository.save(categoria);
  }

  async findAll(): Promise<Categoria[]> {
    return this.categoriasRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number): Promise<Categoria> {
    const categoria = await this.categoriasRepository.findOneBy({ id });
    if (!categoria) throw new NotFoundException('La categoría no existe');
    return categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id);
    Object.assign(categoria, updateCategoriaDto);
    return this.categoriasRepository.save(categoria);
  }

  async remove(id: number): Promise<Categoria> {
    const categoria = await this.findOne(id);
    return this.categoriasRepository.softRemove(categoria);
  }
}
