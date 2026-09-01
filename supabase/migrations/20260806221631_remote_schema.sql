-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP EXTENSION IF EXISTS pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.activity_status AS ENUM (
  'draft',
  'published',
  'cancelled',
  'done'
);

CREATE TYPE public.activity_type AS ENUM (
  'event',
  'visit',
  'formation'
);

CREATE TYPE public.member_role AS ENUM (
  'member',
  'pole_lead',
  'admin',
  'membre_bureau',
  'bureau',
  'membre_actif',
  'membre'
);

CREATE TYPE public.project_status AS ENUM (
  'planned',
  'in_progress',
  'paused',
  'done'
);

CREATE TYPE public.registration_status AS ENUM (
  'confirmed',
  'waitlisted',
  'cancelled'
);

CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'done'
);

CREATE FUNCTION public.award_attendance_points()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$ declare
  v_type activity_type;
  v_points integer;
begin
  if new.attended = true and old.attended is distinct from true and new.points_awarded = false then
    select type into v_type from activities where id = new.activity_id;

    v_points := case v_type
      when 'event' then 5
      when 'visit' then 5
      when 'formation' then 8
      else 0
    end;

    insert into points_log (user_id, amount, reason, related_activity_id)
    values (new.user_id, v_points, 'Présence - ' || v_type::text, new.activity_id);

    update profiles set points_total = points_total + v_points where id = new.user_id;

    new.points_awarded := true;
  end if;

  return new;
end;
 $function$;

GRANT ALL ON FUNCTION public.award_attendance_points() TO anon;

GRANT ALL ON FUNCTION public.award_attendance_points() TO authenticated;

GRANT ALL ON FUNCTION public.award_attendance_points() TO service_role;

CREATE FUNCTION public.award_project_completion_points()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$ declare
  v_member record;
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    for v_member in
      select user_id from project_members where project_id = new.id
    loop
      insert into points_log (user_id, amount, reason, related_project_id)
      values (v_member.user_id, 15, 'Projet terminé', new.id);

      update profiles set points_total = points_total + 15 where id = v_member.user_id;
    end loop;
  end if;

  return new;
end;
 $function$;

GRANT ALL ON FUNCTION public.award_project_completion_points() TO anon;

GRANT ALL ON FUNCTION public.award_project_completion_points() TO authenticated;

GRANT ALL ON FUNCTION public.award_project_completion_points() TO service_role;

CREATE FUNCTION public.award_project_join_points()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$ begin
  insert into points_log (user_id, amount, reason, related_project_id)
  values (new.user_id, 3, 'Rejoint un projet', new.project_id);

  update profiles set points_total = points_total + 3 where id = new.user_id;
  new.points_awarded := true;

  return new;
end;
 $function$;

GRANT ALL ON FUNCTION public.award_project_join_points() TO anon;

GRANT ALL ON FUNCTION public.award_project_join_points() TO authenticated;

GRANT ALL ON FUNCTION public.award_project_join_points() TO service_role;

