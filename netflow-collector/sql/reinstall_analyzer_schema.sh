#!/usr/local/bin/bash

psql -h 10.37.224.11 -U netflow -a -f reinstall_analyzer_schema.sql