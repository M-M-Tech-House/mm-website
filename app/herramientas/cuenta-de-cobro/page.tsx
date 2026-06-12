"use client"

import React, { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactModal } from "@/components/contact-modal"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, 
  Save, 
  Download, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  Sparkles, 
  Building, 
  Info,
  DollarSign,
  User,
  CreditCard,
  X,
  FileDown,
  ArrowRight,
  Upload
} from "lucide-react"
import { auth, db, googleProvider } from "@/lib/firebase"
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth"
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from "firebase/firestore"

// Helper function to convert numeric value to letters (Colombian standard text)
function numeroALetras(num: number): string {
  if (num === 0) return "CERO PESOS M/CTE"
  
  const Unidades = (n: number) => {
    const u = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
    return u[n]
  }

  const Decenas = (n: number) => {
    const d = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
    const especiales = {
      11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
      16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
      21: "VEINTIUN", 22: "VEINTIDOS", 23: "VEINTITRES", 24: "VEINTICUATRO",
      25: "VEINTICINCO", 26: "VEINTISEIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE"
    }
    if (n in especiales) return especiales[n as keyof typeof especiales]
    const u = n % 10
    const dec = Math.floor(n / 10)
    if (dec > 0 && u > 0) {
      const conj = dec === 2 ? "I" : " Y "
      const prefix = dec === 2 ? "VEINT" : d[dec]
      return `${prefix}${conj}${Unidades(u)}`
    }
    return d[dec] || Unidades(u)
  }

  const Centenas = (n: number) => {
    const c = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]
    if (n === 100) return "CIEN"
    const d = n % 100
    const cen = Math.floor(n / 100)
    return `${c[cen]} ${Decenas(d)}`.trim()
  }

  const Seccion = (n: number, divisor: number, strSingular: string, strPlural: string) => {
    const cientos = Math.floor(n / divisor)
    const resto = n % divisor
    let letras = ""
    if (cientos > 0) {
      if (cientos > 1) letras = `${Centenas(cientos)} ${strPlural}`
      else letras = strSingular
    } else {
      letras = ""
    }
    if (resto > 0) {
      letras += " "
    }
    return letras.trim()
  }

  const Miles = (n: number) => {
    const divisor = 1000
    const cientos = Math.floor(n / divisor)
    const resto = n % divisor
    let strMiles = ""
    if (cientos > 0) {
      if (cientos === 1) strMiles = "MIL"
      else strMiles = `${Centenas(cientos)} MIL`
    }
    let strCentenas = Centenas(resto)
    if (strMiles === "" && strCentenas === "") return ""
    return `${strMiles} ${strCentenas}`.trim()
  }

  const Millones = (n: number) => {
    const divisor = 1000000
    const cientos = Math.floor(n / divisor)
    const resto = n % divisor
    let strMillones = Seccion(cientos, 1, "UN MILLON", "MILLONES")
    let strMiles = Miles(resto)
    if (strMillones === "") return strMiles
    return `${strMillones} ${strMiles}`.trim()
  }

  const letras = Millones(num)
  return `${letras} PESOS M/CTE`.replace(/\s+/g, " ")
}

