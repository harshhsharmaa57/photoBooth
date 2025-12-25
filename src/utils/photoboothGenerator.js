/**
 * Generates a photobooth strip from multiple photos with different layout templates
 * @param {string[]} photoDataUrls - Array of base64 image data URLs
 * @param {Object} options - Generation options
 * @param {string} options.template - Template type: 'classic', 'grid', 'polaroid'
 * @param {boolean} options.showConfetti - Whether to show confetti (default: false)
 * @param {boolean} options.showVignette - Whether to apply vignette (default: false)
 * @returns {Promise<string>} Data URL of the generated strip
 */
export async function generatePhotoboothStrip(photoDataUrls, options = {}) {
  const {
    template = 'classic',
    showConfetti = false,
    showVignette = false
  } = options

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

      // Strip dimensions - 1080x1920 for all templates
      const STRIP_WIDTH = 1080
      const STRIP_HEIGHT = 1920

      canvas.width = STRIP_WIDTH
      canvas.height = STRIP_HEIGHT

      // Background - flat dark color (neo-brutalist)
      ctx.fillStyle = '#0b0b0f'
      ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

      // Get layout placements based on template
      const placements = getTemplatePlacements(template, STRIP_WIDTH, STRIP_HEIGHT, photoDataUrls.length)

      // Draw header
      drawHeader(ctx, STRIP_WIDTH, template)

      // Draw photos based on placements
      const photoPromises = photoDataUrls.map((dataUrl, index) => {
        return new Promise((resolve) => {
          if (!dataUrl || !placements[index]) {
            resolve()
            return
          }

          const placement = placements[index]
          const img = new Image()
          img.crossOrigin = 'anonymous'

          img.onload = () => {
            drawPhotoAtPlacement(ctx, img, placement, template)
            resolve()
          }

          img.onerror = () => {
            console.warn(`Failed to load photo ${index + 1}`)
            resolve()
          }

          try {
            img.src = dataUrl
          } catch (error) {
            console.warn(`Error setting image source for photo ${index + 1}:`, error)
            resolve()
          }
        })
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Photo processing timeout')), 30000)
      })

      Promise.race([
        Promise.all(photoPromises),
        timeoutPromise
      ]).then(() => {
        // Draw footer
        drawFooter(ctx, STRIP_WIDTH, STRIP_HEIGHT)

        // Optional effects
        if (showConfetti) {
          drawConfetti(ctx, STRIP_WIDTH, STRIP_HEIGHT)
        }

        if (showVignette) {
          applyVignette(ctx, STRIP_WIDTH, STRIP_HEIGHT)
        }

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

/**
 * Get photo placements based on template
 */
function getTemplatePlacements(template, width, height, photoCount) {
  const HEADER_HEIGHT = 200
  const FOOTER_HEIGHT = 150
  const PADDING = 40
  const availableHeight = height - HEADER_HEIGHT - FOOTER_HEIGHT
  const availableWidth = width - (PADDING * 2)

  switch (template) {
    case 'grid':
      return getGridPlacements(PADDING, HEADER_HEIGHT, availableWidth, availableHeight, photoCount)
    case 'polaroid':
      return getPolaroidPlacements(PADDING, HEADER_HEIGHT, availableWidth, availableHeight, photoCount)
    case 'classic':
    default:
      return getClassicPlacements(PADDING, HEADER_HEIGHT, availableWidth, availableHeight, photoCount)
  }
}

/**
 * Classic vertical strip layout
 */
function getClassicPlacements(padding, headerHeight, width, height, count) {
  const spacing = 20
  const photoHeight = (height - (spacing * (count - 1))) / count

  return Array.from({ length: count }, (_, i) => ({
    x: padding,
    y: headerHeight + (i * (photoHeight + spacing)),
    w: width,
    h: photoHeight,
    rotation: 0,
    borderWidth: 3,
    borderRadius: 12
  }))
}

/**
 * 2x2 grid layout
 */
function getGridPlacements(padding, headerHeight, width, height, count) {
  const gap = 20
  const photoWidth = (width - gap) / 2
  const photoHeight = (height - gap) / 2

  const positions = [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 1 }
  ]

  return positions.slice(0, count).map(({ col, row }) => ({
    x: padding + (col * (photoWidth + gap)),
    y: headerHeight + (row * (photoHeight + gap)),
    w: photoWidth,
    h: photoHeight,
    rotation: 0,
    borderWidth: 4,
    borderRadius: 8
  }))
}

/**
 * Polaroid stacked layout with rotations
 */
function getPolaroidPlacements(padding, headerHeight, width, height, count) {
  const polaroidWidth = width * 0.7
  const polaroidHeight = polaroidWidth * 1.2
  const centerX = padding + width / 2
  const centerY = headerHeight + height / 2

  const rotations = [-8, 5, -3, 7]
  const offsets = [
    { x: -30, y: -50 },
    { x: 40, y: -20 },
    { x: -20, y: 60 },
    { x: 30, y: 100 }
  ]

  return Array.from({ length: Math.min(count, 4) }, (_, i) => ({
    x: centerX - polaroidWidth / 2 + offsets[i].x,
    y: centerY - polaroidHeight / 2 + offsets[i].y - 100,
    w: polaroidWidth,
    h: polaroidHeight,
    rotation: rotations[i] * Math.PI / 180,
    borderWidth: 0,
    borderRadius: 4,
    isPolaroid: true
  }))
}

/**
 * Draw a photo at the specified placement
 */
function drawPhotoAtPlacement(ctx, img, placement, template) {
  const { x, y, w, h, rotation, borderWidth, borderRadius, isPolaroid } = placement

  ctx.save()

  // Apply rotation around center
  if (rotation !== 0) {
    const centerX = x + w / 2
    const centerY = y + h / 2
    ctx.translate(centerX, centerY)
    ctx.rotate(rotation)
    ctx.translate(-centerX, -centerY)
  }

  if (isPolaroid) {
    // Polaroid frame
    const frameWidth = w
    const frameHeight = h
    const photoPadding = 20
    const bottomPadding = 80

    // White polaroid background
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 4
    ctx.shadowOffsetY = 4

    roundRect(ctx, x, y, frameWidth, frameHeight, borderRadius)
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Photo area
    const photoX = x + photoPadding
    const photoY = y + photoPadding
    const photoWidth = frameWidth - (photoPadding * 2)
    const photoHeight = frameHeight - photoPadding - bottomPadding

    // Clip and draw image
    ctx.save()
    roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 2)
    ctx.clip()
    drawCroppedImage(ctx, img, photoX, photoY, photoWidth, photoHeight)
    ctx.restore()

    // Tape decoration on top
    drawTape(ctx, x + frameWidth / 2 - 40, y - 15)
  } else {
    // Standard frame with hard shadow (neo-brutalist)
    ctx.fillStyle = '#ffffff'

    // Hard shadow offset
    ctx.fillStyle = '#000000'
    roundRect(ctx, x + 6, y + 6, w, h, borderRadius)
    ctx.fill()

    // White background
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, x, y, w, h, borderRadius)
    ctx.fill()

    // Photo with padding
    const photoPadding = 10
    const photoX = x + photoPadding
    const photoY = y + photoPadding
    const photoWidth = w - (photoPadding * 2)
    const photoHeight = h - (photoPadding * 2)

    ctx.save()
    roundRect(ctx, photoX, photoY, photoWidth, photoHeight, borderRadius - 4)
    ctx.clip()
    drawCroppedImage(ctx, img, photoX, photoY, photoWidth, photoHeight)
    ctx.restore()

    // Border
    if (borderWidth > 0) {
      ctx.strokeStyle = '#0b0b0f'
      ctx.lineWidth = borderWidth
      roundRect(ctx, x, y, w, h, borderRadius)
      ctx.stroke()
    }
  }

  ctx.restore()
}

