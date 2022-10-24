CREATE DATABASE netflow;
CREATE USER netflow WITH ENCRYPTED PASSWORD 'netflow';
GRANT ALL PRIVILEGES ON DATABASE netflow TO netflow;

\c netflow netflow;

CREATE TABLE IF NOT EXISTS devices (
    "device_id" bigserial PRIMARY KEY  NOT NULL,
    "device_header" character varying (100) NOT NULL,
    "device_description" character varying (100) ,
    "device_data" character varying (100),
    "device_snmpstr" character varying (100),
    "device_enabled" boolean  NOT NULL
);

CREATE TABLE IF NOT EXISTS interfaces (
    "device_id" bigint  NOT NULL,
    "interface_id" bigint  NOT NULL,
    "interface_name" character varying (100),
    "interface_alias" character varying (100),
    "interface_bandwidth" bigint  NOT NULL,
    "interface_enabled" boolean  NOT NULL,
    "interface_primary" boolean  NOT NULL
);

CREATE TABLE IF NOT EXISTS v9templates (
    "device_id" bigint  NOT NULL,
    "template_id" bigint  NOT NULL,
    "template_length" integer  NOT NULL,
    "template_header" character varying (1024),
    "template_format" character varying (1024),
    "template_sampling" integer  NOT NULL,
    "template_enabled" boolean
);

CREATE TABLE IF NOT EXISTS ipfix (
    "id" int PRIMARY KEY  NOT NULL,
    "name" character varying (100) NOT NULL,
    "data_type" character varying (100),
    "data_type_semantics" character varying (100),
    "data_description" character varying (100)
);

CREATE TABLE IF NOT EXISTS users (
    "user_id"        bigserial PRIMARY KEY  NOT NULL,
    "user_name"      character varying (20) NOT NULL UNIQUE,
    "user_pass"      character varying (256) NOT NULL,
    "user_group"     bigint  NOT NULL,
    "user_name_full" character varying (256),
    "user_email"     character varying (256),
    "user_enabled"   boolean  NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
    "group_id"      bigserial PRIMARY KEY  NOT NULL,
    "group_name"    character varying (20) NOT NULL UNIQUE,
    "group_enabled" boolean  NOT NULL,
    "group_reader"  boolean  NOT NULL,
    "group_writer"  boolean  NOT NULL,
    "group_admin"   boolean  NOT NULL
);

INSERT INTO groups ("group_name", "group_enabled", "group_reader", "group_writer", "group_admin") VALUES
('guests', true, false, false, false),
('users', true, true, false, false),
('advanced', true, true, true, false),
('admins', true, true, true, true),
('disabled', false, false, false, false);

INSERT INTO users ("user_name","user_pass","user_group","user_enabled") VALUES
('admin', 'admin', 4, true),
('user', 'user', 2, true),
('guest', '', 1, true);