# 🌐 Deploying Inthawnna to Cloudflare Pages (`inthawnna.pages.dev`)

The web-based version of **Inthawnna** is ready in the [`web/`](file:///e:/Antigravity/Inthawnna/web) folder. It is a 100% static, client-side peer-to-peer web application powered by **WebRTC DataChannels** (DTLS encrypted, zero cloud storage).

---

## 🚀 3 Ways to Deploy to `inthawnna.pages.dev`

### Option 1: Instant CLI Deploy with Wrangler (Recommended — 30 Seconds)

You can deploy directly from your terminal using Cloudflare's Wrangler tool:

```bash
npm run deploy:pages
```
*(or run: `npx wrangler pages deploy web --project-name inthawnna`)*

1. Wrangler will open a browser tab to log in / authorize your free Cloudflare account.
2. It will upload the `web/` folder directly to Cloudflare Pages.
3. Your app will be live immediately at **`https://inthawnna.pages.dev`**!

---

### Option 2: Connect via GitHub (Automatic Updates on Push)

1. Push this project to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Add Inthawnna Web static app"
   git remote add origin https://github.com/<your-username>/inthawnna.git
   git push -u origin main
   ```
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Go to **Compute (Workers & Pages)** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
4. Select your `inthawnna` repository.
5. In the configuration screen, set:
   - **Project Name**: `inthawnna` *(this gives you `inthawnna.pages.dev`)*
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `web`
6. Click **Save and Deploy**. Cloudflare will build your site and give you **`https://inthawnna.pages.dev`**. Every time you push to GitHub, it will automatically update!

---

### Option 3: Direct Web Upload (Zero Terminal Commands)

1. Open [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Navigate to **Compute (Workers & Pages)** ➔ **Create application** ➔ **Pages** ➔ **Upload assets**.
3. Set **Project Name** to `inthawnna`.
4. Drag and drop the [`web`](file:///e:/Antigravity/Inthawnna/web) folder from File Explorer into the upload box.
5. Click **Deploy site**. Done!

---

## 💻 How to Test Locally Right Now

You can test the web app right now on your PC and Phone:

```bash
npm run web
```
This starts a local preview server at `http://localhost:3300` and displays your local network address (e.g., `http://192.168.1.x:3300`).

- **On your PC**: Open `http://localhost:3300`
- **On your Phone**: Scan the QR code on your PC screen with your camera app, or open the link displayed in the terminal!

---

## ✨ Features Built into the Web App

- ⚡ **Direct WebRTC P2P**: Files stream directly from device to device at full local Wi-Fi speeds (30–80+ MB/s). No files ever touch a server.
- 📱 **Zero Install on Phone OR PC**: Works seamlessly in modern browsers (Chrome, Edge, Safari, Brave, Firefox) on Android, iOS, Windows, Mac, and Linux.
- 📷 **Instant QR Code & Room Code Pairing**: Scan with iPhone/Android camera to auto-connect with zero setup.
- 📂 **Direct Auto-Save Folder (Desktop)**: In Chrome/Edge on PC, pick a folder once via the File System Access API — incoming files stream directly into your folder without repeated download prompts!
- 🔋 **Screen Wake Lock**: Phone screen stays awake automatically during active file transfers so transfers never drop.
- 🔔 **Synthesized Web Audio Chimes**: Offline audio feedback for connected status and completed transfers.
- 📦 **Download All as ZIP**: Download all received files in a single `.zip` file with one click.
- 🖼️ **Media Lightbox Preview**: Preview high-resolution photos and play 4K videos directly in the browser.
- 📋 **Live Clipboard Sync**: Instant two-way text and link sharing.
