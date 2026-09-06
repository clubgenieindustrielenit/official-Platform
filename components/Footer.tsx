"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Linkedin, Instagram, Facebook, Mail, Cpu } from "lucide-react";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { logoUrl } = useSiteSettings();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <footer className="bg-black border-t border-custom-navy/60 pt-16 pb-8 relative overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-black border border-custom-amber/20 group-hover:border-custom-amber transition-colors">
                <img src={logoUrl} alt="CGI ENIT Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col">
                <span className="text-custom-white font-extrabold text-sm tracking-wide leading-none group-hover:text-custom-amber transition-colors">
                  CGI ENIT
                </span>
                <span className="text-[10px] text-custom-gray/50 uppercase tracking-widest mt-0.5">
                  Génie Industriel
                </span>
              </div>
            </Link>
            <p className="text-sm text-custom-gray/60 leading-relaxed max-w-xs">
              Le Club Génie Industriel de l'École Nationale d'Ingénieurs de Tunis forme les leaders de la supply chain, de la production et de l'excellence opérationnelle.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-custom-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 border-custom-amber pl-2">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#hero" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#about" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  À Propos & Historique
                </a>
              </li>
              <li>
                <a href="/#activities" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  Activités du Club
                </a>
              </li>
              <li>
                <a href="/#roadmaps" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  Roadmaps Industrielles
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Additional Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-custom-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 border-custom-amber pl-2">
              Ressources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#testimonials" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  Témoignages
                </a>
              </li>
              <li>
                <Link href="/activities" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  Toutes les activités
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-custom-gray/60 hover:text-custom-amber transition-colors">
                  Portail Membre
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact & Socials */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-custom-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 border-custom-amber pl-2">
              Nous suivre
            </h4>
            <p className="text-sm text-custom-gray/60 leading-relaxed">
              ENIT - BP 37, Le Belvédère, 1002 Tunis, Tunisie.
            </p>
            <div className="flex gap-4">
              {[
                { 
                  icon: <Linkedin className="w-4 h-4" />, 
                  href: "https://www.linkedin.com/company/club-g%C3%A9nie-industriel-enit/?viewAsMember=true",
                  label: "LinkedIn"
                },
                { 
                  icon: <Instagram className="w-4 h-4" />, 
                  href: "https://www.instagram.com/club.genieindustriel.enit?fbclid=IwY2xjawUJbqlwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMXZFQ3Yxdzg4amt5c0syTmhzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe5_pGM4k0_z8UfZjuZ5Zo1XfXP1lCY4GjzsizFfBSXj00qJrnDXk2BQBykB4_aem_jwpEJZ3i_k_i-zZE7-4rxQ",
                  label: "Instagram"
                },
                { 
                  icon: <Facebook className="w-4 h-4" />, 
                  href: "https://www.facebook.com/ClubGIEnit",
                  label: "Facebook"
                },
                { 
                  icon: <Mail className="w-4 h-4" />, 
                  href: "mailto:clubgenieindustrielenit@gmail.com",
                  label: "Email"
                }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target={social.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={social.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  aria-label={social.label}
                  whileHover={{ 
                    scale: 1.15,
                    backgroundColor: "#fca311",
                    color: "#000000",
                    boxShadow: "0 0 15px rgba(252, 163, 17, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg bg-custom-navy flex items-center justify-center text-custom-gray transition-colors duration-300 border border-custom-gray/5"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          variants={itemVariants}
          className="border-t border-custom-navy/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-custom-gray/40 text-center sm:text-left">
            &copy; {currentYear} Club Génie Industriel ENIT. Tous droits réservés.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
