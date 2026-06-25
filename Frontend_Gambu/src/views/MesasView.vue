<script setup lang="ts">
import MesaList from '@/components/mesas/MesaList.vue'
import MesaSave from '@/components/mesas/MesaSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof MesaList | null>(null)
const mesaEdit = ref<any>(null)

function handleCreate() { mesaEdit.value = null; mostrarDialog.value = true }
function handleEdit(m: any) { mesaEdit.value = m; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Mesas</h2>
        <p>Gestión del salón y estado de las mesas</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nueva Mesa
      </button>
    </div>
    <div class="page-body">
      <MesaList ref="listRef" @edit="handleEdit" />
      <MesaSave :mostrar="mostrarDialog" :mesa="mesaEdit" :modoEdicion="!!mesaEdit" @guardar="handleGuardar" @close="handleClose" />
    </div>
  </div>
</template>
