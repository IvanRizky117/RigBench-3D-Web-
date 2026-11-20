import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Cube,
  Exam,
  Minus,
  Plus,
  ShieldCheck,
  SpeakerHigh,
  Wrench,
} from '@phosphor-icons/react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { TabId } from '../../../types/rigbench';

interface HomeFeatureSectionsProps {
  onNavigateTab: (tab: TabId) => void;
}

const SNAPPY_EASE = [0.22, 1, 0.36, 1] as const;
const TACTILE_SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };

const ACCORDION_ITEMS = [
  {
    id: 'theater',
    title: 'Teater Materi Fullscreen & Subtitle Film',
    summary:
      'Simak 7 klaster STMIK AKI dengan diagram Sapphire interaktif, suara AI browser, dan subtitle bersih bergaya sinema.',
    tab: 'lecture' as TabId,
    cta: 'Buka Teater Materi',
  },
  {
    id: 'lab3d',
    title: 'Lab 3D PBR & Game Rakit TAS Ketat',
    summary:
      'Inspeksi 24 titik mainboard dengan kamera bebas WASD, lalu latih urutan rakit 16 langkah lewat drag-and-drop 3D magnetis.',
    tab: 'lab3d' as TabId,
    cta: 'Masuk Lab 3D',
  },
  {
    id: 'rubric',
    title: 'Penilaian Essay Rubric Matcher Lokal',
    summary:
      'Uji ketajaman analisis studi kasus (bobot 70%) dengan pencocokan konsep, sinonim, dan contoh jawaban ideal secara instan tanpa AI.',
    tab: 'exam' as TabId,
    cta: 'Coba Try Out',
  },
  {
    id: 'offline',
    title: 'Ringan, Fokus & Tersimpan di Browser',
    summary:
      'Tanpa login dan bebas gangguan visual; seluruh progres klaster, inspeksi 3D, serta skor Try Out tercatat otomatis di lokal.',
    tab: 'lecture' as TabId,
    cta: 'Mulai Belajar',
  },
];

