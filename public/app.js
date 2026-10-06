// Synthesized audio feedback for mobile with toggle support
class MobileChime {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem('inthawnna_sound_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      // Tone 1: E5 (659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: A5 (880.00 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.1);
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } catch (e) {
      // Audio might require user interaction on some mobile browsers
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    localStorage.setItem('inthawnna_sound_enabled', this.enabled ? 'true' : 'false');
  }
}

const mobileChime = new MobileChime();

// Screen Wake Lock API Manager (keeps phone screen awake during active transfers)
class ScreenWakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.activeTransfers = 0;
    this.isSupported = 'wakeLock' in navigator;
    this.indicatorEl = null;
  }

  init() {
    this.indicatorEl = document.getElementById('wakeLockIndicator');
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.activeTransfers > 0) {
        await this.request(true);
      }
    });
  }

  async request(isReacquire = false) {
    if (!isReacquire) {
      this.activeTransfers++;
    }
    if (!this.isSupported) return;
    try {
      if (!this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
          this.updateUI();
        });
      }
      this.updateUI();
    } catch (err) {
      // Wake lock can fail if battery saver is engaged
    }
  }

  release() {
    this.activeTransfers = Math.max(0, this.activeTransfers - 1);
    if (this.activeTransfers === 0 && this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
    this.updateUI();
  }

  updateUI() {
    if (this.indicatorEl) {
      if (this.activeTransfers > 0 && this.wakeLock) {
        this.indicatorEl.style.display = 'inline-flex';
      } else {
        this.indicatorEl.style.display = 'none';
      }
    }
  }
}

const wakeLockManager = new ScreenWakeLockManager();

function triggerHaptic() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate([35, 50, 35]);
    } catch (e) {}
  }
}

