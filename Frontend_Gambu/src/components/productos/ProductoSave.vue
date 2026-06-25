<script setup lang="ts">
import type { Producto } from '@/models/producto'
import type { Categoria } from '@/models/categoria'
import http from '@/plugins/axios'
import { ref, watch, onMounted } from 'vue'

const ENDPOINT = 'productos'
const props = defineProps({
  mostrar: Boolean,
  producto: { type: Object as () => Producto, default: () => ({}) as Producto },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const form = ref<Partial<Producto>>({})
const categorias = ref<Categoria[]>([])
const error = ref('')
const loading = ref(false)

watch(() => props.producto, (v) => {
  form.value = { ...v, disponible: v?.disponible ?? true, stockActual: v?.stockActual ?? 0, stockMinimo: v?.stockMinimo ?? 5 }
}, { immediate: true })

onMounted(async () => {
  categorias.value = await http.get('categorias').then(r => r.data)
})

async function handleSave() {
  error.value = ''
  if (!form.value.idCategoria) { error.value = 'Selecciona una categoría.'; return }
  if (!form.value.nombre?.trim()) { error.value = 'El nombre es obligatorio.'; return }
  if (form.value.nombre.trim().length < 3) { error.value = 'El nombre debe tener al menos 3 caracteres.'; return }
  if (!form.value.precio || Number(form.value.precio) <= 0) { error.value = 'El precio debe ser mayor a 0.'; return }
  if (Number(form.value.precio) > 10000) { error.value = 'El precio no puede superar Bs. 10.000.'; return }
  if (Number(form.value.stockActual ?? 0) < 0) { error.value = 'El stock actual no puede ser negativo.'; return }
  if (Number(form.value.stockMinimo ?? 0) < 0) { error.value = 'El stock mínimo no puede ser negativo.'; return }
  if (form.value.imagenUrl && !/^(https?:\/\/|\/)/.test(form.value.imagenUrl)) {
    error.value = 'La imagen debe ser una URL http(s) o una ruta interna que empiece con /. Ej: /restaurant/featured.jpg'; return
  }
  loading.value = true
  try {
    const body = {
      idCategoria: Number(form.value.idCategoria),
      nombre: form.value.nombre?.trim(),
      descripcion: form.value.descripcion?.trim(),
      precio: Number(form.value.precio),
      imagenUrl: form.value.imagenUrl?.trim(),
      stockActual: Number(form.value.stockActual ?? 0),
      stockMinimo: Number(form.value.stockMinimo ?? 5),
      disponible: form.value.disponible ?? true,
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
    <div class="dialog-box">
      <div class="dialog-header">
        <h3>{{ modoEdicion ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Categoría <span style="color:red">*</span></label>
            <select v-model="form.idCategoria" class="form-select">
              <option value="">Seleccionar categoría...</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre <span style="color:red">*</span></label>
            <input v-model="form.nombre" class="form-input" placeholder="Ej: Lomo Saltado" maxlength="100" />
          </div>
          <div class="form-group span-2">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.descripcion" class="form-textarea" placeholder="Descripción del producto..." maxlength="1000" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Precio (Bs.) <span style="color:red">*</span></label>
            <input v-model="form.precio" type="number" min="0.01" step="0.01" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">URL Imagen</label>
            <input v-model="form.imagenUrl" class="form-input" placeholder="https://ejemplo.com/imagen.jpg" maxlength="255" />
          </div>
          <div class="form-group">
            <label class="form-label">Stock Actual</label>
            <input v-model="form.stockActual" type="number" min="0" class="form-input" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Stock Mínimo</label>
            <input v-model="form.stockMinimo" type="number" min="0" class="form-input" placeholder="5" />
          </div>
          <div v-if="Number(form.stockActual || 0) <= Number(form.stockMinimo || 0)" class="warning-box span-2">
            <i class="pi pi-exclamation-triangle"></i>
            Este producto quedará marcado visualmente como stock bajo en el listado.
          </div>
          <div class="form-group span-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.disponible" />
              <span class="form-label" style="margin:0">Producto disponible en el menú</span>
            </label>
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
