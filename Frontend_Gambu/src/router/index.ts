import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores'
import { getTokenFromLocalStorage } from '@/helpers'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/delivery',
      name: 'delivery',
      component: () => import('../views/DeliveryView.vue'),
      meta: { roles: ['Delivery'] }
    },
    {
      path: '/categorias',
      name: 'categorias',
      component: () => import('../views/CategoriasView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/productos',
      name: 'productos',
      component: () => import('../views/ProductosView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: () => import('../views/ClientesView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('../views/UsuariosView.vue'),
      meta: { roles: ['Administrador'] }
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('../views/RolesView.vue'),
      meta: { roles: ['Administrador'] }
    },
    {
      path: '/mesas',
      name: 'mesas',
      component: () => import('../views/MesasView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/pedidos',
      name: 'pedidos',
      component: () => import('../views/PedidosView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/pagos',
      name: 'pagos',
      component: () => import('../views/PagosView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/direcciones',
      name: 'direcciones',
      component: () => import('../views/DireccionesView.vue'),
      meta: { roles: ['Administrador', 'Cajero'] }
    },
    {
      path: '/reportes',
      name: 'reportes',
      component: () => import('../views/ReportesView.vue'),
      meta: { roles: ['Administrador'] }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to) => {
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  const authStore = useAuthStore()

  if (authRequired && !getTokenFromLocalStorage()) {
    authStore.returnUrl = to.fullPath
    return '/login'
  }

  if (authRequired) {
    const roles = to.meta.roles as string[] | undefined
    if (roles?.length && !authStore.canAccess(roles)) {
      return authStore.isDelivery ? '/delivery' : '/'
    }
  }

  if (to.path === '/login' && getTokenFromLocalStorage()) {
    return authStore.isDelivery ? '/delivery' : '/'
  }
})

export default router
