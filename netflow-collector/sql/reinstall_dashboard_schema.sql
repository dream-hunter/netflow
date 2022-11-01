\c netflow netflow;

DROP SCHEMA IF EXISTS dashboard CASCADE;

CREATE SCHEMA IF NOT EXISTS dashboard;

CREATE TABLE IF NOT EXISTS dashboard.groups (
    "group_id"      bigserial PRIMARY KEY  NOT NULL,
    "group_name"    character varying (20) NOT NULL UNIQUE,
    "group_enabled" boolean  NOT NULL,
    "group_reader"  boolean  NOT NULL,
    "group_writer"  boolean  NOT NULL,
    "group_admin"   boolean  NOT NULL
);

INSERT INTO dashboard.groups ("group_name", "group_enabled", "group_reader", "group_writer", "group_admin") VALUES
    ('guests', true, false, false, false),
    ('users', true, true, false, false),
    ('advanced', true, true, true, false),
    ('admins', true, true, true, true),
    ('disabled', false, false, false, false);

CREATE TABLE IF NOT EXISTS dashboard.users (
    "user_id"        bigserial PRIMARY KEY NOT NULL,
    "user_name"      character varying (20) NOT NULL UNIQUE,
    "user_pass"      character varying (256) NOT NULL,
    "user_group"     bigint  NOT NULL,
    "user_name_full" character varying (256),
    "user_email"     character varying (256),
    "user_enabled"   boolean  NOT NULL
);

INSERT INTO dashboard.users ("user_name","user_pass","user_group","user_enabled") VALUES
    ('admin', 'admin', 4, true),
    ('user', 'user', 2, true),
    ('guest', '', 1, true);

CREATE TABLE IF NOT EXISTS dashboard.links (
    "link_id" serial PRIMARY KEY NOT NULL,
    "link_header" character varying(1024),
    "link_href" character varying(4096),
    "link_description" character varying(1024)
);