<script setup lang="ts">
import http from '@/plugins/axios'
import { computed, onMounted, ref, watch } from 'vue'

const hoy = new Date()
const fechaHoy = hoy.toISOString().slice(0, 10)
const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)

const periodo = ref('mes')
const desde = ref('')
const hasta = ref('')
const reporte = ref<any>(null)
const loading = ref(false)
const error = ref('')

const periodos = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
]

watch(periodo, (v) => {
  if (v === 'personalizado') {
    if (!desde.value) desde.value = primerDia
    if (!hasta.value) hasta.value = fechaHoy
  } else {
    desde.value = ''
    hasta.value = ''
  }
})

async function cargarReporte() {
  error.value = ''
  loading.value = true
  try {
    const params: any = { periodo: periodo.value }
    if (periodo.value === 'personalizado') {
      params.desde = desde.value
      params.hasta = hasta.value
    }
    reporte.value = await http.get('reportes/ventas', { params }).then(r => r.data)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo generar el reporte.')
  } finally {
    loading.value = false
  }
}

const resumen = computed(() => reporte.value?.resumen || { totalVentas: 0, totalBruto: 0, totalDescuentos: 0, numeroPagos: 0, ticketPromedio: 0, totalProductosVendidos: 0 })

function formatPrecio(v: number) { return `Bs. ${Number(v || 0).toFixed(2)}` }
function formatFecha(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function imprimir() { window.print() }
function descargarCsv() {
  const pagos = reporte.value?.pagos || []
  const encabezado = ['ID Pago', 'Fecha', 'Cliente', 'Grupo', 'Pedido', 'Entrega', 'Estado', 'Metodo', 'Subtotal', 'Descuento %', 'Descuento Bs', 'Monto Final']
  const filas = pagos.map((p: any) => [p.id, formatFecha(p.fechaPago), p.pedido?.cliente || '', p.pedido?.grupoCliente || '', p.pedido?.id || '', p.pedido?.tipoEntrega || '', p.pedido?.estadoPedido || '', p.metodoPago, Number(p.montoOriginal || 0).toFixed(2), Number(p.porcentajeDescuento || 0).toFixed(2), Number(p.descuentoAplicado || 0).toFixed(2), Number(p.monto || 0).toFixed(2)])
  const csv = [encabezado, ...filas].map(row => row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte-ventas-${reporte.value?.rango?.desde || 'desde'}-${reporte.value?.rango?.hasta || 'hasta'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(cargarReporte)
</script>

<template>
  <div class="report-page">
    <div class="card-gambu report-filter no-print">
      <div class="card-gambu-body filters-report">
        <div class="form-group">
          <label class="form-label">Tipo de reporte</label>
          <select v-model="periodo" class="form-select">
            <option v-for="p in periodos" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="form-group" v-if="periodo === 'personalizado'">
          <label class="form-label">Desde</label>
          <input v-model="desde" type="date" class="form-input" />
        </div>
        <div class="form-group" v-if="periodo === 'personalizado'">
          <label class="form-label">Hasta</label>
          <input v-model="hasta" type="date" class="form-input" />
        </div>
        <button class="btn-primary-gambu" :disabled="loading" @click="cargarReporte">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-chart-bar'"></i>
          {{ loading ? 'Generando...' : 'Generar Reporte' }}
        </button>
        <button class="btn-secondary-gambu" :disabled="!reporte" @click="imprimir">
          <i class="pi pi-print"></i> Imprimir
        </button>
        <button class="btn-secondary-gambu" :disabled="!reporte" @click="descargarCsv">
          <i class="pi pi-download"></i> CSV
        </button>
      </div>
    </div>

    <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>

    <div v-if="reporte" class="print-area">
      <div class="report-title">
        <div>
          <span class="eyebrow">Gambu Restaurant</span>
          <h3>Reporte de Ventas</h3>
          <p>Tipo: {{ reporte.rango.periodo }} · Periodo: {{ reporte.rango.desde }} al {{ reporte.rango.hasta }}</p>
        </div>
        <div class="report-stamp">POS · SIS257</div>
      </div>

      <div class="report-stats">
        <div class="stat-box">
          <div class="stat-icon amber"><i class="pi pi-wallet"></i></div>
          <div><div class="stat-value">{{ formatPrecio(resumen.totalVentas) }}</div><div class="stat-label">Total cobrado</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon green"><i class="pi pi-percentage"></i></div>
          <div><div class="stat-value">{{ formatPrecio(resumen.totalDescuentos) }}</div><div class="stat-label">Descuentos</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon blue"><i class="pi pi-check-circle"></i></div>
          <div><div class="stat-value">{{ resumen.numeroPagos }}</div><div class="stat-label">Pagos aprobados</div></div>
        </div>
        <div class="stat-box">
          <div class="stat-icon red"><i class="pi pi-shopping-cart"></i></div>
          <div><div class="stat-value">{{ resumen.totalProductosVendidos }}</div><div class="stat-label">Productos vendidos</div></div>
        </div>
      </div>

      <div class="report-grid">
        <div class="card-gambu">
          <div class="card-gambu-header"><h3>Ventas por método de pago</h3></div>
          <div class="card-gambu-body compact-list">
            <div v-for="m in reporte.porMetodo" :key="m.metodo" class="report-row">
              <span>{{ m.metodo }}</span><strong>{{ formatPrecio(m.total) }}</strong>
            </div>
            <div v-if="!reporte.porMetodo.length" class="empty-report">Sin datos</div>
          </div>
        </div>

        <div class="card-gambu">
          <div class="card-gambu-header"><h3>Ventas por tipo de entrega</h3></div>
          <div class="card-gambu-body compact-list">
            <div v-for="t in reporte.porTipoEntrega" :key="t.tipoEntrega" class="report-row">
              <span>{{ t.tipoEntrega }}</span><strong>{{ formatPrecio(t.total) }}</strong>
            </div>
            <div v-if="!reporte.porTipoEntrega.length" class="empty-report">Sin datos</div>
          </div>
        </div>
      </div>

      <div class="card-gambu report-section">
        <div class="card-gambu-header"><h3>Top productos vendidos</h3></div>
        <div class="table-responsive">
          <table class="table-gambu">
            <thead><tr><th>#</th><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-for="(p, i) in reporte.productosMasVendidos" :key="p.producto">
                <td>{{ Number(i) + 1 }}</td><td><strong>{{ p.producto }}</strong></td><td>{{ p.cantidad }}</td><td>{{ formatPrecio(p.total) }}</td>
              </tr>
              <tr v-if="!reporte.productosMasVendidos.length" class="no-results"><td colspan="4">Sin productos vendidos en el periodo.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-gambu report-section">
        <div class="card-gambu-header"><h3>Detalle de pagos aprobados</h3></div>
        <div class="table-responsive">
          <table class="table-gambu pagos-table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Grupo</th><th>Pedido</th><th>Entrega</th><th>Estado</th><th>Método</th><th>Subtotal</th><th>Desc.</th><th>Monto Final</th></tr></thead>
            <tbody>
              <tr v-for="p in reporte.pagos" :key="p.id">
                <td>{{ formatFecha(p.fechaPago) }}</td>
                <td>{{ p.pedido?.cliente || '—' }}</td>
                <td><span class="badge">{{ p.pedido?.grupoCliente || 'Regular' }}</span></td>
                <td>#{{ p.pedido?.id || '—' }}</td>
                <td>{{ p.pedido?.tipoEntrega || '—' }}</td>
                <td>{{ p.pedido?.estadoPedido || '—' }}</td>
                <td><span class="badge badge-info">{{ p.metodoPago }}</span></td>
                <td>{{ formatPrecio(p.montoOriginal) }}</td>
                <td>- {{ formatPrecio(p.descuentoAplicado) }} <small v-if="Number(p.porcentajeDescuento || 0) > 0">({{ p.porcentajeDescuento }}%)</small></td>
                <td><strong>{{ formatPrecio(p.monto) }}</strong></td>
              </tr>
              <tr v-if="!reporte.pagos.length" class="no-results"><td colspan="10">No existen pagos aprobados en este periodo.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-filter { margin-bottom: 1rem; }
.filters-report { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }
.filters-report .form-group { min-width: 180px; margin-bottom: 0; }
.report-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; background: #fff; border: 1px solid var(--gambu-border); border-radius: 14px; padding: 1.25rem 1.5rem; box-shadow: var(--gambu-shadow); }
.report-title h3 { font-size: 1.75rem; color: var(--gambu-dark); }
.report-title p { color: var(--gambu-muted); margin-top: 0.25rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.16em; color: var(--gambu-amber); font-size: 0.72rem; font-weight: 800; }
.report-stamp { border: 1px solid var(--gambu-border); color: var(--gambu-muted); padding: 0.5rem 0.75rem; border-radius: 999px; font-weight: 800; font-size: 0.75rem; }
.report-stats { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.report-grid { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.report-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--gambu-border); }
.report-row:last-child { border-bottom: 0; }
.empty-report { color: var(--gambu-muted); text-align: center; padding: 1rem; }
.report-section { margin-bottom: 1rem; }
.table-responsive { overflow-x: auto; }
.pagos-table { min-width: 900px; }
@media (max-width: 980px) { .report-stats, .report-grid { grid-template-columns: 1fr; } .report-title { flex-direction: column; align-items: flex-start; gap: 0.75rem; } }
@media print { .no-print, .sidebar, .page-header { display: none !important; } .main-content { margin-left: 0 !important; background: #fff !important; } .page-body { padding: 0 !important; } .card-gambu { box-shadow: none !important; break-inside: avoid; } }
</style>