/**
 * Draw image cropped to fit container
 */
function drawCroppedImage(ctx, img, x, y, width, height) {
  const imgAspect = img.width / img.height
  const targetAspect = width / height

  let sourceX = 0
  let sourceY = 0
  let sourceWidth = img.width
  let sourceHeight = img.height

  if (imgAspect > targetAspect) {
    sourceWidth = img.height * targetAspect
    sourceX = (img.width - sourceWidth) / 2
  } else {
    sourceHeight = img.width / targetAspect
    sourceY = (img.height - sourceHeight) / 2
  }

  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

/**
 * Draw rounded rectangle path
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Draw tape decoration for polaroid
 */
function drawTape(ctx, x, y) {
  ctx.save()
  ctx.fillStyle = 'rgba(255, 220, 150, 0.8)'
  ctx.fillRect(x, y, 80, 30)
  ctx.strokeStyle = 'rgba(200, 170, 100, 0.5)'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, 80, 30)
  ctx.restore()
}

function drawHeader(ctx, width, template) {
  const currentYear = 2026
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

  // Title - using accent purple
  ctx.fillStyle = '#6d28d9'
  ctx.font = 'bold 48px "Bungee", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Happy New Year!', width / 2, 60)

  // Year
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px "Bungee", cursive'
  ctx.fillText(currentYear.toString(), width / 2, 130)

  // Date and time
  ctx.fillStyle = '#6b7280'
  ctx.font = '24px "Inter", sans-serif'
  ctx.fillText(`${dateStr} • ${timeStr}`, width / 2, 180)
}

function drawFooter(ctx, width, height) {
  const y = height - 100

  // Simple line
  ctx.strokeStyle = '#6d28d9'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(100, y)
  ctx.lineTo(width - 100, y)
  ctx.stroke()

  // Footer text
  ctx.fillStyle = '#6b7280'
  ctx.font = '20px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('New Year Photobooth 2026', width / 2, y + 50)
}

function drawConfetti(ctx, width, height) {
  const colors = ['#6d28d9', '#06b6d4', '#ef4444', '#ffffff', '#f59e0b']

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = Math.random() * 4 + 2
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
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

export const AVAILABLE_TEMPLATES = [
  { id: 'classic', name: 'Classic Strip', icon: '📋' },
  { id: 'grid', name: '2×2 Grid', icon: '⊞' }
]
