<script setup lang="ts">
import type { Usuario } from '@/models/usuario'
import type { Rol } from '@/models/rol'
import http from '@/plugins/axios'
import { ref, watch, onMounted } from 'vue'

const ENDPOINT = 'usuarios'
const props = defineProps({
  mostrar: Boolean,
  usuario: { type: Object as () => Usuario, default: () => ({}) as Usuario },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const form = ref<Partial<Usuario & { clave: string }>>({})
const roles = ref<Rol[]>([])
const error = ref('')
const loading = ref(false)

watch(() => props.usuario, (v) => {
  form.value = { ...v, clave: '' }
}, { immediate: true })

onMounted(async () => {
  roles.value = await http.get('roles').then(r => r.data)
})

async function handleSave() {
  error.value = ''
  if (!form.value.idRol) { error.value = 'Selecciona un rol.'; return }
  if (!form.value.usuario?.trim()) { error.value = 'El nombre de usuario es obligatorio.'; return }
  if (!props.modoEdicion && !form.value.clave?.trim()) { error.value = 'La contraseña es obligatoria.'; return }
  if (!form.value.nombre?.trim()) { error.value = 'El nombre es obligatorio.'; return }
  if (!form.value.apellido?.trim()) { error.value = 'El apellido es obligatorio.'; return }
  if (!form.value.email?.trim()) { error.value = 'El email es obligatorio.'; return }
  loading.value = true
  try {
    const body: any = {
      idRol: Number(form.value.idRol),
      usuario: form.value.usuario,
      nombre: form.value.nombre,
      apellido: form.value.apellido,
      email: form.value.email,
      telefono: form.value.telefono,
    }
    if (form.value.clave) body.clave = form.value.clave
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
    <div class="dialog-box">
      <div class="dialog-header">
        <h3>{{ modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nombre <span style="color:red">*</span></label>
            <input v-model="form.nombre" class="form-input" placeholder="Nombre" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">Apellido <span style="color:red">*</span></label>
            <input v-model="form.apellido" class="form-input" placeholder="Apellido" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">Usuario <span style="color:red">*</span></label>
            <input v-model="form.usuario" class="form-input" placeholder="Nombre de usuario único" maxlength="15" />
          </div>
          <div class="form-group">
            <label class="form-label">
              {{ modoEdicion ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña' }}
              <span v-if="!modoEdicion" style="color:red">*</span>
            </label>
            <input v-model="form.clave" type="password" class="form-input" placeholder="Contraseña" />
          </div>
          <div class="form-group">
            <label class="form-label">Email <span style="color:red">*</span></label>
            <input v-model="form.email" type="email" class="form-input" placeholder="correo@ejemplo.com" maxlength="60" />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input v-model="form.telefono" class="form-input" placeholder="Ej: 77712345" maxlength="20" />
          </div>
          <div class="form-group span-2">
            <label class="form-label">Rol <span style="color:red">*</span></label>
            <select v-model="form.idRol" class="form-select">
              <option value="">Seleccionar rol...</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombreRol }}</option>
            </select>
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
