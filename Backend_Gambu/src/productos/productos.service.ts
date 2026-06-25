import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto) private readonly productosRepository: Repository<Producto>,
    @InjectRepository(Categoria) private readonly categoriasRepository: Repository<Categoria>,
  ) {}

  private async validarProducto(dto: Partial<CreateProductoDto>, idActual?: number): Promise<void> {
    if (dto.idCategoria) {
      const categoria = await this.categoriasRepository.findOneBy({ id: dto.idCategoria });
      if (!categoria) throw new NotFoundException('La categoría seleccionada no existe');
    }

    if (dto.precio !== undefined && Number(dto.precio) <= 0) {
      throw new BadRequestException('El precio del producto debe ser mayor a 0');
    }

    if (dto.stockActual !== undefined && Number(dto.stockActual) < 0) {
      throw new BadRequestException('El stock actual no puede ser negativo');
    }

    if (dto.stockMinimo !== undefined && Number(dto.stockMinimo) < 0) {
      throw new BadRequestException('El stock mínimo no puede ser negativo');
    }

    if (dto.nombre && dto.idCategoria) {
      const where: any = {
        idCategoria: dto.idCategoria,
        nombre: dto.nombre.trim(),
      };
      if (idActual) where.id = Not(idActual);
      const producto = await this.productosRepository.findOne({ where });
      if (producto) throw new ConflictException('El producto ya existe en esa categoría');
    }
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    await this.validarProducto(createProductoDto);
    const producto = new Producto();
    Object.assign(producto, {
      ...createProductoDto,
      nombre: createProductoDto.nombre.trim(),
      disponible: createProductoDto.disponible ?? true,
      stockActual: createProductoDto.stockActual ?? 0,
      stockMinimo: createProductoDto.stockMinimo ?? 5,
    });
    return this.productosRepository.save(producto);
  }

  async findAll(): Promise<Producto[]> {
    return this.productosRepository.find({
      relations: { categoria: true },
      order: { categoria: { nombre: 'ASC' }, nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productosRepository.findOne({
      where: { id },
      relations: { categoria: true },
    });
    if (!producto) throw new NotFoundException('El producto no existe');
    return producto;
  }

  async findByCategoria(idCategoria: number): Promise<Producto[]> {
    const categoria = await this.categoriasRepository.findOneBy({ id: idCategoria });
    if (!categoria) throw new NotFoundException('La categoría seleccionada no existe');

    return this.productosRepository.find({
      where: { idCategoria, disponible: true },
      relations: { categoria: true },
      order: { nombre: 'ASC' },
    });
  }

  async update(id: number, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id);
    await this.validarProducto(
      {
        ...updateProductoDto,
        idCategoria: updateProductoDto.idCategoria ?? producto.idCategoria,
        nombre: updateProductoDto.nombre ?? producto.nombre,
      },
      id,
    );

    Object.assign(producto, updateProductoDto);
    if (producto.nombre) producto.nombre = producto.nombre.trim();
    return this.productosRepository.save(producto);
  }

  async remove(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    return this.productosRepository.softRemove(producto);
  }
}
