"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Linkedin, Github, Heart } from "lucide-react"

const XIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const socialLinks = [
  { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/111298213/" },
  { name: "X (Twitter)", icon: XIcon, href: "https://x.com/mmtechhouse" },
  { name: "GitHub", icon: Github, href: "https://github.com/M-M-Tech-House" },
]

const quickLinks = [
  { name: "Nuestra Casa", href: "#" },
  { name: "Proyectos", href: "#proceso" },
  { name: "Contacto", href: "#contacto" },
]

export function Footer() {
  return (
    <footer id="contacto" className="relative py-16 border-t border-slate-200 bg-slate-50">
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4 w-16 h-16 flex items-center justify-center"
            >
              <Image
                src="/images/logo.png"
                alt="M&M Tech House"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </motion.div>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Tecnología simple y a tu medida. Construimos soluciones robustas y transparentes que transforman y automatizan tu negocio.
            </p>
          </div>

          {/* Quick links */}
          <div className="text-center md:text-left md:pl-12">
            <h4 className="font-extrabold text-slate-900 text-base mb-4 tracking-tight">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-500 hover:text-[#457bb3] transition-colors text-sm font-medium"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social links */}
          <div className="text-center">
            <h4 className="font-extrabold text-slate-900 text-base mb-4 tracking-tight">Síguenos</h4>
            <div className="flex justify-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 hover:bg-[#264164] hover:text-white hover:border-[#264164] transition-all duration-300 shadow-sm"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200/60 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} M&M Tech House. Todos los derechos reservados.
          </p>
          <p className="text-slate-400 text-xs mt-2 flex items-center justify-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-[#457bb3] fill-[#457bb3]" /> en Colombia
          </p>
        </div>
      </div>
    </footer>
  )
}