// Formatting
function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getMobileFileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  }
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  }
  if (['mp3', 'wav', 'm4a'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}

// State
let ws = null;
let stagedFilesList = [];
let uploadQueueCount = 0;
let mobileActiveFilter = 'all';
let mobileSearchQuery = '';
let mobileLang = localStorage.getItem('inthawnna_mobile_lang') || 'mz';

const mobileStatsManager = {
  getTodayKey() {
    return 'inthawnna_stats_' + new Date().toISOString().slice(0, 10);
  },
  getStats() {
    try {
      const data = JSON.parse(localStorage.getItem(this.getTodayKey()) || '{}');
      return { count: data.count || 0, bytes: data.bytes || 0 };
    } catch (e) {
      return { count: 0, bytes: 0 };
    }
  },
  addTransfer(bytes) {
    const s = this.getStats();
    s.count += 1;
    s.bytes += (bytes || 0);
    try {
      localStorage.setItem(this.getTodayKey(), JSON.stringify(s));
    } catch (e) {}
    this.render();
  },
  render() {
    const el = document.getElementById('mobileStatsText');
    if (!el) return;
    const s = this.getStats();
    el.textContent = `⚡ Today: ${formatBytes(s.bytes)}`;
  }
};

const mobileI18n = {
  en: {
    badge: 'EN',
    connected: 'Connected to PC',
    reconnecting: 'Reconnecting...',
    awake: 'Awake',
    chime: 'Chime',
    navSend: 'Send',
    navReceive: 'Receive',
    navNotes: 'Notes',
    navAbout: 'About',
    sendTitle: 'Send to PC',
    sendSub: 'Fast local Wi-Fi / Hotspot sharing with zero data usage.',
    cardMediaTitle: 'Photos & Videos',
    cardMediaSub: 'Choose from Gallery',
    cardCameraTitle: 'Take Photo / Video',
    cardCameraSub: 'Snap & Beam Instantly',
    cardDocTitle: 'Any File / Document',
    cardDocSub: 'PDF, ZIP, Music, APK, etc.',
    queueTitle: 'Transfer Queue',
    queueEmpty: 'Select photos or files above to beam to your PC',
    recvTitle: 'Files from PC',
    recvSub: 'Download files staged by your computer.',
    recvEmpty: 'No files shared from PC yet.<br>Drop files into Inthawnna on your computer to see them here!',
    searchPlaceholder: 'Search files...',
    downloadAll: 'Download All (.zip)',
    notesTitle: 'Clipboard & Text',
    notesSub: 'Send text, links, or notes instantly across devices.',
    sendTextHeader: 'Send Text to PC',
    beamToPc: 'Beam to PC',
    notesInputPlaceholder: 'Type or paste text/links here...',
    receivedTextHeader: 'Received from PC',
    copyBtn: 'Copy',
    aboutTitle: 'About',
    aboutSub: 'Inthawnna File Transfer App Info',
    aboutDev: 'This software is developed by <b>Muantea45@gmail.com</b>. Unauthorized modification, distribution, or reproduction is strictly prohibited.',
    aboutChimeTitle: 'Chime Sound',
    aboutChimeDesc: 'Play sound on incoming transfers and notifications',
    contactDev: 'Contact Developer'
  },
  mz: {
    badge: 'MZ',
    connected: 'PC nen inzawm a ni',
    reconnecting: 'Inzawm leh mek...',
    awake: 'En rengna',
    chime: 'Tih rikna',
    navSend: 'Thawnna',
    navReceive: 'Dawng',
    navNotes: 'Notes',
    navAbout: 'Chanchin',
    sendTitle: 'Thawnna',
    sendSub: 'Phone leh Computer WiFi kaltlanga awlsam taka inzawmna.',
    cardMediaTitle: 'Thlalak & Video',
    cardMediaSub: 'Gallery atangin thlang rawh',
    cardCameraTitle: 'Thla La / Video Siam',
    cardCameraSub: 'La nghal la, thawn nghal rawh',
    cardDocTitle: 'File & Document Dang',
    cardDocSub: 'PDF, ZIP, Hla, APK, etc.',
    queueTitle: 'Thawn Mek List',
    queueEmpty: 'A chunga mite khi hmetin i PC-ah thawn rawh',
    recvTitle: 'PC atanga File Dawngte',
    recvSub: 'Computer ami file i duh tak kha heta tangin a download theih e.',
    recvEmpty: 'Computer atangin engmah la dah a ni lo.<br>Computer-a Inthawnna-ah file dah la, heta hian a lang ang!',
    searchPlaceholder: 'File zawng rawh...',
    downloadAll: 'Download Vek (.zip)',
    notesTitle: 'Clipboard & Thu Thawn',
    notesSub: 'Phone leh Computer inkarah engpawh i thawn thei e.',
    sendTextHeader: 'PC-a Thu Thawnna',
    beamToPc: 'PC-ah Thawn Rawh',
    notesInputPlaceholder: 'Heta hian thu emaw link chhu rawh...',
    receivedTextHeader: 'PC atanga Thu Dawn',
    copyBtn: 'Copy Rawh',
    aboutTitle: 'Chanchin',
    aboutSub: 'Inthawnna File Transfer App Chanchin',
    aboutDev: 'He software hi <b>Muantea45@gmail.com</b> siam a ni a, ama remtihna lo chuan engmah tih danglam emaw thawn chhuah emaw a remchang lo ang.',
    aboutChimeTitle: 'Tih rikna (Chime)',
    aboutChimeDesc: 'File thawn zawh emaw dawn huna ri chhuak tur',
    contactDev: 'Siamtu Bia Rawh'
  }
};

function setMobileLanguage(lang) {
  if (!mobileI18n[lang]) lang = 'mz';
  mobileLang = lang;
  localStorage.setItem('inthawnna_mobile_lang', lang);

  const t = mobileI18n[lang];
  const badge = document.getElementById('mobileLangBadge');
  if (badge) badge.textContent = t.badge;

  const statusText = document.getElementById('mobileStatusText');
  if (statusText && !statusText.closest('.status-pill')?.classList.contains('disconnected')) {
    statusText.textContent = t.connected;
  }

  const soundLabel = document.getElementById('mobileSoundToggleLabel');
  if (soundLabel) {
    soundLabel.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      ${t.chime}
    `;
  }

  // Nav labels
  const navSend = document.querySelector('.nav-item[data-target="sendScreen"] span');
  if (navSend) navSend.textContent = t.navSend;
  const navRecv = document.querySelector('.nav-item[data-target="receiveScreen"] span');
  if (navRecv) navRecv.textContent = t.navReceive;
  const navNotes = document.querySelector('.nav-item[data-target="notesScreen"] span');
  if (navNotes) navNotes.textContent = t.navNotes;
  const navAbout = document.querySelector('.nav-item[data-target="aboutScreen"] span');
  if (navAbout) navAbout.textContent = t.navAbout;

  // Send Screen
  const sendHeader = document.querySelector('#sendScreen .screen-header h3');
  if (sendHeader) sendHeader.textContent = t.sendTitle;
  const sendSub = document.querySelector('#sendScreen .screen-header p');
  if (sendSub) sendSub.textContent = t.sendSub;

  const cardMediaTitle = document.getElementById('txtCardMediaTitle');
  if (cardMediaTitle) cardMediaTitle.textContent = t.cardMediaTitle;
  const cardMediaSub = document.getElementById('txtCardMediaSub');
  if (cardMediaSub) cardMediaSub.textContent = t.cardMediaSub;

  const cardCameraTitle = document.getElementById('txtCardCameraTitle');
  if (cardCameraTitle) cardCameraTitle.textContent = t.cardCameraTitle;
  const cardCameraSub = document.getElementById('txtCardCameraSub');
  if (cardCameraSub) cardCameraSub.textContent = t.cardCameraSub;

  const cardDocTitle = document.getElementById('txtCardDocTitle');
  if (cardDocTitle) cardDocTitle.textContent = t.cardDocTitle;
  const cardDocSub = document.getElementById('txtCardDocSub');
  if (cardDocSub) cardDocSub.textContent = t.cardDocSub;

  const queueHeader = document.querySelector('.queue-header h4');
  if (queueHeader) queueHeader.textContent = t.queueTitle;
  const queueEmptyP = document.querySelector('#queueEmpty p');
  if (queueEmptyP) queueEmptyP.textContent = t.queueEmpty;

  // Receive Screen
  const recvTitle = document.getElementById('txtRecvTitle');
  if (recvTitle) recvTitle.textContent = t.recvTitle;
  const recvSub = document.getElementById('txtRecvSub');
  if (recvSub) recvSub.textContent = t.recvSub;

  const searchInput = document.getElementById('mobileSearchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  const zipBtnSpan = document.querySelector('#downloadAllZipBtn span');
  if (zipBtnSpan) zipBtnSpan.textContent = t.downloadAll;

  // Notes Screen
  const notesHeader = document.querySelector('#notesScreen .screen-header h3');
  if (notesHeader) notesHeader.textContent = t.notesTitle;
  const notesSub = document.querySelector('#notesScreen .screen-header p');
  if (notesSub) notesSub.textContent = t.notesSub;

  const sendNoteSpan = document.querySelector('.note-box:first-child .box-title span');
  if (sendNoteSpan) sendNoteSpan.textContent = t.sendTextHeader;
  const sendNoteBtnEl = document.getElementById('sendNoteBtn');
  if (sendNoteBtnEl) sendNoteBtnEl.textContent = t.beamToPc;
  const noteInput = document.getElementById('mobileNoteInput');
  if (noteInput) noteInput.placeholder = t.notesInputPlaceholder;

  const recvNoteSpan = document.querySelector('.note-box:last-child .box-title span');
  if (recvNoteSpan) recvNoteSpan.textContent = t.receivedTextHeader;
  const copyNoteBtnEl = document.getElementById('copyNoteBtn');
  if (copyNoteBtnEl) copyNoteBtnEl.textContent = t.copyBtn;

  // About Screen
  const aboutScreenTitle = document.querySelector('#aboutScreen .screen-header h3');
  if (aboutScreenTitle) aboutScreenTitle.textContent = t.aboutTitle;
  const aboutScreenSub = document.querySelector('#aboutScreen .screen-header p');
  if (aboutScreenSub) aboutScreenSub.textContent = t.aboutSub;

  const aboutP = document.querySelector('.about-message-box p');
  if (aboutP) aboutP.innerHTML = t.aboutDev;
  const chimeSettingTitle = document.querySelector('.about-setting-title');
  if (chimeSettingTitle) chimeSettingTitle.textContent = t.aboutChimeTitle;
  const chimeSettingDesc = document.querySelector('.about-setting-desc');
  if (chimeSettingDesc) chimeSettingDesc.textContent = t.aboutChimeDesc;
  const contactBtn = document.querySelector('.about-email-btn');
  if (contactBtn) {
    contactBtn.childNodes[contactBtn.childNodes.length - 1].textContent = ` ${t.contactDev}`;
  }

  mobileStatsManager.render();
  renderDownloads(stagedFilesList);
}

// Elements
const mobileStatusPill = document.getElementById('mobileStatusPill');
const mobileStatusText = document.getElementById('mobileStatusText');
const mediaFileInput = document.getElementById('mediaFileInput');
const allFileInput = document.getElementById('allFileInput');
const queueList = document.getElementById('queueList');
const queueEmpty = document.getElementById('queueEmpty');
const queueCount = document.getElementById('queueCount');

const downloadsList = document.getElementById('downloadsList');
const downloadsEmpty = document.getElementById('downloadsEmpty');
const receiveNavBadge = document.getElementById('receiveNavBadge');

const mobileNoteInput = document.getElementById('mobileNoteInput');
const sendNoteBtn = document.getElementById('sendNoteBtn');
const receivedNoteText = document.getElementById('receivedNoteText');
const copyNoteBtn = document.getElementById('copyNoteBtn');

// Setup WebSocket Connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    mobileStatusPill.classList.remove('disconnected');
    mobileStatusText.textContent = 'Connected to PC';
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init-state') {
        if (msg.stagedFiles) renderDownloads(msg.stagedFiles);
        if (msg.clipboard && msg.clipboard.text) {
          receivedNoteText.value = msg.clipboard.text;
        }
      } else if (msg.type === 'staged-files-updated') {
        const prevCount = stagedFilesList.length;
        renderDownloads(msg.stagedFiles);
        if (msg.stagedFiles && msg.stagedFiles.length > prevCount) {
          triggerHaptic();
          mobileChime.playSuccess();
        }
      } else if (msg.type === 'clipboard-updated') {
        if (msg.clipboard && msg.clipboard.source === 'desktop') {
          receivedNoteText.value = msg.clipboard.text;
          triggerHaptic();
          mobileChime.playSuccess();
        }
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.onclose = () => {
    mobileStatusPill.classList.add('disconnected');
    mobileStatusText.textContent = 'Reconnecting...';
    setTimeout(connectWebSocket, 2500);
  };

  ws.onerror = () => {
    ws.close();
  };
}

// File Upload Handler
function handleFilesSelected(files) {
  if (!files || files.length === 0) return;

  const fileList = Array.from(files);
  queueEmpty.style.display = 'none';

  fileList.forEach(file => {
    uploadQueueCount++;
    queueCount.textContent = `${uploadQueueCount} file${uploadQueueCount > 1 ? 's' : ''}`;
    uploadSingleFile(file);
  });
}

function uploadSingleFile(file) {
  wakeLockManager.request();

  const item = document.createElement('div');
  item.className = 'upload-item';
  const itemId = 'upload_' + Math.random().toString(36).substring(2, 9);
  item.id = itemId;

  // Real thumbnail preview if image
  let iconHtml = getMobileFileIcon(file.name);
  if (file.type && file.type.startsWith('image/')) {
    try {
      const blobUrl = URL.createObjectURL(file);
      iconHtml = `<img src="${blobUrl}" class="upload-thumb-img" alt="${file.name}">`;
    } catch (e) {}
  }

  item.innerHTML = `
    <div class="upload-item-header">
      <div class="upload-file-details">
        <div class="upload-file-icon">
          ${iconHtml}
        </div>
        <div style="min-width: 0;">
          <div class="upload-file-name" title="${file.name}">${file.name}</div>
          <div class="upload-file-meta" id="meta_${itemId}">${formatBytes(file.size)} • Preparing...</div>
        </div>
      </div>
      <span class="upload-status-badge" id="badge_${itemId}">0%</span>
    </div>
    <div class="progress-track">
      <div class="progress-bar-fill" id="fill_${itemId}"></div>
    </div>
  `;

  queueList.prepend(item);

  const formData = new FormData();
  formData.append('files', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  const startTime = Date.now();
  let lastLoaded = 0;
  let lastTime = startTime;

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      const fillEl = document.getElementById(`fill_${itemId}`);
      const badgeEl = document.getElementById(`badge_${itemId}`);
      const metaEl = document.getElementById(`meta_${itemId}`);

      if (fillEl) fillEl.style.width = `${percent}%`;
      if (badgeEl) badgeEl.textContent = `${percent}%`;

      // Speed calculation
      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;
      if (timeDiff > 0.4) {
        const bytesDiff = e.loaded - lastLoaded;
        const speed = bytesDiff / timeDiff; // bytes per sec
        if (metaEl) {
          metaEl.textContent = `${formatBytes(e.loaded)} / ${formatBytes(e.total)} • ${formatBytes(speed)}/s`;
        }
        lastLoaded = e.loaded;
        lastTime = now;
      }
    }
  };

  xhr.onload = () => {
    wakeLockManager.release();
    const badgeEl = document.getElementById(`badge_${itemId}`);
    const metaEl = document.getElementById(`meta_${itemId}`);
    const fillEl = document.getElementById(`fill_${itemId}`);

    if (xhr.status === 200) {
      if (badgeEl) {
        badgeEl.textContent = 'Sent ✓';
        badgeEl.classList.add('done');
      }
      if (fillEl) {
        fillEl.style.width = '100%';
        fillEl.style.background = 'var(--accent-green)';
      }
      if (metaEl) {
        metaEl.textContent = `${formatBytes(file.size)} • Completed`;
      }
      mobileStatsManager.addTransfer(file.size || 0);
      triggerHaptic();
      mobileChime.playSuccess();
    } else {
      if (badgeEl) {
        badgeEl.textContent = 'Failed';
        badgeEl.style.color = 'var(--accent-rose)';
      }
    }
  };

  xhr.onerror = () => {
    wakeLockManager.release();
    const badgeEl = document.getElementById(`badge_${itemId}`);
    if (badgeEl) {
      badgeEl.textContent = 'Error';
      badgeEl.style.color = 'var(--accent-rose)';
    }
  };

  xhr.send(formData);
}

// Mobile Lightbox Modal handlers
function openMobileLightbox(fileId) {
  const file = stagedFilesList.find(f => f.id === fileId);
  if (!file) return;

  const modal = document.getElementById('mobileLightbox');
  const title = document.getElementById('mobileLightboxTitle');
  const meta = document.getElementById('mobileLightboxMeta');
  const body = document.getElementById('mobileLightboxBody');
  const downloadBtn = document.getElementById('mobileLightboxDownloadBtn');

  if (!modal || !title || !body) return;

  title.textContent = file.name;
  meta.textContent = `${formatBytes(file.size)} • Ready to download`;
  downloadBtn.href = `/api/download/${file.id}`;
  downloadBtn.download = file.name;

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'));

  if (isVideo) {
    body.innerHTML = `<video src="/api/preview/${file.id}" controls playsinline autoplay style="width:100%;max-height:52vh;"></video>`;
  } else {
    body.innerHTML = `<img src="/api/preview/${file.id}" alt="${file.name}">`;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeMobileLightbox() {
  const modal = document.getElementById('mobileLightbox');
  const body = document.getElementById('mobileLightboxBody');
  if (modal) {
    modal.style.display = 'none';
    if (body) body.innerHTML = '';
  }
  document.body.style.overflow = '';
}

// Render Files Shared from PC
function renderDownloads(files) {
  if (files) stagedFilesList = files;
  downloadsList.innerHTML = '';

  const filterBar = document.getElementById('mobileFilterBar');
  const receiveActionsBar = document.getElementById('receiveActionsBar');
  const receiveTotalCount = document.getElementById('receiveTotalCount');
  const receiveTotalSize = document.getElementById('receiveTotalSize');

  if (stagedFilesList.length === 0) {
    downloadsEmpty.style.display = 'flex';
    downloadsList.appendChild(downloadsEmpty);
    receiveNavBadge.style.display = 'none';
    if (receiveActionsBar) receiveActionsBar.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
    return;
  }

  downloadsEmpty.style.display = 'none';
  if (filterBar) filterBar.style.display = 'flex';
  receiveNavBadge.style.display = 'inline-block';
  receiveNavBadge.textContent = stagedFilesList.length;

  // Filter items
  let filtered = stagedFilesList.filter(file => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'));
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'));
    const isDoc = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
    const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);

    if (mobileActiveFilter === 'images' && !isImage) return false;
    if (mobileActiveFilter === 'videos' && !isVideo) return false;
    if (mobileActiveFilter === 'docs' && !isDoc) return false;
    if (mobileActiveFilter === 'audio' && !isAudio) return false;
    if (mobileActiveFilter === 'archives' && !isArchive) return false;

    if (mobileSearchQuery && !file.name.toLowerCase().includes(mobileSearchQuery)) {
      return false;
    }
    return true;
  });

  // Show "Download All (ZIP)" bar if there is more than 1 file
  if (stagedFilesList.length > 1) {
    const totalBytes = stagedFilesList.reduce((acc, f) => acc + (f.size || 0), 0);
    if (receiveActionsBar) receiveActionsBar.style.display = 'flex';
    if (receiveTotalCount) receiveTotalCount.textContent = `${stagedFilesList.length} files`;
    if (receiveTotalSize) receiveTotalSize.textContent = `• ${formatBytes(totalBytes)}`;
  } else {
    if (receiveActionsBar) receiveActionsBar.style.display = 'none';
  }

  if (filtered.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'queue-empty';
    emptyMsg.innerHTML = `<p>No matching files found.</p>`;
    downloadsList.appendChild(emptyMsg);
    return;
  }

  filtered.forEach(file => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'));
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'));

    let thumbHtml = `
      <div class="download-icon">
        ${getMobileFileIcon(file.name)}
      </div>
    `;

    if (isImage) {
      thumbHtml = `
        <div class="download-icon download-thumb-wrap" onclick="openMobileLightbox('${file.id}')" title="Tap to preview">
          <img src="/api/preview/${file.id}" loading="lazy" class="download-thumb-img" alt="${file.name}">
          <div class="download-thumb-overlay">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
        </div>
      `;
    } else if (isVideo) {
      thumbHtml = `
        <div class="download-icon download-thumb-wrap" onclick="openMobileLightbox('${file.id}')" title="Tap to play video">
          ${getMobileFileIcon(file.name)}
          <div class="download-thumb-overlay" style="opacity: 0.85;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'download-card';
    card.innerHTML = `
      <div class="download-info">
        ${thumbHtml}
        <div style="min-width: 0;">
          <div class="download-name" title="${file.name}">${file.name}</div>
          <div class="download-size">${formatBytes(file.size)} ${file.downloadCount > 0 ? `• Saved ${file.downloadCount}x` : ''}</div>
        </div>
      </div>
      <a href="/api/download/${file.id}" download="${file.name}" class="download-action-btn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14m7-7l-7 7-7-7"/></svg>
        Save
      </a>
    `;

    card.querySelector('.download-action-btn')?.addEventListener('click', () => {
      triggerHaptic();
      mobileStatsManager.addTransfer(file.size || 0);
    });

    downloadsList.appendChild(card);
  });
}

