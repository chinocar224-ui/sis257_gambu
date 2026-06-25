<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, computed } from 'vue'
import http from '@/plugins/axios'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const stats = ref({ productos: 0, categorias: 0, clientes: 0, mesas: 0, pedidos: 0, activos: 0, ingresos: 0, pagosRegistrados: 0 })
const loading = ref(true)
const pedidosRecientes = ref<any[]>([])
let eventSource: EventSource | null = null

async function cargarPanel() {
  try {
    const [prods, cats, clientes, mesas, pedidos, pagos] = await Promise.all([
      http.get('productos').then(r => r.data),
      http.get('categorias').then(r => r.data),
      http.get('clientes').then(r => r.data).catch(() => []),
      http.get('mesas').then(r => r.data),
      http.get('pedidos').then(r => r.data),
      http.get('pagos').then(r => r.data).catch(() => []),
    ])
    stats.value = {
      productos: prods.length,
      categorias: cats.length,
      clientes: clientes.length,
      mesas: mesas.length,
      pedidos: pedidos.length,
      activos: pedidos.filter((p: any) => !['Entregado', 'Cancelado'].includes(p.estadoPedido)).length,
      ingresos: pagos.filter((p: any) => p.estadoPago === 'Aprobado').reduce((acc: number, p: any) => acc + Number(p.monto || 0), 0),
      pagosRegistrados: pagos.length,
    }
    pedidosRecientes.value = pedidos.slice(0, 5)
  } catch {
    // Vista inicial tolerante si el backend todavía no está levantado.
  } finally {
    loading.value = false
  }
}

function conectarTiempoReal() {
  if (!authStore.token || eventSource) return
  const baseUrl = String(import.meta.env.VITE_BASE_URL_ENDPOINT || '').replace(/\/$/, '')
  eventSource = new EventSource(`${baseUrl}/pedidos/stream?token=${encodeURIComponent(authStore.token)}`)

  const refrescar = () => { void cargarPanel() }
  eventSource.addEventListener('pedido-creado', refrescar)
  eventSource.addEventListener('pedido-actualizado', refrescar)
  eventSource.addEventListener('pedido-eliminado', refrescar)
}

onMounted(async () => {
  await cargarPanel()
  conectarTiempoReal()
})

onBeforeUnmount(() => {
  eventSource?.close()
  eventSource = null
})

const mensajeEstado = computed(() => loading.value ? 'Cargando datos...' : 'Panel operativo actualizado en tiempo real')

function formatPrecio(v: number) {
  return `Bs. ${Number(v || 0).toFixed(2)}`
}
</script>

