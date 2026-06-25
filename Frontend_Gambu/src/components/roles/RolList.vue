<script setup lang="ts">
import type { Rol } from '@/models/rol'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'roles'
const roles = ref<Rol[]>([])
const emit = defineEmits(['edit'])
const rolDelete = ref<Rol | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')

async function obtenerLista() {
  roles.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(r: Rol) { emit('edit', r) }
function confirmarEliminar(r: Rol) { rolDelete.value = r; mostrarConfirm.value = true }

async function eliminar() {
  await http.delete(`${ENDPOINT}/${rolDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

const filtrados = computed(() =>
  roles.value.filter(r => r.nombreRol.toLowerCase().includes(busqueda.value.toLowerCase()))
)

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input v-model="busqueda" placeholder="Buscar rol..." />
      </div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtrados.length }} registro(s)</span>
    </div>
    <div class="card-gambu">
      <table class="table-gambu">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre del Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in filtrados" :key="r.id">
            <td>{{ i + 1 }}</td>
            <td><span class="badge badge-info">{{ r.nombreRol }}</span></td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(r)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarEliminar(r)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results">
            <td colspan="3">No se encontraron roles.</td>
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
          <p>¿Estás seguro de eliminar el rol <strong>{{ rolDelete?.nombreRol }}</strong>?</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button>
          <button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
