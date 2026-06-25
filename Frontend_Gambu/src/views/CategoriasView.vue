<script setup lang="ts">
import CategoriaList from '@/components/categorias/CategoriaList.vue'
import CategoriaSave from '@/components/categorias/CategoriaSave.vue'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const listRef = ref<typeof CategoriaList | null>(null)
const categoriaEdit = ref<any>(null)

function handleCreate() { categoriaEdit.value = null; mostrarDialog.value = true }
function handleEdit(c: any) { categoriaEdit.value = c; mostrarDialog.value = true }
function handleClose() { mostrarDialog.value = false }
function handleGuardar() { listRef.value?.obtenerLista() }
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Categorías</h2>
        <p>Gestión de categorías de productos del menú</p>
      </div>
      <button class="btn-primary-gambu" @click="handleCreate">
        <i class="pi pi-plus"></i> Nueva Categoría
      </button>
    </div>
    <div class="page-body">
      <CategoriaList ref="listRef" @edit="handleEdit" />
      <CategoriaSave
        :mostrar="mostrarDialog"
        :categoria="categoriaEdit"
        :modoEdicion="!!categoriaEdit"
        @guardar="handleGuardar"
        @close="handleClose"
      />
    </div>
  </div>
</template>
