#!/usr/bin/env perl

use strict;
use warnings;
use CGI;
use DBI;
use JSON;
use Data::Dumper;
use feature "switch";

no warnings qw( experimental::smartmatch );

my $cgi = CGI->new();
print $cgi->header( - type => 'application/json');

my $config_main = {
    "db" => {
        "dbengine"         => "Pg",
        "dbhost"           => "localhost",
        "dbname"           => "netflow",
        "dbuser"           => "netflow",
        "dbpass"           => "netflow",
    }
};

my $result = {"success" => "false", "response_body"=>undef, "response" => 'bad or empty request'};

given ($req) {
    when("getauth") {
        $result = getAuth();
    }
    when("getdevices") {
        $result = getDevices($config_main);
    }
    default {
    }
}

print encode_json($result);

# Subroutines

sub getAuth {

}

sub getDevices {
    my $config = $_[1];
    $config->{"db"}->{"dbschema"} = "analyzer";
    my @fields = [
        "id",
        "receivedat",
        "devicereportedtime",
        "facility",
        "priority",
        "fromhost",
        "fromipaddress",
        "infounitid",
        "syslogtag",
        "message",
    ];

    $result->{"response_body"} = pgsql_table_select($config, @fields,"systemevents",undef,"ORDER BY receivedat DESC LIMIT 100");
    if (defined $result->{"response_body"}) {
        $result->{"response"} = "200";
        $result->{"success"}  = "true";
    }

    return $result;

}

sub pgsql_connect {
    my $config         = $_[0];

    my $db             = undef;
    my $dbi            = undef;
    my $dbengine       = $config->{"db"}->{"dbengine"};
    my $dbhost         = $config->{"db"}->{"dbhost"};
    my $dbname         = $config->{"db"}->{"dbname"};
    my $dbuser         = $config->{"db"}->{"dbuser"};
    my $dbpass         = $config->{"db"}->{"dbpass"};

    if (defined $dbname && defined $dbhost) {
        $dbi = "DBI:$dbengine:database=$dbname;host=$dbhost";
    } else {
        return undef, "Wrong database configuration";
    }
    $db = DBI->connect("$dbi", "$dbuser", "$dbpass") || return undef;

    return $db;
}

sub pgsql_table_select {
    my $config     = $_[0];
    my $field_list = $_[1];
    my $table_name = $_[2];
    my $condition  = $_[3];
    my $tail       = $_[4];

    my $result   = undef;
    my $schema   = "public";
    if (defined $config->{"db"}->{"dbschema"}) {
        $schema   = $config->{"db"}->{"dbschema"};
    }

    my $db = pgsql_connect($config);

    my $sql = "SELECT " . join(",", @{ $field_list }) . " FROM \"$schema\".\"$table_name\"";
    if (defined $condition) {
        $sql .= " WHERE $condition";
    }
    if (defined $tail) {
        $sql .= "  $tail";
    }
    $sql .= ";";
    # print $sql;
    if (defined $db) {
        my $query = $db->prepare($sql);
        $query->execute() or die $DBI::errstr;
        my $fields = join(',', @{ $query->{NAME_lc} });
        my $values = undef;
        while (my @row = $query->fetchrow_array) {
            foreach my $idx (keys @row) {
                if (!defined $row[$idx]) {
                    $row[$idx] = "null"
                }
            }
            # push @{ $values }, join (",", @row);
            push @{ $values }, [ @row ];
        }
        $result->{"fields"} = $fields;
        $result->{"values"} = $values;
        $query->finish();
        $db->disconnect;
    }
    return $result;
}
