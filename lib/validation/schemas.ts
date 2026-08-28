/**
 * lib/validation/schemas.ts
 * Centralised Zod schemas for all API request bodies.
 *
 * Rules:
 * - Use .strict() on every schema so unexpected extra fields are rejected
 *   (prevents mass-assignment / prototype pollution via surplus keys).
 * - Never trust client-supplied role / user_id for privileged operations;
 *   always derive identity from the server-side session.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const roleEnum = z.enum(["membre_actif", "membre_bureau", "admin"]);
export const statutMembreEnum = z.enum(["actif", "senior", "alumni"]);

// ---------------------------------------------------------------------------
// /api/admin/invite — POST
// ---------------------------------------------------------------------------
export const inviteSchema = z
  .object({
    email: z.string().email("Adresse e-mail invalide.").max(254),
    role: roleEnum,
    duration: z.number().int().min(1).max(365).optional().default(7),
    // created_by must NEVER come from the client — derive it from the session.
    // We accept it here only for legacy compatibility but ignore it server-side.
  })
  .strict();

// ---------------------------------------------------------------------------
// /api/auth/accept-invite — POST
// ---------------------------------------------------------------------------
export const acceptInviteSchema = z
  .object({
    token: z.string().uuid("Format de jeton invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(128),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// /api/auth/register — POST  (admin-only internal tool)
// ---------------------------------------------------------------------------
export const registerSchema = z
  .object({
    email: z.string().email().max(254),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(128),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    role: roleEnum.optional().default("membre_actif"),
    statutMembre: statutMembreEnum.optional().default("actif"),
    classe: z.string().max(20).optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-().]{6,20}$/, "Format de téléphone invalide.")
      .optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// /api/membre/profile — PUT
// ---------------------------------------------------------------------------
export const memberProfileSchema = z
  .object({
    first_name: z.string().min(1, "Prénom requis.").max(100).trim(),
    last_name: z.string().min(1, "Nom requis.").max(100).trim(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-().]{6,20}$/, "Format de téléphone invalide.")
      .trim(),
    classe: z.string().min(1, "Classe requise.").max(20),
    statut_membre: statutMembreEnum,
    // Optional fields
    avatar_url: z.string().url().max(2048).nullable().optional(),
    cv_url: z.string().url().max(2048).nullable().optional(),
    linkedin_url: z
      .string()
      .url("URL LinkedIn invalide.")
      .max(500)
      .nullable()
      .optional()
      .or(z.literal("")),
    prepa_section: z.string().max(100).nullable().optional(),
    prepa_etablissement: z.string().max(200).nullable().optional(),
    rang_concours: z.number().int().positive().nullable().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// /api/admin/points — POST
// ---------------------------------------------------------------------------
export const pointsSchema = z
  .object({
    user_id: z.string().uuid("Identifiant de membre invalide."),
    amount: z.number().int().min(-10000).max(10000),
    reason: z.string().min(1, "Le motif est requis.").max(300).trim(),
  })
  .strict();

// ---------------------------------------------------------------------------
// /api/calendar — POST
// ---------------------------------------------------------------------------
export const calendarEventSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis.").max(200).trim(),
    description: z.string().max(2000).optional(),
    type: z.enum(["event", "visit", "formation"]).default("event"),
    date_start: z.string().datetime({ message: "Date de début invalide." }),
    date_end: z.string().datetime().optional().nullable(),
    location: z.string().max(200).optional(),
    pole_id: z.string().uuid().optional().nullable(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a request body with a Zod schema.
 * Returns { data } on success or { error, status } on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, error: "Corps de la requête JSON invalide.", status: 400 };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map((e: { message: string }) => e.message).join(" ");
    return { ok: false, error: messages, status: 422 };
  }
  return { ok: true, data: result.data };
}
