"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { motion, useScroll, useSpring, useTransform, useMotionValue, useAnimationFrame } from "framer-motion"

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineDef {
  side: "left" | "right"
  anchorYPct: number          // y of screen-edge anchor, % of vh
  elbows: [number, number][]  // [xPct, yPct] — all within ≤22% (left) or ≥78% (right)
}

interface NodeDef {
  id: number
  xPct: number    // ≤ 20% for left-side nodes, ≥ 80% for right-side nodes
  yPct: number    // 0-100% of SVG height (which is 2×vh)
  r: number
  duration: number
  phase: number
  lines: LineDef[]
}

// ── Nodes: all kept within 20% of each screen edge ───────────────────────────
// yPct here is relative to the SVG canvas (which is 2×vh tall),
// so nodes spread across 0–100% of that canvas = 0–200% of viewport.

const NODES: NodeDef[] = [
  // LEFT SIDE ─────────────────────────────────────────────────────────────────
  {
    id: 1, xPct: 14, yPct: 14, r: 5, duration: 6.5, phase: 0,
    lines: [{ side: "left", anchorYPct: 8,  elbows: [[6, 21], [2, 7]] }],
  },
  {
    id: 2, xPct: 19, yPct: 30, r: 6, duration: 7.8, phase: 1.4,
    lines: [{ side: "left", anchorYPct: 24, elbows: [[9, 38], [3, 21]] }],
  },
  {
    id: 3, xPct: 12, yPct: 50, r: 5, duration: 6.2, phase: 2.8,
    lines: [{ side: "left", anchorYPct: 43, elbows: [[5, 58], [1, 39]] }],
  },
  {
    id: 4, xPct: 17, yPct: 67, r: 4, duration: 5.8, phase: 0.6,
    lines: [{ side: "left", anchorYPct: 61, elbows: [[7, 74], [2, 58]] }],
  },
  {
    id: 5, xPct: 13, yPct: 83, r: 5, duration: 7.0, phase: 2.1,
    lines: [{ side: "left", anchorYPct: 77, elbows: [[5, 90], [1, 74]] }],
  },
  // RIGHT SIDE ─────────────────────────────────────────────────────────────────
  {
    id: 6, xPct: 86, yPct: 18, r: 5, duration: 7.2, phase: 1.9,
    lines: [{ side: "right", anchorYPct: 11, elbows: [[94, 26], [98, 9]] }],
  },
  {
    id: 7, xPct: 82, yPct: 37, r: 6, duration: 8.0, phase: 3.1,
    lines: [{ side: "right", anchorYPct: 31, elbows: [[92, 45], [97, 28]] }],
  },
  {
    id: 8, xPct: 88, yPct: 56, r: 5, duration: 6.8, phase: 0.3,
    lines: [{ side: "right", anchorYPct: 49, elbows: [[95, 63], [99, 46]] }],
  },
  {
    id: 9, xPct: 84, yPct: 72, r: 4, duration: 5.5, phase: 2.0,
    lines: [{ side: "right", anchorYPct: 66, elbows: [[93, 79], [98, 63]] }],
  },
  {
    id: 10, xPct: 87, yPct: 88, r: 5, duration: 7.4, phase: 0.9,
    lines: [{ side: "right", anchorYPct: 82, elbows: [[95, 95], [99, 79]] }],
  },
]

// ── Path builder ──────────────────────────────────────────────────────────────

function buildPath(
  ax: number, ay: number,
  elbowsPx: [number, number][],
  anchorX: number, anchorY: number
): string {
  let d = `M ${ax.toFixed(1)} ${ay.toFixed(1)}`
  for (const [ex, ey] of elbowsPx) d += ` L ${ex.toFixed(1)} ${ey.toFixed(1)}`
  d += ` L ${anchorX} ${anchorY.toFixed(1)}`
  return d
}

// ── Per-node component (only float, no scroll — parent handles scroll) ────────

interface NodeProps extends NodeDef {
  vw: number
  svgH: number   // total SVG height in px (2 × vh)
}

