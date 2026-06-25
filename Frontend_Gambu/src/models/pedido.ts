import type { Cliente } from './cliente'
import type { Mesa } from './mesa'
import type { DireccionEnvio } from './direccionEnvio'

export type EstadoPedido = 'Recibido' | 'En Cocina' | 'En Camino' | 'Entregado' | 'Cancelado'
export type TipoEntrega = 'Delivery' | 'Take Away' | 'En Mesa'

export interface DetallePedido {
  id?: number
  idProducto: number
  cantidad: number
  precioUnitario: number
  subtotal?: number
  notasCocina?: string
  producto?: { nombre: string; precio: number; imagenUrl?: string; categoria?: { nombre: string } }
}

export interface Pedido {
  id: number
  idCliente: number
  idDireccion?: number
  idMesa?: number
  estadoPedido: EstadoPedido
  tipoEntrega: TipoEntrega
  costoEnvio: number
  total: number
  observaciones?: string
  fechaCreacion?: Date
  cliente?: Cliente
  mesa?: Mesa
  direccionEnvio?: DireccionEnvio
  detallesPedido?: DetallePedido[]
  pago?: { id: number; estadoPago: string; metodoPago?: string; monto?: number; montoOriginal?: number; descuentoAplicado?: number; porcentajeDescuento?: number }
}