// Navigation Tabs
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen-view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      triggerHaptic();
      const targetScreen = item.dataset.target;

      navItems.forEach(n => n.classList.remove('active'));
      screens.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(targetScreen).classList.add('active');
    });
  });
}

// Event Listeners
function setupEvents() {
  // Gallery picker
  mediaFileInput.addEventListener('change', (e) => {
    triggerHaptic();
    handleFilesSelected(e.target.files);
    mediaFileInput.value = '';
  });

  // Direct Camera Capture
  const cameraInput = document.getElementById('cameraFileInput');
  if (cameraInput) {
    cameraInput.addEventListener('change', (e) => {
      triggerHaptic();
      handleFilesSelected(e.target.files);
      cameraInput.value = '';
    });
  }

  // All files picker
  allFileInput.addEventListener('change', (e) => {
    triggerHaptic();
    handleFilesSelected(e.target.files);
    allFileInput.value = '';
  });

  // Language Switcher Toggle
  const langBtn = document.getElementById('mobileLangToggleBtn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      triggerHaptic();
      const nextLang = mobileLang === 'mz' ? 'en' : 'mz';
      setMobileLanguage(nextLang);
    });
  }

  // Search input & Clear
  const searchInput = document.getElementById('mobileSearchInput');
  const searchClear = document.getElementById('mobileSearchClear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      mobileSearchQuery = e.target.value.toLowerCase().trim();
      if (searchClear) searchClear.style.display = mobileSearchQuery ? 'block' : 'none';
      renderDownloads();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      mobileSearchQuery = '';
      if (searchInput) searchInput.value = '';
      searchClear.style.display = 'none';
      renderDownloads();
    });
  }

  // Filter chips
  const chips = document.querySelectorAll('.mobile-filter-chips .mobile-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic();
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      mobileActiveFilter = chip.dataset.filter || 'all';
      renderDownloads();
    });
  });

  // Notes
  sendNoteBtn.addEventListener('click', () => {
    const text = mobileNoteInput.value.trim();
    if (text) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'clipboard-send',
          text,
          source: 'mobile'
        }));
      } else {
        fetch('/api/clipboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, source: 'mobile' })
        });
      }

      sendNoteBtn.textContent = 'Sent!';
      triggerHaptic();
      mobileChime.playSuccess();
      setTimeout(() => { sendNoteBtn.textContent = mobileI18n[mobileLang]?.beamToPc || 'Beam to PC'; }, 1500);
    }
  });

  copyNoteBtn.addEventListener('click', async () => {
    const text = receivedNoteText.value;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        copyNoteBtn.textContent = 'Copied!';
        triggerHaptic();
        setTimeout(() => { copyNoteBtn.textContent = mobileI18n[mobileLang]?.copyBtn || 'Copy'; }, 1500);
      } catch (err) {
        receivedNoteText.select();
        document.execCommand('copy');
        copyNoteBtn.textContent = 'Copied!';
        triggerHaptic();
        setTimeout(() => { copyNoteBtn.textContent = mobileI18n[mobileLang]?.copyBtn || 'Copy'; }, 1500);
      }
    }
  });
}

