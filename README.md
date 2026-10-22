# 🌿 AgroSmart IoT | Sistema de Riego Automatizado Inteligente

Prototipo Móvil (PWA) y Backend Serverless Edge (Cloudflare Pages) para monitoreo y control de riego agrícola en tiempo real. Diseñado para demostraciones interactivas en vivo directamente desde smartphones.

---

## 🎨 Características Principales

* **Estética Minimalista High-End:** Paleta cromática estricta de **Verde** (acentos, estados activos), **Blanco** (superficies limpias) y **Negro** (estructuras y tipografía).
* **100% PWA & Mobile-First:** Diseñado específicamente para pantallas táctiles de teléfonos móviles con soporte "Añadir a pantalla de inicio" a pantalla completa.
* **Gauge Circular Dinámico:** Visualizador de humedad volumétrica de suelo (0–100%) con umbrales configurables por sustrato.
* **Telemetría de Actuadores:** Indicador en tiempo real de Mini Bomba Sumergible 12V y Electroválvula Solenoide 12V.
* **Caudalímetro Efecto Hall (YF-S201):** Medición de caudal instantáneo (L/min) y volumen acumulado (Litros consumidos).
* **Subrutina de Cuidado del Sensor:** Algoritmo de excitación por pulsos para prevenir la degradación por corrosión galvánica del sensor capacitivo.
* **Consola de Demostración Rápida:** Botones táctiles de 1-toque para forzar escenarios:
  1. *Suelo Seco (< 30%)*
  2. *Suelo Saturado (> 80%)*
  3. *Activar/Desactivar Bomba Manual*
  4. *Cambiar Sustrato (Arcilloso vs. Arenoso)*
  5. *Alternar Modo (Automático vs. Manual)*

---

## 🚀 Despliegue en Cloudflare Pages en 3 Clics

### Paso 1: Subir a GitHub
1. Inicializa el repositorio y sube el código a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: prototipo de riego automatizado iot"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/sistema-riego-automatico.git
   git push -u origin main
   ```

### Paso 2: Conectar con Cloudflare Pages
1. Inicia sesión en tu cuenta de [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. En el menú lateral, dirígete a **Workers & Pages** > botón **Create Application** > pestaña **Pages** > **Connect to Git**.
3. Selecciona tu repositorio `sistema-riego-automatico`.

### Paso 3: Configurar Build y Desplegar
* **Framework preset:** `Vite`
* **Build command:** `npm run build`
* **Build output directory:** `dist`
* Haz clic en **Save and Deploy**. En menos de 60 segundos tu aplicación estará disponible globalmente en una URL segura HTTPS tipo `https://sistema-riego-automatico.pages.dev`.

---

## 📱 Cómo Realizar la Demostración en Vivo desde el Teléfono

1. Abre el enlace `https://tu-proyecto.pages.dev` en el navegador de tu smartphone (Safari en iOS o Chrome en Android).
2. Toca el botón de compartir o los tres puntos y selecciona **"Añadir a la pantalla de inicio"** (*Add to Home Screen*).
3. Abre el icono desde la pantalla de inicio: la aplicación se abrirá a **pantalla completa como una app nativa**, sin barras de navegador.
4. Durante la presentación, utiliza la **Consola de Demostración** inferior para cambiar las condiciones en vivo frente a la audiencia.
