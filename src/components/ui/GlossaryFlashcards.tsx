import { useMemo, useState } from 'react';
import { ArrowsClockwise, CheckCircle, MagnifyingGlass, Warning } from '@phosphor-icons/react';
import { GLOSSARY_ITEMS } from '../../data/examBankData';
import type { GlossaryItem } from '../../types/rigbench';
import { MAX_SEARCH_CHARS, sanitizeSearchQuery } from '../../utils/inputSanitizer';

interface GlossaryFlashcardsProps {
  masteredIds: string[];
  onToggleMastered: (id: string) => void;
}

const CATEGORIES: Array<'Semua' | GlossaryItem['category']> = [
  'Semua',
  'Hardware & Chipset',
  'Memori & Storage',
  'Kelistrikan',
  'Partisi & File System',
  'EULA & Keamanan Siber',
  'Arsitektur & Performa',
  'Sejarah & Klasifikasi',
];

export function GlossaryFlashcards({ masteredIds, onToggleMastered }: GlossaryFlashcardsProps) {
  const [category, setCategory] = useState<'Semua' | GlossaryItem['category']>('Semua');
  const [query, setQuery] = useState('');
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY_ITEMS.filter((item) => {
      if (category !== 'Semua' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-medium text-[#F8FAFC]">Glosarium Istilah</h3>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            Klik kartu untuk membalik definisi · Terkuasai{' '}
            <span className="font-mono text-[#38BDF8] tabular-nums">
              {masteredIds.length}/{GLOSSARY_ITEMS.length}
            </span>
          </p>
        </div>

        <div className="relative w-full lg:w-72">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#64748B]"
          />
          <input
            type="text"
            maxLength={MAX_SEARCH_CHARS}
            value={query}
            onChange={(e) => setQuery(sanitizeSearchQuery(e.target.value).value)}
            placeholder="Cari BIOS, Pipelining, ENIAC, SPEC, EULA..."
            className="w-full rounded-xl bg-[#070E1F] border border-[#3B82F6]/20 py-2 pr-3 pl-9 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#38BDF8] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#070E1F] p-1.5 border border-[#3B82F6]/15">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 press-feedback ${
                active
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="datacore-card rounded-2xl p-8 text-center">
          <p className="text-sm font-medium text-[#F8FAFC]">Tidak ada istilah yang cocok.</p>
          <p className="mt-1 text-xs text-[#94A3B8]">Coba kata kunci lain atau tampilkan semua.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('Semua');
            }}
            className="mt-4 rounded-lg bg-[#0A162D] px-4 py-2 text-xs font-medium text-[#F8FAFC] border border-[#3B82F6]/25 hover:border-[#38BDF8] press-feedback"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const isFlipped = Boolean(flippedIds[item.id]);
            const isMastered = masteredIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`datacore-card datacore-card-interactive flex flex-col justify-between rounded-2xl p-4 transition-colors ${
                  isFlipped ? 'border-[#38BDF8]/40' : ''
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleFlip(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFlip(item.id);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
                    <span>{item.category}</span>
                    <span className="inline-flex items-center gap-1 text-[#38BDF8]">
                      <ArrowsClockwise size={12} />
                      {isFlipped ? 'Definisi' : 'Balik'}
                    </span>
                  </div>

                  <h4 className="mt-2.5 text-sm font-semibold text-[#F8FAFC]">{item.term}</h4>

                  {isFlipped ? (
                    <div className="mt-2.5 space-y-2">
                      <p className="text-xs leading-relaxed text-[#CBD5E1]">{item.definition}</p>
                      {item.examTrap && (
                        <p className="flex items-start gap-1.5 text-[11px] text-[#F59E0B]">
                          <Warning size={13} weight="fill" className="mt-0.5 shrink-0" />
                          <span>{item.examTrap}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2.5 text-xs text-[#94A3B8]">
                      Klik kartu untuk melihat definisi teknis lengkap.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-[#3B82F6]/15">
                  <span className="text-[11px] text-[#64748B]">
                    {isMastered ? 'Sudah Hafal' : 'Belum Ditandai'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleMastered(item.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium press-feedback ${
                      isMastered
                        ? 'bg-[#10B981]/15 text-[#34D399]'
                        : 'bg-[#040812] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <CheckCircle size={13} weight={isMastered ? 'fill' : 'regular'} />
                    {isMastered ? 'Terkuasai' : 'Tandai Hafal'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
