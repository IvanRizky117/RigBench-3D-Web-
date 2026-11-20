import { useEffect, useMemo, useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  Desktop,
  HardDrives,
  Key,
  Monitor,
  ShieldWarning,
  TerminalWindow,
  Warning,
} from '@phosphor-icons/react';
import type { DiskPartition, ToastVariant } from '../../types/rigbench';
import { MAX_SHORT_TEXT_CHARS, sanitizeUserText } from '../../utils/inputSanitizer';

interface OsDiskTabProps {
  osSimCompleted: boolean;
  diskSimCompleted: boolean;
  onOsSimComplete: () => void;
  onDiskSimComplete: () => void;
  onNotify: (title: string, description: string, variant?: ToastVariant) => void;
}

type SimMode = 'os-install' | 'disk-mgmt';

const INITIAL_PARTITIONS: DiskPartition[] = [
  {
    id: 'efi',
    label: 'EFI System Partition',
    sizeGb: 0.1,
    fileSystem: 'FAT32',
    status: 'Healthy (EFI System Partition)',
    isProtected: true,
    colorType: 'efi',
  },
  {
    id: 'c-drive',
    label: 'Local Disk',
    driveLetter: 'C:',
    sizeGb: 499.3,
    fileSystem: 'NTFS',
    status: 'Healthy (Boot, Page File, Primary)',
    colorType: 'primary',
  },
  {
    id: 'recovery',
    label: 'Recovery Partition',
    sizeGb: 0.6,
    fileSystem: 'NTFS',
    status: 'Healthy (Recovery Partition)',
    isProtected: true,
    colorType: 'recovery',
  },
];

const SHRINK_PRESETS = [
  { gb: 20, mbLabel: '20.480 MB', note: 'Aman untuk partisi dokumen praktikum ringan' },
  { gb: 50, mbLabel: '51.200 MB', note: 'Ideal untuk data kuliah & ISO sistem operasi' },
  { gb: 100, mbLabel: '102.400 MB', note: 'Kapasitas lega sambil menjaga ruang bebas C: > 75%' },
];

const DRIVER_ITEMS = [
  { id: 'chipset', label: 'Chipset Motherboard Driver (INF / Bus Controller)' },
  { id: 'vga', label: 'VGA / Display Adapter Driver (Resolusi & Akselerasi Grafis)' },
  { id: 'lan', label: 'LAN / Ethernet Network Controller (RJ-45)' },
  { id: 'audio', label: 'High Definition Audio Codec Driver' },
];

const APP_ITEMS = [
  { id: 'office', label: 'Aplikasi Perkantoran (Office Suite Resmi)' },
  { id: 'pdf', label: 'PDF Reader & Arsip Kompresi' },
  { id: 'av', label: 'Antivirus & Windows Security Update' },
];

function formatProductKeyInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 25);
  const groups: string[] = [];
  for (let i = 0; i < cleaned.length; i += 5) {
    groups.push(cleaned.slice(i, i + 5));
  }
  return groups.join('-');
}

