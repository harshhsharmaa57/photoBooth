import { useEffect, useRef, useState } from "react";
import "./CameraScreen.css";

// localStorage key for sound preference
const SOUND_ENABLED_KEY = "photobooth_sound_enabled";

function CameraScreen({ onPhotosCaptured, onCancel, template = "classic" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    // Load from localStorage, default to false (sound enabled)
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === "false"; // stored 'false' means sound disabled = muted
  });
  const [currentFilter, setCurrentFilter] = useState("none");
  const TOTAL_PHOTOS = template === "grid" ? 4 : 3;

  const filters = [
    { id: "none", name: "Filter" },
    { id: "bw", name: "Black & White" },
    { id: "vintage", name: "Vintage" },
  ];

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Persist mute preference to localStorage
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, (!isMuted).toString());
  }, [isMuted]);

  const startCamera = async (mode) => {
    try {
      // Stop existing camera stream completely
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          streamRef.current = null;
        });
      }

      // Clear video source before starting new stream
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Small delay to ensure previous stream is fully stopped
      await new Promise((resolve) => setTimeout(resolve, 100));

      let stream;
      try {
        // Request camera with specific facing mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (primaryError) {
        console.warn(
          "Primary camera access failed, trying fallback:",
          primaryError
        );
        // Fallback: try opposite camera
        const fallbackMode = mode === "user" ? "environment" : "user";
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: fallbackMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          // Update facingMode to match what we actually got
          setFacingMode(fallbackMode);
        } catch (fallbackError) {
          console.error("Fallback camera access failed:", fallbackError);
          // Last resort: any available camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              setError(null);
              setIsSwitching(false);
              resolve();
            };
            // Fallback timeout
            setTimeout(() => {
              setIsSwitching(false);
              resolve();
            }, 1000);
          }
        });
      }
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Camera access denied. ";
      if (err.name === "NotAllowedError") {
        errorMessage +=
          "Please allow camera permissions in your browser settings and refresh.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on your device.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is being used by another application.";
      } else {
        errorMessage += "Please refresh the page and try again.";
      }
      setError(errorMessage);
      setIsSwitching(false);
    }
  };

  const switchCamera = () => {
    if (isSwitching || isCapturing) return;
    setIsSwitching(true);
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const applyFilter = (ctx, canvas) => {
    if (currentFilter === "none") return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (currentFilter === "bw") {
        // Black and white filter
        const gray = r * 0.299 + g * 0.587 + b * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      } else if (currentFilter === "vintage") {
        // Vintage/sepia filter
        const tr = r * 0.393 + g * 0.769 + b * 0.189;
        const tg = r * 0.349 + g * 0.686 + b * 0.168;
        const tb = r * 0.272 + g * 0.534 + b * 0.131;
        data[i] = Math.min(255, tr);
        data[i + 1] = Math.min(255, tg);
        data[i + 2] = Math.min(255, tb);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    // Apply filter if selected
    applyFilter(ctx, canvas);

    const photoDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const newPhotos = [...photos, photoDataUrl];
    setPhotos(newPhotos);

    // Flash effect
    const flash = document.createElement("div");
    flash.className = "flash-effect";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);

    // Play shutter sound if not muted
    if (!isMuted) {
      playShutterSound();
    }

    if (newPhotos.length >= TOTAL_PHOTOS) {
      setTimeout(() => {
        stopCamera();
        onPhotosCaptured(newPhotos);
      }, 500);
    } else {
      setCurrentPhotoIndex(newPhotos.length);
    }
  };

  const playShutterSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.warn("Audio playback failed:", err);
    }
  };

  const startCountdown = () => {
    if (isCapturing || photos.length >= TOTAL_PHOTOS) return;

    setIsCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            capturePhoto();
            setIsCapturing(false);
            setCountdown(null);
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (error) {
    return (
      <div className="camera-screen error-screen">
        <div className="error-message">
          <h2>Camera Access Required</h2>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
          <button className="cancel-button" onClick={handleCancel}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-screen">
      <div className="camera-header">
        <button className="cancel-btn" onClick={handleCancel}>
          <span className="icon-close"></span>
        </button>
        <div className="photo-counter">
          Photo {photos.length + 1} of {TOTAL_PHOTOS}
        </div>
      </div>

      <div className="camera-content-wrapper">
        <div className="camera-preview-box">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-preview ${
              facingMode === "user" ? "mirrored" : ""
            } filter-${currentFilter}`}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {countdown !== null && (
            <div className="countdown-overlay">
              <div
                className={`countdown-number ${
                  countdown === 0 ? "capture" : ""
                }`}
              >
                {countdown > 0 ? countdown : ""}
              </div>
            </div>
          )}
        </div>

        <div className="camera-controls">
          <div className="control-buttons-row">
            <button
              className={`control-btn filter-btn ${
                currentFilter !== "none" ? "active" : ""
              }`}
              onClick={() => {
                const currentIndex = filters.findIndex(
                  (f) => f.id === currentFilter
                );
                const nextIndex = (currentIndex + 1) % filters.length;
                setCurrentFilter(filters[nextIndex].id);
              }}
              title="Filter"
            >
              <span className="icon-filter"></span>
              <span className="filter-label">
                {filters.find((f) => f.id === currentFilter)?.name}
              </span>
            </button>

            <button
              className="control-btn switch-camera-btn"
              onClick={switchCamera}
              disabled={isSwitching || isCapturing}
              title={
                facingMode === "user"
                  ? "Switch to back camera"
                  : "Switch to front camera"
              }
            >
              {isSwitching ? (
                <svg
                  className="button-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="60"
                    strokeDashoffset="0"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-120"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              ) : (
                <svg
                  className="button-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M20 7v6h-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M4 17v-6h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              )}
            </button>

            <button
              className={`control-btn mute-btn ${isMuted ? "muted" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute shutter sound" : "Mute shutter sound"}
            >
              {isMuted ? (
                <svg
                  className="button-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M3 10v4h4l5 5V5L7 10H3z" fill="currentColor" />
                  <path
                    d="M16 8l4 8M20 8l-4 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  className="button-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M3 10v4h4l5 5V5L7 10H3z" fill="currentColor" />
                  <path
                    d="M16 8a4 4 0 0 1 0 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>

          {photos.length > 0 && (
            <div className="photo-preview-strip">
              {photos.map((photo, index) => (
                <div key={index} className="preview-photo">
                  <img src={photo} alt={`Preview ${index + 1}`} />
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
              "Processing..."
            ) : isCapturing ? (
              "Capturing..."
            ) : (
              <>
                <span className="capture-icon"></span>
                <span>Capture Photo {photos.length + 1}</span>
              </>
            )}
          </button>


        </div>
      </div>
    </div>
  );
}

export default CameraScreen;
