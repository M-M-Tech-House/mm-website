"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Code2, Globe, Smartphone, Sparkles, Cpu } from "lucide-react"
import { SectionDecoration } from "@/components/section-decoration"

const services = [
  {
    icon: Code2,
    title: "Desarrollo de software a la medida",
    subtitle: "Software único",
    description: "Soluciones exclusivas diseñadas para optimizar tus procesos reales, eliminando las funciones innecesarias que solo complican tu día a día.",
    span: "lg:col-span-3",
  },
  {
    icon: Globe,
    title: "Sitios web profesionales",
    subtitle: "Presencia y conversión",
    description: "Plataformas ultrarrápidas, tiendas en línea (e-commerce) y landing pages optimizadas para Google que convierten visitas en clientes.",
    span: "lg:col-span-3",
  },
  {
    icon: Smartphone,
    title: "Aplicativos móviles",
    subtitle: "iOS y Android",
    description: "Aplicaciones fluidas, rápidas e intuitivas que tus clientes amarán llevar en sus bolsillos.",
    span: "lg:col-span-2",
  },
  {
    icon: Sparkles,
    title: "Inteligencia artificial",
    subtitle: "Automatización inteligente",
    description: "Integración de automatizaciones inteligentes, lectura automatizada de datos (OCR) y modelos locales de lenguaje (LLMs) para decidir mejor.",
    span: "lg:col-span-2",
  },
  {
    icon: Cpu,
    title: "Domótica & IoT",
    subtitle: "Espacios conectados",
    description: "Automatización de tus espacios físicos (iluminación, seguridad, sensores) conectados directamente con tu software de gestión.",
    span: "lg:col-span-2",
  },
]

const techStack = [
  {
    name: "React",
    color: "#61DAFB",
    shadow: "rgba(97, 218, 251, 0.2)",
    image: "/images/icons8-react-96.png",
  },
  {
    name: "Next.js",
    color: "#000000",
    shadow: "rgba(15, 23, 42, 0.15)",
    image: "/images/icons8-nextjs-96.png",
  },
  {
    name: "TypeScript",
    color: "#3178C6",
    shadow: "rgba(49, 120, 198, 0.2)",
    image: "/images/icons8-typescript-96.png",
  },
  {
    name: "Node.js",
    color: "#339933",
    shadow: "rgba(51, 153, 51, 0.2)",
    image: "/images/icons8-nodo-js-96.png",
  },
  {
    name: "Python",
    color: "#3776AB",
    shadow: "rgba(55, 118, 171, 0.2)",
    image: "/images/icons8-python-96.png",
  },
  {
    name: "PostgreSQL",
    color: "#336791",
    shadow: "rgba(51, 103, 145, 0.2)",
    image: "/images/icons8-postgresql-100.png",
  },
  {
    name: "Redis",
    color: "#D82C20",
    shadow: "rgba(216, 44, 32, 0.2)",
    image: "/images/icons8-redis-96.png",
  },
  {
    name: "Docker",
    color: "#2496ED",
    shadow: "rgba(36, 150, 237, 0.2)",
    image: "/images/icons8-docker-96.png",
  },
]

