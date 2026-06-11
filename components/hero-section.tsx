"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronDown } from "lucide-react"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const [activeVideo, setActiveVideo] = useState<"video1" | "video2">("video1")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollPulse, setScrollPulse] = useState(false)

  const handleScrollDown = () => {
    const target = document.getElementById("proceso") ?? document.querySelector("#proceso")
    if (target) {
      // Trigger pulse animation on the scroll indicator
      setScrollPulse(true)
      setTimeout(() => setScrollPulse(false), 800)
      // Smooth scroll
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      })
    }

    const container = containerRef.current
    container?.addEventListener("mousemove", handleMouseMove)
    return () => container?.removeEventListener("mousemove", handleMouseMove)
  }, [])

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

  const headline = "TECNOLOGÍA SIMPLE Y A TU MEDIDA"
  const words = headline.split(" ")

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50"
    >
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
            activeVideo === "video1" ? "opacity-85" : "opacity-0"
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
            activeVideo === "video2" ? "opacity-85" : "opacity-0"
          }`}
        >
          <source src="/videos/hero-bg-2.mp4" type="video/mp4" />
        </video>
        {/* Soft light overlay with gradient for readability without blockiness */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-white/40 z-0" />
      </div>

      {/* Floating soft particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#457bb3]/20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content Container - Centered overlay on top of video */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center justify-center pt-32 pb-16">
        
        {/* Glassmorphic Text Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-3xl bg-white/75 backdrop-blur-md border border-white/60 rounded-[32px] p-8 md:p-12 shadow-[0_20px_50px_rgba(36,88,147,0.04)] flex flex-col items-center"
        >
          {/* Uppercase Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <span className="text-xs font-bold tracking-wider text-[#264164] uppercase bg-[#264164]/5 px-4 py-1.5 rounded-full border border-[#264164]/10 backdrop-blur-sm">
              M&M Tech House
            </span>
          </motion.div>

          {/* Animated headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-slate-900">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-2 md:mr-3">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.4,
                      delay: 0.4 + wordIndex * 0.08 + letterIndex * 0.02,
                      ease: "easeOut",
                    }}
                    className={`inline-block ${
                      word === "SIMPLE" || word === "MEDIDA"
                        ? "text-[#68c6d7] font-black"
                        : "text-slate-900"
                    }`}
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-base md:text-lg text-slate-500 mb-8 max-w-xl leading-relaxed"
          >
            Hacemos software a la medida de forma <span className="text-[#264164] font-semibold">transparente y sin dolores de cabeza</span>. Nos encargamos de toda la complejidad técnica para que tú te enfoques en lo que mejor haces.
          </motion.p>

          {/* CTA Button & Trust Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <motion.button
              onClick={handleScrollDown}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.05 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#264164] text-white font-bold text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:bg-[#1f3552] shadow-lg shadow-[#264164]/15 hover:shadow-xl hover:shadow-[#264164]/25"
            >
              {/* Animated shimmer on hover */}
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                whileHover={{ translateX: "200%" }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Descubrir el camino fácil
                <motion.span
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </span>
            </motion.button>

            {/* Benefits Badges Row */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2 text-xs md:text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#457bb3]" />
                Presupuesto 100% cerrado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#68c6d7]" />
                Entregas cada 15 días
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#457bb3]" />
                Soporte directo por WhatsApp
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={handleScrollDown}
      >
        <motion.div
          animate={scrollPulse
            ? { y: [0, 24, 0], scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }
            : { y: [0, 8, 0] }
          }
          transition={scrollPulse
            ? { duration: 0.7, ease: "easeInOut" }
            : { duration: 1.8, repeat: Infinity }
          }
          className="text-slate-400 hover:text-[#acd64a] transition-colors duration-300"
        >
          <ChevronDown className="w-7 h-7" />
        </motion.div>
      </motion.div>
    </section>
  )
}
