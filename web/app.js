/**
 * Inthawnna — P2P File Transfer Engine & UI Controller
 * Zero-cloud, high-speed WebRTC peer-to-peer file transfer
 */

// ==========================================================================
// 1. Synthesized Audio Chimes (Web Audio API - 100% Offline)
// ==========================================================================
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem('inthawnna_sound_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
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
      const now = this.ctx.currentTime;

      // Tone 1: E5 (659 Hz)
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

      // Tone 2: A5 (880 Hz)
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
    } catch (e) {}
  }

  playConnected() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  }

  setEnabled(val) {
    this.enabled = !!val;
    localStorage.setItem('inthawnna_sound_enabled', this.enabled ? 'true' : 'false');
  }
}

const sounds = new SoundSynthesizer();

// ==========================================================================
// 1B. Mobile & Desktop Haptics
// ==========================================================================
const haptics = {
  tap() {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch(e) {}
    }
  },
  success() {
    if ('vibrate' in navigator) {
      try { navigator.vibrate([25, 45, 25]); } catch(e) {}
    }
  },
  warning() {
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 70, 40]); } catch(e) {}
    }
  }
};

// ==========================================================================
// 1C. Multilingual Dictionary (English & Mizo)
// ==========================================================================
const I18N = {
  en: {
    appName: 'Inthawnna',
    tagline: 'Wireless Phone ➔ PC Transfer • Zero Cloud',
    soundToggle: 'Chime',
    langBadge: 'EN',
    autoSave: 'Auto-Save Folder',
    pairTab: 'Pairing',
    sendTab: 'Send Files',
    recvTab: 'Received',
    clipTab: 'Clipboard',
    aboutTab: 'About',
    awaitingPairing: 'Awaiting Device Pairing',
    techTagFull: 'Direct WebRTC P2P • Zero Cloud Storage',
    techTagShort: 'Direct P2P • Zero Cloud',
    pairTitle: 'Pair your devices',
    pairDesc: 'Connect devices instantly to transfer files directly. Scan the QR code below with your phone camera, share the pairing link, or enter the 6-digit Room Code.',
    openSendBtn: 'Open Send Files ➔',
    retryPairBtn: 'Retry Pairing',
    roomCodeLabel: 'Room Code:',
    scanWithPhone: 'Scan with Phone Camera',
    pointCamera: 'Point your iPhone or Android camera at the QR code above',
    pairedDevicesCount: '{count} paired devices',
    copyBtn: 'Copy',
    connectedPeers: 'Connected Peers',
    step1Title: 'Local Wi-Fi or Hotspot',
    step1Desc: 'Keep Phone and PC on the same Wi-Fi or mobile hotspot for top speed (30–80+ MB/s).',
    step2Title: 'Scan QR Code',
    step2Desc: 'Scan the QR code with your phone camera to open Inthawnna directly in the browser.',
    step3Title: 'Send Files',
    step3Desc: 'Send photos, 4K videos, and documents instantly with zero file size limits.',
    joinRoom: 'Join a Room',
    joinRoomSub: 'Connect to another PC or phone using their Room Code',
    joinInputPlaceholder: 'Code (e.g. 222222)',
    joinBtn: 'Connect',
    dividerOr: 'OR',
    scanCameraBtn: 'Scan QR with Camera',
    stopCameraBtn: 'Stop Camera',
    noticeNoPeer: 'No phone or peer paired yet. Scan the QR code or enter the Room Code to pair instantly.',
    viewQrBtn: 'View QR Code ➔',
    dropTitle: 'Drop files or photos here',
    dropSub: 'Direct peer-to-peer streaming • No file size limits',
    dropOverlayTitle: 'Drop Files to Send',
    dropOverlaySub: 'Release anywhere to stage files',
    photosBtn: 'Photos & Videos',
    cameraBtn: 'Camera',
    docBtn: 'Files & Docs',
    folderBtn: 'Folder',
    stagedTitle: 'Staged Files to Send',
    sendNowBtn: 'SEND FILES',
    clearAll: 'Clear All',
    receivedTitle: 'Received Files',
    noFilesRecv: 'No files received yet',
    noFilesRecvSub: 'Files sent from your phone or paired peer will show up here with instant previews.',
    downloadAllZip: 'Download All as ZIP',
    downloadZip: 'Download ZIP',
    delete: 'Delete',
    selectAll: 'Select All',
    searchPlaceholder: 'Search received files...',
    filterAll: 'All',
    filterPhotos: 'Photos 🖼️',
    filterVideos: 'Videos 🎬',
    filterDocs: 'Docs 📄',
    filterAudio: 'Audio 🎵',
    filterArchives: 'Archives 📦',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    sortLargest: 'Largest first',
    sortSmallest: 'Smallest first',
    clipTitle: 'Instant Clipboard Sync',
    clipSub: 'Share links, text, and notes between phone & PC',
    clipPlaceholder: 'Type or paste text, links, or notes here to send to your paired device...',
    beamTextBtn: 'Send Text',
    syncedNotes: 'Synced Notes',
    clearBtn: 'Clear',
    emptyNotes: 'No notes shared yet. Send some text above!',
    statsLabel: 'Today: {count} files ({bytes}) sent • Zero Cloud',
    chimeLabel: 'Chime',
    aboutBadge: 'P2P File Transfer • Web Edition',
    copyUpiBtn: 'Copy UPI ID',
    payUpiBtn: 'Pay with UPI',
    aboutH1Title: '100% Private P2P',
    aboutH1Desc: 'Direct browser-to-browser encryption. Zero files uploaded to any server.',
    aboutH2Title: 'Full Wi-Fi Speeds',
    aboutH2Desc: 'High throughput WebRTC DataChannels at 30–80+ MB/s.',
    aboutH3Title: 'Zero App Needed',
    aboutH3Desc: 'Works directly in browser on Android, iPhone, PC, Mac, Linux.',
    aboutH4Title: 'Direct Auto-Save',
    aboutH4Desc: 'Desktop Chromium folder picker streams files straight to your folder.'
  },
  mz: {
    appName: 'Inthawnna',
    tagline: 'Phone leh PC inthawnna awlsam • Zero Cloud',
    soundToggle: 'Tih rikna',
    langBadge: 'MZ',
    autoSave: 'Save-na Hmun',
    pairTab: 'Inzawmna',
    sendTab: 'Thawnna',
    recvTab: 'Dawnte',
    clipTab: 'Thu Thawnna',
    aboutTab: 'Chanchin',
    awaitingPairing: 'Inzawmna nghak mek',
    techTagFull: 'Direct WebRTC P2P • Cloud A Ngai Lo',
    techTagShort: 'Direct P2P • Cloud A Ngai Lo',
    pairTitle: 'I device te zawm tir rawh.',
    pairDesc: 'Direct Wi-Fi hmangin inzawm tir rawh. I phone camera hmangin QR code hi scan rawh, a nih loh pawhin Room Code 6-digit chhu rawh.',
    openSendBtn: 'File Thawnna Hawng Rawh ➔',
    retryPairBtn: 'Thlunzawm nawn leh rawh',
    roomCodeLabel: 'Room Code:',
    scanWithPhone: 'Phone Camera-in Scan Rawh',
    pointCamera: 'I iPhone emaw Android camera-in a chunga QR code hi tin rawh',
    pairedDevicesCount: 'Device {count} inzawm a ni',
    copyBtn: 'Copy Rawh',
    connectedPeers: 'Device Inzawmte',
    step1Title: 'Local Wi-Fi emaw Hotspot',
    step1Desc: 'I Phone leh Computer/deveice dang te Wi-Fi hman a inang tur a ni (Direct 30–80+ MB/s).',
    step2Title: 'Scan QR Code',
    step2Desc: 'Phone camera hmangin QR code hi scan rawh. Browser-ah a inhawng nghal ang.',
    step3Title: 'File Thawnna',
    step3Desc: 'Thlalak, 4K video, leh document engpawh awlsam takin inthawn a theih ta e.',
    joinRoom: 'Room-ah Lut Rawh',
    joinRoomSub: 'Device dang nen inzawm nan an Room Code hmang rawh',
    joinInputPlaceholder: 'Code (e.g. 222222)',
    joinBtn: 'Zawm Rawh',
    dividerOr: 'EMAW',
    scanCameraBtn: 'Camera hmangin QR Scan rawh',
    stopCameraBtn: 'Camera Ti Tawp Rawh',
    noticeNoPeer: 'Eng device mah thlunzawm a la ni lo. QR Code hmangin emaw Room code hmangin emaw thlun zawm phawt rawh.',
    viewQrBtn: 'QR Code En Rawh ➔',
    dropTitle: 'File emaw thlalak heta hian dah rawh',
    dropSub: 'Direct peer-to-peer streaming • File size bituk a awm lo',
    dropOverlayTitle: 'File thawn tur hi thlah rawh',
    dropOverlaySub: 'Khawi hmunah pawh thlah la transfer queue-ah a lut ang',
    photosBtn: 'Thlalak & Video',
    cameraBtn: 'Thla La Rawh',
    docBtn: 'File / Document',
    folderBtn: 'Folder',
    stagedTitle: 'Thawn tura chhawp chhuahte',
    sendNowBtn: 'THAWN RAWH',
    clearAll: 'Tifai vek',
    receivedTitle: 'File Dawngte',
    noFilesRecv: 'File dawn a la awm rih lo',
    noFilesRecvSub: 'I phone emaw computer atanga an rawn thawnte chu heta hian a lo lang ang.',
    downloadAllZip: 'ZIP-in download vek rawh',
    downloadZip: 'ZIP download',
    delete: 'Nuaibo',
    selectAll: 'Thlang vek rawh',
    searchPlaceholder: 'File dawngte zawng rawh...',
    filterAll: 'Vek',
    filterPhotos: 'Thlalak 🖼️',
    filterVideos: 'Video 🎬',
    filterDocs: 'Document 📄',
    filterAudio: 'Hla/Audio 🎵',
    filterArchives: 'ZIP/Rar 📦',
    sortNewest: 'A thar ber hmasa',
    sortOldest: 'A hlui ber hmasa',
    sortLargest: 'A lian ber hmasa',
    sortSmallest: 'A te ber hmasa',
    clipTitle: 'Thu leh Link Inthawnna',
    clipSub: 'Phone leh PC inkarah text, password, leh link inthawn tawn nan',
    clipPlaceholder: 'Thu, link, emaw note heta hian chhu la, i device dangah thawn rawh...',
    beamTextBtn: 'Thu Thawn Rawh',
    syncedNotes: 'Thu Dawnte',
    clearBtn: 'Tifai rawh',
    emptyNotes: 'Thu inthawn a la awm rih lo. A chungah khuan ziak la thawn rawh le!',
    statsLabel: 'Vawiin: file {count} ({bytes}) thawn a ni • Zero Cloud',
    chimeLabel: 'Tih rikna',
    aboutBadge: 'P2P File Inthawnna • Web Edition',
    copyUpiBtn: 'UPI ID Copy Rawh',
    payUpiBtn: 'UPI hmangin pe rawh',
    aboutH1Title: '100% P2P Him Tak',
    aboutH1Desc: 'Browser leh browser inkar encryption direct. Server-ah eng file mah a lut lo.',
    aboutH2Title: 'Wi-Fi Chakna Hman',
    aboutH2Desc: 'WebRTC DataChannel hmanga 30–80+ MB/s thlenga chak.',
    aboutH3Title: 'App A Ngai Lo',
    aboutH3Desc: 'Android, iPhone, PC, Mac, Linux-ah browser atangin a tlang nghal vek.',
    aboutH4Title: 'Direct Auto-Save',
    aboutH4Desc: 'File dawnte hi i device chhunga drive-ah a lut e.'
  }
};

