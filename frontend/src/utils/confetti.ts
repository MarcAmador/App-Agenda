/**
 * Sistema ligero de Confeti con HTML5 Canvas.
 * Cero dependencias de npm, sin impacto en bundle y acelerado por hardware (GPU).
 */

interface Particle {
  x: number
  y: number
  w: number
  h: number
  color: string
  vx: number
  vy: number
  rotation: number
  vRotation: number
  opacity: number
}

const CONFETTI_COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
]

export function triggerConfetti(originX?: number, originY?: number): void {
  if (typeof window === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '99999'

  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const width = (canvas.width = window.innerWidth)
  const height = (canvas.height = window.innerHeight)

  const startX = originX ?? width / 2
  const startY = originY ?? height * 0.45

  const particleCount = 70
  const particles: Particle[] = []

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
    const speed = Math.random() * 9 + 4
    particles.push({
      x: startX,
      y: startY,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      opacity: 1,
    })
  }

  let animationFrameId: number
  const startTime = Date.now()
  const duration = 2400

  const render = () => {
    const elapsed = Date.now() - startTime
    if (elapsed >= duration) {
      cancelAnimationFrame(animationFrameId)
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, width, height)

    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.28 // Gravedad
      p.vx *= 0.98 // Fricción
      p.rotation += p.vRotation

      if (elapsed > duration * 0.6) {
        p.opacity = Math.max(0, 1 - (elapsed - duration * 0.6) / (duration * 0.4))
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })

    animationFrameId = requestAnimationFrame(render)
  }

  animationFrameId = requestAnimationFrame(render)
}
