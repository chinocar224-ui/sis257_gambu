import type { Categoria } from './categoria'

export interface Producto {
  id: number
  idCategoria: number
  nombre: string
  descripcion?: string
  precio: number
  imagenUrl?: string
  stockActual: number
  stockMinimo: number
  disponible: boolean
  categoria?: Categoria
  fechaCreacion?: Date
}
