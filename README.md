# ⚡ BeamDrop — Wireless Phone to PC File Transfer (Zero App on Phone)

BeamDrop is a desktop application built with **Electron and Node.js** that lets you transfer photos, videos, documents, and folders wirelessly between your mobile phone (iPhone or Android) and Windows PC **without installing any app on your phone**.

It works seamlessly over **Local Wi-Fi** or **Direct Mobile/PC Hotspot** with **ZERO mobile data or internet needed**.

---

## ✨ Features

- 📱 **Zero App Required on Phone**: Scan the dynamic on-screen QR code with your phone's default camera app to open the transfer portal.
- ⚡ **Full Local Speed**: Transferred locally over your device's Wi-Fi link (30–70+ MB/s) — **0 MB of your cellular plan is used**.
- 📶 **Works 100% Offline (No Internet / No Wi-Fi Router Needed)**:
  - Phone Hotspot (with mobile data turned OFF or ON)
  - Windows Mobile Hotspot
  - Regular home or office Wi-Fi
- 🔋 **Screen Wake Lock**: Mobile browser automatically keeps the phone screen awake during active uploads & downloads so transfers never drop when the screen dims.
- 📦 **Download All as ZIP**: Easily download all shared PC files onto your phone in a single compressed `.zip` file with one tap.
- 🖼️ **Media Thumbnails & Lightbox Preview**: Real thumbnail previews for images and videos with full-screen interactive lightbox player on both PC and mobile before or after downloading.
- 📥 **Phone ➔ PC Transfer**: Select photos, 4K videos, or multiple files at once. Shows real-time speed (MB/s) and progress percentage.
- 📤 **PC ➔ Phone Transfer**: Drag & drop files onto the desktop window for your phone to download immediately.
- 📋 **Live Clipboard / Notes Sync**: Instant two-way sharing of text, links, and passwords.
- 🔔 **Native Windows Notifications & Chime**: Subtle audio chime (synthesized Web Audio, 100% offline) and desktop notifications when transfers complete.
- 📂 **Custom Save Folder**: Choose where received files are saved with one-click "Open Folder" and auto-reloading history.

---

## 🚀 How to Run

### Method 1: Double-Click Launcher
Double-click `start.bat` in the project root.

### Method 2: Command Line
```bash
npm start
```

---

## 📱 How to Use With Zero Data (Hotspot Mode)

### Using Phone Hotspot (Recommended):
1. On your phone (Android or iPhone), turn **Personal Hotspot ON**. *(You can keep Mobile Data OFF or have 0 balance!)*
2. Connect your Windows PC's Wi-Fi to your phone's hotspot.
3. Launch **BeamDrop** on your PC.
4. Scan the QR code displayed on your PC screen using your phone's Camera.
5. Tap **"Photos & Videos"** or **"Any Document"** to beam files straight to your computer!

---

## 🛠️ Architecture

- **Desktop App**: Electron 44, Node.js HTTP/Express, WebSocket Server (`ws`), Multer, QR Code Generator (`qrcode`).
- **Mobile Web App**: Self-contained Vanilla HTML5/CSS/JavaScript with responsive touch UI, safe-area inset support, and Web Audio API synthesizer. Zero external CDN dependencies — works 100% offline.
