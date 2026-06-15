"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Briefcase, 
  Settings, 
  Truck, 
  Heart, 
  GraduationCap, 
  Sparkles, 
  Check, 
  Info, 
  X, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  Lock, 
  Award, 
  CheckCircle2, 
  Building,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Cloud,
  Loader2,
  Upload,
  Download,
  Trash2,
  Paperclip
} from "lucide-react"
import { auth, db, googleProvider } from "@/lib/firebase"
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

// Define Economical Sectors for Paso 0
interface Sector {
  id: string;
  name: string;
  strategicFocus: string;
  isoPillar: string;
  description: string;
  policyFocusText: string;
}

const SECTORS: Sector[] = [
  {
    id: "software",
    name: "Software & Tecnología",
    strategicFocus: "Continuidad del servicio, ciberseguridad, gestión de incidentes y SLAs.",
    isoPillar: "Diseño, control de cambios y validación de entregables de software (Capítulo 8.3 y 8.5.6)",
    description: "Centrado en el control ágil de versiones de código, estabilidad operativa y protección de datos.",
    policyFocusText: "nuestro compromiso absoluto con la alta disponibilidad, la continuidad de los servicios tecnológicos prestados, la mitigación de riesgos de ciberseguridad, y el cumplimiento estricto de los Acuerdos de Nivel de Servicio (SLAs), asegurando el monitoreo constante y la gestión ágil de cambios de software",
  },
  {
    id: "manufactura",
    name: "Manufactura & Producción",
    strategicFocus: "Cero defectos, trazabilidad de materiales y estandarización operativa.",
    isoPillar: "Control de salidas no conformes, inspección en planta y calibración de equipos (Capítulo 8.7 y 7.1.5)",
    description: "Centrado en la reducción de mermas, control estricto de productos defectuosos y calibración de maquinaria.",
    policyFocusText: "la búsqueda activa del cero defectos en nuestros productos manufacturados, garantizando la trazabilidad total en cada fase de fabricación, la identificación y segregación estricta de las salidas no conformes, y la calibración periódica de nuestros instrumentos de control de calidad",
  },
  {
    id: "servicios",
    name: "Servicios Generales / Profesionales",
    strategicFocus: "Tiempos de respuesta, amabilidad en la atención y estandarización del servicio.",
    isoPillar: "Control de la prestación del servicio y retroalimentación del cliente (Capítulo 8.5 y 8.2.1)",
    description: "Centrado en protocolos de atención al cliente, encuestas de satisfacción y estandarización de entregables.",
    policyFocusText: "el cumplimiento de los tiempos de entrega pactados, la amabilidad en el trato, la estandarización de nuestros protocolos de servicio y la atención sistemática de las peticiones, quejas y reclamos de nuestros clientes",
  },
  {
    id: "educacion",
    name: "Educación & Formación",
    strategicFocus: "Calidad pedagógica, actualización de contenidos y satisfacción de estudiantes.",
    isoPillar: "Diseño curricular, competencia docente y evaluación del aprendizaje (Capítulo 8.3 y 7.2)",
    description: "Centrado en planes de estudio pertinentes, entrenamiento de docentes y retroalimentación académica.",
    policyFocusText: "la idoneidad y formación continua de nuestro cuerpo docente, el diseño y actualización permanente de programas curriculares pertinentes, y la evaluación sistemática del desempeño académico y la satisfacción integral del estudiante",
  }
]

// Define Processes for Paso 1
interface ProcessItem {
  id: string;
  name: string;
  category: "estrategico" | "misional" | "apoyo";
  description: string;
  defaultFormat: string;
}

const PROCESSES: ProcessItem[] = [
  // Estratégicos
  {
    id: "direccionamiento",
    name: "Direccionamiento Estratégico",
    category: "estrategico",
    description: "Planificación de objetivos del negocio y revisión anual por la alta dirección.",
    defaultFormat: "info_documentada"
  },
  {
    id: "gestion_calidad",
    name: "Gestión de Calidad",
    category: "estrategico",
    description: "Coordinación de auditorías internas, acciones correctivas y mejora continua del SGC.",
    defaultFormat: "info_documentada"
  },
  // Misionales
  {
    id: "diseno_desarrollo",
    name: "Diseño y Desarrollo de Software",
    category: "misional",
    description: "Especificación, codificación, pruebas y despliegue de soluciones tecnológicas.",
    defaultFormat: "control_cambios"
  },
  {
    id: "produccion_servicio",
    name: "Producción / Prestación del Servicio",
    category: "misional",
    description: "Ejecución de actividades core del negocio y entrega de valor final al cliente.",
    defaultFormat: "info_documentada"
  },
  {
    id: "ventas_comercial",
    name: "Ventas y Relación Comercial",
    category: "misional",
    description: "Atención comercial, cotizaciones, gestión contractual y posventa.",
    defaultFormat: "satisfaccion_cliente"
  },
  // Apoyo
  {
    id: "gestion_humana",
    name: "Gestión Humana",
    category: "apoyo",
    description: "Reclutamiento, evaluación de desempeño y capacitación de personal.",
    defaultFormat: "info_documentada"
  },
  {
    id: "compras_proveedores",
    name: "Compras y Proveedores",
    category: "apoyo",
    description: "Evaluación, selección e inspección de compras a proveedores externos.",
    defaultFormat: "evaluacion_proveedores"
  },
  {
    id: "infraestructura_ti",
    name: "Infraestructura y TI",
    category: "apoyo",
    description: "Mantenimiento preventivo de hardware, software, servidores y soporte técnico.",
    defaultFormat: "info_documentada"
  }
]

// Available Formats Dictionary
interface FormatOption {
  id: string;
  name: string;
  chapter: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "control_cambios", name: "Control de Cambios y Entregables de Software", chapter: "Capítulo 8.3" },
  { id: "evaluacion_proveedores", name: "Evaluación y Reatestación de Proveedores Externos", chapter: "Capítulo 8.4" },
  { id: "satisfaccion_cliente", name: "Encuesta de Satisfacción del Cliente y Quejas", chapter: "Capítulo 9.1.2" },
  { id: "info_documentada", name: "Control de Información Documentada", chapter: "Capítulo 7.5" }
]

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl: string;
}

// Table Row Types
interface CambiosRow {
  idReq: string;
  fechaSol: string;
  descripcion: string;
  solicitante: string;
  impacto: string;
  modulo: string;
  estado: string;
}

interface ProveedoresRow {
  proveedor: string;
  nit: string;
  calidad: string;
  tiempos: string;
  soporte: string;
  homologacion: string;
  accion: string;
}

interface SatisfaccionRow {
  idCaso: string;
  cliente: string;
  contacto: string;
  tipo: string;
  detalle: string;
  plan: string;
  cerrado: string;
}

interface InfoDocRow {
  codigo: string;
  nombre: string;
  tipo: string;
  version: string;
  fecha: string;
  elaboro: string;
  aprobo: string;
}

