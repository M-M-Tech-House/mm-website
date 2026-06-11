"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Shield, FileText, ChevronLeft, Mail, Gavel, CheckCircle2 } from "lucide-react"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-lime-500 selection:text-slate-950">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Navigation / Header */}
        <div className="flex justify-between items-center mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-lime-400 transition-colors text-sm group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-slate-400">Desarrollado por</span>
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="M&M Tech House"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-16 border-b border-slate-800 pb-10"
        >
          {/* Circular EnCaja Logo with glow */}
          <div className="relative w-24 h-24 shrink-0 rounded-full bg-white p-2 flex items-center justify-center shadow-lg shadow-lime-500/20 border border-slate-800">
            <div className="absolute inset-0 rounded-full bg-lime-500/10 animate-pulse blur-md" />
            <Image
              src="/images/encaja_logo.png"
              alt="EnCaja Logo"
              width={80}
              height={80}
              className="relative z-10 object-contain animate-pulse-glow"
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 text-lime-400 text-xs font-medium mb-4">
              <Gavel className="w-3.5 h-3.5" />
              Acuerdo Legal
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent sm:text-5xl">
              Términos de Servicio de EnCaja
            </h1>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl">
              Al utilizar EnCaja, aceptas las siguientes reglas y condiciones de uso de la herramienta.
            </p>
            <p className="text-xs text-slate-500 mt-2">Última actualización: 3 de junio de 2026</p>
          </div>
        </motion.div>

        {/* Content Layout */}
        <div className="space-y-12">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              1. Aceptación de los Términos
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Al descargar, instalar y utilizar la aplicación **EnCaja** (en adelante, "la Aplicación"), aceptas cumplir y quedar sujeto a estos Términos de Servicio. Si no estás de acuerdo con estos términos, no debes instalar ni utilizar la Aplicación.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              2. Descripción del Servicio
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              EnCaja es una herramienta de contabilidad y gestión de caja menor diseñada para registrar movimientos financieros locales y sincronizarlos de manera opcional en las hojas de cálculo de Google Drive del usuario mediante APIs de terceros.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Toda la infraestructura y los recursos de almacenamiento utilizados para el guardado de datos (Hojas de Cálculo y archivos en la Nube) son propiedad, control y responsabilidad exclusiva del usuario, vinculados a su cuenta personal de Google.
            </p>
          </section>

          {/* Google Scope Compliance Statement */}
          <section className="p-6 rounded-2xl bg-gradient-to-br from-lime-500/5 to-transparent border border-slate-800">
            <h3 className="font-bold text-lime-400 mb-2">Declaración de Uso Limitado (Google API User Data Policy)</h3>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              El uso y transferencia de información recibida de las API de Google a cualquier otra aplicación por parte de EnCaja se realiza bajo los principios de **Uso Limitado** de Google. Los datos recopilados solo se utilizan para estructurar tus registros de caja y cargarlos en tu cuenta.
            </p>
            <p className="text-xs text-slate-400 italic font-mono border-t border-slate-800/80 pt-2">
              "EnCaja's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements."
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              3. Responsabilidad del Usuario
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-300">
              <li>Eres responsable de mantener la seguridad y confidencialidad de tu dispositivo móvil y de tu cuenta de Google.</li>
              <li>Eres responsable de la integridad y seguridad de las Hojas de Cálculo vinculadas y de la carpeta de fotos en tu cuenta de Google Drive.</li>
              <li>M&M Tech House no se hace responsable por pérdidas de datos, eliminaciones accidentales de hojas de cálculo o accesos no autorizados a tu cuenta de Google causados por descuidos en la seguridad del dispositivo del usuario.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-lime-400" />
              4. Modificaciones del Servicio
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Nos reservamos el derecho de modificar, actualizar, suspender o interrumpir el funcionamiento de la Aplicación en cualquier momento para aplicar actualizaciones técnicas, mejoras de rendimiento o de diseño.
            </p>
          </section>

          {/* Contact Section */}
          <section className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-bold text-lg mb-1">Contacto Legal</h3>
              <p className="text-sm text-slate-400">Si requieres aclaración sobre estos términos, escríbenos a nuestro correo.</p>
            </div>
            <a
              href="mailto:info@mmtechhouse.co"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-lime-500 text-slate-950 font-bold text-sm hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/20"
            >
              <Mail className="w-4 h-4" />
              info@mmtechhouse.co
            </a>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-slate-900 pt-8 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} M&M Tech House. Todos los derechos reservados.</p>
          <div className="mt-4 space-x-4">
            <Link href="/encaja/privacy" className="hover:text-lime-400 transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
