"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Linkedin, Github, Instagram } from "lucide-react"

const socialLinks = [
  { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/111298213/" },
  { name: "GitHub", icon: Github, href: "https://github.com/M-M-Tech-House" },
]

const quickLinks = [
  { name: "Nuestra Casa", href: "#" },
  { name: "Proyectos", href: "#proceso" },
  { name: "Contacto", href: "#contacto" },
]

export function Footer() {
  return (
    <footer id="contacto" className="relative py-16 border-t border-border/50">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center md:items-start">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 12px rgba(140, 198, 63, 0.3)",
                  "0 0 24px rgba(140, 198, 63, 0.5)",
                  "0 0 12px rgba(140, 198, 63, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-4 w-20 h-20 rounded-full bg-white p-1.5 flex items-center justify-center"
            >
              <Image
                src="/images/logo.png"
                alt="M&M Tech House"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </motion.div>
            <p className="text-muted-foreground text-sm text-center md:text-left max-w-xs">
              Tecnología simple y a tu medida. Construimos soluciones que
              transforman negocios.
            </p>
          </div>

          {/* Quick links */}
          <div className="text-center md:text-left">
            <h4 className="font-bold text-lg mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social links */}
          <div className="text-center md:text-right">
            <h4 className="font-bold text-lg mb-4">Síguenos</h4>
            <div className="flex justify-center md:justify-end gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} M&M Tech House. Todos los derechos
            reservados.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Hecho con 💚 en Colombia
          </p>
        </div>
      </div>
    </footer>
  )
}