CREATE FUNCTION public.cancel_registration (
  p_registration_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$ declare
  v_activity_id uuid;
  v_was_confirmed boolean;
  v_next_waitlisted uuid;
begin
  select activity_id, (status = 'confirmed')
    into v_activity_id, v_was_confirmed
  from event_registrations
  where id = p_registration_id and user_id = auth.uid();

  update event_registrations
  set status = 'cancelled'
  where id = p_registration_id;

  if v_was_confirmed then
    select id into v_next_waitlisted
    from event_registrations
    where activity_id = v_activity_id and status = 'waitlisted'
    order by queue_position asc
    limit 1;

    if v_next_waitlisted is not null then
      update event_registrations
      set status = 'confirmed', queue_position = null
      where id = v_next_waitlisted;
    end if;
  end if;
end;
 $function$;

GRANT ALL ON FUNCTION public.cancel_registration(uuid) TO anon;

GRANT ALL ON FUNCTION public.cancel_registration(uuid) TO authenticated;

GRANT ALL ON FUNCTION public.cancel_registration(uuid) TO service_role;

CREATE FUNCTION public.current_member_role()
  RETURNS public.member_role
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $function$   select role from profiles where id = auth.uid();
 $function$;

GRANT ALL ON FUNCTION public.current_member_role() TO anon;

GRANT ALL ON FUNCTION public.current_member_role() TO authenticated;

GRANT ALL ON FUNCTION public.current_member_role() TO service_role;

CREATE FUNCTION public.current_pole()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  AS $function$   select pole_id from profiles where id = auth.uid();
 $function$;

GRANT ALL ON FUNCTION public.current_pole() TO anon;

GRANT ALL ON FUNCTION public.current_pole() TO authenticated;

GRANT ALL ON FUNCTION public.current_pole() TO service_role;

CREATE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (
    id, 
    email,
    first_name, 
    last_name, 
    role, 
    points_total
  )
  values (
    new.id,
    new.email, -- PULLING EMAIL DIRECTLY FROM AUTH
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    'member',
    0
  );
  return new;
end;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;

GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;

GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;

CREATE TABLE public.activities (
  id                    uuid                     DEFAULT gen_random_uuid() NOT NULL,
  type                  public.activity_type     NOT NULL,
  title                 text                     NOT NULL,
  description           text,
  location              text,
  date_start            timestamp with time zone NOT NULL,
  date_end              timestamp with time zone,
  capacity              integer,
  prerequisites         text,
  pole_id               uuid,
  status                public.activity_status   DEFAULT 'published'::public.activity_status NOT NULL,
  cover_image_url       text,
  recap_url             text,
  training_material_url text,
  trainer_name          text,
  created_by            uuid                     NOT NULL,
  created_at            timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.activities
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_pkey PRIMARY KEY (id);

GRANT ALL ON public.activities TO anon;

GRANT ALL ON public.activities TO authenticated;

GRANT ALL ON public.activities TO service_role;

CREATE INDEX idx_activities_pole ON public.activities (pole_id);

CREATE INDEX idx_activities_type ON public.activities (TYPE);

CREATE INDEX idx_activities_date ON public.activities (date_start);

CREATE POLICY activities_select_all ON public.activities
  FOR SELECT
  USING (true);

CREATE POLICY activities_write_lead_or_admin ON public.activities
  USING (((public.current_member_role() = 'admin'::public.member_role) OR ((public.current_member_role() = 'pole_lead'::public.member_role) AND (pole_id = public.current_pole()))));

CREATE TABLE public.announcements (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  title      text                     NOT NULL,
  excerpt    text,
  content    text                     NOT NULL,
  pole_id    uuid,
  pinned     boolean                  DEFAULT false NOT NULL,
  created_by uuid                     NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);

GRANT ALL ON public.announcements TO anon;

GRANT ALL ON public.announcements TO authenticated;

GRANT ALL ON public.announcements TO service_role;

CREATE POLICY announcements_select_all ON public.announcements
  FOR SELECT
  USING (true);

CREATE POLICY announcements_write_lead_or_admin ON public.announcements
  USING (((public.current_member_role() = 'admin'::public.member_role) OR ((public.current_member_role() = 'pole_lead'::public.member_role) AND (pole_id = public.current_pole()))));

CREATE TABLE public.event_registrations (
  id             uuid                       DEFAULT gen_random_uuid() NOT NULL,
  activity_id    uuid                       NOT NULL,
  user_id        uuid                       NOT NULL,
  status         public.registration_status DEFAULT 'confirmed'::public.registration_status NOT NULL,
  queue_position integer,
  registered_at  timestamp with time zone   DEFAULT now() NOT NULL,
  attended       boolean,
  points_awarded boolean                    DEFAULT false NOT NULL
);

CREATE FUNCTION public.register_to_activity (
  p_activity_id uuid
)
  RETURNS public.event_registrations
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$ declare
  v_capacity integer;
  v_confirmed_count integer;
  v_status registration_status;
  v_position integer;
  v_result event_registrations;
begin
  select capacity into v_capacity from activities where id = p_activity_id;

  select count(*) into v_confirmed_count
  from event_registrations
  where activity_id = p_activity_id and status = 'confirmed';

  if v_capacity is null or v_confirmed_count < v_capacity then
    v_status := 'confirmed';
    v_position := null;
  else
    v_status := 'waitlisted';
    select coalesce(max(queue_position), 0) + 1 into v_position
    from event_registrations
    where activity_id = p_activity_id and status = 'waitlisted';
  end if;

  insert into event_registrations (activity_id, user_id, status, queue_position)
  values (p_activity_id, auth.uid(), v_status, v_position)
  returning * into v_result;

  return v_result;
end;
 $function$;

GRANT ALL ON FUNCTION public.register_to_activity(uuid) TO anon;

GRANT ALL ON FUNCTION public.register_to_activity(uuid) TO authenticated;

GRANT ALL ON FUNCTION public.register_to_activity(uuid) TO service_role;

ALTER TABLE public.event_registrations
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_activity_id_user_id_key UNIQUE (activity_id, user_id);

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);

GRANT ALL ON public.event_registrations TO anon;

GRANT ALL ON public.event_registrations TO authenticated;

GRANT ALL ON public.event_registrations TO service_role;

CREATE INDEX idx_registrations_activity ON public.event_registrations (activity_id);

CREATE INDEX idx_registrations_user ON public.event_registrations (user_id);

CREATE TRIGGER trg_award_attendance_points
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.award_attendance_points();

CREATE POLICY registrations_insert_own ON public.event_registrations
  FOR INSERT
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY registrations_select_own ON public.event_registrations
  FOR SELECT
  USING (((user_id = auth.uid()) OR (public.current_member_role() = 'admin'::public.member_role) OR (EXISTS ( SELECT 1
   FROM public.activities a
  WHERE ((a.id = event_registrations.activity_id) AND (a.pole_id = public.current_pole()) AND (public.current_member_role() = 'pole_lead'::public.member_role))))));

CREATE POLICY registrations_update_lead_or_admin ON public.event_registrations
  FOR UPDATE
  USING (((public.current_member_role() = 'admin'::public.member_role) OR (EXISTS ( SELECT 1
   FROM public.activities a
  WHERE ((a.id = event_registrations.activity_id) AND (a.pole_id = public.current_pole()) AND (public.current_member_role() = 'pole_lead'::public.member_role))))));

CREATE TABLE public.points_log (
  id                  uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id             uuid                     NOT NULL,
  amount              integer                  NOT NULL,
  reason              text                     NOT NULL,
  related_activity_id uuid,
  related_project_id  uuid,
  created_at          timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.points_log
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.points_log
  ADD CONSTRAINT points_log_pkey PRIMARY KEY (id);

ALTER TABLE public.points_log
  ADD CONSTRAINT points_log_related_activity_id_fkey FOREIGN KEY (related_activity_id) REFERENCES public.activities(id);

GRANT ALL ON public.points_log TO anon;

GRANT ALL ON public.points_log TO authenticated;

GRANT ALL ON public.points_log TO service_role;

CREATE INDEX idx_points_log_user ON public.points_log (user_id);

CREATE POLICY points_log_select_own ON public.points_log
  FOR SELECT
  USING (((user_id = auth.uid()) OR (public.current_member_role() = 'admin'::public.member_role)));

CREATE TABLE public.poles (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  name        text                     NOT NULL,
  description text,
  created_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.poles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.poles
  ADD CONSTRAINT poles_name_key UNIQUE (name);

ALTER TABLE public.poles
  ADD CONSTRAINT poles_pkey PRIMARY KEY (id);

ALTER TABLE public.activities
  ADD CONSTRAINT activities_pole_id_fkey FOREIGN KEY (pole_id) REFERENCES public.poles(id) ON DELETE SET NULL;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_pole_id_fkey FOREIGN KEY (pole_id) REFERENCES public.poles(id) ON DELETE SET NULL;

GRANT ALL ON public.poles TO anon;

GRANT ALL ON public.poles TO authenticated;

GRANT ALL ON public.poles TO service_role;

CREATE POLICY poles_select_all ON public.poles
  FOR SELECT
  USING (true);

CREATE POLICY poles_write_admin ON public.poles
  USING ((public.current_member_role() = 'admin'::public.member_role));

CREATE TABLE public.profiles (
  id           uuid                     NOT NULL,
  first_name   text,
  last_name    text,
  email        text                     NOT NULL,
  avatar_url   text,
  pole_id      uuid,
  role         public.member_role       DEFAULT 'member'::public.member_role NOT NULL,
  year         text,
  points_total integer                  DEFAULT 0 NOT NULL,
  joined_at    timestamp with time zone DEFAULT now() NOT NULL,
  is_active    boolean                  DEFAULT true NOT NULL
);

ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.activities
  ADD CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.points_log
  ADD CONSTRAINT points_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pole_id_fkey FOREIGN KEY (pole_id) REFERENCES public.poles(id) ON DELETE SET NULL;

GRANT ALL ON public.profiles TO anon;

GRANT ALL ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

CREATE INDEX idx_profiles_pole ON public.profiles (pole_id);

CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT
  WITH CHECK ((public.current_member_role() = 'admin'::public.member_role));

CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING ((public.current_member_role() = 'admin'::public.member_role));

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING ((id = auth.uid()));

CREATE TABLE public.project_members (
  id             uuid                     DEFAULT gen_random_uuid() NOT NULL,
  project_id     uuid                     NOT NULL,
  user_id        uuid                     NOT NULL,
  joined_at      timestamp with time zone DEFAULT now() NOT NULL,
  points_awarded boolean                  DEFAULT false NOT NULL
);

ALTER TABLE public.project_members
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_project_id_user_id_key UNIQUE (project_id, user_id);

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

GRANT ALL ON public.project_members TO anon;

GRANT ALL ON public.project_members TO authenticated;

GRANT ALL ON public.project_members TO service_role;

CREATE TRIGGER trg_award_project_join_points
  BEFORE INSERT ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.award_project_join_points();

CREATE POLICY project_members_insert_self ON public.project_members
  FOR INSERT
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY project_members_select_all ON public.project_members
  FOR SELECT
  USING (true);

CREATE TABLE public.project_tasks (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  project_id  uuid                     NOT NULL,
  title       text                     NOT NULL,
  status      public.task_status       DEFAULT 'todo'::public.task_status NOT NULL,
  assignee_id uuid,
  created_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.project_tasks
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_tasks
  ADD CONSTRAINT project_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id);

ALTER TABLE public.project_tasks
  ADD CONSTRAINT project_tasks_pkey PRIMARY KEY (id);

GRANT ALL ON public.project_tasks TO anon;

GRANT ALL ON public.project_tasks TO authenticated;

GRANT ALL ON public.project_tasks TO service_role;

CREATE POLICY project_tasks_select_all ON public.project_tasks
  FOR SELECT
  USING (true);

CREATE TABLE public.projects (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  title       text                     NOT NULL,
  description text,
  pole_id     uuid,
  lead_id     uuid,
  status      public.project_status    DEFAULT 'planned'::public.project_status NOT NULL,
  deadline    date,
  progress    integer                  DEFAULT 0 NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL
);

CREATE POLICY project_members_delete_lead_or_admin ON public.project_members
  FOR DELETE
  USING (((public.current_member_role() = 'admin'::public.member_role) OR (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = project_members.project_id) AND (p.lead_id = auth.uid()))))));

