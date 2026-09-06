"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Handshake } from "lucide-react";

export interface PartnerLogo {
  id?: string;
  name: string;
  src: string;
  website_url?: string | null;
}

const DEFAULT_ROW_1: PartnerLogo[] = [
  { name: "WYNSYS", src: "/partners/wynsys.png" },
  { name: "SOTUVER", src: "/partners/sotuver.png" },
  { name: "Tunisie Telecom", src: "/partners/tt.png" },
  { name: "Masmoudi", src: "/partners/masmoudi.png" },
  { name: "BIAT", src: "/partners/biat.png" },
  { name: "Kilani Groupe", src: "/partners/kilani.png" },
  { name: "COFICAB", src: "/partners/coficab.png" },
];

const DEFAULT_ROW_2: PartnerLogo[] = [
  { name: "WEVIOO", src: "/partners/wevioo.png" },
  { name: "BONTAZ", src: "/partners/bontaz.png" },
  { name: "TPR Aluminium", src: "/partners/tpr.png" },
  { name: "TALYS", src: "/partners/talys.png" },
  { name: "Chez Soeurettes", src: "/partners/chez-soeurettes.png" },
  { name: "STB BANK", src: "/partners/stb.png" },
  { name: "APAVE", src: "/partners/apave.png" },
];

export default function PartnersMarquee() {
  const [row1, setRow1] = useState<PartnerLogo[]>(DEFAULT_ROW_1);
  const [row2, setRow2] = useState<PartnerLogo[]>(DEFAULT_ROW_2);

  useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch("/api/partners");
        if (res.ok) {
          const data = await res.json();
          if (data.row1 && data.row2 && data.row1.length > 0) {
            setRow1(
              data.row1.map((p: any) => ({
                id: p.id,
                name: p.name,
                src: p.logo_url,
                website_url: p.website_url,
              }))
            );
            setRow2(
              data.row2.map((p: any) => ({
                id: p.id,
                name: p.name,
                src: p.logo_url,
                website_url: p.website_url,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error loading partners:", err);
      }
    }
    loadPartners();
  }, []);

  // Repeat lists for seamless continuous infinite marquee
  const row1List = row1.length > 0 ? [...row1, ...row1, ...row1] : [];
  const row2List = row2.length > 0 ? [...row2, ...row2, ...row2] : [];

  if (row1List.length === 0 && row2List.length === 0) return null;

  return (
    <section id="partners" className="py-24 bg-black border-t border-custom-navy/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-custom-amber/5 blur-[160px] pointer-events-none rounded-full" />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-custom-navy/70 border border-custom-amber/30 text-custom-amber text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(252,163,17,0.12)]">
            <Handshake className="w-4 h-4 text-custom-amber" />
            <span>Partenaires &amp; Sponsors</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-custom-white tracking-tight leading-tight">
            Ils soutiennent nos initiatives
          </h2>

          <p className="text-sm sm:text-base text-custom-gray/70 leading-relaxed max-w-2xl mx-auto">
            Les leaders de l'industrie, de la technologie, de la banque et des services qui collaborent avec le Club Génie Industriel ENIT.
          </p>
        </motion.div>
      </div>

      {/* Constrained Width Double Row Marquee Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Left & Right gradient edge fades constrained to container */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-20" />

        <div className="space-y-6 overflow-hidden py-2">
          {/* Row 1 — Moving Left */}
          {row1List.length > 0 && (
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-5 sm:gap-7 items-center">
              {row1List.map((partner, index) => {
                const CardWrapper = partner.website_url ? "a" : "div";
                const wrapperProps = partner.website_url
                  ? {
                      href: partner.website_url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {};

                return (
                  <CardWrapper
                    key={`row1-${partner.name}-${index}`}
                    {...wrapperProps}
                    title={partner.name}
                    className="group flex items-center justify-center w-56 sm:w-64 h-28 sm:h-32 p-3 sm:p-4 rounded-2xl bg-white border border-custom-gray/10 shadow-md hover:shadow-[0_0_25px_rgba(252,163,17,0.3)] hover:border-custom-amber/60 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shrink-0 overflow-hidden"
                  >
                    <img
                      src={partner.src}
                      alt={partner.name}
                      loading="lazy"
                      className="h-full w-full max-h-[90%] max-w-[94%] object-contain filter group-hover:scale-108 transition-transform duration-300"
                    />
                  </CardWrapper>
                );
              })}
            </div>
          )}

          {/* Row 2 — Moving Right (Reverse) */}
          {row2List.length > 0 && (
            <div className="flex w-max animate-marquee-reverse hover:[animation-play-state:paused] gap-5 sm:gap-7 items-center">
              {row2List.map((partner, index) => {
                const CardWrapper = partner.website_url ? "a" : "div";
                const wrapperProps = partner.website_url
                  ? {
                      href: partner.website_url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {};

                return (
                  <CardWrapper
                    key={`row2-${partner.name}-${index}`}
                    {...wrapperProps}
                    title={partner.name}
                    className="group flex items-center justify-center w-56 sm:w-64 h-28 sm:h-32 p-3 sm:p-4 rounded-2xl bg-white border border-custom-gray/10 shadow-md hover:shadow-[0_0_25px_rgba(252,163,17,0.3)] hover:border-custom-amber/60 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shrink-0 overflow-hidden"
                  >
                    <img
                      src={partner.src}
                      alt={partner.name}
                      loading="lazy"
                      className="h-full w-full max-h-[90%] max-w-[94%] object-contain filter group-hover:scale-108 transition-transform duration-300"
                    />
                  </CardWrapper>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
