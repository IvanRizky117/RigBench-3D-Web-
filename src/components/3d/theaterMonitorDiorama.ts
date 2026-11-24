import * as THREE from 'three';
import { createBrushedMetalTexture } from './studioMotherboardTextures';
import {
  addStudioWorkbench,
  createStudioAccentLight,
  DioramaResourceTracker,
  updateStudioAccentLight,
  type BuiltTheaterDiorama,
} from './theaterDioramaCore';

export type MonitorTerminalMode = 'monitor-os' | 'monitor-eula' | 'monitor-crack';

interface TerminalScreenConfig {
  headerBg: string;
  headerTitle: string;
  accent: string;
  lines: Array<{ text: string; color?: string; bold?: boolean }>;
  progressPct?: number;
  footer: string;
}

function getScreenConfig(mode: MonitorTerminalMode, mechAction: string | undefined): TerminalScreenConfig {
  if (mode === 'monitor-os') {
    if (mechAction === 'os-eula-part') {
      return {
        headerBg: '#0E293D',
        headerTitle: 'WINDOWS SETUP · LISENSI EULA & PARTISI DISK',
        accent: '#10B981',
        lines: [
          { text: '[OK] Persetujuan EULA diterima (F8 / I Accept)', color: '#34D399', bold: true },
          { text: '--------------------------------------------------------', color: '#334155' },
          { text: 'Disk 0 Partition 1 (System) : 120 GB  [ FORMAT: NTFS ]', color: '#7DD3FC', bold: true },
          { text: 'Disk 0 Partition 2 (Data)   : 380 GB  [ FORMAT: NTFS ]', color: '#CBD5E1' },
          { text: 'Buffer Ruang Kosong Drive C : Minimal 20% - 30% (pagefile.sys)', color: '#FCD34D' },
        ],
        progressPct: 48,
        footer: 'TAHAP 2/4 · WAJIB FORMAT NTFS UNTUK DRIVE SISTEM WINDOWS',
      };
    }
    if (mechAction === 'os-copy-key') {
      return {
        headerBg: '#1E1B4B',
        headerTitle: 'INSTALASI WINDOWS · PRODUCT KEY & ZONA WAKTU',
        accent: '#A855F7',
        lines: [
          { text: '[OK] Ekstraksi berkas sistem & Reboot selesai', color: '#34D399' },
          { text: 'Nama Komputer : LAB-STMIK-AKI-01', color: '#E2E8F0' },
          { text: 'Product Key   : XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (25 Digit)', color: '#C084FC', bold: true },
          { text: 'Zona Waktu    : (GMT+07:00) Bangkok, Hanoi, Jakarta', color: '#7DD3FC', bold: true },
          { text: 'Status        : Konfigurasi sistem & jaringan lokal...', color: '#94A3B8' },
        ],
        progressPct: 76,
        footer: 'TAHAP 3/4 · 25 KARAKTER PRODUCT KEY & GMT+07:00',
      };
    }
    if (mechAction === 'os-drivers') {
      return {
        headerBg: '#271A0C',
        headerTitle: 'DEVICE MANAGER · INSTALASI DRIVER PERANGKAT KERAS',
        accent: '#F59E0B',
        lines: [
          { text: '[INSTALLED] Chipset Motherboard (Northbridge & Southbridge)', color: '#34D399', bold: true },
          { text: '[INSTALLED] Display Adapter VGA PCIe x16 (Resolusi Optimal)', color: '#34D399' },
          { text: '[INSTALLED] Ethernet LAN RJ45 Controller', color: '#34D399' },
          { text: '[INSTALLED] High Definition Audio Codec', color: '#34D399' },
          { text: '-> Sistem siap digunakan untuk instalasi aplikasi pendukung.', color: '#FCD34D', bold: true },
        ],
        progressPct: 100,
        footer: 'TAHAP 4/4 · URUTAN LENGKAP BIOS -> PARTISI -> KEY -> DRIVER',
      };
    }
    return {
      headerBg: '#0B245C',
      headerTitle: 'CMOS BIOS SETUP UTILITY · BOOT PRIORITY (DEL / F2)',
      accent: '#38BDF8',
      lines: [
        { text: '1st Boot Device   : [ USB Flashdisk / CD-ROM Installer ]', color: '#FEF08A', bold: true },
        { text: '2nd Boot Device   : [ SATA Harddisk Drive 0 ]', color: '#E2E8F0' },
        { text: '3rd Boot Device   : [ Disabled ]', color: '#94A3B8' },
        { text: '--------------------------------------------------------', color: '#3B82F6' },
        { text: 'F10 : Save & Exit Setup   |   ESC : Cancel', color: '#7DD3FC', bold: true },
      ],
      progressPct: 22,
      footer: 'TAHAP 1/4 · ATUR 1ST BOOT DEVICE LALU TEKAN F10',
    };
  }

  if (mode === 'monitor-eula') {
    if (mechAction === 'eula-telemetry') {
      return {
        headerBg: '#2B1D0A',
        headerTitle: 'AUDIT KLAUSUL EULA #1 & #2 · PRIVASI & TELEMETRI',
        accent: '#F59E0B',
        lines: [
          { text: '[KLAUSUL 01] Pemantauan Aktivitas Koneksi Internet Aktif', color: '#FCD34D', bold: true },
          { text: '[KLAUSUL 02] Pengumpulan Data Pribadi & HWID (Telemetri)', color: '#FCD34D', bold: true },
          { text: '--------------------------------------------------------', color: '#475569' },
          { text: 'Outbound Log : user_profile, hardware_id -> vendor.telemetry', color: '#FB923C' },
          { text: 'Mitigasi     : Pilih Custom Install & matikan telemetri opsional', color: '#34D399' },
        ],
        footer: 'WASPADA KLAUSUL 1 & 2 · EDWARD DESAUTELS',
      };
    }
    if (mechAction === 'eula-firewall') {
      return {
        headerBg: '#2E0D17',
        headerTitle: 'AUDIT KLAUSUL EULA #3 & #4 · RESOURCE & PORT FIREWALL',
        accent: '#F43F5E',
        lines: [
          { text: '[KLAUSUL 03] Pemanfaatan CPU / RAM / Bandwidth Latar Belakang', color: '#FDA4AF', bold: true },
          { text: '[KLAUSUL 04] Permintaan Pembukaan Port Windows Firewall', color: '#FB7185', bold: true },
          { text: '--------------------------------------------------------', color: '#475569' },
          { text: 'WARNING : Port terbuka rawan dimasuki Backdoor & Trojan!', color: '#F43F5E', bold: true },
          { text: 'Prinsip : Jangan asal klik Next tanpa membaca izin jaringan', color: '#CBD5E1' },
        ],
        footer: 'WASPADA KLAUSUL 3 & 4 · CELAH BACKDOOR & TROJAN',
      };
    }
    return {
      headerBg: '#091F3A',
      headerTitle: 'END USER LICENSE AGREEMENT (EULA) · KONTRAK HUKUM',
      accent: '#38BDF8',
      lines: [
        { text: 'HAKIKAT LISENSI KOMERSIAL:', color: '#7DD3FC', bold: true },
        { text: '> Membeli software = HAK IZIN PAKAI (Lisensi)', color: '#F8FAFC', bold: true },
        { text: '> BUKAN kepemilikan atas kode sumber program', color: '#CBD5E1' },
        { text: '--------------------------------------------------------', color: '#334155' },
        { text: '[ I ACCEPT ] / Buka Segel CD  -->  Kontrak Hukum Mengikat!', color: '#34D399', bold: true },
      ],
      footer: 'LISENSI HAK PAKAI != KEPEMILIKAN KODE PROGRAM',
    };
  }

  // monitor-crack
  if (mechAction === 'crack-loader') {
    return {
      headerBg: '#201038',
      headerTitle: 'MEMORI RAM INSPECTOR · INJEKSI LOADER (REAL-TIME)',
      accent: '#A855F7',
      lines: [
        { text: '[DISK] app.exe (File Fisik Asli) : TIDAK DIUBAH (UTUH)', color: '#34D399', bold: true },
        { text: '[RAM ] 0x0040A1F0 : Loader menyuntikkan bypass di memori', color: '#C084FC', bold: true },
        { text: '--------------------------------------------------------', color: '#475569' },
        { text: 'Perbedaan Kritis Ujian:', color: '#F8FAFC' },
        { text: 'PATCH = Timpa file di Disk  |  LOADER = Manipulasi di RAM', color: '#7DD3FC', bold: true },
      ],
      footer: 'LOADER TIDAK MENYENTUH FILE FISIK DI HARDDISK',
    };
  }
  if (mechAction === 'crack-malware') {
    return {
      headerBg: '#320B16',
      headerTitle: 'SECURITY ALERT · PILAR 1 & 2 BAHAYA SOFTWARE BAJAKAN',
      accent: '#F43F5E',
      lines: [
        { text: '[BAHAYA] Antivirus dimatikan saat ekstrak crack/keygen!', color: '#FDA4AF', bold: true },
        { text: '[INFECT] Trojan Backdoor + Keylogger pencuri sandi aktif', color: '#FB7185', bold: true },
        { text: '[LOCKED] Ransomware mengenkripsi dokumen penting (.locked)', color: '#F43F5E', bold: true },
        { text: '[CRASH ] Tanpa Security Update resmi -> sistem tidak stabil', color: '#FCD34D' },
      ],
      footer: 'PILAR 1 (MALWARE) & PILAR 2 (TANPA SECURITY UPDATE)',
    };
  }
  if (mechAction === 'crack-legal') {
    return {
      headerBg: '#091E36',
      headerTitle: 'COMPLIANCE · PILAR 3 (UU HAK CIPTA) & PILAR 4 (ETIKA)',
      accent: '#38BDF8',
      lines: [
        { text: '[PILAR 3] Pelanggaran UU Hak Cipta: Sanksi Pidana & Perdata', color: '#7DD3FC', bold: true },
        { text: '[PILAR 4] Pelanggaran Etika Profesi & Merusak Inovasi IT', color: '#38BDF8', bold: true },
        { text: '--------------------------------------------------------', color: '#334155' },
        { text: 'Alternatif Legal : Lisensi Resmi / Open-Source (Linux, LibreOffice)', color: '#34D399' },
        { text: '4 Pilar Wajib    : Keamanan, Stabilitas, Hukum, dan Etika', color: '#F8FAFC', bold: true },
      ],
      footer: 'GUNAKAN PERANGKAT LUNAK LEGAL & OPEN-SOURCE',
    };
  }
  return {
    headerBg: '#291808',
    headerTitle: 'REVERSE ENGINEERING · PATCH (.EXE/.DLL) & KEYGEN',
    accent: '#F59E0B',
    lines: [
      { text: '[PATCH ] Modifikasi permanen byte file .exe / .dll di Disk', color: '#FCD34D', bold: true },
      { text: '         0x00412B : 75 1A (JNZ)  -->  74 1A (JZ) / 90 90 (NOP)', color: '#FB923C', bold: true },
      { text: '[KEYGEN] Replikasi algoritma pembuat nomor seri palsu', color: '#F8FAFC' },
      { text: '--------------------------------------------------------', color: '#475569' },
      { text: 'Target  : Membypass pengecekan lisensi & aktivasi resmi', color: '#CBD5E1' },
    ],
    footer: 'PATCH UBAH FILE FISIK DI DISK · KEYGEN DUPLIKASI SERIAL',
  };
}

function renderTerminalCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: TerminalScreenConfig,
  cursorOn: boolean
) {
  // Deep OLED black monitor screen
  ctx.fillStyle = '#050912';
  ctx.fillRect(0, 0, w, h);

  // Subtle scanline texture
  ctx.fillStyle = 'rgba(255,255,255,0.018)';
  for (let y = 0; y < h; y += 6) {
    ctx.fillRect(0, y, w, 1);
  }

  // Top terminal title bar
  ctx.fillStyle = cfg.headerBg;
  ctx.fillRect(0, 0, w, 66);
  ctx.fillStyle = cfg.accent;
  ctx.fillRect(0, 64, w, 3);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText(cfg.headerTitle, 28, 34);

  // Main terminal lines
  let y = 122;
  for (const line of cfg.lines) {
    ctx.fillStyle = line.color ?? '#E2E8F0';
    ctx.font = `${line.bold ? 'bold ' : ''}24px "JetBrains Mono", monospace`;
    ctx.fillText(line.text, 30, y);
    y += 56;
  }

  // Optional crisp progress bar
  if (typeof cfg.progressPct === 'number') {
    const bx = 30;
    const by = h - 108;
    const bw = w - 60;
    const bh = 22;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = cfg.accent;
    ctx.fillRect(bx, by, (bw * cfg.progressPct) / 100, bh);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
  }

  // Bottom status bar + blinking terminal cursor
  ctx.fillStyle = '#0A1220';
  ctx.fillRect(0, h - 54, w, 54);
  ctx.fillStyle = cfg.accent;
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText(cfg.footer + (cursorOn ? ' _' : ''), 28, h - 26);
}

