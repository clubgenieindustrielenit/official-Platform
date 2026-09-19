/**
 * Migration Script: Rename existing CV files in Supabase Storage and update profiles.cv_url
 * 
 * Usage:
 *   node scripts/migrate-cv-filenames.mjs
 * 
 * Required Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Attempt to load .env or .env.local if present
const envFiles = [".env.local", ".env"];
for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        const val = valParts.join("=").replace(/^["']|["']$/g, "").trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) sont requis dans l'environnement ou .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeFileNamePart(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateCvFileName(firstName, lastName, userId, oldPath) {
  let ext = "pdf";
  if (oldPath) {
    const cleanOld = oldPath.split("?")[0];
    const parts = cleanOld.split(".");
    if (parts.length > 1) {
      ext = parts.pop().toLowerCase().trim();
    }
  }

  // Preserve existing timestamp if present in old filename (e.g. cv-userId-1700000000.pdf)
  let timestamp = Date.now();
  const matchTs = oldPath?.match(/-(\d{10,14})\./);
  if (matchTs) {
    timestamp = matchTs[1];
  }

  const rawDisplayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const sanitizedDisplayName = sanitizeFileNamePart(rawDisplayName) || "Membre";
  const sanitizedUserId = sanitizeFileNamePart(userId) || userId;

  return `cv-${sanitizedDisplayName}-${sanitizedUserId}-${timestamp}.${ext}`;
}

function extractStoragePath(cvUrl) {
  if (!cvUrl) return null;
  const trimmed = cvUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    const urlObj = new URL(trimmed);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/storage/v1/object/public/cvs/");
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    // Fallback: get last segment
    return decodeURIComponent(pathname.split("/").pop());
  }

  let clean = trimmed.replace(/^\/+/, "");
  if (clean.startsWith("cvs/")) {
    clean = clean.substring(4);
  }
  return clean;
}

async function runMigration() {
  console.log("🚀 Début de la migration des fichiers CV...");

  // 1. Fetch profiles with non-empty cv_url
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, cv_url")
    .not("cv_url", "is", null);

  if (error) {
    console.error("❌ Erreur lors de la récupération des profils:", error);
    process.exit(1);
  }

  const profilesWithCv = (profiles || []).filter((p) => p.cv_url && p.cv_url.trim() !== "");
  console.log(`📋 Total de profils avec CV trouvés: ${profilesWithCv.length}`);

  let successCount = 0;
  let skippedCount = 0;
  let missingStorageCount = 0;

  for (const profile of profilesWithCv) {
    const oldPath = extractStoragePath(profile.cv_url);
    if (!oldPath) {
      console.warn(`⚠️ Path non valide pour profile ID ${profile.id}: ${profile.cv_url}`);
      skippedCount++;
      continue;
    }

    const newFileName = generateCvFileName(
      profile.first_name,
      profile.last_name,
      profile.id,
      oldPath
    );

    const fullPublicUrl = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/cvs/${encodeURIComponent(newFileName)}`;

    if (oldPath === newFileName && profile.cv_url === fullPublicUrl) {
      console.log(`ℹ️ Déjà à jour pour ${profile.first_name} ${profile.last_name} (${profile.id})`);
      skippedCount++;
      continue;
    }

    console.log(`🔄 Traitement de ${profile.first_name || ""} ${profile.last_name || ""} (${profile.id})...`);
    console.log(`   Ancien path: ${oldPath}`);
    console.log(`   Nouveau nom: ${newFileName}`);

    // Try moving the file in storage if paths differ
    if (oldPath !== newFileName) {
      const { error: moveErr } = await supabase.storage
        .from("cvs")
        .move(oldPath, newFileName);

      if (moveErr) {
        // If file move failed (e.g. object not found), try copying
        const { error: copyErr } = await supabase.storage
          .from("cvs")
          .copy(oldPath, newFileName);

        if (copyErr) {
          console.warn(`   ⚠️ Le fichier n'a pas pu être déplacé dans Storage (${moveErr.message || copyErr.message}). Mise à jour de l'URL DB uniquement.`);
          missingStorageCount++;
        } else {
          // Delete old copy
          await supabase.storage.from("cvs").remove([oldPath]);
        }
      }
    }

    // Update database record with new full public URL
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ cv_url: fullPublicUrl })
      .eq("id", profile.id);

    if (updateErr) {
      console.error(`   ❌ Erreur d'update DB pour ${profile.id}: ${updateErr.message}`);
    } else {
      console.log(`   ✅ Mis à jour avec succès -> ${fullPublicUrl}`);
      successCount++;
    }
  }

  console.log("\n==========================================");
  console.log("🎉 Migration terminée avec succès !");
  console.log(`   - Mis à jour : ${successCount}`);
  console.log(`   - Déjà conformes/Ignorés : ${skippedCount}`);
  console.log(`   - Objets Storage non trouvés : ${missingStorageCount}`);
  console.log("==========================================");
}

runMigration().catch((err) => {
  console.error("❌ Erreur inattendue:", err);
  process.exit(1);
});
