/**
 * Normalizes Indonesian computer-architecture lecture scripts for natural TTS
 * pronunciation (both Gemini TTS and local Web Speech fallback) while keeping
 * the displayed on-screen subtitle text untouched and exam-accurate.
 */

const PHONETIC_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bPS\s*\/?\s*2\b/gi, 'P S dua'],
  [/\bS\/?PDIF\b/gi, 'S P D I F'],
  [/\bSMPS\b/g, 'S M P S'],
  [/\bUEFI\b/g, 'U E F I'],
  [/\bEULA\b/g, 'Eula'],
  [/\bBIOS\b/g, 'Bios'],
  [/\bCMOS\b/g, 'Simos'],
  [/\bAGP\b/g, 'A G P'],
  [/\bPCIe\b/gi, 'P C I Express'],
  [/\bPCI\b/g, 'P C I'],
  [/\bSATA\b/g, 'Sata'],
  [/\bPATA\b/g, 'Pata'],
  [/\bIDE\b/g, 'I D E'],
  [/\bSCSI\b/g, 'S C S I'],
  [/\bNTFS\b/g, 'N T F S'],
  [/\bFAT32\b/gi, 'Fat tiga puluh dua'],
  [/\bRJ-?45\b/gi, 'R J empat lima'],
  [/\bUSB\b/g, 'U S B'],
  [/\bLAN\b/g, 'Lan'],
  [/\bCPU\b/g, 'C P U'],
  [/\bVGA\b/g, 'V G A'],
  [/\bPSU\b/g, 'P S U'],
  [/\bSSD\b/g, 'S S D'],
  [/\bHDD\b/g, 'harddisk'],
  [/\bSODIMM\b/gi, 'So-dim'],
  [/\bSIMM\b/g, 'Sim'],
  [/\bDIMM\b/g, 'Dim'],
  [/\bSDRAM\b/gi, 'S D Ram'],
  [/\bDDR1\b/gi, 'D D R satu'],
  [/\bDDR2\b/gi, 'D D R dua'],
  [/\bDDR3\b/gi, 'D D R tiga'],
  [/\bMOSFET\b/gi, 'Mosfet'],
  [/\bELCO\b/gi, 'Elko'],
  [/\bHBCD\b/g, 'H B C D'],
  [/\bMaTot\b/gi, 'Mati Total'],
  [/\bAVR\b/g, 'A V R'],
  [/\bUPS\b/g, 'U P S'],
  [/\bCRC32\b/gi, 'C R C tiga dua'],
  [/\bNCQ\b/g, 'N C Q'],
  [/\bEMI\b/g, 'E M I'],
  [/\bJNZ\b/g, 'J N Z'],
  [/\bJZ\b/g, 'J Z'],
  [/\bNOP\b/g, 'N O P'],
  [/\bMCH\b/g, 'M C H'],
  [/\bICH\b/g, 'I C H'],
  [/\bAPU\b/g, 'A P U'],
  [/\bFX\b/g, 'F X'],
  [/\bCD-?ROM\b/gi, 'C D Rom'],
  [/\bNumLock\b/gi, 'Num Lock'],
  [/\.exe\b/gi, ' dot exe'],
  [/\.dll\b/gi, ' dot D L L'],
  [/\bGMT\s*\+\s*0?7(?::00)?\b/gi, 'G M T plus tujuh'],
  [/\+5VSB\b/gi, 'plus lima volt stand-by'],
  [/220V\b/gi, 'dua ratus dua puluh volt'],
  [/168\s*pin/gi, 'seratus enam puluh delapan pin'],
  [/184\s*pin/gi, 'seratus delapan puluh empat pin'],
  [/240\s*pin/gi, 'dua ratus empat puluh pin'],
  [/20%\s*[–-]\s*30%/g, 'dua puluh hingga tiga puluh persen'],
  [/\bALU\b/g, 'A L U'],
  [/\bRISC\b/g, 'Risk'],
  [/\bCISC\b/g, 'Sisk'],
  [/\bSPEC\b/g, 'Spek'],
  [/\bENIAC\b/g, 'Eniak'],
  [/\bEDVAC\b/g, 'Edvak'],
  [/\bUNIVAC\s*I\b/g, 'Univak satu'],
  [/\bUNIVAC\b/g, 'Univak'],
  [/\bCOBOL\b/g, 'Kobol'],
  [/\bFORTRAN\b/g, 'Fortran'],
  [/\bICOT\b/g, 'Ikot'],
  [/\bVLSI\b/g, 'V L S I'],
  [/\bULSI\b/g, 'U L S I'],
  [/\bLSI\b/g, 'L S I'],
  [/\bIBM\b/g, 'I B M'],
  [/\bGUI\b/g, 'G U I'],
  [/\bHAL\s*9000\b/gi, 'Hal sembilan ribu'],
  [/\bI\/O\b/g, 'I O'],
  [/\bOS\b/g, 'O S'],
  [/\bPC\b/g, 'P C'],
  [/\bIC\b/g, 'I C'],
  [/\bAI\b/g, 'A I'],
  [/\bWA\b/g, 'W A'],
  [/\bSD\b/g, 'S D'],
  [/\bt0\b/g, 'T nol'],
  [/\bt1\b/g, 'T satu'],
  [/\bt2\b/g, 'T dua'],
  [/\bt3\b/g, 'T tiga'],
  [/\bt4\b/g, 'T empat'],
  [/\bt5\b/g, 'T lima'],
  [/(\d+)\s*MHz\b/gi, '$1 megahertz'],
  [/(\d+)\s*GHz\b/gi, '$1 gigahertz'],
  [/(\d+)\s*kW\b/gi, '$1 kilowatt'],
  [/(\d+)\s*GB\/s/gi, '$1 gigabyte per detik'],
  [/(\d+)\s*pF\b/g, '$1 pikofarad'],
  [/(\d+)\s*uF\b/g, '$1 mikrofarad'],
  [/(\d+)\s*µF\b/g, '$1 mikrofarad'],
  [/×/g, ' kali '],
  [/÷/g, ' dibagi '],
  [/→/g, ', lalu ke '],
  [/&/g, ' dan '],
];

export function formatIndonesianSpeechText(rawText: string): string {
  let result = rawText.replace(/\s+/g, ' ').trim();
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Splits narration into full natural sentences for local Web Speech API playback
 * so voices never stutter between short 66-character subtitle line breaks.
 */
export function splitIntoSpeechSentences(rawText: string): string[] {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length > 0 ? sentences : [cleaned];
}

/**
 * Stable deterministic FNV-1a hash for cache key versioning across client & server.
 */
export function hashSpeechScript(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
