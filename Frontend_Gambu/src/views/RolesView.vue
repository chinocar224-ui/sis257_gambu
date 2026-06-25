<script setup lang="ts">
import RolList from '@/components/roles/RolList.vue'
import RolSave from '@/components/roles/RolSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof RolList | null>(null)
const rolEdit = ref<any>(null)

function handleCreate() { rolEdit.value = null; mostrarDialog.value = true }
function handleEdit(r: any) { rolEdit.value = r; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Roles</h2>
        <p>Gestión de roles y permisos del sistema</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nuevo Rol
      </button>
    </div>
    <div class="page-body">
      <RolList ref="listRef" @edit="handleEdit" />
      <RolSave :mostrar="mostrarDialog" :rol="rolEdit" :modoEdicion="!!rolEdit" @guardar="handleGuardar" @close="handleClose" />
    </div>
  </div>
</template>
