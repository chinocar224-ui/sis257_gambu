<script setup lang="ts">
import type { Pedido } from '@/models/pedido'

const props = defineProps({
  mostrar: Boolean,
  pedido: { type: Object as () => Pedido | null, default: null },
})
const emit = defineEmits(['close'])

function formatPrecio(v: number) {
  return `Bs. ${Number(v).toFixed(2)}`
}

function formatFecha(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-BO', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function badgeEstado(estado: string) {
  const map: Record<string, string> = {
    'Recibido': 'badge-info', 'En Cocina': 'badge-warning',
    'En Camino': 'badge-amber', 'Entregado': 'badge-success', 'Cancelado': 'badge-danger',
  }
  return map[estado] || 'badge-muted'
}
</script>

<template>
  <div v-if="mostrar && pedido" class="dialog-overlay">
    <div class="dialog-box wide">
      <div class="dialog-header">
        <div>
          <h3>Pedido #{{ pedido.id }}</h3>
          <div style="margin-top:0.25rem">
            <span :class="['badge', badgeEstado(pedido.estadoPedido)]">{{ pedido.estadoPedido }}</span>
          </div>
        </div>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>

      <div class="dialog-body">
        <!-- Info grid -->
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label"><i class="pi pi-user"></i> Cliente</span>
            <span class="info-value">
              {{ pedido.cliente ? `${pedido.cliente.nombre} ${pedido.cliente.apellido || ''}` : `ID: ${pedido.idCliente}` }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="pi pi-truck"></i> Tipo Entrega</span>
            <span class="info-value">{{ pedido.tipoEntrega }}</span>
          </div>
          <div class="info-item" v-if="pedido.mesa">
            <span class="info-label"><i class="pi pi-table"></i> Mesa</span>
            <span class="info-value">Mesa {{ pedido.mesa.numero }}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="pi pi-dollar-sign"></i> Costo Envío</span>
            <span class="info-value">{{ formatPrecio(pedido.costoEnvio) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="pi pi-calendar"></i> Fecha</span>
            <span class="info-value">{{ formatFecha(pedido.fechaCreacion) }}</span>
          </div>
          <div class="info-item" v-if="pedido.observaciones">
            <span class="info-label"><i class="pi pi-comment"></i> Observaciones</span>
            <span class="info-value">{{ pedido.observaciones }}</span>
          </div>
        </div>

        <!-- Detalles -->
        <div class="form-section-title" style="margin-top:1.25rem">Productos del Pedido</div>
        <div v-if="pedido.detallesPedido?.length">
          <table class="table-gambu">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
                <th>Notas Cocina</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(d, i) in pedido.detallesPedido" :key="d.id ?? i">
                <td>{{ i + 1 }}</td>
                <td><strong>{{ d.producto?.nombre || `Producto ID: ${d.idProducto}` }}</strong></td>
                <td>{{ d.cantidad }}</td>
                <td>{{ formatPrecio(d.precioUnitario) }}</td>
                <td><strong>{{ formatPrecio(d.cantidad * d.precioUnitario) }}</strong></td>
                <td>{{ d.notasCocina || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else style="padding:1rem;color:var(--gambu-muted);text-align:center">Sin detalles registrados.</div>

        <!-- Total -->
        <div class="total-box" style="margin-top:1rem">
          <div style="display:flex;flex-direction:column;gap:0.25rem;font-size:0.875rem">
            <span>Subtotal: {{ formatPrecio(pedido.total - pedido.costoEnvio) }}</span>
            <span>Costo Envío: {{ formatPrecio(pedido.costoEnvio) }}</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.8rem;color:rgba(255,255,255,0.7)">Total</div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--gambu-gold)">{{ formatPrecio(pedido.total) }}</div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn-secondary-gambu" @click="emit('close')"><i class="pi pi-times"></i> Cerrar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.875rem;
}

.info-item {
  background: var(--gambu-light);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gambu-border);
}

.info-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gambu-muted);
  margin-bottom: 0.3rem;
}

.info-label i { margin-right: 0.3rem; }

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gambu-dark);
}

.form-section-title {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--gambu-dark);
  margin-bottom: 0.875rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--gambu-border);
}

.total-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--gambu-dark);
  border-radius: 8px;
  color: #fff;
}
</style>
