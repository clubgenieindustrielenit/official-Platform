-- MIGRATION: Add 5th Official Pole: Média

INSERT INTO public.poles (name, description, color, icon)
SELECT 'Média', 'Communication, création de contenu, couverture médiatique et design', '#ec4899', 'Camera'
WHERE NOT EXISTS (SELECT 1 FROM public.poles WHERE name = 'Média');
