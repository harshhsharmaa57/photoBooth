import { useEffect, useRef, useState } from 'react'
import { AVAILABLE_TEMPLATES } from '../utils/photoboothGenerator'
import './LandingScreen.css'

function LandingScreen({ onStart }) {
  const canvasRef = useRef(null)
  const [selectedTemplate, setSelectedTemplate] = useState('classic')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Firework particles
    const particles = []
    const fireworks = []

    class Particle {
      constructor(x, y, color, velocity, decay = 0.015, gravity = 0.08) {
        this.x = x
        this.y = y
        this.color = color
        this.velocity = velocity
        this.alpha = 1
        this.decay = decay
        this.gravity = gravity
        this.friction = 0.98
      }

      update() {
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.velocity.y += this.gravity
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.alpha -= this.decay
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
      }
    }

    class Firework {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height
        this.targetY = Math.random() * (canvas.height * 0.4) + 50
        this.velocity = { x: (Math.random() - 0.5) * 2, y: -12 - Math.random() * 4 }
        this.color = this.getRandomColor()
        this.trail = []
        this.exploded = false
      }

      getRandomColor() {
        const colors = ['#6d28d9', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#ffffff']
        return colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        if (!this.exploded) {
          // Add trail
          this.trail.push({ x: this.x, y: this.y, alpha: 1 })
          if (this.trail.length > 10) this.trail.shift()

          this.velocity.y += 0.2
          this.x += this.velocity.x
          this.y += this.velocity.y

          // Explode when reaching target or slowing down
          if (this.velocity.y >= 0 || this.y <= this.targetY) {
            this.explode()
          }
        }
      }

      explode() {
        this.exploded = true
        const particleCount = 60 + Math.floor(Math.random() * 40)

        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 / particleCount) * i
          const speed = 4 + Math.random() * 4
          const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          }
          particles.push(new Particle(this.x, this.y, this.color, velocity))
        }

        // Add sparkle particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1 + Math.random() * 2
          const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          }
          particles.push(new Particle(this.x, this.y, '#ffffff', velocity, 0.03, 0.02))
        }
      }

      draw() {
        if (!this.exploded) {
          // Draw trail
          this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length * 0.5
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.restore()
          })

          // Draw firework
          ctx.save()
          ctx.beginPath()
          ctx.arc(this.x, this.y, 4, 0, Math.PI * 2)
          ctx.fillStyle = this.color
          ctx.fill()
          ctx.shadowColor = this.color
          ctx.shadowBlur = 10
          ctx.fill()
          ctx.restore()
        }
      }
    }

    let animationId
    let lastFireworkTime = 0

    const animate = (timestamp) => {
      // Semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(11, 11, 15, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Launch new firework periodically
      if (timestamp - lastFireworkTime > 800 + Math.random() * 1200) {
        fireworks.push(new Firework())
        lastFireworkTime = timestamp
      }

      // Update and draw fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update()
        fireworks[i].draw()
        if (fireworks[i].exploded) {
          fireworks.splice(i, 1)
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update()
        particles[i].draw()
        if (particles[i].alpha <= 0) {
          particles.splice(i, 1)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    // Start with a few fireworks
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        fireworks.push(new Firework())
      }, i * 300)
    }

    animationId = requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const currentYear = 2026

  const handleStart = () => {
    onStart(selectedTemplate)
  }

  return (
    <div className="landing-screen">
      <canvas ref={canvasRef} className="fireworks-canvas" />
      <div className="landing-content">
        <div className="landing-title">
          <h1 className="main-title">New Year</h1>
          <h2 className="sub-title">Photobooth</h2>
          <div className="year-badge">{currentYear}</div>
        </div>
        <p className="landing-description">
          Capture your memories and create a photobooth strip!
        </p>

        <div className="template-selector">
          <h3>Choose your style</h3>
          <div className="template-options">
            {AVAILABLE_TEMPLATES.map(t => (
              <button
                key={t.id}
                className={`template-btn ${selectedTemplate === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(t.id)}
              >
                <span>{t.icon}</span> {t.name}
              </button>
            ))}
          </div>
        </div>

        <button className="start-button" onClick={handleStart}>
          <span className="button-text">Start Photo Booth</span>
          <span className="button-sparkle">→</span>
        </button>
      </div>
    </div>
  )
}

export default LandingScreen
