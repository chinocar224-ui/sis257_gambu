<script setup lang="ts">
import type { EstadoPedido, Pedido } from '@/models/pedido'
import http from '@/plugins/axios'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores'

const ENDPOINT = 'pedidos'
const pedidos = ref<Pedido[]>([])
const emit = defineEmits(['edit', 'ver'])
const pedidoDelete = ref<Pedido | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')
const filtroEstado = ref('')
const filtroTipo = ref('')
const soloActivos = ref(true)
const error = ref('')
const estadoGuardando = ref<number | null>(null)
const authStore = useAuthStore()
let eventSource: EventSource | null = null

const estadoOpciones = ['Recibido', 'En Cocina', 'En Camino', 'Entregado', 'Cancelado']
const tipoOpciones = ['En Mesa', 'Take Away', 'Delivery']

async function obtenerLista() {
  error.value = ''
  try {
    pedidos.value = await http.get(ENDPOINT).then(r => r.data)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo cargar la lista de pedidos.')
  }
}

function emitirEdicion(p: Pedido) { emit('edit', p) }
function emitirVer(p: Pedido) { emit('ver', p) }
function confirmarEliminar(p: Pedido) { pedidoDelete.value = p; mostrarConfirm.value = true }

async function eliminar() {
  error.value = ''
  try {
    await http.delete(`${ENDPOINT}/${pedidoDelete.value?.id}`)
    await obtenerLista()
    mostrarConfirm.value = false
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo eliminar el pedido.')
    mostrarConfirm.value = false
  }
}

async function liberarMesa(p: Pedido) {
  cambiarEstado(p, 'Entregado')
}

function insertarOActualizarPedido(pedidoActualizado: Pedido) {
  const index = pedidos.value.findIndex(p => p.id === pedidoActualizado.id)
  if (index >= 0) pedidos.value[index] = pedidoActualizado
  else pedidos.value.unshift(pedidoActualizado)
}

function quitarPedidoDeLista(idPedido: number) {
  pedidos.value = pedidos.value.filter(p => p.id !== idPedido)
}

async function cambiarEstado(p: Pedido, nuevoEstado: EstadoPedido) {
  if (!nuevoEstado || p.estadoPedido === nuevoEstado || estadoGuardando.value === p.id) return

  const estadoAnterior = p.estadoPedido
  error.value = ''
  estadoGuardando.value = p.id

  try {
    const pedidoActualizado = await http.patch(`${ENDPOINT}/${p.id}/estado`, { estadoPedido: nuevoEstado }).then(r => r.data)
    insertarOActualizarPedido(pedidoActualizado)
  } catch (e: any) {
    p.estadoPedido = estadoAnterior
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo actualizar el estado del pedido.')
  } finally {
    estadoGuardando.value = null
  }
}

function cambiarEstadoDesdeSelect(p: Pedido, event: Event) {
  const target = event.target as HTMLSelectElement
  cambiarEstado(p, target.value as EstadoPedido)
}

function accionesRapidas(p: Pedido): EstadoPedido[] {
  if (p.estadoPedido === 'Recibido') return ['En Cocina', 'Cancelado']
  if (p.estadoPedido === 'En Cocina') return [p.tipoEntrega === 'Delivery' ? 'En Camino' : 'Entregado', 'Cancelado']
  if (p.estadoPedido === 'En Camino') return ['Entregado', 'Cancelado']
  return []
}

function textoAccionEstado(estado: EstadoPedido) {
  const map: Record<EstadoPedido, string> = {
    'Recibido': 'Recibido',
    'En Cocina': 'Cocina',
    'En Camino': 'En camino',
    'Entregado': 'Entregado',
    'Cancelado': 'Cancelar',
  }
  return map[estado]
}

function iconoAccionEstado(estado: EstadoPedido) {
  const map: Record<EstadoPedido, string> = {
    'Recibido': 'pi pi-inbox',
    'En Cocina': 'pi pi-clock',
    'En Camino': 'pi pi-truck',
    'Entregado': 'pi pi-check',
    'Cancelado': 'pi pi-times',
  }
  return map[estado]
}