export function ServicesSection() {
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const [activeVideo, setActiveVideo] = useState<"video1" | "video2">("video1")

  useEffect(() => {
    if (activeVideo === "video1") {
      if (video1Ref.current) {
        video1Ref.current.currentTime = 0
        video1Ref.current.play().catch(() => {})
      }
      video2Ref.current?.pause()
    } else {
      if (video2Ref.current) {
        video2Ref.current.currentTime = 0
        video2Ref.current.play().catch(() => {})
      }
      video1Ref.current?.pause()
    }
  }, [activeVideo])

  return (
    <section id="servicios" className="py-24 md:py-36 relative overflow-hidden bg-slate-50/10">
      {/* Edge decorations — starts after "Nuestra especialidad" header (~28% from top) */}
      <SectionDecoration
        nodes={[
          {
            side: "left",
            convergenceYPct: 52,
            xCenterPx: 162,
            xEdgePx: 20,
            lines: [
              { yStartPct: 30, yOffsetPx: -14, r: 7, phase: 0.2, horizontalStartPx: 55 },
              { yStartPct: 45, yOffsetPx: 0, r: 7.5, phase: 1.4, horizontalStartPx: 38 },
              { yStartPct: 60, yOffsetPx: 14, r: 6.5, phase: 2.6, horizontalStartPx: 65 },
            ],
          },
          {
            side: "left",
            convergenceYPct: 84,
            xCenterPx: 155,
            xEdgePx: 20,
            lines: [
              { yStartPct: 72, yOffsetPx: -12, r: 6.5, phase: 0.5, horizontalStartPx: 45 },
              { yStartPct: 84, yOffsetPx: 0, r: 7.5, phase: 1.7, horizontalStartPx: 60 },
              { yStartPct: 96, yOffsetPx: 12, r: 6, phase: 2.9, horizontalStartPx: 35 },
            ],
          },
          {
            side: "right",
            convergenceYPct: 60,
            xCenterPx: 168,
            xEdgePx: 20,
            lines: [
              { yStartPct: 34, yOffsetPx: -20, r: 8, phase: 0, horizontalStartPx: 50 },
              { yStartPct: 50, yOffsetPx: -5, r: 7, phase: 1.2, horizontalStartPx: 35 },
              { yStartPct: 65, yOffsetPx: 10, r: 7.5, phase: 2.4, horizontalStartPx: 70 },
            ],
          },
          {
            side: "right",
            convergenceYPct: 88,
            xCenterPx: 155,
            xEdgePx: 20,
            lines: [
              { yStartPct: 75, yOffsetPx: -12, r: 7, phase: 0.7, horizontalStartPx: 55 },
              { yStartPct: 88, yOffsetPx: 0, r: 8, phase: 1.9, horizontalStartPx: 40 },
            ],
          },
        ]}
      />
      {/* Background Videos - Alternating with smooth crossfade */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={video1Ref}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setActiveVideo("video2")}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            activeVideo === "video1" ? "opacity-75" : "opacity-0"
          }`}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <video
          ref={video2Ref}
          muted
          playsInline
          preload="auto"
          onEnded={() => setActiveVideo("video1")}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            activeVideo === "video2" ? "opacity-75" : "opacity-0"
          }`}
        >
          <source src="/videos/hero-bg-2.mp4" type="video/mp4" />
        </video>
        {/* Soft light overlay with gradient for readability and card contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/60 to-slate-50/90 z-0" />
      </div>



      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-bold tracking-wider text-[#264164] uppercase bg-[#264164]/5 px-4 py-1.5 rounded-full border border-[#264164]/10">
            Nuestra especialidad
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 mb-5 text-slate-900 tracking-tight">
            Tecnología para tu negocio, <span className="bg-gradient-to-r from-[#264164] to-[#457bb3] bg-clip-text text-transparent">sin complicaciones</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Eliminamos el miedo técnico. Creamos soluciones robustas y elegantes adaptadas a tus objetivos, explicadas de forma cercana y comprensible.
          </p>
        </motion.div>

        {/* Services grid - Asymmetric 3+2 columns balance layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-28">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group ${service.span}`}
            >
              <div className="bg-white rounded-3xl p-8 h-full border border-slate-100/80 shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-500 hover:border-[#264164]/20 hover:shadow-[0_20px_40px_rgba(38,65,100,0.04)] hover:-translate-y-1">
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-[#264164]/5 flex items-center justify-center mb-6 group-hover:bg-[#264164] transition-colors duration-500 shadow-sm">
                  <service.icon className="w-6 h-6 text-[#264164] group-hover:text-white transition-colors duration-500" />
                </div>

                {/* Subtitle / tag */}
                <span className="text-xs font-extrabold text-[#457bb3] tracking-wide uppercase">
                  {service.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold mt-2 mb-4 text-slate-900">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech stack grid (New Modern Ecosystem) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Ecosistema Tecnológico
            </h3>
            <p className="text-slate-500 text-base mb-12">
              Trabajamos con las herramientas líderes de la industria para garantizar que tu producto sea rápido, escalable y duradero.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {techStack.map((tech) => (
                <motion.div
                  key={tech.name}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: `0 12px 30px ${tech.shadow}`,
                    borderColor: `${tech.color}40`,
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-2xl transition-all duration-300 group cursor-default shadow-[0_4px_10px_rgba(15,23,42,0.01)]"
                >
                  <div className="w-16 h-16 flex items-center justify-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                    <Image
                      src={tech.image}
                      alt={tech.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">
                    {tech.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
