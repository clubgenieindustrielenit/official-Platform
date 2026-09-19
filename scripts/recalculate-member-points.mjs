/**
 * Script: Recalculate Member Points & Clean Duplicate Log Entries
 * 
 * Usage:
 *   node scripts/recalculate-member-points.mjs
 * 
 * Required Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env / .env.local
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
  console.error("❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) sont requis.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROFILE_FIELD_REASONS = {
  avatar: "Profil complété : Photo de profil",
  cv: "Profil complété : CV ajouté",
  linkedin: "Profil complété : LinkedIn ajouté",
  prepa_section: "Profil complété : Section prépa renseignée",
  prepa_etablissement: "Profil complété : Établissement prépa renseigné",
  rang_concours: "Profil complété : Rang concours renseigné",
  annee_concours: "Profil complété : Année de concours renseignée",
};

async function runRecalculation() {
  console.log("🚀 Début du nettoyage et de la réévaluation des points membres...\n");

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("*");

  if (profErr) {
    console.error("❌ Erreur lors de la récupération des profils:", profErr);
    process.exit(1);
  }

  console.log(`📋 Total de profils à vérifier: ${profiles.length}\n`);

  let updatedCount = 0;

  for (const profile of profiles) {
    const memberName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email;
    const oldPoints = profile.points_total || 0;

    // 1. Determine expected profile completion points
    const expectedProfileFields = [];

    if (profile.avatar_url && String(profile.avatar_url).trim() !== "") {
      expectedProfileFields.push({ field: "avatar", amount: 5, reason: PROFILE_FIELD_REASONS.avatar });
    }
    if (profile.cv_url && String(profile.cv_url).trim() !== "") {
      expectedProfileFields.push({ field: "cv", amount: 10, reason: PROFILE_FIELD_REASONS.cv });
    }
    if (profile.linkedin_url && String(profile.linkedin_url).trim() !== "") {
      expectedProfileFields.push({ field: "linkedin", amount: 5, reason: PROFILE_FIELD_REASONS.linkedin });
    }
    if (profile.prepa_section && String(profile.prepa_section).trim() !== "") {
      expectedProfileFields.push({ field: "prepa_section", amount: 5, reason: PROFILE_FIELD_REASONS.prepa_section });
    }
    if (profile.prepa_etablissement && String(profile.prepa_etablissement).trim() !== "") {
      expectedProfileFields.push({ field: "prepa_etablissement", amount: 5, reason: PROFILE_FIELD_REASONS.prepa_etablissement });
    }
    if (profile.rang_concours !== null && profile.rang_concours !== undefined && String(profile.rang_concours).trim() !== "") {
      expectedProfileFields.push({ field: "rang_concours", amount: 5, reason: PROFILE_FIELD_REASONS.rang_concours });
    }

    const hasConcoursYear = Boolean(
      (profile.annee_concours && String(profile.annee_concours).trim() !== "") ||
      (profile.bio && String(profile.bio).trim() !== "") ||
      (profile.training_availability && String(profile.training_availability).trim() !== "")
    );
    if (hasConcoursYear) {
      expectedProfileFields.push({ field: "annee_concours", amount: 5, reason: PROFILE_FIELD_REASONS.annee_concours });
    }

    // 2. Fetch all points_log entries for this user
    const { data: logs, error: logErr } = await supabase
      .from("points_log")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });

    if (logErr) {
      console.warn(`⚠️ Erreur de lecture des logs pour ${memberName}:`, logErr);
      continue;
    }

    const profileCompletionReasons = new Set(Object.values(PROFILE_FIELD_REASONS));
    const nonProfileLogs = (logs || []).filter((l) => !profileCompletionReasons.has(l.reason) && !l.reason.startsWith("Profil modifié"));
    const profileLogs = (logs || []).filter((l) => profileCompletionReasons.has(l.reason));

    // Deduplicate profile completion logs
    const seenReasons = new Set();
    const idsToDelete = [];
    const keptProfileLogs = [];

    for (const pLog of profileLogs) {
      if (seenReasons.has(pLog.reason)) {
        idsToDelete.push(pLog.id);
      } else {
        seenReasons.add(pLog.reason);
        keptProfileLogs.push(pLog);
      }
    }

    // Delete redundant log IDs
    if (idsToDelete.length > 0) {
      await supabase.from("points_log").delete().in("id", idsToDelete);
    }

    // Insert missing profile completion logs
    const missingLogsToInsert = [];
    for (const exp of expectedProfileFields) {
      if (!seenReasons.has(exp.reason)) {
        missingLogsToInsert.push({
          user_id: profile.id,
          amount: exp.amount,
          reason: exp.reason,
        });
      }
    }

    if (missingLogsToInsert.length > 0) {
      await supabase.from("points_log").insert(missingLogsToInsert);
    }

    // 3. Recalculate total points
    const profilePtsTotal = expectedProfileFields.reduce((sum, item) => sum + item.amount, 0);
    const nonProfilePtsTotal = nonProfileLogs.reduce((sum, item) => sum + item.amount, 0);
    const newTotalPoints = Math.max(0, profilePtsTotal + nonProfilePtsTotal);

    // If points total or annee_concours changed, update profile
    const updatePayload = {};
    let needsUpdate = false;

    if (oldPoints !== newTotalPoints) {
      updatePayload.points_total = newTotalPoints;
      needsUpdate = true;
    }

    if (hasConcoursYear && (!profile.annee_concours || String(profile.annee_concours).trim() === "")) {
      const yearVal = profile.bio || profile.training_availability;
      if (yearVal) {
        updatePayload.annee_concours = String(yearVal).trim();
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await supabase.from("profiles").update(updatePayload).eq("id", profile.id);
      console.log(`✅ ${memberName} (${profile.id})`);
      console.log(`   Points: ${oldPoints} pts ➔ ${newTotalPoints} pts`);
      console.log(`   Logs supprimés (doublons): ${idsToDelete.length} | Logs ajoutés: ${missingLogsToInsert.length}`);
      updatedCount++;
    }
  }

  console.log("\n==========================================");
  console.log(`🎉 Réévaluation terminée ! ${updatedCount} profils ajustés.`);
  console.log("==========================================");
}

runRecalculation().catch((err) => {
  console.error("❌ Erreur inattendue:", err);
  process.exit(1);
});