/**
 * Builds the 3D Widescreen Studio Monitor & Terminal Workstation diorama on dark keynote floor
 * for Cluster 5 (OS Install) and Cluster 7 (EULA & Cracking).
 */
export function buildMonitorTerminalDiorama(
  mode: MonitorTerminalMode,
  maxAniso: number,
  textureScale: number
): BuiltTheaterDiorama {
  const tracker = new DioramaResourceTracker(textureScale);
  const rootGroup = new THREE.Group();
  addStudioWorkbench(tracker, rootGroup, maxAniso, textureScale);

  const accentLight = createStudioAccentLight(rootGroup);
  const brushedTex = tracker.tex(createBrushedMetalTexture(maxAniso));

  const chassisMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x131822, roughness: 0.45, metalness: 0.45 })
  );
  const aluminumMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xaab4c2,
      map: brushedTex,
      roughness: 0.28,
      metalness: 0.9,
    })
  );
  const keycapMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0x1c222d, roughness: 0.52, metalness: 0.15 })
  );

  // ── 1. WIDESCREEN 3D STUDIO MONITOR ──
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(-0.55, 0, -0.35);

  // Weighted brushed-aluminum stand base & vertical neck
  const basePlate = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.1, 0.08, 1.35)), aluminumMat);
  basePlate.position.set(0, 0.04, 0.15);
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;
  monitorGroup.add(basePlate);

  const neck = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.42, 1.55, 0.14)), aluminumMat);
  neck.position.set(0, 0.82, -0.18);
  neck.rotation.x = -0.08;
  neck.castShadow = true;
  monitorGroup.add(neck);

  // Ultra-slim matte-black bezel housing
  const bezel = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(5.55, 3.22, 0.16)), chassisMat);
  bezel.position.set(0, 2.28, 0);
  bezel.castShadow = true;
  monitorGroup.add(bezel);

  // Dynamic live CanvasTexture display screen
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 576;
  const screenCtx = screenCanvas.getContext('2d');
  const screenTex = tracker.tex(new THREE.CanvasTexture(screenCanvas), true);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = maxAniso;

  const screenMesh = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(5.26, 2.94)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        map: screenTex,
        emissiveMap: screenTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.82,
        roughness: 0.18,
        metalness: 0.05,
      })
    )
  );
  screenMesh.position.set(0, 2.28, 0.086);
  monitorGroup.add(screenMesh);
  rootGroup.add(monitorGroup);

  // ── 2. COMPACT MATTE-BLACK PC TOWER ON RIGHT (with Status LED & USB/Power Port) ──
  const towerGroup = new THREE.Group();
  towerGroup.position.set(3.25, 1.38, -0.25);

  const towerBody = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(1.38, 2.74, 2.45)), chassisMat);
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;
  towerGroup.add(towerBody);

  const towerFrontTrim = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(1.24, 2.58, 0.05)),
    aluminumMat
  );
  towerFrontTrim.position.set(0, 0, 1.22);
  towerGroup.add(towerFrontTrim);

  // Front LED bar reflecting active domain status
  const statusLedMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );
  const statusLed = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.92, 0.05, 0.06)), statusLedMat);
  statusLed.position.set(0, 1.05, 1.24);
  towerGroup.add(statusLed);

  // Recessed DVD/USB front slot + glowing USB installer thumb drive (for OS mode)
  const frontSlot = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.84, 0.09, 0.06)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.9 }))
  );
  frontSlot.position.set(0, 0.65, 1.235);
  towerGroup.add(frontSlot);

  const usbDrive = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.16, 0.09, 0.36)),
    tracker.mat(
      new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.4,
        roughness: 0.35,
      })
    )
  );
  usbDrive.position.set(-0.28, 0.25, 1.38);
  usbDrive.visible = mode === 'monitor-os';
  towerGroup.add(usbDrive);
  rootGroup.add(towerGroup);

  // ── 3. LOW-PROFILE MECHANICAL KEYBOARD ON DESK FRONT ──
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.55, 0.07, 1.75);
  const kbDeck = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(3.35, 0.11, 1.15)), chassisMat);
  kbDeck.castShadow = true;
  kbGroup.add(kbDeck);

  // Instanced crisp mechanical keycaps
  const keyGeo = tracker.geo(new THREE.BoxGeometry(0.18, 0.065, 0.18));
  const keyCols = 14;
  const keyRows = 4;
  const keyInst = new THREE.InstancedMesh(keyGeo, keycapMat, keyCols * keyRows);
  const dummy = new THREE.Object3D();
  let kIdx = 0;
  for (let r = 0; r < keyRows; r++) {
    for (let c = 0; c < keyCols; c++) {
      dummy.position.set(-1.42 + c * 0.218, 0.08, -0.34 + r * 0.22);
      dummy.updateMatrix();
      keyInst.setMatrixAt(kIdx++, dummy.matrix);
    }
  }
  keyInst.instanceMatrix.needsUpdate = true;
  kbGroup.add(keyInst);
  rootGroup.add(kbGroup);

  // Render initial screen immediately
  let lastActionKey = '';
  let lastCursorState = true;
  if (screenCtx) {
    renderTerminalCanvas(screenCtx, 1024, 576, getScreenConfig(mode, undefined), true);
    screenTex.needsUpdate = true;
  }

  const ledColor = new THREE.Color();

  return {
    rootGroup,
    update(elapsed, dt, mechAction, anchor, domainColor, isPlaying) {
      updateStudioAccentLight(accentLight, elapsed, dt, anchor, domainColor);

      const cursorHz = tracker.textureScale < 1 ? 1 : 2;
      const cursorOn = isPlaying ? Math.floor(elapsed * cursorHz) % 2 === 0 : true;
      const actionKey = `${mechAction ?? 'default'}`;
      if (screenCtx && (actionKey !== lastActionKey || cursorOn !== lastCursorState)) {
        lastActionKey = actionKey;
        lastCursorState = cursorOn;
        renderTerminalCanvas(screenCtx, 1024, 576, getScreenConfig(mode, mechAction), cursorOn);
        screenTex.needsUpdate = true;
      }

      ledColor.set(domainColor);
      statusLedMat.color.lerp(ledColor, Math.min(1, dt * 8));
      statusLedMat.emissive.lerp(ledColor, Math.min(1, dt * 8));
      statusLedMat.emissiveIntensity = 1.1 + Math.sin(elapsed * 3.2) * 0.35;
    },
    dispose: () => tracker.disposeAll(),
  };
}
