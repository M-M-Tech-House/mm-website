"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactModal } from "@/components/contact-modal"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Download, 
  Upload, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  FileText, 
  Activity, 
  Settings, 
  Play,
  RotateCcw,
  Sliders,
  Database,
  Trash2,
  Filter,
  Factory,
  X,
  LogIn,
  LogOut,
  User as UserIcon
} from "lucide-react"
import { auth, googleProvider } from "@/lib/firebase"
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth"

// Types
interface MachineEvent {
  inicio: number // minuto de inicio
  duracion: number // duracion en minutos
  categoria: "Operando" | "Falla" | "Parada Planificada"
  detalle: string
  produccion?: number
  estado?: string
  velocidad?: number // produccion / duracion (piezas por minuto)
}

interface OeeData {
  events: MachineEvent[]
  piezasBuenas: number
  piezasDefectuosas: number
  velocidadNominal: number // piezas por minuto
}

interface MachineUpload {
  id: string
  fileName: string
  machineName: string
  fabrica: string
  departamento: string
  data: OeeData
}

// Default scenarios
const ESCENARIOS: Record<string, OeeData & { nombre: string; descripcion: string }> = {
  clase_mundial: {
    nombre: "Clase Mundial (Excelente)",
    descripcion: "Alta disponibilidad, velocidad óptima y bajísima tasa de defectos.",
    piezasBuenas: 1120,
    piezasDefectuosas: 8,
    velocidadNominal: 2.5,
    events: [
      { inicio: 0, duracion: 180, categoria: "Operando", detalle: "Producción Lote A - Normal" },
      { inicio: 180, duracion: 15, categoria: "Parada Planificada", detalle: "Cambio de turno e inspección rápida" },
      { inicio: 195, duracion: 120, categoria: "Operando", detalle: "Producción Lote A - Reanudación" },
      { inicio: 315, duracion: 10, categoria: "Falla", detalle: "Reajuste menor en alimentador" },
      { inicio: 325, duracion: 155, categoria: "Operando", detalle: "Producción Lote B" }
    ]
  },
  microparadas: {
    nombre: "Microparadas y Alertas",
    descripcion: "La línea operó con demoras frecuentes por ajustes menores de velocidad y fallas constantes.",
    piezasBuenas: 780,
    piezasDefectuosas: 15,
    velocidadNominal: 2.5,
    events: [
      { inicio: 0, duracion: 60, categoria: "Operando", detalle: "Arranque de turno lento" },
      { inicio: 60, duracion: 15, categoria: "Falla", detalle: "Atasco menor de material" },
      { inicio: 75, duracion: 90, categoria: "Operando", detalle: "Operación inestable" },
      { inicio: 165, duracion: 20, categoria: "Falla", detalle: "Ajuste de guías laterales" },
      { inicio: 185, duracion: 30, categoria: "Parada Planificada", detalle: "Mantenimiento autónomo programado" },
      { inicio: 215, duracion: 100, categoria: "Operando", detalle: "Producción baja velocidad" },
      { inicio: 315, duracion: 25, categoria: "Falla", detalle: "Fallo de sensor óptico" },
      { inicio: 340, duracion: 140, categoria: "Operando", detalle: "Cierre de turno" }
    ]
  },
  falla_mayor: {
    nombre: "Falla Crítica de Motor",
    descripcion: "Fallo mecánico mayor que detuvo la producción durante casi la mitad del turno.",
    piezasBuenas: 460,
    piezasDefectuosas: 5,
    velocidadNominal: 2.5,
    events: [
      { inicio: 0, duracion: 120, categoria: "Operando", detalle: "Producción estable inicial" },
      { inicio: 120, duracion: 210, categoria: "Falla", detalle: "Rotura de correa y sobrecalentamiento motor" },
      { inicio: 330, duracion: 15, categoria: "Parada Planificada", detalle: "Prueba y puesta a punto de seguridad" },
      { inicio: 345, duracion: 135, categoria: "Operando", detalle: "Producción recuperada" }
    ]
  },
  defecto_calidad: {
    nombre: "Problema de Calidad en Lote",
    descripcion: "Línea veloz y continua, pero con materia prima defectuosa que generó alto descarte.",
    piezasBuenas: 720,
    piezasDefectuosas: 310,
    velocidadNominal: 2.5,
    events: [
      { inicio: 0, duracion: 240, categoria: "Operando", detalle: "Producción Lote X - Materia prima defectuosa" },
      { inicio: 240, duracion: 20, categoria: "Parada Planificada", detalle: "Cambio de bobina de empaque" },
      { inicio: 260, duracion: 220, categoria: "Operando", detalle: "Producción Lote Y" }
    ]
  }
}

// Helper to parse date times in various common formats (DD/MM/YYYY, YYYY-MM-DD, with or without time)
const parseDateTime = (str: string): Date => {
  const trimmed = str.trim()
  
  // 1. DD/MM/YYYY HH:MM:SS or DD-MM-YYYY HH:MM:SS
  const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  const dmyMatch = trimmed.match(dmyRegex)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10)
    const month = parseInt(dmyMatch[2], 10) - 1 // 0-indexed month
    const year = parseInt(dmyMatch[3], 10)
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0
    
    const d = new Date(year, month, day, hours, minutes, seconds)
    if (!isNaN(d.getTime())) return d
  }

  // 2. YYYY-MM-DD HH:MM:SS or YYYY/MM/DD HH:MM:SS
  const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  const ymdMatch = trimmed.match(ymdRegex)
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10)
    const month = parseInt(ymdMatch[2], 10) - 1
    const day = parseInt(ymdMatch[3], 10)
    const hours = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0
    const minutes = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0
    const seconds = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0

    const d = new Date(year, month, day, hours, minutes, seconds)
    if (!isNaN(d.getTime())) return d
  }

  // Fallback to standard constructor
  const dFallback = new Date(trimmed)
  if (!isNaN(dFallback.getTime())) return dFallback

  throw new Error(`Fecha/hora no reconocida: "${str}". Usa DD/MM/YYYY HH:mm o YYYY-MM-DD HH:mm`)
}

// Helper to determine if a string is a datetime or a relative integer minute
const parseTimeOrRelative = (str: string): { date: Date | null; relativeMin: number | null } => {
  const trimmed = str.trim()
  if (/^\d+$/.test(trimmed)) {
    return { date: null, relativeMin: parseInt(trimmed, 10) }
  }
  return { date: parseDateTime(trimmed), relativeMin: null }
}