function Node({ xPct, yPct, r, duration, phase, lines, vw, svgH }: NodeProps) {
  const cx = (vw * xPct) / 100
  const cy = (svgH * yPct) / 100  // position within the tall SVG canvas
  const amp = r * 2.0

  const actualX = useMotionValue(cx)
  const actualY = useMotionValue(cy)
  const cxRef = useRef(cx)
  const cyRef = useRef(cy)
  useEffect(() => { cxRef.current = cx; cyRef.current = cy }, [cx, cy])

  // Float only — no scroll offset here; parent's motion.div handles it
  useAnimationFrame((time) => {
    const angle = (time / 1000) * ((2 * Math.PI) / duration) + phase
    actualX.set(cxRef.current + Math.sin(angle) * amp)
    actualY.set(cyRef.current + Math.cos(angle * 1.27) * amp * 1.12)
  })

  const groupRef  = useRef<SVGGElement>(null)
  const pathRefs  = useRef<(SVGPathElement | null)[]>([])

  // Precompute fixed anchor + elbow pixel positions (only recalcs on resize)
  const linePx = useMemo(
    () =>
      lines.map((line) => ({
        anchorX:  line.side === "left" ? 0 : vw,
        anchorY:  (svgH * line.anchorYPct) / 100,
        elbowsPx: line.elbows.map(
          ([xp, yp]) => [(vw * xp) / 100, (svgH * yp) / 100] as [number, number]
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vw, svgH]
  )

  // Imperative DOM updates — zero React re-renders on animation frames
  useEffect(() => {
    const update = () => {
      const ax = actualX.get()
      const ay = actualY.get()
      groupRef.current?.setAttribute("transform", `translate(${ax},${ay})`)
      linePx.forEach(({ anchorX, anchorY, elbowsPx }, i) => {
        pathRefs.current[i]?.setAttribute("d", buildPath(ax, ay, elbowsPx, anchorX, anchorY))
      })
    }
    const unX = actualX.on("change", update)
    const unY = actualY.on("change", update)
    update()
    return () => { unX(); unY() }
  }, [actualX, actualY, linePx])

  const pulseDelay = `${(phase % 2.5).toFixed(2)}s`

  return (
    <g>
      {linePx.map(({ anchorX, anchorY, elbowsPx }, i) => (
        <g key={i}>
          {/* Fixed elbow/articulation dots */}
          {elbowsPx.map(([ex, ey], j) => (
            <circle key={j} cx={ex} cy={ey} r={2.4}
              fill="rgba(172,214,74,0.55)" filter="url(#pglow)" />
          ))}
          {/* Edge anchor tick */}
          <line
            x1={anchorX} y1={anchorY - 9} x2={anchorX} y2={anchorY + 9}
            stroke="rgba(172,214,74,0.6)" strokeWidth={2} strokeLinecap="round"
          />
          <circle
            cx={anchorX === 0 ? 5 : anchorX - 5} cy={anchorY} r={3.2}
            fill="rgba(172,214,74,0.65)" filter="url(#pglow)"
          />
          {/* Dynamic line — start moves with particle, end stays at anchor */}
          <path
            ref={(el) => { pathRefs.current[i] = el }}
            fill="none"
            stroke="rgba(172,214,74,0.42)"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {/* Particle circle (imperatively translated) */}
      <g ref={groupRef}>
        <circle cx={0} cy={0} r={r}
          fill="none" stroke="rgba(172,214,74,0.7)" strokeWidth={1.7}
          filter="url(#pglow)"
          style={{ animation: `ppulse 2.5s ${pulseDelay} ease-in-out infinite` }}
        />
      </g>
    </g>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export function GreenParticles() {
  const [dim, setDim] = useState({ vw: 0, vh: 0 })
  const [maxScroll, setMaxScroll] = useState(6000)

  useEffect(() => {
    const update = () => {
      setDim({ vw: window.innerWidth, vh: window.innerHeight })
      setMaxScroll(Math.max(1, document.documentElement.scrollHeight - window.innerHeight))
    }
    update()
    // Re-measure after content loads (images, etc.)
    const t = setTimeout(update, 1500)
    window.addEventListener("resize", update)
    return () => { clearTimeout(t); window.removeEventListener("resize", update) }
  }, [])

  const { scrollY } = useScroll()
  const smooth = useSpring(scrollY, { stiffness: 32, damping: 15, mass: 0.85 })

  // Whole system scrolls upward as user scrolls down (same direction, 18% speed)
  const globalY = useTransform(smooth, (v) => -v * 0.18)

  // Opacity: hidden in hero (top), visible in content, hidden in footer (bottom)
  const opacityMV = useMotionValue(0)

  useEffect(() => {
    if (!dim.vh) return
    const vh = dim.vh

    const compute = (sv: number) => {
      const fadeInStart  = vh * 0.55   // start fading in at ~55% of viewport scrolled
      const fadeInEnd    = vh * 0.92   // fully visible after one viewport scroll
      const fadeOutStart = maxScroll - 220
      const fadeOutEnd   = maxScroll - 40

      if (sv < fadeInStart)  return 0
      if (sv < fadeInEnd)    return (sv - fadeInStart) / (fadeInEnd - fadeInStart)
      if (sv > fadeOutEnd)   return 0
      if (sv > fadeOutStart) return 1 - (sv - fadeOutStart) / (fadeOutEnd - fadeOutStart)
      return 1
    }

    opacityMV.set(compute(scrollY.get()))
    return scrollY.on("change", (v) => opacityMV.set(compute(v)))
  }, [scrollY, opacityMV, dim.vh, maxScroll])

  if (!dim.vw || !dim.vh) return null

  // SVG is 2× viewport height so nodes distributed across it stay in view
  // throughout the scroll range as globalY shifts the canvas upward.
  const svgH = dim.vh * 2

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        opacity: opacityMV,
        zIndex: 5,
        // Fade bottom 12% so footer area is masked out
        maskImage:         "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)",
        WebkitMaskImage:   "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      {/* motion.svg moves the whole system up as user scrolls */}
      <motion.svg
        width={dim.vw}
        height={svgH}
        style={{ y: globalY, position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <style>{`
            @keyframes ppulse {
              0%, 100% { opacity: 0.48; }
              50%       { opacity: 0.92; }
            }
          `}</style>
          <filter id="pglow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {NODES.map((node) => (
          <Node key={node.id} {...node} vw={dim.vw} svgH={svgH} />
        ))}
      </motion.svg>
    </motion.div>
  )
}
