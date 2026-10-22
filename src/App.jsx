import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Droplets,
  Activity,
  Cpu,
  Power,
  Waves,
  Sprout,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';

export default function App() {
  // Estado local sincronizado con el backend Edge (/api/telemetry)
  const [telemetry, setTelemetry] = useState({
    humidity: 42.5,
    flowRate: 0.0,
    totalLiters: 148.65,
    pumpState: false,
    valveState: false,
    sensorPulseActive: true,
    mode: 'AUTO',
    substrate: 'ARCILLOSO',
    systemVoltage: 12.35,
    lastUpdated: new Date().toISOString()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [pulseCounter, setPulseCounter] = useState(15);
  const [lastActionMessage, setLastActionMessage] = useState('Sistema en línea - Monitoreo Edge');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Umbrales según el sustrato seleccionado
  const substrateConfig = useMemo(() => {
    return telemetry.substrate === 'ARCILLOSO'
      ? { min: 35, target: 65, name: 'Arcilloso', desc: 'Retención alta (35% - 65%)' }
      : { min: 25, target: 55, name: 'Arenoso', desc: 'Drenaje rápido (25% - 55%)' };
  }, [telemetry.substrate]);

  // Consulta al backend Cloudflare Pages Function
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
      } else {
        // En desarrollo local sin Wrangler, mantener simulación suave
        localFallbackUpdate();
      }
    } catch {
      localFallbackUpdate();
    }
  }, []);

  // Simulación dinámica fallback en el cliente si no hay conexión con el Edge
  const localFallbackUpdate = () => {
    setTelemetry(prev => {
      let hum = prev.humidity;
      let flow = prev.flowRate;
      let liters = prev.totalLiters;
      let pump = prev.pumpState;

      if (pump) {
        hum = Math.min(96, +(hum + 0.8).toFixed(1));
        flow = +(2.1 + (Math.random() * 0.2 - 0.1)).toFixed(2);
        liters = +(liters + (flow / 60)).toFixed(2);

        if (prev.mode === 'AUTO' && hum >= substrateConfig.target) {
          pump = false;
          flow = 0.0;
        }
      } else {
        hum = Math.max(15, +(hum - 0.06).toFixed(1));
        flow = 0.0;
        if (prev.mode === 'AUTO' && hum < substrateConfig.min) {
          pump = true;
          flow = 2.1;
        }
      }

      return {
        ...prev,
        humidity: hum,
        flowRate: flow,
        totalLiters: liters,
        pumpState: pump,
        valveState: pump,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  // Enviar comando POST a Cloudflare Pages Function
  const sendCommand = async (action, payload = {}) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
        if (data.message) {
          setLastActionMessage(data.message);
        }
      } else {
        // Ejecución inmediata en estado local si la función no responde
        executeLocalAction(action, payload);
      }
    } catch {
      executeLocalAction(action, payload);
    } finally {
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  // Fallback para ejecución de acciones locales
  const executeLocalAction = (action, payload) => {
    setTelemetry(prev => {
      let updated = { ...prev };
      if (action === 'SIMULATE_SCENARIO') {
        if (payload.scenario === 'DRY_SOIL') {
          updated.humidity = 21.2;
          if (updated.mode === 'AUTO') {
            updated.pumpState = true;
            updated.valveState = true;
            updated.flowRate = 2.2;
          }
          setLastActionMessage('Escenario: Suelo Seco (<30%) simulado');
        } else if (payload.scenario === 'SATURATED_SOIL') {
          updated.humidity = 88.5;
          updated.pumpState = false;
          updated.valveState = false;
          updated.flowRate = 0.0;
          setLastActionMessage('Escenario: Suelo Saturado (>80%) simulado');
        }
      } else if (action === 'TOGGLE_PUMP') {
        updated.pumpState = !updated.pumpState;
        updated.valveState = updated.pumpState;
        updated.flowRate = updated.pumpState ? 2.15 : 0.0;
        setLastActionMessage(updated.pumpState ? 'Bomba forzada manualmente a ON' : 'Bomba apagada');
      } else if (action === 'TOGGLE_MODE') {
        updated.mode = updated.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
        setLastActionMessage(`Modo cambiado a: ${updated.mode}`);
      } else if (action === 'SET_SUBSTRATE') {
        updated.substrate = updated.substrate === 'ARCILLOSO' ? 'ARENOSO' : 'ARCILLOSO';
        setLastActionMessage(`Sustrato cambiado a: ${updated.substrate}`);
      }
      return updated;
    });
  };

  // Polling automático cada 2.5 segundos
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Contador de la subrutina de cuidado del sensor (Prevención de corrosión galvánica)
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCounter(prev => {
        if (prev <= 1) {
          // Pulso de excitación disparado
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pantalla completa en smartphone
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Cálculo para el Gauge SVG circular (arco semicircular minimalista)
  const radius = 64;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (telemetry.humidity / 100) * circumference;

  // Estado del suelo según rango
  const soilStatus = useMemo(() => {
    if (telemetry.humidity < substrateConfig.min) {
      return { label: 'CRÍTICO / SECO', colorText: 'text-black', bgBadge: 'bg-black text-white' };
    }
    if (telemetry.humidity > substrateConfig.target + 10) {
      return { label: 'SATURADO', colorText: 'text-brand-greenDark', bgBadge: 'bg-brand-green text-black font-bold' };
    }
    return { label: 'ÓPTIMO', colorText: 'text-brand-green', bgBadge: 'bg-brand-green/20 text-black border border-brand-green' };
  }, [telemetry.humidity, substrateConfig]);

  return (
    <main className="min-h-screen bg-black text-black font-sans flex justify-center items-start sm:py-6 antialiased selection:bg-brand-green selection:text-black">
      {/* Contenedor Mockup Móvil Estilo App Nativa */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:rounded-[36px] shadow-2xl flex flex-col justify-between overflow-hidden relative border border-black/10">
        
        {/* ================= HEADER TIPO SMARTPHONE NATIVO ================= */}
        <header className="bg-black text-white px-5 pt-4 pb-3 flex flex-col border-b border-neutral-900 sticky top-0 z-30">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
              <span className="font-semibold text-white tracking-wider">EDGE CLOUDFLARE</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{telemetry.systemVoltage}V</span>
              <button 
                onClick={toggleFullScreen}
                title="Modo Pantalla Completa"
                className="p-1 text-neutral-300 hover:text-white transition active:scale-95"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black shadow-inner">
                <Sprout size={20} className="text-black" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                  AgroSmart <span className="text-[10px] bg-brand-green text-black font-bold px-1.5 py-0.5 rounded">IoT</span>
                </h1>
                <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Riego Autónomo & Monitoreo</p>
              </div>
            </div>

            {/* Badge de Modo AUTO / MANUAL */}
            <button
              onClick={() => sendCommand('TOGGLE_MODE')}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all border ${
                telemetry.mode === 'AUTO'
                  ? 'bg-brand-green text-black border-brand-green shadow-sm'
                  : 'bg-neutral-900 text-white border-neutral-700'
              } active:scale-95 flex items-center gap-1.5`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.mode === 'AUTO' ? 'bg-black' : 'bg-brand-green'}`} />
              {telemetry.mode}
            </button>
          </div>
        </header>

        {/* ================= CONTENIDO PRINCIPAL SCROLLABLE ================= */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          
          {/* BANNER DE ESTADO RÁPIDO */}
          <div className="flex items-center justify-between bg-neutral-100 rounded-2xl px-4 py-2.5 border border-black/5 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Activity size={14} className="text-brand-green shrink-0" />
              <span className="font-medium text-black truncate">{lastActionMessage}</span>
            </div>
            <button
              onClick={fetchTelemetry}
              className={`p-1 rounded-lg hover:bg-neutral-200 transition ${isLoading ? 'animate-spin' : ''}`}
              title="Refrescar métricas"
            >
              <RefreshCw size={13} className="text-neutral-700" />
            </button>
          </div>

          {/* ================= GAUGE MINIMALISTA DE HUMEDAD ================= */}
          <div className="bg-white rounded-3xl p-5 border-2 border-black shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                <Droplets size={14} className="text-black" />
                Humedad de Suelo
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${soilStatus.bgBadge}`}>
                {soilStatus.label}
              </span>
            </div>

            {/* Visualizador Circular SVG Minimalista */}
            <div className="flex items-center justify-center py-2 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Círculo base de fondo */}
                  <circle
                    stroke="#f4f4f5"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  {/* Círculo de progreso verde/negro */}
                  <circle
                    stroke="#10b981"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                </svg>

                {/* Lectura en el centro */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-black font-mono tracking-tighter">
                    {telemetry.humidity.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
                    Capacitivo V1.2
                  </span>
                </div>
              </div>

              {/* Parámetros laterales de referencia */}
              <div className="ml-5 flex flex-col justify-center space-y-2 text-xs">
                <div className="border-l-2 border-brand-green pl-2.5">
                  <p className="text-[10px] text-neutral-500 font-medium">Umbral Objetivo</p>
                  <p className="text-sm font-bold text-black font-mono">{substrateConfig.target}%</p>
                </div>
                <div className="border-l-2 border-black pl-2.5">
                  <p className="text-[10px] text-neutral-500 font-medium">Umbral Mínimo</p>
                  <p className="text-sm font-bold text-black font-mono">{substrateConfig.min}%</p>
                </div>
                <div className="border-l-2 border-neutral-300 pl-2.5">
                  <p className="text-[10px] text-neutral-500 font-medium">Sustrato Activo</p>
                  <p className="text-xs font-semibold text-black uppercase">{substrateConfig.name}</p>
                </div>
              </div>
            </div>

            {/* Barra de progreso lineal sutil */}
            <div className="mt-2 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
              <span>0% (Seco)</span>
              <span className="font-mono text-black font-semibold">Sensor: Activo por pulsos</span>
              <span>100% (Saturado)</span>
            </div>
          </div>

          {/* ================= ESTADO DE ACTUADORES & CAUDAL ================= */}
          <div className="grid grid-cols-2 gap-3">
            {/* Actuador 1: Mini Bomba de Agua */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              telemetry.pumpState 
                ? 'border-brand-green bg-brand-green/10 shadow-sm' 
                : 'border-black/10 bg-neutral-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  telemetry.pumpState ? 'bg-black text-brand-green' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  <Zap size={16} className={telemetry.pumpState ? 'fill-brand-green' : ''} />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  telemetry.pumpState ? 'bg-brand-green text-black' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {telemetry.pumpState ? 'ON' : 'OFF'}
                </span>
              </div>
              <h2 className="text-xs font-bold text-black">Bomba Sumergible</h2>
              <p className="text-[10px] text-neutral-500">Alimentación 12V DC</p>
            </div>

            {/* Actuador 2: Electroválvula Solenoide */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              telemetry.valveState 
                ? 'border-brand-green bg-brand-green/10 shadow-sm' 
                : 'border-black/10 bg-neutral-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  telemetry.valveState ? 'bg-black text-brand-green' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  <Waves size={16} />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  telemetry.valveState ? 'bg-brand-green text-black' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {telemetry.valveState ? 'ABIERTA' : 'CERRADA'}
                </span>
              </div>
              <h2 className="text-xs font-bold text-black">Electroválvula 12V</h2>
              <p className="text-[10px] text-neutral-500">Solenoide N/C</p>
            </div>
          </div>

          {/* ================= CAUDALÍMETRO EFECTO HALL & LITROS ================= */}
          <div className="bg-black text-white rounded-3xl p-4.5 border border-black shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-brand-green">
                  <Activity size={15} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Caudalímetro YF-S201</h2>
                  <p className="text-[10px] text-neutral-400">Sensor de Pulsos Efecto Hall</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-brand-green bg-brand-green/10 border border-brand-green/30 px-2 py-0.5 rounded-md">
                K = 7.5
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3">
              <div>
                <p className="text-[10px] text-neutral-400 font-medium">Caudal Instantáneo</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black font-mono text-white">
                    {telemetry.flowRate.toFixed(2)}
                  </span>
                  <span className="text-xs text-brand-green font-semibold">L/min</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 font-medium">Consumo Acumulado</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black font-mono text-white">
                    {telemetry.totalLiters.toFixed(2)}
                  </span>
                  <span className="text-xs text-brand-green font-semibold">Litros</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= SUBRUTINA DE CUIDADO DEL SENSOR ================= */}
          <div className="bg-white rounded-2xl p-4 border border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-black border border-black/10">
                  <ShieldCheck size={18} className="text-brand-green" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-green rounded-full border-2 border-white pulse-sensor"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-black">Protección Anti-Galvánica</h2>
                  <span className="text-[9px] bg-brand-green/20 text-brand-greenDark font-bold px-1.5 py-0.2 rounded">
                    ON
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                  Excitación por pulsos (previene electrólisis)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 font-mono block">Próximo pulso</span>
              <span className="text-xs font-black font-mono text-black bg-neutral-100 px-2 py-1 rounded-md border border-black/5">
                {pulseCounter}s
              </span>
            </div>
          </div>

          {/* ================= MODO DEMOSTRACIÓN EN VIVO (TOUCHPAD) ================= */}
          <div className="bg-neutral-50 rounded-3xl p-4 border border-black/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sliders size={14} className="text-black" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
                  Consola de Demostración
                </h3>
              </div>
              <span className="text-[10px] bg-white border border-black/10 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                Simulación en Vivo
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 mb-3 leading-snug">
              Prueba los escenarios del sistema en tiempo real tocando los botones táctiles:
            </p>

            {/* Grid de Botones Táctiles Minimalistas */}
            <div className="grid grid-cols-2 gap-2">
              {/* Botón 1: Suelo Seco */}
              <button
                onClick={() => sendCommand('SIMULATE_SCENARIO', { scenario: 'DRY_SOIL' })}
                disabled={isLoading}
                className="bg-white hover:bg-neutral-100 active:scale-95 text-black border border-black/20 p-2.5 rounded-xl text-left transition flex flex-col justify-between h-16 shadow-sm"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 font-mono">01. Sequía</span>
                  <AlertCircle size={13} className="text-black" />
                </div>
                <span className="text-xs font-bold leading-tight">Suelo Seco &lt; 30%</span>
              </button>

              {/* Botón 2: Suelo Saturado */}
              <button
                onClick={() => sendCommand('SIMULATE_SCENARIO', { scenario: 'SATURATED_SOIL' })}
                disabled={isLoading}
                className="bg-white hover:bg-neutral-100 active:scale-95 text-black border border-black/20 p-2.5 rounded-xl text-left transition flex flex-col justify-between h-16 shadow-sm"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 font-mono">02. Exceso</span>
                  <CheckCircle2 size={13} className="text-brand-green" />
                </div>
                <span className="text-xs font-bold leading-tight">Suelo Saturado &gt; 80%</span>
              </button>

              {/* Botón 3: Activar Bomba Manual */}
              <button
                onClick={() => sendCommand('TOGGLE_PUMP')}
                disabled={isLoading}
                className={`active:scale-95 border p-2.5 rounded-xl text-left transition flex flex-col justify-between h-16 shadow-sm ${
                  telemetry.pumpState
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black/20 hover:bg-neutral-100'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono">03. Actuador</span>
                  <Power size={13} className={telemetry.pumpState ? 'text-brand-green' : 'text-neutral-500'} />
                </div>
                <span className="text-xs font-bold leading-tight">
                  {telemetry.pumpState ? 'Detener Bomba' : 'Bomba Manual'}
                </span>
              </button>

              {/* Botón 4: Cambiar Sustrato */}
              <button
                onClick={() => sendCommand('SET_SUBSTRATE')}
                disabled={isLoading}
                className="bg-white hover:bg-neutral-100 active:scale-95 text-black border border-black/20 p-2.5 rounded-xl text-left transition flex flex-col justify-between h-16 shadow-sm"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 font-mono">04. Tipo Suelo</span>
                  <ArrowUpRight size={13} className="text-black" />
                </div>
                <span className="text-xs font-bold leading-tight truncate">
                  {telemetry.substrate === 'ARCILLOSO' ? 'Arcilloso → Arenoso' : 'Arenoso → Arcilloso'}
                </span>
              </button>
            </div>

            {/* Alternador de Modo completo */}
            <button
              onClick={() => sendCommand('TOGGLE_MODE')}
              disabled={isLoading}
              className="mt-2.5 w-full bg-black text-white active:scale-[0.98] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-black shadow transition"
            >
              <Cpu size={14} className="text-brand-green" />
              <span>Conmutar Modo: {telemetry.mode === 'AUTO' ? 'Pasar a MANUAL' : 'Pasar a AUTO (Automático)'}</span>
            </button>
          </div>

        </div>

        {/* ================= FOOTER / NAVEGACIÓN INFERIOR MÓVIL ================= */}
        <footer className="bg-white border-t border-black/10 px-5 py-3 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            <span className="font-mono text-[11px] text-black font-semibold">PWA Ready • Cloudflare Pages</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </footer>

      </div>
    </main>
  );
}
