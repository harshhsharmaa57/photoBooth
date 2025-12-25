const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'New Year Photobooth API is running' })
})

// Image processing endpoint (fallback for server-side processing)
app.post('/api/process-strip', async (req, res) => {
  try {
    const { photos } = req.body

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'No photos provided' })
    }

    // Note: For full server-side processing, you would need to use node-canvas
    // This is a placeholder that returns the first photo as a fallback
    // In production, implement full canvas processing here if needed
    
    res.json({
      success: true,
      message: 'Processing should be done client-side for better performance',
      stripUrl: photos[0] // Placeholder
    })
  } catch (error) {
    console.error('Processing error:', error)
    res.status(500).json({ error: 'Failed to process images' })
  }
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📸 New Year Photobooth API ready`)
})

