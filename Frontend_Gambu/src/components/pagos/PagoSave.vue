<script setup lang="ts">
import type { Pago } from '@/models/pago'
import http from '@/plugins/axios'
import { computed, ref, watch, onMounted } from 'vue'

const ENDPOINT = 'pagos'
const props = defineProps({
  mostrar: Boolean,
  pago: { type: Object as () => Pago, default: () => ({}) as Pago },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

type GrupoCliente = 'Regular' | 'Frecuente' | 'VIP' | 'Corporativo'

interface PedidoParaPago {
  id: number
  total: number
  estadoPedido: string
  tipoEntrega: string
  cliente?: { nombre: string; apellido?: string | null; grupoCliente?: GrupoCliente }
  mesa?: { numero: number }
}

const form = ref<Partial<Pago>>({})
const pedidosSinPago = ref<PedidoParaPago[]>([])
const error = ref('')
const loading = ref(false)

const metodos = ['Efectivo', 'QR', 'Tarjeta']
const estadosPago = ['Pendiente', 'Aprobado', 'Rechazado']

watch(() => props.pago, (v) => {
  form.value = {
    ...v,
    estadoPago: v?.estadoPago ?? 'Aprobado',
  }
}, { immediate: true })

const pedidoSeleccionado = computed(() =>
  pedidosSinPago.value.find(p => p.id === Number(form.value.idPedido))
)

const montoOriginal = computed(() => {
  if (props.modoEdicion && !pedidoSeleccionado.value) {
    return Number(props.pago?.montoOriginal || props.pago?.pedido?.total || props.pago?.monto || 0)
  }
  return Number(pedidoSeleccionado.value?.total || 0)
})

const grupoCliente = computed<GrupoCliente>(() => {
  if (pedidoSeleccionado.value?.cliente?.grupoCliente) return pedidoSeleccionado.value.cliente.grupoCliente
  return (props.pago?.pedido?.cliente?.grupoCliente as GrupoCliente) || 'Regular'
})

function porcentajeDescuentoPorConsumo(grupo: GrupoCliente, monto: number) {
  if (grupo === 'VIP') {
    if (monto >= 200) return 10
    if (monto >= 100) return 8
    return 5
  }
  if (grupo === 'Corporativo') {
    if (monto >= 400) return 15
    if (monto >= 200) return 12
    return 8
  }
  return 0
}

const porcentajeDescuento = computed(() => {
  if (props.modoEdicion && props.pago?.porcentajeDescuento !== undefined && !pedidoSeleccionado.value) {
    return Number(props.pago.porcentajeDescuento || 0)
  }
  return porcentajeDescuentoPorConsumo(grupoCliente.value, montoOriginal.value)
})

const descuentoAplicado = computed(() => {
  if (props.modoEdicion && props.pago?.descuentoAplicado !== undefined && !pedidoSeleccionado.value) {
    return Number(props.pago.descuentoAplicado || 0)
  }
  return Number(((montoOriginal.value * porcentajeDescuento.value) / 100).toFixed(2))
})

const montoFinal = computed(() => {
  if (props.modoEdicion && props.pago?.monto !== undefined && !pedidoSeleccionado.value) {
    return Number(props.pago.monto || 0)
  }
  return Number(Math.max(montoOriginal.value - descuentoAplicado.value, 0).toFixed(2))
})

const mensajeDescuento = computed(() => {
  if (porcentajeDescuento.value <= 0) return 'Este cliente no tiene descuento automático.'
  return `${grupoCliente.value} recibe ${porcentajeDescuento.value}% de descuento según su consumo.`
})

onMounted(async () => {
  await cargarPedidosParaPago()
})

async function cargarPedidosParaPago() {
  try {
    const todos = await http.get('pedidos').then(r => r.data)
    const pagosExistentes = await http.get(ENDPOINT).then(r => r.data)
    const idsPagados = new Set(pagosExistentes.map((p: Pago) => p.idPedido))
    pedidosSinPago.value = todos.filter((p: any) =>
      (!idsPagados.has(p.id) || (props.modoEdicion && p.id === props.pago?.idPedido)) && p.estadoPedido !== 'Cancelado'
    )
  } catch {
    pedidosSinPago.value = []
  }
}

async function handleSave() {
  error.value = ''
  if (!form.value.idPedido) { error.value = 'Selecciona el pedido.'; return }
  if (!form.value.metodoPago) { error.value = 'Selecciona el método de pago.'; return }
  loading.value = true
  try {
    const body: any = {
      idPedido: Number(form.value.idPedido),
      metodoPago: form.value.metodoPago,
      estadoPago: form.value.estadoPago || 'Aprobado',
      transaccionId: form.value.transaccionId || undefined,
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

function nombreCliente(p?: PedidoParaPago) {
  return p?.cliente ? `${p.cliente.nombre} ${p.cliente.apellido || ''}`.trim() : 'Cliente no cargado'
}

function formatPrecio(v: number) {
  return `Bs. ${Number(v || 0).toFixed(2)}`
}
</script>

<template>
  <div v-if="mostrar" class="dialog-overlay">
    <div class="dialog-box payment-dialog">
      <div class="dialog-header">
        <div>
          <h3>{{ modoEdicion ? 'Editar Pago' : 'Registrar Pago' }}</h3>
          <p class="header-note">El monto se calcula automáticamente desde el pedido. No se puede modificar manualmente.</p>
        </div>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>
      <div class="dialog-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>
        <div class="payment-layout">
          <section class="payment-form">
            <div class="form-grid">
              <div class="form-group span-2">
                <label class="form-label">Pedido pendiente <span style="color:red">*</span></label>
                <select v-model="form.idPedido" class="form-select" :disabled="modoEdicion">
                  <option value="">Seleccionar pedido...</option>
                  <option v-for="p in pedidosSinPago" :key="p.id" :value="p.id">
                    Pedido #{{ p.id }} · {{ nombreCliente(p) }} · {{ p.cliente?.grupoCliente || 'Regular' }} · Bs. {{ Number(p.total).toFixed(2) }} · {{ p.estadoPedido }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Método de Pago <span style="color:red">*</span></label>
                <select v-model="form.metodoPago" class="form-select">
                  <option value="">Seleccionar método...</option>
                  <option v-for="m in metodos" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Estado del Pago</label>
                <select v-model="form.estadoPago" class="form-select">
                  <option v-for="e in estadosPago" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>

              <div class="form-group span-2">
                <label class="form-label">ID de Transacción</label>
                <input v-model="form.transaccionId" class="form-input" placeholder="Ej: TXN-202600001..." maxlength="100" />
                <small>Referencia de QR o Tarjeta. Es opcional para efectivo.</small>
              </div>
            </div>

            <div class="discount-info">
              <div>
                <strong>Regla automática de descuento</strong>
                <p>{{ mensajeDescuento }}</p>
              </div>
              <ul>
                <li><span>VIP:</span> 5% desde cualquier consumo, 8% desde Bs. 100 y 10% desde Bs. 200.</li>
                <li><span>Corporativo:</span> 8% desde cualquier consumo, 12% desde Bs. 200 y 15% desde Bs. 400.</li>
              </ul>
            </div>
          </section>

          <aside class="payment-summary">
            <i class="pi pi-credit-card"></i>
            <span>Resumen del cobro</span>
            <div class="amount-line">
              <small>Subtotal pedido</small>
              <strong>{{ formatPrecio(montoOriginal) }}</strong>
            </div>
            <div class="amount-line discount">
              <small>Descuento {{ porcentajeDescuento }}%</small>
              <strong>- {{ formatPrecio(descuentoAplicado) }}</strong>
            </div>
            <div class="amount-total">
              <small>Monto fijo a cobrar</small>
              <strong>{{ formatPrecio(montoFinal) }}</strong>
            </div>
            <p v-if="pedidoSeleccionado || modoEdicion">
              Pedido #{{ form.idPedido }} · {{ pedidoSeleccionado?.tipoEntrega || props.pago?.pedido?.tipoEntrega || 'Pedido' }}
              <br />Grupo: {{ grupoCliente }}
              <br /><span v-if="pedidoSeleccionado?.mesa">Mesa {{ pedidoSeleccionado.mesa.numero }}</span>
            </p>
            <p v-else>Selecciona un pedido para calcular el monto final.</p>
            <div class="auto-note">
              <i class="pi pi-lock"></i>
              El monto se guarda fijo desde backend para evitar pagos menores o modificaciones manuales.
            </div>
          </aside>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn-secondary-gambu" @click="emit('close')"><i class="pi pi-times"></i> Cancelar</button>
        <button class="btn-primary-gambu" :disabled="loading" @click="handleSave">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
          {{ loading ? 'Guardando...' : 'Guardar Pago' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-dialog { width: min(960px, 95vw); }
.header-note { color: var(--gambu-muted); font-size: 0.82rem; margin-top: 0.25rem; }
.payment-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 1rem; }
.payment-form, .payment-summary { border: 1px solid var(--gambu-border); border-radius: 14px; background: var(--gambu-light); padding: 1rem; }
.payment-summary { background: var(--gambu-dark); color: #fff; display: flex; flex-direction: column; align-items: stretch; gap: 0.65rem; }
.payment-summary > i { font-size: 2rem; color: var(--gambu-gold); }
.payment-summary > span { color: #d7c8b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; }
.payment-summary p { color: #eadfce; font-size: 0.85rem; line-height: 1.5; }
.amount-line, .amount-total { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
.amount-line small, .amount-total small { color: #d7c8b8; }
.amount-line strong { color: #fff; font-size: 1rem; }
.amount-line.discount strong { color: #9ee6b3; }
.amount-total { border-bottom: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 0.75rem; }
.amount-total strong { color: var(--gambu-gold); font-size: 1.55rem; }
.auto-note { margin-top: auto; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 0.75rem; color: #eadfce; font-size: 0.78rem; line-height: 1.4; }
.form-group small { color: var(--gambu-muted); font-size: 0.75rem; }
.discount-info { margin-top: 1rem; border: 1px dashed var(--gambu-border); border-radius: 14px; padding: 0.85rem; background: #fff; }
.discount-info strong { color: var(--gambu-dark); }
.discount-info p { margin: 0.35rem 0 0.5rem; color: var(--gambu-muted); font-size: 0.86rem; }
.discount-info ul { margin: 0; padding-left: 1.1rem; color: var(--gambu-muted); font-size: 0.82rem; line-height: 1.5; }
.discount-info span { font-weight: 800; color: var(--gambu-dark); }
@media (max-width: 800px) { .payment-layout { grid-template-columns: 1fr; } }
</style>
