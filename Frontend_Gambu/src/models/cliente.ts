import type { DireccionEnvio } from './direccionEnvio'

export type GrupoCliente = 'Regular' | 'Frecuente' | 'VIP' | 'Corporativo'

export interface Cliente {
  id: number
  nombre: string
  apellido?: string | null
  telefono?: string | null
  email?: string | null
  grupoCliente?: GrupoCliente
  direccionPrincipal?: string | null
  ciudad?: string
  referenciaDireccion?: string | null
  activo?: boolean
  direccionesEnvio?: DireccionEnvio[]
  fechaCreacion?: Date
}
