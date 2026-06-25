<script setup lang="ts">
import ReporteVentas from '@/components/reportes/ReporteVentas.vue'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Reportes de Ventas</h2>
        <p>Resumen profesional por fecha, método de pago, entrega y productos más vendidos</p>
      </div>
    </div>
    <div class="page-body">
      <ReporteVentas />
    </div>
  </div>
</template>
