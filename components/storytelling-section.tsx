"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Zap, Building2, Rocket, ShoppingCart, BarChart3 } from "lucide-react"
import { ContactModal } from "@/components/contact-modal"

const processSteps = [
  {
    id: 1,
    icon: Zap,
    title: "Análisis de Caos",
    description:
      "Convertimos la complejidad en claridad. Analizamos tu problema desde todos los ángulos para encontrar la solución más elegante.",
    color: "from-primary to-blue-400",
  },
  {
    id: 2,
    icon: Building2,
    title: "Arquitectura de Cimientos",
    description:
      "Diseñamos sistemas escalables y mantenibles. Como Software Architects, construimos bases sólidas que soportan el crecimiento.",
    color: "from-accent to-lime-300",
  },
  {
    id: 3,
    icon: Rocket,
    title: "Solución Real",
    description:
      "Entregamos productos que funcionan. No prototipos, sino soluciones reales que generan impacto desde el día uno.",
    color: "from-cyan-500 to-blue-400",
  },
]

const caseStudies = [
  {
    name: "JotaM Autopartes",
    type: "E-commerce",
    icon: ShoppingCart,
    description: "Plataforma de comercio electrónico completa con gestión de inventario y ventas.",
  },
  {
    name: "El Charco del Ingeniero",
    type: "POS & Gestión",
    icon: BarChart3,
    description: "Sistema de punto de venta y gestión empresarial integral.",
  },
]

export function StorytellingSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section
      ref={containerRef}
      id="proceso"
      className="relative py-20 md:py-32 overflow-hidden"
    >
      {/* Circuit line SVG */}
      <svg
        className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-4 pointer-events-none hidden md:block"
        viewBox="0 0 16 1000"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M8 0 L8 1000"
          stroke="url(#circuitGradient)"
          strokeWidth="2"
          fill="none"
          className="circuit-glow"
          style={{ pathLength }}
        />
        <defs>
          <linearGradient id="circuitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8CC63F" />
            <stop offset="50%" stopColor="#004A99" />
            <stop offset="100%" stopColor="#8CC63F" />
          </linearGradient>
        </defs>
      </svg>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Nuestro <span className="text-accent">Proceso</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transformamos ideas en soluciones tecnológicas que funcionan
          </p>
        </motion.div>

        {/* Process steps */}
        <div className="space-y-12 md:space-y-16 mb-20 md:mb-32 max-w-3xl mx-auto">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col md:flex-row items-center md:items-start gap-6"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${step.color} p-5 flex items-center justify-center shadow-lg`}
                >
                  <step.icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <span className="text-accent font-mono text-sm">
                  0{step.id}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Case studies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Proyectos de <span className="text-accent">Alto Impacto</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-xl p-6 group hover:border-accent/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <study.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-accent uppercase tracking-wider">
                      {study.type}
                    </span>
                    <h4 className="text-xl font-bold mt-1">{study.name}</h4>
                    <p className="text-muted-foreground text-sm mt-2">
                      {study.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-accent to-lime-400 text-accent-foreground font-bold text-lg md:text-xl rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(140,198,63,0.4)]"
          >
            <span className="relative z-10">
              ¿Qué problema te está quitando el sueño hoy?
            </span>
          </motion.button>
        </motion.div>
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
