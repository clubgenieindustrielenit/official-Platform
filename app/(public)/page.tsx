"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Users,
  Target,
  Heart,
  TrendingUp,
  Cpu,
  Linkedin,
  ArrowUpRight,
  Workflow,
  ShieldCheck,
  LineChart,
  Lightbulb,
  Factory,
  ChevronRight,
  ClipboardList,
  Megaphone,
  Pin,
  CalendarDays,
} from "lucide-react";
import HeroBackgroundCarousel from "@/components/home/HeroBackgroundCarousel";
import ClubActivitiesSection from "@/components/home/ClubActivitiesSection";
import PartnersMarquee from "@/components/home/PartnersMarquee";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { createClient } from "@/lib/supabase/client";

// Types
interface Roadmap {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  topics: string[];
  tools: string[];
  role: string;
}

export default function HomePage() {
  const supabase = createClient();
  const [activeRoadmap, setActiveRoadmap] = useState<string>("supply");
  const { logoUrl } = useSiteSettings();

  // Testimonials state
  const [testimonials, setTestimonials] = useState<{
    id: string;
    quote: string;
    author: string;
    role?: string | null;
    avatar?: string | null;
  }[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await fetch("/api/public/testimonials");
        const data = await res.json();
        if (res.ok && data.testimonials) {
          setTestimonials(data.testimonials);
        }
      } catch (err) {
        console.error("Failed to load testimonials:", err);
      } finally {
        setLoadingTestimonials(false);
      }
    }
    loadTestimonials();
  }, []);

  // Animation variants
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const cardHoverEffect = {
    y: -8,
    scale: 1.02,
    borderColor: "rgba(252, 163, 17, 0.4)",
    boxShadow: "0 10px 30px -10px rgba(252, 163, 17, 0.15), 0 0 25px 2px rgba(252, 163, 17, 0.05)",
  };

  // Why Us Cards
  const whyUs = [
    {
      title: "Team Spirit",
      description: "Une cohésion d'équipe indéfectible. Nous croyons en la synergie des talents de l'ENIT pour accomplir de grandes choses ensemble.",
      icon: <Users className="w-8 h-8 text-custom-amber" />,
    },
    {
      title: "Passion",
      description: "L'amour de l'ingénierie et de l'optimisation. Nous cherchons constamment à repousser les limites de l'innovation industrielle.",
      icon: <Heart className="w-8 h-8 text-custom-amber" />,
    },
    {
      title: "One Goal",
      description: "Un seul objectif : l'excellence. Former les ingénieurs GI de demain à être prêts pour les défis du marché mondial.",
      icon: <Target className="w-8 h-8 text-custom-amber" />,
    },
  ];

  // Activities Cards
  const activities = [
    {
      title: "Workshops Industriels",
      description: "Ateliers techniques animés par des experts du secteur sur des thématiques clés comme la gestion des stocks, la planification (MRP) et la simulation.",
      icon: <Workflow className="w-10 h-10 text-custom-amber" />,
      tag: "Technique"
    },
    {
      title: "Études de Cas & Hackathons",
      description: "Défis de résolution de problèmes réels d'entreprises. Les membres collaborent pour concevoir des solutions innovantes sous pression.",
      icon: <Lightbulb className="w-10 h-10 text-custom-amber" />,
      tag: "Compétition"
    },
    {
      title: "Visites d'Usines & Networking",
      description: "Visites immersives dans des multinationales et des industries locales majeures pour observer de près les lignes de production et réseauter.",
      icon: <Factory className="w-10 h-10 text-custom-amber" />,
      tag: "Immersion"
    },
    {
      title: "Formations Lean Six Sigma",
      description: "Sessions de formation menant à des certifications (Green Belt / Yellow Belt) indispensables pour la gestion de la qualité et l'amélioration continue.",
      icon: <ShieldCheck className="w-10 h-10 text-custom-amber" />,
      tag: "Certification"
    },
  ];

  // Industrial Roadmaps Data
  const roadmaps: Roadmap[] = [
    {
      id: "supply",
      title: "Supply Chain & Logistique",
      description: "L'art de piloter les flux physiques et d'information de bout en bout avec une efficacité maximale et des coûts optimisés.",
      icon: <TrendingUp className="w-6 h-6" />,
      topics: ["Gestion des stocks & Approvisionnements", "Transport, Distribution & Logistique Verte", "Global Supply Chain & S&OP"],
      tools: ["SAP ERP", "Advanced Planning & Scheduling (APS)", "Logiciels de routage (VRP)"],
      role: "Supply Chain Manager, Ingénieur Logistique"
    },
    {
      id: "production",
      title: "Gestion de Production",
      description: "Planifier, ordonnancer et fabriquer en minimisant les gaspillages et en maximisant la productivité.",
      icon: <Factory className="w-6 h-6" />,
      topics: ["MRP / ERP & Ordonnancement", "Lean Manufacturing (Gaspillages, VSM)", "Système Juste-à-Temps & Kanban"],
      tools: ["Jira / Trello", "MS Project / Primavera", "Systèmes MES (Manufacturing Execution Systems)"],
      role: "Responsable Production, Ingénieur Méthodes"
    },
    {
      id: "quality",
      title: "Qualité & Amélioration Continue",
      description: "Garantir la conformité et installer une culture d'amélioration permanente pour atteindre le zéro défaut.",
      icon: <ShieldCheck className="w-6 h-6" />,
      topics: ["Méthodologie Six Sigma (DMAIC)", "Outils Lean (5S, Kaizen, SMED, Poka-Yoke)", "Normes ISO 9001, 14001, 45001"],
      tools: ["Minitab (Analyse statistique)", "Diagramme d'Ishikawa / Pareto", "FMEA (AMDEC)"],
      role: "Ingénieur Qualité, Black Belt Lean Six Sigma"
    },
    {
      id: "ro",
      title: "Recherche Opérationnelle",
      description: "Utiliser les mathématiques appliquées et l'informatique pour prendre les meilleures décisions possibles.",
      icon: <LineChart className="w-6 h-6" />,
      topics: ["Modélisation mathématique & Optimisation", "Simulation de flux et d'événements discrets", "Théorie des graphes & Aide à la décision"],
      tools: ["Python (PuLP, SciPy)", "Gurobi / CPLEX", "Arena / FlexSim (Simulation de flux)"],
      role: "Ingénieur R&D, Data Analyst Industriel"
    },
    {
      id: "industry",
      title: "Industrie 4.0 & Maintenance",
      description: "Intégrer le digital au cœur de l'usine physique pour la rendre intelligente, flexible et prédictive.",
      icon: <Cpu className="w-6 h-6" />,
      topics: ["Smart Factory & IoT Industriel", "Maintenance Prédictive & GMAO", "Jumeaux numériques (Digital Twins)"],
      tools: ["Node-RED / Plateformes IoT", "Logiciels GMAO", "SCADA & Automates Programmables (API)"],
      role: "Ingénieur Industrie 4.0, Responsable Maintenance"
    },
    {
      id: "project",
      title: "Gestion de Projets & Économie",
      description: "Piloter des projets complexes multidisciplinaires en maîtrisant les budgets, les délais et les risques.",
      icon: <ClipboardList className="w-6 h-6" />,
      topics: ["Management de projet (PMBOK, Agile/Scrum)", "Gestion des risques industriels & financiers", "Ingénierie financière & Analyse de rentabilité"],
      tools: ["MS Project", "Analyse de sensibilité financière", "Matrice de criticité (Risk Register)"],
      role: "Chef de Projet Industriel, Auditeur de processus"
    }
  ];

  // Developers
  const developers = [
    {
      name: "Khalil Ksibi",
      role: "Resp. Projets & Formations (Mandat 26/27)",
      bio: "Étudiant en Génie Industriel à l'ENIT. Développeur de la plateforme et responsable des projets et des formations techniques du club.",
      linkedIn: "https://www.linkedin.com/in/khalil-ksibi-015198377/",
      avatar: "KK"
    },
    {
      name: "Seif Elouaer",
      role: "Président du Club GI ENIT (Mandat 26/27)",
      bio: "Étudiant en Génie Industriel à l'ENIT. Pilote de la vision stratégique et président engagé pour le rayonnement et l'innovation du club.",
      linkedIn: "https://www.linkedin.com/in/seif-elouaer-693975218/",
      avatar: "SE"
    },
    {
      name: "Bacem Garrouch",
      role: "Senior Member",
      bio: "Étudiant en Génie Industriel à l'ENIT. Développeur et contributeur technique senior dédié à l'excellence technologique du club.",
      linkedIn: "https://www.linkedin.com/in/bacem-garrouch-771a45280/",
      avatar: "BG"
    }
  ];

  return (
    <div className="bg-black text-custom-gray overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
        {/* Dynamic Admin-Managed Hero Background Carousel */}
        <HeroBackgroundCarousel />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
        >
          {/* Badge */}
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-custom-amber/40 text-custom-amber text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(252,163,17,0.15)]"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-custom-amber/30 flex-shrink-0 bg-[#121414]">
              <img src={logoUrl} alt="CGI" className="w-full h-full object-contain p-0.5" />
            </div>
            <span>Club Génie Industriel • ENIT</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
          >
            WE MAKE THINGS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-custom-amber via-yellow-500 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              BETTER
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={fadeInUp}
            className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-medium"
          >
            Optimisez les flux, maîtrisez le Lean Six Sigma et pilotez l'industrie 4.0. Le point de rencontre des futurs ingénieurs experts en supply chain, production et innovation technologique de l'ENIT.
          </motion.p>

          {/* Action Buttons */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <motion.a
              href="#about"
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(252,163,17,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-custom-amber text-custom-black font-extrabold text-base tracking-wide hover:bg-custom-amber/90 transition-all duration-300 shadow-[0_0_20px_rgba(252,163,17,0.2)]"
            >
              <span>Découvrir le Club</span>
            </motion.a>
            <motion.a
              href="#roadmaps"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(252,163,17,0.08)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-custom-amber text-custom-amber font-extrabold text-base tracking-wide transition-all duration-300"
            >
              <span>Roadmaps Industrielles</span>
              <ChevronRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce cursor-pointer z-10"
        >
          <span className="text-[10px] text-custom-gray/40 uppercase tracking-widest">Faire défiler</span>
          <div className="w-1.5 h-6 bg-custom-amber/30 rounded-full flex justify-center pt-1">
            <div className="w-1 h-2 bg-custom-amber rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* 2. WHY US SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-8 border-t border-custom-navy/20 relative z-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {whyUs.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={cardHoverEffect}
              className="bg-custom-navy p-8 rounded-3xl border border-custom-gray/10 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-6 border border-custom-gray/10 group-hover:border-custom-amber/30 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-custom-white font-extrabold text-xl mb-3 tracking-wide group-hover:text-custom-amber transition-colors">
                {item.title}
              </h3>
              <p className="text-custom-gray/70 text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. ABOUT US & HISTORY SECTION */}
      <section id="about" className="py-24 bg-black border-t border-custom-navy/20 relative">
        <div className="absolute right-0 top-1/4 w-[350px] h-[350px] rounded-full bg-custom-navy/20 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-custom-amber border-l-2 border-custom-amber pl-2">
                Qui sommes-nous ?
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-custom-white tracking-tight leading-tight">
                L'excellence du Génie Industriel à l'ENIT.
              </h2>
              <p className="text-base sm:text-lg text-custom-gray/70 leading-relaxed">
                Fondée le <strong className="text-custom-white">31 décembre 1968</strong> (par la loi n° 68-41) sous l'impulsion de son fondateur et premier directeur <strong className="text-custom-white">Mokhtar Latiri</strong>, l'École Nationale d'Ingénieurs de Tunis (ENIT) est la doyenne des écoles d'ingénieurs technologiques de Tunisie. Implantée au sein du campus universitaire d'El Manar (Université de Tunis - El Manar), elle abrite un département de <strong className="text-custom-white">Génie Industriel</strong> d'élite. C'est dans ce cadre d'excellence que le <strong className="text-custom-white">Club Génie Industriel ENIT</strong> a vu le jour en 1989.
              </p>
              <p className="text-sm text-custom-gray/60 leading-relaxed">
                Notre mission est d'outiller les étudiants en génie industriel avec des compétences pratiques recherchées par le marché : la gestion de projets complexes, l'optimisation mathématique des flux logistiques, le déploiement du Lean Six Sigma, et la transition vers l'industrie 4.0. Nous unissons théorie académique et défis d'ingénierie pratiques pour forger la future élite industrielle.
              </p>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-6 pt-6">
                {[
                  { value: "+70", label: "Étudiants / promo" },
                  { value: "37 ans", label: "D'existence (Club)" },
                  { value: "+500", label: "Alumni actifs" }
                ].map((metric, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05, borderColor: "rgba(252, 163, 17, 0.3)" }}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-custom-navy border border-custom-gray/5 transition-all duration-300 text-center sm:text-left"
                  >
                    <div className="text-xl sm:text-3xl font-extrabold text-custom-amber">{metric.value}</div>
                    <div className="text-[9px] sm:text-xs text-custom-gray/40 uppercase tracking-wider mt-1">{metric.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual Box — ENIT Photo */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 relative"
            >
              <motion.div 
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(252, 163, 17, 0.15)" }}
                transition={{ duration: 0.3 }}
                className="w-full aspect-square rounded-3xl border border-custom-gray/10 overflow-hidden relative group cursor-pointer"
              >
                {/* ENIT Gate Photo */}
                <img
                  src="/enit-gate.jpg"
                  alt="École Nationale d'Ingénieurs de Tunis"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-mono text-custom-amber tracking-widest bg-black/70 backdrop-blur-sm border border-custom-amber/30 px-3 py-1.5 rounded-full">
                    ENIT • EST. 1968
                  </span>
                </div>

                {/* Club logo badge — top left */}
                <div className="absolute top-4 left-4 w-12 h-12 rounded-xl overflow-hidden border border-custom-amber/30 shadow-[0_0_15px_rgba(252,163,17,0.2)]">
                  <img src="/logo-cgi.jpg" alt="CGI ENIT" className="w-full h-full object-cover" />
                </div>

                {/* Bottom glass info panel */}
                <div className="absolute bottom-0 left-0 right-0 p-5 backdrop-blur-sm bg-black/50 border-t border-custom-amber/10">
                  <h3 className="text-base font-black text-custom-white leading-snug mb-2">École Nationale d'Ingénieurs de Tunis</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-custom-gray/50 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-custom-amber rounded-full inline-block" />Optimization</span>
                    <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-custom-amber rounded-full inline-block" />Lean Thinking</span>
                    <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-custom-amber rounded-full inline-block" />Supply Chain</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. CLUB ACTIVITIES SECTION */}
      <ClubActivitiesSection />

      {/* 5. INDUSTRIAL ROADMAPS SECTION (INTERACTIVE) */}
      <section id="roadmaps" className="py-24 bg-black border-t border-custom-navy/20 relative">
        <div className="absolute left-0 bottom-1/4 w-[350px] h-[350px] rounded-full bg-custom-navy/20 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-custom-amber border-l-2 border-custom-amber px-2">
              Parcours Professionnels
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-custom-white tracking-tight">
              Roadmaps Industrielles
            </h2>
            <p className="text-sm text-custom-gray/60 leading-relaxed">
              Explorez les grandes disciplines du Génie Industriel à travers nos feuilles de route interactives décrivant les concepts-clés et outils à maîtriser.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Selection Grid (Sidebar on Desktop, Grid on Mobile) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4"
            >
              {roadmaps.map((rm) => (
                <motion.button
                  key={rm.id}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveRoadmap(rm.id)}
                  className={`p-5 rounded-2xl flex items-center justify-between text-left border transition-all duration-300 cursor-pointer ${
                    activeRoadmap === rm.id
                      ? "bg-custom-amber text-custom-black border-custom-amber font-extrabold shadow-[0_0_20px_rgba(252,163,17,0.15)]"
                      : "bg-custom-navy text-custom-gray border-custom-gray/10 hover:border-custom-amber/40 hover:bg-custom-navy/80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        activeRoadmap === rm.id ? "bg-custom-black text-custom-amber" : "bg-black text-custom-gray"
                      }`}
                    >
                      {rm.icon}
                    </div>
                    <span className="text-sm font-semibold tracking-wide">{rm.title}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-60" />
                </motion.button>
              ))}
            </motion.div>

            {/* Display Detailed Container */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <AnimatePresence mode="wait">
                {roadmaps
                  .filter((rm) => rm.id === activeRoadmap)
                  .map((rm) => (
                    <motion.div
                      key={rm.id}
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="bg-custom-navy p-8 sm:p-10 rounded-3xl border border-custom-gray/10 shadow-2xl relative overflow-hidden"
                    >
                      {/* Glowing background inside card */}
                      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-custom-amber/5 blur-3xl pointer-events-none" />

                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-black border border-custom-amber/20 flex items-center justify-center text-custom-amber">
                          {rm.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-extrabold text-custom-white leading-tight">
                            {rm.title}
                          </h3>
                          <p className="text-xs font-semibold text-custom-amber mt-1 font-mono uppercase tracking-wider">
                            Métier cible : {rm.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-custom-gray/70 leading-relaxed mb-8">
                        {rm.description}
                      </p>

                      {/* Topics Grid */}
                      <div className="mb-8">
                        <h4 className="text-custom-white text-sm uppercase tracking-wider font-extrabold mb-4 border-b border-custom-gray/5 pb-2">
                          Concepts clés à maîtriser
                        </h4>
                        <ul className="space-y-3">
                          {rm.topics.map((topic, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-custom-gray/80">
                              <span className="w-1.5 h-1.5 bg-custom-amber rounded-full flex-shrink-0" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tools & Tech Chips */}
                      <div>
                        <h4 className="text-custom-white text-sm uppercase tracking-wider font-extrabold mb-4">
                          Outils & Systèmes clés
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {rm.tools.map((tool, i) => (
                            <motion.span
                              key={i}
                              whileHover={{ scale: 1.08, borderColor: "rgba(252,163,17,0.4)" }}
                              className="text-xs font-mono font-semibold px-3.5 py-1.5 rounded-lg bg-black border border-custom-gray/10 text-custom-gray/80 transition-colors duration-300"
                            >
                              {tool}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-24 bg-black border-t border-custom-navy/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-custom-amber border-l-2 border-custom-amber px-2">
              Témoignages
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-custom-white tracking-tight">
              Ils parlent de nous
            </h2>
            <p className="text-sm text-custom-gray/60 leading-relaxed">
              Ce que disent nos enseignants, nos partenaires de l'industrie et nos anciens membres.
            </p>
          </motion.div>

          {loadingTestimonials ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-custom-navy/60 p-8 rounded-3xl border border-custom-gray/10 animate-pulse space-y-6"
                >
                  <div className="w-8 h-8 rounded-full bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded-md w-full" />
                    <div className="h-4 bg-white/5 rounded-md w-5/6" />
                    <div className="h-4 bg-white/5 rounded-md w-3/4" />
                  </div>
                  <div className="flex items-center gap-4 pt-6 border-t border-custom-gray/5">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-white/10 rounded w-1/2" />
                      <div className="h-2.5 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 bg-custom-navy/30 rounded-3xl border border-custom-navy/40 max-w-xl mx-auto p-8">
              <span className="text-4xl text-custom-amber/40 block mb-2 font-serif">“</span>
              <p className="text-sm text-custom-gray/60 italic">
                De nouveaux témoignages de nos partenaires et anciens membres seront publiés prochainement.
              </p>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((test, index) => (
                <motion.div
                  key={test.id || index}
                  variants={fadeInUp}
                  whileHover={cardHoverEffect}
                  className="bg-custom-navy p-8 rounded-3xl border border-custom-gray/10 flex flex-col justify-between transition-all duration-300 cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Quote Icon */}
                    <span className="text-6xl text-custom-amber/20 font-serif leading-none select-none">“</span>
                    <p className="text-sm text-custom-gray/70 leading-relaxed italic -mt-6">
                      {test.quote}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-8 border-t border-custom-gray/5 mt-6">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-black border border-custom-amber/20 flex items-center justify-center text-custom-amber font-extrabold text-sm shrink-0">
                      {test.avatar || (test.author ? test.author.substring(0, 2).toUpperCase() : "CG")}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-custom-white font-bold text-sm leading-tight truncate">
                        {test.author}
                      </h4>
                      {test.role && (
                        <p className="text-[10px] text-custom-gray/50 mt-0.5 truncate">
                          {test.role}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* 7. PARTNERS / SPONSORS MARQUEE (LOGOS3) */}
      <PartnersMarquee />

      {/* 8. WEBSITE DEVELOPERS SECTION */}
      <section id="developers" className="py-24 bg-black border-t border-custom-navy/20 relative">
        <div className="absolute right-0 bottom-0 w-[250px] h-[250px] bg-custom-navy/10 blur-[90px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-custom-amber border-l-2 border-custom-amber px-2">
              Créateurs
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-custom-white tracking-tight">
              Website Developers
            </h2>
            <p className="text-sm text-custom-gray/60 leading-relaxed">
              La vitrine de l'équipe étudiante ayant conçu et déployé la plateforme officielle du Club Génie Industriel ENIT.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {developers.map((dev, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
                className="bg-custom-navy p-8 rounded-3xl border border-custom-gray/10 transition-all duration-300 group text-center flex flex-col items-center justify-between cursor-pointer"
              >
                <div className="space-y-4 flex flex-col items-center">
                  {/* Circle Avatar */}
                  <div className="w-20 h-20 rounded-full bg-black border-2 border-custom-gray/10 group-hover:border-custom-amber flex items-center justify-center text-custom-white text-2xl font-black transition-all duration-300">
                    {dev.avatar}
                  </div>
                  <div>
                    <h3 className="text-custom-white font-extrabold text-lg tracking-wide">
                      {dev.name}
                    </h3>
                    <p className="text-xs text-custom-amber font-semibold font-mono tracking-wider mt-1">
                      {dev.role}
                    </p>
                  </div>
                  <p className="text-xs text-custom-gray/60 leading-relaxed">
                    {dev.bio}
                  </p>
                </div>

                <motion.a
                  href={dev.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, backgroundColor: "#fca311", color: "#000000", borderColor: "#fca311" }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-black border border-custom-gray/10 text-custom-gray/80 text-xs font-bold tracking-wider transition-all duration-300 mt-6"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </motion.a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
