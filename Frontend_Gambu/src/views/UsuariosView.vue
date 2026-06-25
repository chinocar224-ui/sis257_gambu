<script setup lang="ts">
import UsuarioList from '@/components/usuarios/UsuarioList.vue'
import UsuarioSave from '@/components/usuarios/UsuarioSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof UsuarioList | null>(null)
const usuarioEdit = ref<any>(null)

function handleCreate() { usuarioEdit.value = null; mostrarDialog.value = true }
function handleEdit(u: any) { usuarioEdit.value = u; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Usuarios</h2>
        <p>Gestión de usuarios del sistema</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nuevo Usuario
      </button>
    </div>
    <div class="page-body">
      <UsuarioList ref="listRef" @edit="handleEdit" />
      <UsuarioSave :mostrar="mostrarDialog" :usuario="usuarioEdit" :modoEdicion="!!usuarioEdit" @guardar="handleGuardar" @close="handleClose" />
    </div>
  </div>
</template>
