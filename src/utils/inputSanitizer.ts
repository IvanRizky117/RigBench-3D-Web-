/**
 * Aegis Client-Side Input Hardening & Anti-XSS Sanitizer (OWASP A05 & A08:2025).
 * Enforces strict length ceilings, strips HTML/script/event-handler payloads,
 * rejects control characters, and verifies binary file headers locally in-browser.
 */

export const MAX_ESSAY_CHARS = 2500;
export const MAX_SEARCH_CHARS = 120;
export const MAX_SHORT_TEXT_CHARS = 80;
export const MAX_GLB_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const UNSAFE_INJECTION_PATTERNS: RegExp[] = [
  /<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link|meta|form|input|base|math)\b/i,
  /\b(?:javascript|vbscript)\s*:/i,
  /\bdata\s*:\s*text\/html/i,
  /\bon(?:error|load|click|mouseover|focus|blur|input|submit|keydown|keyup|pointerdown)\s*=/i,
  /expression\s*\(/i,
];

const CONTROL_CHARS_MULTILINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const CONTROL_CHARS_SINGLELINE = /[\u0000-\u001F\u007F]/g;

export interface SanitizeResult {
  value: string;
  blockedInjection: boolean;
  truncated: boolean;
}

export function hasUnsafeInjectionPattern(raw: string): boolean {
  if (!raw) return false;
  return UNSAFE_INJECTION_PATTERNS.some((pattern) => pattern.test(raw));
}

export function sanitizeUserText(
  raw: string,
  maxLength: number = MAX_ESSAY_CHARS,
  allowNewlines = true
): SanitizeResult {
  const input = typeof raw === 'string' ? raw : '';
  const blockedInjection = hasUnsafeInjectionPattern(input);

  let cleaned = input.replace(
    allowNewlines ? CONTROL_CHARS_MULTILINE : CONTROL_CHARS_SINGLELINE,
    ''
  );

  // Strip full <script>/<style> blocks and any remaining HTML tag markup
  cleaned = cleaned
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/\b(?:javascript|vbscript)\s*:/gi, '')
    .replace(/\bdata\s*:\s*text\/html/gi, '')
    .replace(
      /\bon(?:error|load|click|mouseover|focus|blur|input|submit|keydown|keyup|pointerdown)\s*=/gi,
      ''
    );

  // Remove lone angle brackets that could resemble tag starts while keeping technical comparisons like ">2 TB" or "<2V"
  cleaned = cleaned.replace(/<\s*(?=[a-z/!?])/gi, '');

  const truncated = cleaned.length > maxLength;
  if (truncated) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return {
    value: cleaned,
    blockedInjection,
    truncated,
  };
}

export function sanitizeSearchQuery(raw: string): SanitizeResult {
  return sanitizeUserText(raw, MAX_SEARCH_CHARS, false);
}

/**
 * Verifies the 4-byte binary magic header ("glTF" = 0x67 0x6C 0x54 0x46) for .glb files
 * to prevent spoofed file uploads (OWASP A08:2025).
 */
export async function verifyGlbBinaryHeader(file: File): Promise<boolean> {
  try {
    const headerBuffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);
    if (bytes.length < 4) return false;
    return bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46;
  } catch {
    return false;
  }
}