let currentLang = localStorage.getItem('inthawnna_lang') || 'en';
window.inthawnnaLang = currentLang;

function setLanguage(lang) {
  if (!I18N[lang]) lang = 'en';
  currentLang = lang;
  window.inthawnnaLang = lang;
  localStorage.setItem('inthawnna_lang', lang);

  const t = I18N[lang];
  const langBadge = document.getElementById('langLabel');
  if (langBadge) langBadge.textContent = t.langBadge;

  // Header
  const folderPickerLabel = document.getElementById('folderPickerLabel');
  if (folderPickerLabel) folderPickerLabel.textContent = t.autoSave;

  // Tabs
  const pairShort = document.querySelector('#navConnectTab .tab-short');
  const pairFull = document.querySelector('#navConnectTab .tab-full');
  if (pairShort) pairShort.textContent = t.pairTab;
  if (pairFull) pairFull.textContent = t.pairTab;

  const sendShort = document.querySelector('#navTransferTab .tab-short');
  const sendFull = document.querySelector('#navTransferTab .tab-full');
  if (sendShort) sendShort.textContent = t.sendTab;
  if (sendFull) sendFull.textContent = t.sendTab;

  const recvShort = document.querySelector('#navReceivedTab .tab-short');
  const recvFull = document.querySelector('#navReceivedTab .tab-full');
  if (recvShort) recvShort.textContent = t.recvTab;
  if (recvFull) recvFull.textContent = t.recvTab;

  const clipShort = document.querySelector('#navClipboardTab .tab-short');
  const clipFull = document.querySelector('#navClipboardTab .tab-full');
  if (clipShort) clipShort.textContent = t.clipTab;
  if (clipFull) clipFull.textContent = t.clipTab;

  const aboutShort = document.querySelector('#navAboutTab .tab-short');
  const aboutFull = document.querySelector('#navAboutTab .tab-full');
  if (aboutShort) aboutShort.textContent = t.aboutTab;
  if (aboutFull) aboutFull.textContent = t.aboutTab;

  // Pairing Station
  const promptTitle = document.getElementById('promptTitle');
  if (promptTitle) promptTitle.textContent = t.pairTitle;
  const promptDesc = document.getElementById('promptDesc');
  if (promptDesc) promptDesc.textContent = t.pairDesc;
  const promptPillText = document.getElementById('promptPillText');
  if (promptPillText && (!window.webrtcManager || !window.webrtcManager.hasPeers())) promptPillText.textContent = t.awaitingPairing;
  const techTagFull = document.getElementById('techTagFull');
  if (techTagFull) techTagFull.textContent = t.techTagFull;
  const techTagShort = document.getElementById('techTagShort');
  if (techTagShort) techTagShort.textContent = t.techTagShort;

  const promptOpenTransferText = document.getElementById('promptOpenTransferText');
  if (promptOpenTransferText) promptOpenTransferText.textContent = t.openSendBtn;
  const promptRetryPairText = document.getElementById('promptRetryPairText');
  if (promptRetryPairText) promptRetryPairText.textContent = t.retryPairBtn || 'Retry Pairing';

  const hostCardTitle = document.getElementById('hostCardTitle');
  if (hostCardTitle) hostCardTitle.textContent = t.scanWithPhone;
  const qrCaptionText = document.getElementById('qrCaptionText');
  if (qrCaptionText) qrCaptionText.textContent = t.pointCamera;
  const roomCodeLabelText = document.getElementById('roomCodeLabelText');
  if (roomCodeLabelText) roomCodeLabelText.textContent = t.roomCodeLabel;
  const copyShareUrlText = document.getElementById('copyShareUrlText');
  if (copyShareUrlText) copyShareUrlText.textContent = t.copyBtn;
  const pairedPeersHeading = document.getElementById('pairedPeersHeading');
  if (pairedPeersHeading) pairedPeersHeading.textContent = t.connectedPeers;

  // Guide Steps
  const g1Title = document.getElementById('guideStep1Title');
  if (g1Title) g1Title.textContent = t.step1Title;
  const g1Desc = document.getElementById('guideStep1Desc');
  if (g1Desc) g1Desc.textContent = t.step1Desc;

  const g2Title = document.getElementById('guideStep2Title');
  if (g2Title) g2Title.textContent = t.step2Title;
  const g2Desc = document.getElementById('guideStep2Desc');
  if (g2Desc) g2Desc.textContent = t.step2Desc;

  const g3Title = document.getElementById('guideStep3Title');
  if (g3Title) g3Title.textContent = t.step3Title;
  const g3Desc = document.getElementById('guideStep3Desc');
  if (g3Desc) g3Desc.textContent = t.step3Desc;

  // Join Room
  const joinCardTitle = document.getElementById('joinCardTitle');
  if (joinCardTitle) joinCardTitle.textContent = t.joinRoom;
  const joinCardSubtitle = document.getElementById('joinCardSubtitle');
  if (joinCardSubtitle) joinCardSubtitle.textContent = t.joinRoomSub;
  const joinRoomCodeInput = document.getElementById('joinRoomCodeInput');
  if (joinRoomCodeInput) joinRoomCodeInput.placeholder = t.joinInputPlaceholder;
  const joinRoomBtnText = document.getElementById('joinRoomBtnText');
  if (joinRoomBtnText) joinRoomBtnText.textContent = t.joinBtn;
  const joinDividerText = document.getElementById('joinDividerText');
  if (joinDividerText) joinDividerText.textContent = t.dividerOr;
  const startCameraScanText = document.getElementById('startCameraScanText');
  if (startCameraScanText) startCameraScanText.textContent = t.scanCameraBtn;
  const stopCameraScanText = document.getElementById('stopCameraScanText');
  if (stopCameraScanText) stopCameraScanText.textContent = t.stopCameraBtn;

  // Dropzone & Outgoing
  const noticeNoPeerSpan = document.querySelector('#noticeNoPeer .notice-content span');
  if (noticeNoPeerSpan) noticeNoPeerSpan.textContent = t.noticeNoPeer;
  const openPairingBtn = document.getElementById('openPairingBtn');
  if (openPairingBtn) openPairingBtn.textContent = t.viewQrBtn;

  const dropzoneTitle = document.getElementById('dropzoneTitle');
  if (dropzoneTitle) dropzoneTitle.textContent = t.dropTitle;
  const dropzoneSubtitle = document.getElementById('dropzoneSubtitle');
  if (dropzoneSubtitle) dropzoneSubtitle.textContent = t.dropSub;

  const mediaText = document.getElementById('mediaBtnText');
  if (mediaText) mediaText.textContent = t.photosBtn;
  const cameraText = document.getElementById('cameraBtnText');
  if (cameraText) cameraText.textContent = t.cameraBtn;
  const docText = document.getElementById('docBtnText');
  if (docText) docText.textContent = t.docBtn;
  const folderText = document.getElementById('folderBtnText');
  if (folderText) folderText.textContent = t.folderBtn;

  const stagedTitleEl = document.querySelector('#stagedQueueCard .card-title');
  if (stagedTitleEl) stagedTitleEl.childNodes[0].textContent = t.stagedTitle + ' ';

  const sendBtnSpan = document.querySelector('#startSendBtn span');
  if (sendBtnSpan) sendBtnSpan.textContent = t.sendNowBtn;
  const clearQueue = document.getElementById('clearQueueBtn');
  if (clearQueue) clearQueue.textContent = t.clearAll;

  // Received Tab
  const receivedCardTitle = document.getElementById('receivedCardTitle');
  if (receivedCardTitle) receivedCardTitle.textContent = t.receivedTitle;
  const searchInput = document.getElementById('receivedSearchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;

  const optSortNewest = document.getElementById('optSortNewest');
  if (optSortNewest) optSortNewest.textContent = t.sortNewest;
  const optSortOldest = document.getElementById('optSortOldest');
  if (optSortOldest) optSortOldest.textContent = t.sortOldest;
  const optSortLargest = document.getElementById('optSortLargest');
  if (optSortLargest) optSortLargest.textContent = t.sortLargest;
  const optSortSmallest = document.getElementById('optSortSmallest');
  if (optSortSmallest) optSortSmallest.textContent = t.sortSmallest;

  const chipAll = document.getElementById('chipAll');
  if (chipAll) chipAll.textContent = t.filterAll;
  const chipPhotos = document.getElementById('chipPhotos');
  if (chipPhotos) chipPhotos.textContent = t.filterPhotos;
  const chipVideos = document.getElementById('chipVideos');
  if (chipVideos) chipVideos.textContent = t.filterVideos;
  const chipDocs = document.getElementById('chipDocs');
  if (chipDocs) chipDocs.textContent = t.filterDocs;
  const chipAudio = document.getElementById('chipAudio');
  if (chipAudio) chipAudio.textContent = t.filterAudio;
  const chipArchives = document.getElementById('chipArchives');
  if (chipArchives) chipArchives.textContent = t.filterArchives;

  const selectAllLabel = document.getElementById('selectAllLabel');
  if (selectAllLabel) selectAllLabel.textContent = t.selectAll;
  const downloadSelectedZipLabel = document.getElementById('downloadSelectedZipLabel');
  if (downloadSelectedZipLabel) downloadSelectedZipLabel.textContent = t.downloadZip;
  const downloadZipLabel = document.getElementById('downloadZipLabel');
  if (downloadZipLabel) downloadZipLabel.textContent = t.downloadAllZip;
  const deleteSelectedLabel = document.getElementById('deleteSelectedLabel');
  if (deleteSelectedLabel) deleteSelectedLabel.textContent = t.delete;

  const emptyReceivedTitle = document.getElementById('emptyReceivedTitle');
  if (emptyReceivedTitle) emptyReceivedTitle.textContent = t.noFilesRecv;
  const emptyReceivedSub = document.getElementById('emptyReceivedSub');
  if (emptyReceivedSub) emptyReceivedSub.textContent = t.noFilesRecvSub;

  // Drop Overlay
  const dropOverlayTitle = document.getElementById('dropOverlayTitle');
  if (dropOverlayTitle) dropOverlayTitle.textContent = t.dropOverlayTitle;
  const dropOverlaySub = document.getElementById('dropOverlaySub');
  if (dropOverlaySub) dropOverlaySub.textContent = t.dropOverlaySub;

  // Clipboard
  const clipCardTitle = document.getElementById('clipCardTitle');
  if (clipCardTitle) clipCardTitle.textContent = t.clipTitle;
  const clipCardSubtitle = document.getElementById('clipCardSubtitle');
  if (clipCardSubtitle) clipCardSubtitle.textContent = t.clipSub;
  const clipInput = document.getElementById('clipboardInput');
  if (clipInput) clipInput.placeholder = t.clipPlaceholder;
  const beamTextSpan = document.getElementById('beamTextBtnLabel');
  if (beamTextSpan) beamTextSpan.textContent = t.beamTextBtn;
  const syncedNotesHeading = document.getElementById('syncedNotesHeading');
  if (syncedNotesHeading) syncedNotesHeading.textContent = t.syncedNotes;
  const clearClipboardHistoryText = document.getElementById('clearClipboardHistoryText');
  if (clearClipboardHistoryText) clearClipboardHistoryText.textContent = t.clearBtn;
  const emptyNotesMsg = document.getElementById('emptyNotesMsg');
  if (emptyNotesMsg) emptyNotesMsg.textContent = t.emptyNotes;

  // Sound & Confirm
  const soundLabel = document.getElementById('soundCaptionLabel');
  if (soundLabel) soundLabel.textContent = t.chimeLabel;

  // ABOUT Tab
  const mizoBlock = document.getElementById('aboutMizoBlock');
  const engBlock = document.getElementById('aboutEngBlock');
  if (mizoBlock) mizoBlock.style.display = (lang === 'mz' ? 'block' : 'none');
  if (engBlock) engBlock.style.display = (lang === 'en' ? 'block' : 'none');

  const aboutBadge = document.getElementById('aboutBadge');
  if (aboutBadge) aboutBadge.textContent = t.aboutBadge;
  const copyUpiText = document.getElementById('copyUpiText');
  if (copyUpiText) copyUpiText.textContent = t.copyUpiBtn;
  const payUpiText = document.getElementById('payUpiText');
  if (payUpiText) payUpiText.textContent = t.payUpiBtn;

  const aboutH1Title = document.getElementById('aboutH1Title');
  if (aboutH1Title) aboutH1Title.textContent = t.aboutH1Title;
  const aboutH1Desc = document.getElementById('aboutH1Desc');
  if (aboutH1Desc) aboutH1Desc.textContent = t.aboutH1Desc;

  const aboutH2Title = document.getElementById('aboutH2Title');
  if (aboutH2Title) aboutH2Title.textContent = t.aboutH2Title;
  const aboutH2Desc = document.getElementById('aboutH2Desc');
  if (aboutH2Desc) aboutH2Desc.textContent = t.aboutH2Desc;

  const aboutH3Title = document.getElementById('aboutH3Title');
  if (aboutH3Title) aboutH3Title.textContent = t.aboutH3Title;
  const aboutH3Desc = document.getElementById('aboutH3Desc');
  if (aboutH3Desc) aboutH3Desc.textContent = t.aboutH3Desc;

  const aboutH4Title = document.getElementById('aboutH4Title');
  if (aboutH4Title) aboutH4Title.textContent = t.aboutH4Title;
  const aboutH4Desc = document.getElementById('aboutH4Desc');
  if (aboutH4Desc) aboutH4Desc.textContent = t.aboutH4Desc;

  // Stats meter
  statsManager.render();
}

function toggleLanguage() {
  const next = currentLang === 'en' ? 'mz' : 'en';
  setLanguage(next);
  haptics.tap();
  showToast(next === 'mz' ? 'Tawng hi Mizo-ah thlak a ni' : 'Switched to English', 'info');
}

// ==========================================================================
// 1D. Daily Transfer Stats Tracker
// ==========================================================================
const statsManager = {
  getTodayKey() {
    return 'inthawnna_stats_' + new Date().toISOString().slice(0, 10);
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
    const el = document.getElementById('dailyStatsText');
    if (!el) return;
    const stats = this.getStats();
    const sizeStr = formatBytes(stats.bytes);
    const tmpl = (I18N[currentLang] || I18N.en).statsLabel;
    el.textContent = tmpl.replace('{count}', stats.count).replace('{bytes}', sizeStr);
  }
};

// ==========================================================================
// 2. Screen Wake Lock Manager (prevents screen dimming during active transfers)
// ==========================================================================
class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.activeTransfers = 0;
    this.isSupported = 'wakeLock' in navigator;
    this.indicator = null;
  }

  init() {
    this.indicator = document.getElementById('wakeLockBadge');
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.activeTransfers > 0) {
        await this.request(true);
      }
    });
  }

  async request(isReacquire = false) {
    if (!isReacquire) this.activeTransfers++;
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
    } catch (e) {}
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
    if (this.indicator) {
      this.indicator.style.display = this.wakeLock ? 'inline-flex' : 'none';
    }
  }
}

