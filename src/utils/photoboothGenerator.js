/**
 * Generates a photobooth strip from multiple photos
 * @param {string[]} photoDataUrls - Array of base64 image data URLs
 * @returns {Promise<string>} Data URL of the generated strip
 */
export async function generatePhotoboothStrip(photoDataUrls) {
  return new Promise((resolve, reject) => {
    try {
      if (!photoDataUrls || photoDataUrls.length === 0) {
        reject(new Error('No photos provided'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      // Strip dimensions - optimized for Instagram stories (9:16 ratio)
      const STRIP_WIDTH = 1080
      const STRIP_HEIGHT = 1920
      const PHOTO_COUNT = photoDataUrls.length
      const PHOTO_PADDING = 40
      const PHOTO_SPACING = 20
      const HEADER_HEIGHT = 200
      const FOOTER_HEIGHT = 150
      
      const availableHeight = STRIP_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT
      const photoHeight = (availableHeight - (PHOTO_SPACING * (PHOTO_COUNT - 1))) / PHOTO_COUNT
      const photoWidth = STRIP_WIDTH - (PHOTO_PADDING * 2)
      
      if (photoHeight <= 0 || photoWidth <= 0) {
        reject(new Error('Invalid photo dimensions'))
        return
      }
      
      canvas.width = STRIP_WIDTH
      canvas.height = STRIP_HEIGHT
      
      // Dark background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, STRIP_HEIGHT)
      gradient.addColorStop(0, '#0a0a14')
      gradient.addColorStop(0.5, '#1a1a2e')
      gradient.addColorStop(1, '#0a0a14')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
      
      // Draw header
      drawHeader(ctx, STRIP_WIDTH, HEADER_HEIGHT)
      
      // Draw photos
      const photoPromises = photoDataUrls.map((dataUrl, index) => {
        return new Promise((resolve, reject) => {
          if (!dataUrl) {
            resolve() // Skip empty photos
            return
          }
          
          // Calculate Y position based on index to avoid race conditions
          const y = HEADER_HEIGHT + (index * (photoHeight + PHOTO_SPACING))
          
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            // Calculate crop to maintain aspect ratio (square crop)
            const imgAspect = img.width / img.height
            const targetAspect = photoWidth / photoHeight
            
            let drawWidth = photoWidth
            let drawHeight = photoHeight
            let sourceX = 0
            let sourceY = 0
            let sourceWidth = img.width
            let sourceHeight = img.height
            
            if (imgAspect > targetAspect) {
              // Image is wider - crop width
              sourceHeight = img.height
              sourceWidth = img.height * targetAspect
              sourceX = (img.width - sourceWidth) / 2
            } else {
              // Image is taller - crop height
              sourceWidth = img.width
              sourceHeight = img.width / targetAspect
              sourceY = (img.height - sourceHeight) / 2
            }
            
            // Draw photo with rounded corners
            const x = PHOTO_PADDING
            
            ctx.save()
            
            // Shadow
            ctx.shadowColor = 'rgba(255, 215, 0, 0.3)'
            ctx.shadowBlur = 20
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 5
            
            // Rounded rectangle path
            const radius = 15
            ctx.beginPath()
            ctx.moveTo(x + radius, y)
            ctx.lineTo(x + photoWidth - radius, y)
            ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + radius)
            ctx.lineTo(x + photoWidth, y + photoHeight - radius)
            ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - radius, y + photoHeight)
            ctx.lineTo(x + radius, y + photoHeight)
            ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - radius)
            ctx.lineTo(x, y + radius)
            ctx.quadraticCurveTo(x, y, x + radius, y)
            ctx.closePath()
            ctx.clip()
            
            // Draw image
            ctx.drawImage(
              img,
              sourceX, sourceY, sourceWidth, sourceHeight,
              x, y, photoWidth, photoHeight
            )
            
            ctx.restore()
            
            // Reset shadow
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            
            // Draw border
            ctx.strokeStyle = '#FFD700'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(x + radius, y)
            ctx.lineTo(x + photoWidth - radius, y)
            ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + radius)
            ctx.lineTo(x + photoWidth, y + photoHeight - radius)
            ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - radius, y + photoHeight)
            ctx.lineTo(x + radius, y + photoHeight)
            ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - radius)
            ctx.lineTo(x, y + radius)
            ctx.quadraticCurveTo(x, y, x + radius, y)
            ctx.closePath()
            ctx.stroke()
            
            // Photo number badge
            drawPhotoBadge(ctx, x + photoWidth - 50, y + 15, index + 1)
            
            resolve()
          }
          img.onerror = (error) => {
            console.warn(`Failed to load photo ${index + 1}:`, error)
            resolve() // Skip failed images but continue processing
          }
          
          try {
            img.src = dataUrl
          } catch (error) {
            console.warn(`Error setting image source for photo ${index + 1}:`, error)
            resolve()
          }
        })
      })
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Photo processing timeout')), 30000) // 30 second timeout
      })

      Promise.race([
        Promise.all(photoPromises),
        timeoutPromise
      ]).then(() => {
        // Draw footer
        drawFooter(ctx, STRIP_WIDTH, STRIP_HEIGHT, FOOTER_HEIGHT)
        
        // Add decorative elements
        drawDecorativeElements(ctx, STRIP_WIDTH, STRIP_HEIGHT)
        
        // Apply final effects
        applyVignette(ctx, STRIP_WIDTH, STRIP_HEIGHT)
        
        try {
          const dataUrl = canvas.toDataURL('image/png', 1.0)
          if (!dataUrl || dataUrl === 'data:,') {
            throw new Error('Failed to generate image data')
          }
          resolve(dataUrl)
        } catch (error) {
          console.error('Error converting canvas to data URL:', error)
          reject(new Error('Failed to generate photobooth strip image'))
        }
      }).catch((error) => {
        console.error('Error processing photos:', error)
        reject(error)
      })
    } catch (error) {
      reject(error)
    }
  })
}

