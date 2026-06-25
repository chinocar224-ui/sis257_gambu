import type { Pedido } from './pedido'

export type MetodoPago = 'Tarjeta' | 'QR' | 'Efectivo'
export type EstadoPago = 'Pendiente' | 'Aprobado' | 'Rechazado'

export interface Pago {
  id: number
  idPedido: number
  metodoPago: MetodoPago
  estadoPago: EstadoPago
  transaccionId?: string | null
  montoOriginal?: number
  porcentajeDescuento?: number
  descuentoAplicado?: number
  monto: number
  fechaPago?: Date | string | null
  pedido?: Pedido
}
