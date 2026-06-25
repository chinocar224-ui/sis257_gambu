<script setup lang="ts">
import type { EstadoPedido, Pedido } from '@/models/pedido'
import http from '@/plugins/axios'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const pedidos = ref<Pedido[]>([])
const busqueda = ref('')
const filtroEstado = ref('')
const error = ref('')
const estadoGuardando = ref<number | null>(null)
let eventSource: EventSource | null = null

const estadoOpciones: EstadoPedido[] = ['Recibido', 'En Camino', 'Entregado', 'Cancelado']
const estadosDelivery: EstadoPedido[] = ['En Camino', 'Entregado']

function esEstadoFinal(p: Pedido) {
  return ['Entregado', 'Cancelado'].includes(p.estadoPedido)
}

async function obtenerPedidosDelivery() {
  error.value = ''
  try {
    pedidos.value = await http.get('pedidos').then(r => r.data)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo cargar el panel de delivery.')
  }
}

function insertarOActualizarPedido(pedidoActualizado: Pedido) {
  if (pedidoActualizado.tipoEntrega !== 'Delivery') return
  const index = pedidos.value.findIndex(p => p.id === pedidoActualizado.id)
  if (index >= 0) pedidos.value[index] = pedidoActualizado
  else pedidos.value.unshift(pedidoActualizado)
}

function quitarPedido(idPedido: number) {
  pedidos.value = pedidos.value.filter(p => p.id !== idPedido)
}

function direccionPedido(p: Pedido) {
  if (p.direccionEnvio) {
    const referencia = p.direccionEnvio.indicacionesReferencia ? ` · Ref: ${p.direccionEnvio.indicacionesReferencia}` : ''
    return `${p.direccionEnvio.direccion}, ${p.direccionEnvio.ciudad}${referencia}`
  }
  if (p.idDireccion) return `Dirección #${p.idDireccion}`
  return 'Dirección no registrada'
}

function badgeEstado(estado: string) {
  const map: Record<string, string> = {
    'Recibido': 'badge-info',
    'En Camino': 'badge-amber',
    'Entregado': 'badge-success',
    'Cancelado': 'badge-danger',
  }
  return map[estado] || 'badge-muted'
}

function formatPrecio(v: number) {
  return `Bs. ${Number(v || 0).toFixed(2)}`
}

function formatFecha(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function cambiarEstado(p: Pedido, nuevoEstado: EstadoPedido) {
  if (!nuevoEstado || p.estadoPedido === nuevoEstado || estadoGuardando.value === p.id || esEstadoFinal(p)) return
  const estadoAnterior = p.estadoPedido
  estadoGuardando.value = p.id
  error.value = ''

  try {
    const pedidoActualizado = await http.patch(`pedidos/${p.id}/estado`, { estadoPedido: nuevoEstado }).then(r => r.data)
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
    if (payload?.id) quitarPedido(Number(payload.id))
  })
}

const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return pedidos.value.filter(p => {
    const texto = `${p.id} ${p.cliente?.nombre || ''} ${p.cliente?.apellido || ''} ${p.cliente?.telefono || ''} ${p.estadoPedido} ${direccionPedido(p)}`.toLowerCase()
    const matchBusqueda = !q || texto.includes(q)
    const matchEstado = filtroEstado.value ? p.estadoPedido === filtroEstado.value : true
    return matchBusqueda && matchEstado
  })
})

const resumen = computed(() => ({
  asignados: pedidos.value.filter(p => !['Entregado', 'Cancelado'].includes(p.estadoPedido)).length,
  enCamino: pedidos.value.filter(p => p.estadoPedido === 'En Camino').length,
  entregados: pedidos.value.filter(p => p.estadoPedido === 'Entregado').length,
}))

onMounted(async () => {
  await obtenerPedidosDelivery()
  conectarTiempoReal()
})

onBeforeUnmount(() => {
  eventSource?.close()
  eventSource = null
})
</script>

