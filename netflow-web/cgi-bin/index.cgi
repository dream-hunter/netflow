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

my $config = {
    "db" => {
        "dbengine" => "Pg",
        "dbhost"   => "localhost",
        "dbname"   => "syslog",
        "dbuser"   => "rsyslog",
        "dbpass"   => "rsyslog",
        "dbschema" => "public"
    }
};

my $result = {"success" => "false", "response_body"=>undef, "response" => 'bad or empty request'};

given ($req) {
    when("getauth") {
        $result = getAuth();
    }
    when("getdevices") {
        $result = getDevices();
    }
    default {
    }
}

print encode_json($result);

# Subroutines

sub getAuth {

}

sub getDevices {
    
}