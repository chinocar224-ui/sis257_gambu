<script setup lang="ts">
import type { DireccionEnvio } from '@/models/direccionEnvio'
import type { Cliente } from '@/models/cliente'
import http from '@/plugins/axios'
import { ref, watch, onMounted } from 'vue'

const ENDPOINT = 'direcciones-envio'
const props = defineProps({ mostrar: Boolean, direccion: { type: Object as () => DireccionEnvio, default: () => ({}) as DireccionEnvio }, modoEdicion: Boolean })
const emit = defineEmits(['guardar', 'close'])
const form = ref<Partial<DireccionEnvio>>({})
const clientes = ref<Cliente[]>([])
const error = ref('')
const loading = ref(false)

watch(() => props.direccion, (v) => { form.value = { ...v, ciudad: v?.ciudad || 'Sucre' } }, { immediate: true })
onMounted(async () => { clientes.value = await http.get('clientes').then(r => r.data) })

async function handleSave() {
  error.value = ''
  if (!form.value.idCliente) { error.value = 'Selecciona un cliente.'; return }
  if (!form.value.direccion?.trim()) { error.value = 'La dirección es obligatoria.'; return }
  if (!form.value.ciudad?.trim()) { error.value = 'La ciudad es obligatoria.'; return }
  loading.value = true
  try {
    const body = { idCliente: Number(form.value.idCliente), direccion: form.value.direccion, ciudad: form.value.ciudad, indicacionesReferencia: form.value.indicacionesReferencia }
    if (props.modoEdicion) await http.patch(`${ENDPOINT}/${form.value.id}`, body)
    else await http.post(ENDPOINT, body)
    emit('guardar'); emit('close')
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al guardar.')
  } finally { loading.value = false }
}
</script>

<template>
  <div v-if="mostrar" class="dialog-overlay">
    <div class="dialog-box">
      <div class="dialog-header"><h3>{{ modoEdicion ? 'Editar Dirección de Envío' : 'Nueva Dirección de Envío' }}</h3><button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button></div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="form-grid single">
          <div class="form-group"><label class="form-label">Cliente <span style="color:red">*</span></label><select v-model="form.idCliente" class="form-select"><option value="">Seleccionar cliente...</option><option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }} {{ c.apellido || '' }} · {{ c.telefono || 'Sin teléfono' }}</option></select></div>
          <div class="form-group"><label class="form-label">Dirección completa <span style="color:red">*</span></label><input v-model="form.direccion" class="form-input" placeholder="Ej: Av. Arce #1234, entre calles..." maxlength="500" /></div>
          <div class="form-group"><label class="form-label">Ciudad <span style="color:red">*</span></label><input v-model="form.ciudad" class="form-input" placeholder="Sucre" maxlength="50" /></div>
          <div class="form-group"><label class="form-label">Indicaciones / Referencia</label><textarea v-model="form.indicacionesReferencia" class="form-textarea" placeholder="Ej: Edificio azul, 3er piso..." maxlength="500" rows="3"></textarea></div>
        </div>
      </div>
      <div class="dialog-footer"><button class="btn-secondary-gambu" @click="emit('close')"><i class="pi pi-times"></i> Cancelar</button><button class="btn-primary-gambu" :disabled="loading" @click="handleSave"><i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i> {{ loading ? 'Guardando...' : 'Guardar' }}</button></div>
    </div>
  </div>
</template>
