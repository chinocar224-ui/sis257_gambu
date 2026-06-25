<script setup lang="ts">
import type { Usuario } from '@/models/usuario'
import http from '@/plugins/axios'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'usuarios'
const usuarios = ref<Usuario[]>([])
const emit = defineEmits(['edit'])
const usuarioDelete = ref<Usuario | null>(null)
const mostrarConfirm = ref(false)
const busqueda = ref('')

async function obtenerLista() {
  usuarios.value = await http.get(ENDPOINT).then(r => r.data)
}

function emitirEdicion(u: Usuario) { emit('edit', u) }
function confirmarEliminar(u: Usuario) { usuarioDelete.value = u; mostrarConfirm.value = true }

async function eliminar() {
  await http.delete(`${ENDPOINT}/${usuarioDelete.value?.id}`)
  await obtenerLista()
  mostrarConfirm.value = false
}

const filtrados = computed(() =>
  usuarios.value.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    u.apellido.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    u.usuario.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.value.toLowerCase())
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
        <input v-model="busqueda" placeholder="Buscar por nombre, usuario o email..." />
      </div>
      <span style="font-size:0.85rem;color:var(--gambu-muted)">{{ filtrados.length }} registro(s)</span>
    </div>
    <div class="card-gambu">
      <table class="table-gambu">
        <thead>
          <tr>
            <th>#</th>
            <th>Usuario</th>
            <th>Nombre Completo</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in filtrados" :key="u.id">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ u.usuario }}</strong></td>
            <td>{{ u.nombre }} {{ u.apellido }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.telefono || '—' }}</td>
            <td><span class="badge badge-info">{{ u.rol?.nombreRol || '—' }}</span></td>
            <td>
              <button class="action-btn edit" @click="emitirEdicion(u)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="action-btn delete" @click="confirmarEliminar(u)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="filtrados.length === 0" class="no-results">
            <td colspan="7">No se encontraron usuarios.</td>
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
          <p>¿Estás seguro de eliminar el usuario <strong>{{ usuarioDelete?.usuario }}</strong> ({{ usuarioDelete?.nombre }} {{ usuarioDelete?.apellido }})?</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary-gambu" @click="mostrarConfirm = false">Cancelar</button>
          <button class="btn-danger-gambu" @click="eliminar"><i class="pi pi-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
