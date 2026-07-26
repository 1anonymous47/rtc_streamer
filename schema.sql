--
-- PostgreSQL database dump
--

\restrict cI1WoulxqAxClyQgE4cLGey2qANrDwPvfkxo5kJAEHqq7azU1LhTLtSaRJ2e7cf

-- Dumped from database version 18.4 (Debian 18.4-1+b1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1+b1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tbl_blocked_friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_blocked_friendships (
    id integer NOT NULL,
    senderid integer NOT NULL,
    receiverid integer NOT NULL,
    status character varying(20)
);


ALTER TABLE public.tbl_blocked_friendships OWNER TO postgres;

--
-- Name: tbl_blocked_friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_blocked_friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_blocked_friendships_id_seq OWNER TO postgres;

--
-- Name: tbl_blocked_friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_blocked_friendships_id_seq OWNED BY public.tbl_blocked_friendships.id;


--
-- Name: tbl_chatrooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_chatrooms (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tbl_chatrooms OWNER TO postgres;

--
-- Name: tbl_chatrooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_chatrooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_chatrooms_id_seq OWNER TO postgres;

--
-- Name: tbl_chatrooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_chatrooms_id_seq OWNED BY public.tbl_chatrooms.id;


--
-- Name: tbl_chatrooms_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_chatrooms_members (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.tbl_chatrooms_members OWNER TO postgres;

--
-- Name: tbl_chatrooms_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_chatrooms_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_chatrooms_members_id_seq OWNER TO postgres;

--
-- Name: tbl_chatrooms_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_chatrooms_members_id_seq OWNED BY public.tbl_chatrooms_members.id;


--
-- Name: tbl_friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_friend_requests (
    id bigint NOT NULL,
    sender_id bigint NOT NULL,
    receiver_id bigint NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users CHECK ((sender_id <> receiver_id))
);


ALTER TABLE public.tbl_friend_requests OWNER TO postgres;

--
-- Name: tbl_friend_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tbl_friend_requests ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tbl_friend_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tbl_friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_friendships (
    id integer NOT NULL,
    senderid integer NOT NULL,
    receiverid integer NOT NULL,
    status character varying(20)
);


ALTER TABLE public.tbl_friendships OWNER TO postgres;

--
-- Name: tbl_friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_friendships_id_seq OWNER TO postgres;

--
-- Name: tbl_friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_friendships_id_seq OWNED BY public.tbl_friendships.id;


--
-- Name: tbl_private_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_private_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer NOT NULL,
    message character varying(255),
    message_status character varying(20) DEFAULT 'sent'::character varying,
    delete_status boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tbl_private_messages OWNER TO postgres;

--
-- Name: tbl_private_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_private_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_private_messages_id_seq OWNER TO postgres;

--
-- Name: tbl_private_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_private_messages_id_seq OWNED BY public.tbl_private_messages.id;


--
-- Name: tbl_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tbl_users OWNER TO postgres;

--
-- Name: tbl_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tbl_users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tbl_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tbl_blocked_friendships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_blocked_friendships ALTER COLUMN id SET DEFAULT nextval('public.tbl_blocked_friendships_id_seq'::regclass);


--
-- Name: tbl_chatrooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms ALTER COLUMN id SET DEFAULT nextval('public.tbl_chatrooms_id_seq'::regclass);


--
-- Name: tbl_chatrooms_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms_members ALTER COLUMN id SET DEFAULT nextval('public.tbl_chatrooms_members_id_seq'::regclass);


--
-- Name: tbl_friendships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_friendships ALTER COLUMN id SET DEFAULT nextval('public.tbl_friendships_id_seq'::regclass);


--
-- Name: tbl_private_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_private_messages ALTER COLUMN id SET DEFAULT nextval('public.tbl_private_messages_id_seq'::regclass);


--
-- Name: tbl_blocked_friendships tbl_blocked_friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_blocked_friendships
    ADD CONSTRAINT tbl_blocked_friendships_pkey PRIMARY KEY (id);


--
-- Name: tbl_chatrooms_members tbl_chatrooms_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms_members
    ADD CONSTRAINT tbl_chatrooms_members_pkey PRIMARY KEY (id);


--
-- Name: tbl_chatrooms_members tbl_chatrooms_members_room_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms_members
    ADD CONSTRAINT tbl_chatrooms_members_room_id_user_id_key UNIQUE (room_id, user_id);


--
-- Name: tbl_chatrooms tbl_chatrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms
    ADD CONSTRAINT tbl_chatrooms_pkey PRIMARY KEY (id);


--
-- Name: tbl_friend_requests tbl_friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_friend_requests
    ADD CONSTRAINT tbl_friend_requests_pkey PRIMARY KEY (id);


--
-- Name: tbl_friendships tbl_friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_friendships
    ADD CONSTRAINT tbl_friendships_pkey PRIMARY KEY (id);


--
-- Name: tbl_private_messages tbl_private_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_private_messages
    ADD CONSTRAINT tbl_private_messages_pkey PRIMARY KEY (id);


--
-- Name: tbl_users tbl_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_users
    ADD CONSTRAINT tbl_users_email_key UNIQUE (email);


--
-- Name: tbl_users tbl_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_users
    ADD CONSTRAINT tbl_users_pkey PRIMARY KEY (id);


--
-- Name: tbl_friend_requests fk_receiver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_friend_requests
    ADD CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;


--
-- Name: tbl_friend_requests fk_sender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_friend_requests
    ADD CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;


--
-- Name: tbl_chatrooms_members tbl_chatrooms_members_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms_members
    ADD CONSTRAINT tbl_chatrooms_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.tbl_chatrooms(id);


--
-- Name: tbl_chatrooms_members tbl_chatrooms_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_chatrooms_members
    ADD CONSTRAINT tbl_chatrooms_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbl_users(id);


--
-- Name: tbl_private_messages tbl_private_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_private_messages
    ADD CONSTRAINT tbl_private_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.tbl_chatrooms(id);


--
-- Name: tbl_private_messages tbl_private_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_private_messages
    ADD CONSTRAINT tbl_private_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbl_users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO user1;


--
-- Name: TABLE tbl_blocked_friendships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_blocked_friendships TO user1;


--
-- Name: SEQUENCE tbl_blocked_friendships_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_blocked_friendships_id_seq TO user1;


--
-- Name: TABLE tbl_chatrooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_chatrooms TO user1;


--
-- Name: SEQUENCE tbl_chatrooms_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_chatrooms_id_seq TO user1;


--
-- Name: TABLE tbl_chatrooms_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_chatrooms_members TO user1;


--
-- Name: SEQUENCE tbl_chatrooms_members_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_chatrooms_members_id_seq TO user1;


--
-- Name: TABLE tbl_friend_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_friend_requests TO user1;


--
-- Name: SEQUENCE tbl_friend_requests_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_friend_requests_id_seq TO user1;


--
-- Name: TABLE tbl_friendships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_friendships TO user1;


--
-- Name: SEQUENCE tbl_friendships_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_friendships_id_seq TO user1;


--
-- Name: TABLE tbl_private_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_private_messages TO user1;


--
-- Name: SEQUENCE tbl_private_messages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_private_messages_id_seq TO user1;


--
-- Name: TABLE tbl_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tbl_users TO user1;


--
-- Name: SEQUENCE tbl_users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tbl_users_id_seq TO user1;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO user1;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO user1;


--
-- PostgreSQL database dump complete
--

\unrestrict cI1WoulxqAxClyQgE4cLGey2qANrDwPvfkxo5kJAEHqq7azU1LhTLtSaRJ2e7cf

