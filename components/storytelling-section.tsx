"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import { Coffee, Map, Smile, Rocket, MessageSquare, ShoppingCart, BarChart3, ChevronRight } from "lucide-react"
import { ContactModal } from "@/components/contact-modal"
import { SectionDecoration } from "@/components/section-decoration"

const steps = [
  {
    id: 1,
    icon: Coffee,
    title: "Tómate un café con nosotros",
    description: "Nos sentamos a charlar como amigos. Nos cuentas tu idea y tus problemas de negocio sin tecnicismos, palabras en inglés confusas ni lenguaje corporativo aburrido. Queremos entenderte, no impresionarte.",
  },
  {
    id: 2,
    icon: Map,
    title: "Tu hoja de ruta en 48 horas",
    description: "Creamos un plan visual claro y un presupuesto 100% transparente y cerrado en solo dos días. Sin sorpresas, sin tarifas ocultas y sin letras pequeñas. Sabrás exactamente qué construiremos y cuánto costará.",
  },
  {
    id: 3,
    icon: Smile,
    title: "Relájate mientras creamos",
    description: "Nosotros nos encargamos del trabajo duro. Dividimos el proyecto en entregas cada dos semanas para que puedas tocar y probar los avances reales. Mientras tú descansas, nosotros escribimos el código.",
  },
  {
    id: 4,
    icon: Rocket,
    title: "Entrega con un solo clic",
    description: "Llegó el gran día. Nos encargamos de todo el despliegue técnico: subir las aplicaciones a las tiendas (App Store y Play Store), configurar los servidores en la nube y dejar todo listo para que empieces a facturar.",
  },
  {
    id: 5,
    icon: MessageSquare,
    title: "Soporte que te acompaña siempre",
    description: "No desaparecemos tras la entrega. Estamos a la distancia de un mensaje de WhatsApp para cualquier duda, ajuste o mejora que necesites. Un soporte rápido, humano y sin burocracia.",
  },
]

const caseStudies = [
  {
    name: "JotaM Autopartes",
    type: "E-commerce",
    icon: ShoppingCart,
    description: "Plataforma de comercio electrónico completa con gestión de inventario, pasarela de pagos y control de ventas.",
  },
  {
    name: "El Charco del Ingeniero",
    type: "POS & Gestión",
    icon: BarChart3,
    description: "Sistema de punto de venta y gestión empresarial integral para facturación y control de inventarios físicos.",
  },
]

const nodeVariants = {
  inactive: {
    scale: 0.85,
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    color: "#64748b",
  },
  active: {
    scale: 1.15,
    backgroundColor: "#457bb3",
    borderColor: "#264164",
    color: "#ffffff",
    boxShadow: "0 0 25px rgba(69, 123, 179, 0.4)",
  },
}

const cardVariants = {
  inactive: {
    opacity: 0.5,
    y: 15,
    scale: 0.97,
  },
  active: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
    } as const,
  },
}

