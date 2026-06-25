<script setup lang="ts">
import type { Categoria } from '@/models/categoria'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'categorias'
const categorias = ref<Categoria[]>([])
const emit = defineEmits(['edit'])
const categoriaDelete = ref<Categoria | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')

async function obtenerLista() {
  categorias.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(c: Categoria) { emit('edit', c) }

function confirmarEliminar(c: Categoria) {
  categoriaDelete.value = c
  mostrarConfirm.value = true
}

async function eliminar() {
  await http.delete(`${ENDPOINT}/${categoriaDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

const filtradas = computed(() =>
  categorias.value.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    (c.descripcion || '').toLowerCase().includes(busqueda.value.toLowerCase())
  )
)

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input v-model="busqueda" placeholder="Buscar por nombre o descripción..." />
      </div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtradas.length }} registro(s)</span>
    </div>

    <div class="card-gambu">
      <table class="table-gambu">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Fecha Creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in filtradas" :key="c.id">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ c.nombre }}</strong></td>
            <td style="max-width:300px">{{ c.descripcion || '—' }}</td>
            <td>{{ c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-BO') : '—' }}</td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(c)" title="Editar">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="action-btn delete" @click="confirmarEliminar(c)" title="Eliminar">
                <i class="pi pi-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="filtradas.length === 0" class="no-results">
            <td colspan="5">No se encontraron categorías.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm delete dialog -->
    <div v-if="mostrarConfirm" class="dialog-overlay">
      <div class="dialog-box confirm-dialog">
        <div class="dialog-header">
          <h3>Confirmar Eliminación</h3>
          <button class="btn-close-dialog" @click="mostrarConfirm = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="dialog-body">
          <p>¿Estás seguro de eliminar la categoría <strong>{{ categoriaDelete?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button>
          <button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
