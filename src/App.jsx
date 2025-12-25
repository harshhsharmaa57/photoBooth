import { useState } from 'react'
import LandingScreen from './components/LandingScreen'
import CameraScreen from './components/CameraScreen'
import ProcessingScreen from './components/ProcessingScreen'
import ResultScreen from './components/ResultScreen'
import './App.css'

function App() {
  const [screen, setScreen] = useState('landing')
  const [photos, setPhotos] = useState([])
  const [finalStrip, setFinalStrip] = useState(null)

  const handleStart = () => {
    setScreen('camera')
    setPhotos([])
    setFinalStrip(null)
  }

  const handlePhotosCaptured = (capturedPhotos) => {
    setPhotos(capturedPhotos)
    setScreen('processing')
  }

  const handleStripGenerated = (stripDataUrl) => {
    setFinalStrip(stripDataUrl)
    setScreen('result')
  }

  const handleRetake = () => {
    setScreen('camera')
    setPhotos([])
    setFinalStrip(null)
  }

  const handleProcessingError = (error) => {
    console.error('Processing error:', error)
    // Go back to camera screen on error
    setScreen('camera')
    setPhotos([])
    setFinalStrip(null)
  }

  return (
    <div className="app">
      {screen === 'landing' && <LandingScreen onStart={handleStart} />}
      {screen === 'camera' && (
        <CameraScreen
          onPhotosCaptured={handlePhotosCaptured}
          onCancel={() => setScreen('landing')}
        />
      )}
      {screen === 'processing' && (
        <ProcessingScreen
          photos={photos}
          onStripGenerated={handleStripGenerated}
          onError={handleProcessingError}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          stripDataUrl={finalStrip}
          onRetake={handleRetake}
          onNewSession={() => setScreen('landing')}
        />
      )}
    </div>
  )
}

export default App

