import {
  ArrowCounterClockwise,
  CheckCircle,
  TerminalWindow,
  Trophy,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type { AssemblyReport } from '../../../types/rigbench';
import { formatCountdown, formatShortDate } from '../../../utils/formatters';

interface AssemblyPostReportModalProps {
  report: AssemblyReport;
  history: AssemblyReport[];
  onClose: () => void;
  onPlayAgain: () => void;
}

export function AssemblyPostReportModal({
  report,
  history,
  onClose,
  onPlayAgain,
}: AssemblyPostReportModalProps) {
  const isPostPassed = report.postPassed !== false;
  const isFreeRoam = report.difficulty === 'freeroam';

  const gradeLabel =
    report.accuracyPercent >= 90
      ? 'Sangat Kompeten (A)'
      : report.accuracyPercent >= 75
        ? 'Kompeten (B)'
        : 'Perlu Latihan Urutan (C)';

  const modeLabel =
    report.difficulty === 'exam'
      ? 'Mode Ujian TAS'
      : report.difficulty === 'freeroam'
        ? 'Mode Free Roam'
        : 'Mode Latihan';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isPostPassed ? 'BIOS POST dan Rapor Praktik TAS' : 'Diagnosa Hardware Power Test'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#040812]/88 p-4"
    >
      <div className="datacore-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-[#3B82F6]/15 px-5 py-3.5">
          <div
            className={`flex items-center gap-2 text-xs font-mono font-semibold ${
              isPostPassed ? 'text-[#34D399]' : 'text-[#FDA4AF]'
            }`}
          >
            {isPostPassed ? <TerminalWindow size={16} /> : <WarningCircle size={16} weight="fill" />}
            {isPostPassed
              ? 'BIOS POST VERIFICATION & RAPOR PRAKTIK TAS'
              : 'DIAGNOSA POWER TEST — POST GAGAL'}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup laporan"
            className="rounded-lg border border-[#3B82F6]/20 bg-[#040812] p-1.5 text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isPostPassed ? (
            <>
              {/* Authentic BIOS POST Terminal Output */}
              <div className="rounded-xl border border-[#10B981]/30 bg-[#040812] p-4 font-mono text-xs leading-relaxed text-[#CBD5E1] space-y-1">
                <p className="font-semibold text-[#38BDF8]">
                  AMIBIOS (C) STMIK AKI HARDWARE LAB — POST SUCCESSFUL (1 SHORT BEEP)
                </p>
                <p className="text-[#34D399]">[OK] PSU Input Voltage Switch : 220V–230V AC + ATX 24-Pin &amp; CPU 4-Pin 12V</p>
                <p>[OK] CPU Socket LGA 775 : Intel Core 2 Duo + Thermal Paste + 4/4 Push-Pins Locked</p>
                <p>[OK] Memory Test : DIMM 1 &amp; DIMM 2 DDR2 Dual-Channel (Clips Locked)</p>
                <p>[OK] CMOS Battery CR2032 : 3.04V DC (BIOS Settings Retained)</p>
                <p>[OK] Display Adapter : PCI Express x16 Graphics (Bracket Screw Locked)</p>
                <p>
                  [OK] Storage 3.5&quot; HDD IDE : Jumper {report.hddJumperSelected.toUpperCase()} + Kabel Pita IDE 40-Wire (2 Ujung) + Power Molex 4-Pin 12V/5V
                </p>
                <p>
                  [OK] Front Panel 9-Pin : HDD LED (1-3), +P/-P LED (2/4 Polarity OK), RESET (5-7), POWER SW (6-8)
                </p>
              </div>

              {/* Scoreboard or Free Roam Isolated Notice */}
              <div className="rounded-xl border border-[#3B82F6]/15 bg-[#040812] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Trophy size={24} weight="duotone" className="text-[#38BDF8]" />
                    <div>
                      <p className="text-xs text-[#94A3B8]">
                        Rapor Praktik TAS · {modeLabel}
                      </p>
                      <p className="text-base font-semibold text-[#F8FAFC]">
                        {isFreeRoam ? 'Sistem Booting Stabil (POST Lolos)' : gradeLabel}
                      </p>
                    </div>
                  </div>
                  {isFreeRoam ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#38BDF8]/30 bg-[#0A162D] px-2.5 py-1 text-[11px] font-medium text-[#38BDF8]">
                      Eksperimen Bebas · Tidak Masuk Skor Ujian
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#34D399]">
                      <CheckCircle size={14} weight="fill" />
                      Tersimpan di localStorage
                    </span>
                  )}
                </div>

                {!isFreeRoam && (
                  <div className="grid grid-cols-3 gap-3 border-t border-[#3B82F6]/15 pt-3">
                    <div>
                      <p className="text-[11px] text-[#94A3B8]">Akurasi Urutan</p>
                      <p className="font-mono text-2xl font-semibold text-[#38BDF8] tabular-nums">
                        {report.accuracyPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#94A3B8]">Jumlah Kesalahan</p>
                      <p className="font-mono text-2xl font-semibold text-[#F8FAFC] tabular-nums">
                        {report.mistakes}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#94A3B8]">Waktu Selesai</p>
                      <p className="font-mono text-2xl font-semibold text-[#34D399] tabular-nums">
                        {formatCountdown(report.elapsedSeconds)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Free Roam Hardware Diagnostic Failure Report */
            <div className="space-y-4">
              <div className="rounded-xl border border-[#F43F5E]/35 bg-[#12070D] p-4 font-mono text-xs leading-relaxed text-[#FECDD3] space-y-1.5">
                <p className="font-semibold text-[#FB7185]">
                  AMIBIOS HARDWARE DIAGNOSTIC — SYSTEM HALTED (NO POST)
                </p>
                <p className="text-[#CBD5E1]">
                  Ditemukan {report.diagnosticIssues?.length ?? 0} komponen wajib yang belum terpasang atau salah konfigurasi:
                </p>
              </div>

              <ul className="space-y-2">
                {(report.diagnosticIssues ?? []).map((issue, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-[#F43F5E]/25 bg-[#040812] px-3.5 py-2.5 text-xs text-[#E2E8F0]"
                  >
                    <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-[#FB7185]" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Saved Ujian TAS / Latihan History List (Free Roam excluded by store) */}
          {history.length > 0 && isPostPassed && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#94A3B8]">
                Riwayat Skor Ujian &amp; Latihan TAS Tersimpan ({history.length} Sesi)
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#3B82F6]/15 bg-[#040812] px-3 py-2 text-xs"
                  >
                    <span className="text-[#CBD5E1]">
                      {formatShortDate(item.completedAtIso)} ·{' '}
                      <span className="text-[#94A3B8]">
                        {item.difficulty === 'exam' ? 'Ujian TAS' : 'Latihan'}
                      </span>
                    </span>
                    <span className="font-mono text-[#38BDF8] tabular-nums">
                      {item.accuracyPercent}% · {item.mistakes} salah ·{' '}
                      {formatCountdown(item.elapsedSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#3B82F6]/15 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#3B82F6]/25 bg-[#091122] px-4 py-2 text-xs font-medium text-[#F8FAFC] hover:border-[#38BDF8]"
            >
              {isPostPassed ? 'Lihat Motherboard Menyala' : 'Lanjutkan Rakit & Perbaiki'}
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="sapphire-btn inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              Reset Meja Rakit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
