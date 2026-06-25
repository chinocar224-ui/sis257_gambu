<script setup lang="ts">
import ProductoList from '@/components/productos/ProductoList.vue'
import ProductoSave from '@/components/productos/ProductoSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof ProductoList | null>(null)
const productoEdit = ref<any>(null)

function handleCreate() { productoEdit.value = null; mostrarDialog.value = true }
function handleEdit(p: any) { productoEdit.value = p; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Productos</h2>
        <p>Gestión del menú y catálogo de productos</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nuevo Producto
      </button>
    </div>
    <div class="page-body">
      <ProductoList ref="listRef" @edit="handleEdit" />
      <ProductoSave
        :mostrar="mostrarDialog"
        :producto="productoEdit"
        :modoEdicion="!!productoEdit"
        @guardar="handleGuardar"
        @close="handleClose"
      />
    </div>
  </div>
</template>
