// Provide fallback window.beamApi if running in a standard web browser on PC
if (!window.beamApi) {
  let ws = null;
  const listeners = {
    'files-received': [],
    'client-connected': [],
    'client-disconnected': [],
    'clipboard-updated': [],
    'staged-files-updated': []
  };

  const connectWs = () => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${window.location.host}`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'files-received') listeners['files-received'].forEach(fn => fn(msg.files));
        if (msg.type === 'client-count') {
          listeners['client-connected'].forEach(fn => fn({ clientsCount: msg.count }));
        }
        if (msg.type === 'clipboard-updated') listeners['clipboard-updated'].forEach(fn => fn(msg.clipboard));
        if (msg.type === 'staged-files-updated') listeners['staged-files-updated'].forEach(fn => fn(msg.stagedFiles));
      } catch (err) {}
    };
    ws.onclose = () => setTimeout(connectWs, 2000);
  };
  connectWs();

  window.beamApi = {
    getInitialData: () => fetch('/api/info').then(r => r.json()),
    changeInterface: (address) => fetch('/api/interface', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    }).then(r => r.json()),
    refreshNetwork: () => fetch('/api/info').then(r => r.json()),
    copyToClipboard: (text) => navigator.clipboard.writeText(text),
    sendClipboardToPhone: (text) => fetch('/api/clipboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source: 'desktop' })
    }).then(r => r.json()),
    openSaveFolder: () => alert('Save folder is located at the path displayed on your computer.'),
    openFile: (path) => window.open(path, '_blank'),
    showItemInFolder: () => {},
    selectSaveFolder: async () => ({ success: false }),
    addFilesDialog: () => [],
    addFilesByPaths: () => [],
    removeStagedFile: (id) => {},
    clearStagedFiles: () => {},
    onFilesReceived: (cb) => { listeners['files-received'].push(cb); return () => {}; },
    onClientConnected: (cb) => { listeners['client-connected'].push(cb); return () => {}; },
    onClientDisconnected: (cb) => { listeners['client-disconnected'].push(cb); return () => {}; },
    onClipboardUpdated: (cb) => { listeners['clipboard-updated'].push(cb); return () => {}; },
    onStagedFilesUpdated: (cb) => { listeners['staged-files-updated'].push(cb); return () => {}; }
  };
}

// Synthesized audio chime using Web Audio API (100% offline, zero external files)
class ChimeSound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      // Tone 1: E5 (659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: A5 (880.00 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }
}

const chime = new ChimeSound();

// State
let appData = {
  activeInterface: null,
  interfaces: [],
  url: '',
  savePath: '',
  qrCode: '',
  receivedFiles: [],
  stagedFiles: [],
  clipboard: { text: '' }
};

// Filter & Batch State
let desktopCurrentFilter = 'all';
let desktopSearchQuery = '';
let desktopSelectedFileIds = new Set();
let desktopLang = localStorage.getItem('inthawnna_desktop_lang') || 'en';

// Daily Stats Tracker
const desktopStatsManager = {
  getTodayKey() {
    return 'inthawnna_desktop_stats_' + new Date().toISOString().slice(0, 10);
  },
  getStats() {
    try {
      const data = localStorage.getItem(this.getTodayKey());
      if (data) return JSON.parse(data);
    } catch(e) {}
    return { count: 0, bytes: 0 };
  },
  recordTransfer(bytes, count = 1) {
    const stats = this.getStats();
    stats.count += count;
    stats.bytes += (bytes || 0);
    try {
      localStorage.setItem(this.getTodayKey(), JSON.stringify(stats));
    } catch(e) {}
    this.render();
  },
  render() {
    const el = document.getElementById('desktopDailyStatsText');
    if (!el) return;
    const stats = this.getStats();
    const sizeStr = formatBytes(stats.bytes);
    el.textContent = `Today: ${stats.count} file${stats.count === 1 ? '' : 's'} (${sizeStr})`;
  }
};

// Desktop Language Localization
const desktopI18n = {
  en: {
    badge: 'EN',
    brandSub: 'File Transfer • Wireless • Zero App on Phone',
    qrHeading: 'Scan with Phone',
    step1: 'Connect Phone and PC to the same Wi-Fi.',
    step2: 'Scan QR code with your phone camera.',
    step3: 'Transfer any file back and forth!',
    dropTitle: 'Drop Files to Beam',
    dropSub: 'Release anywhere to send to phone',
    receivedTab: 'Received Files',
    sendTab: 'Send Files',
    clipTab: 'Clipboard Sync',
    aboutTab: 'About',
    incomingTitle: 'Incoming from Phone',
    incomingSub: 'Files sent from your mobile device automatically land here.',
    openSaveFolder: 'Open Save Folder',
    clearList: 'Clear List',
    waitingTransfers: 'Waiting for transfers...',
    waitingSub: 'Scan the QR code on the left with your phone camera, tap "Upload Files", and they will instantly appear here!',
    sendTitle: 'Send Files to Phone',
    sendSub: 'Stage files here. Connected phones can instantly download them via browser.',
    dropZoneH3: 'Drag & Drop Files Here',
    dropZoneP: 'or click "Choose Files" above to share with your phone',
    chooseFiles: 'Choose Files',
    clearAll: 'Clear All',
    selectAll: 'Select All',
    searchPlaceholder: 'Search received files...',
    clipTitle: 'Shared Clipboard & Notes',
    clipSub: 'Instantly beam links, passwords, and text between PC and Phone.',
    fromPhoneTitle: 'Latest Text from Phone',
    toPhoneTitle: 'Send Text to Phone',
    copyFromPhoneBtn: 'Copy to PC Clipboard',
    sendToPhoneBtn: 'Send to Phone',
    fromPhonePlaceholder: 'Text copied or typed on your phone will appear here in real-time...',
    toPhonePlaceholder: 'Type or paste text here to beam to your phone...',
    chimeLabel: 'Chime',
    aboutTitle: 'About',
    aboutSub: 'Inthawnna File Transfer Developer & Software Information',
    destFolderLabel: 'Destination Folder:',
    changeFolder: 'Change',
    openFolder: 'Open Folder'
  },
  mz: {
    badge: 'MZ',
    brandSub: 'File Inthawnna • Wireless • Phone-ah App A Ngai Lo',
    qrHeading: 'Phone-in Scan Rawh',
    step1: 'I Phone leh Computer/deveice dang te WiFi hman a inang tur a ni.',
    step2: 'QR code hi i phone atangin scan rawh',
    step3: 'I duh duh i thawn tawh mai dawn nia.',
    dropTitle: 'File Thawn Tur Dah Rawh',
    dropSub: 'Khawi hmunah pawh thlah la i phone-ah a thawn nghal ang',
    receivedTab: 'File Dawngte',
    sendTab: 'Thawnna',
    clipTab: 'Thu Thawnna',
    aboutTab: 'Chanchin',
    incomingTitle: 'Phone atanga lo thlengte',
    incomingSub: 'Phone atanga file an rawn thawnte chu heta hian a lo thleng nghal ang.',
    openSaveFolder: 'Folder Hawng Rawh',
    clearList: 'Tifai vek',
    waitingTransfers: 'File dawn a la nghak mek e...',
    waitingSub: 'Dinglama QR code hi phone camera-in scan la, "Upload Files" hmet rawh le!',
    sendTitle: 'Thawnna',
    sendSub: 'Heta i dah te hi phone connected atangin browser kaltlangin an download thei ang.',
    dropZoneH3: 'File heta hian hnuk lut rawh',
    dropZoneP: 'emaw a chunga "File Thlang Rawh" hmetin phone-ah thawn rawh',
    chooseFiles: 'File Thlang Rawh',
    clearAll: 'Tifai vek',
    selectAll: 'Thlang vek rawh',
    searchPlaceholder: 'File dawngte zawng rawh...',
    clipTitle: 'Thu leh Link Inthawnna',
    clipSub: 'PC leh Phone inkarah rang takin link, password, leh note inthawn rawh.',
    fromPhoneTitle: 'Phone atanga Thu Dawn',
    toPhoneTitle: 'Phone-a Thu Thawnna',
    copyFromPhoneBtn: 'Copy Rawh',
    sendToPhoneBtn: 'Phone-ah Thawn Rawh',
    fromPhonePlaceholder: 'I phone atanga thu an rawn thawn chu heta hian a lo lang ang...',
    toPhonePlaceholder: 'Heta hian thu emaw link chhu la, i phone-ah thawn rawh...',
    chimeLabel: 'Tih rikna',
    aboutTitle: 'Chanchin',
    aboutSub: 'Inthawnna File Transfer Siamtu leh App Chanchin',
    destFolderLabel: 'Save-na Hmun:',
    changeFolder: 'Thlak',
    openFolder: 'Folder Hawng'
  }
};

function setDesktopLanguage(lang) {
  if (!desktopI18n[lang]) lang = 'en';
  desktopLang = lang;
  localStorage.setItem('inthawnna_desktop_lang', lang);

  const t = desktopI18n[lang];
  const badge = document.getElementById('desktopLangBadge');
  if (badge) badge.textContent = t.badge;

  const brandSub = document.getElementById('desktopBrandSub');
  if (brandSub) brandSub.textContent = t.brandSub;

  const qrHeading = document.getElementById('desktopQrHeading');
  if (qrHeading) qrHeading.textContent = t.qrHeading;

  const step1 = document.getElementById('desktopStep1');
  if (step1) step1.textContent = t.step1;
  const step2 = document.getElementById('desktopStep2');
  if (step2) step2.textContent = t.step2;
  const step3 = document.getElementById('desktopStep3');
  if (step3) step3.textContent = t.step3;

  const dropTitle = document.getElementById('desktopDropTitle');
  if (dropTitle) dropTitle.textContent = t.dropTitle;
  const dropSub = document.getElementById('desktopDropSub');
  if (dropSub) dropSub.textContent = t.dropSub;

  const tabRecv = document.querySelector('.tab-btn[data-tab="incoming"]');
  if (tabRecv && tabRecv.childNodes[2]) {
    tabRecv.childNodes[2].textContent = ` ${t.receivedTab} `;
  }

  const tabSend = document.querySelector('.tab-btn[data-tab="outgoing"]');
  if (tabSend && tabSend.childNodes[2]) {
    tabSend.childNodes[2].textContent = ` ${t.sendTab} `;
  }

  const tabClip = document.querySelector('.tab-btn[data-tab="clipboard"]');
  if (tabClip && tabClip.lastChild) tabClip.lastChild.textContent = ` ${t.clipTab}`;

  const tabAbout = document.querySelector('.tab-btn[data-tab="about"]');
  if (tabAbout && tabAbout.lastChild) tabAbout.lastChild.textContent = ` ${t.aboutTab}`;

  const incTitle = document.querySelector('#incomingTab .toolbar-title h2');
  if (incTitle) incTitle.textContent = t.incomingTitle;
  const incSub = document.querySelector('#incomingTab .toolbar-title p');
  if (incSub) incSub.textContent = t.incomingSub;

  const sendTitleEl = document.querySelector('#outgoingTab .toolbar-title h2');
  if (sendTitleEl) sendTitleEl.textContent = t.sendTitle;
  const sendSubEl = document.querySelector('#outgoingTab .toolbar-title p');
  if (sendSubEl) sendSubEl.textContent = t.sendSub;

  const dropZoneH3 = document.getElementById('desktopDropZoneH3');
  if (dropZoneH3) dropZoneH3.textContent = t.dropZoneH3;
  const dropZoneP = document.getElementById('desktopDropZoneP');
  if (dropZoneP) dropZoneP.textContent = t.dropZoneP;

  const chooseFilesBtnText = document.getElementById('chooseFilesBtnText');
  if (chooseFilesBtnText) chooseFilesBtnText.textContent = t.chooseFiles;
  const clearStagedBtnText = document.getElementById('clearStagedBtnText');
  if (clearStagedBtnText) clearStagedBtnText.textContent = t.clearAll;

  const openFolderSpan = document.getElementById('openFolderActionText');
  if (openFolderSpan) openFolderSpan.textContent = t.openSaveFolder;

  const searchInput = document.getElementById('desktopSearchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  const selectAllText = document.getElementById('desktopSelectAllText');
  if (selectAllText) selectAllText.textContent = t.selectAll;

  const clipTitle = document.getElementById('desktopClipTitle');
  if (clipTitle) clipTitle.textContent = t.clipTitle;
  const clipSub = document.getElementById('desktopClipSub');
  if (clipSub) clipSub.textContent = t.clipSub;

  const fromPhoneTitle = document.getElementById('desktopFromPhoneTitle');
  if (fromPhoneTitle) fromPhoneTitle.textContent = t.fromPhoneTitle;
  const toPhoneTitle = document.getElementById('desktopToPhoneTitle');
  if (toPhoneTitle) toPhoneTitle.textContent = t.toPhoneTitle;

  const copyFromPhoneBtnText = document.getElementById('copyFromPhoneBtnText');
  if (copyFromPhoneBtnText) copyFromPhoneBtnText.textContent = t.copyFromPhoneBtn;
  const sendToPhoneBtnText = document.getElementById('sendToPhoneBtnText');
  if (sendToPhoneBtnText) sendToPhoneBtnText.textContent = t.sendToPhoneBtn;

  const fromPhoneText = document.getElementById('fromPhoneText');
  if (fromPhoneText) fromPhoneText.placeholder = t.fromPhonePlaceholder;
  const toPhoneText = document.getElementById('toPhoneText');
  if (toPhoneText) toPhoneText.placeholder = t.toPhonePlaceholder;

  const soundLabel = document.getElementById('soundToggleLabel');
  if (soundLabel) soundLabel.textContent = t.chimeLabel;

  const aboutTitle = document.getElementById('desktopAboutTitle');
  if (aboutTitle) aboutTitle.textContent = t.aboutTitle;
  const aboutSub = document.getElementById('desktopAboutSub');
  if (aboutSub) aboutSub.textContent = t.aboutSub;

  const destFolderLabel = document.getElementById('desktopDestFolderLabel');
  if (destFolderLabel) destFolderLabel.textContent = t.destFolderLabel;

  const changeFolderBtnText = document.getElementById('changeFolderBtnText');
  if (changeFolderBtnText) changeFolderBtnText.textContent = t.changeFolder;
  const openFolderBtnText = document.getElementById('openFolderBtnText');
  if (openFolderBtnText) openFolderBtnText.textContent = t.openFolder;

  desktopStatsManager.render();
}

// Utilities
function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`;
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  if (['pdf'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
  }
  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'pptx'].includes(ext)) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}

