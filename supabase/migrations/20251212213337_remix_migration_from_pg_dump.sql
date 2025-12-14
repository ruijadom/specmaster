CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: subscription_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_tier AS ENUM (
    'free',
    'pro',
    'premium'
);


--
-- Name: get_user_document_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_document_usage(p_user_id uuid) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT document_generations FROM public.usage_tracking 
     WHERE user_id = p_user_id 
     AND period_start = date_trunc('month', now())),
    0
  )
$$;


--
-- Name: get_user_tier(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tier(p_user_id uuid) RETURNS public.subscription_tier
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.subscriptions WHERE user_id = p_user_id AND status = 'active'),
    'free'::subscription_tier
  )
$$;


--
-- Name: get_user_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_usage(p_user_id uuid) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT agent_calls FROM public.usage_tracking 
     WHERE user_id = p_user_id 
     AND period_start = date_trunc('month', now())),
    0
  )
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;


--
-- Name: increment_document_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_document_usage(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, period_start, agent_calls, document_generations)
  VALUES (p_user_id, date_trunc('month', now()), 0, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET document_generations = usage_tracking.document_generations + 1, updated_at = now();
END;
$$;


--
-- Name: increment_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_usage(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, period_start, agent_calls)
  VALUES (p_user_id, date_trunc('month', now()), 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET agent_calls = usage_tracking.agent_calls + 1, updated_at = now();
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admin_emails ae ON LOWER(u.email) = LOWER(ae.email)
    WHERE u.id = auth.uid()
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    agent text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_agent_check CHECK ((agent = ANY (ARRAY['ba'::text, 'pm'::text, 'architect'::text, 'sm'::text]))),
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: jira_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jira_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    jira_domain text NOT NULL,
    jira_email text NOT NULL,
    jira_api_token text NOT NULL,
    jira_project_key text,
    jira_project_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: linear_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.linear_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    linear_api_token text NOT NULL,
    linear_team_id text,
    linear_team_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    first_name text,
    last_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    agent text NOT NULL,
    analysis_id text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_jira_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_jira_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    jira_project_key text NOT NULL,
    jira_project_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_linear_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_linear_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    linear_team_id text NOT NULL,
    linear_team_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_phases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_phases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    phase_type text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_phases_phase_type_check CHECK ((phase_type = ANY (ARRAY['project-brief'::text, 'prd'::text, 'architecture'::text, 'backlog'::text])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'ideation'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['ideation'::text, 'planning'::text, 'backlog'::text, 'active'::text, 'completed'::text])))
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    tier public.subscription_tier DEFAULT 'free'::public.subscription_tier NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usage_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    period_start timestamp with time zone DEFAULT date_trunc('month'::text, now()) NOT NULL,
    agent_calls integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    document_generations integer DEFAULT 0
);


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_emails admin_emails_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_emails
    ADD CONSTRAINT admin_emails_email_key UNIQUE (email);


--
-- Name: admin_emails admin_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_emails
    ADD CONSTRAINT admin_emails_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: jira_integrations jira_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jira_integrations
    ADD CONSTRAINT jira_integrations_pkey PRIMARY KEY (id);


--
-- Name: jira_integrations jira_integrations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jira_integrations
    ADD CONSTRAINT jira_integrations_user_id_key UNIQUE (user_id);


--
-- Name: linear_integrations linear_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.linear_integrations
    ADD CONSTRAINT linear_integrations_pkey PRIMARY KEY (id);


--
-- Name: linear_integrations linear_integrations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.linear_integrations
    ADD CONSTRAINT linear_integrations_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: project_analyses project_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_analyses
    ADD CONSTRAINT project_analyses_pkey PRIMARY KEY (id);


--
-- Name: project_analyses project_analyses_project_id_agent_analysis_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_analyses
    ADD CONSTRAINT project_analyses_project_id_agent_analysis_id_key UNIQUE (project_id, agent, analysis_id);


--
-- Name: project_jira_config project_jira_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_jira_config
    ADD CONSTRAINT project_jira_config_pkey PRIMARY KEY (id);


--
-- Name: project_jira_config project_jira_config_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_jira_config
    ADD CONSTRAINT project_jira_config_project_id_key UNIQUE (project_id);


--
-- Name: project_linear_config project_linear_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_linear_config
    ADD CONSTRAINT project_linear_config_pkey PRIMARY KEY (id);


--
-- Name: project_linear_config project_linear_config_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_linear_config
    ADD CONSTRAINT project_linear_config_project_id_key UNIQUE (project_id);


--
-- Name: project_phases project_phases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_phases
    ADD CONSTRAINT project_phases_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (id);


--
-- Name: usage_tracking usage_tracking_user_id_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_period_start_key UNIQUE (user_id, period_start);


--
-- Name: waitlist waitlist_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_email_key UNIQUE (email);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_project_id ON public.chat_messages USING btree (project_id);


