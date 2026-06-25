<script setup lang="ts">
import PedidoList from '@/components/pedidos/PedidoList.vue'
import PedidoSave from '@/components/pedidos/PedidoSave.vue'
import PedidoDetalle from '@/components/pedidos/PedidoDetalle.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const mostrarDetalle = ref(false)
const listRef = ref<typeof PedidoList | null>(null)
const pedidoEdit = ref<any>(null)
const pedidoVer = ref<any>(null)

function handleCreate() { pedidoEdit.value = null; mostrarDialog.value = true }
function handleEdit(p: any) { pedidoEdit.value = p; mostrarDialog.value = true }
function handleVer(p: any) { pedidoVer.value = p; mostrarDetalle.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Pedidos</h2>
        <p>Gestión de pedidos del restaurante</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nuevo Pedido
      </button>
    </div>
    <div class="page-body">
      <PedidoList ref="listRef" @edit="handleEdit" @ver="handleVer" />
      <PedidoSave
        :mostrar="mostrarDialog"
        :pedido="pedidoEdit"
        :modoEdicion="!!pedidoEdit"
        @guardar="handleGuardar"
        @close="handleClose"
      />
      <PedidoDetalle
        :mostrar="mostrarDetalle"
        :pedido="pedidoVer"
        @close="mostrarDetalle = false"
      />
    </div>
  </div>
</template>
