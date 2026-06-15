"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactModal } from "@/components/contact-modal"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, 
  FileText, 
  Briefcase, 
  Users, 
  UserCheck, 
  Check, 
  AlertTriangle, 
  Printer, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Sparkles,
  Search,
  Building,
  CheckCircle,
  Clock,
  ThumbsUp,
  X,
  Info
} from "lucide-react"
import { auth, db, googleProvider } from "@/lib/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth"

// 1. Economic Activities mapping based on Colombian Decreto 1607
interface EconomicActivity {
  ciiu: string
  name: string
  riskClass: "I" | "II" | "III" | "IV" | "V"
  riskLevel: "Bajo" | "Bajo" | "Medio" | "Alto" | "Máximo" // I: Bajo, II: Bajo, III: Medio, IV: Alto, V: Máximo
  description: string
}

const ACTIVITIES: EconomicActivity[] = [
  { 
    ciiu: "6201", 
    name: "Desarrollo de Software y Consultoría de Sistemas TI", 
    riskClass: "I", 
    riskLevel: "Bajo",
    description: "Trabajo administrativo y de oficina. Riesgos ergonómicos y psicosociales."
  },
  { 
    ciiu: "4711", 
    name: "Comercio de Alimentos y Tiendas Minoristas", 
    riskClass: "I", 
    riskLevel: "Bajo",
    description: "Operaciones comerciales generales sin manejo de carga pesada."
  },
  { 
    ciiu: "5611", 
    name: "Servicios de Restaurantes y Cafeterías", 
    riskClass: "I", 
    riskLevel: "Bajo",
    description: "Preparación de alimentos. Riesgos de quemaduras, cortes y caídas."
  },
  { 
    ciiu: "5511", 
    name: "Hoteles, Hospedajes y Servicios Turísticos", 
    riskClass: "II", 
    riskLevel: "Bajo",
    description: "Mantenimiento y atención al cliente. Riesgo bajo a medio."
  },
  { 
    ciiu: "3110", 
    name: "Fabricación de Muebles de Madera", 
    riskClass: "III", 
    riskLevel: "Medio",
    description: "Manejo de maquinaria de corte y herramientas. Polvo y ruido industrial."
  },
  { 
    ciiu: "8610", 
    name: "Clínicas, Hospitales y Servicios de Salud", 
    riskClass: "III", 
    riskLevel: "Medio",
    description: "Riesgos biológicos, manipulación de pacientes y turnos rotativos."
  },
  { 
    ciiu: "4923", 
    name: "Transporte Terrestre Municipal e Intermunicipal de Carga", 
    riskClass: "IV", 
    riskLevel: "Alto",
    description: "Conducción en carretera. Riesgo biomecánico y de accidentes viales."
  },
  { 
    ciiu: "4111", 
    name: "Construcción de Edificaciones y Obras Civiles", 
    riskClass: "V", 
    riskLevel: "Máximo",
    description: "Trabajo en alturas, manejo de cargas pesadas y materiales peligrosos."
  },
  { 
    ciiu: "0510", 
    name: "Minería y Extracción de Carbón", 
    riskClass: "V", 
    riskLevel: "Máximo",
    description: "Trabajo bajo tierra o cielo abierto. Riesgo de derrumbes, gases y sílice."
  }
]