--
-- Name: idx_waitlist_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_waitlist_created_at ON public.waitlist USING btree (created_at DESC);


--
-- Name: idx_waitlist_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_waitlist_email ON public.waitlist USING btree (email);


--
-- Name: jira_integrations update_jira_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_jira_integrations_updated_at BEFORE UPDATE ON public.jira_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: linear_integrations update_linear_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_linear_integrations_updated_at BEFORE UPDATE ON public.linear_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_analyses update_project_analyses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_analyses_updated_at BEFORE UPDATE ON public.project_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_jira_config update_project_jira_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_jira_config_updated_at BEFORE UPDATE ON public.project_jira_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_linear_config update_project_linear_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_linear_config_updated_at BEFORE UPDATE ON public.project_linear_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_phases update_project_phases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON public.project_phases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: usage_tracking update_usage_tracking_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_messages chat_messages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: jira_integrations jira_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jira_integrations
    ADD CONSTRAINT jira_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: project_analyses project_analyses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_analyses
    ADD CONSTRAINT project_analyses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_jira_config project_jira_config_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_jira_config
    ADD CONSTRAINT project_jira_config_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_linear_config project_linear_config_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_linear_config
    ADD CONSTRAINT project_linear_config_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_phases project_phases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_phases
    ADD CONSTRAINT project_phases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: usage_tracking usage_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_tickets Admins can update tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (public.is_admin());


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin());


--
-- Name: support_tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.is_admin());


--
-- Name: waitlist Anyone can join waitlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);


--
-- Name: subscriptions Service role manages subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions TO service_role USING (true) WITH CHECK (true);


--
-- Name: project_phases Users can create phases for their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create phases for their own projects" ON public.project_phases FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_phases.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: jira_integrations Users can create their own Jira integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own Jira integrations" ON public.jira_integrations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: linear_integrations Users can create their own Linear integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own Linear integrations" ON public.linear_integrations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: projects Users can create their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: project_jira_config Users can delete Jira config of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete Jira config of their own projects" ON public.project_jira_config FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_jira_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_linear_config Users can delete Linear config of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete Linear config of their own projects" ON public.project_linear_config FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_linear_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_analyses Users can delete analyses of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete analyses of their own projects" ON public.project_analyses FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_analyses.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_phases Users can delete phases of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete phases of their own projects" ON public.project_phases FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_phases.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: jira_integrations Users can delete their own Jira integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own Jira integrations" ON public.jira_integrations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: linear_integrations Users can delete their own Linear integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own Linear integrations" ON public.linear_integrations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: projects Users can delete their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: project_jira_config Users can insert Jira config for their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert Jira config for their own projects" ON public.project_jira_config FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_jira_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_linear_config Users can insert Linear config for their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert Linear config for their own projects" ON public.project_linear_config FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_linear_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_analyses Users can insert analyses for their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert analyses for their own projects" ON public.project_analyses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_analyses.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: chat_messages Users can insert messages to their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages to their own projects" ON public.chat_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = chat_messages.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: usage_tracking Users can insert their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own usage" ON public.usage_tracking FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: project_jira_config Users can update Jira config of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update Jira config of their own projects" ON public.project_jira_config FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_jira_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_linear_config Users can update Linear config of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update Linear config of their own projects" ON public.project_linear_config FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_linear_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_analyses Users can update analyses of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update analyses of their own projects" ON public.project_analyses FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_analyses.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_phases Users can update phases of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update phases of their own projects" ON public.project_phases FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_phases.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: jira_integrations Users can update their own Jira integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own Jira integrations" ON public.jira_integrations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: linear_integrations Users can update their own Linear integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own Linear integrations" ON public.linear_integrations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: projects Users can update their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: usage_tracking Users can update their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own usage" ON public.usage_tracking FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: project_jira_config Users can view Jira config of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view Jira config of their own projects" ON public.project_jira_config FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_jira_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_linear_config Users can view Linear config of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view Linear config of their own projects" ON public.project_linear_config FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_linear_config.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_analyses Users can view analyses of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view analyses of their own projects" ON public.project_analyses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_analyses.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: chat_messages Users can view messages of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages of their own projects" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = chat_messages.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: project_phases Users can view phases of their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view phases of their own projects" ON public.project_phases FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_phases.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: jira_integrations Users can view their own Jira integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own Jira integrations" ON public.jira_integrations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: linear_integrations Users can view their own Linear integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own Linear integrations" ON public.linear_integrations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: projects Users can view their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: usage_tracking Users can view their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own usage" ON public.usage_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_emails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: jira_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jira_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: linear_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.linear_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: project_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: project_jira_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_jira_config ENABLE ROW LEVEL SECURITY;

--
-- Name: project_linear_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_linear_config ENABLE ROW LEVEL SECURITY;

--
-- Name: project_phases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: usage_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: waitlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