// Format COP currency
const formatCOP = (val: string | number) => {
  const num = typeof val === "string" ? parseFloat(val) || 0 : val
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export default function CuentaDeCobroPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [customLogo, setCustomLogo] = useState<string>("")

  const [emisor, setEmisor] = useState({ nombre: "", nit: "", telefono: "", email: "" })
  const [cliente, setCliente] = useState({ nombre: "", nit: "" })
  const [cobro, setCobro] = useState({ numero: "001", fecha: "" })
  const [conceptos, setConceptos] = useState<Array<{ descripcion: string, valor: string }>>([
    { descripcion: "", valor: "" }
  ])
  const [pago, setPago] = useState({ banco: "", tipoCuenta: "Ahorros", numeroCuenta: "" })
  
  // LocalStorage state for saved clients
  const [savedClients, setSavedClients] = useState<Array<{ nombre: string, nit: string }>>([])
  
  // Modals visibility
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [leadModalReason, setLeadModalReason] = useState<"limit_clients" | "limit_amount">("limit_clients")
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  
  // Loading status for PDF creation
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  // Print-optimized container reference
  const printTemplateRef = useRef<HTMLDivElement>(null)

  // Firebase state listener and data sync
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
      
      if (currentUser) {
        await loadUserData(currentUser.uid)
      } else {
        setCustomLogo("")
        const savedClientsList = localStorage.getItem("mm_invoice_clients")
        if (savedClientsList) setSavedClients(JSON.parse(savedClientsList))
        else setSavedClients([])
      }
    })
    return () => unsubscribe()
  }, [])

  // Load Firestore data (clients list, custom logo) & Migrate LocalStorage
  const loadUserData = async (uid: string) => {
    if (!db) return
    try {
      // 1. Load Custom Logo Settings
      const settingsDoc = await getDoc(doc(db, "users", uid, "settings", "profile"))
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        if (data.logo) {
          setCustomLogo(data.logo)
        }
      }

      // 2. Load Firestore Saved Clients
      const querySnapshot = await getDocs(collection(db, "users", uid, "clients"))
      const clientsList: Array<{ nombre: string, nit: string }> = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        clientsList.push({ nombre: data.nombre, nit: data.nit })
      })
      setSavedClients(clientsList)

      // 3. Migrate LocalStorage Clients to Firestore (if any exist)
      const localClients = localStorage.getItem("mm_invoice_clients")
      if (localClients) {
        const parsed = JSON.parse(localClients) as Array<{ nombre: string, nit: string }>
        if (parsed.length > 0) {
          let merged = [...clientsList]
          for (const c of parsed) {
            const alreadyExists = merged.some(fc => fc.nit.toLowerCase().trim() === c.nit.toLowerCase().trim())
            if (!alreadyExists && merged.length < 10) {
              await setDoc(doc(db, "users", uid, "clients", c.nit.toLowerCase().trim()), {
                nombre: c.nombre,
                nit: c.nit
              })
              merged.push(c)
            }
          }
          setSavedClients(merged)
          localStorage.removeItem("mm_invoice_clients")
        }
      }
    } catch (err) {
      console.error("Error loading user data from Firestore:", err)
    }
  }

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
          "2. Entra a tu proyecto: mmtechhouse-db157\n" +
          "3. En la barra lateral, ve a 'Authentication' > pestaña 'Sign-in method'.\n" +
          "4. Haz clic en 'Agregar nuevo proveedor' y selecciona 'Google'.\n" +
          "5. Habilítalo, selecciona un correo de asistencia técnica para el proyecto y guarda los cambios.\n" +
          "6. Vuelve a intentar el inicio de sesión."
        )
      } else {
        alert("Error al iniciar sesión con Google. Por favor intenta de nuevo.")
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

  // Logo Upload & Compression helper (max 200px width/height, stored as base64 in Firestore)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_WIDTH = 200
        const MAX_HEIGHT = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85)
          setCustomLogo(compressedBase64)
          
          if (user && db) {
            setDoc(doc(db, "users", user.uid, "settings", "profile"), {
              logo: compressedBase64
            }, { merge: true }).catch(err => {
              console.error("Error saving logo to Firestore:", err)
            })
          }
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Logo Delete helper
  const handleDeleteLogo = async () => {
    if (confirm("¿Seguro que deseas eliminar tu logo de la cuenta de cobro?")) {
      setCustomLogo("")
      if (user && db) {
        try {
          await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
            logo: null
          }, { merge: true })
        } catch (err) {
          console.error("Error deleting logo from Firestore:", err)
        }
      }
    }
  }

  // Hydration handling
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setCobro(prev => ({ ...prev, fecha: prev.fecha || today }))

    // Load from localStorage
    const savedEmisor = localStorage.getItem("mm_invoice_emisor")
    if (savedEmisor) setEmisor(JSON.parse(savedEmisor))

    const savedPago = localStorage.getItem("mm_invoice_pago")
    if (savedPago) setPago(JSON.parse(savedPago))

    const savedDraft = localStorage.getItem("mm_invoice_draft")
    if (savedDraft) setCobro(prev => ({ ...prev, ...JSON.parse(savedDraft) }))

    const savedConceptos = localStorage.getItem("mm_invoice_conceptos")
    if (savedConceptos) setConceptos(JSON.parse(savedConceptos))

    // Only load local clients if user is not authenticated (handled by onAuthStateChanged too)
    if (!auth?.currentUser) {
      const savedClientsList = localStorage.getItem("mm_invoice_clients")
      if (savedClientsList) setSavedClients(JSON.parse(savedClientsList))
    }
  }, [])

  // Auto-save form fields to localStorage
  useEffect(() => {
    if (emisor.nombre || emisor.nit || emisor.telefono || emisor.email) {
      localStorage.setItem("mm_invoice_emisor", JSON.stringify(emisor))
    }
  }, [emisor])

  useEffect(() => {
    if (pago.banco || pago.numeroCuenta) {
      localStorage.setItem("mm_invoice_pago", JSON.stringify(pago))
    }
  }, [pago])

  useEffect(() => {
    if (cobro.numero || cobro.fecha) {
      localStorage.setItem("mm_invoice_draft", JSON.stringify(cobro))
    }
  }, [cobro])

  useEffect(() => {
    if (conceptos.length > 0 && (conceptos[0].descripcion || conceptos[0].valor)) {
      localStorage.setItem("mm_invoice_conceptos", JSON.stringify(conceptos))
    }
  }, [conceptos])

  // Save client helper (limit strict: max 3 if anonymous, max 10 if authenticated)
  const handleSaveClient = async () => {
    if (!cliente.nombre.trim() || !cliente.nit.trim()) {
      alert("Por favor completa el Nombre y la Identificación del cliente para guardarlo.")
      return
    }

    // Check if total amount exceeds 5,000,000 COP (only block if unauthenticated)
    const totalValor = conceptos.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0)
    if (!user && totalValor > 5000000) {
      setLeadModalReason("limit_amount")
      setIsLeadModalOpen(true)
      return
    }

    const clientNitKey = cliente.nit.toLowerCase().trim()
    const exists = savedClients.some(
      c => c.nit.toLowerCase().trim() === clientNitKey
    )

    if (exists) {
      const updatedList = savedClients.map(c => 
        c.nit.toLowerCase().trim() === clientNitKey 
          ? { nombre: cliente.nombre, nit: cliente.nit } 
          : c
      )
      setSavedClients(updatedList)
      
      if (user && db) {
        await setDoc(doc(db, "users", user.uid, "clients", clientNitKey), {
          nombre: cliente.nombre,
          nit: cliente.nit
        })
      } else {
        localStorage.setItem("mm_invoice_clients", JSON.stringify(updatedList))
      }
      alert("Cliente actualizado correctamente.")
      return
    }

    // New client save limit checks
    const maxClients = user ? 10 : 3
    if (savedClients.length >= maxClients) {
      if (!user) {
        setLeadModalReason("limit_clients")
        setIsLeadModalOpen(true)
      } else {
        alert("Límite de 10 clientes guardados alcanzado. Elimina alguno para guardar uno nuevo.")
      }
      return
    }

    const updatedList = [...savedClients, { nombre: cliente.nombre, nit: cliente.nit }]
    setSavedClients(updatedList)

    if (user && db) {
      try {
        await setDoc(doc(db, "users", user.uid, "clients", clientNitKey), {
          nombre: cliente.nombre,
          nit: cliente.nit
        })
      } catch (err) {
        console.error("Error saving client to Firestore:", err)
      }
    } else {
      localStorage.setItem("mm_invoice_clients", JSON.stringify(updatedList))
    }
  }

  // Delete saved client helper (LocalStorage list or Firestore doc)
  const handleDeleteClient = async (nitToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedList = savedClients.filter(c => c.nit !== nitToDelete)
    setSavedClients(updatedList)

    if (user && db) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "clients", nitToDelete.toLowerCase().trim()))
      } catch (err) {
        console.error("Error deleting client from Firestore:", err)
      }
    } else {
      localStorage.setItem("mm_invoice_clients", JSON.stringify(updatedList))
    }
  }

  // Reset form
  const handleClearForm = () => {
    if (confirm("¿Seguro que deseas limpiar todos los campos del cobro actual?")) {
      const today = new Date().toISOString().split("T")[0]
      setCliente({ nombre: "", nit: "" })
      setCobro({ numero: "001", fecha: today })
      setConceptos([{ descripcion: "", valor: "" }])
      localStorage.removeItem("mm_invoice_draft")
      localStorage.removeItem("mm_invoice_conceptos")
    }
  }

  // Generate & Download PDF Logic
  const handleDownloadPDF = async () => {
    // Validate inputs
    if (!emisor.nombre || !emisor.nit) {
      alert("Por favor ingresa los datos mínimos del Emisor (Nombre y Cédula/NIT).")
      return
    }
    if (!cliente.nombre || !cliente.nit) {
      alert("Por favor ingresa los datos del Cliente.")
      return
    }
    
    // Ensure all items are filled
    const hasEmpty = conceptos.some(item => !item.descripcion.trim() || !item.valor.trim())
    if (hasEmpty) {
      alert("Por favor completa la descripción y el valor para todos los ítems agregados.")
      return
    }

    // Check if total amount exceeds 5,000,000 COP (only block if unauthenticated)
    const totalValor = conceptos.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0)
    if (!user && totalValor > 5000000) {
      setLeadModalReason("limit_amount")
      setIsLeadModalOpen(true)
      return
    }

    setIsPdfGenerating(true)
    
    try {
      // Dynamic import to prevent SSR issues
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas-pro")).default

      const element = printTemplateRef.current
      if (!element) {
        throw new Error("No se encontró el contenedor de impresión.")
      }
      
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution density
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const singlePageHeight = (1130 * imgWidth) / 800 // 296.625 mm

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      let heightLeft = imgHeight
      let position = 0
      let pageIndex = 0

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= singlePageHeight

      // Add subsequent pages if any
      while (heightLeft >= 1) {
        pageIndex++
        position = -singlePageHeight * pageIndex
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
        heightLeft -= singlePageHeight
      }

      pdf.save(`cuenta_de_cobro_no_${cobro.numero || "001"}.pdf`)

    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Ocurrió un error al generar el PDF. Por favor intenta de nuevo.")
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const totalValor = conceptos.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0)
  const numericValue = totalValor
  const valorEnLetras = numeroALetras(numericValue)

  // Pagination configuration for concepts preview and PDF
  const itemsPerPage1 = 5
  const itemsPerPageLater = 7

  const getPagesOfConceptos = (list: typeof conceptos) => {
    if (list.length <= itemsPerPage1) {
      return [list]
    }
    const pages = []
    pages.push(list.slice(0, itemsPerPage1))
    let remaining = list.slice(itemsPerPage1)
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, itemsPerPageLater))
      remaining = remaining.slice(itemsPerPageLater)
    }
    return pages
  }

  const conceptPages = getPagesOfConceptos(conceptos)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#457bb3] selection:text-white pb-12">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Generador de Cuenta de Cobro Gratis",
              "url": "https://mmtechhouse.com/herramientas/cuenta-de-cobro",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "COP"
              },
              "description": "Crea y descarga cuentas de cobro profesionales en PDF de manera gratuita, rápida y segura en Colombia."
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "¿Qué es una cuenta de cobro y para qué sirve?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Una cuenta de cobro es un documento comercial no equivalente a una factura que sirve como soporte físico o digital para constatar la prestación de un servicio o la entrega de un producto, permitiendo al emisor (generalmente un profesional independiente o no obligado a facturar) solicitar el pago correspondiente a su cliente."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Qué datos debe contener una cuenta de cobro profesional en Colombia?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Para que sea válida, una cuenta de cobro debe incluir: nombre y NIT o cédula del emisor (con datos de contacto), nombre y NIT/cédula del cliente, número consecutivo del documento, fecha de expedición, descripción clara del concepto o servicio prestado, valor total (en números y letras) y los datos de pago (cuenta bancaria)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Tiene validez legal una cuenta de cobro generada en línea?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí. En Colombia, la cuenta de cobro es un documento válido para soportar transacciones ante la DIAN entre personas no obligadas a facturar y sus clientes. No obstante, para efectos tributarios de costos y deducciones, el cliente (si es declarante) deberá generar el correspondiente Documento Soporte en adquisiciones efectuadas a sujetos no obligados a expedir factura."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Quiénes deben usar una cuenta de cobro en lugar de una factura?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "La cuenta de cobro la utilizan principalmente los trabajadores independientes, prestadores de servicios personales, profesionales liberales y microempresarios pertenecientes al régimen de no obligados a facturar (antiguo régimen simplificado)."
                  }
                }
              ]
            }
          ])
        }}
      />

      <Header />

      {/* Hero section inside page */}
      <section className="pt-32 pb-10 px-6 max-w-6xl mx-auto text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-tr from-[#264164]/5 to-[#457bb3]/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10">
          <span className="px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-full text-xs font-bold text-[#264164] inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#457bb3]" /> Herramienta Gratuita
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Generador de <span className="bg-gradient-to-r from-[#264164] to-[#457bb3] bg-clip-text text-transparent">Cuenta de Cobro Gratis</span>
          </h1>
          <h2 className="mt-4 text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            Crear cuenta de cobro online en segundos con formato válido para Colombia. Descarga tu cuenta de cobro para imprimir en formato PDF, 100% privada y segura.
          </h2>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 grid lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Form Column */}
        <section className="lg:col-span-7">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* Card: Emisor */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(38,65,100,0.03)] p-6 md:p-8 space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3">
                <span className="w-8 h-8 rounded-lg bg-[#264164]/5 text-[#264164] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </span>
                Tus Datos (Emisor)
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emisor-nombre" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Nombre o Razón Social
                  </label>
                  <input
                    id="emisor-nombre"
                    type="text"
                    value={emisor.nombre}
                    onChange={e => setEmisor({ ...emisor, nombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="emisor-nit" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Identificación (Cédula o NIT)
                  </label>
                  <input
                    id="emisor-nit"
                    type="text"
                    value={emisor.nit}
                    onChange={e => setEmisor({ ...emisor, nit: e.target.value })}
                    placeholder="Ej. 1.092.834.122 o 900.123.456-1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="emisor-telefono" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Teléfono de Contacto
                  </label>
                  <input
                    id="emisor-telefono"
                    type="tel"
                    value={emisor.telefono}
                    onChange={e => setEmisor({ ...emisor, telefono: e.target.value })}
                    placeholder="Ej. +57 300 123 4567"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="emisor-email" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <input
                    id="emisor-email"
                    type="email"
                    value={emisor.email}
                    onChange={e => setEmisor({ ...emisor, email: e.target.value })}
                    placeholder="Ej. juan@correo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                  />
                </div>
              </div>
            </div>

          {/* Card: Cliente */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(38,65,100,0.03)] p-6 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#264164]/5 text-[#264164] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </span>
                Datos del Cliente
              </h2>
              {/* Dropdown for saved clients */}
              {savedClients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargar:</span>
                  <div className="relative inline-block text-left">
                    <select
                      onChange={(e) => {
                        const idx = parseInt(e.target.value)
                        if (!isNaN(idx) && savedClients[idx]) {
                          setCliente({
                            nombre: savedClients[idx].nombre,
                            nit: savedClients[idx].nit
                          })
                        }
                        e.target.value = ""
                      }}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#264164]/5 pr-6 cursor-pointer"
                    >
                      <option value="">-- Cargar guardado --</option>
                      {savedClients.map((c, i) => (
                        <option key={i} value={i}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cliente-nombre" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Nombre / Razón Social del Cliente
                </label>
                <input
                  id="cliente-nombre"
                  type="text"
                  value={cliente.nombre}
                  onChange={e => setCliente({ ...cliente, nombre: e.target.value })}
                  placeholder="Ej. ACME S.A.S."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                />
              </div>
              <div>
                <label htmlFor="cliente-nit" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  NIT o Identificación del Cliente
                </label>
                <input
                  id="cliente-nit"
                  type="text"
                  value={cliente.nit}
                  onChange={e => setCliente({ ...cliente, nit: e.target.value })}
                  placeholder="Ej. 900.564.213-4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                />
              </div>
            </div>

            {/* Actions for client storage */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={handleSaveClient}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#264164]/5 hover:bg-[#264164]/10 text-[#264164] text-xs font-bold rounded-xl transition-all self-start"
              >
                <Save className="w-3.5 h-3.5" /> Guardar Cliente en LocalStorage
              </button>
              
              {/* List of currently saved clients with limit indication */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">
                  Guardados ({savedClients.length}/{user ? 10 : 3}):
                </span>
                {savedClients.length === 0 ? (
                  <span className="text-[10px] text-slate-400 italic">Ninguno</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {savedClients.map((c, i) => (
                      <div 
                        key={i}
                        onClick={() => setCliente({ nombre: c.nombre, nit: c.nit })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs cursor-pointer transition-colors group"
                      >
                        <span className="truncate max-w-[80px] font-semibold">{c.nombre}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClient(c.nit, e)}
                          className="text-slate-400 hover:text-red-500 rounded-full p-0.5"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Detalles del Cobro */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(38,65,100,0.03)] p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#264164]/5 text-[#264164] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </span>
              Detalles del Cobro
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cobro-numero" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Número de Cobro
                </label>
                <input
                  id="cobro-numero"
                  type="text"
                  value={cobro.numero}
                  onChange={e => setCobro({ ...cobro, numero: e.target.value })}
                  placeholder="Ej. 001"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="cobro-fecha" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Fecha de Emisión
                </label>
                <input
                  id="cobro-fecha"
                  type="date"
                  value={cobro.fecha}
                  onChange={e => setCobro({ ...cobro, fecha: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ítems a Cobrar (Máximo 3)
                </span>
                {conceptos.length < (user ? 10 : 3) ? (
                  <button
                    type="button"
                    onClick={() => setConceptos([...conceptos, { descripcion: "", valor: "" }])}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#457bb3] hover:text-[#264164] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Ítem
                  </button>
                ) : (
                  conceptos.length === 3 && !user && (
                    <span 
                      onClick={() => { setLeadModalReason("limit_clients"); setIsLeadModalOpen(true); }}
                      className="text-[10px] text-amber-600 font-extrabold cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> ¿Más de 3 ítems? Regístrate gratis
                    </span>
                  )
                )}
              </div>

              {conceptos.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-2xl border border-slate-200/50 relative group">
                  <div className="flex-1 space-y-3.5">
                    <div>
                      <label htmlFor={`concepto-desc-${index}`} className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                        Descripción del Ítem #{index + 1}
                      </label>
                      <input
                        id={`concepto-desc-${index}`}
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => {
                          const updated = [...conceptos]
                          updated[index].descripcion = e.target.value
                          setConceptos(updated)
                        }}
                        placeholder="Ej. Por concepto de desarrollo web de la página corporativa"
                        className="w-full px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor={`concepto-valor-${index}`} className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                        Valor (COP $)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                        <input
                          id={`concepto-valor-${index}`}
                          type="number"
                          value={item.valor}
                          onChange={(e) => {
                            const updated = [...conceptos]
                            updated[index].valor = e.target.value
                            setConceptos(updated)
                          }}
                          placeholder="Ej. 2500000"
                          className="w-full pl-7 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                  {conceptos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = conceptos.filter((_, i) => i !== index)
                        setConceptos(updated)
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/50 transition-all self-end"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Accumulator and limit info */}
              <div className="flex items-center justify-between p-3.5 bg-[#264164]/5 border border-[#264164]/10 rounded-2xl">
                <span className="text-xs font-extrabold text-[#264164] uppercase tracking-wider">Total Acumulado:</span>
                <span className="text-base font-black text-[#264164]">{formatCOP(totalValor)}</span>
              </div>

              {totalValor > 5000000 && !user && (
                <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold leading-normal">
                    Nota: Montos superiores a $5,000,000 COP requieren plan Premium. La exportación estará restringida.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Datos de Pago */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(38,65,100,0.03)] p-6 md:p-8 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#264164]/5 text-[#264164] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </span>
              Datos de Pago (Dónde te consignan)
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="pago-banco" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Entidad Bancaria
                </label>
                <input
                  id="pago-banco"
                  type="text"
                  value={pago.banco}
                  onChange={e => setPago({ ...pago, banco: e.target.value })}
                  placeholder="Ej. Bancolombia"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                />
              </div>
              <div>
                <label htmlFor="pago-tipo" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tipo de Cuenta
                </label>
                <select
                  id="pago-tipo"
                  value={pago.tipoCuenta}
                  onChange={e => setPago({ ...pago, tipoCuenta: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all cursor-pointer"
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
              <div>
                <label htmlFor="pago-numero" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Número de Cuenta
                </label>
                <input
                  id="pago-numero"
                  type="text"
                  value={pago.numeroCuenta}
                  onChange={e => setPago({ ...pago, numeroCuenta: e.target.value })}
                  placeholder="Ej. 123-456789-01"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#264164] focus:ring-2 focus:ring-[#264164]/5 transition-all"
                />
              </div>
            </div>
          </div>

          </form>
        </section>

        {/* Preview and Download Column */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Card: Auth / Profile */}
          <div className="bg-white border border-slate-100 shadow-[0_4px_25px_rgba(38,65,100,0.03)] rounded-3xl p-6 space-y-4">
            {isAuthLoading ? (
              <div className="flex items-center justify-center py-4">
                <span className="w-5 h-5 border-2 border-[#264164] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#264164] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.displayName?.[0] || user.email?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Hola, {user.displayName || "Usuario"}</h4>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Límites Ampliados Activos
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-600 transition-all cursor-pointer"
                  >
                    Salir
                  </button>
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logo de tu Cuenta de Cobro</span>
                  {customLogo ? (
                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50">
                      <img src={customLogo} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 truncate">Logo personalizado activo</p>
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          className="text-[10px] font-extrabold text-red-500 hover:text-red-700 transition-colors mt-0.5 cursor-pointer block"
                        >
                          Eliminar Logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label 
                        htmlFor="logo-upload" 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-dashed border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-400" />
                        Subir Logo de tu Empresa
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#264164]/5 text-[#264164] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#457bb3]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Sube tu logo y amplía tus límites</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Inicia sesión con Google para guardar hasta 10 clientes, agregar hasta 10 conceptos y cargar tu propio logo en la cuenta de cobro.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer hover:bg-slate-50"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.482 6.555l3.784 3.21z"/>
                    <path fill="#34A853" d="M16.04 15.345c-1.077.736-2.436 1.164-4.04 1.164-3.555 0-6.573-2.418-7.645-5.69l-3.785 2.936C2.5 18.064 6.945 21 12 21c3.11 0 5.955-1.045 8.082-2.836l-4.042-2.82z"/>
                    <path fill="#4285F4" d="M23.82 12.273c0-.818-.082-1.609-.218-2.364H12v4.518h6.636a5.69 5.69 0 0 1-2.455 3.736l4.043 2.827c2.364-2.173 3.71-5.382 3.71-8.718z"/>
                    <path fill="#FBBC05" d="M4.355 10.818a7.03 7.03 0 0 1 0-2.364L.57 5.518a11.968 11.968 0 0 0 0 10.6l3.785-2.936z"/>
                  </svg>
                  Iniciar Sesión con Google
                </button>
              </div>
            )}
          </div>

          {/* Actions card */}
          <div className="bg-[#264164] rounded-3xl text-white p-6 shadow-xl shadow-[#264164]/10 flex flex-col md:flex-row lg:flex-col justify-between items-stretch gap-4">
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <FileDown className="w-5 h-5 text-[#acd64a]" /> Exportar Documento
              </h3>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                Descarga tu cuenta de cobro en formato PDF lista para enviar por correo o WhatsApp.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={handleClearForm}
                className="w-full sm:w-auto px-4 py-2.5 border border-white/20 hover:border-white/50 text-white rounded-xl text-xs font-bold transition-all hover:bg-white/5"
              >
                Limpiar Datos
              </button>
              
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#acd64a] text-slate-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-[#bee45f] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPdfGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Document Live Preview Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(38,65,100,0.04)] overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Vista Previa del Documento
              </span>
              <span className="text-[10px] bg-slate-200/60 font-semibold px-2 py-0.5 rounded text-slate-600">A4</span>
            </div>
            
            {/* The Scaled Visual Frame for Live Preview */}
            <div className="p-4 md:p-6 bg-slate-100/50 flex flex-col items-center gap-6 overflow-y-auto max-h-[800px] w-full">
              
              {conceptPages.map((pageItems, pageIdx) => (
                <div 
                  key={pageIdx}
                  className="w-[380px] sm:w-[420px] h-[537px] sm:h-[593px] bg-white shadow-md rounded border border-slate-200/50 p-5 md:p-6 flex flex-col justify-between text-[11px] leading-relaxed text-slate-700 select-none shrink-0"
                >
                  {/* Upper Section */}
                  <div className="space-y-3">
                    {/* Header info */}
                    {pageIdx === 0 ? (
                      <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          {customLogo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customLogo} alt="Logo" className="w-10 h-10 object-contain rounded-md border border-slate-100" />
                          )}
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm uppercase leading-tight tracking-tight">
                              Cuenta de Cobro
                            </h4>
                            <p className="text-[9px] text-[#457bb3] font-bold mt-0.5 uppercase tracking-wider">
                              {customLogo ? "Plantilla Personalizada" : "M&M Tech House Template"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">Nº {cobro.numero || "001"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Fecha: {cobro.fecha || "AAAA-MM-DD"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          {customLogo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customLogo} alt="Logo" className="w-6 h-6 object-contain rounded border border-slate-100" />
                          )}
                          <span className="font-extrabold text-slate-900 text-[10px] uppercase">
                            Cuenta de Cobro Nº {cobro.numero || "001"}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">
                          Página {pageIdx + 1} de {conceptPages.length}
                        </span>
                      </div>
                    )}

                    {/* Issuer & Client Info Blocks (Only on page 1) */}
                    {pageIdx === 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900 uppercase text-[9px] tracking-wider text-slate-400">De (Emisor)</h5>
                          <p className="font-bold text-slate-900 text-[11px] leading-tight truncate">{emisor.nombre || "(Tu Nombre)"}</p>
                          <p className="text-slate-500">NIT/CC: {emisor.nit || "(-)"}</p>
                          {emisor.telefono && <p className="text-slate-500">Tel: {emisor.telefono}</p>}
                          {emisor.email && <p className="text-slate-500 truncate">{emisor.email}</p>}
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900 uppercase text-[9px] tracking-wider text-slate-400">Para (Cliente)</h5>
                          <p className="font-bold text-slate-900 text-[11px] leading-tight truncate">{cliente.nombre || "(Nombre del Cliente)"}</p>
                          <p className="text-slate-500">NIT/CC: {cliente.nit || "(-)"}</p>
                        </div>
                      </div>
                    )}

                    {/* Concept / Service Table */}
                    <div className="mt-2">
                      <div className="grid grid-cols-12 bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 px-2 rounded-t-md">
                        <div className="col-span-8">Concepto / Descripción</div>
                        <div className="col-span-4 text-right">Total</div>
                      </div>
                      <div className="border-x border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                        {pageItems.map((item, idx) => {
                          const originalIdx = conceptos.indexOf(item);
                          return (
                            <div key={idx} className="grid grid-cols-12 p-2 items-center">
                              <div className="col-span-8 text-[9.5px] break-words pr-2 leading-tight">
                                {item.descripcion || `Ítem #${originalIdx + 1} (Sin descripción)`}
                              </div>
                              <div className="col-span-4 text-right font-semibold text-slate-900 text-[9.5px]">
                                {formatCOP(item.valor)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total summary rows (Only on last page) */}
                    {pageIdx === conceptPages.length - 1 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                          <span className="font-extrabold text-slate-900 uppercase text-[9px]">Total a Pagar</span>
                          <span className="font-extrabold text-slate-900 text-[12px]">{formatCOP(numericValue)}</span>
                        </div>
                        {numericValue > 0 && (
                          <div className="text-[8px] text-slate-400 uppercase tracking-tight text-right leading-tight italic px-1">
                            Son: {valorEnLetras}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom details inside preview */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 mt-3">
                    {pageIdx === conceptPages.length - 1 ? (
                      <>
                        {/* Payment account details */}
                        {(pago.banco || pago.numeroCuenta) ? (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100/80 space-y-1">
                            <h6 className="font-bold text-slate-900 text-[9px] uppercase tracking-wider">Favor consignar en:</h6>
                            <p className="text-[10px] text-slate-700">
                              <span className="font-semibold">{pago.banco}</span> — Cuenta de {pago.tipoCuenta} Nº <span className="font-semibold">{pago.numeroCuenta}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-50 rounded border border-slate-100 text-[9px] text-slate-400 italic text-center">
                            Ingresa datos de pago para mostrarlos aquí.
                          </div>
                        )}

                        {/* Signature mockup */}
                        <div className="flex justify-between items-end pt-3">
                          <div className="w-[140px] border-t border-slate-300 pt-1">
                            <p className="font-bold text-slate-900 truncate leading-tight">{emisor.nombre || "Firma del Emisor"}</p>
                            <p className="text-[9px] text-slate-400">C.C. / NIT: {emisor.nit || "Identificación"}</p>
                          </div>
                          <div className="text-[8px] text-slate-400 text-right leading-tight max-w-[150px]">
                            Esta cuenta de cobro se asimila a una factura de venta de conformidad con el Artículo 774 del Código de Comercio.
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center text-slate-400 text-[9px] italic">
                        <span>Documento Soporte Nº {cobro.numero || "001"}</span>
                        <span>Continúa en la página siguiente...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
            </div>
          </div>

        </section>
      </main>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-slate-200/60 relative z-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-8">
          Preguntas Frecuentes sobre Cuentas de Cobro en Colombia
        </h2>
        
        <div className="space-y-4">
          <FAQItem 
            question="¿Qué es una cuenta de cobro y para qué sirve?"
            answer="Una cuenta de cobro es un documento comercial no equivalente a una factura que sirve como soporte físico o digital para constatar la prestación de un servicio o la entrega de un producto, permitiendo al emisor (generalmente un profesional independiente o no obligado a facturar) solicitar el pago correspondiente a su cliente."
          />
          <FAQItem 
            question="¿Qué datos debe contener una cuenta de cobro profesional en Colombia?"
            answer="Para que sea válida, una cuenta de cobro debe incluir: nombre y NIT o cédula del emisor (con datos de contacto), nombre y NIT/cédula del cliente, número consecutivo del documento, fecha de expedición, descripción clara del concepto o servicio prestado, valor total (en números y letras) y los datos de pago (cuenta bancaria)."
          />
          <FAQItem 
            question="¿Tiene validez legal una cuenta de cobro generada en línea?"
            answer="Sí. En Colombia, la cuenta de cobro es un documento válido para soportar transacciones ante la DIAN entre personas no obligadas a facturar y sus clientes. No obstante, para efectos tributarios de costos y deducciones, el cliente (si es declarante) deberá generar el correspondiente Documento Soporte en adquisiciones efectuadas a sujetos no obligados a expedir factura."
          />
          <FAQItem 
            question="¿Quiénes deben usar una cuenta de cobro en lugar de una factura?"
            answer="La cuenta de cobro la utilizan principalmente los trabajadores independientes, prestadores de servicios personales, profesionales liberales y microempresarios pertenecientes al régimen de no obligados a facturar (antiguo régimen simplificado)."
          />
        </div>
      </section>

      <Footer />

      {/* 
        HIDDEN PRINT TEMPLATE CONTAINER 
        This is a fixed pixel container (width 800px, aspect-ratio matching A4) used 
        solely by html2canvas to guarantee exact pixel rendering and avoid device/screen 
        scaling issues on PDF download.
      */}
      <div 
        style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
      >
        <div ref={printTemplateRef} className="flex flex-col gap-0 bg-[#e2e8f0]">
          {conceptPages.map((pageItems, pageIdx) => (
            <div 
              key={pageIdx}
              className="bg-white text-slate-800 p-16 flex flex-col justify-between"
              style={{
                width: "800px",
                height: "1130px", // Exact A4 ratio
                boxSizing: "border-box",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              {/* Top content wrapper */}
              <div className="space-y-10">
                
                {/* Header info */}
                {pageIdx === 0 ? (
                  <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6">
                    <div className="flex items-center gap-5">
                      {customLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={customLogo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-slate-100" />
                      )}
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                          Cuenta de Cobro
                        </h1>
                        <p className="text-xs text-[#264164] font-bold mt-1 uppercase tracking-widest">
                          DOCUMENTO SOPORTE DE COBRO
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        Nº <span className="text-[#264164]">{cobro.numero || "001"}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Fecha de Emisión: <span className="font-semibold text-slate-700">{cobro.fecha}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center border-b-2 border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      {customLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={customLogo} alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-100" />
                      )}
                      <span className="font-black text-slate-900 text-sm uppercase">
                        Cuenta de Cobro Nº {cobro.numero || "001"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">
                      Página {pageIdx + 1} de {conceptPages.length}
                    </span>
                  </div>
                )}

                {/* Issuer and Client details (Only on page 1) */}
                {pageIdx === 0 && (
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">De (Emisor):</h3>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{emisor.nombre || "Firma del Emisor"}</p>
                        <p className="text-xs font-semibold text-slate-600">NIT / C.C.: {emisor.nit || ""}</p>
                        {emisor.telefono && <p className="text-xs text-slate-500">Tel: {emisor.telefono}</p>}
                        {emisor.email && <p className="text-xs text-slate-500">{emisor.email}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">A Nombre de (Cliente):</h3>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{cliente.nombre || ""}</p>
                        <p className="text-xs font-semibold text-slate-600">NIT / C.C.: {cliente.nit || ""}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Concept table details */}
                <div className="mt-8">
                  <div className="grid grid-cols-12 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest py-3 px-4 rounded-t-lg">
                    <div className="col-span-9">Concepto o Descripción del Servicio</div>
                    <div className="col-span-3 text-right">Valor Total</div>
                  </div>
                  <div className="border-x-2 border-slate-100 divide-y-2 divide-slate-100 bg-slate-50/20">
                    {pageItems.map((item, idx) => {
                      const originalIdx = conceptos.indexOf(item);
                      return (
                        <div key={idx} className="grid grid-cols-12 py-2.5 px-4 items-center">
                          <div className="col-span-9 text-xs text-slate-700 leading-relaxed pr-6">
                            {item.descripcion || `Ítem #${originalIdx + 1}`}
                          </div>
                          <div className="col-span-3 text-right font-bold text-slate-900 text-sm">
                            {formatCOP(item.valor)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total Block (Only on last page) */}
                {pageIdx === conceptPages.length - 1 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-900 text-white py-3.5 px-6 rounded-xl border border-slate-800">
                      <span className="font-extrabold text-xs uppercase tracking-widest">Total Neto a Pagar</span>
                      <span className="font-black text-lg text-[#acd64a]">{formatCOP(totalValor)}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-tight text-right leading-tight italic px-3">
                      Son: <span className="text-slate-800 font-black">{valorEnLetras}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom content wrapper */}
              <div className="space-y-8 pt-8 border-t-2 border-slate-100">
                {pageIdx === conceptPages.length - 1 ? (
                  <>
                    {/* Account Payment details */}
                    {(pago.banco || pago.numeroCuenta) && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                        <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider">
                          Información de Consignación:
                        </h4>
                        <p className="text-xs text-slate-700">
                          Por favor realizar la transferencia bancaria a la siguiente cuenta:
                        </p>
                        <p className="text-xs font-semibold text-slate-900">
                          Banco: <span className="font-black text-[#264164]">{pago.banco}</span> | Tipo: <span className="font-black text-[#264164]">{pago.tipoCuenta}</span> | Nº: <span className="font-black text-[#264164]">{pago.numeroCuenta}</span>
                        </p>
                      </div>
                    )}

                    {/* Signatures and footnotes */}
                    <div className="flex justify-between items-end pt-6">
                      <div className="w-[260px] border-t-2 border-slate-350 pt-3">
                        <div className="h-14" /> {/* Spacer for physical signature */}
                        <p className="font-extrabold text-slate-900 text-sm">{emisor.nombre || "Firma del Emisor"}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">C.C. / NIT: {emisor.nit}</p>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold text-right leading-relaxed max-w-[280px]">
                        Esta cuenta de cobro se asimila a una factura de venta de conformidad con lo establecido en el Artículo 774 del Código de Comercio colombiano.
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-slate-400 text-xs italic">
                    <span>Documento Soporte Nº {cobro.numero || "001"}</span>
                    <span>Continúa en la página siguiente...</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* 
        LEAD MAGNET BLOCKING MODAL 
      */}
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
                
                <div className="p-8 space-y-6">
                  {/* Alert Icon and Title */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Info className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {leadModalReason === "limit_clients" 
                          ? "Límite de Clientes Alcanzado" 
                          : "Límite de Monto Superado"}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 leading-normal">
                        {leadModalReason === "limit_clients" 
                          ? "Has superado el límite de 3 clientes en la versión gratuita." 
                          : "Cuentas de cobro por montos superiores a $5,000,000 COP requieren una cuenta avanzada."}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setIsLeadModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all ml-auto"
                      aria-label="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Core Value Proposition Text */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-700 leading-relaxed">
                    <strong>¿Necesitas gestionar más clientes, llevar un histórico de cobros y automatizar tus cuentas por cobrar o inventarios?</strong> Regístrate gratis en nuestra plataforma o conoce nuestras soluciones de software a la medida de tu negocio.
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLeadModalOpen(false)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-bold transition-all hover:bg-slate-50 text-center"
                    >
                      Seguir en Versión Libre
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsLeadModalOpen(false)
                        await handleLogin()
                      }}
                      className="w-full sm:flex-1 px-5 py-3 bg-[#264164] hover:bg-[#1f3552] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#264164]/10 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Registrarse Gratis con Google <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main website Contact Modal Integration */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  )
}

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
          <Plus className="w-3.5 h-3.5" />
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