<template>
  <div>
    <div class="delivery-hero">
      <div>
        <span class="eyebrow">Panel exclusivo</span>
        <h2>Delivery</h2>
        <p>Solo se muestran pedidos con tipo de entrega <strong>Delivery</strong>. Los cambios de estado se notifican en tiempo real al Administrador y Cajero.</p>
      </div>
      <button class="btn-primary-gambu" @click="obtenerPedidosDelivery"><i class="pi pi-refresh"></i> Actualizar</button>
    </div>

    <div class="page-body delivery-body">
      <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>

      <div class="stats-row">
        <div class="stat-box"><div class="stat-icon blue"><i class="pi pi-truck"></i></div><div><div class="stat-value">{{ resumen.asignados }}</div><div class="stat-label">Pendientes delivery</div></div></div>
        <div class="stat-box"><div class="stat-icon amber"><i class="pi pi-send"></i></div><div><div class="stat-value">{{ resumen.enCamino }}</div><div class="stat-label">En camino</div></div></div>
        <div class="stat-box"><div class="stat-icon green"><i class="pi pi-check-circle"></i></div><div><div class="stat-value">{{ resumen.entregados }}</div><div class="stat-label">Entregados</div></div></div>
      </div>

      <div class="toolbar professional-toolbar">
        <div class="filters-left">
          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input v-model="busqueda" placeholder="Buscar pedido, cliente, teléfono o dirección..." />
          </div>
          <select v-model="filtroEstado" class="form-select filter-select">
            <option value="">Todos los estados</option>
            <option v-for="e in estadoOpciones" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
        <span class="result-counter">{{ filtrados.length }} pedido(s)</span>
      </div>

      <div class="delivery-grid">
        <article v-for="p in filtrados" :key="p.id" class="delivery-card">
          <div class="delivery-card-head">
            <div>
              <span class="order-code">Pedido #{{ p.id }}</span>
              <h3>{{ p.cliente?.nombre || 'Cliente' }} {{ p.cliente?.apellido || '' }}</h3>
              <p>{{ p.cliente?.telefono || p.cliente?.email || 'Sin contacto' }}</p>
            </div>
            <span :class="['badge', badgeEstado(p.estadoPedido)]">{{ p.estadoPedido }}</span>
          </div>

          <div class="delivery-field important">
            <span>Dirección de envío</span>
            <strong>{{ direccionPedido(p) }}</strong>
          </div>

          <div class="delivery-field">
            <span>Estado del pedido</span>
            <div class="status-inline">
              <select class="form-select" :value="''" :disabled="estadoGuardando === p.id || esEstadoFinal(p)" @change="cambiarEstadoDesdeSelect(p, $event)">
                <option value="" disabled>{{ esEstadoFinal(p) ? 'Pedido cerrado' : 'Cambiar estado' }}</option>
                <option v-for="e in estadosDelivery.filter(e => e !== p.estadoPedido)" :key="e" :value="e">{{ e }}</option>
              </select>
              <i v-if="estadoGuardando === p.id" class="pi pi-spin pi-spinner"></i>
            </div>
          </div>

          <div class="delivery-meta">
            <div><span>Total</span><strong>{{ formatPrecio(p.total) }}</strong></div>
            <div><span>Fecha</span><strong>{{ formatFecha(p.fechaCreacion) }}</strong></div>
            <div><span>Productos</span><strong>{{ p.detallesPedido?.length || 0 }} ítem(s)</strong></div>
          </div>

          <div class="final-state-note" v-if="esEstadoFinal(p)">
            <i class="pi pi-lock"></i> Pedido {{ p.estadoPedido.toLowerCase() }}. Ya no se permiten cambios desde Delivery.
          </div>

          <div class="delivery-actions">
            <button v-for="estado in estadosDelivery" :key="estado" class="btn-secondary-gambu" :disabled="estadoGuardando === p.id || p.estadoPedido === estado || esEstadoFinal(p)" @click="cambiarEstado(p, estado)">
              <i :class="estado === 'En Camino' ? 'pi pi-send' : 'pi pi-check'"></i> {{ estado }}
            </button>
          </div>
        </article>
      </div>

      <div v-if="filtrados.length === 0" class="empty-state">
        <i class="pi pi-truck"></i>
        <p>No hay pedidos delivery para mostrar.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delivery-hero { min-height: 240px; background: linear-gradient(90deg, rgba(26,10,0,0.94), rgba(61,26,0,0.72)), url('/restaurant/featured.jpg'); background-size: cover; background-position: center; color: #fff; padding: 2.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.eyebrow { color: var(--gambu-gold); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.2em; font-weight: 800; }
.delivery-hero h2 { font-size: clamp(2.2rem, 5vw, 4rem); color: #fff; margin: 0.4rem 0; }
.delivery-hero p { max-width: 740px; color: #eadfce; line-height: 1.55; }
.delivery-body { margin-top: -2rem; position: relative; z-index: 1; }
.professional-toolbar { align-items: center; }
.filters-left { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.filter-select { min-width: 180px; }
.result-counter { color: var(--gambu-muted); font-weight: 800; }
.delivery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1rem; }
.delivery-card { background: #fff; border: 1px solid var(--gambu-border); border-radius: 18px; box-shadow: var(--gambu-shadow); padding: 1.15rem; display: grid; gap: 1rem; }
.delivery-card-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.order-code { color: var(--gambu-amber); font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; }
.delivery-card h3 { color: var(--gambu-dark); font-size: 1.2rem; margin: 0.2rem 0; }
.delivery-card p { color: var(--gambu-muted); font-size: 0.85rem; }
.delivery-field { border: 1px solid var(--gambu-border); border-radius: 14px; padding: 0.85rem; background: var(--gambu-light); }
.delivery-field span { display: block; color: var(--gambu-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 900; margin-bottom: 0.35rem; }
.delivery-field strong { display: block; color: var(--gambu-dark); line-height: 1.45; }
.delivery-field.important { border-color: var(--gambu-amber); background: #fff7e6; }
.status-inline { display: flex; align-items: center; gap: 0.5rem; }
.status-inline .form-select { min-width: 180px; }
.delivery-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.55rem; }
.delivery-meta div { background: var(--gambu-light); border-radius: 12px; padding: 0.65rem; border: 1px solid var(--gambu-border); }
.delivery-meta span, .delivery-meta strong { display: block; }
.delivery-meta span { color: var(--gambu-muted); font-size: 0.7rem; text-transform: uppercase; font-weight: 800; }
.delivery-meta strong { color: var(--gambu-dark); font-size: 0.8rem; margin-top: 0.2rem; }
.delivery-actions { display: flex; gap: 0.55rem; flex-wrap: wrap; }
.delivery-actions button:disabled { opacity: 0.55; cursor: not-allowed; }
.final-state-note { display: inline-flex; align-items: center; gap: 0.45rem; margin-top: 0.25rem; color: var(--gambu-muted); font-weight: 800; font-size: 0.85rem; background: #f7f1e8; border: 1px solid var(--gambu-border); border-radius: 12px; padding: 0.65rem 0.8rem; }
@media (max-width: 800px) { .delivery-hero { flex-direction: column; align-items: flex-start; } .delivery-meta { grid-template-columns: 1fr; } }
</style>
