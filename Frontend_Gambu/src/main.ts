import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import App from './App.vue'
import router from './router'

function resetLoginOnLocalStart() {
  const debeReiniciarSesion =
    import.meta.env.DEV && import.meta.env.VITE_RESET_LOGIN_ON_DEV !== 'false'

  if (!debeReiniciarSesion) return

  localStorage.removeItem('user')
  localStorage.removeItem('userId')
  localStorage.removeItem('userRole')
  localStorage.removeItem('token')
}

resetLoginOnLocalStart()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode'
    }
  }
})
app.use(ToastService)

app.mount('#app')
