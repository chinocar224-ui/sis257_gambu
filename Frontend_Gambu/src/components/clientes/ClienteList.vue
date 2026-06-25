<script setup lang="ts">
import type { Cliente } from '@/models/cliente'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'clientes'
const clientes = ref<Cliente[]>([])
const emit = defineEmits(['edit'])
const clienteDelete = ref<Cliente | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')
const filtroGrupo = ref('')
const error = ref('')
const loading = ref(false)
const grupos = ['Regular', 'Frecuente', 'VIP', 'Corporativo']

async function obtenerLista() {
  error.value = ''
  loading.value = true
  try {
    clientes.value = await http.get(ENDPOINT).then(r => r.data)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo cargar clientes.')
  } finally {
    loading.value = false
  }
}

onMounted(obtenerLista)
defineExpose({ obtenerLista })

function nombreCompleto(c: Cliente) {
  return `${c.nombre || ''} ${c.apellido || ''}`.trim()
}

const clientesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return clientes.value.filter(c => {
    const matchGrupo = !filtroGrupo.value || c.grupoCliente === filtroGrupo.value
    const texto = `${c.nombre || ''} ${c.apellido || ''} ${c.telefono || ''} ${c.email || ''} ${c.direccionPrincipal || ''}`.toLowerCase()
    return matchGrupo && (!q || texto.includes(q))
  })
})

const stats = computed(() => grupos.map(g => ({ grupo: g, total: clientes.value.filter(c => c.grupoCliente === g).length })))

function grupoClass(grupo?: string) {
  if (grupo === 'VIP') return 'badge badge-warning'
  if (grupo === 'Frecuente') return 'badge badge-success'
  if (grupo === 'Corporativo') return 'badge badge-info'
  return 'badge'
}

function confirmarDelete(cliente: Cliente) {
  clienteDelete.value = cliente
  mostrarConfirm.value = true
}

async function eliminar() {
  if (!clienteDelete.value) return
  try {
    await http.delete(`${ENDPOINT}/${clienteDelete.value.id}`)
    mostrarConfirm.value = false
    clienteDelete.value = null
    await obtenerLista()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo eliminar el cliente.')
  }
}
</script>

<template>
  <div>
    <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>

    <div class="mini-stats">
      <div v-for="s in stats" :key="s.grupo" class="mini-stat-card">
        <span>{{ s.grupo }}</span>
        <strong>{{ s.total }}</strong>
      </div>
    </div>

    <div class="toolbar clientes-toolbar">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input v-model="busqueda" placeholder="Buscar por nombre, teléfono, correo o dirección..." />
      </div>
      <select v-model="filtroGrupo" class="form-select group-filter">
        <option value="">Todos los grupos</option>
        <option v-for="g in grupos" :key="g" :value="g">{{ g }}</option>
      </select>
      <span class="result-counter">{{ clientesFiltrados.length }} cliente(s)</span>
    </div>

    <div class="table-responsive">
      <table class="table-gambu clientes-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Grupo</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Dirección principal</th>
            <th>Direcciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientesFiltrados" :key="c.id">
            <td>
              <div class="customer-cell">
                <strong>{{ nombreCompleto(c) }}</strong>
                <span>ID #{{ c.id }}</span>
              </div>
            </td>
            <td><span :class="grupoClass(c.grupoCliente)">{{ c.grupoCliente || 'Regular' }}</span></td>
            <td>{{ c.telefono || 'No proporcionado' }}</td>
            <td>{{ c.email || 'No proporcionado' }}</td>
            <td>{{ c.direccionPrincipal || 'Sin dirección' }}</td>
            <td>{{ c.direccionesEnvio?.length || 0 }}</td>
            <td class="actions-cell">
              <button class="action-btn edit" @click="emit('edit', c)"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarDelete(c)"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="!loading && clientesFiltrados.length === 0" class="no-results"><td colspan="7">No hay clientes registrados.</td></tr>
          <tr v-if="loading" class="no-results"><td colspan="7">Cargando clientes...</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarConfirm" class="dialog-overlay">
      <div class="dialog-box confirm-dialog">
        <div class="dialog-header"><h3>Eliminar Cliente</h3></div>
        <div class="dialog-body">
          <p>¿Seguro que deseas eliminar a <strong>{{ clienteDelete ? nombreCompleto(clienteDelete) : '' }}</strong>?</p>
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
.mini-stats { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.mini-stat-card { background: var(--gambu-light); border: 1px solid var(--gambu-border); border-radius: 12px; padding: 1rem; }
.mini-stat-card span { display: block; color: var(--gambu-muted); font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }
.mini-stat-card strong { display: block; color: var(--gambu-dark); font-size: 1.6rem; margin-top: 0.2rem; }
.clientes-toolbar { align-items: center; }
.search-bar { flex: 1; min-width: 260px; }
.group-filter { max-width: 190px; padding: 0.5rem 0.875rem; }
.result-counter { font-size: 0.85rem; color: var(--gambu-muted); }
.table-responsive { overflow-x: auto; }
.clientes-table { min-width: 1080px; }
.customer-cell strong, .customer-cell span { display: block; }
.customer-cell span { color: var(--gambu-muted); font-size: 0.75rem; margin-top: 0.15rem; }
.actions-cell { white-space: nowrap; }
@media (max-width: 800px) { .mini-stats { grid-template-columns: repeat(2, minmax(120px, 1fr)); } }
@media (max-width: 520px) { .mini-stats { grid-template-columns: 1fr; } }
</style>
