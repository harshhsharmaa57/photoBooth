# 🎉 New Year Photobooth 2025

An interactive, New Year-themed photobooth website where users can capture photos using their device camera and instantly generate a beautiful photobooth strip with festive decorations.

## ✨ Features

- **📷 Camera Integration**: Access device camera with getUserMedia API
- **⏱️ Countdown Timer**: 3-2-1 countdown before each photo capture
- **🎨 Photobooth Strip Generation**: Combines 4 photos into a vertical strip
- **🎊 New Year Theme**: Festive decorations, confetti, sparkles, and gold accents
- **📥 Download**: High-resolution PNG download (Instagram story ready)
- **📤 Share**: Native Web Share API support
- **🔁 Retake**: Easy retake functionality
- **📱 Mobile & Desktop**: Fully responsive design
- **✨ Animations**: Smooth transitions and festive effects

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd New-year-2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start:
- Frontend (Vite) on `http://localhost:3000`
- Backend (Express) on `http://localhost:5000`

### Development Commands

- `npm run dev` - Start both frontend and backend
- `npm run client` - Start only frontend
- `npm run server` - Start only backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📁 Project Structure

```
New-year-2/
├── src/
│   ├── components/
│   │   ├── LandingScreen.jsx      # Landing page with fireworks
│   │   ├── CameraScreen.jsx       # Camera capture interface
│   │   ├── ProcessingScreen.jsx   # Processing animation
│   │   └── ResultScreen.jsx        # Final strip preview & actions
│   ├── utils/
│   │   └── photoboothGenerator.js  # Canvas-based strip generation
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
├── server/
│   └── index.js                    # Express backend
├── package.json
├── vite.config.js
└── README.md
```

## 🎨 Technical Details

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **Canvas API** for image processing and strip generation
- **getUserMedia API** for camera access
- **Web Share API** for native sharing

### Backend
- **Express.js** server
- CORS enabled for cross-origin requests
- Placeholder for server-side image processing (currently done client-side)

### Image Processing
- Client-side canvas processing for optimal performance
- High-resolution output (1080x1920px - Instagram story format)
- Automatic photo cropping to maintain aspect ratio
- Rounded corners, borders, and decorative elements
- Vignette effect and color grading

## 📱 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

**Note**: Camera access requires HTTPS in production (or localhost for development)

## 🚢 Deployment

### Vercel / Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting platform

3. For backend (optional), deploy the Express server separately or use serverless functions

### Environment Variables

No environment variables required for basic functionality.

## 🎯 Usage Flow

1. **Landing Screen**: User clicks "Start Photo Booth"
2. **Camera Screen**: 
   - Camera preview appears
   - User clicks to capture 4 photos
   - Countdown (3-2-1) before each capture
   - Flash effect on capture
3. **Processing Screen**: Shows "Developing your memories..." animation
4. **Result Screen**: 
   - Displays final photobooth strip
   - Options to download, share, retake, or start new session

## 🛠️ Customization

### Change Number of Photos
Edit `TOTAL_PHOTOS` in `src/components/CameraScreen.jsx`

### Modify Strip Dimensions
Edit constants in `src/utils/photoboothGenerator.js`:
- `STRIP_WIDTH` and `STRIP_HEIGHT`
- `PHOTO_PADDING` and `PHOTO_SPACING`

### Update Theme Colors
Modify CSS variables in component stylesheets:
- Primary gold: `#FFD700`
- Accent orange: `#FFA500`
- Background: `#0a0a14`

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Acknowledgments

- Fonts: Google Fonts (Bungee, Inter)
- Built with React and Vite

---

**Made with ✨ for New Year 2025! 🎉**