function isImageFile(filename, mimetype = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext) || (mimetype && mimetype.startsWith('image/'));
}

function isVideoFile(filename, mimetype = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext) || (mimetype && mimetype.startsWith('video/'));
}

// Desktop Lightbox Controller
let desktopLightboxState = {
  items: [],
  currentIndex: 0,
  source: 'received'
};

function openDesktopLightbox(index, items, source = 'received') {
  if (!items || items.length === 0) return;
  desktopLightboxState = { items, currentIndex: index, source };
  updateDesktopLightbox();

  const modal = document.getElementById('desktopLightbox');
  if (modal) modal.style.display = 'flex';
}

function closeDesktopLightbox() {
  const modal = document.getElementById('desktopLightbox');
  const stage = document.getElementById('desktopLightboxStage');
  if (modal) modal.style.display = 'none';
  if (stage) stage.innerHTML = '';
}

function navigateDesktopLightbox(delta) {
  const { items, currentIndex } = desktopLightboxState;
  if (!items || items.length <= 1) return;
  let nextIndex = currentIndex + delta;
  if (nextIndex < 0) nextIndex = items.length - 1;
  if (nextIndex >= items.length) nextIndex = 0;
  desktopLightboxState.currentIndex = nextIndex;
  updateDesktopLightbox();
}