export default function PoliticaCalidadPage() {
  const [step, setStep] = useState(0)

  // Step 0: Sector
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null)

  // Step 1: Selected Processes
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([
    "direccionamiento",
    "diseno_desarrollo",
    "ventas_comercial",
    "compras_proveedores"
  ])

  // Step 2: Formats mapping per process
  const [processFormats, setProcessFormats] = useState<Record<string, string>>({
    direccionamiento: "info_documentada",
    diseno_desarrollo: "control_cambios",
    ventas_comercial: "satisfaccion_cliente",
    compras_proveedores: "evaluacion_proveedores"
  })

  // Step 3: Company & Representative details
  const [razonSocial, setRazonSocial] = useState("")
  const [nit, setNit] = useState("")
  const [numTrabajadores, setNumTrabajadores] = useState<number | "">("")
  const [responsableNombre, setResponsableNombre] = useState("")
  const [responsableCargo, setResponsableCargo] = useState("")

  // FILE STORAGE AND UPLOAD STATES
  const [fileCambios, setFileCambios] = useState<UploadedFile | null>(null)
  const [fileProveedores, setFileProveedores] = useState<UploadedFile | null>(null)
  const [fileSatisfaccion, setFileSatisfaccion] = useState<UploadedFile | null>(null)
  const [fileInfoDoc, setFileInfoDoc] = useState<UploadedFile | null>(null)

  // Auth & System State
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [leadModalReason, setLeadModalReason] = useState<"multi_formats" | "download_limit">("multi_formats")
  const [loginError, setLoginError] = useState<string | null>(null)

  // Cloud Saving Indicators
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Console active tab state
  const [consoleTab, setConsoleTab] = useState<string>("overview")

  const handleFileUpload = (
    formatType: "control_cambios" | "evaluacion_proveedores" | "satisfaccion_cliente" | "info_documentada",
    file: File
  ) => {
    if (file.size > 850 * 1024) {
      alert("El archivo supera el límite de 800 KB para la versión de demostración en la nube. Sube un archivo más liviano.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const uploaded: UploadedFile = {
        name: file.name,
        size: Math.round(file.size / 1024), // in KB
        type: file.type,
        uploadedAt: new Date().toLocaleDateString("es-CO"),
        dataUrl: reader.result as string
      }

      if (formatType === "control_cambios") setFileCambios(uploaded)
      else if (formatType === "evaluacion_proveedores") setFileProveedores(uploaded)
      else if (formatType === "satisfaccion_cliente") setFileSatisfaccion(uploaded)
      else if (formatType === "info_documentada") setFileInfoDoc(uploaded)
    }
    reader.readAsDataURL(file)
  }

  const handleFileDelete = (
    formatType: "control_cambios" | "evaluacion_proveedores" | "satisfaccion_cliente" | "info_documentada"
  ) => {
    if (formatType === "control_cambios") setFileCambios(null)
    else if (formatType === "evaluacion_proveedores") setFileProveedores(null)
    else if (formatType === "satisfaccion_cliente") setFileSatisfaccion(null)
    else if (formatType === "info_documentada") setFileInfoDoc(null)
  }

  const handleFileDownload = (uploadedFile: UploadedFile) => {
    if (!uploadedFile.dataUrl) return
    const link = document.createElement("a")
    link.href = uploadedFile.dataUrl
    link.download = uploadedFile.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Demo Data Files Loader
  const handleLoadDemoFiles = (formatType?: string) => {
    const csvHeaderCambios = "ID,Requerimiento,Fecha,Descripcion,Solicitante,Impacto,Estado\nREQ-101,Autenticación OAuth2,2026-06-01,Migración de módulo de autenticación,Carlos Mendoza,Alto,Aprobado\nREQ-102,Optimización de reportes,2026-06-04,Optimización de consultas SQL,Diana Torres,Medio,Aprobado"
    const base64Cambios = "data:text/csv;base64," + btoa(unescape(encodeURIComponent(csvHeaderCambios)))
    const demoCambios: UploadedFile = {
      name: "SGC_FOR_08_Control_Cambios.csv",
      size: 4,
      type: "text/csv",
      uploadedAt: new Date().toLocaleDateString("es-CO"),
      dataUrl: base64Cambios
    }

    const csvHeaderProveedores = "Proveedor,NIT,Calidad,Tiempos,Soporte,Homologacion,Accion\nAWS,900.234.567-1,98%,100%,Excelente,Aprobado,Renovación\nStripe,800.123.987-2,95%,99%,Bueno,Aprobado,Monitorear"
    const base64Proveedores = "data:text/csv;base64," + btoa(unescape(encodeURIComponent(csvHeaderProveedores)))
    const demoProveedores: UploadedFile = {
      name: "SGC_FOR_12_Evaluacion_Proveedores.csv",
      size: 3,
      type: "text/csv",
      uploadedAt: new Date().toLocaleDateString("es-CO"),
      dataUrl: base64Proveedores
    }

    const csvHeaderSatisfaccion = "CasoID,Cliente,Contacto,Tipo,Novedad,PlanAccion,Cerrado\nPQRS-501,Banco Occidente,Laura Restrepo,Reclamo,Lentitud reportes,Optimizar base de datos,Si\nPQRS-502,Almacenes Exito,Jorge Restrepo,Felicitacion,Excelente soporte,Carta de reconocimiento,Si"
    const base64Satisfaccion = "data:text/csv;base64," + btoa(unescape(encodeURIComponent(csvHeaderSatisfaccion)))
    const demoSatisfaccion: UploadedFile = {
      name: "SGC_FOR_15_Satisfaccion_Cliente.csv",
      size: 4,
      type: "text/csv",
      uploadedAt: new Date().toLocaleDateString("es-CO"),
      dataUrl: base64Satisfaccion
    }

    const csvHeaderInfoDoc = "Codigo,Documento,Tipo,Version,Fecha,Elaboro,Aprobo\nSGC-PR-01,Manual de Calidad,Manual,02,2026-01-15,Director Calidad,Gerente General\nSGC-PR-02,Procedimiento Desarrollo,Procedimiento,03,2026-02-10,Lider Desarrollo,Director Calidad"
    const base64InfoDoc = "data:text/csv;base64," + btoa(unescape(encodeURIComponent(csvHeaderInfoDoc)))
    const demoInfoDoc: UploadedFile = {
      name: "SGC_FOR_18_Listado_Maestro.csv",
      size: 4,
      type: "text/csv",
      uploadedAt: new Date().toLocaleDateString("es-CO"),
      dataUrl: base64InfoDoc
    }

    if (!formatType || formatType === "control_cambios") setFileCambios(demoCambios)
    if (!formatType || formatType === "evaluacion_proveedores") setFileProveedores(demoProveedores)
    if (!formatType || formatType === "satisfaccion_cliente") setFileSatisfaccion(demoSatisfaccion)
    if (!formatType || formatType === "info_documentada") setFileInfoDoc(demoInfoDoc)
  }

  // Clear Files
  const handleClearFiles = (formatType?: string) => {
    if (!formatType || formatType === "control_cambios") setFileCambios(null)
    if (!formatType || formatType === "evaluacion_proveedores") setFileProveedores(null)
    if (!formatType || formatType === "satisfaccion_cliente") setFileSatisfaccion(null)
    if (!formatType || formatType === "info_documentada") setFileInfoDoc(null)
  }

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sgc_iso9001_data")
      if (saved) {
        try {
          const docData = JSON.parse(saved)
          if (docData.fileCambios) setFileCambios(docData.fileCambios)
          if (docData.fileProveedores) setFileProveedores(docData.fileProveedores)
          if (docData.fileSatisfaccion) setFileSatisfaccion(docData.fileSatisfaccion)
          if (docData.fileInfoDoc) setFileInfoDoc(docData.fileInfoDoc)
          if (docData.razonSocial) setRazonSocial(docData.razonSocial)
          if (docData.nit) setNit(docData.nit)
          if (docData.numTrabajadores) setNumTrabajadores(docData.numTrabajadores)
          if (docData.responsableNombre) setResponsableNombre(docData.responsableNombre)
          if (docData.responsableCargo) setResponsableCargo(docData.responsableCargo)
          if (docData.selectedSectorId) {
            const matchedSector = SECTORS.find(s => s.id === docData.selectedSectorId)
            if (matchedSector) setSelectedSector(matchedSector)
          }
          if (docData.selectedProcesses) setSelectedProcesses(docData.selectedProcesses)
        } catch (e) {
          console.error("Error parsing localStorage data:", e)
        }
      }
    }
  }, [])

  // Autosave to localStorage on any state change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dataToSave = {
        fileCambios,
        fileProveedores,
        fileSatisfaccion,
        fileInfoDoc,
        razonSocial,
        nit,
        numTrabajadores,
        responsableNombre,
        responsableCargo,
        selectedSectorId: selectedSector?.id || "",
        selectedProcesses,
      }
      localStorage.setItem("sgc_iso9001_data", JSON.stringify(dataToSave))
    }
  }, [
    fileCambios,
    fileProveedores,
    fileSatisfaccion,
    fileInfoDoc,
    razonSocial,
    nit,
    numTrabajadores,
    responsableNombre,
    responsableCargo,
    selectedSector,
    selectedProcesses
  ])

  // Auto-dismiss login error toast
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => setLoginError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [loginError])

  // Fetch saved document from Firestore `leads_calidad` on login
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
          // Attempt to fetch saved documents snapshot from Firestore
          const docSnap = await getDoc(doc(db, "leads_calidad", currentUser.uid))
          if (docSnap.exists()) {
            const docData = docSnap.data()
            if (docData.fileCambios) setFileCambios(docData.fileCambios)
            if (docData.fileProveedores) setFileProveedores(docData.fileProveedores)
            if (docData.fileSatisfaccion) setFileSatisfaccion(docData.fileSatisfaccion)
            if (docData.fileInfoDoc) setFileInfoDoc(docData.fileInfoDoc)
            
            // Also restore company details
            if (docData.razonSocial) setRazonSocial(docData.razonSocial)
            if (docData.nit) setNit(docData.nit)
            if (docData.trabajadores) setNumTrabajadores(docData.trabajadores)
            if (docData.responsableNombre) setResponsableNombre(docData.responsableNombre)
            if (docData.responsableCargo) setResponsableCargo(docData.responsableCargo)
            if (docData.sector) {
              const matchedSector = SECTORS.find(s => s.id === docData.sector)
              if (matchedSector) setSelectedSector(matchedSector)
            }
            if (docData.procesos) {
              setSelectedProcesses(docData.procesos)
            }
          }
        } catch (e) {
          console.error("Error reading user lead from Firestore:", e)
        }
      }
    })
    return () => unsubscribe()
  }, [auth])

  // Reset/Initialize formats mapping when processes changes
  useEffect(() => {
    const updated: Record<string, string> = {}
    selectedProcesses.forEach(pid => {
      const p = PROCESSES.find(item => item.id === pid)
      updated[pid] = processFormats[pid] || p?.defaultFormat || "info_documentada"
    })
    setProcessFormats(updated)
  }, [selectedProcesses])

  // Helper to count how many formats are currently set to generate
  const [activeFormats, setActiveFormats] = useState<string[]>(["diseno_desarrollo"])

  // Sync active formats when processes list changes
  useEffect(() => {
    setActiveFormats(prev => prev.filter(pid => selectedProcesses.includes(pid)))
  }, [selectedProcesses])

  const handleToggleFormatActive = (pid: string) => {
    const isSelected = activeFormats.includes(pid)
    
    if (!isSelected) {
      if (!user && activeFormats.length >= 1) {
        setLeadModalReason("multi_formats")
        setIsLeadModalOpen(true)
        return
      }
      setActiveFormats(prev => [...prev, pid])
    } else {
      setActiveFormats(prev => prev.filter(id => id !== pid))
    }
  }

  // Handle format type dropdown changes
  const handleFormatTypeChange = (pid: string, formatId: string) => {
    setProcessFormats(prev => ({
      ...prev,
      [pid]: formatId
    }))
  }

  const handleWorkersChange = (val: number) => {
    if (val < 1) return
    setNumTrabajadores(val)
  }

  const canGoNext = () => {
    if (step === 0) return selectedSector !== null
    if (step === 1) return selectedProcesses.length > 0
    if (step === 2) return activeFormats.length > 0
    if (step === 3) {
      return (
        razonSocial.trim() !== "" &&
        nit.trim() !== "" &&
        numTrabajadores !== "" &&
        responsableNombre.trim() !== "" &&
        responsableCargo.trim() !== ""
      )
    }
    return true
  }

  const handleNextStep = () => {
    if (!canGoNext()) return
    setStep(prev => prev + 1)
  }

  const handleBackStep = () => {
    setStep(prev => prev - 1)
  }

  // Explicit Save to Firestore Trigger
  const handleSaveData = async () => {
    if (!user) {
      setLeadModalReason("download_limit")
      setIsLeadModalOpen(true)
      return
    }
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      if (db) {
        await setDoc(doc(db, "leads_calidad", user.uid), {
          fileCambios,
          fileProveedores,
          fileSatisfaccion,
          fileInfoDoc,
          nombre: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          razonSocial,
          nit,
          trabajadores: numTrabajadores || 0,
          responsableNombre,
          responsableCargo,
          sector: selectedSector?.id || "",
          sectorNombre: selectedSector?.name || "",
          procesos: selectedProcesses,
          timestamp: new Date()
        }, { merge: true })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (e) {
      console.error("Error saving document data to Firestore:", e)
      setLoginError("No se pudieron sincronizar los cambios en la nube. Revisa tus permisos.")
    } finally {
      setIsSaving(false)
    }
  }

  // Google Sign-In helper
  const handleGoogleLogin = async () => {
    if (!auth) {
      setLoginError("Firebase no está configurado correctamente en el entorno local.")
      return
    }

    setIsGoogleSigningIn(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const currentUser = result.user
      
      if (db) {
        try {
          await setDoc(doc(db, "leads_calidad", currentUser.uid), {
            nombre: currentUser.displayName || "",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            razonSocial: razonSocial || "",
            nit: nit || "",
            trabajadores: numTrabajadores || 0,
            responsableNombre: responsableNombre || "",
            responsableCargo: responsableCargo || "",
            sector: selectedSector?.id || "",
            sectorNombre: selectedSector?.name || "",
            procesos: selectedProcesses,
            timestamp: new Date()
          }, { merge: true })
        } catch (firestoreError) {
          console.error("Error writing user lead to Firestore (Verify security rules for leads_calidad):", firestoreError)
        }
      }
      setIsLeadModalOpen(false)
    } catch (err: any) {
      console.error("Google Auth Error:", err)
      if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user")) {
        setLoginError("El inicio de sesión fue cancelado por el usuario.")
      } else {
        setLoginError("Error interno al autenticar con Google. Inténtalo de nuevo.")
      }
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      if (activeFormats.length > 1) {
        setActiveFormats([activeFormats[0]])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePrint = () => {
    if (!user) {
      setLeadModalReason("download_limit")
      setIsLeadModalOpen(true)
      return
    }
    window.print()
  }

  const getSectorIcon = (id: string) => {
    switch (id) {
      case "software": return <Briefcase className="w-6 h-6" />
      case "manufactura": return <Settings className="w-6 h-6" />
      case "servicios": return <Truck className="w-6 h-6" />
      case "educacion": return <GraduationCap className="w-6 h-6" />
      default: return <Briefcase className="w-6 h-6" />
    }
  }

  const formattedToday = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return today.toLocaleDateString('es-ES', options)
  }

  // Toggle selected processes in Paso 1
  const toggleProcess = (pid: string) => {
    setSelectedProcesses(prev => 
      prev.includes(pid) 
        ? prev.filter(id => id !== pid)
        : [...prev, pid]
    )
  }

  const stepsInfo = [
    { label: "Enfoque", icon: <Award className="w-4 h-4" /> },
    { label: "Mapa Procesos", icon: <Building className="w-4 h-4" /> },
    { label: "Formatos", icon: <FileCheck className="w-4 h-4" /> },
    { label: "Datos Empresa", icon: <UserCheck className="w-4 h-4" /> },
    { label: "Vista Previa", icon: <FileText className="w-4 h-4" /> }
  ]

  // Calculated page counts: 1 page for policy, and 2 pages for each active format (1 format page + 1 instructivo page)
  const totalPages = activeFormats.length * 2 + 1

  return (
    <div className="min-h-screen bg-slate-50 text-[#264164] font-sans selection:bg-[#457bb3] selection:text-white pb-12 overflow-x-hidden relative">
      
      {/* Toast Error Notification */}
      <AnimatePresence>
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md">
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
                className="text-slate-400 hover:text-slate-655 transition-colors p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS print stylesheet for isolating A4 sheets consecutively */}
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
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .a4-page {
            page-break-before: always !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            background: white !important;
          }
          .a4-page:first-of-type {
            page-break-before: avoid !important;
          }
          input::placeholder {
            color: transparent !important;
          }
        }
      `}} />

      <Header />

      {/* Hero section */}
      <section className="relative overflow-hidden pt-32 pb-10 px-6 text-center bg-[#f9fafc] border-b border-slate-200/40 no-print">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-[#264164]/5 to-[#457bb3]/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10 space-y-4">
          <span className="px-3.5 py-1 bg-[#264164]/5 border border-[#264164]/10 rounded-full text-xs font-bold text-[#264164] inline-flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#457bb3]" /> Herramienta de Modelado SGC
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Asistente Inteligente de <span className="bg-gradient-to-r from-[#264164] to-[#457bb3] bg-clip-text text-transparent">SGC ISO 9001</span>
          </h1>
          <p className="mt-4 text-slate-655 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Estructura el mapa de procesos de tu organización, define la política corporativa y genera de forma automática los formatos e instructivos de control exigidos por la norma ISO 9001:2015.
          </p>
        </div>
      </section>

      {/* Interactive Step-by-Step progress tracker */}
      <section className="max-w-3xl mx-auto px-6 mt-12 mb-8 no-print wizard-header">
        <div className="flex justify-between items-center relative after:absolute after:top-4.5 after:left-0 after:right-0 after:h-0.5 after:bg-slate-200 after:z-0">
          {stepsInfo.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center z-10 w-1/5">
              <button
                type="button"
                onClick={() => {
                  if (idx < step) setStep(idx)
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
              <span className={`text-[9px] md:text-xs font-bold mt-2 text-center leading-tight ${idx <= step ? "text-[#264164] font-extrabold" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Auth status bar inside tools */}
        <div className="mt-8 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[#264164]">
              {user ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-10 h-10 rounded-full" />
              ) : (
                <Lock className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                {user ? `Sesión iniciada: ${user.displayName}` : "Sesión Libre / Modo Invitado"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                {user 
                  ? "Tienes acceso completo. Puedes generar formatos de control con sus instructivos de forma ilimitada." 
                  : "Modo invitado limitado a 1 solo formato con su instructivo y previsualización en pantalla."}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            {isAuthLoading ? (
              <span className="text-xs text-slate-400">Verificando...</span>
            ) : user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-red-655 hover:text-red-800 transition-colors border border-red-200/50 hover:bg-red-50/50 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLeadModalReason("multi_formats")
                  setIsLeadModalOpen(true)
                }}
                className="text-xs font-bold bg-[#264164] text-white hover:bg-[#1e324e] transition-all px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <span>Acceso Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main wizard component card */}
      {step < 4 && (
        <section className="bg-white border border-slate-200/85 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-[0_8px_30px_rgba(38,65,100,0.03)] text-slate-800 no-print">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* STEP 0: economical sectors & Strategic Focus */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#457bb3]" />
                      Paso 0: Enfoque Estratégico
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecciona el core de negocio o propósito principal de tu organización para orientar estratégicamente el SGC.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SECTORS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSector(s)}
                        className={`p-5 rounded-2xl text-left border transition-all duration-300 flex flex-col h-full group relative cursor-pointer ${
                          selectedSector?.id === s.id
                            ? "border-[#264164] bg-[#264164]/5 shadow-sm ring-2 ring-[#264164]/20"
                            : "border-slate-200 bg-white hover:border-[#457bb3]/50 hover:bg-slate-50/50 hover:shadow-sm"
                        }`}
                        id={`sector-option-${s.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            selectedSector?.id === s.id 
                              ? "bg-[#264164] text-white" 
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}>
                            {getSectorIcon(s.id)}
                          </div>
                          <div>
                            <span className="block font-black text-sm text-slate-900 group-hover:text-[#264164]">{s.name}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-3 flex-1 leading-relaxed">
                          {s.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedSector && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-[#264164] tracking-wider block">Diagnóstico de Enfoque SGC</span>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 rounded-full">Recomendado</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-700">
                          <strong className="text-[#264164]">Enfoque Estratégico:</strong> {selectedSector.strategicFocus}
                        </p>
                        <p className="text-xs text-slate-700">
                          <strong className="text-[#264164]">Pilar Requerido ISO 9001:</strong> {selectedSector.isoPillar}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* STEP 1: Process Mapping */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#457bb3]" />
                      Paso 1: Mapeo de Procesos
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Configura el mapa de procesos de tu organización seleccionando los aplicables según los 3 bloques normativos.
                    </p>
                  </div>

                  {/* Category Sections */}
                  {["estrategico", "misional", "apoyo"].map((category) => {
                    const categoryTitle = 
                      category === "estrategico" ? "Procesos Estratégicos (Revisión y Planificación)" :
                      category === "misional" ? "Procesos Misionales / Operativos (Core de Negocio)" :
                      "Procesos de Apoyo / Soporte (Recursos y Sistemas)"
                    
                    const filtered = PROCESSES.filter(p => p.category === category)

                    return (
                      <div key={category} className="space-y-3 pt-2">
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider border-b border-slate-100 pb-1.5">
                          {categoryTitle}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filtered.map((proc) => {
                            const isSelected = selectedProcesses.includes(proc.id)
                            return (
                              <button
                                key={proc.id}
                                type="button"
                                onClick={() => toggleProcess(proc.id)}
                                className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 cursor-pointer ${
                                  isSelected
                                    ? "border-[#264164] bg-[#264164]/5 shadow-sm"
                                    : "border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300"
                                }`}
                                id={`process-option-${proc.id}`}
                              >
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-[#264164] border-[#264164] text-white" : "border-slate-300 bg-white"
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                  <span className="block font-black text-xs text-slate-900">{proc.name}</span>
                                  <span className="block text-[10px] text-slate-500 mt-1 leading-normal">{proc.description}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* STEP 2: Format & Instructivo Selector */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-[#457bb3]" />
                        Paso 2: Formatos e Instructivos de Control
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Asocia a cada proceso su formato oficial. Cada uno generará de forma automática su respectivo instructivo de llenado.
                      </p>
                    </div>

                    {!user && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 rounded-full inline-flex items-center gap-1 shrink-0 self-start sm:self-center">
                        <Lock className="w-3 h-3" /> Límite Libre: 1 Formato + Instructivo
                      </span>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                    {selectedProcesses.map(pid => {
                      const proc = PROCESSES.find(p => p.id === pid)
                      if (!proc) return null
                      const isFormatActive = activeFormats.includes(pid)
                      const currentFormatVal = processFormats[pid] || proc.defaultFormat

                      return (
                        <div key={pid} className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isFormatActive ? "bg-slate-50/50" : "bg-white"
                        }`}>
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleFormatActive(pid)}
                              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                  isFormatActive ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-300 bg-white"
                              }`}
                              id={`format-toggle-${pid}`}
                            >
                              {isFormatActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            
                            <div>
                              <span className="block font-black text-xs text-slate-900">{proc.name}</span>
                              <span className="block text-[10px] text-slate-400 uppercase mt-0.5 font-bold tracking-wide">
                                Categoria: {proc.category} ➔ Incluye Instructivo de Llenado
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <label htmlFor={`format-select-${pid}`} className="sr-only">Seleccionar formato</label>
                            <select
                              id={`format-select-${pid}`}
                              disabled={!isFormatActive}
                              value={currentFormatVal}
                              onChange={(e) => handleFormatTypeChange(pid, e.target.value)}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-40 focus:outline-none focus:border-[#457bb3]"
                            >
                              {FORMAT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name} ({opt.chapter})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Company General & Representative Details */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-[#457bb3]" />
                      Paso 3: Información de la Empresa
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Completa los datos formales para inyectarlos en el membrete y el bloque de firmas autorizadas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="razon-social-input" className="text-xs font-bold text-slate-700 block">Razón Social de la Empresa</label>
                      <input
                        id="razon-social-input"
                        type="text"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        placeholder="Nombre oficial corporativo"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] focus:ring-1 focus:ring-[#457bb3] transition-all text-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="nit-input" className="text-xs font-bold text-slate-700 block">NIT (Con dígito de verificación)</label>
                      <input
                        id="nit-input"
                        type="text"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="Ej: 901.234.567-8"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] focus:ring-1 focus:ring-[#457bb3] transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="trabajadores-input" className="text-xs font-bold text-slate-700 block">Nº de Trabajadores</label>
                      <input
                        id="trabajadores-input"
                        type="number"
                        min="1"
                        value={numTrabajadores}
                        onChange={(e) => handleWorkersChange(parseInt(e.target.value) || "")}
                        placeholder="Ej: 15"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] focus:ring-1 focus:ring-[#457bb3] transition-all text-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="responsable-input" className="text-xs font-bold text-slate-700 block">Representante de Calidad</label>
                      <input
                        id="responsable-input"
                        type="text"
                        value={responsableNombre}
                        onChange={(e) => setResponsableNombre(e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] focus:ring-1 focus:ring-[#457bb3] transition-all text-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="cargo-input" className="text-xs font-bold text-slate-700 block">Cargo del Responsable</label>
                      <input
                        id="cargo-input"
                        type="text"
                        value={responsableCargo}
                        onChange={(e) => setResponsableCargo(e.target.value)}
                        placeholder="Ej: Gerente General / Lider de Calidad"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#457bb3] focus:ring-1 focus:ring-[#457bb3] transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Nav Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 wizard-controls">
                <button
                  type="button"
                  onClick={handleBackStep}
                  disabled={step === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    step === 0
                      ? "text-slate-300 pointer-events-none"
                      : "text-slate-655 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canGoNext()}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    canGoNext()
                      ? "bg-[#264164] hover:bg-[#1e324e] hover:scale-[1.02]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* STEP 4: Documents Multi-Page Preview & Print Area */}
      {step === 4 && (
        <section className="max-w-4xl mx-auto px-6 space-y-8 animate-fade-in">
          
          {/* Action Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm no-print">
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                Diseño SGC Generado Correctamente
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Sube tus documentos diligenciados (evidencias) en la consola de archivos para indexarlos y guárdalos en la nube de forma segura.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Editar Datos
              </button>

              <button
                type="button"
                onClick={handleSaveData}
                disabled={isSaving}
                className={`px-4 py-2.5 text-xs font-bold border rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  saveSuccess 
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#457bb3]" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                ) : (
                  <Cloud className="w-4 h-4 text-[#457bb3]" />
                )}
                <span>{isSaving ? "Guardando..." : saveSuccess ? "Sincronizado" : "Guardar en Nube"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4.5 py-2.5 text-xs font-black text-white bg-[#264164] hover:bg-[#1e324e] rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Descargar</span>
              </button>
            </div>
          </div>

          {/* SGC Admin Console (no-print) */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl no-print space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black flex items-center gap-2 text-white uppercase tracking-wider">
                  <Settings className="w-4.5 h-4.5 text-indigo-400" />
                  Consola de Archivos SGC (Auditoría)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Visualiza tus registros de calidad indexados y sube tus documentos diligenciados para la certificación ISO 9001:2015.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-800/80 px-3 py-1.5 rounded-xl text-emerald-400 text-[10px] font-bold font-mono">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>NUBE SINCRONIZADA</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-800/80 px-3 py-1.5 rounded-xl text-amber-400 text-[10px] font-bold font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>ALMACENAMIENTO LOCAL (LS)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setConsoleTab("overview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  consoleTab === "overview"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                📊 Vista General SGC
              </button>
              
              {(() => {
                const activeFormats = selectedProcesses.map(pid => {
                  const proc = PROCESSES.find(p => p.id === pid)
                  const formatId = processFormats[pid] || proc?.defaultFormat || "info_documentada"
                  return { pid, procName: proc?.name || "", formatId }
                })
                const uniqueFormats = Array.from(new Map(activeFormats.map(item => [item.formatId, item])).values())
                
                return uniqueFormats.map(item => {
                  const label = 
                    item.formatId === "control_cambios" ? "📁 Control de Cambios" :
                    item.formatId === "evaluacion_proveedores" ? "📁 Evaluación Proveedores" :
                    item.formatId === "satisfaccion_cliente" ? "📁 Satisfacción y PQRS" :
                    "📁 Control Documental"
                  
                  return (
                    <button
                      key={item.formatId}
                      type="button"
                      onClick={() => setConsoleTab(item.formatId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        consoleTab === item.formatId
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })
              })()}
            </div>

            {/* Tab Contents */}
            {consoleTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Storage Info */}
                <div className="space-y-4">
                  <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-350">Evidencias Cargadas en el Sistema</h5>
                    <div className="text-xs space-y-2.5 text-slate-400">
                      <div className="flex items-center justify-between border-b border-slate-800/65 pb-1">
                        <span className="font-bold text-slate-300">SGC-FOR-08 Control de Cambios:</span>
                        <span className={fileCambios ? "text-emerald-400 font-bold" : "text-amber-500 font-medium"}>
                          {fileCambios ? `✓ Cargado (${fileCambios.name})` : "Pendiente de Carga"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-800/65 pb-1">
                        <span className="font-bold text-slate-300">SGC-FOR-12 Evaluación Proveedores:</span>
                        <span className={fileProveedores ? "text-emerald-400 font-bold" : "text-amber-500 font-medium"}>
                          {fileProveedores ? `✓ Cargado (${fileProveedores.name})` : "Pendiente de Carga"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-800/65 pb-1">
                        <span className="font-bold text-slate-300">SGC-FOR-15 Satisfacción y PQRS:</span>
                        <span className={fileSatisfaccion ? "text-emerald-400 font-bold" : "text-amber-500 font-medium"}>
                          {fileSatisfaccion ? `✓ Cargado (${fileSatisfaccion.name})` : "Pendiente de Carga"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-800/65 pb-1">
                        <span className="font-bold text-slate-300">SGC-FOR-18 Control Documental:</span>
                        <span className={fileInfoDoc ? "text-emerald-400 font-bold" : "text-amber-500 font-medium"}>
                          {fileInfoDoc ? `✓ Cargado (${fileInfoDoc.name})` : "Pendiente de Carga"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleLoadDemoFiles()}
                      className="px-4 py-2 bg-indigo-900/40 hover:bg-indigo-950 text-indigo-300 border border-indigo-700/60 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cargar Archivos de Demostración</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearFiles()}
                      className="px-4 py-2 bg-rose-950/40 hover:bg-rose-950 text-rose-300 border border-rose-800/60 hover:border-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpiar Repositorio</span>
                    </button>
                  </div>
                </div>

                {/* Cloud & Local Storage JSON representation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-350">Metadata del SGC (Base64 Indexado en Nube)</h5>
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify({
                          razonSocial,
                          nit,
                          trabajadores: numTrabajadores,
                          responsableNombre,
                          responsableCargo,
                          sector: selectedSector?.id,
                          procesos: selectedProcesses,
                          fileCambios: fileCambios ? { name: fileCambios.name, size: fileCambios.size } : null,
                          fileProveedores: fileProveedores ? { name: fileProveedores.name, size: fileProveedores.size } : null,
                          fileSatisfaccion: fileSatisfaccion ? { name: fileSatisfaccion.name, size: fileSatisfaccion.size } : null,
                          fileInfoDoc: fileInfoDoc ? { name: fileInfoDoc.name, size: fileInfoDoc.size } : null,
                        }, null, 2)
                        navigator.clipboard.writeText(jsonStr)
                        alert("¡Metadata copiada al portapapeles!")
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold font-mono cursor-pointer"
                    >
                      Copiar Metadata
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-y-auto text-[10px] text-emerald-400 font-mono p-3 bg-slate-950 rounded-xl border border-slate-800/80 leading-normal scrollbar-thin">
                    {JSON.stringify({
                      razonSocial,
                      nit,
                      trabajadores: numTrabajadores,
                      responsableNombre,
                      responsableCargo,
                      sector: selectedSector?.id,
                      procesos: selectedProcesses,
                      fileCambios,
                      fileProveedores,
                      fileSatisfaccion,
                      fileInfoDoc
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Editable Tables in Console */}
            {consoleTab === "control_cambios" && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                      Control de Cambios y Entregables de Software (SGC-FOR-08)
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Requisito del SGC alineado con el <strong className="text-indigo-400">Capítulo 8.3 y 8.5.6</strong> de la norma ISO 9001:2015.
                    </p>
                  </div>
                  {fileCambios && (
                    <button
                      type="button"
                      onClick={() => handleFileDelete("control_cambios")}
                      className="text-[10px] text-rose-450 hover:text-rose-400 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Registro</span>
                    </button>
                  )}
                </div>

                {fileCambios ? (
                  <div className="bg-slate-950/45 border border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">{fileCambios.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {fileCambios.size} KB • Cargado el {fileCambios.uploadedAt} • Sincronizado en la nube
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileDownload(fileCambios)}
                      className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-950 text-indigo-300 border border-indigo-800/60 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Archivo</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-950/20 hover:bg-slate-950/45 transition-all p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-200">
                          Haz clic para seleccionar o arrastra tu archivo aquí
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Formatos válidos: PDF, Excel (.xlsx, .xls, .csv), Word (.docx) o imágenes.<br />
                          Límite máximo para la nube: <strong className="text-slate-400">800 KB</strong>.
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("control_cambios", file)
                      }}
                    />
                  </label>
                )}

                <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-450 font-bold block uppercase tracking-wider">Instructivo Operacional (Resumen)</span>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Objetivo:</strong> Registrar de forma controlada todas las modificaciones, despliegues y pruebas de código realizados sobre las aplicaciones tecnológicas.
                  </p>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Responsable:</strong> Líder de DevOps / Ingeniería.
                  </p>
                </div>
              </div>
            )}

            {consoleTab === "evaluacion_proveedores" && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                      Evaluación y Reatestando de Proveedores (SGC-FOR-12)
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Requisito del SGC alineado con el <strong className="text-indigo-400">Capítulo 8.4</strong> de la norma ISO 9001:2015.
                    </p>
                  </div>
                  {fileProveedores && (
                    <button
                      type="button"
                      onClick={() => handleFileDelete("evaluacion_proveedores")}
                      className="text-[10px] text-rose-450 hover:text-rose-400 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Registro</span>
                    </button>
                  )}
                </div>

                {fileProveedores ? (
                  <div className="bg-slate-950/45 border border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">{fileProveedores.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {fileProveedores.size} KB • Cargado el {fileProveedores.uploadedAt} • Sincronizado en la nube
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileDownload(fileProveedores)}
                      className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-950 text-indigo-300 border border-indigo-800/60 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Archivo</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-950/20 hover:bg-slate-950/45 transition-all p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-200">
                          Haz clic para seleccionar o arrastra tu archivo aquí
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Formatos válidos: PDF, Excel (.xlsx, .xls, .csv), Word (.docx) o imágenes.<br />
                          Límite máximo para la nube: <strong className="text-slate-400">800 KB</strong>.
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("evaluacion_proveedores", file)
                      }}
                    />
                  </label>
                )}

                <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-450 font-bold block uppercase tracking-wider">Instructivo Operacional (Resumen)</span>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Objetivo:</strong> Evaluar y reevaluar anualmente el desempeño técnico, calidad y cumplimiento de los proveedores críticos del negocio.
                  </p>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Responsable:</strong> Coordinador de Compras y Logística.
                  </p>
                </div>
              </div>
            )}

            {consoleTab === "satisfaccion_cliente" && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                      Encuestas de Satisfacción y PQRS (SGC-FOR-15)
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Requisito del SGC alineado con el <strong className="text-indigo-400">Capítulo 8.2.1 y 8.5</strong> de la norma ISO 9001:2015.
                    </p>
                  </div>
                  {fileSatisfaccion && (
                    <button
                      type="button"
                      onClick={() => handleFileDelete("satisfaccion_cliente")}
                      className="text-[10px] text-rose-450 hover:text-rose-400 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Registro</span>
                    </button>
                  )}
                </div>

                {fileSatisfaccion ? (
                  <div className="bg-slate-950/45 border border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">{fileSatisfaccion.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {fileSatisfaccion.size} KB • Cargado el {fileSatisfaccion.uploadedAt} • Sincronizado en la nube
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileDownload(fileSatisfaccion)}
                      className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-950 text-indigo-300 border border-indigo-800/60 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Archivo</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-950/20 hover:bg-slate-950/45 transition-all p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-200">
                          Haz clic para seleccionar o arrastra tu archivo aquí
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Formatos válidos: PDF, Excel (.xlsx, .xls, .csv), Word (.docx) o imágenes.<br />
                          Límite máximo para la nube: <strong className="text-slate-400">800 KB</strong>.
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("satisfaccion_cliente", file)
                      }}
                    />
                  </label>
                )}

                <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-450 font-bold block uppercase tracking-wider">Instructivo Operacional (Resumen)</span>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Objetivo:</strong> Consolidar y dar respuesta a las quejas, reclamos, peticiones y encuestas anuales de satisfacción enviadas por los clientes.
                  </p>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Responsable:</strong> Líder de Soporte y Relación al Cliente.
                  </p>
                </div>
              </div>
            )}

            {consoleTab === "info_documentada" && (
              <div className="space-y-5 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-200 uppercase tracking-wide">
                      Listado Maestro de Información Documentada (SGC-FOR-18)
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Requisito del SGC alineado con el <strong className="text-indigo-400">Capítulo 7.5</strong> de la norma ISO 9001:2015.
                    </p>
                  </div>
                  {fileInfoDoc && (
                    <button
                      type="button"
                      onClick={() => handleFileDelete("info_documentada")}
                      className="text-[10px] text-rose-450 hover:text-rose-400 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Registro</span>
                    </button>
                  )}
                </div>

                {fileInfoDoc ? (
                  <div className="bg-slate-950/45 border border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">{fileInfoDoc.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {fileInfoDoc.size} KB • Cargado el {fileInfoDoc.uploadedAt} • Sincronizado en la nube
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileDownload(fileInfoDoc)}
                      className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-950 text-indigo-300 border border-indigo-800/60 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Archivo</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-950/20 hover:bg-slate-950/45 transition-all p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-200">
                          Haz clic para seleccionar o arrastra tu archivo aquí
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Formatos válidos: PDF, Excel (.xlsx, .xls, .csv), Word (.docx) o imágenes.<br />
                          Límite máximo para la nube: <strong className="text-slate-400">800 KB</strong>.
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("info_documentada", file)
                      }}
                    />
                  </label>
                )}

                <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-450 font-bold block uppercase tracking-wider">Instructivo Operacional (Resumen)</span>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Objetivo:</strong> Mantener al día la matriz con la codificación oficial, tipo de documento, versión y fechas de vigencia de todo el SGC.
                  </p>
                  <p className="text-[11px] text-slate-350 leading-relaxed">
                    <strong>Responsable:</strong> Director / Representante de Calidad.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MULTI-PAGE PRINT CANVAS */}
          <div className="print-area space-y-12">
            
            {/* PAGE 1: QUALITY POLICY */}
            <div className="bg-white border border-slate-250/90 rounded-none shadow-[0_15px_45px_rgba(0,0,0,0.06)] p-12 max-w-[210mm] min-h-[297mm] mx-auto text-slate-800 text-justify flex flex-col justify-between font-serif relative a4-page">
              <div>
                {/* Header Grid */}
                <div className="border-2 border-slate-800 p-4 grid grid-cols-3 items-center text-center gap-4 text-xs font-sans font-bold mb-8">
                  <div className="flex flex-col items-center justify-center border-r border-slate-800 h-full py-2">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">ORGANIZACIÓN</span>
                    <span className="text-xs text-slate-700 tracking-tight font-black uppercase mt-1">{razonSocial || "Nombre Empresa"}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center border-r border-slate-800 h-full py-2">
                    <span className="text-[12px] text-slate-900 block font-black leading-tight">SISTEMA DE GESTIÓN DE LA CALIDAD</span>
                    <span className="text-[9px] text-slate-600 block mt-1 tracking-wide">DOCUMENTACIÓN ISO 9001:2015</span>
                  </div>

                  <div className="text-[9px] space-y-1 text-left pl-4 h-full flex flex-col justify-center font-mono">
                    <p><span className="text-slate-500 font-bold font-sans">CÓDIGO:</span> SGC-POL-01</p>
                    <p><span className="text-slate-500 font-bold font-sans">VERSIÓN:</span> 01</p>
                    <p><span className="text-slate-500 font-bold font-sans">FECHA:</span> {formattedToday()}</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center my-6">
                  <h2 className="text-md font-black tracking-tight text-slate-900 uppercase font-sans border-b border-slate-850 pb-2 inline-block">
                    POLÍTICA DE CALIDAD DEL SGC
                  </h2>
                </div>

                {/* Content */}
                <div className="space-y-5 text-[12px] leading-relaxed text-slate-800 font-serif">
                  <p>
                    En <strong>{razonSocial || "LA EMPRESA"}</strong>, identificada con NIT <strong>{nit || "C.C. / NIT"}</strong>, asumimos el compromiso inquebrantable de establecer, documentar y mejorar continuamente la eficacia de nuestro Sistema de Gestión de la Calidad (SGC), en plena conformidad con las directrices internacionales definidas por la norma <strong>ISO 9001:2015</strong>.
                  </p>

                  <p>
                    Como organización perteneciente al sector de <strong>{selectedSector?.name || "Operaciones Especializadas"}</strong>, orientamos estratégicamente nuestros procesos misionales bajo el enfoque de <strong>{selectedSector?.strategicFocus || "la excelencia operativa y satisfacción del cliente"}</strong>. Para garantizar esto, concentramos esfuerzos técnicos en {selectedSector?.policyFocusText || "el control de calidad de las operaciones y el incremento sistemático de los estándares comerciales del servicio"}.
                  </p>

                  <p>
                    En cumplimiento de la sección <strong>5.2 (Política de Calidad)</strong> de la norma ISO 9001:2015, declaramos los siguientes compromisos corporativos:
                  </p>

                  <ol className="list-decimal pl-6 space-y-3 font-sans text-xs">
                    <li className="leading-relaxed">
                      <strong>Cumplimiento de Requisitos Aplicables:</strong> Asegurar que todos los productos y servicios suministrados cumplan estrictamente con los requisitos especificados por el cliente, los parámetros reglamentarios y los marcos legales vigentes.
                    </li>
                    <li className="leading-relaxed">
                      <strong>Mejora Continua del SGC:</strong> Promover una cultura de optimización basada en la evaluación del desempeño, auditorías internas periódicas y la toma de decisiones informadas a partir de datos objetivos.
                    </li>
                    <li className="leading-relaxed">
                      <strong>Competencia y Bienestar Organizacional:</strong> Garantizar que el personal involucrado en los procesos estratégicos, misionales y de apoyo posea la competencia requerida, fomentando su entrenamiento continuo.
                    </li>
                  </ol>

                  <p>
                    Esta política sirve como marco formal para establecer y revisar los objetivos de calidad. Es comunicada y entendida dentro de la empresa, y se encuentra a disposición de las partes interesadas pertinentes.
                  </p>
                </div>
              </div>

              {/* Page Footer & Authorization Signatures */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans">
                  
                  {/* Signature Representative */}
                  <div className="space-y-4">
                    <div className="h-12 flex items-end justify-center">
                      <span className="w-40 border-b border-slate-800" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-slate-900 uppercase">{responsableNombre || "Representante de Calidad"}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{responsableCargo || "Cargo"}</p>
                      <p className="text-[10px] font-mono text-slate-400">Firmado para Aprobación SGC</p>
                    </div>
                  </div>

                  {/* High Management */}
                  <div className="space-y-4">
                    <div className="h-12 flex items-end justify-center">
                      <span className="w-40 border-b border-slate-800" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-slate-900 uppercase">ALTA DIRECCIÓN</p>
                      <p className="text-[10px] text-slate-500 uppercase">{razonSocial || "Empresa"}</p>
                      <p className="text-[10px] font-mono text-slate-400">Revisado y Autorizado</p>
                    </div>
                  </div>

                </div>

                <div className="mt-10 text-center text-[9px] text-slate-400 font-sans tracking-wide space-y-1">
                  <p>Este documento es propiedad de {razonSocial || "la organización"}. Prohibida su copia no autorizada.</p>
                  <p>Página 1 de {totalPages} — Políticas y Diseños de Control SGC ISO 9001:2015</p>
                </div>
              </div>
            </div>

            {/* HOJAS SIGUIENTES: FORMATOS Y LUEGO INSTRUCTIVOS */}
            {activeFormats.map((pid, idx) => {
              const proc = PROCESSES.find(p => p.id === pid)
              if (!proc) return null
              const formatId = processFormats[pid] || proc.defaultFormat
              const formatTitle = 
                formatId === "control_cambios" ? "FORMATO DE CONTROL DE CAMBIOS Y ENTREGABLES" :
                formatId === "evaluacion_proveedores" ? "FORMATO DE EVALUACIÓN Y REATESTANDO DE PROVEEDORES" :
                formatId === "satisfaccion_cliente" ? "ENCUESTA DE SATISFACCIÓN Y GESTIÓN DE QUEJAS" :
                "CONTROL DE INFORMACIÓN DOCUMENTADA"

              const formatCode = 
                formatId === "control_cambios" ? "SGC-FOR-08" :
                formatId === "evaluacion_proveedores" ? "SGC-FOR-12" :
                formatId === "satisfaccion_cliente" ? "SGC-FOR-15" :
                "SGC-FOR-02"

              const instructivoCode = 
                formatId === "control_cambios" ? "SGC-INS-08" :
                formatId === "evaluacion_proveedores" ? "SGC-INS-12" :
                formatId === "satisfaccion_cliente" ? "SGC-INS-15" :
                "SGC-INS-02"

              const instructivoTitle = 
                formatId === "control_cambios" ? "INSTRUCTIVO DE CONTROL DE CAMBIOS DE SOFTWARE" :
                formatId === "evaluacion_proveedores" ? "INSTRUCTIVO PARA EVALUACIÓN DE PROVEEDORES" :
                formatId === "satisfaccion_cliente" ? "INSTRUCTIVO DE SATISFACCIÓN Y GESTIÓN DE PQRS" :
                "INSTRUCTIVO DE CONTROL DE INFORMACIÓN DOCUMENTADA"

              const formatPageNum = idx * 2 + 2
              const instructivoPageNum = idx * 2 + 3

              return (
                <React.Fragment key={pid}>
                  
                  {/* SHEET: THE EDITABLE FORMAT */}
                  <div className="bg-white border border-slate-250/90 rounded-none shadow-[0_15px_45px_rgba(0,0,0,0.06)] p-12 max-w-[210mm] min-h-[297mm] mx-auto text-slate-800 flex flex-col justify-between font-serif relative a4-page">
                    <div>
                      {/* Header Grid */}
                      <div className="border-2 border-slate-800 p-4 grid grid-cols-3 items-center text-center gap-4 text-xs font-sans font-bold mb-8">
                        <div className="flex flex-col items-center justify-center border-r border-slate-800 h-full py-2">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">ORGANIZACIÓN</span>
                          <span className="text-xs text-slate-700 tracking-tight font-black uppercase mt-1">{razonSocial || "Nombre Empresa"}</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center border-r border-slate-800 h-full py-2">
                          <span className="text-[12px] text-slate-900 block font-black leading-tight">SISTEMA DE GESTIÓN DE LA CALIDAD</span>
                          <span className="text-[9px] text-slate-600 block mt-1 tracking-wide">FORMATO DE CONTROL REGULATORIO</span>
                        </div>

                        <div className="text-[9px] space-y-1 text-left pl-4 h-full flex flex-col justify-center font-mono">
                          <p><span className="text-slate-500 font-bold font-sans">CÓDIGO:</span> {formatCode}</p>
                          <p><span className="text-slate-500 font-bold font-sans">VERSIÓN:</span> 01</p>
                          <p><span className="text-slate-500 font-bold font-sans">FECHA:</span> {formattedToday()}</p>
                        </div>
                      </div>

                      {/* Format Title */}
                      <div className="text-center my-4 font-sans">
                        <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase border-b border-slate-850 pb-2 inline-block">
                          {formatTitle}
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          Proceso Asociado: {proc.name} (Registro de Evidencia)
                        </p>
                      </div>

                      {/* Tables replaced by Record Certification Cards */}
                      <div className="mt-6 font-sans">
                        {(() => {
                          const uploadedFile = 
                            formatId === "control_cambios" ? fileCambios :
                            formatId === "evaluacion_proveedores" ? fileProveedores :
                            formatId === "satisfaccion_cliente" ? fileSatisfaccion :
                            fileInfoDoc
                          
                          const formatDescription = 
                            formatId === "control_cambios" ? "Registro requerido bajo el Capítulo 8.3 y 8.5.6 de la norma ISO 9001:2015 para vigilar las alteraciones de código, aprobaciones y entrega segura de software." :
                            formatId === "evaluacion_proveedores" ? "Registro de control bajo el Capítulo 8.4 para homologar y reevaluar anualmente el desempeño de contratistas externos y proveedores." :
                            formatId === "satisfaccion_cliente" ? "Registro de control para el Capítulo 9.1.2, diseñado para registrar quejas formales y hacer seguimiento a su cierre definitivo." :
                            "Matriz general exigida en el Capítulo 7.5 de la norma ISO 9001:2015 para llevar el control de versiones vigentes y códigos."
                          
                          return (
                            <div className="space-y-4">
                              <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
                                {formatDescription}
                              </p>

                              <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-4 my-8 font-sans">
                                <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Estado del Registro (Capítulo 7.5.3)</span>
                                  {uploadedFile ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-250">
                                      ✓ REGISTRO ACTIVO E INDEXADO
                                    </span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse border border-amber-250">
                                      ⚠️ PENDIENTE DE CARGA
                                    </span>
                                  )}
                                </div>

                                {uploadedFile ? (
                                  <div className="space-y-3 text-[11px] text-slate-700 leading-normal text-left">
                                    <p>
                                      <span className="font-bold text-slate-900">Nombre de Archivo:</span> {uploadedFile.name}
                                    </p>
                                    <p>
                                      <span className="font-bold text-slate-900">Tamaño del Registro:</span> {uploadedFile.size} KB
                                    </p>
                                    <p>
                                      <span className="font-bold text-slate-900">Fecha de Carga e Indexación:</span> {uploadedFile.uploadedAt}
                                    </p>
                                    <p>
                                      <span className="font-bold text-slate-900">Tipo de Documento:</span> {uploadedFile.type || "Desconocido"}
                                    </p>
                                    <p>
                                      <span className="font-bold text-slate-900">Ubicación de Control:</span> Repositorio Central de Evidencias (SGC Cloud/Firestore).
                                    </p>
                                    <p className="italic text-slate-500 text-[10px] mt-3 pt-2 border-t border-slate-200">
                                      Nota: La evidencia ha sido verificada y archivada digitalmente bajo los controles de seguridad y retención estipulados en el manual del SGC.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed text-left">
                                    <p className="font-bold text-slate-900">Advertencia de Auditoría de Calidad:</p>
                                    <p>
                                      No se ha detectado ningún archivo cargado para este formato de control en el sistema. Para cumplir con los requisitos de la auditoría interna/externa de la norma ISO 9001:2015:
                                    </p>
                                    <ol className="list-decimal pl-5 space-y-1 mt-1 text-[10px]">
                                      <li>Descargue la plantilla correspondiente de su organización o guíese por el instructivo operacional adjunto.</li>
                                      <li>Diligencie el registro en su totalidad con los datos operacionales reales de la empresa.</li>
                                      <li>Cargue el archivo firmado (PDF, Excel o Imagen) en la consola del SGC.</li>
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Signatures Area */}
                    <div className="mt-12 pt-8 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans">
                        <div className="space-y-4">
                          <div className="h-12 flex items-end justify-center">
                            <span className="w-40 border-b border-slate-800" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 uppercase">{responsableNombre || "Responsable Calidad"}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{responsableCargo || "Cargo"}</p>
                            <p className="text-[10px] font-mono text-slate-400">Elaborado y Validado</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="h-12 flex items-end justify-center">
                            <span className="w-40 border-b border-slate-800" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 uppercase">ALTA DIRECCIÓN</p>
                            <p className="text-[10px] text-slate-500 uppercase">{razonSocial || "Empresa"}</p>
                            <p className="text-[10px] font-mono text-slate-400">Aprobador Oficial SGC</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 text-center text-[9px] text-slate-400 font-sans tracking-wide space-y-1">
                        <p>Este formato regulatorio hace parte integral del manual de calidad SGC.</p>
                        <p>Página {formatPageNum} de {totalPages} — Políticas y Diseños de Control SGC ISO 9001:2015</p>
                      </div>
                    </div>
                  </div>

                  {/* SHEET: THE INSTRUCTIVO (WORK INSTRUCTIONS) */}
                  <div className="bg-white border border-slate-250/90 rounded-none shadow-[0_15px_45px_rgba(0,0,0,0.06)] p-12 max-w-[210mm] min-h-[297mm] mx-auto text-slate-800 flex flex-col justify-between font-serif relative a4-page">
                    <div>
                      {/* Header Grid */}
                      <div className="border-2 border-slate-800 p-4 grid grid-cols-3 items-center text-center gap-4 text-xs font-sans font-bold mb-8">
                        <div className="flex flex-col items-center justify-center border-r border-slate-800 h-full py-2">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">ORGANIZACIÓN</span>
                          <span className="text-xs text-slate-700 tracking-tight font-black uppercase mt-1">{razonSocial || "Nombre Empresa"}</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center border-r border-slate-800 h-full py-2">
                          <span className="text-[12px] text-slate-900 block font-black leading-tight">SISTEMA DE GESTIÓN DE LA CALIDAD</span>
                          <span className="text-[9px] text-slate-655 block mt-1 tracking-wide">INSTRUCTIVO DE OPERACIÓN</span>
                        </div>

                        <div className="text-[9px] space-y-1 text-left pl-4 h-full flex flex-col justify-center font-mono">
                          <p><span className="text-slate-500 font-bold font-sans">CÓDIGO:</span> {instructivoCode}</p>
                          <p><span className="text-slate-500 font-bold font-sans">VERSIÓN:</span> 01</p>
                          <p><span className="text-slate-500 font-bold font-sans">FECHA:</span> {formattedToday()}</p>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-center my-4 font-sans">
                        <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase border-b border-slate-850 pb-2 inline-block">
                          {instructivoTitle}
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          Guía para Diligenciamiento del Formato {formatCode} ({proc.name})
                        </p>
                      </div>

                      {/* Content of Instructivo */}
                      <div className="mt-6 font-sans space-y-4 text-xs text-slate-800 leading-relaxed text-justify">
                        
                        <div>
                          <h3 className="font-black text-[#264164] text-xs uppercase border-b border-slate-100 pb-1 mb-1">
                            1. Objetivo y Alcance
                          </h3>
                          {formatId === "control_cambios" && (
                            <p className="text-[11px] text-slate-650">
                              Establecer la metodología sistemática para registrar, valorar y autorizar las modificaciones en los requerimientos o código fuente de los entregables de software, minimizando riesgos de interrupción operacional y cumpliendo con las secciones 8.3 y 8.5.6 de ISO 9001:2015. Aplica a todo cambio en el alcance tecnológico.
                            </p>
                          )}
                          {formatId === "evaluacion_proveedores" && (
                            <p className="text-[11px] text-slate-655">
                              Definir los criterios y el procedimiento para realizar la evaluación, selección y reevaluación anual de proveedores y contratistas externos de insumos y servicios críticos. Cumple con la sección 8.4 de la norma ISO 9001.
                            </p>
                          )}
                          {formatId === "satisfaccion_cliente" && (
                            <p className="text-[11px] text-slate-655">
                              Normalizar el registro de la retroalimentación y la gestión de peticiones, quejas, reclamos y sugerencias (PQRS) de los clientes, asegurando planes de cierre ágiles y acciones correctivas efectivas. Alineado al Capítulo 9.1.2.
                            </p>
                          )}
                          {formatId === "info_documentada" && (
                            <p className="text-[11px] text-slate-655">
                              Regular el ciclo de vida de los documentos del SGC (creación, modificación, codificación, distribución y vigencia) de acuerdo a las pautas de control documental detalladas en el Capítulo 7.5.
                            </p>
                          )}
                        </div>

                        <div>
                          <h3 className="font-black text-[#264164] text-xs uppercase border-b border-slate-100 pb-1 mb-1">
                            2. Responsabilidades y Frecuencia
                          </h3>
                          <ul className="list-disc pl-5 text-[11px] text-slate-650 space-y-1">
                            {formatId === "control_cambios" && (
                              <>
                                <li><strong>Responsable:</strong> Líder de Proyecto / Product Owner / Autor del software.</li>
                                <li><strong>Frecuencia:</strong> Por cada cambio significativo solicitado fuera del Sprint Planning o posterior al despliegue en producción.</li>
                              </>
                            )}
                            {formatId === "evaluacion_proveedores" && (
                              <>
                                <li><strong>Responsable:</strong> Encargado de Compras / Dirección Administrativa.</li>
                                <li><strong>Frecuencia:</strong> Al registrar un nuevo proveedor (homologación inicial) y de forma anual (reatestación de desempeño).</li>
                              </>
                            )}
                            {formatId === "satisfaccion_cliente" && (
                              <>
                                <li><strong>Responsable:</strong> Coordinador de Servicio al Cliente / Account Manager.</li>
                                <li><strong>Frecuencia:</strong> Mensual o inmediatamente al reportarse una queja o inconformidad por parte del cliente.</li>
                              </>
                            )}
                            {formatId === "info_documentada" && (
                              <>
                                <li><strong>Responsable:</strong> Coordinador de Calidad del SGC.</li>
                                <li><strong>Frecuencia:</strong> Permanente, cada vez que se emita, modifique o anule un procedimiento, manual o formato corporativo.</li>
                              </>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-black text-[#264164] text-xs uppercase border-b border-slate-100 pb-1 mb-1">
                            3. Instrucciones de Llenado del Formato
                          </h3>
                          <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px]">
                            <div className="grid grid-cols-3 bg-slate-50 font-bold p-2 border-b border-slate-200">
                              <div>Campo / Columna</div>
                              <div className="col-span-2">Descripción e Instrucción Exacta</div>
                            </div>
                            
                            {formatId === "control_cambios" && (
                              <div className="divide-y divide-slate-100 text-slate-650 text-[10px]">
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">ID Req.</div>
                                  <div className="col-span-2">Código único incremental correlativo (Ej: REQ-001).</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Fecha Sol.</div>
                                  <div className="col-span-2">Fecha en que se recibe la solicitud de cambio (Día/Mes/Año).</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Descripción</div>
                                  <div className="col-span-2">Resumen claro y técnico del cambio en los entregables.</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Impacto</div>
                                  <div className="col-span-2">Clasificar en: Alto (Afecta costos/tiempos), Medio (Reconfigura tareas), o Bajo (Trivial).</div>
                                </div>
                              </div>
                            )}

                            {formatId === "evaluacion_proveedores" && (
                              <div className="divide-y divide-slate-100 text-slate-655 text-[10px]">
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Calidad (1-5)</div>
                                  <div className="col-span-2">Puntuar el cumplimiento de especificaciones técnicas (5: Excelente; 1: Deficiente).</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Tiempos (1-5)</div>
                                  <div className="col-span-2">Puntuar la puntualidad y nivel de respuesta logística.</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Homologación</div>
                                  <div className="col-span-2">Aprobado (Puntaje &gt;= 4.0), Condicionado (3.0 - 3.9) o Rechazado (&lt; 3.0).</div>
                                </div>
                              </div>
                            )}

                            {formatId === "satisfaccion_cliente" && (
                              <div className="divide-y divide-slate-100 text-slate-655 text-[10px]">
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">ID Caso</div>
                                  <div className="col-span-2">Código único correlativo del caso o encuesta (Ej: CS-001).</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Tipo PQRS</div>
                                  <div className="col-span-2">Clasificar según corresponda: Petición, Queja, Reclamo o Sugerencia.</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Plan de Cierre</div>
                                  <div className="col-span-2">Acciones correctivas inmediatas acordadas con el cliente para mitigar la inconformidad.</div>
                                </div>
                              </div>
                            )}

                            {formatId === "info_documentada" && (
                              <div className="divide-y divide-slate-100 text-slate-655 text-[10px]">
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Código Doc</div>
                                  <div className="col-span-2">Código normalizado del documento según proceso (Ej: SGC-PR-01).</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Tipo Doc</div>
                                  <div className="col-span-2">Clasificar en: Procedimiento (PR), Manual (MA), Formato (FO) o Instructivo (IN).</div>
                                </div>
                                <div className="grid grid-cols-3 p-2">
                                  <div className="font-semibold text-slate-800">Elaboró / Aprobó</div>
                                  <div className="col-span-2">Registrar el cargo de quien redacta y de quien autoriza el documento.</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-black text-[#264164] text-xs uppercase border-b border-slate-100 pb-1 mb-1">
                            4. Retención y Disposición Final
                          </h3>
                          <p className="text-[11px] text-slate-650">
                            Los registros diligenciados de este formato se almacenarán de forma digital en el repositorio central en la nube. La retención mínima obligatoria de cada registro es de <strong>tres (3) años</strong> contados a partir de su firma. Transcurrido este tiempo, se procederá a su archivo histórico o eliminación segura de servidores según directrices del Comité de Calidad.
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* Signatures Area */}
                    <div className="mt-12 pt-8 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans">
                        <div className="space-y-4">
                          <div className="h-12 flex items-end justify-center">
                            <span className="w-40 border-b border-slate-800" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 uppercase">{responsableNombre || "Responsable Calidad"}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{responsableCargo || "Cargo"}</p>
                            <p className="text-[10px] font-mono text-slate-400">Elaborado y Validado</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="h-12 flex items-end justify-center">
                            <span className="w-40 border-b border-slate-800" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 uppercase">ALTA DIRECCIÓN</p>
                            <p className="text-[10px] text-slate-500 uppercase">{razonSocial || "Empresa"}</p>
                            <p className="text-[10px] font-mono text-slate-400">Aprobador Oficial SGC</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 text-center text-[9px] text-slate-400 font-sans tracking-wide space-y-1">
                        <p>Este instructivo es un documento controlado del SGC.</p>
                        <p>Página {instructivoPageNum} de {totalPages} — Políticas y Diseños de Control SGC ISO 9001:2015</p>
                      </div>
                    </div>
                  </div>

                </React.Fragment>
              )
            })}

          </div>

          {/* Floating Print / Return Buttons on Bottom */}
          <div className="flex items-center justify-center gap-4 pt-6 no-print">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 bg-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Edición</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-7 py-3 rounded-xl text-xs font-black text-white bg-[#264164] hover:bg-[#1e324e] shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.03] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Descargar Pack</span>
            </button>
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
              className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setIsLeadModalOpen(false)}
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setIsLeadModalOpen(false)}
            >
              <div 
                className="bg-white/95 border border-slate-200/80 rounded-3xl w-full max-w-xl shadow-[0_25px_60px_rgba(38,65,100,0.15)] backdrop-blur-2xl overflow-hidden my-8"
                onClick={e => e.stopPropagation()}
              >
                {/* Visual Accent top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#264164] via-[#457bb3] to-[#acd64a]" />
                
                <div className="p-8 space-y-5 text-left">
                  {/* Alert Icon and Title */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                        {leadModalReason === "multi_formats" 
                          ? "Acceso Limitado a Formatos e Instructivos" 
                          : "Descarga / Impresión Bloqueada"}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1 leading-normal">
                        {leadModalReason === "multi_formats" 
                          ? "Como usuario libre solo puedes generar un único formato de proceso con su respectivo instructivo de control. Inicia sesión para desbloquear el pack completo." 
                          : "Para poder imprimir de forma limpia o descargar el pack de calidad completo A4 (Política + Formatos + Instructivos) en PDF, necesitas registrar tu cuenta gratuita."}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setIsLeadModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                      aria-label="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Core Value Proposition Text */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-xs text-slate-700 leading-relaxed">
                    <strong>¡Automatiza la Calidad en tu Empresa!</strong> Regístrate gratis para descargar el documento de Política completo y el Pack de Formatos y sus respectivos Instructivos de control para todos tus procesos en formato A4 limpio. En nuestra empresa de software desarrollamos plataformas SaaS integradas para control documental sin papeles, matrices de riesgo automatizadas y auditorías internas en la nube.
                  </div>

                  {/* Google sign-in is one-click action */}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsLeadModalOpen(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-655 hover:text-slate-900 text-xs font-bold transition-all hover:bg-slate-50 text-center cursor-pointer order-2 sm:order-1"
                    >
                      Seguir en Versión Libre
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleGoogleLogin()
                      }}
                      disabled={isGoogleSigningIn}
                      className="w-full sm:flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-xs order-1 sm:order-2"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <Footer />
    </div>
  )
}
