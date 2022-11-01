\c netflow netflow;

DROP SCHEMA IF EXISTS collector CASCADE;

CREATE SCHEMA IF NOT EXISTS collector;

CREATE TABLE IF NOT EXISTS collector.devices (
    "device_id" bigserial PRIMARY KEY  NOT NULL,
    "device_header" character varying (100) NOT NULL,
    "device_description" character varying (100) ,
    "device_data" character varying (100),
    "device_snmpstr" character varying (100),
    "device_enabled" boolean  NOT NULL
);

CREATE TABLE IF NOT EXISTS collector.interfaces (
    "device_id" bigint  NOT NULL,
    "interface_id" bigint  NOT NULL,
    "interface_name" character varying (100),
    "interface_alias" character varying (100),
    "interface_bandwidth" bigint  NOT NULL,
    "interface_enabled" boolean  NOT NULL,
    "interface_primary" boolean  NOT NULL
);

CREATE TABLE IF NOT EXISTS collector.v9templates (
    "device_id" bigint  NOT NULL,
    "template_id" bigint  NOT NULL,
    "template_length" integer  NOT NULL,
    "template_header" character varying (1024),
    "template_format" character varying (1024),
    "template_sampling" integer  NOT NULL,
    "template_enabled" boolean
);