function updateDesktopLightbox() {
  const { items, currentIndex, source } = desktopLightboxState;
  const file = items[currentIndex];
  if (!file) return;

  const titleEl = document.getElementById('desktopLightboxTitle');
  const subtitleEl = document.getElementById('desktopLightboxSubtitle');
  const stageEl = document.getElementById('desktopLightboxStage');
  const counterEl = document.getElementById('desktopLightboxCounter');
  const openBtn = document.getElementById('desktopLightboxOpenBtn');
  const folderBtn = document.getElementById('desktopLightboxFolderBtn');

  const fname = file.filename || file.originalName || file.name || 'File';
  const filePath = file.path || file.originalPath;
  const mimeType = file.mimetype || file.mimeType || '';

  if (titleEl) titleEl.textContent = fname;
  if (subtitleEl) subtitleEl.textContent = `${formatBytes(file.size)} • ${source === 'received' ? 'Received from Phone' : 'Send to Phone'}`;
  if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${items.length}`;

  const isVid = isVideoFile(fname, mimeType);
  const streamUrl = source === 'received' ? `/api/received-file/${file.id}` : `/api/preview/${file.id}`;

  if (stageEl) {
    if (isVid) {
      stageEl.innerHTML = `<video src="${streamUrl}" controls autoplay playsinline style="max-width:100%;max-height:56vh;"></video>`;
    } else {
      stageEl.innerHTML = `<img src="${streamUrl}" alt="${fname}">`;
    }
  }

  if (openBtn) {
    openBtn.onclick = () => {
      if (filePath) window.beamApi.openFile(filePath);
    };
  }

  if (folderBtn) {
    folderBtn.onclick = () => {
      if (filePath) window.beamApi.showItemInFolder(filePath);
    };
  }
}

// UI Elements
const interfaceSelect = document.getElementById('interfaceSelect');
const refreshNetworkBtn = document.getElementById('refreshNetworkBtn');
const qrImage = document.getElementById('qrImage');
const serverUrlText = document.getElementById('serverUrlText');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const clientCountBadge = document.getElementById('clientCountBadge');

const receivedCount = document.getElementById('receivedCount');
const stagedCount = document.getElementById('stagedCount');
const receivedEmptyState = document.getElementById('receivedEmptyState');
const receivedCardsGrid = document.getElementById('receivedCardsGrid');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const openFolderActionBtn = document.getElementById('openFolderActionBtn');

const desktopDropZone = document.getElementById('desktopDropZone');
const addFilesBtn = document.getElementById('addFilesBtn');
const stagedList = document.getElementById('stagedList');
const clearStagedBtn = document.getElementById('clearStagedBtn');

const fromPhoneText = document.getElementById('fromPhoneText');
const copyFromPhoneBtn = document.getElementById('copyFromPhoneBtn');
const toPhoneText = document.getElementById('toPhoneText');
const sendToPhoneBtn = document.getElementById('sendToPhoneBtn');

const saveFolderPath = document.getElementById('saveFolderPath');
const changeFolderBtn = document.getElementById('changeFolderBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const soundToggle = document.getElementById('soundToggle');

// Initialize
async function init() {
  soundToggle.checked = chime.enabled;
  soundToggle.addEventListener('change', () => {
    chime.enabled = soundToggle.checked;
  });

  setDesktopLanguage(desktopLang);
  setupTabs();
  setupEventListeners();

  try {
    const data = await window.beamApi.getInitialData();
    appData = { ...appData, ...data };
    renderApp();
  } catch (err) {
    console.error('Failed to load initial data:', err);
  }

  // Register real-time IPC listeners
  window.beamApi.onFilesReceived((files) => {
    appData.receivedFiles = [...files, ...appData.receivedFiles];
    files.forEach(f => desktopStatsManager.addTransfer(f.size || 0));
    renderReceivedFiles();
    chime.playSuccess();
  });

  window.beamApi.onClientConnected((data) => {
    updateClientCount(data.clientsCount);
  });

  window.beamApi.onClientDisconnected((data) => {
    updateClientCount(data.clientsCount);
  });

  window.beamApi.onClipboardUpdated((clipboard) => {
    appData.clipboard = clipboard;
    if (clipboard.source === 'mobile') {
      fromPhoneText.value = clipboard.text;
    }
  });

  window.beamApi.onStagedFilesUpdated((files) => {
    appData.stagedFiles = files;
    renderStagedFiles();
  });
}

function renderApp() {
  populateInterfaces();
  updateQR(appData.qrCode, appData.url);
  saveFolderPath.textContent = appData.savePath;
  saveFolderPath.title = appData.savePath;
  
  if (appData.transferHistory) {
    appData.receivedFiles = appData.transferHistory;
  }
  renderReceivedFiles();
  renderStagedFiles();

  if (appData.clipboard && appData.clipboard.text) {
    if (appData.clipboard.source === 'mobile') {
      fromPhoneText.value = appData.clipboard.text;
    } else {
      toPhoneText.value = appData.clipboard.text;
    }
  }
}

function populateInterfaces() {
  interfaceSelect.innerHTML = '';
  appData.interfaces.forEach((iface) => {
    const opt = document.createElement('option');
    opt.value = iface.address;
    const typeLabel = iface.type === 'hotspot' ? '🔥 Hotspot' : iface.type === 'wifi' ? '📶 Wi-Fi' : iface.type === 'ethernet' ? '🔌 LAN' : '🌐 Net';
    opt.textContent = `${typeLabel}: ${iface.address} (${iface.name})`;
    if (appData.activeInterface && appData.activeInterface.address === iface.address) {
      opt.selected = true;
    }
    interfaceSelect.appendChild(opt);
  });
}

function updateQR(qrCodeDataUrl, url) {
  qrImage.src = qrCodeDataUrl || '';
  serverUrlText.textContent = url || 'http://...';
}

function updateClientCount(count) {
  const c = count || 0;
  clientCountBadge.textContent = c === 1 ? '1 phone connected' : `${c} phones connected`;
  clientCountBadge.style.color = c > 0 ? '#34d399' : '#94a3b8';
}

function renderReceivedFiles() {
  receivedCount.textContent = appData.receivedFiles.length;

  const filterToolbar = document.getElementById('desktopFilterToolbar');
  const batchBar = document.getElementById('desktopBatchBar');
  const batchCount = document.getElementById('desktopSelectedCount');
  const selectAllCb = document.getElementById('desktopSelectAllCb');

  if (appData.receivedFiles.length === 0) {
    receivedEmptyState.style.display = 'flex';
    receivedCardsGrid.style.display = 'none';
    receivedCardsGrid.innerHTML = '';
    if (filterToolbar) filterToolbar.style.display = 'none';
    if (batchBar) batchBar.style.display = 'none';
    desktopSelectedFileIds.clear();
    return;
  }

  if (filterToolbar) filterToolbar.style.display = 'flex';
  receivedEmptyState.style.display = 'none';
  receivedCardsGrid.style.display = 'grid';

  // 1. Filter
  let filtered = [...appData.receivedFiles];
  if (desktopSearchQuery) {
    filtered = filtered.filter(f => (f.filename || f.originalName || '').toLowerCase().includes(desktopSearchQuery));
  }
  if (desktopCurrentFilter !== 'all') {
    filtered = filtered.filter(f => {
      const name = (f.filename || f.originalName || '').toLowerCase();
      const mime = (f.mimetype || '').toLowerCase();
      if (desktopCurrentFilter === 'image') return isImageFile(name, mime);
      if (desktopCurrentFilter === 'video') return isVideoFile(name, mime);
      if (desktopCurrentFilter === 'document') {
        return mime.includes('pdf') || mime.includes('text') || mime.includes('document') || name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
      }
      if (desktopCurrentFilter === 'audio') {
        return mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a');
      }
      if (desktopCurrentFilter === 'archive') {
        return mime.includes('zip') || mime.includes('tar') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z');
      }
      return true;
    });
  }

  // 2. Batch action bar
  if (batchBar) {
    if (desktopSelectedFileIds.size > 0) {
      batchBar.style.display = 'flex';
      if (batchCount) batchCount.textContent = `${desktopSelectedFileIds.size} selected`;
      if (selectAllCb) {
        selectAllCb.checked = filtered.length > 0 && filtered.every(f => desktopSelectedFileIds.has(f.id));
      }
    } else {
      batchBar.style.display = 'none';
      if (selectAllCb) selectAllCb.checked = false;
    }
  }

  receivedCardsGrid.innerHTML = '';
  if (filtered.length === 0) {
    receivedCardsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-dim);">No files match your search or filter.</div>`;
    return;
  }

  filtered.forEach((file, index) => {
    const fname = file.filename || file.originalName || 'file';
    const isImg = isImageFile(fname, file.mimetype);
    const isVid = isVideoFile(fname, file.mimetype);
    const isMedia = isImg || isVid;
    const isSelected = desktopSelectedFileIds.has(file.id);

    let iconBoxHtml = `
      <div class="file-icon-box">
        ${getFileIcon(fname)}
      </div>
    `;

    if (isImg && file.id) {
      iconBoxHtml = `
        <div class="file-thumb-wrap" title="Preview image">
          <img src="/api/received-file/${file.id}" loading="lazy" class="file-thumb-img" alt="${fname}">
          <div class="file-thumb-overlay">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
        </div>
      `;
    } else if (isVid) {
      iconBoxHtml = `
        <div class="file-thumb-wrap" title="Preview video">
          <div class="file-icon-box" style="width:100%;height:100%;background:rgba(167, 139, 250, 0.2);">
            ${getFileIcon(fname)}
          </div>
          <div class="file-thumb-overlay" style="opacity: 0.85;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = `file-card desktop-file-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <input type="checkbox" class="desktop-card-cb" data-id="${file.id}" ${isSelected ? 'checked' : ''} title="Select file">
      ${iconBoxHtml}
      <div class="file-info">
        <div class="file-name" title="${fname}">${fname}</div>
        <div class="file-meta">
          <span>${formatBytes(file.size)}</span>
          <span>•</span>
          <span>${formatTime(file.timestamp)}</span>
        </div>
      </div>
      <div class="file-card-actions">
        ${isMedia ? `
          <button class="mini-action-btn preview-card-btn" title="Quick Preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        ` : ''}
        <button class="mini-action-btn open-file-btn" title="Open File">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <button class="mini-action-btn show-folder-btn" title="Show in Folder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
    `;

    // Checkbox click listener
    card.querySelector('.desktop-card-cb')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        desktopSelectedFileIds.add(file.id);
      } else {
        desktopSelectedFileIds.delete(file.id);
      }
      renderReceivedFiles();
    });

    // Click thumbnail or preview button to trigger lightbox
    const thumbEl = card.querySelector('.file-thumb-wrap');
    if (thumbEl) {
      thumbEl.addEventListener('click', () => {
        openDesktopLightbox(index, filtered, 'received');
      });
    }

    const previewBtn = card.querySelector('.preview-card-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        openDesktopLightbox(index, filtered, 'received');
      });
    }

    card.querySelector('.open-file-btn')?.addEventListener('click', () => {
      window.beamApi.openFile(file.path);
    });

    card.querySelector('.show-folder-btn')?.addEventListener('click', () => {
      window.beamApi.showItemInFolder(file.path);
    });

    receivedCardsGrid.appendChild(card);
  });
}

function renderStagedFiles() {
  stagedCount.textContent = appData.stagedFiles.length;
  stagedList.innerHTML = '';

  if (appData.stagedFiles.length === 0) {
    return;
  }

  appData.stagedFiles.forEach((file, index) => {
    const isImg = isImageFile(file.name, file.mimeType);
    let iconBoxHtml = `
      <div class="file-icon-box" style="width: 38px; height: 38px;">
        ${getFileIcon(file.name)}
      </div>
    `;

    if (isImg && file.id) {
      iconBoxHtml = `
        <div class="file-thumb-wrap" style="width: 38px; height: 38px;" title="Click to preview">
          <img src="/api/preview/${file.id}" loading="lazy" class="file-thumb-img" alt="${file.name}">
        </div>
      `;
    }

    const item = document.createElement('div');
    item.className = 'staged-item';
    item.innerHTML = `
      <div class="staged-left">
        ${iconBoxHtml}
        <div>
          <div class="staged-name" title="${file.name}">${file.name}</div>
          <div class="staged-size">${formatBytes(file.size)} ${file.downloadCount > 0 ? `• Downloaded ${file.downloadCount}x` : ''}</div>
        </div>
      </div>
      <div style="display: flex; gap: 6px;">
        ${isImg ? `
          <button class="mini-action-btn staged-preview-btn" title="Preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        ` : ''}
        <button class="mini-action-btn delete-staged-btn" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    const thumbWrap = item.querySelector('.file-thumb-wrap');
    if (thumbWrap) {
      thumbWrap.addEventListener('click', () => {
        openDesktopLightbox(index, appData.stagedFiles, 'staged');
      });
    }

    const prevBtn = item.querySelector('.staged-preview-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        openDesktopLightbox(index, appData.stagedFiles, 'staged');
      });
    }

    item.querySelector('.delete-staged-btn').addEventListener('click', async () => {
      await window.beamApi.removeStagedFile(file.id);
    });

    stagedList.appendChild(item);
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`${target}Tab`).classList.add('active');
    });
  });
}

