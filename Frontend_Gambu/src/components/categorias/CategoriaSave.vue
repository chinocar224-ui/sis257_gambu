<script setup lang="ts">
import type { Categoria } from '@/models/categoria'
import http from '@/plugins/axios'
import { ref, watch } from 'vue'

const ENDPOINT = 'categorias'
const props = defineProps({
  mostrar: Boolean,
  categoria: { type: Object as () => Categoria, default: () => ({}) as Categoria },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const form = ref<Partial<Categoria>>({})
const error = ref('')
const loading = ref(false)

watch(() => props.categoria, (v) => { form.value = { ...v } }, { immediate: true })

async function handleSave() {
  error.value = ''
  if (!form.value.nombre?.trim()) { error.value = 'El nombre es obligatorio.'; return }
  loading.value = true
  try {
    const body = { nombre: form.value.nombre, descripcion: form.value.descripcion }
    if (props.modoEdicion) {
      await http.patch(`${ENDPOINT}/${form.value.id}`, body)
    } else {
      await http.post(ENDPOINT, body)
    }
    emit('guardar')
    emit('close')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al guardar.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="mostrar" class="dialog-overlay">
    <div class="dialog-box narrow">
      <div class="dialog-header">
        <h3>{{ modoEdicion ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="form-grid single">
          <div class="form-group">
            <label class="form-label">Nombre <span style="color:red">*</span></label>
            <input v-model="form.nombre" class="form-input" placeholder="Ej: Entradas, Platos de fondo..." maxlength="50" />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.descripcion" class="form-textarea" placeholder="Descripción opcional de la categoría..." maxlength="500" rows="3"></textarea>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn-secondary-gambu" @click="emit('close')"><i class="pi pi-times"></i> Cancelar</button>
        <button class="btn-primary-gambu" :disabled="loading" @click="handleSave">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
          {{ loading ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>
