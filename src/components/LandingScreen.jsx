import { useEffect, useRef } from 'react'
import './LandingScreen.css'

function LandingScreen({ onStart }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Fireworks animation
    const fireworks = []
    const particles = []

    class Firework {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height
        this.targetY = Math.random() * (canvas.height * 0.5)
        this.speed = Math.random() * 3 + 2
        this.color = `hsl(${Math.random() * 60 + 15}, 100%, 60%)`
        this.exploded = false
      }

      update() {
        if (!this.exploded) {
          this.y -= this.speed
          if (this.y <= this.targetY) {
            this.explode()
          }
        }
      }

      explode() {
        this.exploded = true
        for (let i = 0; i < 30; i++) {
          particles.push({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: this.color,
            life: 1,
            decay: Math.random() * 0.02 + 0.01
          })
        }
      }

      draw() {
        if (!this.exploded) {
          ctx.fillStyle = this.color
          ctx.beginPath()
          ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add new firework
      if (Math.random() < 0.05) {
        fireworks.push(new Firework())
      }

      // Update and draw fireworks
      fireworks.forEach((fw, i) => {
        fw.update()
        fw.draw()
        if (fw.exploded && particles.length === 0) {
          fireworks.splice(i, 1)
        }
      })

      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1
        p.life -= p.decay
        p.vx *= 0.98
        p.vy *= 0.98

        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()

        if (p.life <= 0) {
          particles.splice(i, 1)
        }
      })

      ctx.globalAlpha = 1
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const currentYear = new Date().getFullYear()

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
          Capture your memories and create a festive photobooth strip!
        </p>
        <button className="start-button" onClick={onStart}>
          <span className="button-text">Start Photo Booth</span>
          <span className="button-sparkle">✨</span>
        </button>
      </div>
    </div>
  )
}

export default LandingScreen

