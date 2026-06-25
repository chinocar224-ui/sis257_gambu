<script setup lang="ts">
import type { DireccionEnvio } from '@/models/direccionEnvio'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'direcciones-envio'
const direcciones = ref<DireccionEnvio[]>([])
const emit = defineEmits(['edit'])
const dirDelete = ref<DireccionEnvio | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')

async function obtenerLista() {
  direcciones.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(d: DireccionEnvio) { emit('edit', d) }
function confirmarEliminar(d: DireccionEnvio) { dirDelete.value = d; mostrarConfirm.value = true }

async function eliminar() {
  await http.delete(`${ENDPOINT}/${dirDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

function nombreCliente(d: DireccionEnvio) {
  return d.cliente ? `${d.cliente.nombre} ${d.cliente.apellido || ''}`.trim() : `Cliente #${d.idCliente}`
}

const filtrados = computed(() =>
  direcciones.value.filter(d => {
    const q = busqueda.value.toLowerCase()
    return d.direccion.toLowerCase().includes(q) || d.ciudad.toLowerCase().includes(q) || nombreCliente(d).toLowerCase().includes(q)
  })
)

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="search-bar"><i class="pi pi-search"></i><input v-model="busqueda" placeholder="Buscar por cliente, dirección o ciudad..." /></div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtrados.length }} registro(s)</span>
    </div>
    <div class="card-gambu table-responsive">
      <table class="table-gambu direcciones-table">
        <thead><tr><th>#</th><th>Cliente</th><th>Dirección</th><th>Ciudad</th><th>Indicaciones / Referencia</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="(d, i) in filtrados" :key="d.id">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ nombreCliente(d) }}</strong></td>
            <td>{{ d.direccion }}</td>
            <td><span class="badge badge-info">{{ d.ciudad }}</span></td>
            <td>{{ d.indicacionesReferencia || '—' }}</td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(d)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarEliminar(d)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results"><td colspan="6">No se encontraron direcciones.</td></tr>
        </tbody>
      </table>
    </div>
    <div v-if="mostrarConfirm" class="dialog-overlay">
      <div class="dialog-box confirm-dialog">
        <div class="dialog-header"><h3>Confirmar Eliminación</h3><button class="btn-close-dialog" @click="mostrarConfirm = false"><i class="pi pi-times"></i></button></div>
        <div class="dialog-body"><p>¿Estás seguro de eliminar la dirección <strong>{{ dirDelete?.direccion }}</strong>?</p></div>
        <div class="dialog-footer"><button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button><button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button></div>
      </div>
    </div>
  </div>
</template>

<style scoped>.direcciones-table{min-width:900px}.table-responsive{overflow-x:auto}</style>