<template>
  <div>
    <div class="home-hero">
      <div>
        <span class="eyebrow">Gambu Restaurant</span>
        <h2>Panel de control profesional para pedidos, mesas y delivery</h2>
        <p>{{ mensajeEstado }} · Usa los accesos rápidos para operar como punto de venta.</p>
      </div>
      <RouterLink to="/pedidos" class="hero-action"><i class="pi pi-plus"></i> Nuevo Pedido</RouterLink>
    </div>

    <div class="page-body home-body">
      <div class="stats-row enhanced-stats">
        <div class="stat-box">
          <div class="stat-icon amber"><i class="pi pi-box"></i></div>
          <div><div class="stat-value">{{ stats.productos }}</div><div class="stat-label">Productos</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon green"><i class="pi pi-tags"></i></div>
          <div><div class="stat-value">{{ stats.categorias }}</div><div class="stat-label">Categorías</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon blue"><i class="pi pi-users"></i></div>
          <div><div class="stat-value">{{ stats.clientes }}</div><div class="stat-label">Clientes</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon blue"><i class="pi pi-table"></i></div>
          <div><div class="stat-value">{{ stats.mesas }}</div><div class="stat-label">Mesas</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon red"><i class="pi pi-shopping-cart"></i></div>
          <div><div class="stat-value">{{ stats.activos }}</div><div class="stat-label">Pedidos activos</div></div>
        </div>
        <div v-if="authStore.isAdmin" class="stat-box income-box">
          <div class="stat-icon amber"><i class="pi pi-wallet"></i></div>
          <div><div class="stat-value">{{ formatPrecio(stats.ingresos) }}</div><div class="stat-label">Ingresos aprobados</div></div>
        </div>
        <div v-else class="stat-box">
          <div class="stat-icon amber"><i class="pi pi-credit-card"></i></div>
          <div><div class="stat-value">{{ stats.pagosRegistrados }}</div><div class="stat-label">Pagos registrados</div></div>
        </div>
      </div>

      <div class="home-grid">
        <div class="card-gambu">
          <div class="card-gambu-header"><h3>Accesos rápidos</h3></div>
          <div class="card-gambu-body quick-grid">
            <RouterLink to="/pedidos" class="quick-link"><i class="pi pi-shopping-cart"></i><span>Nuevo pedido</span></RouterLink>
            <RouterLink to="/pagos" class="quick-link"><i class="pi pi-credit-card"></i><span>Registrar pago</span></RouterLink>
            <RouterLink to="/productos" class="quick-link"><i class="pi pi-box"></i><span>Productos</span></RouterLink>
            <RouterLink to="/mesas" class="quick-link"><i class="pi pi-table"></i><span>Mesas</span></RouterLink>
            <RouterLink to="/clientes" class="quick-link"><i class="pi pi-id-card"></i><span>Clientes</span></RouterLink>
            <RouterLink to="/direcciones" class="quick-link"><i class="pi pi-map-marker"></i><span>Direcciones</span></RouterLink>
            <RouterLink v-if="authStore.isAdmin" to="/reportes" class="quick-link"><i class="pi pi-chart-line"></i><span>Reportes</span></RouterLink>
          </div>
        </div>

        <div class="card-gambu">
          <div class="card-gambu-header"><h3>Pedidos recientes</h3></div>
          <div class="card-gambu-body recent-list">
            <div v-for="p in pedidosRecientes" :key="p.id" class="recent-item">
              <div><strong>#{{ p.id }} · {{ p.cliente?.nombre || 'Cliente' }}</strong><span>{{ p.tipoEntrega }} · {{ p.estadoPedido }}</span></div>
              <b>{{ formatPrecio(p.total) }}</b>
            </div>
            <div v-if="pedidosRecientes.length === 0" class="empty-state compact"><i class="pi pi-inbox"></i><p>Aún no hay pedidos recientes.</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-hero { min-height: 260px; background: linear-gradient(90deg, rgba(26,10,0,0.92), rgba(61,26,0,0.68)), url('/restaurant/pricing.jpg'); background-size: cover; background-position: center; color: #fff; padding: 2.5rem; display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
.eyebrow { color: var(--gambu-gold); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.2em; font-weight: 800; }
.home-hero h2 { max-width: 760px; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.05; margin: 0.6rem 0; color: #fff; }
.home-hero p { color: #eadfce; max-width: 680px; }
.hero-action { background: var(--gambu-gold); color: var(--gambu-dark); text-decoration: none; border-radius: 999px; padding: 0.85rem 1.25rem; font-weight: 900; display: inline-flex; align-items: center; gap: 0.45rem; white-space: nowrap; }
.home-body { margin-top: -2.2rem; position: relative; z-index: 1; }
.enhanced-stats { grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); }
.income-box { grid-column: span 2; }
.home-grid { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 1.25rem; }
.quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
.quick-link { background: var(--gambu-light); border: 1.5px solid var(--gambu-border); border-radius: 14px; padding: 1.25rem; text-align: center; cursor: pointer; transition: all 0.2s; color: var(--gambu-text); text-decoration: none; }
.quick-link:hover { border-color: var(--gambu-amber); background: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(200,118,26,0.15); }
.quick-link i { font-size: 1.5rem; color: var(--gambu-amber); display: block; margin-bottom: 0.5rem; }
.quick-link span { font-size: 0.875rem; font-weight: 700; }
.recent-list { display: grid; gap: 0.75rem; }
.recent-item { border: 1px solid var(--gambu-border); background: var(--gambu-light); border-radius: 12px; padding: 0.8rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.recent-item strong, .recent-item span { display: block; }
.recent-item span { color: var(--gambu-muted); font-size: 0.78rem; margin-top: 0.15rem; }
.recent-item b { color: var(--gambu-amber); white-space: nowrap; }
.empty-state.compact { padding: 2rem 1rem; }
@media (max-width: 1050px) { .home-hero { flex-direction: column; align-items: flex-start; } .home-grid { grid-template-columns: 1fr; } .income-box { grid-column: auto; } }
</style>
