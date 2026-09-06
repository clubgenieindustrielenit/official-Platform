"use client";

import React from "react";

interface RoleBadgeProps {
  role: "admin" | "membre_bureau" | "bureau" | "membre_actif" | "membre" | "senior" | "senior_member" | "membre_senior" | "alumni" | string;
  size?: "sm" | "md";
}

export default function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3.5 py-1 text-xs";
  const normalizedRole = role?.toLowerCase() || "";

  switch (normalizedRole) {
    case "admin":
      return (
        <span
          className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full bg-[#fca311] text-black shadow-[0_0_10px_rgba(252,163,17,0.3)] ${sizeClasses}`}
        >
          Admin
        </span>
      );
    case "membre_bureau":
    case "bureau":
      return (
        <span
          className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full bg-[#14213d] text-[#fca311] border border-[#fca311]/40 shadow-[0_0_10px_rgba(252,163,17,0.2)] ${sizeClasses}`}
        >
          Bureau
        </span>
      );
    case "senior":
    case "senior_member":
    case "membre_senior":
      return (
        <span
          className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)] ${sizeClasses}`}
        >
          Membre Senior
        </span>
      );
    case "alumni":
      return (
        <span
          className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)] ${sizeClasses}`}
        >
          Alumni
        </span>
      );
    case "membre_actif":
    case "actif":
    case "membre":
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/20 ${sizeClasses}`}
        >
          Membre Actif
        </span>
      );
  }
}
