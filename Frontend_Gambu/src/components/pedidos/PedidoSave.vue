<script setup lang="ts">
import type { Pedido, DetallePedido } from '@/models/pedido'
import type { Producto } from '@/models/producto'
import type { Cliente } from '@/models/cliente'
import type { Mesa } from '@/models/mesa'
import type { DireccionEnvio } from '@/models/direccionEnvio'
import http from '@/plugins/axios'
import { ref, watch, onMounted, computed } from 'vue'

const ENDPOINT = 'pedidos'

const props = defineProps({
  mostrar: Boolean,
  pedido: { type: Object as () => Pedido, default: () => ({}) as Pedido },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

interface FormPedido {
  id?: number
  idCliente?: number
  idDireccion?: number | 'nueva'
  idMesa?: number
  tipoEntrega?: string
  costoEnvio?: number
  estadoPedido?: string
  observaciones?: string
  direccionDelivery?: string
  ciudadDelivery?: string
  referenciaDelivery?: string
}

type DetalleCarrito = DetallePedido & {
  _productoNombre?: string
  _imagenUrl?: string
  _categoria?: string
}

const form = ref<FormPedido>({})
const detalles = ref<DetalleCarrito[]>([])
const clientes = ref<Cliente[]>([])
const productos = ref<Producto[]>([])
const mesas = ref<Mesa[]>([])
const direcciones = ref<DireccionEnvio[]>([])
const error = ref('')
const loading = ref(false)
const busquedaCliente = ref('')
const busquedaProducto = ref('')
const categoriaActiva = ref('Todas')
const mostrarNuevoCliente = ref(false)
const guardandoCliente = ref(false)
const nuevoCliente = ref({ nombre: '', apellido: '', telefono: '', email: '', direccionPrincipal: '', ciudad: 'Sucre', referenciaDireccion: '', grupoCliente: 'Regular' })

const tiposEntrega = ['En Mesa', 'Take Away', 'Delivery']
const estadosPedido = ['Recibido', 'En Cocina', 'En Camino', 'Entregado', 'Cancelado']
const fallbackImages = [
  '/restaurant/featured.jpg',
  '/restaurant/pricing.jpg',
  '/restaurant/breakfast.jpg',
  '/restaurant/bagel.jpg',
  '/restaurant/kabob.jpg',
  '/restaurant/limes.jpg',
  '/restaurant/bread.jpg',
  '/restaurant/beer_spec.jpg',
]

watch(() => props.pedido, (v) => {
  form.value = {
    idCliente: v?.idCliente,
    idDireccion: v?.idDireccion,
    idMesa: v?.idMesa,
    tipoEntrega: v?.tipoEntrega || 'En Mesa',
    costoEnvio: Number(v?.costoEnvio ?? 0),
    estadoPedido: v?.estadoPedido || 'Recibido',
    observaciones: v?.observaciones,
    id: v?.id,
    ciudadDelivery: 'Sucre',
  }
  if (v?.cliente) busquedaCliente.value = nombreCliente(v.cliente)
  if (v?.detallesPedido?.length) {
    detalles.value = v.detallesPedido.map(d => ({
      ...d,
      _productoNombre: d.producto?.nombre,
      _imagenUrl: d.producto?.imagenUrl,
      _categoria: d.producto?.categoria?.nombre,
    }))
  } else {
    detalles.value = []
  }
}, { immediate: true })

watch(() => form.value.tipoEntrega, (tipo) => {
  if (tipo !== 'Delivery') {
    form.value.idDireccion = undefined
    form.value.direccionDelivery = ''
    form.value.referenciaDelivery = ''
    form.value.costoEnvio = 0
  } else if (!form.value.costoEnvio) {
    form.value.costoEnvio = 8
    seleccionarPrimeraDireccion()
  }
  if (tipo !== 'En Mesa') form.value.idMesa = undefined
})

watch(() => form.value.idCliente, () => {
  if (form.value.tipoEntrega === 'Delivery') seleccionarPrimeraDireccion()
})

onMounted(async () => {
  await cargarCombos()
})

async function cargarCombos() {
  const [c, p, m, d] = await Promise.all([
    http.get('clientes').then(r => r.data),
    http.get('productos').then(r => r.data),
    http.get('mesas').then(r => r.data),
    http.get('direcciones-envio').then(r => r.data),
  ])
  clientes.value = c
  productos.value = p
  mesas.value = m
  direcciones.value = d
}

const clienteSeleccionado = computed(() => clientes.value.find(c => c.id === Number(form.value.idCliente)))

const clientesFiltrados = computed(() => {
  const q = busquedaCliente.value.trim().toLowerCase()
  if (!q) return clientes.value.slice(0, 10)
  return clientes.value.filter(c =>
    `${c.nombre} ${c.apellido || ''} ${c.telefono || ''} ${c.email || ''} ${c.direccionPrincipal || ''}`.toLowerCase().includes(q)
  ).slice(0, 10)
})

const mesasDisponibles = computed(() =>
  mesas.value.filter(m => m.estado === 'Disponible' || m.id === form.value.idMesa)
)

const direccionesCliente = computed(() =>
  form.value.idCliente
    ? direcciones.value.filter(d => d.idCliente === Number(form.value.idCliente))
    : []
)

const categoriasProductos = computed(() => {
  const nombres = productos.value
    .filter(p => p.disponible && Number(p.stockActual) > 0)
    .map(p => p.categoria?.nombre || 'Sin categoría')
  return ['Todas', ...Array.from(new Set(nombres))]
})

const productosFiltrados = computed(() => {
  const q = busquedaProducto.value.trim().toLowerCase()
  return productos.value.filter(p => {
    const categoria = p.categoria?.nombre || 'Sin categoría'
    const matchCategoria = categoriaActiva.value === 'Todas' || categoria === categoriaActiva.value
    const matchTexto = !q || `${p.nombre} ${p.descripcion || ''} ${categoria}`.toLowerCase().includes(q)
    return p.disponible && Number(p.stockActual) > 0 && matchCategoria && matchTexto
  })
})

const subtotalCalculado = computed(() => detalles.value.reduce((acc, d) => acc + (Number(d.cantidad) * Number(d.precioUnitario)), 0))
const totalCalculado = computed(() => subtotalCalculado.value + Number(form.value.costoEnvio ?? 0))
const totalItems = computed(() => detalles.value.reduce((acc, d) => acc + Number(d.cantidad || 0), 0))
const usaNuevaDireccion = computed(() => form.value.tipoEntrega === 'Delivery' && form.value.idDireccion === 'nueva')

function nombreCliente(c: Cliente) {
  return `${c.nombre} ${c.apellido || ''}`.trim()
}

function seleccionarCliente(c: Cliente) {
  form.value.idCliente = c.id
  busquedaCliente.value = nombreCliente(c)
}

function limpiarCliente() {
  form.value.idCliente = undefined
  form.value.idDireccion = undefined
  busquedaCliente.value = ''
}

function seleccionarPrimeraDireccion() {
  const primera = direcciones.value.find(d => d.idCliente === Number(form.value.idCliente))
  form.value.idDireccion = primera ? primera.id : 'nueva'
  if (!primera && clienteSeleccionado.value?.direccionPrincipal) {
    form.value.direccionDelivery = clienteSeleccionado.value.direccionPrincipal || ''
    form.value.ciudadDelivery = clienteSeleccionado.value.ciudad || 'Sucre'
    form.value.referenciaDelivery = clienteSeleccionado.value.referenciaDireccion || ''
  }
}

function getProductImage(p: Producto) {
  if (p.imagenUrl) return p.imagenUrl
  return fallbackImages[p.id % fallbackImages.length]
}

function cantidadEnCarrito(idProducto: number) {
  return detalles.value.find(d => d.idProducto === idProducto)?.cantidad || 0
}

function agregarProducto(p: Producto) {
  error.value = ''
  const existente = detalles.value.find(d => d.idProducto === p.id)
  const stock = Number(p.stockActual || 0)
  if (stock <= cantidadEnCarrito(p.id)) {
    error.value = `No hay más stock disponible para ${p.nombre}.`
    return
  }
  if (existente) {
    existente.cantidad = Number(existente.cantidad) + 1
    return
  }
  detalles.value.push({
    idProducto: p.id,
    cantidad: 1,
    precioUnitario: Number(p.precio),
    notasCocina: '',
    _productoNombre: p.nombre,
    _imagenUrl: getProductImage(p),
    _categoria: p.categoria?.nombre,
  })
}

function incrementar(idx: number) {
  const det = detalles.value[idx]
  const prod = productos.value.find(p => p.id === det.idProducto)
  if (prod && Number(det.cantidad) >= Number(prod.stockActual)) {
    error.value = `Stock máximo para ${prod.nombre}: ${prod.stockActual}`
    return
  }
  det.cantidad = Number(det.cantidad) + 1
}

function decrementar(idx: number) {
  const det = detalles.value[idx]
  if (Number(det.cantidad) <= 1) return quitarDetalle(idx)
  det.cantidad = Number(det.cantidad) - 1
}

function quitarDetalle(idx: number) {
  detalles.value.splice(idx, 1)
}

function resetNuevoCliente() {
  nuevoCliente.value = { nombre: '', apellido: '', telefono: '', email: '', direccionPrincipal: '', ciudad: 'Sucre', referenciaDireccion: '', grupoCliente: 'Regular' }
}

function validarEmail(email?: string) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function crearClienteRapido() {
  error.value = ''
  if (!nuevoCliente.value.nombre.trim()) {
    error.value = 'Ingresa al menos un nombre o referencia del cliente.'
    return
  }
  if (!validarEmail(nuevoCliente.value.email.trim())) {
    error.value = 'El correo del cliente rápido no es válido. Puedes dejarlo vacío.'
    return
  }
  guardandoCliente.value = true
  try {
    const body = {
      nombre: nuevoCliente.value.nombre.trim(),
      apellido: nuevoCliente.value.apellido.trim() || undefined,
      email: nuevoCliente.value.email.trim() || undefined,
      telefono: nuevoCliente.value.telefono.trim() || undefined,
      direccionPrincipal: nuevoCliente.value.direccionPrincipal.trim() || undefined,
      ciudad: nuevoCliente.value.ciudad.trim() || 'Sucre',
      referenciaDireccion: nuevoCliente.value.referenciaDireccion.trim() || undefined,
      grupoCliente: nuevoCliente.value.grupoCliente,
    }
    const creado = await http.post('clientes', body).then(r => r.data)
    clientes.value.push(creado)
    if (creado.direccionesEnvio?.length) direcciones.value.push(...creado.direccionesEnvio)
    seleccionarCliente(creado)
    mostrarNuevoCliente.value = false
    resetNuevoCliente()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo crear el cliente.')
  } finally {
    guardandoCliente.value = false
  }
}

async function handleSave() {
  error.value = ''
  if (!form.value.idCliente) { error.value = 'Selecciona o registra un cliente.'; return }
  if (!form.value.tipoEntrega) { error.value = 'El tipo de entrega es obligatorio.'; return }
  if (form.value.tipoEntrega === 'En Mesa' && !form.value.idMesa) { error.value = 'Selecciona una mesa disponible para pedido en mesa.'; return }
  if (form.value.tipoEntrega === 'Delivery') {
    if (!form.value.idDireccion) { error.value = 'Selecciona o escribe una dirección de envío.'; return }
    if (form.value.idDireccion === 'nueva' && !form.value.direccionDelivery?.trim()) { error.value = 'Escribe la dirección nueva para delivery.'; return }
  }
  if (!props.modoEdicion && detalles.value.length === 0) { error.value = 'Agrega al menos un producto al pedido.'; return }
  for (const [i, d] of detalles.value.entries()) {
    if (!d.idProducto || Number(d.idProducto) < 1) { error.value = `Selecciona un producto en el ítem ${i + 1}.`; return }
    if (!d.cantidad || Number(d.cantidad) < 1) { error.value = `La cantidad del ítem ${i + 1} debe ser al menos 1.`; return }
  }
  loading.value = true
  try {
    if (props.modoEdicion) {
      await http.patch(`${ENDPOINT}/${form.value.id}`, { estadoPedido: form.value.estadoPedido, observaciones: form.value.observaciones })
    } else {
      const body: any = {
        idCliente: Number(form.value.idCliente),
        tipoEntrega: form.value.tipoEntrega,
        costoEnvio: Number(form.value.costoEnvio ?? 0),
        observaciones: form.value.observaciones,
        detalles: detalles.value.map(d => ({
          idProducto: Number(d.idProducto),
          cantidad: Number(d.cantidad),
          notasCocina: d.notasCocina || undefined,
        }))
      }
      if (form.value.idMesa) body.idMesa = Number(form.value.idMesa)
      if (form.value.tipoEntrega === 'Delivery') {
        if (form.value.idDireccion !== 'nueva') body.idDireccion = Number(form.value.idDireccion)
        else {
          body.direccionDelivery = form.value.direccionDelivery
          body.ciudadDelivery = form.value.ciudadDelivery || 'Sucre'
          body.referenciaDelivery = form.value.referenciaDelivery || undefined
        }
      }
      await http.post(ENDPOINT, body)
      await cargarCombos()
    }
    emit('guardar')
    emit('close')
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al guardar el pedido.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="mostrar" class="dialog-overlay">
    <div class="dialog-box pos-dialog">
      <div class="dialog-header pos-header">
        <div>
          <h3>{{ modoEdicion ? `Editar Pedido #${form.id}` : 'Nuevo Pedido' }}</h3>
          <p>{{ modoEdicion ? 'Actualiza el estado del pedido y libera mesa cuando corresponda.' : 'Selecciona cliente, entrega y productos desde una vista tipo punto de venta.' }}</p>
        </div>
        <button class="btn-close-dialog" @click="emit('close')"><i class="pi pi-times"></i></button>
      </div>

      <div class="dialog-body pos-body">
        <div v-if="error" class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ error }}</div>

        <template v-if="modoEdicion">
          <div class="edit-status-grid">
            <div class="status-card">
              <span>Cliente</span>
              <strong>{{ clienteSeleccionado ? nombreCliente(clienteSeleccionado) : `ID ${form.idCliente}` }}</strong>
            </div>
            <div class="status-card">
              <span>Total</span>
              <strong>Bs. {{ Number(props.pedido?.total || 0).toFixed(2) }}</strong>
            </div>
            <div class="form-group">
              <label class="form-label">Estado del Pedido</label>
              <select v-model="form.estadoPedido" class="form-select">
                <option v-for="e in estadosPedido" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>
          </div>
          <textarea v-model="form.observaciones" class="form-textarea" placeholder="Observaciones del pedido" maxlength="500"></textarea>
        </template>

        <template v-else>
          <div class="order-topbar">
            <section class="panel-soft client-zone">
              <div class="section-title-inline">
                <span><i class="pi pi-user"></i> Cliente</span>
                <button type="button" class="btn-mini" @click="mostrarNuevoCliente = true"><i class="pi pi-user-plus"></i> Nuevo</button>
              </div>

              <div v-if="clienteSeleccionado" class="selected-client">
                <div>
                  <strong>{{ nombreCliente(clienteSeleccionado) }}</strong>
                  <span>{{ clienteSeleccionado.telefono || 'Sin teléfono' }} · {{ clienteSeleccionado.email || 'Sin correo' }} · {{ clienteSeleccionado.grupoCliente }}</span>
                </div>
                <button type="button" class="btn-mini ghost" @click="limpiarCliente">Cambiar</button>
              </div>

              <div v-else class="client-search-wrap">
                <div class="search-bar wide-search">
                  <i class="pi pi-search"></i>
                  <input v-model="busquedaCliente" placeholder="Buscar cliente por nombre, teléfono, correo o dirección..." />
                </div>
                <div class="client-results">
                  <button v-for="c in clientesFiltrados" :key="c.id" type="button" @click="seleccionarCliente(c)">
                    <strong>{{ nombreCliente(c) }}</strong>
                    <span>{{ c.telefono || 'Sin teléfono' }} · {{ c.email || 'Sin correo' }} · {{ c.grupoCliente }}</span>
                  </button>
                  <p v-if="clientesFiltrados.length === 0">No se encontraron clientes.</p>
                </div>
              </div>
            </section>

            <section class="panel-soft delivery-zone">
              <div class="form-grid compact-grid">
                <div class="form-group">
                  <label class="form-label">Tipo de entrega</label>
                  <select v-model="form.tipoEntrega" class="form-select">
                    <option v-for="t in tiposEntrega" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>

                <div class="form-group" v-if="form.tipoEntrega === 'En Mesa'">
                  <label class="form-label">Mesa disponible</label>
                  <select v-model="form.idMesa" class="form-select">
                    <option value="">Seleccionar mesa...</option>
                    <option v-for="m in mesasDisponibles" :key="m.id" :value="m.id">Mesa {{ m.numero }} · {{ m.capacidad }} pers. · {{ m.estado }}</option>
                  </select>
                </div>

                <div class="form-group" v-if="form.tipoEntrega === 'Delivery'">
                  <label class="form-label">Dirección del cliente</label>
                  <select v-model="form.idDireccion" class="form-select">
                    <option value="">Seleccionar dirección...</option>
                    <option v-for="d in direccionesCliente" :key="d.id" :value="d.id">{{ d.direccion }}, {{ d.ciudad }}</option>
                    <option value="nueva">+ Nueva dirección para este pedido</option>
                  </select>
                  <small v-if="form.idCliente && direccionesCliente.length === 0">Este cliente no tiene direcciones guardadas. Escribe una nueva.</small>
                </div>

                <div class="form-group" v-if="form.tipoEntrega === 'Delivery'">
                  <label class="form-label">Costo envío</label>
                  <input v-model="form.costoEnvio" type="number" min="0" step="0.50" class="form-input" />
                </div>
              </div>

              <div v-if="usaNuevaDireccion" class="new-address-grid">
                <div class="form-group span-2">
                  <label class="form-label">Nueva dirección delivery</label>
                  <input v-model="form.direccionDelivery" class="form-input" placeholder="Ej: Av. Principal #123" maxlength="500" />
                </div>
                <div class="form-group">
                  <label class="form-label">Ciudad</label>
                  <input v-model="form.ciudadDelivery" class="form-input" placeholder="Sucre" maxlength="50" />
                </div>
                <div class="form-group">
                  <label class="form-label">Referencia</label>
                  <input v-model="form.referenciaDelivery" class="form-input" placeholder="Opcional" maxlength="500" />
                </div>
              </div>
            </section>
          </div>

          <div class="pos-layout">
            <section class="products-panel">
              <div class="products-toolbar">
                <div><h4>Productos</h4><p>{{ productosFiltrados.length }} disponibles para vender</p></div>
                <div class="search-bar product-search"><i class="pi pi-search"></i><input v-model="busquedaProducto" placeholder="Buscar producto..." /></div>
              </div>

              <div class="category-chips">
                <button v-for="cat in categoriasProductos" :key="cat" type="button" :class="{ active: categoriaActiva === cat }" @click="categoriaActiva = cat">{{ cat }}</button>
              </div>

              <div class="product-grid">
                <article v-for="p in productosFiltrados" :key="p.id" class="product-card" @click="agregarProducto(p)">
                  <img :src="getProductImage(p)" :alt="p.nombre" />
                  <div class="product-info">
                    <span class="product-category">{{ p.categoria?.nombre || 'Sin categoría' }}</span>
                    <h5>{{ p.nombre }}</h5>
                    <p>{{ p.descripcion || 'Producto del menú Gambu' }}</p>
                    <div class="product-bottom">
                      <strong>Bs. {{ Number(p.precio).toFixed(2) }}</strong>
                      <span :class="['stock-pill', Number(p.stockActual) <= Number(p.stockMinimo) ? 'low' : '']">Stock {{ p.stockActual }}</span>
                    </div>
                    <button type="button" class="btn-add-product" @click.stop="agregarProducto(p)">
                      <i class="pi pi-plus"></i> Agregar <small v-if="cantidadEnCarrito(p.id)">({{ cantidadEnCarrito(p.id) }})</small>
                    </button>
                  </div>
                </article>
              </div>
            </section>

            <aside class="cart-panel">
              <div class="cart-title"><div><h4>Pedido actual</h4><p>{{ totalItems }} producto(s) seleccionados</p></div><span class="cart-badge">Bs. {{ totalCalculado.toFixed(2) }}</span></div>
              <div v-if="detalles.length === 0" class="empty-cart"><i class="pi pi-shopping-cart"></i><p>Agrega productos desde las imágenes del menú.</p></div>
              <div v-else class="cart-items">
                <div v-for="(det, idx) in detalles" :key="det.idProducto" class="cart-item">
                  <img :src="det._imagenUrl || fallbackImages[idx % fallbackImages.length]" alt="Producto" />
                  <div class="cart-item-info"><strong>{{ det._productoNombre }}</strong><span>Bs. {{ Number(det.precioUnitario).toFixed(2) }} c/u</span><input v-model="det.notasCocina" class="cart-note" placeholder="Nota cocina opcional" /></div>
                  <div class="qty-control"><button type="button" @click="decrementar(idx)">−</button><span>{{ det.cantidad }}</span><button type="button" @click="incrementar(idx)">+</button></div>
                  <strong class="cart-subtotal">Bs. {{ (Number(det.cantidad) * Number(det.precioUnitario)).toFixed(2) }}</strong>
                  <button type="button" class="action-btn delete" @click="quitarDetalle(idx)"><i class="pi pi-trash"></i></button>
                </div>
              </div>
              <textarea v-model="form.observaciones" class="form-textarea" placeholder="Observaciones generales del pedido..." maxlength="500"></textarea>
              <div class="totals-card">
                <div><span>Subtotal</span><strong>Bs. {{ subtotalCalculado.toFixed(2) }}</strong></div>
                <div v-if="form.tipoEntrega === 'Delivery'"><span>Envío</span><strong>Bs. {{ Number(form.costoEnvio || 0).toFixed(2) }}</strong></div>
                <div class="grand-total"><span>Total</span><strong>Bs. {{ totalCalculado.toFixed(2) }}</strong></div>
              </div>
            </aside>
          </div>
        </template>
      </div>

      <div class="dialog-footer">
        <button class="btn-secondary-gambu" @click="emit('close')"><i class="pi pi-times"></i> Cancelar</button>
        <button class="btn-primary-gambu" :disabled="loading" @click="handleSave"><i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i> {{ loading ? 'Guardando...' : (modoEdicion ? 'Actualizar Pedido' : 'Crear Pedido') }}</button>
      </div>
    </div>

    <div v-if="mostrarNuevoCliente" class="dialog-overlay nested-overlay">
      <div class="dialog-box narrow">
        <div class="dialog-header"><h3>Cliente rápido</h3><button class="btn-close-dialog" @click="mostrarNuevoCliente = false"><i class="pi pi-times"></i></button></div>
        <div class="dialog-body">
          <div class="form-grid single">
            <div class="form-group"><label class="form-label">Nombre o referencia</label><input v-model="nuevoCliente.nombre" class="form-input" placeholder="Ej. Cliente mostrador" /></div>
            <div class="form-group"><label class="form-label">Apellido / Razón social</label><input v-model="nuevoCliente.apellido" class="form-input" placeholder="Opcional" /></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input v-model="nuevoCliente.telefono" class="form-input" placeholder="Opcional" /></div>
            <div class="form-group"><label class="form-label">Correo</label><input v-model="nuevoCliente.email" type="email" class="form-input" placeholder="Opcional" /></div>
            <div class="form-group"><label class="form-label">Grupo</label><select v-model="nuevoCliente.grupoCliente" class="form-select"><option>Regular</option><option>Frecuente</option><option>VIP</option><option>Corporativo</option></select></div>
            <div class="form-group"><label class="form-label">Ciudad</label><input v-model="nuevoCliente.ciudad" class="form-input" /></div>
            <div class="form-group"><label class="form-label">Dirección delivery</label><input v-model="nuevoCliente.direccionPrincipal" class="form-input" placeholder="Opcional" /></div>
            <div class="form-group"><label class="form-label">Referencia</label><input v-model="nuevoCliente.referenciaDireccion" class="form-input" placeholder="Opcional" /></div>
          </div>
          <small class="helper-text">El cliente rápido no crea usuario ni contraseña.</small>
        </div>
        <div class="dialog-footer"><button class="btn-secondary-gambu" @click="mostrarNuevoCliente = false">Cancelar</button><button class="btn-primary-gambu" :disabled="guardandoCliente" @click="crearClienteRapido"><i :class="guardandoCliente ? 'pi pi-spin pi-spinner' : 'pi pi-user-plus'"></i> Guardar cliente</button></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pos-dialog { width: min(1280px, 97vw); max-height: 95vh; }
.pos-header p { color: var(--gambu-muted); font-size: 0.85rem; margin-top: 0.25rem; }
.pos-body { padding: 1rem 1.25rem 1.25rem; }
.order-topbar { display: grid; grid-template-columns: minmax(320px, 1.1fr) minmax(360px, 1fr); gap: 1rem; margin-bottom: 1rem; }
.panel-soft { background: var(--gambu-light); border: 1px solid var(--gambu-border); border-radius: 14px; padding: 1rem; }
.section-title-inline { display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: var(--gambu-dark); margin-bottom: 0.75rem; }
.section-title-inline span { display: inline-flex; gap: 0.45rem; align-items: center; }
.btn-mini { border: none; background: var(--gambu-amber); color: #fff; border-radius: 999px; padding: 0.4rem 0.7rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; }
.btn-mini.ghost { background: #fff; color: var(--gambu-amber); border: 1px solid var(--gambu-border); }
.selected-client { display: flex; justify-content: space-between; align-items: center; gap: 1rem; background: #fff; border: 1px solid var(--gambu-border); border-radius: 12px; padding: 0.85rem; }
.selected-client strong, .selected-client span { display: block; }
.selected-client span { color: var(--gambu-muted); font-size: 0.82rem; margin-top: 0.2rem; }
.client-search-wrap { position: relative; }
.wide-search { width: 100%; min-width: 100%; background: #fff; }
.client-results { margin-top: 0.65rem; display: grid; gap: 0.5rem; max-height: 178px; overflow-y: auto; }
.client-results button { text-align: left; background: #fff; border: 1px solid var(--gambu-border); border-radius: 10px; padding: 0.65rem 0.8rem; cursor: pointer; }
.client-results button:hover { border-color: var(--gambu-amber); box-shadow: 0 4px 12px rgba(200,118,26,0.12); }
.client-results strong, .client-results span { display: block; }
.client-results span { color: var(--gambu-muted); font-size: 0.78rem; margin-top: 0.15rem; }
.client-results p, .helper-text, small { color: var(--gambu-muted); font-size: 0.78rem; }
.compact-grid, .new-address-grid { display: grid; grid-template-columns: repeat(2, minmax(170px, 1fr)); gap: 0.75rem; }
.new-address-grid { margin-top: 0.8rem; }
.pos-layout { display: grid; grid-template-columns: minmax(0, 1fr) 430px; gap: 1rem; align-items: start; }
.products-panel, .cart-panel { background: #fff; border: 1px solid var(--gambu-border); border-radius: 16px; padding: 1rem; }
.products-toolbar, .cart-title { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.85rem; }
.products-toolbar h4, .cart-title h4 { font-family: 'Playfair Display', serif; color: var(--gambu-dark); font-size: 1.15rem; margin: 0; }
.products-toolbar p, .cart-title p { color: var(--gambu-muted); font-size: 0.8rem; margin-top: 0.15rem; }
.product-search { min-width: 280px; background: var(--gambu-light); }
.category-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.category-chips button { border: 1px solid var(--gambu-border); background: var(--gambu-light); color: var(--gambu-muted); border-radius: 999px; padding: 0.45rem 0.75rem; font-weight: 700; cursor: pointer; }
.category-chips button.active, .category-chips button:hover { background: var(--gambu-dark); border-color: var(--gambu-dark); color: var(--gambu-gold); }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.85rem; max-height: 58vh; overflow-y: auto; padding-right: 0.2rem; }
.product-card { border: 1px solid var(--gambu-border); border-radius: 16px; overflow: hidden; background: #fff; display: flex; flex-direction: column; box-shadow: 0 6px 18px rgba(42,22,0,0.05); cursor: pointer; }
.product-card img { width: 100%; height: 112px; object-fit: cover; background: var(--gambu-light); }
.product-info { padding: 0.8rem; display: flex; flex-direction: column; gap: 0.45rem; flex: 1; }
.product-category { color: var(--gambu-amber); text-transform: uppercase; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; }
.product-info h5 { font-size: 0.95rem; color: var(--gambu-dark); line-height: 1.2; min-height: 2.3em; }
.product-info p { color: var(--gambu-muted); font-size: 0.76rem; line-height: 1.35; min-height: 2.1em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.product-bottom strong { color: var(--gambu-dark); }
.stock-pill { background: #ecfdf5; color: #047857; border-radius: 999px; padding: 0.2rem 0.45rem; font-size: 0.68rem; font-weight: 800; }
.stock-pill.low { background: #fef3c7; color: #92400e; }
.btn-add-product { margin-top: auto; border: none; background: var(--gambu-amber); color: #fff; border-radius: 10px; padding: 0.55rem; font-weight: 800; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; gap: 0.35rem; }
.btn-add-product:hover { background: var(--gambu-gold); }
.cart-panel { position: sticky; top: 1rem; }
.cart-badge { background: var(--gambu-dark); color: var(--gambu-gold); border-radius: 999px; padding: 0.5rem 0.75rem; font-weight: 800; white-space: nowrap; }
.empty-cart { border: 1.5px dashed var(--gambu-border); border-radius: 14px; padding: 2rem 1rem; text-align: center; color: var(--gambu-muted); background: var(--gambu-light); margin-bottom: 1rem; }
.empty-cart i { display: block; font-size: 2rem; margin-bottom: 0.5rem; color: var(--gambu-amber); }
.cart-items { display: grid; gap: 0.75rem; max-height: 38vh; overflow-y: auto; padding-right: 0.2rem; margin-bottom: 1rem; }
.cart-item { display: grid; grid-template-columns: 54px 1fr auto auto auto; gap: 0.65rem; align-items: center; border: 1px solid var(--gambu-border); border-radius: 14px; padding: 0.55rem; background: var(--gambu-light); }
.cart-item img { width: 54px; height: 54px; border-radius: 10px; object-fit: cover; }
.cart-item-info strong, .cart-item-info span { display: block; }
.cart-item-info strong { color: var(--gambu-dark); font-size: 0.85rem; }
.cart-item-info span { color: var(--gambu-muted); font-size: 0.74rem; }
.cart-note { margin-top: 0.35rem; width: 100%; border: 1px solid var(--gambu-border); border-radius: 8px; padding: 0.35rem 0.45rem; font-size: 0.75rem; outline: none; }
.qty-control { display: inline-flex; align-items: center; border: 1px solid var(--gambu-border); border-radius: 999px; overflow: hidden; background: #fff; }
.qty-control button { border: none; background: #fff; width: 26px; height: 26px; cursor: pointer; color: var(--gambu-amber); font-weight: 900; }
.qty-control span { min-width: 26px; text-align: center; font-weight: 800; font-size: 0.8rem; }
.cart-subtotal { color: var(--gambu-dark); white-space: nowrap; font-size: 0.8rem; }
.totals-card { margin-top: 0.85rem; background: var(--gambu-dark); color: #fff; border-radius: 14px; padding: 0.9rem 1rem; display: grid; gap: 0.5rem; }
.totals-card div { display: flex; justify-content: space-between; align-items: center; }
.totals-card span { color: #d7c8b8; }
.totals-card strong { color: var(--gambu-gold); }
.grand-total { border-top: 1px solid rgba(255,255,255,0.18); padding-top: 0.55rem; font-size: 1.1rem; }
.edit-status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
.status-card { border: 1px solid var(--gambu-border); border-radius: 14px; padding: 1rem; background: var(--gambu-light); }
.status-card span, .status-card strong { display: block; }
.status-card span { color: var(--gambu-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; }
.status-card strong { color: var(--gambu-dark); margin-top: 0.35rem; }
.nested-overlay { z-index: 260; }
.narrow { width: min(640px, 94vw); }
@media (max-width: 1100px) { .order-topbar, .pos-layout { grid-template-columns: 1fr; } .cart-panel { position: static; } }
@media (max-width: 700px) { .products-toolbar, .cart-title { align-items: flex-start; flex-direction: column; } .product-search { min-width: 100%; width: 100%; } .compact-grid, .new-address-grid, .edit-status-grid { grid-template-columns: 1fr; } .cart-item { grid-template-columns: 44px 1fr auto; } .cart-subtotal { grid-column: 2 / span 1; } }
</style>
