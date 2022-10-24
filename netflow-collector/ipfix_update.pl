#!/usr/local/bin/perl

use lib '.';
use lib './lib/';

use strict;
use warnings;

use Data::Dumper;
use JSON::PP::Boolean;

use DBI;
use POSIX;

use output          qw { logmessage };
use getconfig       qw { getconfig setconfig appendconfig };
use service_handler qw { dec2ip ip2dec table_serialise data_serialise };
use pgsql_handler   qw { pgsql_check pgsql_table_insert pgsql_table_select pgsql_table_drop pgsql_table_create pgsql_table_check pgsql_table_delete};


logmessage ("Begin programm...\n",10);
my $loglevel    = 10;
my $configfile  = 'config.json';
my $config      = getconfig("config.json",$loglevel);
my $filename    = './ipfix.csv';

if (defined $config->{"db"}->{"dbengine"} && $config->{"db"}->{"dbengine"} eq "Pg") {
    if (-e $filename) {
        local $/; #Enable 'slurp' mode
        open(my $fh, '<:encoding(UTF-8)', $filename) or die "Could not open file '$filename' $!";
        my @rows = split("\n", <$fh>);
        my $header = shift(@rows);
        my $values = undef;
        foreach my $row (values @rows) {
            my @cells = split(",", $row);
            while (scalar(@cells) < 4) {
                push @cells, "undef";
            }
            my $value = join("','", @cells);
            push @{ $values }, $value;
        }
        pgsql_table_drop($config, "ipfix", $loglevel);
#        my $fields = ["id INT UNSIGNED NOT NULL PRIMARY KEY","`name` VARCHAR(100)","`data_type` VARCHAR(100)","`data_type_semantics` VARCHAR(100)", "`data_description` VARCHAR(100)"];
        my $table_header = [
            ["id"                 , "int PRIMARY KEY",undef,"NO" ],
            ["name"               , "character varying",100,"NO"],
            ["data_type"          , "character varying",100,"YES"],
            ["data_type_semantics", "character varying",100,"YES"],
            ["data_description"   , "character varying",100,"YES"]
        ];

        pgsql_table_create($config, "ipfix", $table_header, $loglevel);
        my $fields = ["id","name","data_type","data_type_semantics"];
        pgsql_table_insert($config,"ipfix", $fields, $values, $loglevel);
        close $fh;
    }
}
