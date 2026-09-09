-- ============================================================
-- TABLE testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_photo_url TEXT,
  quote TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alumni', 'professeur', 'partenaire', 'membre')),
  linkedin_url TEXT,
  approved BOOLEAN DEFAULT false,
  rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved testimonials" ON public.testimonials;
CREATE POLICY "Public can read approved testimonials"
  ON public.testimonials FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Authenticated users can manage testimonials" ON public.testimonials;
CREATE POLICY "Authenticated users can manage testimonials"
  ON public.testimonials FOR ALL USING (auth.role() = 'authenticated');

-- Storage bucket for testimonial photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read testimonials bucket" ON storage.objects;
CREATE POLICY "Public read testimonials bucket"
  ON storage.objects FOR SELECT USING (bucket_id = 'testimonials');

DROP POLICY IF EXISTS "Authenticated upload testimonials bucket" ON storage.objects;
CREATE POLICY "Authenticated upload testimonials bucket"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'testimonials' AND auth.role() = 'authenticated');

-- Storage bucket for developers photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('developers', 'developers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read developers bucket" ON storage.objects;
CREATE POLICY "Public read developers bucket"
  ON storage.objects FOR SELECT USING (bucket_id = 'developers');

DROP POLICY IF EXISTS "Authenticated upload developers bucket" ON storage.objects;
CREATE POLICY "Authenticated upload developers bucket"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'developers' AND auth.role() = 'authenticated');

-- ============================================================
-- TABLE site_content
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site content" ON public.site_content;
CREATE POLICY "Public can read site content"
  ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage site content" ON public.site_content;
CREATE POLICY "Authenticated users can manage site content"
  ON public.site_content FOR ALL USING (auth.role() = 'authenticated');

-- Initial data for site_content
INSERT INTO public.site_content (section, content) VALUES
('hero', '{
  "badge": "Club Génie Industriel • ENIT",
  "title": "PROFICIENCY IS OUR",
  "titleAccent": "CURRENCY",
  "subtitle": "Optimisez les flux, maîtrisez le Lean Six Sigma et pilotez l''industrie 4.0. Le point de rencontre des futurs ingénieurs experts en supply chain, production et innovation technologique de l''ENIT.",
  "cta1": "Découvrir le Club",
  "cta2": "Roadmaps Industrielles"
}')
ON CONFLICT (section) DO NOTHING;

INSERT INTO public.site_content (section, content) VALUES
('about', '{
  "title": "L''excellence du Génie Industriel à l''ENIT.",
  "description": "Fondée en 1882 pour sa structure historique d''ingénierie et reconnue dans toute l''Afrique, l''École Nationale d''Ingénieurs de Tunis (ENIT) abrite un département de Génie Industriel prestigieux. C''est dans ce terreau d''excellence que le Club Génie Industriel ENIT a vu le jour en 1989.",
  "stats": [
    { "value": "+70", "label": "Étudiants / promo" },
    { "value": "37 ans", "label": "D''existence" },
    { "value": "+500", "label": "Alumni actifs" }
  ]
}')
ON CONFLICT (section) DO NOTHING;

INSERT INTO public.site_content (section, content) VALUES
('why_us', '{
  "pillars": [
    { "icon": "Users", "title": "Team Spirit", "description": "Une cohésion d''équipe indéfectible. Nous croyons en la synergie des talents de l''ENIT pour accomplir de grandes choses ensemble." },
    { "icon": "Heart", "title": "Passion", "description": "L''amour de l''ingénierie et de l''optimisation. Nous cherchons constamment à repousser les limites de l''innovation industrielle." },
    { "icon": "Target", "title": "One Goal", "description": "Un seul objectif : l''excellence. Former les ingénieurs GI de demain à être prêts pour les défis du marché mondial." }
  ]
}')
ON CONFLICT (section) DO NOTHING;

INSERT INTO public.site_content (section, content) VALUES
('roadmaps', '{
  "items": [
    { "icon": "TrendingUp", "title": "Supply Chain & Logistique", "description": "L''art de piloter les flux physiques et d''information de bout en bout.", "skills": ["Gestion des stocks & Approvisionnements", "Transport, Distribution & Logistique Verte", "Global Supply Chain & S&OP"], "order": 0 },
    { "icon": "Factory", "title": "Gestion de Production", "description": "Planifier, ordonnancer et fabriquer en minimisant les gaspillages.", "skills": ["MRP / ERP & Ordonnancement", "Lean Manufacturing (Gaspillages, VSM)", "Système Juste-à-Temps & Kanban"], "order": 1 },
    { "icon": "ShieldCheck", "title": "Qualité & Amélioration Continue", "description": "Garantir la conformité et installer une culture d''amélioration permanente.", "skills": ["Méthodologie Six Sigma (DMAIC)", "Outils Lean (5S, Kaizen, SMED)", "Normes ISO 9001, 14001, 45001"], "order": 2 }
  ]
}')
ON CONFLICT (section) DO NOTHING;

INSERT INTO public.site_content (section, content) VALUES
('developers', '{
  "items": []
}')
ON CONFLICT (section) DO NOTHING;
