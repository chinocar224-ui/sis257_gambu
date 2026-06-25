<script setup lang="ts">
import PagoList from '@/components/pagos/PagoList.vue'
import PagoSave from '@/components/pagos/PagoSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof PagoList | null>(null)
const pagoEdit = ref<any>(null)

function handleCreate() { pagoEdit.value = null; mostrarDialog.value = true }
function handleEdit(p: any) { pagoEdit.value = p; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Pagos</h2>
        <p>Registro y gestión de pagos de pedidos</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Registrar Pago
      </button>
    </div>
    <div class="page-body">
      <PagoList ref="listRef" @edit="handleEdit" />
      <PagoSave
        :mostrar="mostrarDialog"
        :pago="pagoEdit"
        :modoEdicion="!!pagoEdit"
        @guardar="handleGuardar"
        @close="handleClose"
      />
    </div>
  </div>
</template>
