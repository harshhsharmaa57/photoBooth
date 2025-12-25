import { useState, useEffect } from 'react'
import './ResultScreen.css'

function ResultScreen({ stripDataUrl, onRetake, onNewSession }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [shareSupported, setShareSupported] = useState(false)

  useEffect(() => {
    // Check if Web Share API is supported
    // Use a safe check that doesn't invoke methods
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        setShareSupported(false)
        return
      }
      
      // Only check for existence, don't call methods
      const hasShare = navigator && 'share' in navigator
      setShareSupported(!!hasShare)
    } catch (error) {
      console.warn('Share API check failed:', error)
      setShareSupported(false)
    }
  }, [])

  const handleDownload = () => {
    if (!stripDataUrl) return

    setIsDownloading(true)
    const link = document.createElement('a')
    link.download = `new-year-photobooth-${new Date().getTime()}.png`
    link.href = stripDataUrl
    link.click()
    setTimeout(() => setIsDownloading(false), 500)
  }

  const handleShare = async () => {
    if (!stripDataUrl) {
      return
    }

    // If share not supported, fallback to download
    if (!shareSupported || typeof navigator === 'undefined' || !navigator.share) {
      handleDownload()
      return
    }

    try {
      // Try to share with file first
      try {
        const response = await fetch(stripDataUrl)
        const blob = await response.blob()
        const file = new File([blob], `new-year-photobooth-${Date.now()}.png`, {
          type: 'image/png'
        })

        const shareData = {
          files: [file],
          title: 'New Year Photobooth 2026',
          text: 'Check out my New Year photobooth strip! 🎉'
        }

        // Check if canShare exists and supports files
        if (typeof navigator.canShare === 'function') {
          try {
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData)
              return
            }
          } catch (canShareError) {
            // canShare might throw, continue to fallback
            console.log('canShare check failed, trying without files')
          }
        }
      } catch (fileShareError) {
        // File sharing failed, try text/URL sharing
        console.log('File sharing not supported, trying text share')
      }

      // Fallback: share with text and URL
      const textShareData = {
        title: 'New Year Photobooth 2025',
        text: 'Check out my New Year photobooth strip! 🎉',
        url: window.location.href
      }

      if (typeof navigator.canShare === 'function') {
        try {
          if (navigator.canShare(textShareData)) {
            await navigator.share(textShareData)
            return
          }
        } catch (canShareError) {
          // Continue to fallback
        }
      }
      
      // Last resort: just share text (without canShare check)
      await navigator.share({
        text: 'Check out my New Year photobooth strip! 🎉',
        url: window.location.href
      })
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
      }
      // Fallback to download
      handleDownload()
    }
  }

  return (
    <div className="result-screen">
      <div className="result-content">
        <h2 className="result-title">Your New Year Photobooth Strip</h2>
        
        {stripDataUrl && (
          <div className="strip-preview-container">
            <img
              src={stripDataUrl}
              alt="Photobooth Strip"
              className="strip-preview"
            />
          </div>
        )}

        <div className="result-actions">
          <button
            className="action-button download-button"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <span className="button-icon">📥</span>
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </button>

          {shareSupported && (
            <button
              className="action-button share-button"
              onClick={handleShare}
            >
              <span className="button-icon">📤</span>
              <span>Share</span>
            </button>
          )}

          <button
            className="action-button retake-button"
            onClick={onRetake}
          >
            <span className="button-icon">🔁</span>
            <span>Retake Photos</span>
          </button>

          <button
            className="action-button new-session-button"
            onClick={onNewSession}
          >
            <span className="button-icon">🏠</span>
            <span>New Session</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultScreen

