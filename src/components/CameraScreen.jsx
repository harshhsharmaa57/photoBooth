import { useEffect, useRef, useState } from 'react'
import './CameraScreen.css'

// localStorage key for sound preference
const SOUND_ENABLED_KEY = 'photobooth_sound_enabled'

function CameraScreen({ onPhotosCaptured, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [photos, setPhotos] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [isSwitching, setIsSwitching] = useState(false)
  const [isMuted, setIsMuted] = useState(() => {
    // Load from localStorage, default to false (sound enabled)
    const stored = localStorage.getItem(SOUND_ENABLED_KEY)
    return stored === 'false' // stored 'false' means sound disabled = muted
  })
  const TOTAL_PHOTOS = 4

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      stopCamera()
    }
  }, [facingMode])

  // Persist mute preference to localStorage
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, (!isMuted).toString())
  }, [isMuted])

  const startCamera = async (mode) => {
    try {
      stopCamera()

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch (primaryError) {
        const fallbackMode = mode === 'user' ? 'environment' : 'user'
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: fallbackMode },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        } catch (fallbackError) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          })
        }
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setError(null)
          setIsSwitching(false)
        }
      }
    } catch (err) {
      console.error('Camera access error:', err)
      let errorMessage = 'Camera access denied. '
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions in your browser settings and refresh.'
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on your device.'
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.'
      } else {
        errorMessage += 'Please refresh the page and try again.'
      }
      setError(errorMessage)
      setIsSwitching(false)
    }
  }

  const switchCamera = () => {
    if (isSwitching || isCapturing) return
    setIsSwitching(true)
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const toggleMute = () => {
    setIsMuted(prev => !prev)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0)

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95)
    const newPhotos = [...photos, photoDataUrl]
    setPhotos(newPhotos)

    // Flash effect
    const flash = document.createElement('div')
    flash.className = 'flash-effect'
    document.body.appendChild(flash)
    setTimeout(() => flash.remove(), 200)

    // Play shutter sound if not muted
    if (!isMuted) {
      playShutterSound()
    }

    if (newPhotos.length >= TOTAL_PHOTOS) {
      setTimeout(() => {
        stopCamera()
        onPhotosCaptured(newPhotos)
      }, 500)
    } else {
      setCurrentPhotoIndex(newPhotos.length)
    }
  }

  const playShutterSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (err) {
      console.warn('Audio playback failed:', err)
    }
  }

  const startCountdown = () => {
    if (isCapturing || photos.length >= TOTAL_PHOTOS) return

    setIsCapturing(true)
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setTimeout(() => {
            capturePhoto()
            setIsCapturing(false)
            setCountdown(null)
          }, 100)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleCancel = () => {
    stopCamera()
    onCancel()
  }

  if (error) {
    return (
      <div className="camera-screen error-screen">
        <div className="error-message">
          <h2>Camera Access Required</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          <button className="cancel-button" onClick={handleCancel}>
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="camera-screen">
      <div className="camera-header">
        <div className="header-left">
          <button className="cancel-btn" onClick={handleCancel}>✕</button>
          <button
            className={`mute-btn ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute shutter sound' : 'Mute shutter sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        <div className="photo-counter">
          Photo {photos.length + 1} of {TOTAL_PHOTOS}
        </div>
        <button
          className="switch-camera-btn"
          onClick={switchCamera}
          disabled={isSwitching || isCapturing}
          title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
        >
          {isSwitching ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="camera-preview-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-preview ${facingMode === 'user' ? 'mirrored' : ''}`}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {countdown !== null && (
          <div className="countdown-overlay">
            <div className={`countdown-number ${countdown === 0 ? 'capture' : ''}`}>
              {countdown > 0 ? countdown : '📸'}
            </div>
          </div>
        )}

        <div className="camera-instructions">
          {photos.length < TOTAL_PHOTOS && !isCapturing && (
            <p>Get ready! Click to capture photo {photos.length + 1}</p>
          )}
        </div>
      </div>

      <div className="camera-controls">
        {photos.length > 0 && (
          <div className="photo-preview-strip">
            {photos.map((photo, index) => (
              <div key={index} className="preview-photo">
                <img src={photo} alt={`Preview ${index + 1}`} />
                <span className="photo-number">{index + 1}</span>
              </div>
            ))}
          </div>
        )}

        <button
          className="capture-button"
          onClick={startCountdown}
          disabled={isCapturing || photos.length >= TOTAL_PHOTOS}
        >
          {photos.length >= TOTAL_PHOTOS ? (
            'Processing...'
          ) : isCapturing ? (
            'Capturing...'
          ) : (
            <>
              <span className="capture-icon">📷</span>
              <span>Capture Photo {photos.length + 1}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default CameraScreen