// Sound & Tih Rikna Controls
function setupSoundControls() {
  const mobileSoundToggle = document.getElementById('mobileSoundToggle');
  const aboutSoundToggle = document.getElementById('aboutSoundToggle');

  const syncSound = (checked, preview = false) => {
    mobileChime.setEnabled(checked);
    if (mobileSoundToggle) mobileSoundToggle.checked = checked;
    if (aboutSoundToggle) aboutSoundToggle.checked = checked;
    if (checked && preview) {
      mobileChime.playSuccess();
    }
  };

  if (mobileSoundToggle) {
    mobileSoundToggle.checked = mobileChime.enabled;
    mobileSoundToggle.addEventListener('change', () => syncSound(mobileSoundToggle.checked, true));
  }

  if (aboutSoundToggle) {
    aboutSoundToggle.checked = mobileChime.enabled;
    aboutSoundToggle.addEventListener('change', () => syncSound(aboutSoundToggle.checked, true));
  }

  // Pre-unlock audio on any first mobile interaction
  const unlockAudio = () => {
    mobileChime.init();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio, { passive: true });
  document.addEventListener('touchstart', unlockAudio, { passive: true });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  setMobileLanguage(mobileLang);
  mobileStatsManager.render();
  wakeLockManager.init();
  setupNavigation();
  setupEvents();
  setupSoundControls();
  connectWebSocket();

  // Setup Mobile Lightbox event listeners
  const closeBtn = document.getElementById('mobileLightboxClose');
  const backdrop = document.getElementById('mobileLightboxBackdrop');
  if (closeBtn) closeBtn.addEventListener('click', closeMobileLightbox);
  if (backdrop) backdrop.addEventListener('click', closeMobileLightbox);

  // Setup Download All ZIP button to trigger wake lock briefly
  const zipBtn = document.getElementById('downloadAllZipBtn');
  if (zipBtn) {
    zipBtn.addEventListener('click', () => {
      wakeLockManager.request();
      setTimeout(() => wakeLockManager.release(), 15000);
    });
  }

  // Load existing shared files
  fetch('/api/shared-files')
    .then(r => r.json())
    .then(data => renderDownloads(data))
    .catch(() => {});
});