export function HomeFeatureSections({ onNavigateTab }: HomeFeatureSectionsProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [activeAccordionIdx, setActiveAccordionIdx] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const stepsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsSectionRef,
    offset: ['start end', 'center center'],
  });

  const smoothStepsProgress = useSpring(stepsProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  // Left & Right perspective cards straighten smoothly toward 0 deg as scrolled to center
  const leftRotate = useTransform(smoothStepsProgress, [0, 1], [-3.8, 0]);
  const rightRotate = useTransform(smoothStepsProgress, [0, 1], [3.8, 0]);
  const sideCardY = useTransform(smoothStepsProgress, [0, 1], [26, 0]);
  const sideCardScale = useTransform(smoothStepsProgress, [0, 1], [0.95, 1]);
  const centerCardY = useTransform(smoothStepsProgress, [0, 1], [32, 0]);
  const centerCardScale = useTransform(smoothStepsProgress, [0, 1], [0.965, 1]);

  const enableScrollTilt = isDesktop && !reducedMotion;
  const currentFeature = ACCORDION_ITEMS[activeAccordionIdx] ?? ACCORDION_ITEMS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-24 px-4 sm:px-6 lg:px-8">
      {/* SECTION 1: Cara Kerja RigBench (DataCore "How It Works?" 3 Perspective Cards) */}
      <section className="space-y-10">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: SNAPPY_EASE }}
          className="text-center space-y-2"
        >
          <h2 className="text-2xl font-medium tracking-tight text-[#F8FAFC] sm:text-3xl">
            Cara Kerja RigBench
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[#94A3B8]">
            Tiga langkah ringkas untuk menguasai teori arsitektur PC dan praktik perakitan TAS secara tuntas.
          </p>
        </motion.div>

        <div ref={stepsSectionRef} className="grid grid-cols-1 items-center gap-5 lg:grid-cols-3">
          {/* Card 01 (Left Perspective -> Straightens on Scroll) */}
          <motion.button
            type="button"
            onClick={() => onNavigateTab('lecture')}
            initial={reducedMotion ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            style={
              enableScrollTilt
                ? { rotate: leftRotate, y: sideCardY, scale: sideCardScale }
                : undefined
            }
            whileHover={reducedMotion ? undefined : { y: -4 }}
            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            transition={TACTILE_SPRING}
            className="datacore-card datacore-card-interactive group rounded-2xl p-6 text-left will-change-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/20 border border-[#38BDF8]/30 font-mono text-xs font-semibold text-[#38BDF8]">
              01
            </div>
            <h3 className="mt-4 text-lg font-medium text-[#F8FAFC]">Pahami Visual &amp; Teater</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">
              Tonton 7 klaster kurikulum lewat panggung animasi bersuara dan lab kalkulator instan.
            </p>

            {/* Micro-Illustration: Theater Screen */}
            <div className="mt-5 rounded-xl border border-[#3B82F6]/20 bg-[#030712] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#38BDF8]">
                <span className="inline-flex items-center gap-1">
                  <SpeakerHigh size={12} weight="fill" />
                  TEATER 01–07
                </span>
                <span className="text-[#64748B]">FULLSCREEN</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-md bg-[#0B162C] p-2 text-center font-mono text-[10px] text-[#38BDF8]">
                  CPU
                </div>
                <div className="rounded-md bg-[#2563EB]/25 border border-[#38BDF8]/40 p-2 text-center font-mono text-[10px] text-[#F8FAFC]">
                  MCH
                </div>
                <div className="rounded-md bg-[#0B162C] p-2 text-center font-mono text-[10px] text-[#94A3B8]">
                  RAM
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-[#0D172E] overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8]" />
              </div>
            </div>
          </motion.button>

          {/* Card 02 (Center Elevated Glowing Sapphire Focal Card ala DataCore) */}
          <motion.button
            type="button"
            onClick={() => onNavigateTab('lab3d')}
            initial={reducedMotion ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            style={enableScrollTilt ? { y: centerCardY, scale: centerCardScale } : undefined}
            whileHover={reducedMotion ? undefined : { y: -5 }}
            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            transition={TACTILE_SPRING}
            className="relative overflow-hidden rounded-2xl border border-[#38BDF8]/45 bg-gradient-to-b from-[#0E2046] via-[#071128] to-[#040A19] p-6 text-left shadow-[0_28px_70px_-20px_rgba(37,99,235,0.5)] will-change-transform"
          >
            {/* Subtle Bottom Sapphire Luminous Wash */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#2563EB]/30 to-transparent"
            />
            <div className="relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] font-mono text-xs font-semibold text-white shadow-[0_0_22px_rgba(37,99,235,0.65)]">
                02
              </div>
              <h3 className="mt-4 text-lg font-medium text-[#F8FAFC]">Eksplorasi &amp; Rakit 3D</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#CBD5E1]">
                Bedah 24 titik mainboard secara 3D dan uji urutan rakit ketat 16 langkah hingga POST.
              </p>

              {/* Micro-Illustration: 3D Assembly Steps */}
              <div className="mt-5 rounded-xl border border-[#38BDF8]/25 bg-[#030816]/90 p-3.5 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-[#0A162E] px-2.5 py-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-[#F8FAFC]">
                    <Cube size={13} weight="duotone" className="text-[#38BDF8]" />
                    CPU LGA 775 · Putar [R]
                  </span>
                  <CheckCircle size={14} weight="fill" className="text-[#10B981]" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#2563EB]/25 border border-[#38BDF8]/35 px-2.5 py-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-[#F8FAFC]">
                    <Wrench size={13} weight="duotone" className="text-[#38BDF8]" />
                    Snap Magnetis DDR2
                  </span>
                  <span className="font-mono text-[10px] text-[#38BDF8]">SNAP</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#0A162E] px-2.5 py-2 text-[11px] text-[#94A3B8]">
                  <span>Kabel F_PANEL &amp; PSU 220V</span>
                  <span className="font-mono text-[10px]">16/16</span>
                </div>
              </div>
            </div>
          </motion.button>

          {/* Card 03 (Right Perspective -> Straightens on Scroll) */}
          <motion.button
            type="button"
            onClick={() => onNavigateTab('exam')}
            initial={reducedMotion ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            style={
              enableScrollTilt
                ? { rotate: rightRotate, y: sideCardY, scale: sideCardScale }
                : undefined
            }
            whileHover={reducedMotion ? undefined : { y: -4 }}
            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            transition={TACTILE_SPRING}
            className="datacore-card datacore-card-interactive group rounded-2xl p-6 text-left will-change-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/20 border border-[#38BDF8]/30 font-mono text-xs font-semibold text-[#38BDF8]">
              03
            </div>
            <h3 className="mt-4 text-lg font-medium text-[#F8FAFC]">Uji Essay Auto-Scoring</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">
              Latihan Try Out berwaktu dengan koreksi poin rubrik Essay 70% dan Pilihan Ganda 30%.
            </p>

            {/* Micro-Illustration: Rubric Bars */}
            <div className="mt-5 rounded-xl border border-[#3B82F6]/20 bg-[#030712] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94A3B8]">Skor Rubrik Lokal</span>
                <span className="font-mono font-semibold text-[#10B981]">92 / 100</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-[#0D172E]">
                  <div className="h-full w-[90%] rounded-full bg-[#38BDF8]" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#0D172E]">
                  <div className="h-full w-[82%] rounded-full bg-[#2563EB]" />
                </div>
              </div>
              <p className="font-mono text-[10px] text-[#64748B]">
                14 Essay Analisis · 15 ABC · 27 Glosarium
              </p>
            </div>
          </motion.button>
        </div>
      </section>

      {/* SECTION 2: Interactive Feature Accordion ("Kenapa RigBench?" ala Why Datacore) */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: 0.5, ease: SNAPPY_EASE }}
        className="space-y-10"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-medium tracking-tight text-[#F8FAFC] sm:text-3xl">
            Kenapa RigBench?
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[#94A3B8]">
            Dirancang khusus mengikuti kurikulum STMIK AKI agar persiapan ujian lebih cepat dan
            terukur.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          {/* Left Column: Interactive Glowing Blue Accordion */}
          <div className="space-y-3 lg:col-span-5">
            {ACCORDION_ITEMS.map((item, idx) => {
              const isOpen = idx === activeAccordionIdx;
              return (
                <motion.button
                  key={item.id}
                  layout={!reducedMotion}
                  type="button"
                  onClick={() => setActiveAccordionIdx(idx)}
                  whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                  transition={TACTILE_SPRING}
                  className={`relative w-full overflow-hidden rounded-2xl p-4 text-left transition-colors ${
                    isOpen ? 'bg-transparent' : 'datacore-card hover:border-[#3B82F6]/35'
                  }`}
                >
                  {isOpen && (
                    <motion.div
                      layoutId="whyRigbenchActiveCard"
                      transition={TACTILE_SPRING}
                      className="pointer-events-none absolute inset-0 rounded-2xl border border-[#38BDF8]/55 bg-gradient-to-br from-[#2563EB]/38 via-[#10254D]/92 to-[#060E20] shadow-[0_0_34px_rgba(37,99,235,0.36)]"
                    />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[#F8FAFC]">{item.title}</span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isOpen
                            ? 'border-[#38BDF8]/50 bg-[#38BDF8]/15 text-[#38BDF8]'
                            : 'border-[#3B82F6]/20 text-[#94A3B8]'
                        }`}
                      >
                        {isOpen ? (
                          <Minus size={12} weight="bold" />
                        ) : (
                          <Plus size={12} weight="bold" />
                        )}
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="summary"
                          initial={reducedMotion ? false : { opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: SNAPPY_EASE }}
                        >
                          <p className="mt-2.5 text-xs leading-relaxed text-[#CBD5E1]">
                            {item.summary}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Visual Preview Stage synced to Active Accordion */}
          <div className="datacore-card rounded-2xl p-6 lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between border-b border-[#3B82F6]/15 pb-3.5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8]">
                {currentFeature.id === 'theater' && <BookOpen size={15} weight="duotone" />}
                {currentFeature.id === 'lab3d' && <Cube size={15} weight="duotone" />}
                {currentFeature.id === 'rubric' && <Exam size={15} weight="duotone" />}
                {currentFeature.id === 'offline' && <ShieldCheck size={15} weight="duotone" />}
                <span>PRATINJAU FITUR · 0{activeAccordionIdx + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(currentFeature.tab)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC]"
              >
                {currentFeature.cta}
                <ArrowRight size={13} weight="bold" />
              </button>
            </div>

            {/* Dynamic Mockup Canvas */}
            <div className="flex-1 rounded-xl border border-[#3B82F6]/15 bg-[#020610] p-5 flex flex-col justify-between min-h-[210px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -10, scale: 0.985 }}
                  transition={{ duration: 0.28, ease: SNAPPY_EASE }}
                  className="flex flex-1 flex-col justify-between"
                >
                  {currentFeature.id === 'theater' && (
                    <>
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-lg border border-[#38BDF8]/30 bg-[#081327] p-3">
                          <p className="font-mono text-[10px] text-[#38BDF8]">MBR (Legacy)</p>
                          <p className="mt-1 text-xs text-[#CBD5E1]">Maks 2 TB · 4 Primer</p>
                        </div>
                        <div className="rounded-lg border border-[#2563EB]/45 bg-[#102348]/70 p-3">
                          <p className="font-mono text-[10px] text-[#38BDF8]">GPT (UEFI)</p>
                          <p className="mt-1 text-xs text-[#F8FAFC]">128 Partisi · CRC32</p>
                        </div>
                        <div className="rounded-lg border border-[#3B82F6]/20 bg-[#081327] p-3">
                          <p className="font-mono text-[10px] text-[#94A3B8]">EULA &amp; Crack</p>
                          <p className="mt-1 text-xs text-[#CBD5E1]">Lisensi &amp; 4 Bahaya</p>
                        </div>
                      </div>
                      <div className="mt-6 text-center">
                        <p className="cinema-subtitle-text text-sm text-[#F8FAFC]">
                          GPT modern mendukung partisi di atas{' '}
                          <span className="font-semibold text-[#38BDF8]">2 Terabyte</span> dengan
                          cadangan tabel partisi otomatis.
                        </p>
                      </div>
                    </>
                  )}

                  {currentFeature.id === 'lab3d' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                        <span>WASD + Q/E Kamera · [R] Putar Orientasi</span>
                        <span className="text-[#10B981]">SNAP VALID</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#10B981]/35 bg-[#10B981]/10 p-3.5">
                          <p className="font-mono text-xs font-semibold text-[#10B981]">
                            #01 Soket LGA 775
                          </p>
                          <p className="mt-1 text-xs text-[#CBD5E1]">
                            Segitiga emas Pin-1 sejajar · Tuas ZIF terkunci.
                          </p>
                        </div>
                        <div className="rounded-xl border border-[#38BDF8]/30 bg-[#081327] p-3.5">
                          <p className="font-mono text-xs font-semibold text-[#38BDF8]">
                            F_PANEL &amp; PSU
                          </p>
                          <p className="mt-1 text-xs text-[#CBD5E1]">
                            5 kabel DuPont terpasang · Switch PSU 220V siap POST.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentFeature.id === 'rubric' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[#38BDF8]">
                          ESSAY #04 · TROUBLESHOOTING MATOT
                        </span>
                        <span className="font-mono font-semibold text-[#10B981]">100%</span>
                      </div>
                      {[
                        'Uji jumper Pin 16 (Hijau PS_ON) ke Pin Hitam (GND)',
                        'Periksa fisik kapasitor Elco (kembung / bocor)',
                        'Verifikasi saklar tegangan 220V AC & grounding',
                      ].map((pt) => (
                        <div
                          key={pt}
                          className="flex items-center gap-2 rounded-lg bg-[#081124] px-3 py-2 text-xs text-[#E2E8F0]"
                        >
                          <CheckCircle size={14} weight="fill" className="shrink-0 text-[#10B981]" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentFeature.id === 'offline' && (
                    <div className="grid grid-cols-3 gap-3 my-auto">
                      {[
                        { label: 'Penyimpanan', value: 'Lokal', sub: 'Tanpa akun' },
                        { label: 'Narasi Suara', value: 'Instan', sub: 'Web Speech API' },
                        { label: 'Grafis 3D', value: '1 WebGL', sub: 'Anti-lag SVG dock' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl border border-[#3B82F6]/20 bg-[#081124] p-3.5 text-center"
                        >
                          <p className="text-[11px] text-[#94A3B8]">{stat.label}</p>
                          <p className="mt-1 font-mono text-base font-semibold text-[#38BDF8]">
                            {stat.value}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#64748B]">{stat.sub}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: Ultra-Dark Cinematic Closing CTA Card */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: SNAPPY_EASE }}
      >
        <div className="datacore-card datacore-card-interactive relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#2563EB]/18 to-transparent"
          />
          <div className="relative z-10">
            <h2 className="mx-auto max-w-xl text-2xl font-medium tracking-tight text-[#F8FAFC] sm:text-3xl">
              Siap Uji Pemahaman Sekarang?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#94A3B8]">
              Kerjakan simulasi Try Out Essay &amp; Pilihan Ganda berwaktu lengkap dengan analisis
              rubrik cerdas lokal.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <motion.button
                type="button"
                onClick={() => onNavigateTab('exam')}
                whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                transition={TACTILE_SPRING}
                className="sapphire-btn inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium whitespace-nowrap"
              >
                <span>Mulai Simulasi Try Out</span>
                <ArrowRight size={15} weight="bold" />
              </motion.button>

              <button
                type="button"
                onClick={() => onNavigateTab('lecture')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#94A3B8] hover:text-[#38BDF8] transition-colors whitespace-nowrap"
              >
                Pelajari Materi
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
