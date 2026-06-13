"use client"

import React, { useState, useEffect, useRef } from "react"
import { Activity, Wifi, AlertCircle, Terminal, CheckCircle2, ShieldAlert } from "lucide-react"

interface MessageLog {
  time: string
  topic: string
  payload: string
  isCorrupt: boolean
}

export default function MonitorIot() {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected")
  const [occupancy, setOccupancy] = useState<boolean | null>(null)
  const [battery, setBattery] = useState<number | null>(null)
  const [linkQuality, setLinkQuality] = useState<number | null>(null)
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [lastMsgTime, setLastMsgTime] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const clientRef = useRef<any>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const BROKER_URL = "wss://broker.hivemq.com:8004/mqtt"
  const TOPIC = "mmtechouse/pruebas/iot/sensor_movimiento"

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  useEffect(() => {
    setStatus("connecting")
    setErrorMsg("")

    // Importar MQTT dinámicamente para evitar problemas de SSR en Next.js
    let active = true
    // @ts-ignore
    import("mqtt")
      .then((mqtt) => {
        if (!active) return

        const client = mqtt.connect(BROKER_URL, {
          clientId: `web_monitor_${Math.random().toString(16).substring(2, 10)}`,
          clean: true,
          connectTimeout: 5000,
        })

        clientRef.current = client

        client.on("connect", () => {
          if (!active) return
          setStatus("connected")
          client.subscribe(TOPIC, (err: any) => {
            if (err) {
              console.error("Error subscribiéndose al topic", err)
            } else {
              console.log(`Subscrito exitosamente al topic: ${TOPIC}`)
            }
          })
        })

        client.on("message", (topic: string, message: any) => {
          if (!active) return
          const rawPayload = message.toString()
          const now = new Date().toLocaleTimeString()

          setLastMsgTime(now)

          try {
            const data = JSON.parse(rawPayload)
            
            // Evaluar los campos recibidos
            if (data.occupancy !== undefined) {
              setOccupancy(!!data.occupancy)
            }
            if (data.battery !== undefined) {
              setBattery(Number(data.battery))
            }
            if (data.linkquality !== undefined) {
              setLinkQuality(Number(data.linkquality))
            }

            // Agregar al log de terminal
            setLogs((prev) => [
              ...prev.slice(-49), // Mantener últimos 50 mensajes
              { time: now, topic, payload: JSON.stringify(data, null, 2), isCorrupt: false },
            ])

          } catch (e) {
            // Manejo de JSON corrupto deliberado
            console.error("Payload corrupto recibido:", rawPayload)
            setLogs((prev) => [
              ...prev.slice(-49),
              { time: now, topic, payload: rawPayload, isCorrupt: true },
            ])
          }
        })

        client.on("error", (err: any) => {
          if (!active) return
          setStatus("error")
          setErrorMsg(err.message || "Error desconocido del socket.")
        })

        client.on("close", () => {
          if (!active) return
          setStatus("disconnected")
        })
      })
      .catch((err) => {
        console.error("Fallo al cargar librería mqtt:", err)
        setStatus("error")
        setErrorMsg("Error cargando librería de conexión.")
      })

    return () => {
      active = false
      if (clientRef.current) {
        clientRef.current.end()
      }
    }
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" /> Monitoreo en Vivo IoT
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Escuchando eventos de movimiento en tiempo real mediante HiveMQ WebSockets.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              status === "connected" ? "bg-emerald-500 animate-pulse" :
              status === "connecting" ? "bg-amber-500 animate-pulse" :
              status === "error" ? "bg-red-500" : "bg-slate-600"
            }`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
              status === "connected" ? "text-emerald-400" :
              status === "connecting" ? "text-amber-400" :
              status === "error" ? "text-red-400" : "text-slate-400"
            }`}>
              {status === "connected" ? "Conectado al Broker" :
               status === "connecting" ? "Conectando..." :
               status === "error" ? "Error de Red" : "Desconectado"}
            </span>
          </div>
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest truncate max-w-[250px]">
            {TOPIC}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Display Grid */}
      <div className="grid md:grid-cols-12 gap-6 py-6">
        
        {/* BIG INDICATOR (7 cols) */}
        <div className="md:col-span-7 bg-slate-950 border border-slate-900/60 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 text-center space-y-6 flex flex-col items-center">
            {/* Status Outer Circle */}
            <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
              occupancy === true 
                ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-105" 
                : occupancy === false 
                  ? "bg-slate-900/40 border-slate-700 shadow-inner" 
                  : "bg-slate-900/10 border-slate-800"
            }`}>
              {occupancy === true ? (
                <Wifi className="w-16 h-16 text-emerald-400 animate-pulse" />
              ) : occupancy === false ? (
                <Wifi className="w-16 h-16 text-slate-500 opacity-60" />
              ) : (
                <Wifi className="w-16 h-16 text-slate-700" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Estado del Área</span>
              <h3 className={`text-xl font-black uppercase tracking-wider transition-colors duration-300 ${
                occupancy === true ? "text-emerald-400" :
                occupancy === false ? "text-slate-400" : "text-slate-650"
              }`}>
                {occupancy === true ? "¡Movimiento Detectado!" :
                 occupancy === false ? "Sin Actividad (Limpio)" : "Esperando señal..."}
              </h3>
              {lastMsgTime && (
                <p className="text-[10px] text-slate-500 font-mono">Último mensaje recibido: {lastMsgTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* METRICS SIDE PANEL (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4">
          
          {/* Battery level */}
          <div className="bg-slate-950 border border-slate-900/60 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Batería del Sensor</span>
              <span className="text-xl font-extrabold text-white">
                {battery !== null ? `${battery}%` : "--"}
              </span>
            </div>
          </div>

          {/* Link quality */}
          <div className="bg-slate-950 border border-slate-900/60 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Calidad de Enlace LQI</span>
              <span className="text-xl font-extrabold text-white">
                {linkQuality !== null ? `${linkQuality} LQI` : "--"}
              </span>
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-sky-950/20 border border-sky-900/30 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-sky-300">
              <strong className="font-extrabold block text-white mb-0.5">Laboratorio de Pruebas:</strong>
              Envía señales presionando las opciones en la consola del script <code className="bg-sky-950 px-1 py-0.5 rounded text-white font-mono text-[10px]">sensor-simulado.js</code> para ver los cambios instantáneos aquí.
            </div>
          </div>
        </div>
      </div>

      {/* LIVE LOGGER / LIVE TERMINAL */}
      <div className="mt-4 bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden flex flex-col h-[280px]">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-900 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-sky-400" /> Live MQTT Payload Console
          </span>
          <button
            type="button"
            onClick={() => setLogs([])}
            className="text-[9px] font-extrabold text-slate-500 hover:text-slate-350 transition-colors uppercase font-mono cursor-pointer"
          >
            Limpiar logs
          </button>
        </div>

        {/* Terminal logs list */}
        <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-3 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              -- Esperando datos de telemetría --
            </div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`p-2.5 rounded-xl border leading-relaxed ${
                  log.isCorrupt 
                    ? "bg-red-950/25 border-red-900/30 text-red-300" 
                    : "bg-slate-900/60 border-slate-800/60 text-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-950 pb-1 mb-1.5 font-sans">
                  <span className="font-bold flex items-center gap-1">
                    {log.isCorrupt ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    Topic: {log.topic}
                  </span>
                  <span>{log.time}</span>
                </div>
                {log.isCorrupt ? (
                  <div className="text-red-400">
                    <p className="font-black text-[9px] uppercase tracking-wider mb-0.5">⚠️ Error: JSON Parse Failure</p>
                    <pre className="whitespace-pre-wrap">{log.payload}</pre>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap overflow-x-auto text-[10.5px]">{log.payload}</pre>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  )
}
