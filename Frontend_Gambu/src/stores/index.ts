import { defineStore } from 'pinia'
import { getTokenFromLocalStorage } from '@/helpers'
import http from '@/plugins/axios'
import router from '@/router'

function normalizeRole(role: string) {
  const normalized = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  const aliases: Record<string, string> = {
    admin: 'administrador',
    administrador: 'administrador',
    superadmin: 'administrador',
    cajero: 'cajero',
    caja: 'cajero',
    mesero: 'mesero',
    delivery: 'delivery',
    repartidor: 'delivery',
  }

  return aliases[normalized] || normalized
}

const useAuthStore = defineStore('auth', {
  state: () => ({
    user: localStorage.getItem('user') || '',
    userId: Number(localStorage.getItem('userId') || 0),
    userRole: localStorage.getItem('userRole') || '',
    token: getTokenFromLocalStorage(),
    returnUrl: ''
  }),
  getters: {
    normalizedRole: (state) => normalizeRole(state.userRole || state.user),
    isAdmin: (state) => normalizeRole(state.userRole || state.user) === 'administrador',
    isCashier: (state) => ['administrador', 'cajero'].includes(normalizeRole(state.userRole || state.user)),
    isWaiter: (state) => ['administrador', 'mesero'].includes(normalizeRole(state.userRole || state.user)),
    isDelivery: (state) => normalizeRole(state.userRole || state.user) === 'delivery',
    canAccess: (state) => (roles: string[]) => {
      const role = normalizeRole(state.userRole || state.user)
      if (role === 'administrador') return true
      return roles.map(normalizeRole).includes(role)
    }
  },
  actions: {
    async login(usuario: string, clave: string) {
      await http.post('auth/login', { usuario, clave }).then((response) => {
        this.user = response.data.usuario
        this.userId = Number(response.data.id || 0)
        this.userRole = response.data.rol?.nombreRol || ''
        this.token = response.data.access_token

        localStorage.setItem('user', this.user || '')
        localStorage.setItem('userId', String(this.userId || 0))
        localStorage.setItem('userRole', this.userRole || '')
        localStorage.setItem('token', this.token || '')

        if (this.isDelivery) {
          router.push('/delivery')
          return
        }

        router.push(this.returnUrl || '/')
      })
    },
    logout() {
      localStorage.clear()
      this.$reset()
      router.push('/login')
    }
  }
})

export { useAuthStore }