const filtrados = computed(() =>
  pedidos.value.filter(p => {
    const q = busqueda.value.toLowerCase()
    const matchBusqueda =
      String(p.id).includes(q) ||
      (p.cliente?.nombre || '').toLowerCase().includes(q) ||
      (p.cliente?.apellido || '').toLowerCase().includes(q) ||
      (p.cliente?.telefono || '').toLowerCase().includes(q) ||
      (p.estadoPedido || '').toLowerCase().includes(q) ||
      direccionPedido(p).toLowerCase().includes(q) ||
      p.tipoEntrega.toLowerCase().includes(q)
    const matchEstado = filtroEstado.value ? p.estadoPedido === filtroEstado.value : true
    const matchTipo = filtroTipo.value ? p.tipoEntrega === filtroTipo.value : true
    const matchActivo = soloActivos.value ? !['Entregado', 'Cancelado'].includes(p.estadoPedido) : true
    return matchBusqueda && matchEstado && matchTipo && matchActivo
  })
)

const resumen = computed(() => ({
  activos: pedidos.value.filter(p => !['Entregado', 'Cancelado'].includes(p.estadoPedido)).length,
  cocina: pedidos.value.filter(p => p.estadoPedido === 'En Cocina').length,
  delivery: pedidos.value.filter(p => p.tipoEntrega === 'Delivery' && !['Entregado', 'Cancelado'].includes(p.estadoPedido)).length,
  totalDia: pedidos.value.reduce((acc, p) => acc + Number(p.total || 0), 0),
}))

function badgeEstado(estado: string) {
  const map: Record<string, string> = {
    'Recibido': 'badge-info',
    'En Cocina': 'badge-warning',
    'En Camino': 'badge-amber',
    'Entregado': 'badge-success',
    'Cancelado': 'badge-danger',
  }
  return map[estado] || 'badge-muted'
}

function badgeTipo(tipo: string) {
  const map: Record<string, string> = {
    'Delivery': 'badge-info',
    'Take Away': 'badge-amber',
    'En Mesa': 'badge-success',
  }
  return map[tipo] || 'badge-muted'
}

function formatPrecio(v: number) {
  return `Bs. ${Number(v || 0).toFixed(2)}`
}

