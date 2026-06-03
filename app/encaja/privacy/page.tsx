"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Shield, Eye, Lock, FileText, ChevronLeft, Mail, Info } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-lime-500 selection:text-slate-950">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[150px]" />
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
            <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-lg shadow-lime-500/10">
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
              <Shield className="w-3.5 h-3.5" />
              Seguridad & Privacidad
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent sm:text-5xl">
              Política de Privacidad de EnCaja
            </h1>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl">
              Tu privacidad y el control total sobre tus finanzas son la base de nuestra aplicación. Conoce cómo protegemos y gestionamos tus datos.
            </p>
            <p className="text-xs text-slate-500 mt-2">Última actualización: 3 de junio de 2026</p>
          </div>
        </motion.div>

        {/* Content Layout */}
        <div className="space-y-12">
          {/* Google API Compliance Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20"
          >
            <div className="flex gap-4">
              <Info className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-400 mb-2">Declaración de Cumplimiento de Datos de Google</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  El uso y la transferencia por parte de <strong>EnCaja</strong> de la información recibida de las API de Google a cualquier otra aplicación se ajustará a la <Link href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" className="underline text-blue-300 hover:text-blue-200">Política de Datos de Usuario de los Servicios de API de Google</Link>, incluidos los requisitos de Uso Limitado.
                </p>
                <div className="border-t border-slate-800/60 pt-3 mt-3">
                  <p className="text-xs text-slate-400 italic font-mono">
                    "EnCaja's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Privacy Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center text-lime-400 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">Almacenamiento 100% Local</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Toda la base de datos de movimientos, configuraciones y registros de transacciones se guarda directamente en tu dispositivo físico mediante almacenamiento cifrado local. Nosotros no alojamos bases de datos externas de tus finanzas.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center text-lime-400 mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">Sin Intermediarios</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Los datos viajan de manera segura y directa desde la aplicación en tu celular hacia tu cuenta personal de Google Drive y Google Sheets. Ningún servidor de M&M Tech House recopila ni procesa tus transacciones financieras.
              </p>
            </div>
          </div>

          {/* Detailed Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-lime-400" />
              1. Permisos Solicitados y su Uso
            </h2>
            <div className="pl-6 border-l border-slate-800 space-y-6 text-slate-300">
              <div>
                <h4 className="font-bold text-white mb-1">Google Sheets API (Hojas de cálculo de Google)</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Permite a la aplicación sincronizar y escribir de forma ordenada tus movimientos de caja (ingresos, egresos, tags y conceptos) directamente en las hojas de cálculo que tú elijas dentro de tu propia cuenta de Google. No lee ni modifica hojas ajenas a la configuración del sistema.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">Google Drive API (Almacenamiento de archivos)</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Permite a EnCaja crear una carpeta segura llamada <code>EnCaja_Photos</code> en tu cuenta de Google Drive para subir y almacenar las fotos de los recibos o facturas que tomas como soporte físico de tus movimientos de dinero.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">2. Seguridad de tus Datos</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La conexión a la API de Google se realiza mediante el SDK nativo de Google Play Services en tu dispositivo, utilizando protocolos estándar de OAuth 2.0. Las credenciales de autorización se almacenan de manera segura en el espacio de almacenamiento aislado de Android, impidiendo que otras aplicaciones tengan acceso a tu cuenta de Google.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">3. Compartir Información</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              M&M Tech House no vende, comercializa, transfiere ni comparte ninguna información recopilada mediante los alcances de la API de Google a terceras partes, redes de anuncios u otros servidores de análisis externos.
            </p>
          </section>

          {/* Contact Section */}
          <section className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-bold text-lg mb-1">¿Tienes alguna pregunta sobre nuestra política?</h3>
              <p className="text-sm text-slate-400">Escríbenos directamente y responderemos a la brevedad.</p>
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
            <Link href="/encaja/terms" className="hover:text-lime-400 transition-colors">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
