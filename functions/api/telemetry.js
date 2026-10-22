/**
 * Cloudflare Pages Function: /api/telemetry
 * Endpoint Serverless Edge para monitoreo y control IoT del Sistema de Riego
 */

// Estado simulado en memoria Edge (persistente durante la vida del worker)
let simulatedState = {
  humidity: 42.5,                 // Porcentaje humedad de suelo (0 - 100%)
  flowRate: 0.0,                  // Caudal instantáneo en L/min (Sensor Efecto Hall)
  totalLiters: 148.65,            // Litros acumulados consumidos
  pumpState: false,               // Mini bomba de agua 12V
  valveState: false,              // Electroválvula solenoide 12V
  sensorPulseActive: true,        // Subrutina anti-corrosión galvánica activa
  mode: 'AUTO',                   // 'AUTO' | 'MANUAL'
  substrate: 'ARCILLOSO',         // 'ARCILLOSO' (28-45% umbral) | 'ARENOSO' (15-28% umbral)
  systemVoltage: 12.35,           // Voltaje de alimentación
  lastPulseTime: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

// Configuración de sustratos y sus umbrales de activación
const SUBSTRATE_CONFIGS = {
  ARCILLOSO: { minThreshold: 35.0, targetThreshold: 65.0, drainRate: 0.15 },
  ARENOSO: { minThreshold: 25.0, targetThreshold: 55.0, drainRate: 0.40 }
};

// Headers estándar para respuestas JSON y soporte CORS
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const scenario = url.searchParams.get('scenario');

  if (scenario) {
    applyScenario(scenario);
  } else {
    // Si la bomba está encendida, simular flujo de agua continuo y aumento de humedad
    updateDynamicSimulation();
  }

  return new Response(JSON.stringify({
    success: true,
    telemetry: simulatedState,
    meta: {
      runtime: 'Cloudflare Pages Edge Functions (V8)',
      edgeTimestamp: Date.now()
    }
  }), {
    status: 200,
    headers: corsHeaders
  });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'SIMULATE_SCENARIO':
        applyScenario(payload?.scenario);
        break;

      case 'TOGGLE_PUMP':
        simulatedState.pumpState = !simulatedState.pumpState;
        simulatedState.valveState = simulatedState.pumpState;
        simulatedState.flowRate = simulatedState.pumpState ? 2.15 : 0.0;
        simulatedState.lastUpdated = new Date().toISOString();
        break;

      case 'TOGGLE_MODE':
        simulatedState.mode = simulatedState.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
        simulatedState.lastUpdated = new Date().toISOString();
        break;

      case 'SET_SUBSTRATE':
        if (['ARCILLOSO', 'ARENOSO'].includes(payload?.substrate)) {
          simulatedState.substrate = payload.substrate;
        }
        simulatedState.lastUpdated = new Date().toISOString();
        break;

      case 'PULSE_SENSOR':
        simulatedState.sensorPulseActive = true;
        simulatedState.lastPulseTime = new Date().toISOString();
        break;

      default:
        return new Response(JSON.stringify({ error: 'Acción no reconocida' }), {
          status: 400,
          headers: corsHeaders
        });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Acción '${action}' ejecutada correctamente`,
      telemetry: simulatedState
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Error procesando solicitud POST'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

function applyScenario(scenario) {
  const now = new Date().toISOString();
  switch (scenario) {
    case 'DRY_SOIL':
      simulatedState.humidity = 21.4; // Menos de 30%
      if (simulatedState.mode === 'AUTO') {
        simulatedState.pumpState = true;
        simulatedState.valveState = true;
        simulatedState.flowRate = 2.3;
      }
      break;

    case 'SATURATED_SOIL':
      simulatedState.humidity = 87.2; // Más de 80%
      simulatedState.pumpState = false;
      simulatedState.valveState = false;
      simulatedState.flowRate = 0.0;
      break;

    case 'TOGGLE_PUMP':
      simulatedState.pumpState = !simulatedState.pumpState;
      simulatedState.valveState = simulatedState.pumpState;
      simulatedState.flowRate = simulatedState.pumpState ? 2.2 : 0.0;
      break;

    case 'TOGGLE_MODE':
      simulatedState.mode = simulatedState.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
      break;

    case 'TOGGLE_SUBSTRATE':
      simulatedState.substrate = simulatedState.substrate === 'ARCILLOSO' ? 'ARENOSO' : 'ARCILLOSO';
      break;

    default:
      break;
  }
  simulatedState.lastUpdated = now;
}

function updateDynamicSimulation() {
  const now = new Date().toISOString();
  // Simulación dinámica de lectura
  if (simulatedState.pumpState) {
    // Si la bomba está activa, la humedad sube gradualmente y se acumula agua
    simulatedState.humidity = Math.min(95, +(simulatedState.humidity + 1.2).toFixed(1));
    simulatedState.flowRate = +(2.1 + (Math.random() * 0.3 - 0.15)).toFixed(2);
    simulatedState.totalLiters = +(simulatedState.totalLiters + (simulatedState.flowRate / 60)).toFixed(2);

    // Si está en modo AUTO y ya superó el umbral target, se apaga
    const currentSubstrate = SUBSTRATE_CONFIGS[simulatedState.substrate];
    if (simulatedState.mode === 'AUTO' && simulatedState.humidity >= currentSubstrate.targetThreshold) {
      simulatedState.pumpState = false;
      simulatedState.valveState = false;
      simulatedState.flowRate = 0.0;
    }
  } else {
    // Si está apagada, ligera pérdida por evaporación o pequeñas fluctuaciones
    const drain = SUBSTRATE_CONFIGS[simulatedState.substrate].drainRate;
    simulatedState.humidity = Math.max(12, +(simulatedState.humidity - drain * 0.05 + (Math.random() * 0.08 - 0.04)).toFixed(1));
    simulatedState.flowRate = 0.0;

    // Si en AUTO baja del mínimo, se auto-activa
    const currentSubstrate = SUBSTRATE_CONFIGS[simulatedState.substrate];
    if (simulatedState.mode === 'AUTO' && simulatedState.humidity < currentSubstrate.minThreshold) {
      simulatedState.pumpState = true;
      simulatedState.valveState = true;
      simulatedState.flowRate = 2.15;
    }
  }

  // Micro-fluctuación en voltaje
  simulatedState.systemVoltage = +(12.3 + (Math.random() * 0.15 - 0.07)).toFixed(2);
  simulatedState.lastUpdated = now;
}