export function StorytellingSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Track scroll relative to the TIMELINE WRAPPER ONLY, not the whole section
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 85%", "end 55%"],
  })

  const heightPct = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const smoothHeight = useSpring(heightPct, {
    stiffness: 80,
    damping: 22,
    restDelta: 0.001,
  })

  return (
    <section
      ref={containerRef}
      id="proceso"
      className="relative py-24 md:py-36 overflow-hidden bg-white"
    >
      {/* Edge decorations — scroll with the section naturally */}
      <SectionDecoration
        nodes={[
          {
            side: "left",
            convergenceYPct: 28,
            xCenterPx: 170,
            xEdgePx: 20,
            lines: [
              { yStartPct: 12, yOffsetPx: -18, r: 7, phase: 0, horizontalStartPx: 50 },
              { yStartPct: 24, yOffsetPx: -5, r: 6, phase: 1.2, horizontalStartPx: 35 },
              { yStartPct: 36, yOffsetPx: 8, r: 7.5, phase: 2.4, horizontalStartPx: 60 },
              { yStartPct: 50, yOffsetPx: 20, r: 6, phase: 3.6, horizontalStartPx: 40 },
            ],
          },
          {
            side: "left",
            convergenceYPct: 80,
            xCenterPx: 155,
            xEdgePx: 20,
            lines: [
              { yStartPct: 65, yOffsetPx: -14, r: 6.5, phase: 0.3, horizontalStartPx: 45 },
              { yStartPct: 80, yOffsetPx: 0, r: 7.5, phase: 1.5, horizontalStartPx: 65 },
              { yStartPct: 92, yOffsetPx: 12, r: 6, phase: 2.7, horizontalStartPx: 35 },
            ],
          },
          {
            side: "right",
            convergenceYPct: 42,
            xCenterPx: 165,
            xEdgePx: 20,
            lines: [
              { yStartPct: 20, yOffsetPx: -20, r: 8, phase: 0.6, horizontalStartPx: 55 },
              { yStartPct: 32, yOffsetPx: -7, r: 7, phase: 1.8, horizontalStartPx: 40 },
              { yStartPct: 46, yOffsetPx: 7, r: 7.5, phase: 3.0, horizontalStartPx: 70 },
            ],
          },
          {
            side: "right",
            convergenceYPct: 74,
            xCenterPx: 158,
            xEdgePx: 20,
            lines: [
              { yStartPct: 58, yOffsetPx: -14, r: 6.5, phase: 0.4, horizontalStartPx: 50 },
              { yStartPct: 70, yOffsetPx: 0, r: 8, phase: 1.6, horizontalStartPx: 30 },
              { yStartPct: 85, yOffsetPx: 14, r: 6.5, phase: 2.8, horizontalStartPx: 60 },
            ],
          },
        ]}
      />
      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <span className="text-xs font-bold tracking-wider text-[#264164] uppercase bg-[#264164]/5 px-4 py-1.5 rounded-full border border-[#264164]/10">
            ¿Cómo trabajamos?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 mb-5 text-slate-900 tracking-tight">
            Contratar tecnología con nosotros es <span className="bg-gradient-to-r from-[#264164] to-[#68c6d7] bg-clip-text text-transparent">Extremadamente Fácil</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Te acompañamos paso a paso en un proceso transparente, sin tecnicismos complejos y pensado para que te relajes mientras hacemos realidad tu proyecto.
          </p>
        </motion.div>

        {/* Timeline wrapper — ref used for scroll tracking */}
        <div ref={timelineRef} className="relative mb-32">
          {/* Vertical line background */}
          <div className="absolute left-8 md:left-1/2 inset-y-0 w-1 bg-slate-100 -translate-x-1/2 rounded-full" />

          {/* Active fill line — grows from top as user scrolls through the steps */}
          <motion.div
            className="absolute left-8 md:left-1/2 top-0 w-1 bg-gradient-to-b from-[#264164] to-[#457bb3] -translate-x-1/2 rounded-full"
            style={{ height: smoothHeight }}
          />

          {/* Timeline steps */}
          <div className="space-y-16">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0
              return (
                <motion.div
                  key={step.id}
                  initial="inactive"
                  whileInView="active"
                  viewport={{ once: false, amount: 0.6, margin: "-10% 0px -15% 0px" }}
                  className="relative flex flex-col md:flex-row items-stretch md:justify-between"
                >
                  {/* Circle indicator on the line */}
                  <motion.div
                    variants={nodeVariants}
                    className="absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 flex items-center justify-center z-20 transition-all duration-300 bg-white"
                  >
                    <step.icon className="w-5 h-5" />
                  </motion.div>

                  {/* Card container */}
                  <div className={`w-full md:w-[44%] ${isEven ? "md:order-1" : "md:order-3"} pl-16 md:pl-0 flex`}>
                    <motion.div
                      variants={cardVariants}
                      className="bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_4px_15px_rgba(15,23,42,0.01)] hover:border-[#264164]/20 hover:bg-white transition-all duration-500 flex flex-col justify-center flex-1"
                    >
                      <span className="text-xs font-extrabold text-[#264164] uppercase tracking-widest mb-1 block">
                        Paso 0{step.id}
                      </span>
                      <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Spacer for desktop layout alignment */}
                  <div className="hidden md:block w-[44%] md:order-2" />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Case studies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-wider text-[#264164] uppercase bg-[#264164]/5 px-4 py-1.5 rounded-full border border-[#264164]/10">
              Casos de éxito
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-4 tracking-tight">
              Proyectos de <span className="text-[#264164]">Alto Impacto</span>
            </h3>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Descubre cómo ayudamos a otros negocios a automatizarse y escalar sus operaciones con soluciones robustas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-slate-100 rounded-3xl p-8 hover:border-[#264164]/20 hover:shadow-[0_15px_30px_rgba(38,65,100,0.03)] transition-all duration-300 group"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#264164]/5 flex items-center justify-center group-hover:bg-[#264164] transition-colors duration-300">
                    <study.icon className="w-6 h-6 text-[#264164] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-extrabold text-[#457bb3] tracking-wide uppercase">
                      {study.type}
                    </span>
                    <h4 className="text-xl font-bold mt-1 text-slate-900">{study.name}</h4>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                      {study.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Banner Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-[#264164] to-[#457bb3] text-white rounded-3xl p-10 md:p-14 overflow-hidden shadow-xl shadow-[#264164]/10 text-center max-w-4xl mx-auto"
        >
          {/* Subtle decoration elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#457bb3]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-4xl font-extrabold mb-4 tracking-tight leading-tight">
              ¿Qué problema le está quitando el sueño a tu negocio hoy?
            </h3>
            <p className="text-slate-200 text-base md:text-lg mb-8 leading-relaxed">
              No dejes que la complejidad técnica te detenga. Contáctanos hoy mismo y cuéntanos qué necesitas; nosotros nos encargamos de todo.
            </p>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#264164] font-extrabold text-base md:text-lg rounded-2xl shadow-lg transition-all duration-300 hover:bg-slate-100"
            >
              Mandar mi SOS tecnológico
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
