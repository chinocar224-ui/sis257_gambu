<script setup lang="ts">
import type { Producto } from '@/models/producto'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'productos'
const productos = ref<Producto[]>([])
const emit = defineEmits(['edit'])
const productoDelete = ref<Producto | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')

async function obtenerLista() {
  productos.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(p: Producto) { emit('edit', p) }
function confirmarEliminar(p: Producto) { productoDelete.value = p; mostrarConfirm.value = true }

async function eliminar() {
  await http.delete(`${ENDPOINT}/${productoDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

const filtrados = computed(() =>
  productos.value.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(busqueda.value.toLowerCase()) ||
    (p.categoria?.nombre || '').toLowerCase().includes(busqueda.value.toLowerCase())
  )
)

function formatPrecio(v: number) {
  return `Bs. ${Number(v).toFixed(2)}`
}

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input v-model="busqueda" placeholder="Buscar por nombre, descripción o categoría..." />
      </div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtrados.length }} registro(s)</span>
    </div>

    <div class="card-gambu">
      <table class="table-gambu">
        <thead>
          <tr>
            <th>#</th>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock Actual</th>
            <th>Stock Mín.</th>
            <th>Disponible</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in filtrados" :key="p.id">
            <td>{{ i + 1 }}</td>
            <td>
              <img v-if="p.imagenUrl" :src="p.imagenUrl" alt="img" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid var(--gambu-border)" />
              <div v-else style="width:48px;height:48px;background:var(--gambu-light);border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid var(--gambu-border)">
                <i class="pi pi-image" style="color:var(--gambu-muted)"></i>
              </div>
            </td>
            <td><strong>{{ p.nombre }}</strong><br><small style="color:var(--gambu-muted)">{{ p.descripcion?.substring(0,50) }}{{ (p.descripcion?.length || 0) > 50 ? '...' : '' }}</small></td>
            <td><span class="badge badge-amber">{{ p.categoria?.nombre || '—' }}</span></td>
            <td><strong>{{ formatPrecio(p.precio) }}</strong></td>
            <td>
              <span :class="['badge', p.stockActual <= p.stockMinimo ? 'badge-danger' : 'badge-success']">
                {{ p.stockActual }}
              </span>
            </td>
            <td>{{ p.stockMinimo }}</td>
            <td>
              <span :class="['badge', p.disponible ? 'badge-success' : 'badge-danger']">
                {{ p.disponible ? 'Sí' : 'No' }}
              </span>
            </td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(p)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarEliminar(p)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results">
            <td colspan="9">No se encontraron productos.</td>
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
          <p>¿Estás seguro de eliminar el producto <strong>{{ productoDelete?.nombre }}</strong>?</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button>
          <button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
