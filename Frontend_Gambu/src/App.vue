<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/index'
import '@/assets/main.css'

const authStore = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)

watch(() => route.fullPath, () => {
  sidebarOpen.value = false
})

function cerrarSesion() {
  sidebarOpen.value = false
  authStore.logout()
}
</script>

<template>
  <div v-if="!authStore.token">
    <RouterView />
  </div>

  <div v-else class="app-layout" :class="{ 'sidebar-open': sidebarOpen }">
    <button class="mobile-menu-toggle" @click="sidebarOpen = true" aria-label="Abrir menú">
      <i class="pi pi-bars"></i>
    </button>
    <div class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-logo">
        <h1>Gambu</h1>
        <p>Restaurant POS</p>
      </div>
      <div class="sidebar-user">
        <span>Bienvenido,</span>
        <strong>{{ authStore.user }}</strong>
        <small>{{ authStore.userRole || 'Usuario' }}</small>
      </div>
      <nav class="sidebar-nav">
        <template v-if="authStore.isDelivery">
          <p class="nav-section-title">Delivery</p>
          <RouterLink to="/delivery"><i class="pi pi-truck"></i> Panel Delivery</RouterLink>
        </template>

        <template v-else>
          <p class="nav-section-title">Principal</p>
          <RouterLink to="/"><i class="pi pi-home"></i> Inicio</RouterLink>

          <p class="nav-section-title">Catálogo</p>
          <RouterLink to="/categorias"><i class="pi pi-tag"></i> Categorías</RouterLink>
          <RouterLink to="/productos"><i class="pi pi-box"></i> Productos</RouterLink>
          <RouterLink to="/clientes"><i class="pi pi-id-card"></i> Clientes</RouterLink>

          <p class="nav-section-title">Operaciones</p>
          <RouterLink to="/mesas"><i class="pi pi-table"></i> Mesas</RouterLink>
          <RouterLink to="/pedidos"><i class="pi pi-list"></i> Pedidos</RouterLink>
          <RouterLink to="/pagos"><i class="pi pi-credit-card"></i> Pagos</RouterLink>
          <RouterLink to="/direcciones"><i class="pi pi-map-marker"></i> Direcciones</RouterLink>
          <RouterLink v-if="authStore.isAdmin" to="/reportes"><i class="pi pi-chart-line"></i> Reportes</RouterLink>

          <template v-if="authStore.isAdmin">
            <p class="nav-section-title">Administración</p>
            <RouterLink to="/usuarios"><i class="pi pi-users"></i> Usuarios</RouterLink>
            <RouterLink to="/roles"><i class="pi pi-shield"></i> Roles</RouterLink>
          </template>
        </template>
      </nav>
      <div class="sidebar-footer">
        <button class="btn-logout" @click="cerrarSesion">
          <i class="pi pi-sign-out"></i> Cerrar Sesión
        </button>
      </div>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
