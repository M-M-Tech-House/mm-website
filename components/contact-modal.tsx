"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, CheckCircle2, MessageSquare, Sparkles } from "lucide-react"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error("Error al enviar")

      setStatus("sent")
      setTimeout(() => {
        onClose()
        setStatus("idle")
        setForm({ name: "", email: "", message: "" })
      }, 2500)
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(36,88,147,0.06)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header gradient bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[#264164] to-[#457bb3]" />

              <div className="p-8">
                {/* Close button */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      Cuéntanos tu <span className="bg-gradient-to-r from-[#264164] to-[#457bb3] bg-clip-text text-transparent">problema</span> <MessageSquare className="w-5 h-5 text-[#457bb3]" />
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Sin rodeos. Escríbenos y te responderemos rápido.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {status === "sent" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-4"
                  >
                    <CheckCircle2 className="w-16 h-16 text-[#457bb3]" />
                    <p className="text-xl font-bold text-slate-900 text-center flex items-center gap-1.5">
                      ¡Mensaje recibido! <Sparkles className="w-5 h-5 text-[#457bb3]" />
                    </p>
                    <p className="text-slate-500 text-center text-sm max-w-xs">
                      Ya puedes respirar tranquilo. Nos pondremos en contacto contigo de inmediato.
                    </p>
                  </motion.div>
                ) : status === "error" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-4"
                  >
                    <span className="text-5xl">😬</span>
                    <p className="text-xl font-bold text-slate-900 text-center">
                      Algo salió mal
                    </p>
                    <p className="text-slate-500 text-center text-sm">
                      No pudimos enviar tu mensaje. Inténtalo de nuevo en un momento.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-semibold text-slate-700 mb-1.5"
                      >
                        Tu nombre
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Ej: Martín, gerente de operaciones"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#264164]/60 focus:ring-4 focus:ring-[#264164]/5 transition-all text-sm"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-semibold text-slate-700 mb-1.5"
                      >
                        Tu correo electrónico
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="ejemplo@empresa.com"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#264164]/60 focus:ring-4 focus:ring-[#264164]/5 transition-all text-sm"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-semibold text-slate-700 mb-1.5"
                      >
                        ¿Qué solución o problema quieres discutir?
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, message: e.target.value }))
                        }
                        placeholder="Necesitamos un sitio web que conecte con nuestro ERP, o automatizar nuestro almacén para no depender de planillas manuales..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#264164]/60 focus:ring-4 focus:ring-[#264164]/5 transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={status === "sending"}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#264164] hover:bg-[#1f3552] text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-[#264164]/10 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando tu SOS...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar consulta rápida
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