function drawHeader(ctx, width, height) {
  const currentYear = new Date().getFullYear()
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  // Title
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 48px "Bungee", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🎉 Happy New Year!', width / 2, 60)
  
  // Year
  ctx.fillStyle = '#FFA500'
  ctx.font = 'bold 72px "Bungee", cursive'
  ctx.fillText(currentYear.toString(), width / 2, 120)
  
  // Date and time
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '24px "Inter", sans-serif'
  ctx.fillText(`${dateStr} • ${timeStr}`, width / 2, 170)
}

function drawFooter(ctx, width, height, footerHeight) {
  const y = height - footerHeight
  
  // Decorative line
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2
  ctx.setLineDash([10, 5])
  ctx.beginPath()
  ctx.moveTo(50, y + 20)
  ctx.lineTo(width - 50, y + 20)
  ctx.stroke()
  ctx.setLineDash([])
  
  // Footer text
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '20px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Made with ✨ New Year Photobooth', width / 2, y + 60)
  
  // Sparkles
  for (let i = 0; i < 5; i++) {
    const x = 100 + (i * (width - 200) / 4)
    drawSparkle(ctx, x, y + 80, 8)
  }
}

function drawPhotoBadge(ctx, x, y, number) {
  // Badge background
  ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'
  ctx.beginPath()
  ctx.arc(x, y, 20, 0, Math.PI * 2)
  ctx.fill()
  
  // Badge number
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 18px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(number.toString(), x, y)
}

function drawDecorativeElements(ctx, width, height) {
  // Confetti particles
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = Math.random() * 4 + 2
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFA500', '#FF69B4']
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // Sparkles
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    drawSparkle(ctx, x, y, Math.random() * 5 + 3)
  }
}

function drawSparkle(ctx, x, y, size) {
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x, y + size)
  ctx.moveTo(x - size, y)
  ctx.lineTo(x + size, y)
  ctx.stroke()
  
  // Diagonal lines
  const diagSize = size * 0.7
  ctx.beginPath()
  ctx.moveTo(x - diagSize, y - diagSize)
  ctx.lineTo(x + diagSize, y + diagSize)
  ctx.moveTo(x - diagSize, y + diagSize)
  ctx.lineTo(x + diagSize, y - diagSize)
  ctx.stroke()
}

function applyVignette(ctx, width, height) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.min(width, height) * 0.8
  )
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

