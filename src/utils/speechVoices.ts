function normalizeLocale(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, '-');
}

/**
 * Matches Indonesian TTS voices across desktop Chromium, iOS/Safari, and Android
 * (where legacy Java/Android locales often report `in_ID`, `in-ID`, or `ind`).
 */
export function isIndonesianVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = normalizeLocale(voice.lang || '');
  const name = (voice.name || '').toLowerCase();

  return (
    lang === 'id' ||
    lang.startsWith('id-') ||
    lang === 'in' ||
    lang.startsWith('in-') ||
    lang === 'ind' ||
    lang.startsWith('ind-') ||
    /indonesia|bahasa indonesia|\bgadis\b|\bardi\b|\bdamayanti\b/i.test(name)
  );
}

export function isMalayVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = normalizeLocale(voice.lang || '');
  const name = (voice.name || '').toLowerCase();

  return (
    lang === 'ms' ||
    lang.startsWith('ms-') ||
    lang === 'zsm' ||
    lang.startsWith('zsm-') ||
    /\bmalay\b|\bmelayu\b/i.test(name)
  );
}

export function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = normalizeLocale(voice.lang || '');
  return lang === 'en' || lang.startsWith('en-');
}

/**
 * Filters browser voices strictly to Indonesian, Malay, and English,
 * prioritizing Indonesian voices at the top and never falling back to unrelated locales.
 */
export function filterAndSortPreferredVoices(
  voices: SpeechSynthesisVoice[]
): {
  indonesianVoices: SpeechSynthesisVoice[];
  allowedVoices: SpeechSynthesisVoice[];
} {
  const indonesianVoices = voices.filter(isIndonesianVoice);
  const malayVoices = voices.filter(
    (v) => !isIndonesianVoice(v) && isMalayVoice(v)
  );
  const englishVoices = voices.filter(
    (v) => !isIndonesianVoice(v) && !isMalayVoice(v) && isEnglishVoice(v)
  );

  return {
    indonesianVoices,
    allowedVoices: [...indonesianVoices, ...malayVoices, ...englishVoices],
  };
}

export function pickPreferredIndonesianVoice(
  indonesianVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!indonesianVoices.length) return undefined;
  return (
    indonesianVoices.find((v) =>
      /google|gadis|ardi|damayanti|natural|online/i.test(v.name)
    ) ?? indonesianVoices[0]
  );
}