function formatFecha(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function direccionPedido(p: Pedido) {
  if (p.direccionEnvio) {
    return `${p.direccionEnvio.direccion}, ${p.direccionEnvio.ciudad}`
  }
  if (p.idDireccion) return `Dirección #${p.idDireccion}`
  return '—'
}

function conectarTiempoReal() {
  if (!authStore.token || eventSource) return
  const baseUrl = String(import.meta.env.VITE_BASE_URL_ENDPOINT || '').replace(/\/$/, '')
  eventSource = new EventSource(`${baseUrl}/pedidos/stream?token=${encodeURIComponent(authStore.token)}`)

  eventSource.addEventListener('pedido-creado', (event) => {
    const payload = JSON.parse((event as MessageEvent).data)
    if (payload?.pedido) insertarOActualizarPedido(payload.pedido)
  })

  eventSource.addEventListener('pedido-actualizado', (event) => {
    const payload = JSON.parse((event as MessageEvent).data)
    if (payload?.pedido) insertarOActualizarPedido(payload.pedido)
  })

  eventSource.addEventListener('pedido-eliminado', (event) => {
    const payload = JSON.parse((event as MessageEvent).data)
    if (payload?.id) quitarPedidoDeLista(Number(payload.id))
  })
}

function puedeLiberarMesa(p: Pedido) {
  return p.tipoEntrega === 'En Mesa' && !!p.idMesa && !['Entregado', 'Cancelado'].includes(p.estadoPedido)
}

onMounted(async () => {
  await obtenerLista()
  conectarTiempoReal()
})

onBeforeUnmount(() => {
  eventSource?.close()
  eventSource = null
})

defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>

    <div class="mini-stats">
      <div><span>Activos</span><strong>{{ resumen.activos }}</strong></div>
      <div><span>En cocina</span><strong>{{ resumen.cocina }}</strong></div>
      <div><span>Delivery</span><strong>{{ resumen.delivery }}</strong></div>
      <div v-if="authStore.isAdmin"><span>Total cargado</span><strong>{{ formatPrecio(resumen.totalDia) }}</strong></div>
      <div v-else><span>Pedidos</span><strong>{{ pedidos.length }}</strong></div>
    </div>

    <div class="toolbar professional-toolbar">
      <div class="filters-left">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input v-model="busqueda" placeholder="Buscar por ID, cliente, teléfono o tipo..." />
        </div>
        <select v-model="filtroEstado" class="form-select filter-select">
          <option value="">Todos los estados</option>
          <option v-for="e in estadoOpciones" :key="e" :value="e">{{ e }}</option>
        </select>
        <select v-model="filtroTipo" class="form-select filter-select">
          <option value="">Todos los tipos</option>
          <option v-for="e in tipoOpciones" :key="e" :value="e">{{ e }}</option>
        </select>
        <label class="switch-filter">
          <input v-model="soloActivos" type="checkbox" />
          <span>Solo pedidos activos</span>
        </label>
      </div>
      <span class="result-counter">{{ filtrados.length }} pedido(s)</span>
    </div>

    <div class="card-gambu table-responsive">
      <table class="table-gambu orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Entrega</th>
            <th>Estado</th>
            <th>Mesa / Dirección</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Pago</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtrados" :key="p.id">
            <td><strong>#{{ p.id }}</strong></td>
            <td>
              <div class="customer-cell" v-if="p.cliente">
                <strong>{{ p.cliente.nombre }} {{ p.cliente.apellido || '' }}</strong>
                <span>{{ p.cliente.telefono || p.cliente.email || 'Sin datos' }}</span>
              </div>
              <span v-else class="badge badge-muted">ID: {{ p.idCliente }}</span>
            </td>
            <td><span :class="['badge', badgeTipo(p.tipoEntrega)]">{{ p.tipoEntrega }}</span></td>
            <td>
              <div class="status-cell">
                <span :class="['badge', badgeEstado(p.estadoPedido)]">{{ p.estadoPedido }}</span>
                <select
                  class="estado-select"
                  :value="p.estadoPedido"
                  :disabled="estadoGuardando === p.id"
                  @change="cambiarEstadoDesdeSelect(p, $event)"
                >
                  <option v-for="e in estadoOpciones" :key="e" :value="e">{{ e }}</option>
                </select>
                <span v-if="estadoGuardando === p.id" class="status-saving">
                  <i class="pi pi-spin pi-spinner"></i> Guardando
                </span>
              </div>
            </td>
            <td>
              <span v-if="p.mesa">Mesa {{ p.mesa.numero }}</span>
              <span v-else-if="p.tipoEntrega === 'Delivery'" class="address-cell">
                <strong>Dirección de envío</strong>
                {{ direccionPedido(p) }}
              </span>
              <span v-else>—</span>
            </td>
            <td>{{ p.detallesPedido?.length || 0 }} ítem(s)</td>
            <td><strong>{{ formatPrecio(p.total) }}</strong></td>
            <td>
              <span v-if="p.pago" :class="['badge', p.pago.estadoPago === 'Aprobado' ? 'badge-success' : 'badge-warning']">{{ p.pago.estadoPago }}</span>
              <span v-else class="badge badge-muted">Sin pago</span>
            </td>
            <td class="date-cell">{{ formatFecha(p.fechaCreacion) }}</td>
            <td class="actions-cell">
              <button class="action-btn" @click="emitirVer(p)" title="Ver detalles" style="color:var(--gambu-amber)">
                <i class="pi pi-eye"></i>
              </button>
              <button
                v-for="estado in accionesRapidas(p)"
                :key="estado"
                :class="['quick-status-btn', estado === 'Cancelado' ? 'danger' : '']"
                :disabled="estadoGuardando === p.id"
                @click="cambiarEstado(p, estado)"
                :title="`Cambiar a ${estado}`"
              >
                <i :class="iconoAccionEstado(estado)"></i>
                <span>{{ textoAccionEstado(estado) }}</span>
              </button>
              <button v-if="puedeLiberarMesa(p)" class="action-btn success" @click="liberarMesa(p)" title="Entregar y liberar mesa">
                <i class="pi pi-check-circle"></i>
              </button>
              <button class="action-btn edit" @click="emitirEdicion(p)" title="Editar observaciones">
                <i class="pi pi-pencil"></i>
              </button>
              <button v-if="authStore.isAdmin && !p.pago" class="action-btn delete" @click="confirmarEliminar(p)" title="Eliminar">
                <i class="pi pi-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results">
            <td colspan="10">No se encontraron pedidos.</td>
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
          <p>¿Estás seguro de eliminar el <strong>Pedido #{{ pedidoDelete?.id }}</strong>? Solo se permite eliminar pedidos sin pago para no afectar el historial.</p>
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
.mini-stats { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
.mini-stats div { background: #fff; border: 1px solid var(--gambu-border); border-radius: 12px; padding: 0.85rem 1rem; }
.mini-stats span { display: block; color: var(--gambu-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
.mini-stats strong { display: block; color: var(--gambu-dark); font-size: 1.25rem; margin-top: 0.25rem; }
.professional-toolbar { align-items: center; }
.filters-left { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
.filter-select { min-width: 150px; padding: 0.5rem 0.875rem; }
.switch-filter { display: inline-flex; align-items: center; gap: 0.45rem; color: var(--gambu-muted); font-weight: 700; font-size: 0.82rem; }
.switch-filter input { accent-color: var(--gambu-amber); }
.result-counter { font-size: 0.85rem; color: var(--gambu-muted); }
.table-responsive { overflow-x: auto; }
.orders-table { min-width: 1120px; }
.customer-cell strong, .customer-cell span { display: block; }
.customer-cell span { color: var(--gambu-muted); font-size: 0.75rem; margin-top: 0.15rem; }
.date-cell { font-size: 0.8rem; white-space: nowrap; }
.address-cell { display: block; max-width: 230px; white-space: normal; line-height: 1.35; }
.address-cell strong { display: block; color: var(--gambu-dark); font-size: 0.72rem; text-transform: uppercase; margin-bottom: 0.15rem; }
.actions-cell { white-space: nowrap; }
.action-btn.success:hover { background: #d4f5e2; color: #1a7a45; }

.status-cell { display: flex; flex-direction: column; gap: 0.35rem; min-width: 140px; }
.estado-select { border: 1px solid var(--gambu-border); border-radius: 10px; padding: 0.38rem 0.5rem; font-weight: 800; color: var(--gambu-dark); background: #fff; cursor: pointer; }
.estado-select:disabled { opacity: 0.65; cursor: wait; }
.status-saving { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--gambu-muted); font-size: 0.72rem; font-weight: 800; }
.quick-status-btn { border: 1px solid var(--gambu-border); background: #fff7e6; color: #8a5a00; border-radius: 999px; padding: 0.42rem 0.65rem; display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 800; cursor: pointer; margin-right: 0.25rem; margin-bottom: 0.25rem; transition: 0.2s ease; }
.quick-status-btn:hover { transform: translateY(-1px); background: #ffe8b7; }
.quick-status-btn.danger { background: #fff1f1; color: #a73535; }
.quick-status-btn.danger:hover { background: #ffdada; }
.quick-status-btn:disabled { opacity: 0.6; cursor: wait; transform: none; }
@media (max-width: 800px) { .mini-stats { grid-template-columns: repeat(2, minmax(120px, 1fr)); } }
</style>
