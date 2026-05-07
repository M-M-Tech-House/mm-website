"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, CheckCircle2 } from "lucide-react"

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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1628]/90 backdrop-blur-xl shadow-[0_0_60px_rgba(0,74,153,0.3)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header gradient bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-cyan-400" />

              <div className="p-8">
                {/* Close button */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Cuéntanos tu{" "}
                      <span className="text-accent">problema</span> 🚀
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Sin vueltas. Escribinos y te respondemos rápido.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
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
                    <CheckCircle2 className="w-16 h-16 text-accent" />
                    <p className="text-xl font-bold text-foreground text-center">
                      ¡Mensaje recibido! 🎉
                    </p>
                    <p className="text-muted-foreground text-center text-sm">
                      Ya podés dormir tranquilo, nos encargamos nosotros.
                    </p>
                  </motion.div>
                ) : status === "error" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-4"
                  >
                    <span className="text-5xl">😬</span>
                    <p className="text-xl font-bold text-foreground text-center">
                      Algo salió mal
                    </p>
                    <p className="text-muted-foreground text-center text-sm">
                      No pudimos enviar tu mensaje. Intentá de nuevo en un momento.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-medium text-muted-foreground mb-1.5"
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
                        placeholder="Ej: Martín, el que no duerme"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all text-sm"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-muted-foreground mb-1.5"
                      >
                        Tu email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="sinsueno@outlook.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all text-sm"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-muted-foreground mb-1.5"
                      >
                        ¿Qué problema te quita el sueño?
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, message: e.target.value }))
                        }
                        placeholder="No puedo dormir porque las facturas me vuelven loco, mi sistema explota cada fin de mes y mi equipo ya me mira raro cuando digo 'lo arreglamos con Excel'..."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={status === "sending"}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent to-lime-400 text-accent-foreground font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(140,198,63,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Mandar mi SOS tecnológico
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
