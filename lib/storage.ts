/**
 * Supabase Storage Utilities for CV and File Management
 */

/**
 * Normalizes a CV URL or path into a full, valid public HTTP/HTTPS URL.
 * Supports both legacy relative paths (e.g. "cv-123-456.pdf") and absolute URLs.
 */
export function getCvPublicUrl(cvUrl: string | null | undefined): string | null {
  if (!cvUrl || typeof cvUrl !== "string") {
    return null;
  }

  const trimmed = cvUrl.trim();
  if (!trimmed) {
    return null;
  }

  // 1. If already an absolute HTTP/HTTPS URL, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // 2. Extract path relative to the 'cvs' bucket
  let cleanPath = trimmed;
  
  // Remove leading slash or 'cvs/' prefix if present
  cleanPath = cleanPath.replace(/^\/+/, "");
  if (cleanPath.startsWith("cvs/")) {
    cleanPath = cleanPath.substring(4);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!baseUrl) {
    return cleanPath;
  }

  // Ensure baseUrl doesn't end with a trailing slash
  const formattedBaseUrl = baseUrl.replace(/\/+$/, "");

  // Encode path segments safely while preserving path structure if nested
  const encodedPath = cleanPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${formattedBaseUrl}/storage/v1/object/public/cvs/${encodedPath}`;
}

/**
 * Sanitizes a string for safe use in Storage filenames.
 * - Removes accents and diacritics
 * - Replaces non-alphanumeric characters with hyphens
 * - Consolidates consecutive hyphens and trims leading/trailing hyphens
 */
export function sanitizeFileNamePart(str: string): string {
  if (!str) return "";

  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/[^a-zA-Z0-9]/g, "-")  // Replace unsafe characters with hyphens
    .replace(/-+/g, "-")            // Consolidate multiple hyphens
    .replace(/^-+|-+$/g, "");       // Trim leading/trailing hyphens
}

/**
 * Generates a standardized CV filename:
 * cv-<Display-name>-<user-id>-<timestamp>.<ext>
 *
 * Example:
 * generateCvFileName("Ahmed", "Ben Ali", "user-123", "resume.pdf")
 * => "cv-Ahmed-Ben-Ali-user-123-1700000000000.pdf"
 */
export function generateCvFileName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  userId: string,
  originalFileNameOrExt: string,
  timestamp?: number
): string {
  // Extract file extension
  let ext = "pdf";
  if (originalFileNameOrExt) {
    const parts = originalFileNameOrExt.split(".");
    if (parts.length > 1) {
      ext = parts.pop()!.toLowerCase().trim();
    } else if (/^[a-zA-Z0-9]+$/.test(originalFileNameOrExt)) {
      ext = originalFileNameOrExt.toLowerCase().trim();
    }
  }

  // Construct display name
  const rawDisplayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const sanitizedDisplayName = sanitizeFileNamePart(rawDisplayName) || "Membre";

  const ts = timestamp || Date.now();
  const sanitizedUserId = sanitizeFileNamePart(userId) || userId;

  return `cv-${sanitizedDisplayName}-${sanitizedUserId}-${ts}.${ext}`;
}
