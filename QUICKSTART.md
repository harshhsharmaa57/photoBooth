# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5000`

### 3. Open in Browser
Navigate to `http://localhost:3000` and allow camera permissions when prompted.

## 📸 How to Use

1. **Click "Start Photo Booth"** on the landing page
2. **Allow camera access** when prompted by your browser
3. **Capture 4 photos** by clicking the capture button
   - Each photo has a 3-2-1 countdown
   - Flash effect on capture
4. **Wait for processing** (automatic)
5. **Download or share** your photobooth strip!

## 🔧 Troubleshooting

### Camera Not Working?
- Make sure you're using HTTPS (or localhost)
- Check browser permissions in settings
- Try refreshing the page
- Some browsers require explicit permission grants

### Photos Not Processing?
- Check browser console for errors
- Ensure all 4 photos were captured
- Try refreshing and starting over

### Mobile Issues?
- Use a modern browser (Chrome, Safari, Firefox)
- Ensure camera permissions are granted
- Try landscape mode if portrait doesn't work

## 📦 Build for Production

```bash
npm run build
```

The `dist` folder contains the production build ready for deployment.

## 🌐 Deployment

### Vercel
1. Connect your GitHub repo
2. Vercel auto-detects Vite
3. Deploy!

### Netlify
1. Connect your GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!

## 🎨 Customization

See `README.md` for detailed customization options.

