<script setup lang="ts">
import DireccionList from '@/components/direcciones/DireccionList.vue'
import DireccionSave from '@/components/direcciones/DireccionSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof DireccionList | null>(null)
const direccionEdit = ref<any>(null)

function handleCreate() { direccionEdit.value = null; mostrarDialog.value = true }
function handleEdit(d: any) { direccionEdit.value = d; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Direcciones de Envío</h2>
        <p>Gestión de direcciones de clientes para delivery</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nueva Dirección
      </button>
    </div>
    <div class="page-body">
      <DireccionList ref="listRef" @edit="handleEdit" />
      <DireccionSave
        :mostrar="mostrarDialog"
        :direccion="direccionEdit"
        :modoEdicion="!!direccionEdit"
        @guardar="handleGuardar"
        @close="handleClose"
      />
    </div>
  </div>
</template>