export default function PoliticaSstPage() {
  const [step, setStep] = useState(0)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [leadModalReason, setLeadModalReason] = useState<"limit_workers" | "limit_print">("limit_print")
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Auto-dismiss login error after 4 seconds
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => setLoginError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [loginError])

  // Step 0: Risk Classifier
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedActivity, setSelectedActivity] = useState<EconomicActivity | null>(null)

  // Step 1: Enterprise Base Data
  const [empresaNombre, setEmpresaNombre] = useState("")
  const [nit, setNit] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [numTrabajadores, setNumTrabajadores] = useState<number | "">("")

  // Step 2: System Coordinator
  const [responsableNombre, setResponsableNombre] = useState("")
  const [responsableCedula, setResponsableCedula] = useState("")
  const [tieneCurso50Horas, setTieneCurso50Horas] = useState(false)

  // Step 3: Management Commitment
  const [objetivoSST, setObjetivoSST] = useState("")

  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)

  // Load auth state on mount and sync Google login user to leads_sst in Firestore
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
      
      if (currentUser && db) {
        try {
          await setDoc(doc(db, "leads_sst", currentUser.uid), {
            nombre: currentUser.displayName || "",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            nit: nit || "",
            trabajadores: numTrabajadores || 0,
            actividadCiiu: selectedActivity?.ciiu || "",
            actividadNombre: selectedActivity?.name || "",
            timestamp: new Date()
          }, { merge: true })
        } catch (e) {
          console.error("Error writing user lead to Firestore:", e)
        }
      }
    })
    return () => unsubscribe()
  }, [nit, numTrabajadores, selectedActivity])

  // Auto-suggest activities
  const filteredActivities = ACTIVITIES.filter(act => 
    act.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    act.ciiu.includes(searchTerm)
  )

  // Check workers limits
  const handleWorkersChange = (val: number) => {
    if (val < 1) return
    const maxAllowed = user ? 20 : 5
    
    if (val > maxAllowed) {
      setNumTrabajadores(maxAllowed)
      setLeadModalReason("limit_workers")
      setIsLeadModalOpen(true)
    } else {
      setNumTrabajadores(val)
    }
  }

  // Google Sign-In helper
  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("Firebase no está configurado de manera correcta. Verifica tus variables de entorno.")
      return
    }
    setIsGoogleSigningIn(true)
    try {
      await signInWithPopup(auth, googleProvider)
      setIsLeadModalOpen(false)
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
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  // Sign-Out helper
  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      if (numTrabajadores && numTrabajadores > 5) {
        setNumTrabajadores(5)
      }
    } catch (err) {
      console.error("Error signing out:", err)
    }
  }

  // Pre-configured Objectives handler
  const handleSelectObjectivePreset = (preset: string) => {
    setObjetivoSST(preset)
  }

  const handleNextStep = () => {
    if (step === 0 && !selectedActivity) {
      alert("Por favor selecciona una actividad económica para calcular el riesgo.")
      return
    }
    if (step === 1) {
      if (!empresaNombre || !nit || !ciudad || !numTrabajadores) {
        alert("Por favor diligencia todos los campos obligatorios.")
        return
      }
      // Check NIT simple length
      if (nit.length < 5) {
        alert("Por favor ingresa un NIT válido.")
        return
      }
    }
    if (step === 2 && (!responsableNombre || !responsableCedula)) {
      alert("Por favor diligencia los datos del responsable del sistema.")
      return
    }
    if (step === 3 && !objetivoSST) {
      alert("Por favor redacta el objetivo de la gerencia o selecciona una plantilla.")
      return
    }

    setStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setStep(prev => Math.max(0, prev - 1))
  }

  // Printer/PDF download handler
  const handlePrint = () => {
    if (!user) {
      setLeadModalReason("limit_print")
      setIsLeadModalOpen(true)
      return
    }
    window.print()
  }

  // Dynamic values for policy view
  const getRiskBadgeStyles = (riskClass: "I" | "II" | "III" | "IV" | "V") => {
    switch (riskClass) {
      case "I":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "II":
        return "bg-teal-500/10 text-teal-600 border-teal-500/20"
      case "III":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "IV":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "V":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20"
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    }
  }

  const currentDateFormatted = () => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    const d = new Date()
    return `${ciudad || "Bogotá D.C."}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#457bb3] selection:text-white pb-12 overflow-x-hidden">
      
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

      {/* CSS print stylesheet for isolating A4 sheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #1e293b !important;
            font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
          }
          header, footer, nav, .no-print, button, .wizard-header, .wizard-controls {
            display: none !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />

      <Header />

      {/* Hero section */}
      <section className="relative overflow-hidden pt-32 pb-10 px-6 text-center bg-[#f9fafc] border-b border-slate-200/40 no-print">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-[#264164]/5 to-[#457bb3]/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10 space-y-4">
          <span className="px-3.5 py-1 bg-[#264164]/5 border border-[#264164]/10 rounded-full text-xs font-bold text-[#264164] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Lead Magnet SST — Colombia
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Asistente de Políticas <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">SG-SST Obligatorias</span>
          </h1>
          <p className="mt-4 text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Diagnostica tu clase de riesgo legal según tu actividad económica (Decreto 1607) y genera el documento formal de la política de seguridad y salud en el trabajo alineado con el Decreto 1072.
          </p>
        </div>
      </section>

      {/* WIZARD FRAME (no-print) */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 mt-8 relative z-10 no-print">

        {/* Auth & Limitations Banner Info */}
        <section className="mb-6">
          <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(38,65,100,0.01)] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-sky-50 text-sky-600 border border-sky-100"}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">
                  Límites de Trabajadores: <span className="text-[#264164] font-extrabold">{numTrabajadores || 0}/{user ? "20" : "5"} empleados</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {user ? (
                    <span>
                      ✓ Sesión activa con Google. Acceso ampliado habilitado (hasta 20 trabajadores) para descargas.
                    </span>
                  ) : (
                    "Modo Invitado. Límite de 5 trabajadores. Inicia sesión con Google para aumentarlo a 20."
                  )}
                </p>
              </div>
            </div>

            {/* Session actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isAuthLoading ? (
                <span className="text-xs text-slate-400 font-bold">Verificando...</span>
              ) : user ? (
                <div className="flex items-center gap-2 font-sans">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-slate-200 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{user.displayName || "Usuario"}</span>
                  <button 
                    onClick={handleLogout}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-200 shadow-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Registrarse con Google</span>
                </button>
              )}
            </div>
          </div>
        </section>
        
        {/* Wizard Progress Steps Indicator */}
        <section className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(38,65,100,0.02)] rounded-2xl p-4 md:p-6 mb-8 wizard-header">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            
            {[
              { icon: <Briefcase className="w-4 h-4" />, label: "Actividad" },
              { icon: <Building className="w-4 h-4" />, label: "Empresa" },
              { icon: <UserCheck className="w-4 h-4" />, label: "Responsable" },
              { icon: <FileText className="w-4 h-4" />, label: "Compromiso" },
              { icon: <CheckCircle className="w-4 h-4" />, label: "Documento" }
            ].map((s, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    // Only allow navigating backwards or forwards if validated
                    if (idx < step) {
                      setStep(idx)
                    }
                  }}
                  disabled={idx > step}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                    idx === step
                      ? "bg-[#264164] border-[#457bb3] text-white ring-4 ring-[#264164]/30"
                      : idx < step
                        ? "bg-emerald-600 border-emerald-500 text-white cursor-pointer"
                        : "bg-slate-100 border-slate-200/80 text-slate-400 cursor-not-allowed"
                  }`}
                  id={`step-indicator-${idx}`}
                >
                  {idx < step ? <Check className="w-4 h-4" /> : s.icon}
                </button>
                <span className={`text-[10px] md:text-xs font-bold mt-2 ${idx <= step ? "text-slate-850 font-extrabold" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Wizard Form Container */}
        {step < 4 && (
          <section className="bg-white border border-slate-200/85 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-[0_8px_30px_rgba(38,65,100,0.03)] text-slate-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* STEP 0: economic activities search & risk diagnostic */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#457bb3]" />
                        Paso 0: Actividad Económica & Diagnóstico de Riesgo
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Busca y selecciona la actividad de tu empresa según los parámetros de clasificación en Colombia.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="search-activity-input" className="text-xs font-bold text-slate-700 block">Buscar Actividad o Código CIIU</label>
                      <div className="relative">
                        <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="search-activity-input"
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Ej: software, construcción, restaurantes..."
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-sm shadow-sm"
                        />
                      </div>

                      {/* Suggestion list */}
                      <div className="border border-slate-200 bg-white rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-inner">
                        {filteredActivities.length > 0 ? (
                          filteredActivities.map((act) => (
                            <button
                              key={act.ciiu}
                              type="button"
                              onClick={() => {
                                setSelectedActivity(act)
                                setSearchTerm("")
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer ${
                                selectedActivity?.ciiu === act.ciiu ? "bg-slate-100 text-slate-900 font-extrabold" : "text-slate-600"
                              }`}
                              id={`activity-option-${act.ciiu}`}
                            >
                              <div className="min-w-0 pr-4">
                                <span className="text-[10px] font-black text-sky-600 font-mono block">CIIU {act.ciiu}</span>
                                <span className="block truncate text-slate-800 font-semibold mt-0.5">{act.name}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase shrink-0 ${getRiskBadgeStyles(act.riskClass)}`}>
                                Riesgo {act.riskClass}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            No encontramos actividades que coincidan con la búsqueda.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Calculated Risk Badge Information Card */}
                    {selectedActivity && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4 shadow-inner">
                        <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center border border-slate-200 shrink-0">
                          <span className="text-[9px] text-slate-500 font-black uppercase leading-none">CLASE</span>
                          <span className="text-lg font-black text-slate-900 leading-none mt-1">{selectedActivity.riskClass}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-black text-slate-800 leading-none">{selectedActivity.name}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${getRiskBadgeStyles(selectedActivity.riskClass)}`}>
                              Nivel {selectedActivity.riskLevel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">{selectedActivity.description}</p>
                          {(selectedActivity.riskClass === "III" || selectedActivity.riskClass === "IV" || selectedActivity.riskClass === "V") && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold rounded-lg flex items-start gap-1.5 leading-normal shadow-sm">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                              <span>Clase de Riesgo Media/Alta. La legislación colombiana (Decreto 1072) requiere que el diseño final sea validado por un consultor certificado con licencia SST.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 1: Base Enterprise Information */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Building className="w-5 h-5 text-[#457bb3]" />
                        Paso 1: Datos Base de la Empresa
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Diligencia la información básica obligatoria para individualizar el formato de la política.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="empresa-nombre-input" className="text-xs font-bold text-slate-700 block">Razón Social / Nombre Empresa *</label>
                        <input
                          id="empresa-nombre-input"
                          type="text"
                          value={empresaNombre}
                          onChange={(e) => setEmpresaNombre(e.target.value)}
                          placeholder="Ej: Inversiones Tecnológicas S.A.S."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-xs shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="nit-input" className="text-xs font-bold text-slate-700 block">NIT (Número Identificación Tributaria) *</label>
                        <input
                          id="nit-input"
                          type="text"
                          value={nit}
                          onChange={(e) => setNit(e.target.value)}
                          placeholder="Ej: 901.123.456-7"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-xs shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="ciudad-input" className="text-xs font-bold text-slate-700 block">Ciudad de Operación Principal *</label>
                        <input
                          id="ciudad-input"
                          type="text"
                          value={ciudad}
                          onChange={(e) => setCiudad(e.target.value)}
                          placeholder="Ej: Bogotá D.C., Medellín..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-xs shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label htmlFor="num-trabajadores-input" className="text-xs font-bold text-slate-700 block">Número de Trabajadores *</label>
                          {!user && (
                            <span className="text-[9px] font-black text-amber-650 uppercase tracking-widest block bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Invitado: Máx 5</span>
                          )}
                        </div>
                        <input
                          id="num-trabajadores-input"
                          type="number"
                          value={numTrabajadores}
                          onChange={(e) => handleWorkersChange(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Ej: 4"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-xs shadow-sm"
                        />
                        <span className="text-[9px] text-slate-505 block leading-none">Define el número de empleados activos vinculados.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Responsible for the SG-SST system */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-[#457bb3]" />
                        Paso 2: Responsable del Sistema
                      </h2>
                      <p className="text-xs text-slate-505 mt-1">
                        Indica quién administrará y ejecutará el plan de salud ocupacional de la empresa.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="responsable-nombre-input" className="text-xs font-bold text-slate-700 block">Nombre del Responsable SST *</label>
                        <input
                          id="responsable-nombre-input"
                          type="text"
                          value={responsableNombre}
                          onChange={(e) => setResponsableNombre(e.target.value)}
                          placeholder="Ej: Ing. Andrés Felipe Rojas"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-xs shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="responsable-cedula-input" className="text-xs font-bold text-slate-700 block">Cédula del Responsable *</label>
                        <input
                          id="responsable-cedula-input"
                          type="text"
                          value={responsableCedula}
                          onChange={(e) => setResponsableCedula(e.target.value)}
                          placeholder="Ej: 1.020.304.506"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] transition-all text-xs shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 shadow-inner">
                      <div className="text-left space-y-1 pr-4">
                        <label htmlFor="curso-horas-checkbox" className="text-xs font-bold text-slate-700 block cursor-pointer">Curso Virtual de 50 Horas de SST Aprobado</label>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          El Ministerio de Trabajo exige que el administrador del SG-SST cuente con el certificado del curso vigente.
                        </p>
                      </div>
                      <input
                        id="curso-horas-checkbox"
                        type="checkbox"
                        checked={tieneCurso50Horas}
                        onChange={(e) => setTieneCurso50Horas(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-200 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Corporate Policy Core objectives */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#457bb3]" />
                        Paso 3: Compromiso de la Gerencia
                      </h2>
                      <p className="text-xs text-slate-505 mt-1">
                        Establece el objetivo anual principal del sistema de gestión para tu organización.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="objetivo-sst-input" className="text-xs font-bold text-slate-700 block">Redactar Objetivo / Compromiso *</label>
                      <textarea
                        id="objetivo-sst-input"
                        value={objetivoSST}
                        onChange={(e) => setObjetivoSST(e.target.value)}
                        placeholder="Define el compromiso principal de la dirección empresarial..."
                        rows={4}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#457bb3] transition-all text-xs resize-none leading-relaxed shadow-sm"
                      />
                    </div>

                    {/* Pre-written templates presets */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Plantillas sugeridas (haz clic para usar)</span>
                      <div className="grid gap-2 text-[10px] text-left">
                        {[
                          "Garantizar la mitigación de los accidentes y enfermedades laborales a través de la identificación oportuna de los peligros y el control permanente de los riesgos.",
                          "Fomentar una cultura sólida de prevención y autocuidado que involucre activamente a todos los trabajadores, contratistas y partes interesadas.",
                          "Alcanzar el cumplimiento pleno de los estándares mínimos y la normatividad legal de riesgos laborales aplicables en la República de Colombia."
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectObjectivePreset(preset)}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 transition-all text-left font-medium leading-relaxed cursor-pointer shadow-sm"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard Controls Buttons block */}
                <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between gap-4 wizard-controls">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={step === 0}
                    className={`px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 ${
                      step === 0 ? "opacity-40 cursor-not-allowed text-slate-400" : "hover:bg-slate-100 text-slate-650 cursor-pointer"
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Anterior
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl transition-all inline-flex items-center gap-1.5 shadow-lg shadow-sky-600/10 cursor-pointer"
                  >
                    Siguiente <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {/* STEP 4: Document preview controls and edit triggers */}
        {step === 4 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgba(38,65,100,0.03)] text-slate-800">
              <div className="text-left space-y-0.5">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ¡Política Generada Correctamente!
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Puedes previsualizar el documento redactado abajo. Si es necesario, edita los datos o imprime.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-3 py-2 border border-slate-200 bg-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-all text-slate-650 cursor-pointer inline-flex items-center gap-1 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Editar Datos
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all inline-flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir / Guardar PDF
                </button>
              </div>
            </div>

            {!user && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Modo Invitado: Para desbloquear la impresión del documento y el límite de trabajadores, regístrate gratis.</span>
                </div>
                <button 
                  onClick={() => setIsLeadModalOpen(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-all cursor-pointer shrink-0"
                >
                  Registrarse Gratis
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* A4 PHYSICAL SHEET VIEW PREVIEW PANEL (Visible in Step 4, prints isolated) */}
      {step === 4 && (
        <section className="mt-8 max-w-5xl mx-auto px-4 md:px-6">
          <div className="bg-white text-slate-900 border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] mx-auto p-12 md:p-16 max-w-[800px] min-h-[1050px] relative font-serif text-sm leading-relaxed print-area flex flex-col justify-between">
            
            {/* Header branding / metadata */}
            <div>
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-left font-sans">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest block uppercase">DOCUMENTO SG-SST</span>
                  <span className="text-xs font-extrabold text-slate-800 uppercase block mt-0.5">{empresaNombre || "Empresa Demostración"}</span>
                  <span className="text-[9px] text-slate-500 block">NIT: {nit || "900.000.000-0"} | Ciudad: {ciudad || "Colombia"}</span>
                </div>
                <div className="text-right font-sans shrink-0">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest block uppercase">DECRETO 1072</span>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-extrabold rounded mt-0.5 inline-block">
                    Riesgo {selectedActivity?.riskClass || "I"} (CIIU {selectedActivity?.ciiu || "6201"})
                  </span>
                </div>
              </div>

              {/* Document title */}
              <div className="text-center my-8">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-950 font-sans border-y border-slate-900/10 py-3">
                  Política de Seguridad y Salud en el Trabajo (SST)
                </h1>
              </div>

              {/* Policy Body text */}
              <div className="space-y-4 text-justify text-[13px] md:text-sm font-serif">
                <p>
                  En cumplimiento del Capítulo 6 del Decreto 1072 de 2015 del Ministerio del Trabajo de la República de Colombia, la gerencia de <strong>{empresaNombre || "la organización"}</strong> establece el firme compromiso de velar por la seguridad, salud e integridad física, mental y social de todos sus colaboradores, trabajadores independientes, contratistas y subcontratistas vinculados.
                </p>

                <p>
                  La administración reconoce que el talento humano constituye el recurso primordial de la empresa. Por lo tanto, orienta su gestión hacia la prevención constante de incidentes, accidentes laborales y enfermedades ocupacionales, garantizando la mejora continua en los estándares y procesos internos del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).
                </p>

                {/* Conditional Text based on Risk Class */}
                {selectedActivity?.riskClass === "I" || selectedActivity?.riskClass === "II" ? (
                  // Low Risk text emphasis
                  <p className="bg-slate-50/50 p-4 border-l-4 border-[#264164] rounded-r-xl leading-normal italic text-slate-700 text-xs md:text-[13px]">
                    "Dado el perfil administrativo y operativo de nivel bajo de riesgo clasificado en esta política, la organización enfatizará sus esfuerzos en la optimización de la ergonomía en los puestos de trabajo individuales, la prevención de la fatiga visual y corporal mediante la ejecución estructurada y oportuna del programa de pausas activas, el fomento de estilos de vida saludables, y el monitoreo preventivo de riesgos psicosociales y de salud mental laboral."
                  </p>
                ) : (
                  // High Risk text emphasis
                  <p className="bg-rose-50/50 p-4 border-l-4 border-rose-500 rounded-r-xl leading-normal italic text-slate-800 text-xs md:text-[13px]">
                    "Dada la naturaleza crítica de las operaciones y la alta clasificación de riesgo de la actividad económica que ejecuta la empresa, se prioriza como directriz fundamental el suministro, inspección y uso obligatorio y supervisado de los Elementos de Protección Personal (EPP). Se implementarán procesos rigurosos de identificación de condiciones subestándar y peligros, la conformación, capacitación y entrenamiento de brigadas de rescate y emergencias, y la aplicación estricta de permisos de trabajo especiales para la prevención absoluta de fatalidades en tareas de alto riesgo."
                  </p>
                )}

                <p>
                  Para soportar esta política general, la alta dirección define los siguientes objetivos fundamentales:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-[12px] md:text-xs">
                  <li>Identificar, evaluar y valorar sistemáticamente todos los peligros en los centros de trabajo para establecer controles preventivos y de mitigación inmediatos.</li>
                  <li><strong>{objetivoSST || "Cumplir de forma plena con la normatividad de riesgos laborales colombiana."}</strong></li>
                  <li>Capacitar de manera continua al personal en técnicas de prevención de riesgos y autocuidado laboral en sus puestos.</li>
                  <li>Fomentar mecanismos de consulta y participación bidireccional que involucren activamente al comité COPASST / Vigía de seguridad.</li>
                </ul>

                <p className="pt-2 text-xs font-sans text-slate-500 leading-normal">
                  Esta política es redactada, publicada y firmada de manera solemne para su cumplimiento obligatorio en todos los niveles y áreas funcionales de la empresa.
                </p>

                {/* Colombian Legal Advisory Note for High Risk */}
                {(selectedActivity?.riskClass === "III" || selectedActivity?.riskClass === "IV" || selectedActivity?.riskClass === "V") && (
                  <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] md:text-xs rounded-xl flex items-start gap-2 leading-relaxed font-sans">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <strong className="font-extrabold uppercase block text-amber-900">Aviso Normativo Colombiano Obligatorio:</strong>
                      <span>Por tratarse de una organización con clase de riesgo {selectedActivity.riskClass} ({selectedActivity.riskLevel}), el Decreto 1072 de 2015 y la Resolución 0312 de 2019 exigen que este documento sea integrado de forma definitiva y firmado por un consultor especialista en SST con licencia profesional vigente.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Blocks and Date metadata at bottom */}
            <div className="mt-16 pt-8 border-t border-slate-900/10 font-sans">
              <span className="text-[10px] text-slate-500 block mb-12 text-center sm:text-left">
                Fecha de Aprobación: {currentDateFormatted()}
              </span>

              <div className="grid grid-cols-2 gap-8 text-xs font-bold text-slate-800">
                <div className="text-center sm:text-left space-y-8">
                  <div className="h-0.5 bg-slate-900/25 w-48 mx-auto sm:mx-0" />
                  <div>
                    <span className="block uppercase text-[10px] font-black text-slate-900">Representante Legal</span>
                    <span className="text-[10px] text-slate-500 block font-normal mt-0.5">{empresaNombre || "Firma Autorizada"}</span>
                    <span className="text-[9px] text-slate-400 block font-normal">NIT/C.C. de la Empresa</span>
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-8">
                  <div className="h-0.5 bg-slate-900/25 w-48 mx-auto sm:mx-0" />
                  <div>
                    <span className="block uppercase text-[10px] font-black text-slate-900">{responsableNombre || "Responsable SG-SST"}</span>
                    <span className="text-[10px] text-slate-500 block font-normal mt-0.5">
                      C.C. {responsableCedula || "Documento ID"}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-normal">
                      {tieneCurso50Horas ? "Curso 50 Horas SST Aprobado" : "Responsable Asignado"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}
      {/* LEAD CAPTURE SIGNUP MODAL (Glassmorphic Blur blocker) */}
      <AnimatePresence>
        {isLeadModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setIsLeadModalOpen(false)}
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setIsLeadModalOpen(false)}
            >
              <div 
                className="bg-white/95 border border-slate-200/80 rounded-3xl w-full max-w-xl shadow-[0_25px_60px_rgba(38,65,100,0.15)] backdrop-blur-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Visual Accent top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#264164] via-[#457bb3] to-[#acd64a]" />
                
                <div className="p-8 space-y-6 text-left">
                  {/* Alert Icon and Title */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Info className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {leadModalReason === "limit_workers" 
                          ? "Límite de Trabajadores Superado" 
                          : "Impresión Bloqueada (Modo Invitado)"}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 leading-normal">
                        {leadModalReason === "limit_workers" 
                          ? "Para registrar más de 5 trabajadores en tu política de SST, requieres una cuenta gratuita." 
                          : "Para imprimir o descargar el PDF de tu política de SST configurada, regístrate gratis."}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setIsLeadModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all ml-auto cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Core Value Proposition Text */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-700 leading-relaxed">
                    <strong>¿Quieres automatizar todo tu SG-SST?</strong> Con nuestra cuenta premium puedes descargar políticas ilimitadas para hasta 20 trabajadores, almacenar tus documentos en la nube, y acceder a módulos móviles de inspecciones, autoreportes de salud y comités de seguridad (COPASST).
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLeadModalOpen(false)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-650 hover:text-slate-900 text-sm font-bold transition-all hover:bg-slate-50 text-center cursor-pointer"
                    >
                      Seguir en Versión Libre
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsLeadModalOpen(false)
                        await handleGoogleLogin()
                      }}
                      disabled={isGoogleSigningIn}
                      className="w-full sm:flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-sm"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>{isGoogleSigningIn ? "Iniciando..." : "Registrarse con Google"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
