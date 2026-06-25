import type { Cliente } from './cliente'

export interface DireccionEnvio {
  id: number
  idCliente: number
  direccion: string
  ciudad: string
  indicacionesReferencia?: string
  cliente?: Cliente
}