function setupEventListeners() {
  // Interface selection
  interfaceSelect.addEventListener('change', async (e) => {
    const newAddress = e.target.value;
    const res = await window.beamApi.changeInterface(newAddress);
    appData.activeInterface = res.activeInterface;
    appData.url = res.url;
    appData.qrCode = res.qrCode;
    updateQR(res.qrCode, res.url);
  });

  // Refresh network
  refreshNetworkBtn.addEventListener('click', async () => {
    refreshNetworkBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => { refreshNetworkBtn.style.transform = 'none'; }, 400);

    const res = await window.beamApi.refreshNetwork();
    appData.interfaces = res.interfaces;
    appData.activeInterface = res.activeInterface;
    appData.url = res.url;
    appData.qrCode = res.qrCode;
    populateInterfaces();
    updateQR(res.qrCode, res.url);
  });

  // Copy URL
  copyUrlBtn.addEventListener('click', async () => {
    if (appData.url) {
      await window.beamApi.copyToClipboard(appData.url);
      copyUrlBtn.style.color = '#34d399';
      setTimeout(() => { copyUrlBtn.style.color = ''; }, 1200);
    }
  });

  // Destination Folder Actions
  changeFolderBtn.addEventListener('click', async () => {
    const res = await window.beamApi.selectSaveFolder();
    if (res.success) {
      appData.savePath = res.savePath;
      saveFolderPath.textContent = res.savePath;
      saveFolderPath.title = res.savePath;
    }
  });

  openFolderBtn.addEventListener('click', () => {
    window.beamApi.openSaveFolder();
  });

  openFolderActionBtn.addEventListener('click', () => {
    window.beamApi.openSaveFolder();
  });

  clearHistoryBtn.addEventListener('click', () => {
    appData.receivedFiles = [];
    renderReceivedFiles();
  });

  // Outgoing Stage Files
  addFilesBtn.addEventListener('click', async () => {
    await window.beamApi.addFilesDialog();
  });

  clearStagedBtn.addEventListener('click', async () => {
    await window.beamApi.clearStagedFiles();
  });

  // Language Switcher Toggle
  const langToggleBtn = document.getElementById('desktopLangToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const nextLang = desktopLang === 'en' ? 'mz' : 'en';
      setDesktopLanguage(nextLang);
    });
  }

  // Search & Filter in Received Files
  const searchInput = document.getElementById('desktopSearchInput');
  const searchClear = document.getElementById('desktopSearchClear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      desktopSearchQuery = e.target.value;
      if (searchClear) searchClear.style.display = desktopSearchQuery ? 'block' : 'none';
      renderReceivedFiles();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      desktopSearchQuery = '';
      if (searchInput) searchInput.value = '';
      searchClear.style.display = 'none';
      renderReceivedFiles();
    });
  }

  const filterChips = document.querySelectorAll('.desktop-filter-chips .filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      desktopActiveFilter = chip.dataset.filter || 'all';
      renderReceivedFiles();
    });
  });

  // Batch actions
  const selectAllCb = document.getElementById('desktopSelectAllCb');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
      if (e.target.checked) {
        appData.receivedFiles.forEach(f => desktopSelectedFileIds.add(f.id));
      } else {
        desktopSelectedFileIds.clear();
      }
      renderReceivedFiles();
    });
  }

  const deleteSelectedBtn = document.getElementById('desktopDeleteSelectedBtn');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', () => {
      if (desktopSelectedFileIds.size === 0) return;
      if (confirm(`Remove ${desktopSelectedFileIds.size} file(s) from history?`)) {
        appData.receivedFiles = appData.receivedFiles.filter(f => !desktopSelectedFileIds.has(f.id));
        desktopSelectedFileIds.clear();
        renderReceivedFiles();
      }
    });
  }

  // Full-window Global Drag & Drop Overlay
  const globalOverlay = document.getElementById('desktopGlobalDropOverlay');
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (globalOverlay) globalOverlay.classList.add('active');
    desktopDropZone.classList.add('dragover');
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (globalOverlay) globalOverlay.classList.remove('active');
      desktopDropZone.classList.remove('dragover');
    }
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (globalOverlay) globalOverlay.classList.remove('active');
    desktopDropZone.classList.remove('dragover');

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const paths = Array.from(e.dataTransfer.files).map(f => f.path).filter(Boolean);
      if (paths.length > 0) {
        await window.beamApi.addFilesByPaths(paths);
      }
    }
  });

  // Drag and Drop files onto Desktop App Drop Zone
  desktopDropZone.addEventListener('click', async () => {
    await window.beamApi.addFilesDialog();
  });

  // Clipboard Screenshot / Image Pasting (Ctrl+V)
  window.addEventListener('paste', async (e) => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      return;
    }

    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const dataUrl = evt.target.result;
            const fname = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
            if (window.beamApi.stageDataUrl) {
              await window.beamApi.stageDataUrl(fname, dataUrl);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  });

  // Clipboard Actions
  copyFromPhoneBtn.addEventListener('click', async () => {
    const text = fromPhoneText.value;
    if (text) {
      await window.beamApi.copyToClipboard(text);
      copyFromPhoneBtn.textContent = 'Copied!';
      setTimeout(() => { copyFromPhoneBtn.textContent = 'Copy to PC Clipboard'; }, 1500);
    }
  });

  sendToPhoneBtn.addEventListener('click', async () => {
    const text = toPhoneText.value.trim();
    if (text) {
      await window.beamApi.sendClipboardToPhone(text);
      sendToPhoneBtn.textContent = 'Sent!';
      setTimeout(() => { sendToPhoneBtn.textContent = 'Send to Phone'; }, 1500);
    }
  });

  // Desktop Lightbox events
  const lightboxCloseBtn = document.getElementById('desktopLightboxCloseBtn');
  const lightboxScrim = document.getElementById('desktopLightboxScrim');
  const lightboxPrevBtn = document.getElementById('desktopLightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('desktopLightboxNextBtn');

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeDesktopLightbox);
  if (lightboxScrim) lightboxScrim.addEventListener('click', closeDesktopLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', () => navigateDesktopLightbox(-1));
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', () => navigateDesktopLightbox(1));

  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('desktopLightbox');
    if (!modal || modal.style.display === 'none') return;

    if (e.key === 'Escape') {
      closeDesktopLightbox();
    } else if (e.key === 'ArrowLeft') {
      navigateDesktopLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      navigateDesktopLightbox(1);
    }
  });

}

// Start
document.addEventListener('DOMContentLoaded', init);
