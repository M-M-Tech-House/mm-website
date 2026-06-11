"use client"

import { motion } from "framer-motion"
import { useRef, useEffect, useState } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DecorationLine {
  /** Starting height as % of section height (e.g. 20) */
  yStartPct: number
  /** Vertical offset in px from the convergence target height at the end (e.g. -12, 0, 12) */
  yOffsetPx?: number
  /** Initial horizontal segment length in px starting from the circle (default 40) */
  horizontalStartPx?: number
  /** Transition connector type between horizontal segments (defaults to vertical if dy > 50px, else diagonal) */
  connectorType?: "vertical" | "diagonal"
  /** Circle radius in px (default 6.5) */
  r?: number
  /** Animation delay phase / coefficient */
  phase?: number
}

export interface DecorationNode {
  side: "left" | "right"
  /** The central target convergence height as % of section height (e.g. 45) */
  convergenceYPct: number
  /** The starting x coordinate from the edge (closer to center) where the inner-most circle sits (e.g. 180) */
  xCenterPx?: number
  /** The final x coordinate from the edge where all parallel lines end (e.g. 20) */
  xEdgePx?: number
  /** The minimum length in px of the final parallel segment (default 50) */
  minEndPx?: number
  /** The list of lines that converge towards this node */
  lines: DecorationLine[]
}

interface Props {
  nodes: DecorationNode[]
}

// ── Per-node SVG Component ───────────────────────────────────────────────────

interface NodeSvgProps extends DecorationNode {
  w: number
  h: number
}

function NodeSvg({ side, convergenceYPct, xCenterPx = 180, xEdgePx = 20, minEndPx = 50, lines, w, h }: NodeSvgProps) {
  const cY = (h * convergenceYPct) / 100

  // 1. Map each line with its starting Y and target Y, and calculate vertical distance to convergence height
  const linesWithDistance = lines.map((line, idx) => {
    const yStart = (h * line.yStartPct) / 100
    const yTarget = cY + (line.yOffsetPx ?? 0)
    const dist = Math.abs(yStart - cY)
    return { line, idx, yStart, yTarget, dist }
  })

  // 2. Sort by distance to cY ascending (closest to cY first) to determine routing rank
  const sorted = [...linesWithDistance].sort((a, b) => a.dist - b.dist)

  // 3. For each sorted line, calculate transition coordinates ensuring no intersections (staggered nesting)
  const renderedPaths = sorted.map((item, rank) => {
    const { line, idx, yStart, yTarget } = item
    const r = line.r ?? 6.5
    const phase = line.phase ?? 0
    const hStart = line.horizontalStartPx ?? 40

    // Horizontal step to stagger bends (prevents vertical overlaps)
    const staggerStep = 24
    
    // Base transition x1 coordinate
    const x1Base = xCenterPx - rank * staggerStep
    const limitX = xEdgePx + minEndPx
    const x1 = Math.max(x1Base, limitX)

    const dy = Math.abs(yTarget - yStart)
    const connector = line.connectorType ?? (dy > 50 ? "vertical" : "diagonal")

    let cx: number, cy: number
    let x2: number, finalXEnd: number
    let pathData: string

    if (side === "left") {
      // Circle sits to the right of the bend (towards center)
      cx = x1 + hStart
      cy = yStart

      if (connector === "vertical") {
        x2 = x1
        finalXEnd = xEdgePx
        // Starts at edge (finalXEnd), goes to bend (x1), then to circle (cx)
        pathData = `M ${finalXEnd} ${yTarget} H ${x1} V ${yStart} H ${cx}`
      } else {
        const tx2 = x1 - dy
        x2 = Math.max(tx2, xEdgePx + minEndPx)
        if (x2 > x1) x2 = x1
        finalXEnd = xEdgePx
        // Starts at edge (finalXEnd), goes to bend 2 (x2), to bend 1 (x1), then to circle (cx)
        pathData = `M ${finalXEnd} ${yTarget} H ${x2} L ${x1} ${yStart} H ${cx}`
      }
    } else {
      // Circle sits to the left of the bend (towards center)
      cx = w - (x1 + hStart)
      cy = yStart

      const rx1 = w - x1
      if (connector === "vertical") {
        x2 = rx1
        finalXEnd = w - xEdgePx
        pathData = `M ${finalXEnd} ${yTarget} H ${rx1} V ${yStart} H ${cx}`
      } else {
        const tx2 = rx1 + dy
        x2 = Math.min(tx2, w - (xEdgePx + minEndPx))
        if (x2 < rx1) x2 = rx1
        finalXEnd = w - xEdgePx
        pathData = `M ${finalXEnd} ${yTarget} H ${x2} L ${rx1} ${yStart} H ${cx}`
      }
    }

    return {
      pathData,
      cx,
      cy,
      r,
      phase,
      idx
    }
  })

  // 4. Re-sort back to original index to preserve React key stability and prevent glitching
  const finalRendered = [...renderedPaths].sort((a, b) => a.idx - b.idx)

  return (
    <g>
      {finalRendered.map((item, i) => (
        <g key={i}>
          {/* Animated Glow Line - draws itself on viewport entry */}
          <motion.path
            d={item.pathData}
            fill="none"
            stroke="rgba(172, 214, 74, 0.45)" // Beautiful high-tech green
            strokeWidth={3.2} // Thicker lines as requested by user
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 1.8,
              ease: "easeInOut",
              delay: item.phase * 0.2,
            }}
          />

          {/* Circle Group - delayed to appear exactly when the line reaches it */}
          <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 1.35 + item.phase * 0.2, // Matches path completion
              duration: 0.45,
              ease: "easeOut",
            }}
          >
            {/* Hollow Main Circle (O) - pulses continuously */}
            <motion.circle
              cx={item.cx}
              cy={item.cy}
              r={item.r}
              fill="none"
              stroke="rgba(172, 214, 74, 0.85)"
              strokeWidth={2.4}
              filter="url(#sdglow)"
              animate={{
                opacity: [0.6, 1.0, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Pulsing outer ring */}
            <motion.circle
              cx={item.cx}
              cy={item.cy}
              r={item.r + 4.5}
              fill="none"
              stroke="rgba(172, 214, 74, 0.40)"
              strokeWidth={1.4}
              filter="url(#sdglow)"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.25, 0.7, 0.25],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.g>
        </g>
      ))}
    </g>
  )
}

// ── Main Export Component ────────────────────────────────────────────────────

export function SectionDecoration({ nodes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current?.parentElement
    if (!el) return

    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      setSize({ w: width, h: height })
    }
    update()

    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!size.w) return <div ref={containerRef} />

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <svg width={size.w} height={size.h}>
        <defs>
          <filter id="sdglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nodes.map((node, i) => (
          <NodeSvg key={i} {...node} w={size.w} h={size.h} />
        ))}
      </svg>
    </div>
  )
}
