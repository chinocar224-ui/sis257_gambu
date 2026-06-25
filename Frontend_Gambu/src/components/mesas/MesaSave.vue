<script setup lang="ts">
import type { Mesa } from '@/models/mesa'
import http from '@/plugins/axios'
import { ref, watch } from 'vue'

const ENDPOINT = 'mesas'
const props = defineProps({
  mostrar: Boolean,
  mesa: { type: Object as () => Mesa, default: () => ({}) as Mesa },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const form = ref<Partial<Mesa>>({})
const error = ref('')
const loading = ref(false)

const estadoOpciones = ['Disponible', 'Ocupada', 'Reservada']

watch(() => props.mesa, (v) => {
  form.value = { ...v, capacidad: v?.capacidad ?? 4, estado: v?.estado ?? 'Disponible' }
}, { immediate: true })

async function handleSave() {
  error.value = ''
  if (!form.value.numero || Number(form.value.numero) < 1) { error.value = 'El número de mesa es obligatorio y debe ser positivo.'; return }
  if (!form.value.capacidad || Number(form.value.capacidad) < 1) { error.value = 'La capacidad debe ser al menos 1.'; return }
  if (!form.value.estado) { error.value = 'El estado es obligatorio.'; return }
  loading.value = true
  try {
    const body = {
      numero: Number(form.value.numero),
      capacidad: Number(form.value.capacidad),
      estado: form.value.estado,
      descripcion: form.value.descripcion,
    }
    if (props.modoEdicion) {
      await http.patch(`${ENDPOINT}/${form.value.id}`, body)
    } else {
      await http.post(ENDPOINT, body)
    }
    emit('guardar')
    emit('close')
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al guardar.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="mostrar" class="dialog-overlay">
    <div class="dialog-box narrow">
      <div class="dialog-header">
        <h3>{{ modoEdicion ? 'Editar Mesa' : 'Nueva Mesa' }}</h3>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="form-grid single">
          <div class="form-group">
            <label class="form-label">Número de Mesa <span style="color:red">*</span></label>
            <input v-model="form.numero" type="number" min="1" class="form-input" placeholder="Ej: 1, 2, 3..." />
          </div>
          <div class="form-group">
            <label class="form-label">Capacidad (personas) <span style="color:red">*</span></label>
            <input v-model="form.capacidad" type="number" min="1" max="20" class="form-input" placeholder="4" />
          </div>
          <div class="form-group">
            <label class="form-label">Estado <span style="color:red">*</span></label>
            <select v-model="form.estado" class="form-select">
              <option v-for="e in estadoOpciones" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <input v-model="form.descripcion" class="form-input" placeholder="Ej: Terraza, junto a ventana..." maxlength="200" />
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
