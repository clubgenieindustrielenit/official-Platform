/**
 * lib/validation/fileUpload.ts
 *
 * Server-side file upload validation.
 *
 * Why magic-byte checking instead of trusting file.type?
 * - The browser-supplied MIME type (file.type) is user-controllable.
 * - An attacker can rename an SVG or HTML file as "logo.png" and submit it
 *   with Content-Type: image/png. Supabase Storage will serve whatever the
 *   uploader claims if we don't validate ourselves.
 * - SVG files can contain <script> tags → stored XSS when served without
 *   a restrictive Content-Security-Policy.
 */

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// File size limits
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_CAROUSEL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Magic byte signatures for allowed image types */
const MAGIC_BYTES: Array<{ mime: string; signature: number[] }> = [
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", signature: [0x47, 0x49, 0x46] },
  { mime: "image/webp", signature: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
];

/**
 * Detect MIME type from file magic bytes (first 8 bytes).
 * Returns the detected MIME string or null if unrecognised.
 */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const { mime, signature } of MAGIC_BYTES) {
    const matches = signature.every((byte, i) => buffer[i] === byte);
    if (matches) return mime;
  }
  return null;
}

export interface FileValidationResult {
  ok: true;
  buffer: Buffer;
  detectedMime: string;
  extension: string;
}

export interface FileValidationError {
  ok: false;
  error: string;
  status: number;
}

/**
 * Validates an uploaded File object:
 * 1. Size limit
 * 2. Declared MIME allowlist
 * 3. Magic-byte verification (prevents MIME spoofing)
 */
export async function validateImageFile(
  file: File,
  maxSizeBytes: number = MAX_LOGO_SIZE_BYTES
): Promise<FileValidationResult | FileValidationError> {
  // 1. Size check
  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / 1024 / 1024).toFixed(0);
    return {
      ok: false,
      error: `Le fichier dépasse la taille maximale autorisée (${maxMb} Mo).`,
      status: 413,
    };
  }

  // 2. Declared MIME allowlist
  const declaredMime = file.type?.toLowerCase();
  if (!declaredMime || !ALLOWED_IMAGE_MIME_TYPES.has(declaredMime)) {
    return {
      ok: false,
      error: "Type de fichier non autorisé. Seuls JPEG, PNG, WEBP et GIF sont acceptés.",
      status: 415,
    };
  }

  // 3. Magic-byte verification
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const detectedMime = detectMimeFromBuffer(buffer);

  if (!detectedMime) {
    return {
      ok: false,
      error: "Impossible de vérifier le type du fichier. Téléchargement refusé.",
      status: 415,
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(detectedMime)) {
    return {
      ok: false,
      error: "Le contenu du fichier ne correspond pas à un type d'image autorisé.",
      status: 415,
    };
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  return {
    ok: true,
    buffer,
    detectedMime,
    extension: extMap[detectedMime] ?? "bin",
  };
}
