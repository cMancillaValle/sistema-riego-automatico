# AgroSmart IoT | Sistema de Riego Automatizado Inteligente

Prototipo Movil (PWA) y Backend Serverless Edge (Cloudflare Pages) para monitoreo y control de riego agricola en tiempo real. Disenado para demostraciones interactivas en vivo directamente desde smartphones.

---

## Caracteristicas Principales

* **Estetica Minimalista High-End:** Paleta cromatica estricta de **Verde** (acentos, estados activos), **Blanco** (superficies limpias) y **Negro** (estructuras y tipografia).
* **100% PWA y Mobile-First:** Disenado especificamente para pantallas tactiles de telefonos moviles con soporte "Anadir a pantalla de inicio" a pantalla completa.
* **Gauge Circular Dinamico:** Visualizador de humedad volumetrica de suelo (0 a 100%) con umbrales configurables por sustrato.
* **Telemetria de Actuadores:** Indicador en tiempo real de Mini Bomba Sumergible 12V y Electrovalvula Solenoide 12V.
* **Caudalimetro Efecto Hall (YF-S201):** Medicion de caudal instantaneo (L/min) y volumen acumulado (Litros consumidos).
* **Subrutina de Cuidado del Sensor:** Algoritmo de excitacion por pulsos para prevenir la degradacion por corrosion galvanica del sensor capacitivo.
* **Consola de Demostracion Rapida:** Botones tactiles de un toque para forzar escenarios:
  1. *Suelo Seco (< 30%)*
  2. *Suelo Saturado (> 80%)*
  3. *Activar/Desactivar Bomba Manual*
  4. *Cambiar Sustrato (Arcilloso vs. Arenoso)*
  5. *Alternar Modo (Automatico vs. Manual)*

---

## Estructura del Proyecto

* `functions/api/telemetry.js`: Endpoint serverless en Cloudflare Pages Functions para telemetria y control de actuadores.
* `src/App.jsx`: Interfaz de usuario responsiva construida con React y Tailwind CSS.
* `public/manifest.json`: Manifiesto de aplicacion web progresiva (PWA).
* `public/icon.svg`: Icono vectorial para instalacion en pantalla de inicio.
