import type { Rol } from './rol'

export interface Usuario {
  id: number
  idRol: number
  usuario: string
  clave?: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol?: Rol
}
