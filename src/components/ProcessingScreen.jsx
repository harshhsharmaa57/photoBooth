import { useEffect } from 'react'
import { generatePhotoboothStrip } from '../utils/photoboothGenerator'
import './ProcessingScreen.css'

function ProcessingScreen({ photos, onStripGenerated, onError }) {
  useEffect(() => {
    const processPhotos = async () => {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        console.log('Processing photos:', photos.length)
        if (!photos || photos.length === 0) {
          throw new Error('No photos to process')
        }
        
        const stripDataUrl = await generatePhotoboothStrip(photos)
        console.log('Strip generated successfully')
        
        if (!stripDataUrl) {
          throw new Error('Failed to generate strip')
        }
        
        onStripGenerated(stripDataUrl)
      } catch (error) {
        console.error('Error generating strip:', error)
        // Call error handler if provided, otherwise show alert
        if (onError) {
          onError(error)
        } else {
          alert('Error generating photobooth strip: ' + error.message + '\n\nPlease try taking photos again.')
        }
      }
    }

    if (photos && photos.length > 0) {
      processPhotos()
    }
  }, [photos, onStripGenerated, onError])

  return (
    <div className="processing-screen">
      <div className="processing-content">
        <div className="processing-animation">
          <div className="film-strip">
            <div className="film-frame"></div>
            <div className="film-frame"></div>
            <div className="film-frame"></div>
            <div className="film-frame"></div>
          </div>
        </div>
        <h2 className="processing-title">Developing your memories...</h2>
        <p className="processing-subtitle">Creating your New Year photobooth strip</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}

export default ProcessingScreen

