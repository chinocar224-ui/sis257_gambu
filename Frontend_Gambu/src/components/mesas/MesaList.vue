<script setup lang="ts">
import type { Mesa } from '@/models/mesa'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'mesas'
const mesas = ref<Mesa[]>([])
const emit = defineEmits(['edit'])
const mesaDelete = ref<Mesa | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')

async function obtenerLista() {
  mesas.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(m: Mesa) { emit('edit', m) }
function confirmarEliminar(m: Mesa) { mesaDelete.value = m; mostrarConfirm.value = true }

async function eliminar() {
  await http.delete(`${ENDPOINT}/${mesaDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

const filtrados = computed(() =>
  mesas.value.filter(m =>
    String(m.numero).includes(busqueda.value) ||
    m.estado.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    (m.descripcion || '').toLowerCase().includes(busqueda.value.toLowerCase())
  )
)

function badgeEstado(estado: string) {
  if (estado === 'Disponible') return 'badge-success'
  if (estado === 'Ocupada') return 'badge-danger'
  return 'badge-warning'
}

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input v-model="busqueda" placeholder="Buscar por número, estado o descripción..." />
      </div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtrados.length }} mesa(s)</span>
    </div>
    <div class="card-gambu">
      <table class="table-gambu">
        <thead>
          <tr>
            <th>#</th>
            <th>Nro. Mesa</th>
            <th>Capacidad</th>
            <th>Estado</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in filtrados" :key="m.id">
            <td>{{ i + 1 }}</td>
            <td><strong style="font-size:1.1rem">Mesa {{ m.numero }}</strong></td>
            <td><i class="pi pi-users" style="color:var(--gambu-muted);margin-right:4px"></i>{{ m.capacidad }} personas</td>
            <td><span :class="['badge', badgeEstado(m.estado)]">{{ m.estado }}</span></td>
            <td>{{ m.descripcion || '—' }}</td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(m)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarEliminar(m)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results">
            <td colspan="6">No se encontraron mesas.</td>
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
          <p>¿Estás seguro de eliminar la <strong>Mesa {{ mesaDelete?.numero }}</strong>?</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button>
          <button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
