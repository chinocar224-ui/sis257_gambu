<script setup lang="ts">
import type { Rol } from '@/models/rol'
import http from '@/plugins/axios'
import { ref, watch } from 'vue'

const ENDPOINT = 'roles'
const props = defineProps({
  mostrar: Boolean,
  rol: { type: Object as () => Rol, default: () => ({}) as Rol },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const form = ref<Partial<Rol>>({})
const error = ref('')
const loading = ref(false)

watch(() => props.rol, (v) => { form.value = { ...v } }, { immediate: true })

async function handleSave() {
  error.value = ''
  if (!form.value.nombreRol?.trim()) { error.value = 'El nombre del rol es obligatorio.'; return }
  loading.value = true
  try {
    const body = { nombreRol: form.value.nombreRol }
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
        <h3>{{ modoEdicion ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="form-group">
          <label class="form-label">Nombre del Rol <span style="color:red">*</span></label>
          <input v-model="form.nombreRol" class="form-input" placeholder="Ej: Administrador, Mesero, Cajero..." maxlength="50" />
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