CREATE POLICY project_tasks_write_project_member ON public.project_tasks
  USING (((public.current_member_role() = 'admin'::public.member_role) OR (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = project_tasks.project_id) AND (p.lead_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.project_members pm
  WHERE ((pm.project_id = project_tasks.project_id) AND (pm.user_id = auth.uid()))))));

ALTER TABLE public.projects
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.profiles(id);

ALTER TABLE public.projects
  ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE public.points_log
  ADD CONSTRAINT points_log_related_project_id_fkey FOREIGN KEY (related_project_id) REFERENCES public.projects(id);

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_tasks
  ADD CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_pole_id_fkey FOREIGN KEY (pole_id) REFERENCES public.poles(id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_progress_check CHECK (progress >= 0 AND progress <= 100);

GRANT ALL ON public.projects TO anon;

GRANT ALL ON public.projects TO authenticated;

GRANT ALL ON public.projects TO service_role;

CREATE TRIGGER trg_award_project_completion_points
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.award_project_completion_points();

CREATE POLICY projects_select_all ON public.projects
  FOR SELECT
  USING (true);

CREATE POLICY projects_write_lead_or_admin ON public.projects
  USING (((public.current_member_role() = 'admin'::public.member_role) OR (lead_id = auth.uid())));

CREATE TABLE public.resources (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  title       text                     NOT NULL,
  file_url    text                     NOT NULL,
  category    text,
  pole_id     uuid,
  uploaded_by uuid                     NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.resources
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_pkey PRIMARY KEY (id);

ALTER TABLE public.resources
  ADD CONSTRAINT resources_pole_id_fkey FOREIGN KEY (pole_id) REFERENCES public.poles(id) ON DELETE SET NULL;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);

GRANT ALL ON public.resources TO anon;

GRANT ALL ON public.resources TO authenticated;

GRANT ALL ON public.resources TO service_role;

CREATE POLICY resources_select_all ON public.resources
  FOR SELECT
  USING (true);

CREATE POLICY resources_write_lead_or_admin ON public.resources
  USING
    (((public.current_member_role() = 'admin'::public.member_role) OR ((public.current_member_role() = 'pole_lead'::public.member_role) AND ((pole_id = public.current_pole()) OR
    (pole_id IS NULL)))));

CREATE VIEW public.leaderboard AS SELECT p.id AS user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.pole_id,
    po.name AS pole_name,
    p.points_total,
    rank() OVER (ORDER BY p.points_total DESC) AS rank
   FROM (public.profiles p
     LEFT JOIN public.poles po ON ((po.id = p.pole_id)))
  WHERE (p.is_active = true)
  ORDER BY p.points_total DESC;

GRANT ALL ON public.leaderboard TO anon;

GRANT ALL ON public.leaderboard TO authenticated;

GRANT ALL ON public.leaderboard TO service_role;

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
