"use client"

import { motion } from "framer-motion"
import { Cloud, Code2, Lightbulb } from "lucide-react"

const services = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    subtitle: "AWS",
    description:
      "Diseñamos e implementamos infraestructuras en la nube que escalan con tu negocio. Optimización de costos y alta disponibilidad.",
  },
  {
    icon: Code2,
    title: "SaaS Development",
    subtitle: "Software as a Service",
    description:
      "Desarrollamos aplicaciones SaaS completas, desde la arquitectura hasta el despliegue. Soluciones listas para monetizar.",
  },
  {
    icon: Lightbulb,
    title: "Strategic Consulting",
    subtitle: "Consultoría",
    description:
      "Asesoramos en decisiones tecnológicas críticas. Te ayudamos a elegir el stack correcto y evitar errores costosos.",
  },
]

const techLogos = [
  { name: "Python", letter: "Py" },
  { name: "React", letter: "Re" },
  { name: "PostgreSQL", letter: "Pg" },
  { name: "AWS", letter: "AWS" },
  { name: "TypeScript", letter: "TS" },
  { name: "Node.js", letter: "No" },
  { name: "Docker", letter: "Do" },
  { name: "Next.js", letter: "Nx" },
]

export function ServicesSection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ecosistema <span className="text-primary">Tecnológico</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Servicios completos para llevar tu idea de concepto a producción
          </p>
        </motion.div>

        {/* Services grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass rounded-xl p-6 md:p-8 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,74,153,0.2)]">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <span className="text-xs font-mono text-accent uppercase tracking-wider">
                  {service.subtitle}
                </span>
                <h3 className="text-xl md:text-2xl font-bold mt-2 mb-4">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech stack slider */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-center mb-8 text-muted-foreground">
            Stack Tecnológico
          </h3>

          <div className="relative overflow-hidden py-4">
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

            {/* Sliding logos */}
            <div className="flex animate-slide">
              {[...techLogos, ...techLogos].map((tech, index) => (
                <div
                  key={`${tech.name}-${index}`}
                  className="flex-shrink-0 mx-8 flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground font-mono text-lg font-bold hover:bg-accent/20 hover:text-accent transition-colors cursor-default">
                    {tech.letter}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