export function OsDiskTab({
  osSimCompleted,
  diskSimCompleted,
  onOsSimComplete,
  onDiskSimComplete,
  onNotify,
}: OsDiskTabProps) {
  const [simMode, setSimMode] = useState<SimMode>('os-install');

  // === SIMULASI 1: OS INSTALL STATE ===
  const [osStep, setOsStep] = useState<number>(1);
  const [firstBootDevice, setFirstBootDevice] = useState<'HDD' | 'CDROM_USB'>('HDD');
  const [partitionCreated, setPartitionCreated] = useState(false);
  const [selectedFs, setSelectedFs] = useState<'NTFS_QUICK' | 'FAT32' | null>(null);
  const [copyProgress, setCopyProgress] = useState(0);
  const [ownerName, setOwnerName] = useState('Mahasiswa STMIK AKI');
  const [orgName, setOrgName] = useState('Lab Hardware-Software');
  const [productKey, setProductKey] = useState('');
  const [timeZone, setTimeZone] = useState('(GMT+00:00) Greenwich Mean Time');
  const [installedDrivers, setInstalledDrivers] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  // Keyboard shortcuts for authentic BIOS / Boot / EULA steps
  useEffect(() => {
    if (simMode !== 'os-install') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (osStep === 1 && (e.key === 'Delete' || e.key === 'F2')) {
        e.preventDefault();
        setOsStep(2);
      } else if (osStep === 2 && e.key === 'F10') {
        e.preventDefault();
        if (firstBootDevice === 'CDROM_USB') {
          setOsStep(3);
        } else {
          onNotify(
            'Urutan Boot Belum Diubah',
            'Ubah 1st Boot Device ke CDROM / USB Flashdisk terlebih dahulu sebelum menekan F10.',
            'warning'
          );
        }
      } else if (osStep === 3) {
        e.preventDefault();
        setOsStep(4);
      } else if (osStep === 4 && e.key === 'F8') {
        e.preventDefault();
        setOsStep(5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [simMode, osStep, firstBootDevice, onNotify]);

  // Animated file copy & reboot stage (Step 6)
  useEffect(() => {
    if (simMode !== 'os-install' || osStep !== 6) return;
    setCopyProgress(0);
    const id = window.setInterval(() => {
      setCopyProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return prev + 10;
      });
    }, 260);
    return () => window.clearInterval(id);
  }, [simMode, osStep]);

  const resetOsSimulation = () => {
    setOsStep(1);
    setFirstBootDevice('HDD');
    setPartitionCreated(false);
    setSelectedFs(null);
    setCopyProgress(0);
    setProductKey('');
    setTimeZone('(GMT+00:00) Greenwich Mean Time');
    setInstalledDrivers([]);
    setInstalledApps([]);
  };

  const handleSaveBiosF10 = () => {
    if (firstBootDevice !== 'CDROM_USB') {
      onNotify(
        '1st Boot Device Masih Hard Disk',
        'Pindahkan 1st Boot Device ke CDROM / USB Flashdisk agar PC dapat membaca media installer OS.',
        'warning'
      );
      return;
    }
    setOsStep(3);
  };

  const handleFormatNext = () => {
    if (!partitionCreated) {
      onNotify('Partisi Belum Dibuat', 'Tekan "Buat Partisi C:" pada ruang Unpartitioned terlebih dahulu.', 'warning');
      return;
    }
    if (selectedFs === 'FAT32') {
      onNotify(
        'FAT32 Tidak Direkomendasikan untuk OS',
        'FAT32 membatasi ukuran 1 file maksimal 4 GB dan tidak memiliki keamanan ACL/journaling. Pilih NTFS (Quick).',
        'warning'
      );
      return;
    }
    if (selectedFs !== 'NTFS_QUICK') {
      onNotify('Pilih File System', 'Pilih "Format using NTFS file system (Quick)" untuk melanjutkan.', 'warning');
      return;
    }
    setOsStep(6);
  };

  const handleValidatePersonalize = () => {
    const cleanKey = productKey.replace(/-/g, '');
    if (ownerName.trim().length < 2) {
      onNotify('Nama Belum Diisi', 'Masukkan nama pengguna untuk registrasi sistem.', 'warning');
      return;
    }
    if (cleanKey.length !== 25) {
      onNotify(
        'Product Key Belum Lengkap',
        'Product Key Windows wajib tepat 25 karakter alfanumerik (5 blok x 5 karakter).',
        'warning'
      );
      return;
    }
    if (!timeZone.includes('GMT+07:00')) {
      onNotify(
        'Zona Waktu Belum Sesuai WIB',
        'Sesuai modul praktikum Indonesia Barat, pilih zona waktu (GMT+07:00) Bangkok, Hanoi, Jakarta.',
        'warning'
      );
      return;
    }
    setOsStep(8);
  };

  const toggleDriver = (id: string) => {
    setInstalledDrivers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleApp = (id: string) => {
    setInstalledApps((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinishOsSim = () => {
    if (installedDrivers.length < DRIVER_ITEMS.length) {
      onNotify(
        'Driver Perangkat Keras Belum Lengkap',
        'Instal keempat driver wajib (Chipset, VGA, LAN, Audio) sebelum menyelesaikan praktikum.',
        'warning'
      );
      return;
    }
    onOsSimComplete();
    setOsStep(9);
    onNotify(
      'Simulasi Instalasi OS Selesai',
      'Seluruh alur BIOS, EULA F8, NTFS Quick, Product Key 25 karakter, dan Driver selesai divalidasi.',
      'success'
    );
  };

  // === SIMULASI 2: DISK MANAGEMENT (diskmgmt.msc) STATE ===
  const [partitions, setPartitions] = useState<DiskPartition[]>(INITIAL_PARTITIONS);
  const [selectedPartId, setSelectedPartId] = useState<string>('c-drive');
  const [shrinkGb, setShrinkGb] = useState<number>(50);
  const [wizardLetter, setWizardLetter] = useState<'D:' | 'E:' | 'F:'>('D:');
  const [wizardLabel, setWizardLabel] = useState<string>('Data Praktikum');
  const [wizardFs, setWizardFs] = useState<'NTFS' | 'FAT32'>('NTFS');
  const [wizardQuickFormat, setWizardQuickFormat] = useState<boolean>(true);
  const [safetyAlert, setSafetyAlert] = useState<string | null>(null);

  const selectedPartition = useMemo(
    () => partitions.find((p) => p.id === selectedPartId) ?? partitions[1],
    [partitions, selectedPartId]
  );

  const usedLetters = useMemo(
    () => partitions.map((p) => p.driveLetter).filter(Boolean) as string[],
    [partitions]
  );

  const handleSelectPartition = (part: DiskPartition) => {
    setSelectedPartId(part.id);
    if (part.colorType === 'efi') {
      const msg =
        'PERINGATAN KRITIS: Jangan pernah menghapus EFI System Partition (100 MB)! Partisi ini menyimpan berkas bootloader UEFI. Menghapusnya membuat Windows gagal booting total.';
      setSafetyAlert(msg);
      onNotify('Partisi Sistem Terproteksi (EFI)', msg, 'warning');
    } else if (part.colorType === 'recovery') {
      const msg =
        'PERINGATAN: Recovery Partition (600 MB) menyimpan Windows Recovery Environment (WinRE) untuk perbaikan darurat & Reset PC. Jangan dihapus.';
      setSafetyAlert(msg);
      onNotify('Partisi Recovery Terproteksi', msg, 'warning');
    } else {
      setSafetyAlert(null);
    }
  };

  const handleApplyShrink = () => {
    const cPart = partitions.find((p) => p.id === 'c-drive');
    if (!cPart) return;
    if (cPart.sizeGb - shrinkGb < 120) {
      onNotify(
        'Ruang Bebas C: Terlalu Kecil',
        'Sisakan minimal 20–30% ruang kosong pada partisi sistem C: agar performa Windows dan page file tetap aman.',
        'warning'
      );
      return;
    }

    const unallocatedId = `unalloc-${Date.now()}`;
    const updated: DiskPartition[] = [];
    for (const part of partitions) {
      if (part.id === 'c-drive') {
        updated.push({ ...part, sizeGb: Number((part.sizeGb - shrinkGb).toFixed(1)) });
        updated.push({
          id: unallocatedId,
          label: 'Unallocated',
          sizeGb: shrinkGb,
          fileSystem: 'Unallocated',
          status: 'Unallocated',
          colorType: 'unallocated',
        });
      } else {
        updated.push(part);
      }
    }

    setPartitions(updated);
    setSelectedPartId(unallocatedId);
    onNotify(
      `Shrink Volume Berhasil (-${shrinkGb} GB)`,
      'Blok hitam Unallocated Space terbentuk. Klik blok tersebut untuk menjalankan New Simple Volume Wizard.',
      'success'
    );
  };

  const handleCreateSimpleVolume = () => {
    if (!selectedPartition || selectedPartition.colorType !== 'unallocated') return;
    if (usedLetters.includes(wizardLetter)) {
      onNotify(
        `Huruf Drive ${wizardLetter} Sudah Terpakai`,
        'Pilih huruf drive lain yang masih kosong (D:, E:, atau F:).',
        'warning'
      );
      return;
    }
    if (wizardFs === 'FAT32') {
      onNotify(
        'Gunakan NTFS untuk Partisi Internal',
        'FAT32 tidak mendukung file > 4 GB dan tidak ideal untuk partisi hard disk/SSD internal. Ubah ke NTFS.',
        'warning'
      );
      return;
    }

    const newId = `part-${wizardLetter.toLowerCase().replace(':', '')}-${Date.now()}`;
    setPartitions((prev) =>
      prev.map((part) =>
        part.id === selectedPartition.id
          ? {
              id: newId,
              label: wizardLabel.trim() || 'New Volume',
              driveLetter: wizardLetter,
              sizeGb: part.sizeGb,
              fileSystem: 'NTFS',
              status: 'Healthy (Primary Partition)',
              colorType: 'primary',
            }
          : part
      )
    );
    setSelectedPartId(newId);
    onDiskSimComplete();
    onNotify(
      `Partisi ${wizardLabel.trim() || 'New Volume'} (${wizardLetter}) Aktif`,
      `Format NTFS${wizardQuickFormat ? ' (Quick)' : ''} selesai. Status berubah menjadi Healthy (Primary Partition).`,
      'success'
    );
  };

  const handleResetDisk = () => {
    setPartitions(INITIAL_PARTITIONS);
    setSelectedPartId('c-drive');
    setSafetyAlert(null);
    onNotify('Disk 0 Direset', 'Tata letak partisi GPT kembali ke kondisi awal pabrik.', 'info');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header + Segmented Switcher */}
      <div className="workbench-card rounded-xl p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
            <span className="font-mono font-semibold text-[#06B6D4]">
              SIMULASI SISTEM OPERASI &amp; PARTISI
            </span>
            <span>·</span>
            <span className={osSimCompleted ? 'text-[#10B981]' : 'text-[#9CA3AF]'}>
              Instalasi OS: {osSimCompleted ? 'Selesai' : 'Belum'}
            </span>
            <span>·</span>
            <span className={diskSimCompleted ? 'text-[#10B981]' : 'text-[#9CA3AF]'}>
              Disk Management: {diskSimCompleted ? 'Selesai' : 'Belum'}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#F3F4F6] sm:text-2xl">
            Praktikum BIOS, Instalasi Windows &amp; Manajemen Partisi GPT
          </h1>
        </div>

        <div className="inline-flex rounded-lg border border-white/10 bg-[#0B0E14] p-1 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setSimMode('os-install')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
              simMode === 'os-install'
                ? 'bg-[#06B6D4] text-[#0B0E14]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <Desktop size={15} weight={simMode === 'os-install' ? 'fill' : 'regular'} />
            Simulasi 1: Instalasi OS
          </button>
          <button
            type="button"
            onClick={() => setSimMode('disk-mgmt')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
              simMode === 'disk-mgmt'
                ? 'bg-[#06B6D4] text-[#0B0E14]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <HardDrives size={15} weight={simMode === 'disk-mgmt' ? 'fill' : 'regular'} />
            Simulasi 2: diskmgmt.msc
          </button>
        </div>
      </div>

      {/* === SIMULASI 1: INSTALASI OS WINDOWS === */}
      {simMode === 'os-install' ? (
        <div className="space-y-4">
          {/* Step Stepper Bar */}
          <div className="workbench-card rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Alur Terpadu Modul STMIK AKI — Tahap {Math.min(osStep, 8)} / 8
              </span>
              <button
                type="button"
                onClick={resetOsSimulation}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#9CA3AF] hover:text-[#06B6D4]"
              >
                <ArrowCounterClockwise size={13} />
                Ulangi dari POST
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
              {[
                '1. POST',
                '2. BIOS Boot',
                '3. Boot CD',
                '4. EULA F8',
                '5. NTFS',
                '6. Copy OS',
                '7. Key & WIB',
                '8. Drivers',
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const done = osStep > stepNum;
                const active = osStep === stepNum;
                return (
                  <div
                    key={label}
                    className={`rounded-md border px-2 py-1.5 text-center font-mono text-[11px] font-medium ${
                      done
                        ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                        : active
                          ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#F3F4F6]'
                          : 'border-white/10 bg-[#0B0E14] text-[#6B7280]'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monitor / Terminal Frame */}
          <div className="overflow-hidden rounded-xl border border-white/15 bg-[#090D16] shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#141923] px-4 py-2.5 text-xs text-[#9CA3AF]">
              <span className="inline-flex items-center gap-2 font-mono font-semibold text-[#F3F4F6]">
                <TerminalWindow size={15} className="text-[#06B6D4]" />
                RigBench Virtual Display — Mode Praktikum OS
              </span>
              <span className="font-mono text-[11px] text-[#6B7280]">
                Keyboard aktif: Del / F2 / F8 / F10
              </span>
            </div>

            <div className="min-h-[420px] p-6 sm:p-8">
              {/* STEP 1: POST SCREEN */}
              {osStep === 1 && (
                <div className="font-mono text-xs sm:text-sm space-y-4 text-[#D1D5DB]">
                  <p className="text-[#06B6D4] font-bold">
                    AMIBIOS (C) STMIK AKI Practicum Lab — POST Verification
                  </p>
                  <div className="space-y-1 text-[#9CA3AF]">
                    <p>CPU : Intel Core i5 Processor @ 3.20 GHz [OK]</p>
                    <p>Memory Test : 8192 MB DDR4 Dual-Channel [OK]</p>
                    <p>SATA Port 0 : SSD 500 GB [Detected]</p>
                    <p>Optical / USB : Windows Setup Media [Ready]</p>
                  </div>
                  <div className="rounded-lg border border-[#06B6D4]/30 bg-[#06B6D4]/10 p-4 text-[#F3F4F6]">
                    <p className="font-semibold">
                      Press <span className="text-[#06B6D4]">DEL</span> or{' '}
                      <span className="text-[#06B6D4]">F2</span> to enter BIOS Setup Utility...
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setOsStep(2)}
                        className="rounded-lg bg-[#06B6D4] px-4 py-2 font-sans text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                      >
                        Tekan DEL (Masuk BIOS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOsStep(2)}
                        className="rounded-lg border border-white/15 bg-[#1B2230] px-4 py-2 font-sans text-xs font-semibold text-[#F3F4F6] hover:border-[#06B6D4]"
                      >
                        Tekan F2 (Masuk BIOS)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: BIOS BOOT PRIORITY */}
              {osStep === 2 && (
                <div className="space-y-5 font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#06B6D4]/30 pb-3">
                    <span className="text-sm font-bold text-[#06B6D4]">
                      CMOS SETUP UTILITY — BOOT PRIORITY MENU
                    </span>
                    <span className="text-xs text-[#9CA3AF]">F10: Save &amp; Exit</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-7 space-y-3 rounded-lg border border-white/10 bg-[#141923] p-4 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#9CA3AF]">1st Boot Device</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFirstBootDevice('HDD')}
                            className={`rounded px-2.5 py-1 text-xs font-semibold ${
                              firstBootDevice === 'HDD'
                                ? 'bg-[#F59E0B] text-[#0B0E14]'
                                : 'bg-[#0B0E14] text-[#9CA3AF]'
                            }`}
                          >
                            Hard Disk Drive
                          </button>
                          <button
                            type="button"
                            onClick={() => setFirstBootDevice('CDROM_USB')}
                            className={`rounded px-2.5 py-1 text-xs font-semibold ${
                              firstBootDevice === 'CDROM_USB'
                                ? 'bg-[#10B981] text-[#0B0E14]'
                                : 'bg-[#0B0E14] text-[#9CA3AF]'
                            }`}
                          >
                            CDROM / USB Flashdisk
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                        <span className="text-[#9CA3AF]">2nd Boot Device</span>
                        <span className="text-[#E5E7EB]">
                          {firstBootDevice === 'CDROM_USB'
                            ? 'Hard Disk Drive (SSD 500 GB)'
                            : 'CDROM / USB Flashdisk'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                        <span className="text-[#9CA3AF]">SATA Mode</span>
                        <span className="text-[#E5E7EB]">AHCI</span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 rounded-lg border border-white/10 bg-[#141923] p-4 font-sans text-xs text-[#D1D5DB] space-y-2">
                      <p className="font-semibold text-[#06B6D4]">Instruksi Praktikum:</p>
                      <p>
                        Ubah <strong>1st Boot Device</strong> dari Hard Disk ke{' '}
                        <strong>CDROM / USB Flashdisk</strong> agar BIOS membaca media instalasi
                        Windows saat menyala ulang, lalu simpan dengan <strong>F10</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveBiosF10}
                      className="rounded-lg bg-[#06B6D4] px-5 py-2.5 font-sans text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                    >
                      Save &amp; Exit Setup (F10)
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PRESS ANY KEY */}
              {osStep === 3 && (
                <div className="flex min-h-[320px] flex-col justify-center font-mono space-y-5">
                  <p className="text-sm text-[#D1D5DB]">Booting from CDROM / USB Installer...</p>
                  <p className="text-base font-bold text-[#F3F4F6]">
                    Press any key to boot from CD or DVD . . . . .
                  </p>
                  <p className="font-sans text-xs text-[#9CA3AF] max-w-lg">
                    Jendela ini hanya muncul sekitar 5 detik. Jika terlewat, PC akan langsung
                    membaca Hard Disk. Tekan sembarang tombol keyboard atau klik tombol di bawah.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setOsStep(4)}
                      className="rounded-lg bg-[#06B6D4] px-5 py-2.5 font-sans text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                    >
                      Tekan Sembarang Tombol (Boot Installer)
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: WINDOWS LICENSING AGREEMENT (EULA F8) */}
              {osStep === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <p className="font-mono text-xs text-[#06B6D4]">WINDOWS LICENSING AGREEMENT</p>
                    <h2 className="mt-0.5 text-base font-bold text-[#F3F4F6]">
                      End-User License Agreement (EULA) — Persetujuan Hukum Pengguna
                    </h2>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-lg border border-white/10 bg-[#141923] p-4 text-xs leading-relaxed text-[#D1D5DB] space-y-2.5">
                    <p>
                      <strong>1. Hak Pakai Terbatas (License vs Ownership):</strong> Dengan
                      melanjutkan instalasi, pengguna memperoleh lisensi hak pakai perangkat lunak
                      (bukan kepemilikan kode sumber) sesuai jumlah perangkat yang diizinkan.
                    </p>
                    <p>
                      <strong>2. Larangan Reverse Engineering &amp; Crack:</strong> Pengguna
                      dilarang melakukan dekompilasi, modifikasi berkas biner (patching), atau
                      menggunakan aktivator/crack ilegal yang melanggar UU Hak Cipta.
                    </p>
                    <p>
                      <strong>3. Privasi &amp; Telemetri Diagnostik:</strong> Sistem dapat
                      mengumpulkan data diagnostik dasar untuk pembaruan keamanan resmi.
                    </p>
                    <p>
                      <strong>4. Batasan Tanggung Jawab (Limitation of Liability):</strong>{' '}
                      Pengguna bertanggung jawab penuh atas pencadangan (backup) data pribadi
                      sebelum memformat partisi.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onNotify(
                          'Instalasi Dibatalkan Sementara',
                          'Menolak EULA (ESC) menghentikan proses instalasi. Klik F8 = I Agree untuk melanjutkan praktikum.',
                          'info'
                        )
                      }
                      className="rounded-lg border border-white/15 bg-[#1B2230] px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6]"
                    >
                      ESC = I Do Not Agree
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsStep(5)}
                      className="rounded-lg bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                    >
                      F8 = I Agree (Setujui EULA)
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: PARTITION & FORMAT NTFS QUICK */}
              {osStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <p className="font-mono text-xs text-[#06B6D4]">DISK PARTITION &amp; FORMAT</p>
                    <h2 className="mt-0.5 text-base font-bold text-[#F3F4F6]">
                      Buat Partisi Sistem C: dan Pilih Sistem Berkas (File System)
                    </h2>
                  </div>

                  {/* Disk table */}
                  <div className="rounded-lg border border-white/10 bg-[#141923] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <span className="text-[#9CA3AF]">Disk 0 (500 GB SSD — Target OS)</span>
                      {!partitionCreated ? (
                        <button
                          type="button"
                          onClick={() => setPartitionCreated(true)}
                          className="rounded-md bg-[#06B6D4] px-3 py-1.5 font-sans text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE]"
                        >
                          Buat Partisi C: (Tekan C)
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#10B981]">
                          <CheckCircle size={14} weight="fill" />
                          Partisi C: Siap Diformat
                        </span>
                      )}
                    </div>

                    <div className="rounded-md border border-white/10 bg-[#0B0E14] px-3.5 py-2.5 font-mono text-xs text-[#E5E7EB]">
                      {!partitionCreated
                        ? 'Unpartitioned space — 512.000 MB (Belum memiliki drive letter)'
                        : 'C: Partition1 [New (Raw)] — 512.000 MB (Siap Instalasi Windows)'}
                    </div>
                  </div>

                  {/* File system options */}
                  {partitionCreated && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-[#D1D5DB]">
                        Pilih Metode Format Partisi C:
                      </p>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setSelectedFs('NTFS_QUICK')}
                          className={`rounded-lg border p-3.5 text-left transition-colors ${
                            selectedFs === 'NTFS_QUICK'
                              ? 'border-[#10B981] bg-[#10B981]/15'
                              : 'border-white/10 bg-[#141923] hover:border-white/25'
                          }`}
                        >
                          <p className="text-xs font-bold text-[#F3F4F6]">
                            Format using NTFS file system (Quick)
                          </p>
                          <p className="mt-1 text-[11px] text-[#9CA3AF]">
                            Mendukung file &gt; 4 GB, keamanan ACL, enkripsi EFS, dan journaling.
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedFs('FAT32')}
                          className={`rounded-lg border p-3.5 text-left transition-colors ${
                            selectedFs === 'FAT32'
                              ? 'border-[#F59E0B] bg-[#F59E0B]/15'
                              : 'border-white/10 bg-[#141923] hover:border-white/25'
                          }`}
                        >
                          <p className="text-xs font-bold text-[#F3F4F6]">
                            Format using FAT32 file system (Quick)
                          </p>
                          <p className="mt-1 text-[11px] text-[#9CA3AF]">
                            Format lama; cocok untuk flashdisk kecil, batas maksimal 1 file 4 GB.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFormatNext}
                      className="rounded-lg bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                    >
                      Format &amp; Salin Berkas OS
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: COPYING FILES & AUTO REBOOT */}
              {osStep === 6 && (
                <div className="flex min-h-[320px] flex-col justify-center space-y-5 max-w-xl">
                  <p className="font-mono text-xs text-[#06B6D4]">
                    SETUP IS COPYING FILES &amp; PREPARING FIRST REBOOT
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs text-[#E5E7EB] tabular-nums">
                      <span>
                        {copyProgress < 100
                          ? 'Menyalin berkas inti kernel & sistem NTFS...'
                          : 'Penyalinan selesai — Sistem melakukan reboot otomatis'}
                      </span>
                      <span>{copyProgress}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#1B2230]">
                      <div
                        className="h-full bg-[#06B6D4] transition-all duration-200"
                        style={{ width: `${copyProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg border border-[#F59E0B]/25 bg-[#F59E0B]/10 p-3.5 text-xs text-[#FDE68A]">
                    <Warning size={16} weight="fill" className="mt-0.5 shrink-0 text-[#F59E0B]" />
                    <span>
                      <strong>Jebakan Praktikum:</strong> Saat PC restart pertama kali dan muncul
                      lagi tulisan <em>&ldquo;Press any key to boot from CD...&rdquo;</em>,{' '}
                      <strong>JANGAN tekan tombol apa pun</strong> agar proses lanjut dari Hard Disk
                      (bukan mengulang dari langkah awal).
                    </span>
                  </div>

                  {copyProgress >= 100 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setOsStep(7)}
                        className="rounded-lg bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                      >
                        Lanjut ke Konfigurasi Regional &amp; Product Key
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 7: PERSONALIZE + 25-CHAR PRODUCT KEY + GMT+07:00 */}
              {osStep === 7 && (
                <div className="space-y-5 max-w-2xl">
                  <div>
                    <p className="font-mono text-xs text-[#06B6D4]">
                      PERSONALIZATION, LICENSE KEY &amp; REGIONAL TIME
                    </p>
                    <h2 className="mt-0.5 text-base font-bold text-[#F3F4F6]">
                      Registrasi Pengguna, Product Key 25 Karakter &amp; Zona Waktu WIB
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#9CA3AF]">
                        Nama Pengguna
                      </label>
                      <input
                        type="text"
                        maxLength={MAX_SHORT_TEXT_CHARS}
                        value={ownerName}
                        onChange={(e) =>
                          setOwnerName(
                            sanitizeUserText(e.target.value, MAX_SHORT_TEXT_CHARS, false).value
                          )
                        }
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#141923] px-3 py-2 text-sm text-[#F3F4F6] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9CA3AF]">
                        Organisasi / Institusi
                      </label>
                      <input
                        type="text"
                        maxLength={MAX_SHORT_TEXT_CHARS}
                        value={orgName}
                        onChange={(e) =>
                          setOrgName(
                            sanitizeUserText(e.target.value, MAX_SHORT_TEXT_CHARS, false).value
                          )
                        }
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#141923] px-3 py-2 text-sm text-[#F3F4F6] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF]">
                        <Key size={14} className="text-[#06B6D4]" />
                        Product Key Resmi (25 Karakter: 5 × 5)
                      </label>
                      <button
                        type="button"
                        onClick={() => setProductKey('AKILB-2025X-STMIK-HWSW7-LEGAL')}
                        className="text-[11px] font-medium text-[#06B6D4] hover:underline"
                      >
                        Isi Contoh Key Lab Legal
                      </button>
                    </div>
                    <input
                      type="text"
                      value={productKey}
                      onChange={(e) => setProductKey(formatProductKeyInput(e.target.value))}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#141923] px-3.5 py-2.5 font-mono text-sm tracking-widest text-[#F3F4F6] placeholder:text-[#4B5563] focus:border-[#06B6D4] focus:outline-none"
                    />
                    <p className="mt-1 font-mono text-[11px] text-[#6B7280] tabular-nums">
                      Karakter terisi: {productKey.replace(/-/g, '').length}/25
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF]">
                      Zona Waktu (Date &amp; Time Settings)
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#141923] px-3 py-2.5 text-sm text-[#F3F4F6] focus:border-[#06B6D4] focus:outline-none"
                    >
                      <option value="(GMT+00:00) Greenwich Mean Time">
                        (GMT+00:00) Greenwich Mean Time : Dublin, London
                      </option>
                      <option value="(GMT+07:00) Bangkok, Hanoi, Jakarta">
                        (GMT+07:00) Bangkok, Hanoi, Jakarta (WIB — Standar Praktikum)
                      </option>
                      <option value="(GMT+08:00) Kuala Lumpur, Singapore">
                        (GMT+08:00) Kuala Lumpur, Singapore, Makassar (WITA)
                      </option>
                      <option value="(GMT+09:00) Osaka, Sapporo, Tokyo">
                        (GMT+09:00) Osaka, Sapporo, Tokyo, Jayapura (WIT)
                      </option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleValidatePersonalize}
                      className="rounded-lg bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                    >
                      Verifikasi &amp; Masuk Desktop Pertama
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 8: POST-INSTALL DRIVERS & APPS */}
              {osStep === 8 && (
                <div className="space-y-5">
                  <div>
                    <p className="font-mono text-xs text-[#10B981]">
                      DESKTOP READY — TAHAP PASCA-INSTALASI
                    </p>
                    <h2 className="mt-0.5 text-base font-bold text-[#F3F4F6]">
                      Instalasi Driver Motherboard Wajib &amp; Aplikasi Dasar
                    </h2>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      Tanpa driver resmi, resolusi layar terbatas, suara tidak keluar, dan port LAN
                      tidak terdeteksi di Device Manager.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-[#141923] p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-[#06B6D4]">
                        1. Driver Hardware Wajib ({installedDrivers.length}/{DRIVER_ITEMS.length})
                      </p>
                      {DRIVER_ITEMS.map((item) => {
                        const checked = installedDrivers.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleDriver(item.id)}
                            className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                              checked
                                ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#F3F4F6]'
                                : 'border-white/10 bg-[#0B0E14] text-[#9CA3AF] hover:text-[#F3F4F6]'
                            }`}
                          >
                            <CheckCircle
                              size={16}
                              weight={checked ? 'fill' : 'regular'}
                              className={checked ? 'text-[#10B981]' : 'text-[#4B5563]'}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border border-white/10 bg-[#141923] p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-[#D1D5DB]">
                        2. Aplikasi Penunjang Legal ({installedApps.length}/{APP_ITEMS.length})
                      </p>
                      {APP_ITEMS.map((item) => {
                        const checked = installedApps.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleApp(item.id)}
                            className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                              checked
                                ? 'border-[#06B6D4]/50 bg-[#06B6D4]/10 text-[#F3F4F6]'
                                : 'border-white/10 bg-[#0B0E14] text-[#9CA3AF] hover:text-[#F3F4F6]'
                            }`}
                          >
                            <CheckCircle
                              size={16}
                              weight={checked ? 'fill' : 'regular'}
                              className={checked ? 'text-[#06B6D4]' : 'text-[#4B5563]'}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFinishOsSim}
                      className="rounded-lg bg-[#10B981] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#34D399] press-feedback"
                    >
                      Finalisasi Sistem &amp; Tandai Selesai
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 9: COMPLETED SUMMARY */}
              {osStep === 9 && (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center space-y-4">
                  <CheckCircle size={44} weight="duotone" className="text-[#10B981]" />
                  <h2 className="text-xl font-bold text-[#F3F4F6]">
                    Instalasi Sistem Operasi Selesai &amp; Terverifikasi
                  </h2>
                  <p className="max-w-lg text-sm text-[#9CA3AF]">
                    Kamu telah menuntaskan urutan lengkap modul praktikum STMIK AKI: konfigurasi
                    BIOS Boot Order, persetujuan EULA (F8), pemformatan NTFS Quick, validasi
                    Product Key 25 karakter, zona waktu GMT+07:00, hingga instalasi driver
                    motherboard.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSimMode('disk-mgmt')}
                      className="rounded-lg bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                    >
                      Lanjut ke Simulasi Disk Management (diskmgmt.msc)
                    </button>
                    <button
                      type="button"
                      onClick={resetOsSimulation}
                      className="rounded-lg border border-white/15 bg-[#1B2230] px-4 py-2.5 text-xs font-medium text-[#D1D5DB] hover:text-[#F3F4F6]"
                    >
                      Ulangi Simulasi OS
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* === SIMULASI 2: DISK MANAGEMENT (diskmgmt.msc) === */
        <div className="space-y-4">
          <div className="workbench-card rounded-xl overflow-hidden">
            {/* Console Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#1B2230] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F3F4F6]">
                <Monitor size={16} className="text-[#06B6D4]" />
                <span className="font-mono">diskmgmt.msc</span>
                <span className="text-[#9CA3AF] font-normal">
                  — Disk Management (Local · GPT Partition Style)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetDisk}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#0B0E14] px-2.5 py-1 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6]"
              >
                <ArrowCounterClockwise size={13} />
                Reset Disk 0
              </button>
            </div>

            {/* Volume List Table */}
            <div className="overflow-x-auto border-b border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0E14] text-[#9CA3AF]">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2.5 font-semibold">Volume</th>
                    <th className="px-4 py-2.5 font-semibold">Layout</th>
                    <th className="px-4 py-2.5 font-semibold">File System</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#E5E7EB]">
                  {partitions.map((part) => {
                    const isSelected = part.id === selectedPartition.id;
                    return (
                      <tr
                        key={part.id}
                        onClick={() => handleSelectPartition(part)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#06B6D4]/15' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {part.label}{' '}
                          {part.driveLetter && (
                            <span className="font-mono font-bold text-[#06B6D4]">
                              ({part.driveLetter})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[#9CA3AF]">Simple</td>
                        <td className="px-4 py-2.5 font-mono">{part.fileSystem}</td>
                        <td className="px-4 py-2.5 text-[#D1D5DB]">{part.status}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          {part.sizeGb < 1
                            ? `${Math.round(part.sizeGb * 1024)} MB`
                            : `${part.sizeGb.toFixed(1)} GB`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Graphical Proportional Disk 0 Bar */}
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
                {/* Disk 0 Left Block */}
                <div className="shrink-0 rounded-lg border border-white/10 bg-[#0B0E14] px-4 py-3 lg:w-44">
                  <p className="font-mono text-xs font-bold text-[#F3F4F6]">Disk 0</p>
                  <p className="text-[11px] text-[#9CA3AF]">Basic · 500.00 GB</p>
                  <p className="mt-1 text-[11px] font-medium text-[#10B981]">Online (GPT)</p>
                </div>

                {/* Partitions Strip */}
                <div className="flex flex-1 flex-wrap gap-1.5 lg:flex-nowrap">
                  {partitions.map((part) => {
                    const isSelected = part.id === selectedPartition.id;
                    const flexGrow =
                      part.sizeGb < 1 ? 0.65 : Math.max(1.2, Math.round(part.sizeGb / 25));
                    const topBarColor =
                      part.colorType === 'unallocated'
                        ? 'bg-[#374151]'
                        : part.colorType === 'efi' || part.colorType === 'recovery'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#06B6D4]';

                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => handleSelectPartition(part)}
                        style={{ flexGrow }}
                        className={`min-w-[115px] overflow-hidden rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'border-[#06B6D4] bg-[#1B2230]'
                            : 'border-white/15 bg-[#0B0E14] hover:border-white/30'
                        }`}
                      >
                        <div className={`h-2 w-full ${topBarColor}`} />
                        <div className="p-2.5 space-y-0.5">
                          <p className="truncate text-xs font-bold text-[#F3F4F6]">
                            {part.label} {part.driveLetter ?? ''}
                          </p>
                          <p className="font-mono text-[11px] text-[#9CA3AF] tabular-nums">
                            {part.sizeGb < 1
                              ? `${Math.round(part.sizeGb * 1024)} MB`
                              : `${part.sizeGb.toFixed(1)} GB`}{' '}
                            · {part.fileSystem}
                          </p>
                          <p className="truncate text-[10px] text-[#6B7280]">{part.status}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#9CA3AF]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#06B6D4]" />
                  Primary Partition (NTFS)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#374151]" />
                  Unallocated Space (Belum Dialokasikan)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                  Partisi Sistem Terproteksi (EFI / Recovery — Jangan Dihapus)
                </span>
              </div>
            </div>
          </div>

          {/* Safety Alert if EFI / Recovery clicked */}
          {safetyAlert && (
            <div className="flex items-start gap-3 rounded-xl border border-[#F43F5E]/35 bg-[#F43F5E]/10 p-4 text-xs leading-relaxed text-[#FECDD3]">
              <ShieldWarning size={20} weight="fill" className="mt-0.5 shrink-0 text-[#F43F5E]" />
              <div>
                <p className="font-bold text-[#F43F5E]">Proteksi Partisi Sistem Aktif</p>
                <p className="mt-0.5">{safetyAlert}</p>
              </div>
            </div>
          )}

          {/* Contextual Action Panel for Selected Partition */}
          <div className="workbench-card rounded-xl p-5">
            {selectedPartition.id === 'c-drive' && (
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-xs text-[#06B6D4]">
                    LANGKAH 1 — SHRINK VOLUME PADA LOCAL DISK (C:)
                  </p>
                  <h2 className="mt-0.5 text-base font-bold text-[#F3F4F6]">
                    Potong Kapasitas Aman (Shrink Volume) Tanpa Menghapus Data Windows
                  </h2>
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    Pilih preset kapasitas aman untuk membuat ruang <strong>Unallocated</strong>.
                    Pastikan ruang bebas C: tetap menyisakan minimal 20–30% agar sistem stabil.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {SHRINK_PRESETS.map((preset) => {
                    const active = shrinkGb === preset.gb;
                    return (
                      <button
                        key={preset.gb}
                        type="button"
                        onClick={() => setShrinkGb(preset.gb)}
                        className={`rounded-lg border p-3.5 text-left transition-colors ${
                          active
                            ? 'border-[#06B6D4] bg-[#06B6D4]/15'
                            : 'border-white/10 bg-[#0B0E14] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-mono text-base font-bold text-[#F3F4F6] tabular-nums">
                            {preset.gb} GB
                          </span>
                          <span className="font-mono text-[11px] text-[#06B6D4]">
                            {preset.mbLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#9CA3AF]">{preset.note}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <span className="font-mono text-xs text-[#9CA3AF] tabular-nums">
                    Sisa ukuran C: setelah shrink:{' '}
                    <strong className="text-[#10B981]">
                      {(selectedPartition.sizeGb - shrinkGb).toFixed(1)} GB
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyShrink}
                    className="rounded-lg bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#22D3EE] press-feedback"
                  >
                    Terapkan Shrink Volume (-{shrinkGb} GB)
                  </button>
                </div>
              </div>
            )}

            {selectedPartition.colorType === 'unallocated' && (
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-xs text-[#10B981]">
                    LANGKAH 2 — NEW SIMPLE VOLUME WIZARD
                  </p>
                  <h2 className="mt-0.5 text-base font-bold text-[#F3F4F6]">
                    Alokasikan Ruang Unallocated ({selectedPartition.sizeGb.toFixed(1)} GB) Menjadi
                    Partisi Baru
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF]">
                      Drive Letter
                    </label>
                    <select
                      value={wizardLetter}
                      onChange={(e) => setWizardLetter(e.target.value as 'D:' | 'E:' | 'F:')}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0B0E14] px-3 py-2 font-mono text-sm text-[#F3F4F6] focus:border-[#06B6D4] focus:outline-none"
                    >
                      <option value="D:">D:</option>
                      <option value="E:">E:</option>
                      <option value="F:">F:</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF]">File System</label>
                    <select
                      value={wizardFs}
                      onChange={(e) => setWizardFs(e.target.value as 'NTFS' | 'FAT32')}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0B0E14] px-3 py-2 font-mono text-sm text-[#F3F4F6] focus:border-[#06B6D4] focus:outline-none"
                    >
                      <option value="NTFS">NTFS (Direkomendasikan)</option>
                      <option value="FAT32">FAT32 (Batas 4 GB/file)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF]">Volume Label</label>
                    <input
                      type="text"
                      value={wizardLabel}
                      onChange={(e) => setWizardLabel(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0B0E14] px-3 py-2 text-sm text-[#F3F4F6] focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <label className="inline-flex items-center gap-2 text-xs text-[#D1D5DB] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wizardQuickFormat}
                      onChange={(e) => setWizardQuickFormat(e.target.checked)}
                      className="h-4 w-4 accent-[#06B6D4]"
                    />
                    Perform a quick format
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateSimpleVolume}
                    className="rounded-lg bg-[#10B981] px-5 py-2.5 text-xs font-bold text-[#0B0E14] hover:bg-[#34D399] press-feedback"
                  >
                    Finish — Format &amp; Aktifkan Partisi {wizardLetter}
                  </button>
                </div>
              </div>
            )}

            {selectedPartition.id !== 'c-drive' && selectedPartition.colorType === 'primary' && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-[#10B981]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#F3F4F6]">
                      {selectedPartition.label} ({selectedPartition.driveLetter}) —{' '}
                      {selectedPartition.sizeGb.toFixed(1)} GB {selectedPartition.fileSystem}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">
                      Partisi aktif dengan status <strong>{selectedPartition.status}</strong>. Data
                      pribadi kini terpisah aman dari partisi sistem C: jika suatu saat Windows perlu
                      diinstal ulang.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPartId('c-drive')}
                  className="shrink-0 rounded-lg border border-white/15 bg-[#0B0E14] px-3.5 py-2 text-xs font-medium text-[#D1D5DB] hover:border-[#06B6D4]"
                >
                  Pilih C: Lagi
                </button>
              </div>
            )}

            {(selectedPartition.colorType === 'efi' ||
              selectedPartition.colorType === 'recovery') && (
              <div className="text-xs text-[#9CA3AF] space-y-2">
                <p className="font-semibold text-[#F3F4F6]">
                  Partisi Terpilih: {selectedPartition.label} ({selectedPartition.status})
                </p>
                <p>
                  Pilih <strong>Local Disk (C:)</strong> untuk melakukan Shrink Volume yang aman
                  tanpa menyentuh partisi bootloader UEFI atau partisi pemulihan sistem.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