const wakeLock = new WakeLockManager();

// ==========================================================================
// 3. UI Helpers: Toasts, Lightbox, Formatting
// ==========================================================================
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showToast(message, type = 'info') {
  const shelf = document.getElementById('toastShelf');
  if (!shelf) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  shelf.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Lightbox controller
const lightbox = {
  modal: null,
  container: null,
  caption: null,
  downloadBtn: null,
  currentBlobUrl: null,
  currentFileName: null,

  init() {
    this.modal = document.getElementById('lightboxModal');
    this.container = document.getElementById('lightboxMediaContainer');
    this.caption = document.getElementById('lightboxCaption');
    this.downloadBtn = document.getElementById('lightboxDownloadBtn');
    
    document.getElementById('lightboxCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('lightboxBackdrop')?.addEventListener('click', () => this.close());
    
    this.downloadBtn?.addEventListener('click', () => {
      if (this.currentBlobUrl && this.currentFileName) {
        triggerDownload(this.currentBlobUrl, this.currentFileName);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display !== 'none') {
        this.close();
      }
    });
  },

  open(blobUrl, fileName, mimeType) {
    this.currentBlobUrl = blobUrl;
    this.currentFileName = fileName;
    this.caption.textContent = fileName;
    this.container.innerHTML = '';

    if (mimeType && mimeType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = blobUrl;
      img.alt = fileName;
      this.container.appendChild(img);
    } else if (mimeType && mimeType.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = blobUrl;
      video.controls = true;
      video.autoplay = true;
      this.container.appendChild(video);
    }

    this.modal.style.display = 'flex';
  },

  close() {
    if (this.container) {
      const vid = this.container.querySelector('video');
      if (vid) vid.pause();
      this.container.innerHTML = '';
    }
    this.modal.style.display = 'none';
  }
};

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================================================
// 4. Inthawnna WebRTC P2P Manager
// ==========================================================================
class InthawnnaP2P {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.roomId = null;
    this.isHost = false;
    this.connections = new Map(); // peerId -> DataConnection
    this.stagedFiles = [];
    this.receivedFiles = [];
    this.clipboardHistory = [];
    
    // Directory handle for direct desktop auto-save (File System Access API)
    this.saveDirHandle = null;

    // Active file transfers
    this.incomingTransfers = new Map(); // fileId -> { meta, chunks, receivedBytes, startTime }
    this.isSending = false;
    this.isPaused = false;
    this.isCancelled = false;
    this.currentTransferFileId = null;
    this.pauseStartTime = 0;
    this.totalPausedDuration = 0;

    // Chunk size: 64KB for high throughput and wide mobile compatibility
    this.CHUNK_SIZE = 64 * 1024;
    this.BUFFER_THRESHOLD = 1 * 1024 * 1024; // 1MB backpressure threshold

    // Filter, Sort, and Batch Selection state
    this.selectedFileIds = new Set();
    this.searchQuery = '';
    this.currentFilter = 'all';
    this.currentSort = 'newest';
  }

  async init() {
    // 1. Detect Room ID from query param (?room=123456 or ?r=123456) OR hash (#room=123456 or #123456)
    let targetRoom = null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('room') && searchParams.get('room').trim()) {
        targetRoom = searchParams.get('room').trim();
      } else if (searchParams.has('r') && searchParams.get('r').trim()) {
        targetRoom = searchParams.get('r').trim();
      }
    } catch (e) {}

    if (!targetRoom && window.location.hash) {
      const rawHash = window.location.hash.replace(/^#/, '').trim();
      try {
        const hashParams = new URLSearchParams(rawHash.includes('=') ? rawHash : `room=${rawHash}`);
        if (hashParams.has('room') && hashParams.get('room').trim()) {
          targetRoom = hashParams.get('room').trim();
        } else if (hashParams.has('r') && hashParams.get('r').trim()) {
          targetRoom = hashParams.get('r').trim();
        }
      } catch (e) {}
      if (!targetRoom && (/^\d{4,8}$/.test(rawHash) || /^inth-[a-zA-Z0-9_-]+$/.test(rawHash))) {
        targetRoom = rawHash;
      }
    }

    if (targetRoom) {
      // Act as Client joining the host's room
      this.isHost = false;
      this.roomId = targetRoom;
      await this.initPeerClient(targetRoom);
    } else {
      // Act as Host: generate 6-digit room code
      this.isHost = true;
      this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
      await this.initPeerHost(this.roomId);
    }

    this.setupUIHandlers();
    this.renderRoomCode();

    // Auto-reconnect when user returns to this tab (e.g. from camera/lock screen/switching apps)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
          console.log('[Tab Active] Reconnecting to signaling broker...');
          try {
            this.peer.reconnect();
          } catch (e) {
            console.warn('[Tab Active] Reconnect error:', e);
          }
        }
      }
    });

    // Detect if opened inside an In-App Browser (e.g. WhatsApp, Instagram, TikTok)
    const ua = navigator.userAgent || '';
    const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat/i.test(ua);
    if (isInApp) {
      setTimeout(() => {
        showToast('Tip: For fastest speed and full file access, open in Chrome or Safari (tap ⋮)', 'info');
      }, 1200);
    }
  }

  getPeerConfig() {
    return {
      debug: 1,
      pingInterval: 3000,
      config: {
        iceServers: [
          // Google Anycast STUN servers (ultra-low latency global routing, sub-15ms)
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },

          // Cloudflare Anycast STUN (high-speed global edge)
          { urls: 'stun:stun.cloudflare.com:3478' },

          // Mozilla STUN
          { urls: 'stun:stun.services.mozilla.com' },

          // Nextcloud STUN
          { urls: 'stun:stun.nextcloud.com:443' }
        ],
        iceCandidatePoolSize: 6,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      }
    };
  }

  // --- Host Mode Initialization ---
  async initPeerHost(roomCode) {
    this.updateStatus('Creating Room...', 'connecting');
    const hostPeerId = `inthawnna-${roomCode}-host`;

    if (this.peer && !this.peer.destroyed) {
      try { this.peer.destroy(); } catch (e) {}
    }

    this.peer = new Peer(hostPeerId, this.getPeerConfig());

    this.peer.on('open', (id) => {
      this.peerId = id;
      this.updateStatus(`Room ${roomCode}`, 'online');
      this.renderQRCode();
      showToast(`Room ${roomCode} ready! Scan with phone camera`, 'success');

      // Reverse Discovery ("By hook or crook"):
      // Host proactively probes if phone has registered as inthawnna-${roomCode}-phone
      this.startHostPhoneDiscovery(roomCode);
    });

    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });

    // Auto-reconnect if signaling socket drops due to idle timeout
    this.peer.on('disconnected', () => {
      console.warn('[PeerJS] Host disconnected from signaling broker. Auto-reconnecting...');
      this.updateStatus(`Room ${roomCode} (Reconnecting...)`, 'connecting');
      if (this.peer && !this.peer.destroyed) {
        try {
          this.peer.reconnect();
        } catch (e) {
          console.warn('[PeerJS] Reconnect error:', e);
        }
      }
    });

    this.peer.on('error', (err) => {
      console.warn('Host peer error:', err);
      if (err.type === 'unavailable-id') {
        // Collision: pick another code and retry
        this.roomId = Math.floor(100000 + Math.random() * 900000).toString();
        this.renderRoomCode();
        this.initPeerHost(this.roomId);
      } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
        this.updateStatus('Reconnecting...', 'connecting');
        setTimeout(() => {
          if (this.peer && !this.peer.destroyed && this.peer.disconnected) {
            try { this.peer.reconnect(); } catch (e) {}
          }
        }, 1500);
      } else if (err.type === 'peer-unavailable') {
        // Normal during discovery probe; ignore silently
      } else {
        this.updateStatus('Offline / Retry', 'connecting');
      }
    });

    // Proactive keepalive heartbeat for host to prevent broker timeout
    if (this.hostHeartbeatTimer) clearInterval(this.hostHeartbeatTimer);
    this.hostHeartbeatTimer = setInterval(() => {
      if (this.isHost && this.peer) {
        if (this.peer.disconnected && !this.peer.destroyed) {
          try { this.peer.reconnect(); } catch (e) {}
        }
      }
    }, 3500);
  }

  startHostPhoneDiscovery(roomCode) {
    if (this.hostDiscoveryTimer) clearInterval(this.hostDiscoveryTimer);
    const phonePeerId = `inthawnna-${roomCode}-phone`;

    this.hostDiscoveryTimer = setInterval(() => {
      // Only probe if no peers are connected yet and host peer is open
      if (this.connections.size > 0 || !this.peer || this.peer.destroyed || !this.peer.open || this.peer.disconnected) {
        return;
      }
      try {
        const probeConn = this.peer.connect(phonePeerId, { reliable: true });
        if (probeConn) {
          probeConn.on('open', () => {
            console.log('[Host] Phone reached via reverse discovery probe!');
            this.handleIncomingConnection(probeConn);
          });
          probeConn.on('error', () => {
            // Normal if phone hasn't opened yet
          });
          setTimeout(() => {
            if (!probeConn.open) {
              try { probeConn.close(); } catch (e) {}
            }
          }, 3000);
        }
      } catch (e) {}
    }, 2200);
  }

  // --- Client Mode Initialization ---
  async initPeerClient(roomCode) {
    this.isConnecting = true;
    this.clientConnectAttempt = 0;
    const maxAttempts = 35;

    // Keep mobile screen awake while connecting/pairing
    try { wakeLock.request(); } catch (e) {}

    const promptPillText = document.getElementById('promptPillText');
    const promptTitle = document.getElementById('promptTitle');
    const promptDesc = document.getElementById('promptDesc');
    const promptActions = document.getElementById('promptActions');
    const retryBtn = document.getElementById('promptRetryPairBtn');
    if (retryBtn) retryBtn.style.display = 'none';

    this.updateStatus(`Connecting to ${roomCode}...`, 'connecting');
    if (promptPillText) promptPillText.textContent = `Connecting to Room ${roomCode}...`;
    if (promptTitle) promptTitle.textContent = `Connecting to your PC`;
    if (promptDesc) promptDesc.textContent = `Establishing direct P2P data tunnel with your PC...`;

    // Try primary well-known phone ID first so host can also auto-discover
    const phonePeerId = `inthawnna-${roomCode}-phone`;
    const fallbackCliId = `inthawnna-${roomCode}-cli-${Math.floor(1000 + Math.random() * 9000)}`;

    const createPeerAndConnect = (preferredId) => {
      if (this.peer && !this.peer.destroyed) {
        try { this.peer.destroy(); } catch (e) {}
      }

      this.peer = new Peer(preferredId, this.getPeerConfig());

      this.peer.on('open', () => {
        console.log(`[Client] Registered as ${this.peer.id}. Starting host connection...`);
        this.startConnectingToHost(roomCode, maxAttempts);
      });

      this.peer.on('connection', (conn) => {
        console.log('[Client] Host reached us via reverse discovery!');
        this.handleIncomingConnection(conn);
      });

      this.peer.on('disconnected', () => {
        console.warn('[Client] Disconnected from signaling broker. Auto-reconnecting...');
        if (this.peer && !this.peer.destroyed) {
          try { this.peer.reconnect(); } catch (e) {}
        }
      });

      this.peer.on('error', (err) => {
        console.warn('[Client] Peer error:', err);
        if (err.type === 'unavailable-id') {
          if (preferredId === phonePeerId) {
            console.log('[Client] Primary phone ID in use, switching to random client ID...');
            createPeerAndConnect(fallbackCliId);
          }
        } else if (err.type === 'peer-unavailable') {
          // Normal when host hasn't opened yet; handled in retry loop
        } else if (err.type === 'network' || err.type === 'socket-error' || err.type === 'server-error') {
          if (this.peer && !this.peer.destroyed && this.peer.disconnected) {
            try { this.peer.reconnect(); } catch (e) {}
          }
        }
      });
    };

    createPeerAndConnect(phonePeerId);
  }

  startConnectingToHost(roomCode, maxAttempts) {
    const hostId = `inthawnna-${roomCode}-host`;
    const promptPillText = document.getElementById('promptPillText');
    const promptTitle = document.getElementById('promptTitle');
    const promptDesc = document.getElementById('promptDesc');
    const promptActions = document.getElementById('promptActions');
    const retryBtn = document.getElementById('promptRetryPairBtn');

    if (this.clientConnectTimer) clearTimeout(this.clientConnectTimer);

    const attemptConnect = () => {
      // If already connected, stop
      if (this.connections.size > 0 || (this.connections.has && this.connections.has(hostId))) {
        this.isConnecting = false;
        return;
      }

      this.clientConnectAttempt++;
      const attempt = this.clientConnectAttempt;

      if (attempt > 1) {
        const attemptLabel = `Linking to PC... (Attempt ${attempt}/${maxAttempts})`;
        this.updateStatus(attemptLabel, 'connecting');
        if (promptPillText) promptPillText.textContent = attemptLabel;
        if (promptDesc) promptDesc.textContent = `Connecting directly to your PC... Keep Inthawnna open on your computer screen.`;
      }

      if (attempt > maxAttempts) {
        this.isConnecting = false;
        this.updateStatus('Pairing Timeout', 'connecting');
        if (promptPillText) promptPillText.textContent = 'Pairing Timeout';
        if (promptTitle) promptTitle.textContent = 'PC Not Detected';
        if (promptDesc) promptDesc.textContent = `Could not reach Room ${roomCode}. Ensure Inthawnna is open on your PC screen, then tap Retry.`;
        if (promptActions) promptActions.style.display = 'flex';
        if (retryBtn) retryBtn.style.display = 'inline-flex';
        showToast(`Could not pair with Room ${roomCode}. Tap Retry to try again.`, 'danger');
        return;
      }

      if (!this.peer || this.peer.destroyed) {
        console.warn('[Client] Peer destroyed, restarting client peer...');
        this.initPeerClient(roomCode);
        return;
      }

      if (this.peer.disconnected) {
        console.log('[Client] Peer disconnected from broker, reconnecting...');
        try { this.peer.reconnect(); } catch (e) {}
      }

      try {
        console.log(`[Client] Calling peer.connect(${hostId}) - Attempt ${attempt}`);
        const conn = this.peer.connect(hostId, { reliable: true });

        let opened = false;

        conn.on('open', () => {
          opened = true;
          this.isConnecting = false;
          if (this.clientConnectTimer) clearTimeout(this.clientConnectTimer);
          this.handleIncomingConnection(conn);
          if (promptActions) promptActions.style.display = 'flex';
          if (retryBtn) retryBtn.style.display = 'none';
        });

        conn.on('error', (err) => {
          console.warn(`[Client] Data connection error on attempt ${attempt}:`, err);
        });

        // Set retry interval (1.4 seconds) without destroying the Peer instance!
        this.clientConnectTimer = setTimeout(() => {
          if (!opened && this.connections.size === 0) {
            try { conn.close(); } catch (e) {}
            attemptConnect();
          }
        }, 1400);

      } catch (err) {
        console.warn(`[Client] peer.connect error:`, err);
        this.clientConnectTimer = setTimeout(attemptConnect, 1400);
      }
    };

    attemptConnect();
  }

  // --- Handle Data Connection ---
  handleIncomingConnection(conn) {
    if (!conn) return;

    // Guard against duplicate connection setups for the same peer
    if (this.connections.has(conn.peer) && this.connections.get(conn.peer).open) {
      console.log(`[P2P] Already connected to ${conn.peer}, ignoring duplicate.`);
      return;
    }

    if (this.clientConnectTimer) clearTimeout(this.clientConnectTimer);
    if (this.hostDiscoveryTimer) clearInterval(this.hostDiscoveryTimer);

    // Monitor WebRTC ICE connection state across different networks
    const monitorICE = () => {
      const pc = conn.peerConnection;
      if (pc && !pc._inthawnnaMonitored) {
        pc._inthawnnaMonitored = true;
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log('[WebRTC ICE] Connection state:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'failed') {
            console.warn('[WebRTC ICE] Direct route failed. Restarting ICE...');
            if (typeof pc.restartIce === 'function') {
              pc.restartIce();
            }
          }
        });
      }
    };

    if (conn.peerConnection) {
      monitorICE();
    } else {
      setTimeout(monitorICE, 400);
      setTimeout(monitorICE, 1200);
    }

    const onConnected = () => {
      this.connections.set(conn.peer, conn);
      this.isConnecting = false;
      this.updateConnectedUI();
      sounds.playConnected();
      haptics.success();
      showToast('Connected to peer device!', 'success');

      // Send local device info handshake
      try {
        conn.send({
          type: 'peer_handshake',
          userAgent: navigator.userAgent,
          platform: navigator.platform
        });
      } catch (e) {}

      // If mobile client (phone scanned QR code), switch directly to Send Files tab
      if (!this.isHost) {
        this.switchTab('transferTab');
      }
    };

    if (conn.open) {
      onConnected();
    } else {
      conn.on('open', onConnected);
    }

    conn.on('data', (data) => {
      this.handleReceivedData(conn, data);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.updateConnectedUI();
      showToast('Peer disconnected', 'danger');
    });

    conn.on('error', (err) => {
      console.warn('Connection error:', err);
      this.connections.delete(conn.peer);
      this.updateConnectedUI();
    });
  }

  updateConnectedUI() {
    const count = this.connections.size;
    const badge = document.getElementById('peerCountBadge');
    const notice = document.getElementById('noPeerNotice');
    const peersCard = document.getElementById('pairedPeersCard');
    const peersList = document.getElementById('pairedPeersList');

    // Pairing prompt banner elements
    const promptLivePill = document.getElementById('promptLivePill');
    const promptPillText = document.getElementById('promptPillText');
    const promptTitle = document.getElementById('promptTitle');
    const promptDesc = document.getElementById('promptDesc');
    const promptActions = document.getElementById('promptActions');
    const promptPulseDot = promptLivePill?.querySelector('.prompt-pulse-dot');

    if (badge) badge.textContent = `${count} paired device${count === 1 ? '' : 's'}`;
    if (notice) notice.style.display = count > 0 ? 'none' : 'flex';

    if (count > 0) {
      this.updateStatus(`${count} Device${count === 1 ? '' : 's'} Paired`, 'online');
      if (peersCard) peersCard.style.display = 'block';
      if (peersList) {
        peersList.innerHTML = Array.from(this.connections.keys()).map(id => `
          <div class="peer-row" style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;margin-top:6px;">
            <span class="status-pulse-dot" style="background:#10b981;"></span>
            <span style="font-size:0.85rem;color:#fff;">Connected Peer</span>
            <span style="font-size:0.75rem;color:#64748b;margin-left:auto;">P2P DataChannel</span>
          </div>
        `).join('');
      }

      if (promptPulseDot) promptPulseDot.classList.add('online');
      if (promptPillText) promptPillText.textContent = `${count} Device${count === 1 ? '' : 's'} Paired`;
      if (promptTitle) promptTitle.textContent = '🎉 Connected • Send Files Directly!';
      if (promptDesc) promptDesc.textContent = 'Your phone and PC are linked over direct high-speed Wi-Fi. Tap Send Files to transfer photos, videos, and documents instantly.';
      if (promptActions) promptActions.style.display = 'flex';
      const promptSendText = document.getElementById('promptOpenTransferText');
      if (promptSendText) promptSendText.textContent = 'Send Files Now ➔';
    } else {
      this.updateStatus(this.isHost ? `Room ${this.roomId}` : 'Waiting to Connect', 'connecting');
      if (peersCard) peersCard.style.display = 'none';

      if (promptPulseDot) promptPulseDot.classList.remove('online');
      if (promptPillText) promptPillText.textContent = this.isHost ? 'Awaiting Device Pairing' : 'Waiting to Connect';
      if (promptTitle) promptTitle.textContent = 'Pair your devices';
      if (promptDesc) promptDesc.textContent = 'Connect your devices to transfer files at maximum Wi-Fi speed. Scan the QR code below with your phone camera, or enter the 6-digit Room Code.';
      if (promptActions) promptActions.style.display = 'flex';
      const promptSendText = document.getElementById('promptOpenTransferText');
      if (promptSendText) promptSendText.textContent = 'Send Files';
    }
  }

  updateStatus(text, stateClass = 'online') {
    const label = document.getElementById('statusLabel');
    const badge = document.getElementById('connectionBadge');
    if (label) label.textContent = text;
    if (badge) {
      badge.className = `status-badge ${stateClass}`;
    }
  }

  // --- Data & Message Dispatcher ---
  async handleReceivedData(conn, data) {
    // 1. Binary Packet (File Chunk with 12-byte header)
    if (data instanceof ArrayBuffer || (data.buffer && data.buffer instanceof ArrayBuffer)) {
      const buffer = data instanceof ArrayBuffer ? data : data.buffer;
      const view = new DataView(buffer);
      const fileId = view.getUint32(0);
      const chunkIndex = view.getUint32(4);
      const payloadLength = view.getUint32(8);
      const chunkBytes = new Uint8Array(buffer, 12, payloadLength);

      const transfer = this.incomingTransfers.get(fileId);
      if (!transfer) return;

      transfer.chunks[chunkIndex] = chunkBytes;
      transfer.receivedBytes += payloadLength;

      // Update Receive Progress UI
      this.updateTransferProgress(transfer.meta.name, transfer.receivedBytes, transfer.meta.size, transfer.startTime, false);
      return;
    }

    // 2. Structured JSON / Object Message
    if (typeof data === 'object' && data !== null) {
      switch (data.type) {
        case 'peer_handshake':
          this.updateConnectedUI();
          break;

        case 'file_meta':
          await this.handleIncomingFileMeta(data);
          break;

        case 'file_done':
          await this.finalizeIncomingFile(data.fileId);
          break;

        case 'file_cancel':
          if (data.fileId) {
            this.incomingTransfers.delete(data.fileId);
          } else {
            this.incomingTransfers.clear();
          }
          document.getElementById('activeTransferCard').style.display = 'none';
          this.resetTransferControls();
          wakeLock.release();
          showToast('Transfer was cancelled by sender', 'warning');
          break;

        case 'file_cancel_request':
          if (this.isSending && (!data.fileId || this.currentTransferFileId === data.fileId)) {
            this.isCancelled = true;
            this.isSending = false;
            document.getElementById('activeTransferCard').style.display = 'none';
            this.resetTransferControls();
            wakeLock.release();
            showToast('Transfer cancelled by receiver', 'warning');
          }
          break;

        case 'transfer_paused':
          document.getElementById('transferSpeed').textContent = 'Paused';
          const rxPauseBtn = document.getElementById('transferPauseBtn');
          const rxPauseLabel = document.getElementById('transferPauseLabel');
          if (rxPauseLabel) rxPauseLabel.textContent = 'Paused';
          rxPauseBtn?.classList.add('paused');
          showToast('Transfer paused by peer', 'info');
          break;

        case 'transfer_resumed':
          const rxResBtn = document.getElementById('transferPauseBtn');
          const rxResLabel = document.getElementById('transferPauseLabel');
          if (rxResLabel) rxResLabel.textContent = 'Pause';
          rxResBtn?.classList.remove('paused');
          showToast('Transfer resumed by peer', 'info');
          break;

        case 'transfer_pause_request':
          if (this.isSending) {
            this.togglePauseTransfer();
          }
          break;

        case 'clipboard':
          this.handleIncomingClipboard(data);
          break;
      }
    }
  }

  // --- Incoming File Processing (Always Auto-Accept) ---
  handleIncomingFileMeta(meta) {
    wakeLock.request();
    this.currentTransferFileId = meta.fileId;
    this.resetTransferControls();
    this.incomingTransfers.set(meta.fileId, {
      meta,
      chunks: new Array(meta.totalChunks),
      receivedBytes: 0,
      startTime: Date.now()
    });

    document.getElementById('activeTransferCard').style.display = 'block';
    this.updateTransferProgress(meta.name, 0, meta.size, Date.now(), false);
  }

  async finalizeIncomingFile(fileId) {
    const transfer = this.incomingTransfers.get(fileId);
    if (!transfer) return;

    this.incomingTransfers.delete(fileId);
    wakeLock.release();
    document.getElementById('activeTransferCard').style.display = 'none';
    this.resetTransferControls();

    // Construct final Blob
    const blob = new Blob(transfer.chunks, { type: transfer.meta.mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const fileRecord = {
      id: fileId,
      name: transfer.meta.name,
      size: transfer.meta.size,
      mimeType: transfer.meta.mimeType,
      blob,
      blobUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.receivedFiles.unshift(fileRecord);
    this.renderReceivedFiles();
    sounds.playSuccess();
    haptics.success();
    statsManager.recordTransfer(transfer.meta.size, 1);
    showToast(`Received: ${transfer.meta.name}`, 'success');

    // Desktop Auto-Save via File System Access API
    if (this.saveDirHandle) {
      try {
        const fileHandle = await this.saveDirHandle.getFileHandle(transfer.meta.name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast(`Auto-saved to disk: ${transfer.meta.name}`, 'success');
      } catch (err) {
        console.warn('Direct disk save error:', err);
        triggerDownload(blobUrl, transfer.meta.name);
      }
    } else {
      // If mobile or no folder picked, trigger download prompt
      triggerDownload(blobUrl, transfer.meta.name);
    }
  }

  // --- Outgoing File Transfer ---
  async sendStagedFiles() {
    if (this.stagedFiles.length === 0) {
      showToast('No files staged to send', 'info');
      return;
    }

    if (this.connections.size === 0) {
      showToast('Please pair with a device first', 'danger');
      this.switchTab('connectTab');
      return;
    }

    this.isSending = true;
    this.isCancelled = false;
    this.isPaused = false;
    document.getElementById('activeTransferCard').style.display = 'block';
    document.getElementById('stagedQueueCard').style.display = 'none';

    const filesToSend = [...this.stagedFiles];
    this.stagedFiles = [];
    this.renderStagedFiles();

    for (const file of filesToSend) {
      if (this.isCancelled) break;
      const success = await this.streamSingleFile(file);
      if (!success) break;
    }

    const wasCancelled = this.isCancelled;
    this.isSending = false;
    this.isCancelled = false;
    this.isPaused = false;
    document.getElementById('activeTransferCard').style.display = 'none';
    this.resetTransferControls();

    if (!wasCancelled) {
      sounds.playSuccess();
      showToast('All files sent successfully!', 'success');
    }
  }

  async streamSingleFile(file) {
    wakeLock.request();
    const fileId = Math.floor(Math.random() * 0xFFFFFF);
    this.currentTransferFileId = fileId;
    this.isPaused = false;
    this.isCancelled = false;
    this.pauseStartTime = 0;
    this.totalPausedDuration = 0;
    this.resetTransferControls();

    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    const startTime = Date.now();

    // 1. Send file metadata to all connected peers
    const metaMsg = {
      type: 'file_meta',
      fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      totalChunks
    };

    for (const conn of this.connections.values()) {
      conn.send(metaMsg);
    }

    let offset = 0;
    let chunkIndex = 0;

    // 2. Stream binary slices with backpressure control
    while (offset < file.size) {
      if (this.isCancelled) {
        console.log('[Transfer] Cancelled by user.');
        break;
      }

      while (this.isPaused && !this.isCancelled) {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      if (this.isCancelled) {
        break;
      }

      // Check backpressure on all peer RTCDataChannels
      for (const conn of this.connections.values()) {
        const dc = conn.dataChannel;
        if (dc && dc.bufferedAmount > this.BUFFER_THRESHOLD) {
          await new Promise((resolve) => {
            const onLow = () => {
              dc.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            dc.bufferedAmountLowThreshold = this.BUFFER_THRESHOLD / 2;
            dc.addEventListener('bufferedamountlow', onLow);
          });
        }
      }

      if (this.isCancelled) break;

      const slice = file.slice(offset, offset + this.CHUNK_SIZE);
      const arrayBuffer = await slice.arrayBuffer();

      // Construct packet with 12-byte header
      const packet = new Uint8Array(12 + arrayBuffer.byteLength);
      const view = new DataView(packet.buffer);
      view.setUint32(0, fileId);
      view.setUint32(4, chunkIndex);
      view.setUint32(8, arrayBuffer.byteLength);
      packet.set(new Uint8Array(arrayBuffer), 12);

      for (const conn of this.connections.values()) {
        conn.send(packet.buffer);
      }

      offset += slice.size;
      chunkIndex++;

      const effectiveElapsed = Math.max(0.1, (Date.now() - startTime - this.totalPausedDuration) / 1000);
      this.updateTransferProgress(file.name, offset, file.size, effectiveElapsed, true, this.isPaused);
    }

    if (this.isCancelled) {
      for (const conn of this.connections.values()) {
        conn.send({ type: 'file_cancel', fileId });
      }
      wakeLock.release();
      return false;
    }

    // 3. Send completion notice
    const doneMsg = { type: 'file_done', fileId };
    for (const conn of this.connections.values()) {
      conn.send(doneMsg);
    }

    wakeLock.release();
    return true;
  }

  togglePauseTransfer() {
    if (!this.isSending && this.incomingTransfers.size === 0) return;
    haptics.tap();

    if (this.isSending) {
      this.isPaused = !this.isPaused;
      const pauseBtn = document.getElementById('transferPauseBtn');
      const pauseLabel = document.getElementById('transferPauseLabel');
      const iconPause = pauseBtn?.querySelector('.icon-pause');
      const iconResume = pauseBtn?.querySelector('.icon-resume');

      if (this.isPaused) {
        this.pauseStartTime = Date.now();
        if (pauseLabel) pauseLabel.textContent = 'Resume';
        if (iconPause) iconPause.style.display = 'none';
        if (iconResume) iconResume.style.display = 'inline-block';
        pauseBtn?.classList.add('paused');
        document.getElementById('transferSpeed').textContent = 'Paused';
        showToast('Transfer paused', 'info');
        for (const conn of this.connections.values()) {
          conn.send({ type: 'transfer_paused', fileId: this.currentTransferFileId });
        }
      } else {
        if (this.pauseStartTime) {
          this.totalPausedDuration = (this.totalPausedDuration || 0) + (Date.now() - this.pauseStartTime);
          this.pauseStartTime = 0;
        }
        if (pauseLabel) pauseLabel.textContent = 'Pause';
        if (iconPause) iconPause.style.display = 'inline-block';
        if (iconResume) iconResume.style.display = 'none';
        pauseBtn?.classList.remove('paused');
        showToast('Transfer resumed', 'info');
        for (const conn of this.connections.values()) {
          conn.send({ type: 'transfer_resumed', fileId: this.currentTransferFileId });
        }
      }
    } else if (this.incomingTransfers.size > 0) {
      for (const [fileId] of this.incomingTransfers.entries()) {
        for (const conn of this.connections.values()) {
          conn.send({ type: 'transfer_pause_request', fileId });
        }
      }
    }
  }

  cancelTransfer() {
    haptics.tap();
    if (this.isSending) {
      this.isCancelled = true;
      this.isPaused = false;
      this.isSending = false;
      document.getElementById('activeTransferCard').style.display = 'none';
      this.resetTransferControls();
      wakeLock.release();
      showToast('Transfer cancelled', 'warning');
      for (const conn of this.connections.values()) {
        conn.send({ type: 'file_cancel', fileId: this.currentTransferFileId });
      }
    } else if (this.incomingTransfers.size > 0) {
      for (const [fileId] of this.incomingTransfers.entries()) {
        for (const conn of this.connections.values()) {
          conn.send({ type: 'file_cancel_request', fileId });
        }
      }
      this.incomingTransfers.clear();
      document.getElementById('activeTransferCard').style.display = 'none';
      this.resetTransferControls();
      wakeLock.release();
      showToast('Transfer cancelled', 'warning');
    }
  }

  resetTransferControls() {
    const pauseBtn = document.getElementById('transferPauseBtn');
    const pauseLabel = document.getElementById('transferPauseLabel');
    const iconPause = pauseBtn?.querySelector('.icon-pause');
    const iconResume = pauseBtn?.querySelector('.icon-resume');
    if (pauseLabel) pauseLabel.textContent = 'Pause';
    if (iconPause) iconPause.style.display = 'inline-block';
    if (iconResume) iconResume.style.display = 'none';
    pauseBtn?.classList.remove('paused');
  }

  // --- Progress Monitor UI ---
  updateTransferProgress(fileName, loaded, total, elapsedSecOrStartTime, isSending, isPaused = false) {
    const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
    const elapsedSec = typeof elapsedSecOrStartTime === 'number' && elapsedSecOrStartTime < 1000000 
      ? elapsedSecOrStartTime 
      : Math.max(0.1, (Date.now() - elapsedSecOrStartTime) / 1000);
    const speedBytes = elapsedSec > 0 ? loaded / elapsedSec : 0;
    const speedStr = isPaused ? 'Paused' : `${formatBytes(speedBytes)}/s`;

    let etaStr = '';
    if (isPaused) {
      etaStr = 'Paused';
    } else if (speedBytes > 0 && loaded < total) {
      const remainingBytes = total - loaded;
      const remainingSec = Math.round(remainingBytes / speedBytes);
      etaStr = `ETA: ~${remainingSec}s`;
    } else {
      etaStr = percent === 100 ? 'Finishing...' : '';
    }

    document.getElementById('transferFileName').textContent = `${isSending ? 'Sending' : 'Receiving'}: ${fileName}`;
    document.getElementById('transferSpeed').textContent = speedStr;
    document.getElementById('transferPercent').textContent = `${percent}%`;
    document.getElementById('transferProgressBar').style.width = `${percent}%`;
    document.getElementById('transferBytes').textContent = `${formatBytes(loaded)} / ${formatBytes(total)}`;
    document.getElementById('transferEta').textContent = etaStr;
  }

  // --- Clipboard Sync ---
  sendClipboardText(text) {
    if (!text || !text.trim()) return;
    const item = {
      type: 'clipboard',
      text: text.trim(),
      timestamp: Date.now(),
      sender: 'me'
    };

    for (const conn of this.connections.values()) {
      conn.send(item);
    }

    this.clipboardHistory.unshift(item);
    this.renderClipboard();
    showToast('Text sent to peer!', 'success');
  }

  handleIncomingClipboard(data) {
    const item = {
      type: 'clipboard',
      text: data.text,
      timestamp: data.timestamp || Date.now(),
      sender: 'peer'
    };
    this.clipboardHistory.unshift(item);
    this.renderClipboard();
    sounds.playConnected();
    showToast('New note received from peer!', 'info');

    // Attempt writing to system clipboard if page is focused
    if (document.hasFocus() && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data.text).catch(() => {});
    }
  }

  // --- UI Renderers ---
  getLiveUrl() {
    const roomId = this.roomId || '';
    const host = window.location.hostname || '';
    // Detect local testing environments (localhost, 127.0.0.1, private IPs, or file:)
    const isLocal = host === 'localhost' || 
                    host === '127.0.0.1' || 
                    host === '0.0.0.0' ||
                    host.startsWith('192.168.') || 
                    host.startsWith('10.') || 
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
                    window.location.protocol === 'file:';
    if (isLocal) {
      return `https://inthawnna.pages.dev/?room=${roomId}#room=${roomId}`;
    }
    const base = `${window.location.origin}${window.location.pathname}`.replace(/\/index\.html$/, '').replace(/\/$/, '');
    return `${base}/?room=${roomId}#room=${roomId}`;
  }

  renderRoomCode() {
    const display = document.getElementById('roomCodeDisplay');
    const shareText = document.getElementById('shareUrlText');
    if (display) display.textContent = this.roomId || '------';
    
    if (shareText) {
      const url = this.getLiveUrl();
      const displayUrl = `https://inthawnna.pages.dev/#room=${this.roomId || ''}`;
      shareText.textContent = displayUrl;
      if (shareText.tagName === 'A') {
        shareText.href = url;
      }
    }
  }

  renderQRCode() {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas || !window.QRCode) return;

    const url = this.getLiveUrl();
    QRCode.toCanvas(canvas, url, {
      width: 216,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, (err) => {
      if (err) console.error('QR code render error:', err);
    });
  }

  renderStagedFiles() {
    const card = document.getElementById('stagedQueueCard');
    const list = document.getElementById('stagedFileList');
    const countLabel = document.getElementById('stagedCountLabel');
    const sizeLabel = document.getElementById('stagedTotalSizeLabel');
    const tabBadge = document.getElementById('stagedBadge');

    if (this.stagedFiles.length === 0) {
      card.style.display = 'none';
      tabBadge.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    tabBadge.style.display = 'inline-block';
    tabBadge.textContent = this.stagedFiles.length;

    let totalSize = 0;
    list.innerHTML = '';

    this.stagedFiles.forEach((file, index) => {
      totalSize += file.size;
      const item = document.createElement('div');
      item.className = 'queue-item';
      item.innerHTML = `
        <div class="queue-item-left">
          <div class="file-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="file-info-text">
            <div class="file-name-text">${file.name}</div>
            <div class="file-size-text">${formatBytes(file.size)}</div>
          </div>
        </div>
        <button class="remove-file-btn" data-index="${index}" title="Remove file">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      list.appendChild(item);
    });

    countLabel.textContent = `${this.stagedFiles.length} file${this.stagedFiles.length === 1 ? '' : 's'}`;
    sizeLabel.textContent = formatBytes(totalSize);

    list.querySelectorAll('.remove-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'));
        this.stagedFiles.splice(idx, 1);
        this.renderStagedFiles();
      });
    });
  }

  renderReceivedFiles() {
    const grid = document.getElementById('receivedFilesGrid');
    const empty = document.getElementById('receivedEmptyState');
    const badge = document.getElementById('receivedBadge');
    const countLabel = document.getElementById('receivedCountLabel');
    const zipBtn = document.getElementById('downloadAllZipBtn');
    const clearBtn = document.getElementById('clearReceivedBtn');
    const toolbar = document.getElementById('receivedToolbar');
    const batchBar = document.getElementById('batchActionBar');
    const batchBadge = document.getElementById('selectedCountBadge');
    const selectAllCb = document.getElementById('selectAllCheckbox');

    badge.textContent = this.receivedFiles.length;
    countLabel.textContent = this.receivedFiles.length;

    if (this.receivedFiles.length === 0) {
      if (empty) empty.style.display = 'block';
      if (grid) grid.innerHTML = '';
      if (zipBtn) zipBtn.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      if (toolbar) toolbar.style.display = 'none';
      if (batchBar) batchBar.style.display = 'none';
      this.selectedFileIds.clear();
      return;
    }

    if (empty) empty.style.display = 'none';
    if (zipBtn) zipBtn.style.display = 'inline-flex';
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    if (toolbar) toolbar.style.display = 'flex';

    // 1. Filter received files
    let filtered = [...this.receivedFiles];
    if (this.searchQuery) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(this.searchQuery));
    }
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(f => {
        const mime = (f.mimeType || '').toLowerCase();
        const name = (f.name || '').toLowerCase();
        if (this.currentFilter === 'image') return mime.startsWith('image/');
        if (this.currentFilter === 'video') return mime.startsWith('video/');
        if (this.currentFilter === 'document') {
          return mime.includes('pdf') || mime.includes('text') || mime.includes('document') || 
                 name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
        }
        if (this.currentFilter === 'audio') {
          return mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a');
        }
        if (this.currentFilter === 'archive') {
          return mime.includes('zip') || mime.includes('tar') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z');
        }
        return true;
      });
    }

    // 2. Sort received files
    if (this.currentSort === 'oldest') {
      filtered.reverse();
    } else if (this.currentSort === 'largest') {
      filtered.sort((a, b) => b.size - a.size);
    } else if (this.currentSort === 'smallest') {
      filtered.sort((a, b) => a.size - b.size);
    }

    // 3. Update Batch Action Bar
    if (batchBar) {
      if (this.selectedFileIds.size > 0) {
        batchBar.style.display = 'flex';
        if (batchBadge) batchBadge.textContent = `${this.selectedFileIds.size} selected`;
        if (selectAllCb) {
          selectAllCb.checked = filtered.length > 0 && filtered.every(f => this.selectedFileIds.has(f.id));
        }
      } else {
        batchBar.style.display = 'none';
        if (selectAllCb) selectAllCb.checked = false;
      }
    }

    // 4. Render file cards
    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-dim);">No files match your search or filter.</div>`;
      return;
    }

    filtered.forEach((file) => {
      const isImg = file.mimeType && file.mimeType.startsWith('image/');
      const isVid = file.mimeType && file.mimeType.startsWith('video/');
      const isSelected = this.selectedFileIds.has(file.id);
      const card = document.createElement('div');
      card.className = `received-card-item ${isSelected ? 'selected' : ''}`;

      let mediaPreview = '';
      if (isImg) {
        mediaPreview = `
          <div class="media-preview-box" data-preview-id="${file.id}">
            <img src="${file.blobUrl}" alt="${file.name}" class="media-thumbnail-img">
          </div>
        `;
      } else if (isVid) {
        mediaPreview = `
          <div class="media-preview-box" data-preview-id="${file.id}">
            <video src="${file.blobUrl}" class="media-thumbnail-img"></video>
            <div style="position:absolute;color:#fff;background:rgba(0,0,0,0.5);border-radius:50%;padding:6px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        `;
      } else {
        const ext = file.name.split('.').pop() || 'FILE';
        mediaPreview = `
          <div class="media-preview-box">
            <div class="generic-file-display">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span class="generic-file-ext">${ext}</span>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <input type="checkbox" class="card-select-checkbox" data-id="${file.id}" ${isSelected ? 'checked' : ''} title="Select file">
        ${mediaPreview}
        <div class="received-item-body">
          <div class="received-filename" title="${file.name}">${file.name}</div>
          <div class="received-meta">
            <span>${formatBytes(file.size)}</span>
            <span>${file.time}</span>
          </div>
          <div class="received-actions">
            ${isImg || isVid ? `<button class="btn-glow secondary-btn mini preview-btn" data-id="${file.id}">Preview</button>` : ''}
            <button class="btn-glow primary-btn mini download-single-btn" data-id="${file.id}">Download</button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Checkbox listener
    grid.querySelectorAll('.card-select-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(cb.getAttribute('data-id'));
        if (cb.checked) {
          this.selectedFileIds.add(id);
        } else {
          this.selectedFileIds.delete(id);
        }
        haptics.tap();
        this.renderReceivedFiles();
      });
    });

    // Event listeners on preview and download buttons
    grid.querySelectorAll('.preview-btn, .media-preview-box').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-select-checkbox')) return;
        const id = parseInt(el.getAttribute('data-preview-id') || el.getAttribute('data-id'));
        const file = this.receivedFiles.find(f => f.id === id);
        if (file) lightbox.open(file.blobUrl, file.name, file.mimeType);
      });
    });

    grid.querySelectorAll('.download-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        const file = this.receivedFiles.find(f => f.id === id);
        if (file) {
          haptics.tap();
          triggerDownload(file.blobUrl, file.name);
        }
      });
    });
  }

  async downloadSelectedAsZip() {
    if (this.selectedFileIds.size === 0 || !window.JSZip) return;
    const selected = this.receivedFiles.filter(f => this.selectedFileIds.has(f.id));
    if (selected.length === 0) return;
    showToast(`Creating ZIP for ${selected.length} file(s)...`, 'info');
    haptics.tap();

    const zip = new JSZip();
    selected.forEach(file => {
      zip.file(file.name, file.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(content);
    triggerDownload(zipUrl, `Inthawnna_Selected_${Date.now()}.zip`);
    haptics.success();
    showToast('Selected files ZIP downloaded!', 'success');
  }

  deleteSelectedFiles() {
    if (this.selectedFileIds.size === 0) return;
    const count = this.selectedFileIds.size;
    this.receivedFiles = this.receivedFiles.filter(f => !this.selectedFileIds.has(f.id));
    this.selectedFileIds.clear();
    this.renderReceivedFiles();
    haptics.warning();
    showToast(`Removed ${count} file(s)`, 'info');
  }

  async downloadAllAsZip() {
    if (this.receivedFiles.length === 0 || !window.JSZip) return;
    showToast('Creating ZIP archive...', 'info');

    const zip = new JSZip();
    this.receivedFiles.forEach(file => {
      zip.file(file.name, file.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(content);
    triggerDownload(zipUrl, `Inthawnna_Files_${Date.now()}.zip`);
    showToast('ZIP downloaded!', 'success');
  }

  renderClipboard() {
    const list = document.getElementById('clipboardList');
    if (this.clipboardHistory.length === 0) {
      list.innerHTML = `<div class="empty-mini">No notes shared yet. Send some text above!</div>`;
      return;
    }

    list.innerHTML = '';
    this.clipboardHistory.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'clipboard-item';
      row.innerHTML = `
        <div class="clipboard-content">${this.escapeHtml(item.text)}</div>
        <button class="clipboard-copy-btn" data-idx="${index}">Copy</button>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('.clipboard-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const note = this.clipboardHistory[idx];
        if (note && navigator.clipboard) {
          navigator.clipboard.writeText(note.text).then(() => {
            showToast('Copied to clipboard!', 'success');
          });
        }
      });
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- UI Handlers & Setup ---
  setupUIHandlers() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        this.switchTab(target);
      });
    });

    document.getElementById('openPairingBtn')?.addEventListener('click', () => {
      this.switchTab('connectTab');
    });

    document.getElementById('promptOpenTransferBtn')?.addEventListener('click', () => {
      this.switchTab('transferTab');
    });

    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.checked = sounds.enabled;
      soundToggle.addEventListener('change', (e) => {
        sounds.setEnabled(e.target.checked);
        showToast(e.target.checked ? 'Audio chime enabled' : 'Audio chime disabled', 'info');
      });
    }

    // Direct desktop folder auto-save picker (File System Access API)
    const folderBtn = document.getElementById('folderPickerBtn');
    const folderLabel = document.getElementById('folderPickerLabel');
    if ('showDirectoryPicker' in window) {
      folderBtn?.addEventListener('click', async () => {
        try {
          this.saveDirHandle = await window.showDirectoryPicker();
          folderBtn.classList.add('active');
          folderLabel.textContent = `Saving: ${this.saveDirHandle.name}`;
          showToast(`Direct save folder set: ${this.saveDirHandle.name}`, 'success');
        } catch (e) {
          // User cancelled
        }
      });
    } else {
      // Hide or label unsupported on mobile
      if (folderBtn) folderBtn.style.display = 'none';
    }

    // Drag and Drop Zone
    const dropZone = document.getElementById('dropZone');
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        this.addFilesToStage(Array.from(e.dataTransfer.files));
      }
    });

    // File inputs
    document.getElementById('mediaFileInput')?.addEventListener('change', (e) => {
      if (e.target.files) this.addFilesToStage(Array.from(e.target.files));
    });

    document.getElementById('docFileInput')?.addEventListener('change', (e) => {
      if (e.target.files) this.addFilesToStage(Array.from(e.target.files));
    });

    document.getElementById('folderInput')?.addEventListener('change', (e) => {
      if (e.target.files) this.addFilesToStage(Array.from(e.target.files));
    });

    // Staged queue buttons
    document.getElementById('clearQueueBtn')?.addEventListener('click', () => {
      this.stagedFiles = [];
      this.renderStagedFiles();
    });

    document.getElementById('startSendBtn')?.addEventListener('click', () => {
      this.sendStagedFiles();
    });

    // Prompt open transfer button (upper screen option)
    document.getElementById('promptOpenTransferBtn')?.addEventListener('click', () => {
      haptics.tap();
      this.switchTab('transferTab');
    });

    // Transfer controls: Pause / Resume & Cancel
    document.getElementById('transferPauseBtn')?.addEventListener('click', () => {
      this.togglePauseTransfer();
    });

    document.getElementById('transferCancelBtn')?.addEventListener('click', () => {
      this.cancelTransfer();
    });

    // Received files actions
    document.getElementById('downloadAllZipBtn')?.addEventListener('click', () => {
      this.downloadAllAsZip();
    });

    document.getElementById('clearReceivedBtn')?.addEventListener('click', () => {
      this.receivedFiles = [];
      this.renderReceivedFiles();
    });

    // Clipboard actions
    document.getElementById('sendClipboardBtn')?.addEventListener('click', () => {
      const input = document.getElementById('clipboardInput');
      if (input) {
        this.sendClipboardText(input.value);
        input.value = '';
      }
    });

    document.getElementById('clearClipboardHistoryBtn')?.addEventListener('click', () => {
      this.clipboardHistory = [];
      this.renderClipboard();
    });

    // Copy URL button
    document.getElementById('copyShareUrlBtn')?.addEventListener('click', () => {
      const shareText = document.getElementById('shareUrlText')?.textContent || this.getLiveUrl();
      if (shareText && navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          showToast('Live link copied to clipboard!', 'success');
        });
      }
    });

    // Copy UPI ID button
    document.getElementById('copyUpiBtn')?.addEventListener('click', () => {
      const upi = document.getElementById('upiIdValue')?.textContent?.trim() || 'muantea45-1@oksbi';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(upi).then(() => {
          showToast('UPI ID copied to clipboard: ' + upi, 'success');
        });
      }
    });

    // Manual Room Join
    const triggerJoin = () => {
      const input = document.getElementById('joinRoomCodeInput');
      const code = input?.value.trim();
      if (code) {
        window.location.href = `?room=${code}#room=${code}`;
      }
    };
    document.getElementById('joinRoomBtn')?.addEventListener('click', triggerJoin);
    document.getElementById('promptRetryPairBtn')?.addEventListener('click', () => {
      if (this.roomId) {
        haptics.tap();
        this.initPeerClient(this.roomId);
      }
    });
    document.getElementById('joinRoomCodeInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerJoin();
      }
    });

    // In-browser Camera Scanner (BarcodeDetector fallback)
    const scanBtn = document.getElementById('startCameraScanBtn');
    const stopBtn = document.getElementById('stopCameraScanBtn');
    const cameraWrapper = document.getElementById('cameraScannerWrapper');
    const video = document.getElementById('scannerVideo');

    if (scanBtn && 'mediaDevices' in navigator) {
      scanBtn.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          video.srcObject = stream;
          await video.play();
          cameraWrapper.style.display = 'block';

          if ('BarcodeDetector' in window) {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const checkFrame = async () => {
              if (video.paused || video.ended) return;
              try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0) {
                  const raw = barcodes[0].rawValue || '';
                  const match = raw.match(/[?&#]room=([a-zA-Z0-9_-]+)/) ||
                                raw.match(/[?&#]r=([a-zA-Z0-9_-]+)/) ||
                                (/^\d{4,8}$/.test(raw.trim()) ? [null, raw.trim()] : null);
                  if (match && match[1]) {
                    stream.getTracks().forEach(t => t.stop());
                    cameraWrapper.style.display = 'none';
                    window.location.href = `?room=${match[1]}#room=${match[1]}`;
                    return;
                  }
                }
              } catch (e) {}
              requestAnimationFrame(checkFrame);
            };
            requestAnimationFrame(checkFrame);
          } else {
            showToast('Point camera at QR code. Supported browsers will auto-scan.', 'info');
          }
        } catch (err) {
          showToast('Camera access denied or unavailable', 'danger');
        }
      });

      stopBtn?.addEventListener('click', () => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(t => t.stop());
        }
        cameraWrapper.style.display = 'none';
      });
    }

    // Language toggle button
    document.getElementById('langToggleBtn')?.addEventListener('click', () => {
      toggleLanguage();
    });

    // Clear any legacy confirmation setting so auto-accept is always active
    localStorage.removeItem('inthawnna_ask_confirm');

    // Direct Camera File Input
    document.getElementById('cameraFileInput')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        haptics.tap();
        this.addFilesToStage(Array.from(e.target.files));
      }
    });

    // Received files search, filters, and sort
    const searchInput = document.getElementById('receivedSearchInput');
    const searchClear = document.getElementById('searchClearBtn');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      if (searchClear) searchClear.style.display = this.searchQuery ? 'block' : 'none';
      this.renderReceivedFiles();
    });

    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.searchQuery = '';
      searchClear.style.display = 'none';
      this.renderReceivedFiles();
    });

    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter') || 'all';
        haptics.tap();
        this.renderReceivedFiles();
      });
    });

    document.getElementById('receivedSortSelect')?.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      haptics.tap();
      this.renderReceivedFiles();
    });

    // Batch actions
    const selectAllCb = document.getElementById('selectAllCheckbox');
    selectAllCb?.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.receivedFiles.forEach(f => this.selectedFileIds.add(f.id));
      } else {
        this.selectedFileIds.clear();
      }
      haptics.tap();
      this.renderReceivedFiles();
    });

    document.getElementById('downloadSelectedZipBtn')?.addEventListener('click', () => {
      this.downloadSelectedAsZip();
    });

    document.getElementById('deleteSelectedBtn')?.addEventListener('click', () => {
      this.deleteSelectedFiles();
    });

    // Global Drag & Drop Overlay on Window
    let dragCounter = 0;
    const globalOverlay = document.getElementById('globalDropOverlay');

    window.addEventListener('dragenter', (e) => {
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        dragCounter++;
        if (globalOverlay) {
          globalOverlay.style.display = 'flex';
          globalOverlay.classList.add('active');
        }
      }
    });

    window.addEventListener('dragover', (e) => {
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
      }
    });

    window.addEventListener('dragleave', (e) => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (globalOverlay) {
          globalOverlay.style.display = 'none';
          globalOverlay.classList.remove('active');
        }
      }
    });

    window.addEventListener('drop', (e) => {
      dragCounter = 0;
      if (globalOverlay) {
        globalOverlay.style.display = 'none';
        globalOverlay.classList.remove('active');
      }
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        haptics.tap();
        this.addFilesToStage(Array.from(e.dataTransfer.files));
      }
    });

    // Window Paste Listener (Clipboard Image / Screenshot Pasting)
    window.addEventListener('paste', (e) => {
      const activeEl = document.activeElement;
      const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.clipboardData && e.clipboardData.items) {
        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find(item => item.type && item.type.startsWith('image/'));
        if (imageItem) {
          e.preventDefault();
          const blob = imageItem.getAsFile();
          if (blob) {
            const ext = blob.type.split('/')[1] || 'png';
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            const file = new File([blob], `Screenshot_${stamp}.${ext}`, { type: blob.type });
            this.addFilesToStage([file]);
            haptics.success();
            showToast('Pasted screenshot from clipboard! 📋', 'success');
            return;
          }
        }
      }

      // If text pasted while not in input, beam to clipboard
      if (!isTextInput && e.clipboardData) {
        const text = e.clipboardData.getData('text');
        if (text && text.trim()) {
          e.preventDefault();
          const clipInput = document.getElementById('clipboardInput');
          if (clipInput) clipInput.value = text.trim();
          this.switchTab('clipboardTab');
          showToast('Pasted text into Clipboard sync!', 'info');
        }
      }
    });
  }

  addFilesToStage(files) {
    if (!files || files.length === 0) return;
    this.stagedFiles.push(...files);
    this.renderStagedFiles();
    this.switchTab('transferTab');
    haptics.tap();
    showToast(`Added ${files.length} file${files.length === 1 ? '' : 's'} to queue`, 'info');
  }

  switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });
    haptics.tap();
  }
}

// ==========================================================================
// 5. Bootstrap App on DOM Ready
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  wakeLock.init();
  lightbox.init();

  const app = new InthawnnaP2P();
  window.inthawnna = app;
  app.init();

  // Initialize Language & Daily Transfer Statistics
  setLanguage(currentLang);
  statsManager.render();
});
