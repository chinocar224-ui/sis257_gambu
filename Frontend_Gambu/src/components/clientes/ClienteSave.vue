<script setup lang="ts">
import type { Cliente } from '@/models/cliente'
import http from '@/plugins/axios'
import { ref, watch } from 'vue'

const ENDPOINT = 'clientes'
const props = defineProps({
  mostrar: Boolean,
  cliente: { type: Object as () => Cliente, default: () => ({}) as Cliente },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const form = ref<Partial<Cliente>>({})
const error = ref('')
const loading = ref(false)
const grupos = ['Regular', 'Frecuente', 'VIP', 'Corporativo']

watch(() => props.cliente, (v) => {
  form.value = { ...v, grupoCliente: v?.grupoCliente || 'Regular', ciudad: v?.ciudad || 'Sucre' }
}, { immediate: true })

function validarEmail(email?: string | null) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleSave() {
  error.value = ''
  if (!form.value.nombre?.trim()) { error.value = 'El nombre o referencia del cliente es obligatorio.'; return }
  if (!validarEmail(form.value.email)) { error.value = 'El email no es válido. Puedes dejarlo vacío si el cliente no quiere dar correo.'; return }
  if (form.value.telefono && form.value.telefono.trim().length > 20) { error.value = 'El teléfono no puede superar 20 caracteres.'; return }

  loading.value = true
  try {
    const body: any = {
      nombre: form.value.nombre?.trim(),
      apellido: form.value.apellido?.trim() || undefined,
      email: form.value.email?.trim() || undefined,
      telefono: form.value.telefono?.trim() || undefined,
      grupoCliente: form.value.grupoCliente || 'Regular',
      direccionPrincipal: form.value.direccionPrincipal?.trim() || undefined,
      ciudad: form.value.ciudad?.trim() || 'Sucre',
      referenciaDireccion: form.value.referenciaDireccion?.trim() || undefined,
    }
    if (props.modoEdicion) await http.patch(`${ENDPOINT}/${form.value.id}`, body)
    else await http.post(ENDPOINT, body)
    emit('guardar')
    emit('close')
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al guardar cliente.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="mostrar" class="dialog-overlay">
    <div class="dialog-box">
      <div class="dialog-header">
        <h3>{{ modoEdicion ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="warning-box" style="margin-bottom:1rem">
          <i class="pi pi-info-circle"></i>
          <span>Los clientes son independientes de usuarios. Solo el nombre/referencia es obligatorio; teléfono, correo y dirección son opcionales.</span>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nombre o referencia <span style="color:red">*</span></label>
            <input v-model="form.nombre" class="form-input" placeholder="Ej: Ana, Cliente mostrador, Empresa ABC" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">Apellido / Razón social</label>
            <input v-model="form.apellido" class="form-input" placeholder="Opcional" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input v-model="form.telefono" class="form-input" placeholder="Opcional" maxlength="20" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="Opcional" maxlength="120" />
          </div>
          <div class="form-group">
            <label class="form-label">Grupo del cliente</label>
            <select v-model="form.grupoCliente" class="form-select">
              <option v-for="g in grupos" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input v-model="form.ciudad" class="form-input" placeholder="Sucre" maxlength="50" />
          </div>
          <div class="form-group span-2">
            <label class="form-label">Dirección principal para delivery</label>
            <input v-model="form.direccionPrincipal" class="form-input" placeholder="Opcional. Si se llena, se crea automáticamente como dirección de envío" maxlength="500" />
          </div>
          <div class="form-group span-2">
            <label class="form-label">Referencia de dirección</label>
            <textarea v-model="form.referenciaDireccion" class="form-textarea" placeholder="Ej: Portón negro, llamar al llegar" maxlength="500"></textarea>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn-secondary-gambu" @click="emit('close')"><i class="pi pi-times"></i> Cancelar</button>
        <button class="btn-primary-gambu" :disabled="loading" @click="handleSave">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
          {{ loading ? 'Guardando...' : 'Guardar Cliente' }}
        </button>
      </div>
    </div>
  </div>
</template>
