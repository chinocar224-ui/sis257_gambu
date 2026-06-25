<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/index'

const usuario = ref('')
const clave = ref('')
const error = ref('')
const loading = ref(false)
const mostrarClave = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  const authStore = useAuthStore()
  try {
    await authStore.login(usuario.value, clave.value)
  } catch {
    error.value = 'Usuario y/o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}

function usarCredenciales() {
  usuario.value = 'admin'
  clave.value = 'admin123'
}
</script>

<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-brand">
        <div class="brand-icon">🍽</div>
        <h1>Gambu</h1>
        <p>Sistema de Gestión de Restaurante</p>
      </div>
      <div class="login-features">
        <div class="feature-item"><i class="pi pi-check-circle"></i> Gestión de pedidos en tiempo real</div>
        <div class="feature-item"><i class="pi pi-check-circle"></i> Control de inventario y stock</div>
        <div class="feature-item"><i class="pi pi-check-circle"></i> Administración de mesas y delivery</div>
        <div class="feature-item"><i class="pi pi-check-circle"></i> Reportes y control de pagos</div>
      </div>

      <!-- Credenciales de acceso rápido -->
      <div class="credentials-hint" @click="usarCredenciales" title="Clic para autocompletar">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>Acceso de administrador</strong>
          <span>Admin: <code>admin/admin123</code> · Cajero: <code>cajero/cajero123</code> · Delivery: <code>delivery/delivery123</code></span>
          <span class="custom-login-note">También funcionan los usuarios creados en el módulo Usuarios con su propia contraseña.</span>
        </div>
        <i class="pi pi-arrow-right hint-arrow"></i>
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">
        <h2>Iniciar Sesión</h2>
        <p class="login-subtitle">Ingresa tus credenciales para continuar</p>

        <form @submit.prevent="onSubmit">
          <div class="form-group" style="margin-bottom:1.25rem">
            <label class="form-label">Usuario</label>
            <div class="input-icon-wrap">
              <i class="pi pi-user input-icon"></i>
              <input
                v-model="usuario"
                type="text"
                class="form-input with-icon"
                placeholder="Ingresa tu usuario"
                autofocus
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem">
            <label class="form-label">Contraseña</label>
            <div class="input-icon-wrap">
              <i class="pi pi-lock input-icon"></i>
              <input
                v-model="clave"
                :type="mostrarClave ? 'text' : 'password'"
                class="form-input with-icon with-toggle"
                placeholder="Ingresa tu contraseña"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-password"
                @click="mostrarClave = !mostrarClave"
                :title="mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <i :class="mostrarClave ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
          </div>

          <div v-if="error" class="error-msg">
            <i class="pi pi-exclamation-triangle"></i> {{ error }}
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            <i v-if="loading" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-sign-in"></i>
            {{ loading ? 'Ingresando...' : 'Ingresar al Sistema' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, var(--gambu-dark) 0%, var(--gambu-brown) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 3rem;
  color: #fff;
}

.brand-icon { font-size: 3.5rem; margin-bottom: 0.75rem; }
.login-brand h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  color: var(--gambu-gold);
  margin-bottom: 0.5rem;
}
.login-brand p { font-size: 1.1rem; color: #ccc; margin-bottom: 3rem; }

.login-features { display: flex; flex-direction: column; gap: 0.875rem; }
.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ccc;
  font-size: 0.95rem;
}
.feature-item i { color: var(--gambu-gold); }

/* Credenciales hint */
.credentials-hint {
  margin-top: 2.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.credentials-hint:hover { background: rgba(255,255,255,0.14); }
.credentials-hint > .pi-info-circle { color: var(--gambu-gold); font-size: 1.2rem; flex-shrink: 0; }
.credentials-hint > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}
.credentials-hint strong { font-size: 0.85rem; color: #fff; }
.credentials-hint span { font-size: 0.78rem; color: #bbb; }
.credentials-hint .custom-login-note { color: #e5dccb; font-size: 0.72rem; }
.credentials-hint code {
  background: rgba(255,255,255,0.12);
  border-radius: 4px;
  padding: 0 4px;
  color: var(--gambu-gold);
  font-family: monospace;
}
.hint-arrow { color: rgba(255,255,255,0.4); flex-shrink: 0; }

.login-right {
  width: 480px;
  background: var(--gambu-cream);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.login-card h2 {
  font-size: 1.8rem;
  color: var(--gambu-dark);
  margin-bottom: 0.4rem;
}

.login-subtitle {
  color: var(--gambu-muted);
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.input-icon-wrap { position: relative; }
.input-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gambu-muted);
  font-size: 0.9rem;
}
.form-input.with-icon { padding-left: 2.5rem; width: 100%; }
.form-input.with-toggle { padding-right: 2.75rem; }

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gambu-muted);
  padding: 0;
  font-size: 0.9rem;
  line-height: 1;
}
.toggle-password:hover { color: var(--gambu-dark); }

.btn-login {
  width: 100%;
  background: var(--gambu-amber);
  color: #fff;
  border: none;
  padding: 0.875rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-family: 'DM Sans', sans-serif;
}
.btn-login:hover:not(:disabled) {
  background: var(--gambu-gold);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(200,118,26,0.4);
}
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

@media (max-width: 768px) {
  .login-left { display: none; }
  .login-right { width: 100%; }
}
</style>
