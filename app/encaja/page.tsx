"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  Cpu, 
  BellRing, 
  Fingerprint, 
  Image as ImageIcon, 
  ArrowRight, 
  ChevronRight, 
  Download, 
  CheckCircle2,
  Lock,
  RefreshCw,
  Info
} from "lucide-react"

const features = [
  {
    icon: FileSpreadsheet,
    title: "Sincronización Directa con Google Sheets",
    description: "Tus registros de caja se escriben de forma automática en tu propia hoja de cálculo de Google. Sin intermediarios ni bases de datos ajenas."
  },
  {
    icon: Lock,
    title: "Almacenamiento 100% Privado",
    description: "Tus datos financieros se guardan cifrados localmente en tu celular mediante Room (SQLite) y en tus servicios de Google personales."
  },
  {
    icon: ImageIcon,
    title: "Soporte de Fotos y Recibos",
    description: "Toma fotos de tus recibos o facturas y súbelas automáticamente a una carpeta segura 'EnCaja_Photos' creada en tu Google Drive."
  },
  {
    icon: BellRing,
    title: "Automatización de SMS",
    description: "Capacidad opcional de leer notificaciones de SMS entrantes de entidades bancarias para auto-completar registros financieros al instante."
  },
  {
    icon: Fingerprint,
    title: "Seguridad Biométrica",
    description: "Protege tu app de accesos no autorizados habilitando el desbloqueo mediante la huella dactilar o reconocimiento facial de tu celular."
  },
  {
    icon: Cpu,
    title: "Sincronización en Redundancia",
    description: "Sincroniza tus registros tanto con servidores externos API vinculados como con hojas de cálculo múltiples de forma simultánea."
  }
]

const steps = [
  {
    num: "01",
    title: "Instala la Aplicación",
    description: "Descarga e instala el paquete APK oficial de EnCaja en tu dispositivo Android."
  },
  {
    num: "02",
    title: "Vincula tu Cuenta de Google",
    description: "Autoriza de forma segura el acceso para Sheets y Drive. Nosotros no tenemos acceso a tus credenciales."
  },
  {
    num: "03",
    title: "Personaliza tus Columnas",
    description: "Vincula las columnas de tu hoja de cálculo (A, B, C, etc.) con los datos de movimientos (monto, fecha, concepto)."
  },
  {
    num: "04",
    title: "Registra y Controla",
    description: "Comienza a guardar movimientos locales y mira cómo se reflejan de inmediato en tus documentos en la nube."
  }
]

export default function EnCajaLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-lime-500 selection:text-slate-950 overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="M&M Tech House"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-sm text-slate-400 group-hover:text-white transition-colors">
              M&M Tech House
            </span>
          </Link>

          <Link
            href="mailto:info@mmtechhouse.co"
            className="text-xs uppercase tracking-wider text-slate-400 hover:text-lime-400 transition-colors"
          >
            Soporte
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-36 flex flex-col items-center text-center">
        {/* Animated App Icon Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-28 h-28 rounded-full bg-white p-2.5 flex items-center justify-center shadow-2xl shadow-lime-500/30 border border-slate-800/80 mb-8"
        >
          <div className="absolute inset-0 rounded-full bg-lime-500/15 animate-pulse blur-xl" />
          <Image
            src="/images/encaja_logo.png"
            alt="EnCaja Logo"
            width={90}
            height={90}
            className="relative z-10 object-contain animate-pulse-glow"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            EnCaja
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-lime-400 to-lime-200 bg-clip-text text-transparent mt-3">
            Controla tu Caja Menor. Simple y a tu Medida.
          </h2>
          <p className="mt-6 text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Registra tus movimientos financieros de forma local, administra fotos de facturas y sincroniza de manera automática directamente en tus propias Hojas de Cálculo de Google. 100% privado.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/encaja/privacy"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-lime-500 text-slate-950 font-bold text-sm hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/20"
          >
            Ver Política de Privacidad
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/encaja/terms"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-850 hover:text-white transition-colors"
          >
            Términos del Servicio
          </Link>
        </motion.div>
      </section>

      {/* Info Banner */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 mb-24">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-slate-900/40 to-lime-500/5 border border-slate-800/80 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
          <ShieldCheck className="w-8 h-8 text-lime-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white mb-1">Privacidad Total sobre tus Finanzas</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              EnCaja fue construida bajo la filosofía de no almacenar datos de usuarios en servidores de terceros. Todo flujo de datos bancarios o movimientos ingresados viaja exclusivamente de tu celular directamente a tu Google Drive personal a través de cifrado seguro SSL.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Características Clave
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            La potencia de un core financiero móvil moderno combinado con la flexibilidad de las hojas de cálculo tradicionales.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all group hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-lg bg-lime-500/10 text-lime-400 flex items-center justify-center mb-4 group-hover:bg-lime-500 group-hover:text-slate-950 transition-colors">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Steps */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 border-t border-slate-900">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            ¿Cómo Configurar EnCaja?
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            Sigue estos sencillos pasos para iniciar y conectar tu base de datos de manera autónoma.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group">
              <span className="font-mono text-5xl font-extrabold text-lime-500/10 group-hover:text-lime-500/25 transition-colors absolute top-[-30px] left-0 z-0">
                {step.num}
              </span>
              <div className="relative z-10 pt-4">
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-12 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">© {new Date().getFullYear()} EnCaja por M&M Tech House.</span>
          </div>

          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/encaja/privacy" className="hover:text-lime-400 transition-colors">
              Privacidad
            </Link>
            <Link href="/encaja/terms" className="hover:text-lime-400 transition-colors">
              Términos
            </Link>
            <a href="mailto:info@mmtechhouse.co" className="hover:text-lime-400 transition-colors">
              Soporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
