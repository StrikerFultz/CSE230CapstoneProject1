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

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE public.courses (
    course_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_code character varying(20) NOT NULL,
    course_name character varying(255) NOT NULL,
    description text,
    semester character varying(20) NOT NULL,
    year integer NOT NULL,
    is_active boolean DEFAULT true
);
ALTER TABLE public.courses OWNER TO postgres;

CREATE TABLE public.enrollments (
    enrollment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    dropped_at timestamp with time zone
);
ALTER TABLE public.enrollments OWNER TO postgres;

CREATE TABLE public.lab_test_cases (
    test_case_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lab_id character varying(50) NOT NULL,
    test_name character varying(255) NOT NULL,
    test_type character varying(20) NOT NULL,
    description text,
    input_data jsonb DEFAULT '{}'::jsonb,
    expected_output jsonb NOT NULL,
    points integer DEFAULT 10,
    is_hidden boolean DEFAULT false,
    timeout_seconds integer DEFAULT 5
);
ALTER TABLE public.lab_test_cases OWNER TO postgres;

CREATE TABLE public.labs (
    lab_id character varying(50) NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    instructions text NOT NULL,
    starter_code text,
    solution_code text,
    register_mapping jsonb DEFAULT '{}'::jsonb,
    initial_values jsonb DEFAULT '{}'::jsonb,
    max_memory_kb integer DEFAULT 1024,
    time_limit_seconds integer DEFAULT 10,
    max_instructions integer DEFAULT 10000,
    total_points integer DEFAULT 100,
    release_date timestamp with time zone,
    due_date timestamp with time zone,
    is_published boolean DEFAULT false,
    difficulty character varying(20) DEFAULT 'intermediate'::character varying
);
ALTER TABLE public.labs OWNER TO postgres;

CREATE TABLE public.user_preferences (
    preference_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying,
    editor_font_size integer DEFAULT 14,
    auto_save_enabled boolean DEFAULT true,
    additional_preferences jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.user_preferences OWNER TO postgres;

CREATE TABLE public.user_sessions (
    session_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    ip_address inet,
    user_agent text
);
ALTER TABLE public.user_sessions OWNER TO postgres;

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    is_active boolean DEFAULT true
);
ALTER TABLE public.users OWNER TO postgres;

COPY public.courses (course_id, course_code, course_name, description, semester, year, is_active) FROM stdin;
\.

COPY public.enrollments (enrollment_id, user_id, course_id, role, enrolled_at, dropped_at) FROM stdin;
\.

COPY public.lab_test_cases (test_case_id, lab_id, test_name, test_type, description, input_data, expected_output, points, is_hidden, timeout_seconds) FROM stdin;
\.

COPY public.labs (lab_id, course_id, title, description, instructions, starter_code, solution_code, register_mapping, initial_values, max_memory_kb, time_limit_seconds, max_instructions, total_points, release_date, due_date, is_published, difficulty) FROM stdin;
\.

COPY public.user_preferences (preference_id, user_id, theme, editor_font_size, auto_save_enabled, additional_preferences) FROM stdin;
\.

COPY public.user_sessions (session_id, user_id, session_token, expires_at, ip_address, user_agent) FROM stdin;
\.

COPY public.users (user_id, username, email, password_hash, role, created_at, last_login, is_active) FROM stdin;
\.

ALTER TABLE ONLY public.courses ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);
ALTER TABLE ONLY public.enrollments ADD CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id);
ALTER TABLE ONLY public.lab_test_cases ADD CONSTRAINT lab_test_cases_pkey PRIMARY KEY (test_case_id);
ALTER TABLE ONLY public.labs ADD CONSTRAINT labs_pkey PRIMARY KEY (lab_id);
ALTER TABLE ONLY public.user_preferences ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (preference_id);
ALTER TABLE ONLY public.user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE ONLY public.enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.enrollments ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lab_test_cases ADD CONSTRAINT lab_test_cases_lab_id_fkey FOREIGN KEY (lab_id) REFERENCES public.labs(lab_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.labs ADD CONSTRAINT labs_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;