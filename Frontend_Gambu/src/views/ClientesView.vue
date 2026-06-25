<script setup lang="ts">
import ClienteList from '@/components/clientes/ClienteList.vue'
import ClienteSave from '@/components/clientes/ClienteSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof ClienteList | null>(null)
const clienteEdit = ref<any>(null)

function handleCreate() { clienteEdit.value = null; mostrarDialog.value = true }
function handleEdit(c: any) { clienteEdit.value = c; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Clientes</h2>
        <p>CRUD profesional de clientes con grupos, buscador y validaciones</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nuevo Cliente
      </button>
    </div>
    <div class="page-body">
      <ClienteList ref="listRef" @edit="handleEdit" />
      <ClienteSave
        :mostrar="mostrarDialog"
        :cliente="clienteEdit"
        :modoEdicion="!!clienteEdit"
        @guardar="handleGuardar"
        @close="handleClose"
      />
    </div>
  </div>
</template>
