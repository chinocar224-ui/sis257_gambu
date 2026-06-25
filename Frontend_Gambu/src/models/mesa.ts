export type EstadoMesa = 'Disponible' | 'Ocupada' | 'Reservada'

export interface Mesa {
  id: number
  numero: number
  capacidad: number
  estado: EstadoMesa
  descripcion?: string
}