export default function DashboardOeePage() {
  const [activeScenario, setActiveScenario] = useState<string>("clase_mundial")
  const [inputMode, setInputMode] = useState<"csv" | "scenario" | "manual">("scenario")
  
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Auto-dismiss login error after 4 seconds
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => setLoginError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [loginError])

  // Multi-machine uploaded state
  const [machines, setMachines] = useState<MachineUpload[]>([])
  
  // View scope and filter
  const [viewScope, setViewScope] = useState<"all" | "fabrica" | "departamento" | "machine">("all")
  const [selectedFilter, setSelectedFilter] = useState<string>("")

  // Firebase Auth State Listener
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Check and enforce machine limits on logout
  useEffect(() => {
    if (!user && machines.length > 3) {
      setMachines(prev => {
        if (prev.length > 3) {
          return prev.slice(0, 3)
        }
        return prev
      })
      setViewScope(prevScope => {
        if (prevScope === "machine") {
          const firstThreeIds = machines.slice(0, 3).map(m => m.id)
          if (!firstThreeIds.includes(selectedFilter)) {
            setSelectedFilter("")
            return "all"
          }
        }
        return prevScope
      })
    }
  }, [user])

  // Google Sign-In helper
  const handleLogin = async () => {
    if (!auth) {
      alert("Firebase no está configurado de manera correcta. Verifica tus variables de entorno.")
      return
    }
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: any) {
      console.error("Error during Google Sign In:", err)
      if (err?.code === "auth/configuration-not-found") {
        alert(
          "Error de configuración en Firebase: El proveedor de inicio de sesión con Google está desactivado en la consola de Firebase.\n\n" +
          "Para solucionarlo:\n" +
          "1. Ve a la Consola de Firebase (https://console.firebase.google.com/)\n" +
          "2. Entra a tu proyecto: mmtechouse-db157\n" +
          "3. En la barra lateral, ve a 'Authentication' > pestaña 'Sign-in method'.\n" +
          "4. Habilítalo, selecciona un correo de asistencia técnica para el proyecto y guarda los cambios.\n" +
          "5. Vuelve a intentar el inicio de sesión."
        )
      } else if (err?.code === "auth/unauthorized-domain") {
        alert(
          "Error de dominio no autorizado en Firebase: Este dominio no está permitido para autenticación.\n\n" +
          "Para solucionarlo:\n" +
          "1. Ve a la Consola de Firebase (https://console.firebase.google.com/)\n" +
          "2. Entra a tu proyecto: mmtechouse-db157\n" +
          "3. Ve a 'Authentication' > pestaña 'Settings' (Configuración).\n" +
          "4. En el menú de la izquierda, selecciona 'Authorized domains' (Dominios autorizados).\n" +
          "5. Haz clic en 'Agregar dominio' e ingresa tu dominio de Vercel (ej: tu-proyecto.vercel.app o tu dominio personalizado).\n" +
          "6. Guarda e intenta iniciar sesión nuevamente."
        )
      } else if (
        err?.code === "auth/internal-error" || 
        err?.message?.includes("auth/internal-error") ||
        err?.toString()?.includes("auth/internal-error")
      ) {
        alert(
          "Error Interno de Firebase (auth/internal-error):\n\n" +
          "Esto suele ocurrir por:\n" +
          "1. No haber reiniciado el servidor de desarrollo después de crear o editar el archivo .env.local. Por favor, detén el proceso 'npm run dev' en tu terminal y vuelve a iniciarlo.\n" +
          "2. Un bloqueador de anuncios (como Brave Shields, AdBlock o similar) que está bloqueando la comunicación con Firebase.\n" +
          "3. Credenciales incorrectas en tu archivo .env.local.\n\n" +
          "Por favor desactiva tu bloqueador de anuncios y reinicia tu dev server 'npm run dev'."
        )
      } else if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.message?.includes("auth/popup-closed-by-user") ||
        err?.message?.includes("auth/cancelled-popup-request") ||
        err?.message?.includes("popup-closed-by-user") ||
        err?.message?.includes("cancelled-popup-request") ||
        err?.toString()?.includes("popup-closed-by-user") ||
        err?.toString()?.includes("cancelled-popup-request")
      ) {
        setLoginError("El inicio de sesión fue cancelado.")
      } else {
        setLoginError("No se pudo iniciar sesión con Google. Por favor intenta de nuevo.")
      }
    }
  }

  // Sign-Out helper
  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (err) {
      console.error("Error signing out:", err)
    }
  }

  // Manual sliders state (starts with Clase Mundial values)
  const [manualMinOperando, setManualMinOperando] = useState(455)
  const [manualMinFallas, setManualMinFallas] = useState(10)
  const [manualMinPlanificadas, setManualMinPlanificadas] = useState(15)
  const [manualPiezasBuenas, setManualPiezasBuenas] = useState(1120)
  const [manualPiezasDefectuosas, setManualPiezasDefectuosas] = useState(8)
  const [manualVelocidadNominal, setManualVelocidadNominal] = useState(2.5)

  // Drag & drop state
  const [isDragOver, setIsDragOver] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvSuccess, setCsvSuccess] = useState<boolean>(false)



  // Derived: unique fabricas/departamentos from machines
  const fabricas = [...new Set(machines.map(m => m.fabrica))]
  const departamentos = [...new Set(machines.map(m => m.departamento))]

  // Get filtered machines based on viewScope
  const getFilteredMachines = (): MachineUpload[] => {
    if (machines.length === 0) return []
    if (viewScope === "all") return machines
    if (viewScope === "fabrica") return machines.filter(m => m.fabrica === selectedFilter)
    if (viewScope === "departamento") return machines.filter(m => m.departamento === selectedFilter)
    if (viewScope === "machine") return machines.filter(m => m.id === selectedFilter)
    return machines
  }

  // Aggregate OeeData from multiple machines
  const aggregateMachines = (macs: MachineUpload[]): OeeData => {
    if (macs.length === 0) return { events: [], piezasBuenas: 0, piezasDefectuosas: 0, velocidadNominal: 1 }
    if (macs.length === 1) return macs[0].data
    
    const allEvents = macs.flatMap(m => m.data.events)
    const totalBuenas = macs.reduce((s, m) => s + m.data.piezasBuenas, 0)
    const totalDefectuosas = macs.reduce((s, m) => s + m.data.piezasDefectuosas, 0)
    // Weighted average of velocidadNominal by total time per machine
    let totalTime = 0
    let weightedSpeed = 0
    macs.forEach(m => {
      const t = m.data.events.reduce((s, e) => s + e.duracion, 0)
      totalTime += t
      weightedSpeed += m.data.velocidadNominal * t
    })
    const avgSpeed = totalTime > 0 ? weightedSpeed / totalTime : 1
    
    return {
      events: allEvents,
      piezasBuenas: totalBuenas,
      piezasDefectuosas: totalDefectuosas,
      velocidadNominal: avgSpeed
    }
  }

  // Get current active data
  const getCurrentData = (): OeeData => {
    if (inputMode === "manual") {
      // Build dummy events for manual inputs to render the timeline
      const totalTime = manualMinOperando + manualMinFallas + manualMinPlanificadas
      const events: MachineEvent[] = []
      
      let currentMin = 0
      if (manualMinOperando > 0) {
        // split operando in two parts for visual variety if long
        if (manualMinOperando > 100) {
          const part1 = Math.floor(manualMinOperando * 0.6)
          const part2 = manualMinOperando - part1
          events.push({ inicio: currentMin, duracion: part1, categoria: "Operando", detalle: "Operación Manual Sección 1" })
          currentMin += part1
          if (manualMinPlanificadas > 0) {
            events.push({ inicio: currentMin, duracion: manualMinPlanificadas, categoria: "Parada Planificada", detalle: "Parada Planificada" })
            currentMin += manualMinPlanificadas
          }
          events.push({ inicio: currentMin, duracion: part2, categoria: "Operando", detalle: "Operación Manual Sección 2" })
          currentMin += part2
          if (manualMinFallas > 0) {
            events.push({ inicio: currentMin, duracion: manualMinFallas, categoria: "Falla", detalle: "Parada por Falla" })
          }
        } else {
          events.push({ inicio: 0, duracion: manualMinOperando, categoria: "Operando", detalle: "Operación Manual" })
          currentMin += manualMinOperando
          if (manualMinPlanificadas > 0) {
            events.push({ inicio: currentMin, duracion: manualMinPlanificadas, categoria: "Parada Planificada", detalle: "Parada Planificada" })
            currentMin += manualMinPlanificadas
          }
          if (manualMinFallas > 0) {
            events.push({ inicio: currentMin, duracion: manualMinFallas, categoria: "Falla", detalle: "Parada por Falla" })
          }
        }
      } else {
        if (manualMinPlanificadas > 0) {
          events.push({ inicio: 0, duracion: manualMinPlanificadas, categoria: "Parada Planificada", detalle: "Parada Planificada" })
          currentMin += manualMinPlanificadas
        }
        if (manualMinFallas > 0) {
          events.push({ inicio: currentMin, duracion: manualMinFallas, categoria: "Falla", detalle: "Parada por Falla" })
        }
      }

      return {
        events,
        piezasBuenas: manualPiezasBuenas,
        piezasDefectuosas: manualPiezasDefectuosas,
        velocidadNominal: manualVelocidadNominal
      }
    }

    if (machines.length > 0) {
      const filtered = getFilteredMachines()
      if (filtered.length > 0) {
        return aggregateMachines(filtered)
      }
    }
    return ESCENARIOS[activeScenario]
  }

  const currentData = getCurrentData()

  // OEE Calculations
  const calculateOee = (data: OeeData) => {
    // 1. Time calculations
    let minOperando = 0
    let minFallas = 0
    let minPlanificadas = 0

    if (inputMode === "manual") {
      minOperando = manualMinOperando
      minFallas = manualMinFallas
      minPlanificadas = manualMinPlanificadas
    } else {
      data.events.forEach(e => {
        if (e.categoria === "Operando") minOperando += e.duracion
        else if (e.categoria === "Falla") minFallas += e.duracion
        else if (e.categoria === "Parada Planificada") minPlanificadas += e.duracion
      })
    }

    const tiempoTotal = minOperando + minFallas + minPlanificadas
    const tiempoProduccionPlanificado = tiempoTotal - minPlanificadas
    const tiempoOperacion = tiempoProduccionPlanificado - minFallas

    // 2. Availability (Disponibilidad)
    const disponibilidadVal = tiempoProduccionPlanificado > 0 
      ? (tiempoOperacion / tiempoProduccionPlanificado) * 100 
      : 0
    const disponibilidad = Math.min(100, Math.max(0, disponibilidadVal))

    // 3. Performance (Rendimiento)
    const piezasTotales = data.piezasBuenas + data.piezasDefectuosas
    const tiempoTeorico = data.velocidadNominal > 0 ? piezasTotales / data.velocidadNominal : 0
    const rendimientoVal = tiempoOperacion > 0 
      ? (tiempoTeorico / tiempoOperacion) * 100 
      : 0
    const rendimiento = Math.min(100, Math.max(0, rendimientoVal))

    // 4. Quality (Calidad)
    const calidadVal = piezasTotales > 0 
      ? (data.piezasBuenas / piezasTotales) * 100 
      : 0
    const calidad = Math.min(100, Math.max(0, calidadVal))

    // 5. OEE
    const oee = (disponibilidad / 100) * (rendimiento / 100) * (calidad / 100) * 100

    return {
      tiempoTotal,
      tiempoProduccionPlanificado,
      tiempoOperacion,
      minOperando,
      minFallas,
      minPlanificadas,
      piezasTotales,
      disponibilidad,
      rendimiento,
      calidad,
      oee
    }
  }

  const kpis = calculateOee(currentData)

  // Parser helper to parse Minuto column values (can be: start duration, start end, or single start time)
  const parseMinutoColumn = (str: string): { startDate: Date; duration: number; endDate: Date } => {
    const trimmed = str.trim()
    const parts = trimmed.split(/\s+/)
    
    let startStr = ""
    let val2Str = ""
    
    if (parts.length >= 3) {
      startStr = `${parts[0]} ${parts[1]}`
      val2Str = parts[2]
    } else if (parts.length === 2) {
      if (parts[0].includes("/") || parts[0].includes("-")) {
        startStr = `${parts[0]} ${parts[1]}`
        val2Str = ""
      } else {
        startStr = parts[0]
        val2Str = parts[1]
      }
    } else {
      startStr = parts[0] || ""
      val2Str = ""
    }

    // Prepend default date if needed
    let cleanStartStr = startStr
    if (!cleanStartStr.includes("/") && !cleanStartStr.includes("-")) {
      cleanStartStr = `12/06/2026 ${cleanStartStr}`
    }
    
    const startDate = parseDateTime(cleanStartStr)
    let duration = 1 // default

    if (val2Str) {
      if (/^\d+$/.test(val2Str)) {
        // Simple integer
        duration = parseInt(val2Str, 10)
      } else if (val2Str.includes(":")) {
        let cleanVal2Str = val2Str
        if (!cleanVal2Str.includes("/") && !cleanVal2Str.includes("-")) {
          const datePart = cleanStartStr.split(" ")[0]
          cleanVal2Str = `${datePart} ${cleanVal2Str}`
        }
        
        try {
          const potentialEndDate = parseDateTime(cleanVal2Str)
          if (potentialEndDate.getTime() > startDate.getTime()) {
            duration = (potentialEndDate.getTime() - startDate.getTime()) / 60000
          } else {
            const parts = val2Str.split(":").map(Number)
            if (parts.length === 3) {
              duration = parts[0] * 60 + parts[1] + parts[2] / 60
            } else if (parts.length === 2) {
              duration = parts[0] + parts[1] / 60
            }
          }
        } catch (e) {
          const parts = val2Str.split(":").map(Number)
          if (parts.length === 3) {
            duration = parts[0] * 60 + parts[1] + parts[2] / 60
          } else if (parts.length === 2) {
            duration = parts[0] + parts[1] / 60
          }
        }
      }
    }

    duration = Math.round(duration * 100) / 100
    const endDate = new Date(startDate.getTime() + duration * 60000)
    
    return { startDate, duration, endDate }
  }

  // Parser for Unified CSV — returns parsed data without setting state
  const parseUnifiedCSV = (text: string, fileName: string): MachineUpload => {
    const lines = text.split("\n")
    const parsedIntervals: {
      startDate: Date
      duration: number
      endDate: Date
      state: string
      produccion: number
      estado: string
      justificacion: string
      fabrica: string
      departamento: string
    }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith("#")) continue

      const parts = line.split(",").map(p => p.trim())
      
      // Skip header lines
      if (
        parts.length > 0 &&
        (parts[0].toLowerCase().includes("minuto") || 
         parts[0].toLowerCase().includes("operando") || 
         parts[0].toLowerCase().includes("producion") || 
         parts[0].toLowerCase().includes("produccion") || 
         parts[0].toLowerCase().includes("estado") || 
         parts[0].toLowerCase().includes("justificacion") ||
         parts[0].toLowerCase().includes("tipo") ||
         parts[0].toLowerCase().includes("velocidad") ||
         parts[0].toLowerCase().includes("fabrica") ||
         parts[0].toLowerCase().includes("departamento"))
      ) {
        continue
      }

      const minutoCol = parts[0]
      const stateCol = (parts[1] || "").toLowerCase()
      const produccionCol = parts[2] || ""
      const estadoCol = (parts[3] || "").toLowerCase()
      const justificacionCol = parts[4] || ""
      const fabricaCol = parts[5] || ""
      const departamentoCol = parts[6] || ""

      if (!minutoCol) continue

      let parsedMin
      try {
        parsedMin = parseMinutoColumn(minutoCol)
      } catch (err: any) {
        throw new Error(`Error en la línea ${i + 1} de tiempo: ${err.message}`)
      }

      const produccionVal = parseFloat(produccionCol)
      const parsedProduccion = isNaN(produccionVal) ? 0 : produccionVal

      parsedIntervals.push({
        startDate: parsedMin.startDate,
        duration: parsedMin.duration,
        endDate: parsedMin.endDate,
        state: stateCol,
        produccion: parsedProduccion,
        estado: estadoCol,
        justificacion: justificacionCol,
        fabrica: fabricaCol,
        departamento: departamentoCol
      })
    }

    if (parsedIntervals.length > 360) {
      throw new Error("El archivo excede el límite de 360 filas de registros.")
    }

    if (parsedIntervals.length === 0) {
      throw new Error("No se encontraron registros válidos en el archivo CSV.")
    }

    // Determine fabrica/departamento — most frequent non-empty value
    const getMostFrequent = (arr: string[]): string => {
      const filtered = arr.filter(v => v.length > 0)
      if (filtered.length === 0) return ""
      const freq: Record<string, number> = {}
      filtered.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
    }
    
    const fabrica = getMostFrequent(parsedIntervals.map(i => i.fabrica)) || "Sin Fábrica"
    const departamento = getMostFrequent(parsedIntervals.map(i => i.departamento)) || "Sin Departamento"

    // Sort intervals chronologically
    const sortedIntervals = parsedIntervals.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    const minDateTime = sortedIntervals[0].startDate.getTime()
    
    const events: MachineEvent[] = []
    let piezasBuenas = 0
    let piezasDefectuosas = 0
    
    let tracker = minDateTime

    for (const interval of sortedIntervals) {
      const startMs = interval.startDate.getTime()
      const endMs = interval.endDate.getTime()

      if (startMs > tracker) {
        const gapDurationMs = startMs - tracker
        const gapDurationMin = Math.round((gapDurationMs / 60000) * 100) / 100
        
        if (gapDurationMin > 0.01) {
          events.push({
            inicio: Math.round((tracker - minDateTime) / 60000 * 100) / 100,
            duracion: gapDurationMin,
            categoria: "Falla",
            detalle: "Parada Injustificada (Sin reporte)"
          })
        }
      }

      const relativeStart = Math.round((startMs - minDateTime) / 60000 * 100) / 100
      let categoria: "Operando" | "Falla" | "Parada Planificada" = "Operando"
      let detalle = interval.justificacion

      const isStopped = 
        interval.state === "0" || 
        interval.state.includes("detenido") || 
        interval.state.includes("parado") || 
        interval.state.includes("falla")

      if (isStopped) {
        if (!interval.justificacion) {
          categoria = "Falla"
          detalle = "Parada Injustificada"
        } else {
          const lowerJust = interval.justificacion.toLowerCase()
          const isFalla = 
            lowerJust.includes("atasco") ||
            lowerJust.includes("falla") ||
            lowerJust.includes("rotura") ||
            lowerJust.includes("averia") ||
            lowerJust.includes("error") ||
            lowerJust.includes("problema") ||
            lowerJust.includes("daño") ||
            lowerJust.includes("jam") ||
            lowerJust.includes("breakdown") ||
            lowerJust.includes("accidente")
          categoria = isFalla ? "Falla" : "Parada Planificada"
        }
      } else {
        categoria = "Operando"
        if (!detalle) detalle = "Operación Normal"
      }

      const velocidadReal = (interval.produccion > 0 && interval.duration > 0)
        ? Math.round((interval.produccion / interval.duration) * 100) / 100
        : undefined

      events.push({
        inicio: relativeStart,
        duracion: interval.duration,
        categoria,
        detalle,
        produccion: interval.produccion > 0 ? interval.produccion : undefined,
        estado: interval.estado || undefined,
        velocidad: velocidadReal
      })

      if (interval.estado.includes("buen")) {
        piezasBuenas += interval.produccion
      } else if (interval.estado.includes("mal")) {
        piezasDefectuosas += interval.produccion
      }

      tracker = Math.max(tracker, endMs)
    }

    const operatingRates = sortedIntervals
      .filter(iv => {
        const isOp = iv.state === "1" || iv.state.includes("operando") || iv.state.includes("running")
        return isOp && iv.produccion > 0 && iv.duration > 0
      })
      .map(iv => iv.produccion / iv.duration)
    
    const velocidadNominal = operatingRates.length > 0 ? Math.max(...operatingRates) : 2.5

    const machineName = fileName.replace(/\.csv$/i, "").replace(/[_-]/g, " ")

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName,
      machineName,
      fabrica,
      departamento,
      data: {
        events: events.sort((a, b) => a.inicio - b.inicio),
        piezasBuenas,
        piezasDefectuosas,
        velocidadNominal
      }
    }
  }

  // Process multiple files
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.name.endsWith(".csv") || f.type === "text/csv")
    if (fileArray.length === 0) {
      setCsvError("Los archivos deben tener formato .csv")
      return
    }

    const limit = user ? 10 : 3
    if (machines.length + fileArray.length > limit) {
      if (!user) {
        setCsvError(`La versión sin registro está limitada a 3 máquinas. Actualmente tienes ${machines.length} cargadas e intentas subir ${fileArray.length} más. Regístrate con Google para subir hasta 10 máquinas.`)
      } else {
        setCsvError(`Has alcanzado el límite máximo de 10 máquinas para la versión registrada. Actualmente tienes ${machines.length} cargadas e intentas subir ${fileArray.length} más.`)
      }
      return
    }

    let processed = 0
    const newMachines: MachineUpload[] = []
    let firstError: string | null = null

    fileArray.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        try {
          const machine = parseUnifiedCSV(text, file.name)
          newMachines.push(machine)
        } catch (e: any) {
          if (!firstError) firstError = `${file.name}: ${e.message}`
        }
        processed++
        if (processed === fileArray.length) {
          if (newMachines.length > 0) {
            setMachines(prev => [...prev, ...newMachines])
            setInputMode("csv")
            setCsvSuccess(true)
            setCsvError(firstError)
            setTimeout(() => setCsvSuccess(false), 3000)
          } else {
            setCsvError(firstError || "No se pudieron procesar los archivos.")
          }
        }
      }
      reader.readAsText(file)
    })
  }

  // File Uploader triggers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFiles(files)
    e.target.value = "" // reset to allow re-upload of same file
  }

  // Remove a machine
  const removeMachine = (id: string) => {
    setMachines(prev => prev.filter(m => m.id !== id))
    if (viewScope === "machine" && selectedFilter === id) {
      setViewScope("all")
      setSelectedFilter("")
    }
  }

  // Update a machine's design speed (velocidadNominal)
  const updateMachineSpeed = (id: string, speed: number) => {
    setMachines(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          data: {
            ...m.data,
            velocidadNominal: speed
          }
        }
      }
      return m
    }))
  }

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    processFiles(files)
  }

  // Download Unified CSV Template
  const downloadCsvTemplate = () => {
    const template = `# minuto, operando, produccion, estado, justificacion, fabrica, departamento
12/06/2026 13:00 5:00, 1, 5, bueno, , Planta Norte, Ensamblaje
12/06/2026 14:02 14:08, 0, , , se atasco la maquina, Planta Norte, Ensamblaje
12/06/2026 16:00, 1, 2, malo, , Planta Norte, Ensamblaje
`
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "plantilla_oee_mmtechhouse.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download CSV representing a scenario example
  const downloadScenarioCsv = (key: string) => {
    let template = ""
    if (key === "clase_mundial") {
      template = `# minuto, operando, produccion, estado, justificacion, fabrica, departamento
12/06/2026 08:00 180, 1, 600, bueno, Producción Lote A - Normal, Planta Central, Línea 1
12/06/2026 11:00 15, 0, , , Cambio de turno e inspección rápida, Planta Central, Línea 1
12/06/2026 11:15 120, 1, 520, bueno, Producción Lote A - Reanudación, Planta Central, Línea 1
12/06/2026 13:15 10, 0, , , Reajuste menor en alimentador, Planta Central, Línea 1
12/06/2026 13:25 155, 1, 8, malo, Producción Lote B, Planta Central, Línea 1
`
    } else if (key === "microparadas") {
      template = `# minuto, operando, produccion, estado, justificacion, fabrica, departamento
12/06/2026 08:00 60, 1, 100, bueno, Arranque de turno lento, Planta Central, Línea 2
12/06/2026 09:00 15, 0, , , Atasco menor de material, Planta Central, Línea 2
12/06/2026 09:15 90, 1, 250, bueno, Operación inestable, Planta Central, Línea 2
12/06/2026 10:45 20, 0, , , Ajuste de guías laterales, Planta Central, Línea 2
12/06/2026 11:05 30, 0, , , Mantenimiento autónomo programado, Planta Central, Línea 2
12/06/2026 11:35 100, 1, 230, bueno, Producción baja velocidad, Planta Central, Línea 2
12/06/2026 13:15 25, 0, , , Fallo de sensor óptico, Planta Central, Línea 2
12/06/2026 13:40 140, 1, 200, bueno, Cierre de turno, Planta Central, Línea 2
12/06/2026 13:40 140, 1, 15, malo, Descarte de cierre, Planta Central, Línea 2
`
    } else if (key === "falla_mayor") {
      template = `# minuto, operando, produccion, estado, justificacion, fabrica, departamento
12/06/2026 08:00 120, 1, 250, bueno, Producción estable inicial, Planta Sur, Motores
12/06/2026 10:00 210, 0, , , Rotura de correa y sobrecalentamiento motor, Planta Sur, Motores
12/06/2026 13:30 15, 0, , , Prueba y puesta a punto de seguridad, Planta Sur, Motores
12/06/2026 13:45 135, 1, 210, bueno, Producción recuperada, Planta Sur, Motores
12/06/2026 13:45 135, 1, 5, malo, Descarte reanudacion, Planta Sur, Motores
`
    } else if (key === "defecto_calidad") {
      template = `# minuto, operando, produccion, estado, justificacion, fabrica, departamento
12/06/2026 08:00 240, 1, 350, bueno, Producción Lote X - Materia prima defectuosa, Planta Central, Empaque
12/06/2026 08:00 240, 1, 310, malo, Merma por materia prima defectuosa, Planta Central, Empaque
12/06/2026 12:00 20, 0, , , Cambio de bobina de empaque, Planta Central, Empaque
12/06/2026 12:20 220, 1, 370, bueno, Producción Lote Y, Planta Central, Empaque
`
    }
    
    if (!template) return
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `ejemplo_oee_${key}_mmtechhouse.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get OEE category and color scheme
  const getOeeCategory = (oee: number) => {
    if (oee >= 85) return { label: "Clase Mundial", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/20" }
    if (oee >= 65) return { label: "Aceptable / Alerta", color: "text-[#eab308]", bg: "bg-[#eab308]/10", border: "border-[#eab308]/20" }
    return { label: "Crítico", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/20" }
  }

  const category = getOeeCategory(kpis.oee)

  // SVG parameters for Gauge: 270 degrees arc from 135 to 45
  // Radius = 75, Center = (100, 110)
  const r = 75
  const circ = 2 * Math.PI * r // ~471.24
  const arcLength = 0.75 * circ // ~353.43 (270 degrees)
  const dashOffset = arcLength - (kpis.oee / 100) * arcLength

  // Needle angle: from -135deg (0%) to +135deg (100%)
  const needleAngle = -135 + 2.7 * kpis.oee

  // Synchronization of manual states if scenario clicked
  const loadScenarioToSliders = (scenKey: string) => {
    const scen = ESCENARIOS[scenKey]
    if (!scen) return

    let minOp = 0
    let minFa = 0
    let minPl = 0
    scen.events.forEach(e => {
      if (e.categoria === "Operando") minOp += e.duracion
      else if (e.categoria === "Falla") minFa += e.duracion
      else if (e.categoria === "Parada Planificada") minPl += e.duracion
    })

    setManualMinOperando(minOp)
    setManualMinFallas(minFa)
    setManualMinPlanificadas(minPl)
    setManualPiezasBuenas(scen.piezasBuenas)
    setManualPiezasDefectuosas(scen.piezasDefectuosas)
    setManualVelocidadNominal(scen.velocidadNominal)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#457bb3] selection:text-white pb-12">
      {/* Toast Error Notification */}
      <AnimatePresence>
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.08)] rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Info className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-tight">Inicio de Sesión</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">{loginError}</p>
              </div>
              <button
                type="button"
                onClick={() => setLoginError(null)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-32 pb-14 bg-gradient-to-b from-[#264164]/10 via-slate-50 to-slate-50 border-b border-slate-200/40">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-tr from-[#264164]/5 to-[#457bb3]/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#264164]/5 text-[#264164] border border-[#264164]/10">
            <Activity className="w-3.5 h-3.5 animate-pulse text-[#457bb3]" /> Herramienta de Ingeniería Industrial
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Dashboard & Medidor de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#264164] via-[#457bb3] to-[#acd64a]">OEE</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-sm md:text-base leading-relaxed">
            Monitorea la eficiencia productiva de tu maquinaria en tiempo real. Carga reportes CSV de paradas o ajusta los parámetros manualmente para evaluar el OEE de Clase Mundial (World Class).
          </p>
        </div>
      </section>

      {/* Main Grid Layout */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-8 grid lg:grid-cols-12 gap-8 relative z-10">
        {/* Top Status Alert */}
        <div className="lg:col-span-12">
          {machines.length > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-800 text-xs font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>¡Estás viendo tus propios datos! {machines.length} máquina{machines.length > 1 ? "s" : ""} cargada{machines.length > 1 ? "s" : ""}.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMachines([])
                  setViewScope("all")
                  setSelectedFilter("")
                  setActiveScenario("clase_mundial")
                  setInputMode("csv")
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer font-extrabold text-[11px] shrink-0"
              >
                Restablecer a Datos Demo
              </button>
            </div>
          ) : inputMode === "manual" ? (
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-800 text-xs font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Modo de simulación manual activo. Modifica los controles deslizantes a la izquierda para ver los cálculos.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputMode("csv")
                  setTimeout(() => {
                    document.getElementById("config-panel")?.scrollIntoView({ behavior: "smooth" })
                  }, 50)
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer font-extrabold text-[11px] shrink-0"
              >
                Volver a Carga de CSV
              </button>
            </div>
          ) : (
            <div className="bg-[#264164]/5 border border-[#264164]/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#264164] text-xs font-bold shadow-sm">
              <div className="flex items-start sm:items-center gap-2">
                <Info className="w-5 h-5 text-[#457bb3] shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong className="font-extrabold">Visualización de Demostración:</strong> Estás viendo datos pre-cargados ("{ESCENARIOS[activeScenario].nombre}"). Sube tu propio archivo en la pestaña <strong>"Subir CSV"</strong> de la izquierda.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputMode("csv")
                  setTimeout(() => {
                    document.getElementById("config-panel")?.scrollIntoView({ behavior: "smooth" })
                  }, 50)
                }}
                className="px-3 py-1.5 bg-[#264164] hover:bg-[#1f3552] text-white rounded-xl transition-all cursor-pointer font-extrabold text-[11px] shrink-0"
              >
                Subir mi CSV
              </button>
            </div>
          )}
        </div>
        
        {/* LEFT COLUMN: OEE Gauge & Data Input (5 cols on large screens) */}
        <div className="lg:col-span-5 space-y-8">

          {/* Auth Card: Google Session Info & Actions */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-5 flex items-center justify-between gap-4">
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-1.5 w-full justify-center">
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#457bb3] rounded-full animate-spin" />
                Cargando sesión...
              </div>
            ) : user ? (
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Avatar"}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-100 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#457bb3]/10 text-[#457bb3] flex items-center justify-center font-bold text-xs shrink-0">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0 leading-tight">
                    <span className="text-[11px] font-extrabold text-slate-800 block truncate">
                      {user.displayName || user.email}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      ✓ Plan Registrado (Límite: 10 Máquinas)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined" && (window as any).gtag_report_conversion) {
                          (window as any).gtag_report_conversion();
                        }
                        setIsContactModalOpen(true);
                      }}
                      className="text-[9px] font-bold text-[#457bb3] hover:text-[#264164] hover:underline flex items-center gap-0.5 mt-1 cursor-pointer"
                    >
                      ¿Necesitas más? Contáctanos (SOS)
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-650 hover:text-red-600 rounded-xl transition-all cursor-pointer font-extrabold text-[10px] shrink-0 border border-slate-200/40 hover:border-red-150 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Salir
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold text-slate-800 block">
                    Modo Invitado (Límite: 3 Máquinas)
                  </span>
                  <p className="text-[9px] text-slate-400 leading-snug">
                    Regístrate gratis con Google para subir hasta 10 máquinas y guardar tus análisis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Registrarse con Google</span>
                </button>
              </div>
            )}
          </div>
          
          {/* 1. Medidor Circular SVG (Gauge) */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 flex flex-col items-center relative overflow-hidden group">
            {/* Soft decorative background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#acd64a]/5 to-transparent rounded-bl-full pointer-events-none" />
            
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight self-start mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#acd64a] animate-ping" />
              Eficiencia General de Equipos (OEE)
            </h2>
            <p className="text-[11px] text-slate-400 self-start mb-6">Tacómetro circular interactivo con aguja de desviación</p>

            {/* Gauge Graphic */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg width="220" height="220" viewBox="0 0 200 200" className="overflow-visible select-none">
                <defs>
                  {/* Drop shadow for pointer and ring */}
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#264164" floodOpacity="0.12" />
                  </filter>

                  {/* Mask for full track background */}
                  <mask id="trackMask">
                    <circle
                      cx="100"
                      cy="110"
                      r="75"
                      fill="none"
                      stroke="white"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${arcLength} ${circ}`}
                      transform="rotate(135 100 110)"
                    />
                  </mask>

                  {/* Mask for filled progress track */}
                  <mask id="activeMask">
                    <motion.circle
                      cx="100"
                      cy="110"
                      r="75"
                      fill="none"
                      stroke="white"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${arcLength} ${circ}`}
                      initial={{ strokeDashoffset: arcLength }}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      transform="rotate(135 100 110)"
                    />
                  </mask>
                </defs>

                {/* Outer decorative rim */}
                <circle cx="100" cy="110" r="86" fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                {/* Base background Track (Lightly dimmed conic gradient) */}
                <g mask="url(#trackMask)" opacity="0.12">
                  <foreignObject x="0" y="0" width="200" height="200">
                    <div 
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "conic-gradient(from 225deg at 100px 110px, #ef4444 0deg, #eab308 135deg, #22c55e 270deg, transparent 270deg)",
                        borderRadius: "50%"
                      }} 
                    />
                  </foreignObject>
                </g>

                {/* Filled active Progress track */}
                <g mask="url(#activeMask)" filter="url(#shadow)">
                  <foreignObject x="0" y="0" width="200" height="200">
                    <div 
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "conic-gradient(from 225deg at 100px 110px, #ef4444 0deg, #eab308 135deg, #22c55e 270deg, transparent 270deg)",
                        borderRadius: "50%"
                      }} 
                    />
                  </foreignObject>
                </g>

                {/* Scale ticks around the arc */}
                <g stroke="#cbd5e1" strokeWidth="1.5" fill="none">
                  {/* Draw small indicator notches */}
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => {
                    const angle = 135 + val * 2.7
                    const angleRad = (angle * Math.PI) / 180
                    const x1 = (100 + 82 * Math.cos(angleRad)).toFixed(2)
                    const y1 = (110 + 82 * Math.sin(angleRad)).toFixed(2)
                    const x2 = (100 + 88 * Math.cos(angleRad)).toFixed(2)
                    const y2 = (110 + 88 * Math.sin(angleRad)).toFixed(2)
                    return <line key={val} x1={x1} y1={y1} x2={x2} y2={y2} stroke={val % 20 === 0 ? "#94a3b8" : "#cbd5e1"} strokeWidth={val % 20 === 0 ? "2" : "1"} />
                  })}
                </g>

                {/* Pointer Needle */}
                <g 
                  style={{ 
                    transform: `rotate(${needleAngle}deg)`,
                    transformOrigin: "100px 110px",
                    transformBox: "view-box",
                    transition: "transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                >
                  {/* Sleek needle shape pointing from center pivot */}
                  <polygon points="96,110 100,28 104,110" fill="#264164" filter="url(#shadow)" />
                  {/* Center glowing node */}
                  <circle cx="100" cy="110" r="10" fill="#264164" />
                  <circle cx="100" cy="110" r="5" fill="#acd64a" className="animate-pulse" />
                </g>
              </svg>

              {/* Text Inside Center of Gauge (placed below the pivot to prevent overlap) */}
              <div className="absolute top-[138px] left-0 right-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                  {kpis.oee.toFixed(1)}%
                </span>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider mt-1.5 px-2.5 py-0.5 rounded-full ${category.bg} ${category.color} ${category.border} border`}>
                  {category.label}
                </span>
              </div>
            </div>

            {/* Availability / Performance / Quality rings summaries */}
            <div className="grid grid-cols-3 gap-2 w-full mt-2 pt-4 border-t border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">DISPONIBILIDAD</span>
                <span className="text-xs font-black text-slate-800">{kpis.disponibilidad.toFixed(1)}%</span>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-red-400" style={{ width: `${kpis.disponibilidad}%` }} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">RENDIMIENTO</span>
                <span className="text-xs font-black text-slate-800">{kpis.rendimiento.toFixed(1)}%</span>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${kpis.rendimiento}%` }} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">CALIDAD</span>
                <span className="text-xs font-black text-slate-800">{kpis.calidad.toFixed(1)}%</span>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${kpis.calidad}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Carga de Datos & Configuración */}
          <div id="config-panel" className="scroll-mt-24 bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#457bb3]" />
                Panel de Configuración
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 text-[10px] font-bold w-full sm:w-auto justify-between">
                <button
                  type="button"
                  onClick={() => setInputMode("csv")}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${inputMode === "csv" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Upload className="w-3 h-3" /> Subir CSV
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("scenario")}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${inputMode === "scenario" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Database className="w-3 h-3" /> Ejemplos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("manual")
                    loadScenarioToSliders(activeScenario)
                  }}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${inputMode === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Sliders className="w-3 h-3" /> Manual
                </button>
              </div>
            </div>

            {/* CASE 1: Carga CSV */}
            {inputMode === "csv" ? (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed">
                  Carga tus datos reales subiendo un archivo CSV unificado de producción y eventos por máquina (máx. 360 filas por archivo). Límite actual: {user ? "10 máquinas" : "3 máquinas"}.
                </p>

                {/* Unified CSV Upload zone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Archivos de Datos OEE (CSV)
                    </label>
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="text-[9px] text-[#457bb3] hover:text-[#264164] hover:underline font-bold flex items-center gap-0.5 cursor-pointer font-extrabold"
                    >
                      <Download className="w-3 h-3" /> Descargar Plantilla
                    </button>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${isDragOver ? "border-[#457bb3] bg-[#457bb3]/5" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"}`}
                  >
                    <input
                      type="file"
                      id="csvFileInput"
                      accept=".csv"
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Cargar Archivos CSV (1 por máquina)</p>
                    {machines.length > 0 ? (
                      <span className="mt-2 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {machines.length} máquina{machines.length > 1 ? "s" : ""} cargada{machines.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">Arrastra tus archivos .csv o haz clic aquí</p>
                    )}
                  </div>
                </div>

                {/* CSV Error / Success messages */}
                {csvError && (
                  <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-xl p-2.5 font-bold flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {csvError}
                  </div>
                )}

                {/* Loaded Machines List */}
                {machines.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Factory className="w-3 h-3 text-[#457bb3]" />
                      Máquinas Cargadas ({machines.length})
                    </label>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {machines.map(m => (
                        <div key={m.id} className={`flex flex-col gap-1.5 p-2.5 rounded-xl border text-[10px] transition-all ${viewScope === "machine" && selectedFilter === m.id ? "border-[#264164] bg-[#264164]/5" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setViewScope("machine")
                                setSelectedFilter(m.id)
                              }}
                              className="flex-1 text-left cursor-pointer"
                            >
                              <span className="font-extrabold text-slate-800 block">{m.machineName}</span>
                              <span className="text-slate-400">{m.fabrica} · {m.departamento}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMachine(m.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                              title="Eliminar máquina"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100/60">
                            <label className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                              <Settings className="w-2.5 h-2.5 text-[#457bb3]" /> Vel. Diseño:
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0.01"
                                step="0.1"
                                value={m.data.velocidadNominal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (!isNaN(val) && val > 0) {
                                    updateMachineSpeed(m.id, val)
                                  }
                                }}
                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#457bb3]/30 focus:border-[#457bb3] transition-all"
                              />
                              <span className="text-[9px] font-semibold text-slate-400">pz/min</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Scope Filter */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3 text-[#457bb3]" />
                        Vista / Agrupación
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setViewScope("all"); setSelectedFilter("") }}
                          className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${viewScope === "all" ? "border-[#264164] bg-[#264164]/5 text-[#264164]" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}
                        >
                          🏭 Todas
                        </button>
                        {fabricas.length > 1 && fabricas.map(f => (
                          <button
                            key={`fab-${f}`}
                            type="button"
                            onClick={() => { setViewScope("fabrica"); setSelectedFilter(f) }}
                            className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer truncate ${viewScope === "fabrica" && selectedFilter === f ? "border-[#264164] bg-[#264164]/5 text-[#264164]" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}
                          >
                            🏢 {f}
                          </button>
                        ))}
                        {departamentos.length > 1 && departamentos.map(d => (
                          <button
                            key={`dep-${d}`}
                            type="button"
                            onClick={() => { setViewScope("departamento"); setSelectedFilter(d) }}
                            className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer truncate ${viewScope === "departamento" && selectedFilter === d ? "border-[#264164] bg-[#264164]/5 text-[#264164]" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}
                          >
                            🏗️ {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expected CSV Format Preview */}
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 space-y-3 mt-4">
                  <h4 className="text-[11px] font-extrabold text-[#264164] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#457bb3]" /> Formato de Archivo Requerido
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Archivo CSV Unificado
                      </span>
                      <div className="text-[10px] text-slate-600 bg-white border border-slate-100 rounded-xl p-3 font-mono leading-relaxed overflow-x-auto shadow-sm">
                        <span className="text-[#264164] font-bold"># Columnas de Producción y Eventos</span>
                        <div className="pl-3 text-slate-500 font-semibold">minuto, operando, produccion, estado, justificacion, fabrica, departamento</div>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-slate-500 font-bold block mb-1"># Ejemplos de Formato en el Archivo:</span>
                          <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-1 font-mono text-[9px] leading-relaxed">
                          <div className="text-slate-400 font-sans italic mb-1"># minuto, operando, produccion, estado, justificacion, fabrica, departamento</div>
                            <div><strong className="text-slate-700"># 1. Inicio y Duración:</strong> 12/06/2026 13:00 5:00, 1, 5, bueno, , Planta Norte, Ensamblaje</div>
                            <div><strong className="text-slate-700"># 2. Inicio y Fin:</strong> 12/06/2026 14:02 14:08, 0, , , se atasco, Planta Norte, Ensamblaje</div>
                            <div><strong className="text-slate-700"># 3. Tiempo Puntual:</strong> 12/06/2026 16:00, 1, 2, malo, , Planta Norte, Ensamblaje</div>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-2 leading-relaxed">
                            💡 Los minutos no reportados en el archivo se calcularán automáticamente como paradas injustificadas (Fallas).
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : inputMode === "scenario" ? (
              // CASE 2: Escenarios rápidos
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed">
                  Haz clic en un escenario para cargar datos predefinidos de demostración y explorar el tacómetro y KPIs.
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Líneas de Producción de Ejemplo</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(ESCENARIOS).map((key) => {
                      const active = activeScenario === key && machines.length === 0
                      return (
                        <div key={key} className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveScenario(key)
                              setMachines([])
                            }}
                            className={`flex-1 p-3 rounded-2xl border text-left transition-all text-xs cursor-pointer flex flex-col justify-center h-16 ${active ? "border-[#264164] bg-[#264164]/5 shadow-sm text-slate-900" : "border-slate-200 hover:border-slate-350 bg-white text-slate-500"}`}
                          >
                            <span className="font-extrabold block text-slate-800">{ESCENARIOS[key].nombre}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">{ESCENARIOS[key].descripcion}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadScenarioCsv(key)
                            }}
                            title="Descargar este ejemplo en CSV"
                            className="p-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-2xl transition-all h-16 flex items-center justify-center shrink-0 cursor-pointer w-12"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // CASE 3: Manual Sliders
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed">
                  Ajusta los tiempos del turno de trabajo y las piezas producidas manualmente para simular el OEE.
                </p>

                {/* 1. Time distribution sliders */}
                <div className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Distribución del Tiempo del Turno</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Operando:</span>
                      <span className="text-[#22c55e]">{manualMinOperando} min</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="720"
                      value={manualMinOperando}
                      onChange={(e) => setManualMinOperando(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Fallas:</span>
                      <span className="text-[#ef4444]">{manualMinFallas} min</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="240"
                      value={manualMinFallas}
                      onChange={(e) => setManualMinFallas(parseInt(e.target.value))}
                      className="w-full accent-red-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Parada Planificada:</span>
                      <span className="text-slate-500">{manualMinPlanificadas} min</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={manualMinPlanificadas}
                      onChange={(e) => setManualMinPlanificadas(parseInt(e.target.value))}
                      className="w-full accent-slate-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Production stats sliders */}
                <div className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Cantidades de Producción</span>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Piezas Buenas:</span>
                      <span className="text-slate-900 font-extrabold">{manualPiezasBuenas} u</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      value={manualPiezasBuenas}
                      onChange={(e) => setManualPiezasBuenas(parseInt(e.target.value))}
                      className="w-full accent-[#264164] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Piezas Defectuosas:</span>
                      <span className="text-red-600">{manualPiezasDefectuosas} u</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={manualPiezasDefectuosas}
                      onChange={(e) => setManualPiezasDefectuosas(parseInt(e.target.value))}
                      className="w-full accent-[#ef4444] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Velocidad de Diseño (Ideal):</span>
                      <span className="text-slate-900">{manualVelocidadNominal.toFixed(1)} pz/min</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={manualVelocidadNominal * 10}
                      onChange={(e) => setManualVelocidadNominal(parseInt(e.target.value) / 10)}
                      className="w-full accent-[#457bb3] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reset button to default scenario values */}
                <button
                  type="button"
                  onClick={() => {
                    setMachines([])
                    loadScenarioToSliders(activeScenario)
                  }}
                  className="w-full py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar Valores de Escenario
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Stop Timeline & Logs Table (7 cols on large screens) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Timeline Chart (Grafica de paradas) */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 space-y-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#457bb3]" />
                Línea de Tiempo de Estados de Máquina
              </h2>
              <p className="text-[11px] text-slate-400">Distribución de estados a lo largo del turno ({kpis.tiempoTotal} minutos totales)</p>
            </div>

            {/* Timeline Segment Bar */}
            <div className="space-y-4">
              <div className="relative">
                {/* Visual bar — overflow-hidden for rounded clip */}
                <div className="w-full h-8 rounded-xl bg-slate-100 flex overflow-hidden border border-slate-200/50 shadow-inner">
                  {currentData.events.map((e, index) => {
                    const percentWidth = kpis.tiempoTotal > 0 ? (e.duracion / kpis.tiempoTotal) * 100 : 0
                    let catColor = "bg-slate-400"
                    if (e.categoria === "Operando") catColor = "bg-[#22c55e]"
                    else if (e.categoria === "Falla") catColor = "bg-[#ef4444]"
                    else if (e.categoria === "Parada Planificada") catColor = "bg-[#94a3b8]"
                    return (
                      <div
                        key={index}
                        style={{ width: `${percentWidth}%` }}
                        className={`h-full ${catColor} border-r border-white/20 last:border-0`}
                      />
                    )
                  })}
                </div>

                {/* Hover overlay — NOT clipped, renders tooltips above */}
                <div className="absolute inset-0 flex">
                  {currentData.events.map((e, index) => {
                    const percentWidth = kpis.tiempoTotal > 0 ? (e.duracion / kpis.tiempoTotal) * 100 : 0
                    let catColor = "bg-slate-400"
                    if (e.categoria === "Operando") catColor = "bg-[#22c55e]"
                    else if (e.categoria === "Falla") catColor = "bg-[#ef4444]"
                    else if (e.categoria === "Parada Planificada") catColor = "bg-[#94a3b8]"
                    return (
                      <div
                        key={index}
                        style={{ width: `${percentWidth}%` }}
                        className="h-full relative group cursor-help hover:bg-black/5 transition-all"
                      >
                        {/* Interactive Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-slate-900/95 text-white text-[10px] rounded-xl p-3.5 shadow-xl w-56 backdrop-blur-sm pointer-events-none leading-normal">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${catColor} ring-2 ring-white/20`} />
                            <span className="font-extrabold text-[11px]">{e.categoria}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-300"><span className="font-bold text-white">Minuto:</span> {e.inicio} → {Math.round((e.inicio + e.duracion) * 100) / 100}</p>
                            <p className="text-slate-300"><span className="font-bold text-white">Duración:</span> {e.duracion} min</p>
                            {e.produccion !== undefined && e.produccion > 0 && (
                              <p className="text-slate-300"><span className="font-bold text-white">Producción:</span> {e.produccion} piezas</p>
                            )}
                            {e.estado && (
                              <p className="text-slate-300">
                                <span className="font-bold text-white">Calidad:</span>{" "}
                                <span className={e.estado.includes("buen") ? "text-emerald-400 font-bold" : e.estado.includes("mal") ? "text-red-400 font-bold" : ""}>
                                  {e.estado.includes("buen") ? "✓ Bueno" : e.estado.includes("mal") ? "✗ Malo" : e.estado}
                                </span>
                              </p>
                            )}
                            {e.velocidad !== undefined && e.velocidad > 0 && (
                              <p className="text-slate-300"><span className="font-bold text-white">Velocidad:</span> {e.velocidad.toFixed(2)} pz/min</p>
                            )}
                          </div>
                          {e.detalle && (
                            <p className="text-slate-400 mt-2 italic border-t border-slate-700/60 pt-2 text-[9px] leading-snug">"{e.detalle}"</p>
                          )}
                          {/* Triangle decorator */}
                          <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-[5px]" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Legend row */}
              <div className="flex flex-wrap items-center justify-start gap-4 text-xs font-bold text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#22c55e] inline-block" />
                  <span>Operando ({kpis.minOperando}m / {((kpis.minOperando/kpis.tiempoTotal)*100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#ef4444] inline-block" />
                  <span>Fallas / Parada No Planificada ({kpis.minFallas}m / {((kpis.minFallas/kpis.tiempoTotal)*100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#94a3b8] inline-block" />
                  <span>Parada Planificada ({kpis.minPlanificadas}m / {((kpis.minPlanificadas/kpis.tiempoTotal)*100).toFixed(0)}%)</span>
                </div>
              </div>

              {/* Stacked individual timelines for each machine */}
              {machines.length > 1 && inputMode === "csv" && (
                <div className="pt-5 border-t border-slate-100 space-y-4">
                  <h3 className="text-xs font-extrabold text-[#264164] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#457bb3]" />
                    Líneas de Tiempo por Máquina ({machines.length})
                  </h3>
                  <div className="space-y-3.5">
                    {machines.map(m => {
                      const mEvents = m.data.events
                      const mTotalTime = mEvents.reduce((s, e) => s + e.duracion, 0)
                      
                      return (
                        <div key={m.id} className="space-y-1.5 bg-slate-50/40 p-3 rounded-2xl border border-slate-150/60 hover:border-slate-200 hover:bg-slate-50 transition-all">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-800 text-xs">{m.machineName}</span>
                              <span className="text-[9px] font-bold text-slate-400">({m.fabrica} · {m.departamento})</span>
                            </div>
                            <span className="text-slate-400 font-extrabold">{mTotalTime} min totales</span>
                          </div>
                          <div className="relative">
                            {/* Visual bar */}
                            <div className="w-full h-5 rounded-lg bg-slate-200/50 flex overflow-hidden border border-slate-200/30 shadow-inner">
                              {mEvents.map((e, index) => {
                                const percentWidth = mTotalTime > 0 ? (e.duracion / mTotalTime) * 100 : 0
                                let catColor = "bg-slate-400"
                                if (e.categoria === "Operando") catColor = "bg-[#22c55e]"
                                else if (e.categoria === "Falla") catColor = "bg-[#ef4444]"
                                else if (e.categoria === "Parada Planificada") catColor = "bg-[#94a3b8]"
                                return (
                                  <div
                                    key={index}
                                    style={{ width: `${percentWidth}%` }}
                                    className={`h-full ${catColor} border-r border-white/20 last:border-0`}
                                  />
                                )
                              })}
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 flex">
                              {mEvents.map((e, index) => {
                                const percentWidth = mTotalTime > 0 ? (e.duracion / mTotalTime) * 100 : 0
                                let catColor = "bg-slate-400"
                                if (e.categoria === "Operando") catColor = "bg-[#22c55e]"
                                else if (e.categoria === "Falla") catColor = "bg-[#ef4444]"
                                else if (e.categoria === "Parada Planificada") catColor = "bg-[#94a3b8]"
                                return (
                                  <div
                                    key={index}
                                    style={{ width: `${percentWidth}%` }}
                                    className="h-full relative group cursor-help hover:bg-black/5 transition-all"
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block z-50 bg-slate-900/95 text-white text-[10px] rounded-xl p-3 w-56 backdrop-blur-sm pointer-events-none leading-normal">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className={`w-2.5 h-2.5 rounded-full ${catColor} ring-2 ring-white/20`} />
                                        <span className="font-extrabold text-[11px]">{e.categoria}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-slate-300"><span className="font-bold text-white">Minuto:</span> {e.inicio} → {Math.round((e.inicio + e.duracion) * 100) / 100}</p>
                                        <p className="text-slate-300"><span className="font-bold text-white">Duración:</span> {e.duracion} min</p>
                                        {e.produccion !== undefined && e.produccion > 0 && (
                                          <p className="text-slate-300"><span className="font-bold text-white">Producción:</span> {e.produccion} piezas</p>
                                        )}
                                        {e.estado && (
                                          <p className="text-slate-300">
                                            <span className="font-bold text-white">Calidad:</span>{" "}
                                            <span className={e.estado.includes("buen") ? "text-emerald-400 font-bold" : e.estado.includes("mal") ? "text-red-400 font-bold" : ""}>
                                              {e.estado.includes("buen") ? "✓ Bueno" : e.estado.includes("mal") ? "✗ Malo" : e.estado}
                                            </span>
                                          </p>
                                        )}
                                        {e.velocidad !== undefined && e.velocidad > 0 && (
                                          <p className="text-slate-300"><span className="font-bold text-white">Velocidad:</span> {e.velocidad.toFixed(2)} pz/min</p>
                                        )}
                                      </div>
                                      {e.detalle && (
                                        <p className="text-slate-400 mt-1.5 italic border-t border-slate-700/60 pt-1.5 text-[9px] leading-snug">"{e.detalle}"</p>
                                      )}
                                      <div className="w-2 h-2 bg-slate-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-[4px]" />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Event Log List Table */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#457bb3]" />
                Bitácora Detallada de Sucesos
              </h3>
              <p className="text-[11px] text-slate-400">Listado de eventos de producción cargados en la línea temporal</p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-2xl max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold">
                    <th className="py-2.5 px-4">Minuto de Inicio</th>
                    <th className="py-2.5 px-4">Duración</th>
                    <th className="py-2.5 px-4">Estado</th>
                    <th className="py-2.5 px-4">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.events.map((e, index) => {
                    let badgeColor = "bg-slate-50 text-slate-600 border-slate-100"
                    if (e.categoria === "Operando") badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100"
                    else if (e.categoria === "Falla") badgeColor = "bg-red-50 text-red-600 border-red-100"
                    else if (e.categoria === "Parada Planificada") badgeColor = "bg-slate-50 text-slate-500 border-slate-200"

                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-700">Min {e.inicio}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-semibold">{e.duracion} minutos</td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${badgeColor}`}>
                            {e.categoria}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 italic font-medium">{e.detalle || "-"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Grid of Production metrics & Quality Pie Chart (12 cols) */}
        <div className="lg:col-span-12 grid md:grid-cols-3 gap-8">
          
          {/* A. Quality Donut Chart */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Métrica de Calidad de Piezas
              </h3>
              <p className="text-[11px] text-slate-400">Total piezas conformes vs. descarte defectuoso</p>
            </div>

            <div className="flex items-center justify-around py-4">
              {/* Donut Chart SVG */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg width="112" height="112" viewBox="0 0 36 36" className="transform -rotate-90">
                  {/* Gray background ring */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.2" />
                  
                  {/* Defective pieces ring segment */}
                  {kpis.piezasTotales > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.2"
                      strokeDasharray="100 100"
                      strokeDashoffset="0"
                    />
                  )}

                  {/* Good pieces ring segment */}
                  {kpis.piezasTotales > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3.2"
                      strokeDasharray={`${kpis.calidad} ${100 - kpis.calidad}`}
                      strokeDashoffset="0"
                    />
                  )}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900 tracking-tight leading-none">{kpis.calidad.toFixed(1)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">Calidad</span>
                </div>
              </div>

              {/* Metric stats */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Piezas Buenas</span>
                  <span className="text-slate-800 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> {currentData.piezasBuenas.toLocaleString()} u
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Descarte (Rechazo)</span>
                  <span className="text-red-600 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> {currentData.piezasDefectuosas.toLocaleString()} u
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-bold flex justify-between">
              <span>Total Producido:</span>
              <span className="text-slate-700">{kpis.piezasTotales.toLocaleString()} unidades</span>
            </div>
          </div>

          {/* B. Availability & Time Loss KPI */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Métrica de Disponibilidad & Tiempos
              </h3>
              <p className="text-[11px] text-slate-400">Estructura del tiempo útil y pérdidas por fallas</p>
            </div>

            <div className="space-y-3.5 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">TIEMPO OPERANDO</span>
                  <span className="text-sm font-extrabold text-slate-800">{kpis.minOperando} minutos</span>
                </div>
                <span className="text-xs font-black text-slate-650 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                  Disp: {kpis.disponibilidad.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar split */}
              <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200/20">
                <div className="h-full bg-emerald-500" style={{ width: `${(kpis.minOperando/kpis.tiempoTotal)*100}%` }} title="Operación" />
                <div className="h-full bg-red-500" style={{ width: `${(kpis.minFallas/kpis.tiempoTotal)*100}%` }} title="Fallas" />
                <div className="h-full bg-slate-400" style={{ width: `${(kpis.minPlanificadas/kpis.tiempoTotal)*100}%` }} title="Planificado" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">FALLAS / DETENCIONES</span>
                  <span className="text-red-500 font-extrabold">{kpis.minFallas} min perdidos</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">PARADAS PLANIFICADAS</span>
                  <span className="text-slate-600 font-extrabold">{kpis.minPlanificadas} min</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-bold flex justify-between">
              <span>Tiempo de Turno:</span>
              <span className="text-slate-700">{kpis.tiempoTotal} minutos ({(kpis.tiempoTotal/60).toFixed(1)}h)</span>
            </div>
          </div>

          {/* C. Performance & Speed Efficiency KPI */}
          <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#457bb3]" />
                Rendimiento & Eficiencia de Velocidad
              </h3>
              <p className="text-[11px] text-slate-400">Relación de velocidad de ciclo real vs. ideal</p>
            </div>

            <div className="space-y-3.5 py-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Eficiencia de Ciclo</span>
                  <span className="text-xs font-black text-slate-700">{kpis.rendimiento.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${kpis.rendimiento}%`,
                      background: `linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)`,
                      backgroundSize: `${100 / (kpis.rendimiento / 100)}% 100%`
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">VELOCIDAD DISEÑO</span>
                  <span className="text-slate-800 font-extrabold">{currentData.velocidadNominal.toFixed(1)} piezas/min</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">VELOCIDAD REAL</span>
                  <span className="text-slate-800 font-extrabold">
                    {kpis.tiempoOperacion > 0 ? (kpis.piezasTotales / kpis.tiempoOperacion).toFixed(2) : "0"} piezas/min
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-bold flex justify-between">
              <span>Tiempo de Ciclo Ideal:</span>
              <span className="text-slate-700">{(60/currentData.velocidadNominal).toFixed(1)}s por pieza</span>
            </div>
          </div>

        </div>

        {/* Multi-machine OEE Summary Table */}
        {machines.length > 1 && (
          <div className="lg:col-span-12">
            <div className="bg-white border border-slate-200/80 shadow-[0_10px_30px_rgba(38,65,100,0.04)] rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#457bb3]" />
                  Resumen OEE por Máquina
                </h3>
                <p className="text-[11px] text-slate-400">Comparativa de eficiencia individual de cada máquina cargada</p>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold">
                      <th className="py-2.5 px-4">Máquina</th>
                      <th className="py-2.5 px-4">Fábrica</th>
                      <th className="py-2.5 px-4">Departamento</th>
                      <th className="py-2.5 px-4">Disponibilidad</th>
                      <th className="py-2.5 px-4">Rendimiento</th>
                      <th className="py-2.5 px-4">Calidad</th>
                      <th className="py-2.5 px-4">OEE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {machines.map(m => {
                      const mKpis = calculateOee(m.data)
                      const mCat = getOeeCategory(mKpis.oee)
                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${viewScope === "machine" && selectedFilter === m.id ? "bg-[#264164]/5" : ""}`}
                          onClick={() => { setViewScope("machine"); setSelectedFilter(m.id) }}
                        >
                          <td className="py-2.5 px-4 font-extrabold text-slate-800">{m.machineName}</td>
                          <td className="py-2.5 px-4 text-slate-500">{m.fabrica}</td>
                          <td className="py-2.5 px-4 text-slate-500">{m.departamento}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-700">{mKpis.disponibilidad.toFixed(1)}%</td>
                          <td className="py-2.5 px-4 font-bold text-slate-700">{mKpis.rendimiento.toFixed(1)}%</td>
                          <td className="py-2.5 px-4 font-bold text-slate-700">{mKpis.calidad.toFixed(1)}%</td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${mCat.bg} ${mCat.color} ${mCat.border}`}>
                              {mKpis.oee.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Accordion FAQ block for Industrial OEE SEO */}
      <section className="max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-slate-200/60 relative z-10">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Preguntas Frecuentes sobre el OEE</h2>
          <p className="text-xs md:text-sm text-slate-400">Conceptos clave de ingeniería de planta y eficiencia productiva</p>
        </div>

        <div className="space-y-4">
          <FAQItem
            question="¿Qué es la Eficiencia General de los Equipos (OEE)?"
            answer="El OEE (Overall Equipment Effectiveness) es una métrica estándar de la industria manufacturera que evalúa el porcentaje del tiempo de producción planificado que es verdaderamente productivo. Se calcula multiplicando tres factores clave: Disponibilidad, Rendimiento y Calidad (OEE = A * P * Q)."
          />
          <FAQItem
            question="¿Cuáles son los valores estándar de un OEE de Clase Mundial?"
            answer="Un OEE de Clase Mundial se considera típicamente a partir del 85% o superior. Esta marca se logra generalmente con factores individuales ideales en torno a: Disponibilidad >= 90%, Rendimiento >= 95% y Calidad >= 99%."
          />
          <FAQItem
            question="¿Cómo se calcula la Disponibilidad (A) en el OEE?"
            answer="La Disponibilidad mide el tiempo que la máquina está operando en relación con el tiempo total planificado para producir. Se calcula restando las paradas no planificadas (como averías mecánicas y fallas de sensores) y paradas planificadas (si aplican) al tiempo de operación de la línea."
          />
          <FAQItem
            question="¿Cuál es la diferencia entre Rendimiento y Calidad?"
            answer="El Rendimiento evalúa la pérdida de velocidad de la máquina (qué tan rápido corre en comparación con su límite nominal ideal de diseño). La Calidad evalúa las piezas buenas o aptas del total producido frente al descarte o retrabajo (piezas defectuosas)."
          />
          <FAQItem
            question="¿Cómo funciona el importador de archivos CSV en este Dashboard?"
            answer="El importador de archivos lee bitácoras de eventos industriales (cada línea contiene 'Evento', el minuto inicial, su duración en minutos y el estado de la máquina: Operando, Falla o Parada Planificada) junto con las cantidades producidas ('Metrica', la clave y el valor). Al subir el archivo, el dashboard recalculará automáticamente las tasas de OEE, disponibilidad, rendimiento y calidad de forma interactiva."
          />
        </div>
      </section>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <Footer />
    </div>
  )
}

// Collapsible Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left font-bold text-slate-800 text-sm md:text-base hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="font-extrabold text-slate-900 text-sm md:text-base">{question}</span>
        <span className={`w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-45" : ""}`}>
          <PlusIcon className="w-3.5 h-3.5" />
        </span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pt-1 text-slate-500 text-xs md:text-sm leading-relaxed border-t border-slate-50/50">
              <p>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
