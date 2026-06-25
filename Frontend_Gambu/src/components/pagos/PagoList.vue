<script setup lang="ts">
import type { Pago } from '@/models/pago'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'pagos'
const pagos = ref<Pago[]>([])
const emit = defineEmits(['edit'])
const pagoDelete = ref<Pago | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')
const filtroEstado = ref('')
const filtroMetodo = ref('')

const estadoOpciones = ['Pendiente', 'Aprobado', 'Rechazado']
const metodoOpciones = ['Efectivo', 'QR', 'Tarjeta']

async function obtenerLista() {
  pagos.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(p: Pago) { emit('edit', p) }
function confirmarEliminar(p: Pago) { pagoDelete.value = p; mostrarConfirm.value = true }

async function eliminar() {
  await http.delete(`${ENDPOINT}/${pagoDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

const filtrados = computed(() =>
  pagos.value.filter(p => {
    const cliente = p.pedido?.cliente ? `${p.pedido.cliente.nombre} ${p.pedido.cliente.apellido || ''}` : ''
    const matchBusqueda =
      String(p.idPedido).includes(busqueda.value) ||
      (p.transaccionId || '').toLowerCase().includes(busqueda.value.toLowerCase()) ||
      String(p.monto).includes(busqueda.value) ||
      cliente.toLowerCase().includes(busqueda.value.toLowerCase())
    const matchEstado = filtroEstado.value ? p.estadoPago === filtroEstado.value : true
    const matchMetodo = filtroMetodo.value ? p.metodoPago === filtroMetodo.value : true
    return matchBusqueda && matchEstado && matchMetodo
  })
)

const totalCobrado = computed(() => filtrados.value.reduce((acc, p) => acc + Number(p.monto || 0), 0))
const totalDescuentos = computed(() => filtrados.value.reduce((acc, p) => acc + Number(p.descuentoAplicado || 0), 0))

function badgeEstado(estado: string) {
  const map: Record<string, string> = {
    'Pendiente': 'badge-warning',
    'Aprobado': 'badge-success',
    'Rechazado': 'badge-danger',
  }
  return map[estado] || 'badge-muted'
}

function badgeMetodo(metodo: string) {
  const map: Record<string, string> = {
    'Efectivo': 'badge-success',
    'QR': 'badge-info',
    'Tarjeta': 'badge-amber',
  }
  return map[metodo] || 'badge-muted'
}

function formatPrecio(v: number | undefined) {
  return `Bs. ${Number(v || 0).toFixed(2)}`
}

function formatFecha(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function clienteNombre(p: Pago) {
  const c = p.pedido?.cliente
  return c ? `${c.nombre} ${c.apellido || ''}`.trim() : 'Cliente'
}

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div class="stats-row">
      <div class="mini-stat">
        <span>Total cobrado</span>
        <strong>{{ formatPrecio(totalCobrado) }}</strong>
      </div>
      <div class="mini-stat">
        <span>Descuentos aplicados</span>
        <strong>{{ formatPrecio(totalDescuentos) }}</strong>
      </div>
      <div class="mini-stat">
        <span>Pagos visibles</span>
        <strong>{{ filtrados.length }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input v-model="busqueda" placeholder="Buscar por pedido, cliente o transacción..." />
        </div>
        <select v-model="filtroEstado" class="form-select" style="min-width:150px;padding:0.5rem 0.875rem">
          <option value="">Todos los estados</option>
          <option v-for="e in estadoOpciones" :key="e" :value="e">{{ e }}</option>
        </select>
        <select v-model="filtroMetodo" class="form-select" style="min-width:140px;padding:0.5rem 0.875rem">
          <option value="">Todos los métodos</option>
          <option v-for="m in metodoOpciones" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtrados.length }} pago(s)</span>
    </div>

    <div class="card-gambu">
      <table class="table-gambu">
        <thead>
          <tr>
            <th>#</th>
            <th>Pedido / Cliente</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Subtotal</th>
            <th>Descuento</th>
            <th>Monto Fijo</th>
            <th>Transacción</th>
            <th>Fecha Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in filtrados" :key="p.id">
            <td>{{ i + 1 }}</td>
            <td>
              <span class="badge badge-muted">#{{ p.idPedido }}</span>
              <div class="cliente-cell">{{ clienteNombre(p) }}</div>
              <small>{{ p.pedido?.cliente?.grupoCliente || 'Regular' }}</small>
            </td>
            <td><span :class="['badge', badgeMetodo(p.metodoPago)]">{{ p.metodoPago }}</span></td>
            <td><span :class="['badge', badgeEstado(p.estadoPago)]">{{ p.estadoPago }}</span></td>
            <td>{{ formatPrecio(p.montoOriginal || p.pedido?.total || p.monto) }}</td>
            <td>
              <strong class="discount-text">- {{ formatPrecio(p.descuentoAplicado) }}</strong>
              <small v-if="Number(p.porcentajeDescuento || 0) > 0">{{ p.porcentajeDescuento }}%</small>
            </td>
            <td><strong>{{ formatPrecio(p.monto) }}</strong></td>
            <td><code style="font-size:0.8rem;color:var(--gambu-muted)">{{ p.transaccionId || '—' }}</code></td>
            <td style="font-size:0.8rem">{{ formatFecha(p.fechaPago) }}</td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(p)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarEliminar(p)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results">
            <td colspan="10">No se encontraron pagos.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarConfirm" class="dialog-overlay">
      <div class="dialog-box confirm-dialog">
        <div class="dialog-header">
          <h3>Confirmar Eliminación</h3>
          <button class="btn-close-dialog" @click="mostrarConfirm = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="dialog-body">
          <p>¿Estás seguro de eliminar el pago del <strong>Pedido #{{ pagoDelete?.idPedido }}</strong>?</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button>
          <button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-row { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-bottom: .85rem; }
.mini-stat { background:#fff; border:1px solid var(--gambu-border); border-radius:14px; padding:.85rem 1rem; box-shadow: var(--gambu-shadow); }
.mini-stat span { display:block; color:var(--gambu-muted); font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.mini-stat strong { color:var(--gambu-dark); font-size:1.25rem; }
.cliente-cell { font-weight:800; color:var(--gambu-dark); margin-top:.25rem; }
small { display:block; color:var(--gambu-muted); font-size:.72rem; margin-top:.18rem; }
.discount-text { color:#15803d; }
@media (max-width: 900px) { .stats-row { grid-template-columns: 1fr; } }
</style>
