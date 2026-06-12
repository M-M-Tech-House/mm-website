"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Menu, X, Send, ChevronDown } from "lucide-react"
import { ContactModal } from "./contact-modal"
import { usePathname, useRouter } from "next/navigation"

const navItems = [
  { name: "Inicio", href: "/#" },
  { name: "Servicios", href: "/#servicios" },
  { name: "Proceso", href: "/#proceso" },
  { 
    name: "Herramientas", 
    href: "#", 
    dropdownItems: [
      { 
        name: "Cuenta de Cobro", 
        href: "/herramientas/cuenta-de-cobro", 
        description: "Generador de cuenta de cobro profesional" 
      }
    ] 
  },
  { name: "Contacto", href: "/#contacto" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/') && !href.startsWith('/#')) {
      setIsMobileMenuOpen(false)
      return
    }

    e.preventDefault()
    setIsMobileMenuOpen(false)
    
    const targetHash = href.startsWith('/') ? href.slice(1) : href
    
    if (pathname !== '/') {
      router.push('/' + targetHash)
      return
    }

    if (targetHash === "#" || targetHash === "") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const target = document.querySelector(targetHash)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <>
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl z-50 transition-all duration-300 rounded-2xl ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg border border-slate-200/50 shadow-[0_10px_35px_rgba(38,65,100,0.06)]"
            : "bg-white/40 backdrop-blur-md border border-slate-200/20 shadow-[0_5px_20px_rgba(38,65,100,0.02)]"
        }`}
      >
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/#"
            onClick={(e) => handleNavClick(e, "/#")}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/images/logo.png"
                alt="M&M Tech House"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-sm md:text-base hidden sm:inline-block">
              M&M <span className="text-[#264164] bg-gradient-to-r from-[#264164] to-[#457bb3] bg-clip-text text-transparent">Tech House</span>
            </span>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              if (item.dropdownItems) {
                return (
                  <div key={item.name} className="relative group py-1">
                    <button className="text-sm font-semibold text-slate-600 hover:text-[#264164] transition-colors flex items-center gap-1 group/btn cursor-pointer">
                      {item.name}
                      <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180 text-slate-400 group-hover/btn:text-[#264164]" />
                    </button>
                    {/* Dropdown Menu Container */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl border border-slate-200/50 bg-white/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(38,65,100,0.08)] py-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 origin-top group-hover:scale-100 z-50">
                      {item.dropdownItems.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          onClick={(e) => handleNavClick(e, subItem.href)}
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors group/item"
                        >
                          <div className="text-sm font-bold text-slate-800 group-hover/item:text-[#264164] transition-colors">
                            {subItem.name}
                          </div>
                          {subItem.description && (
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                              {subItem.description}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              }
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-semibold text-slate-600 hover:text-[#264164] transition-colors relative group py-1"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#457bb3] transition-all duration-300 group-hover:w-full" />
                </a>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-[#264164] text-white font-bold text-sm rounded-xl hover:bg-[#1f3552] hover:scale-105 transition-all duration-300 shadow-sm shadow-[#264164]/10 flex items-center gap-1.5"
            >
              Mandar SOS <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-[#264164] text-white font-bold text-xs rounded-lg hover:bg-[#1f3552] transition-all"
            >
              Mandar SOS
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg rounded-b-2xl overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                {navItems.map((item) => {
                  if (item.dropdownItems) {
                    return (
                      <div key={item.name} className="flex flex-col border-b border-slate-100/50 py-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                          {item.name}
                        </span>
                        <div className="flex flex-col pl-4 gap-2 mt-1 mb-1">
                          {item.dropdownItems.map((subItem) => (
                            <a
                              key={subItem.name}
                              href={subItem.href}
                              onClick={(e) => handleNavClick(e, subItem.href)}
                              className="text-base font-semibold text-slate-700 hover:text-[#264164] py-1 transition-colors"
                            >
                              {subItem.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="text-base font-semibold text-slate-700 hover:text-[#264164] py-2 transition-colors border-b border-slate-100/50 last:border-0"
                    >
                      {item.name}
                    </a>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
