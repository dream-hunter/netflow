package pgsql_handler;

$VERSION     = 1.00;
@ISA         = qw(Exporter);
@EXPORT      = ();
@EXPORT_OK   = qw(pgsql_check pgsql_table_insert pgsql_table_insert_from pgsql_table_select pgsql_table_drop pgsql_table_create pgsql_table_check pgsql_table_delete);
%EXPORT_TAGS = ( DEFAULT => [qw(&pgsql_check &pgsql_table_insert &pgsql_table_insert_from &pgsql_table_select &pgsql_table_drop &pgsql_table_create &pgsql_table_check &pgsql_table_delete)]);

use lib '.';
use output qw { logmessage };
use DBI;
use Data::Dumper;


sub pgsql_connect {
    my $config         = $_[0];
    my $loglevel       = $_[1];

    my $dbi            = undef;
    my $dbengine       = $config->{"db"}->{"dbengine"};
    my $dbhost         = $config->{"db"}->{"dbhost"};
    my $dbname         = $config->{"db"}->{"dbname"};
    my $dbuser         = $config->{"db"}->{"dbuser"};
    my $dbpass         = $config->{"db"}->{"dbpass"};

    logmessage ("Trying to connect to pgsql database:\n\t", $loglevel);
    if (defined $dbname && defined $dbhost) {
        logmessage ("Connect to DBhost $dbhost...", $loglevel);
        $dbi = "DBI:$dbengine:database=$dbname;host=$dbhost";
    } else {
        logmessage("Wrong database configuration\n",$loglevel);
        return undef;
    }
    my $db = DBI->connect("$dbi", "$dbuser", "$dbpass") || die "Could not connect to database:\n$DBI::errstr\n";
    logmessage (" - Success\n", $loglevel);

    return $db;
}

sub pgsql_check {
    my $config   = $_[0];
    my $loglevel = $_[1];

    my $result   = undef;

    logmessage ("Check database structure:\n",0);

    my $table_name = "devices";
    my $table_header = [
        ["device_id",          "bigserial PRIMARY KEY",undef,"NO" ],
        ["device_header",      "character varying",100,"NO"],
        ["device_description", "character varying",100,"YES"],
        ["device_data",        "character varying",100,"YES"],
        ["device_snmpstr",     "character varying",100,"YES"],
        ["device_enabled",     "boolean"        ,undef,"NO" ]
    ];
    $result = pgsql_table_check($config, $table_name, $table_header, $loglevel);
    if (defined $result) {
        if ($result == 1) {
            logmessage("Table '$table_name' looks fine.\n", $loglevel);
        } else {
            logmessage("Table $table_name table has the wrong structure.\n", $loglevel);
            return undef;
        }
    } else {
        logmessage("Table '$table_name' does not exist. Attempt to create...\n", $loglevel);
        pgsql_table_create($config, $table_name, $table_header, $loglevel);
    };

    my $table_name = "v9templates";
    $table_header = [
        ["device_id",          "bigint" ,undef,"NO" ],
        ["template_id",        "bigint" ,undef,"NO" ],
        ["template_length",    "integer",undef,"NO"],
        ["template_header",    "character varying",1024,"YES"],
        ["template_format",    "character varying",1024,"YES"],
        ["template_sampling",    "integer",undef,"NO"],
        ["template_enabled",   "boolean",undef,"YES"]
    ];
    $result = pgsql_table_check($config, $table_name, $table_header, $loglevel);
    if (defined $result) {
        if ($result == 1) {
            logmessage("Table '$table_name' looks fine.\n", $loglevel);
        } else {
            logmessage("Table $table_name table has the wrong structure.\n", $loglevel);
            return undef;
        }
    } else {
        logmessage("Table '$table_name' does not exist. Attempt to create...\n", $loglevel);
        pgsql_table_create($config, $table_name, $table_header, $loglevel);

    };

    return 1;
}

sub pgsql_table_create {
    my $config       = $_[0];
    my $table        = $_[1];
    my $table_header = $_[2];
    my $loglevel     = $_[3];
    my $result       = undef;
#    print Dumper $fields;
    my $fields = [];
    my $db = pgsql_connect($config, $loglevel);
    if (defined $db) {
        foreach my $header (values @{ $table_header }) {
#            print $table_header->[$key] . "\n";
            $header->[0] = "\"".$header->[0]."\"";
            if ($header->[3] eq "NO")  { $header->[3] = "NOT NULL"; }
            if ($header->[3] eq "YES") { $header->[3] = undef; }
            if (defined $header->[2] && $header->[2] ne "" ) { $header->[2] = "($header->[2])"; }
            push (@{ $fields }, join(" ", @{ $header }));
        }
        print Dumper $fields;
        my $query   = "CREATE TABLE IF NOT EXISTS $table (" . join(", ", @{ $fields }) . ");";
        logmessage ("SQL request: $query\n", 10);
        my $request = $db->prepare($query);
        $request->execute();
        warn "Data fetching terminated early by error: $DBI::errstr\n" if $DBI::err;
        $request->finish();
        $db->disconnect;
    }
    return $result;
}

sub pgsql_table_check {
    my $config       = $_[0];
    my $table_name   = $_[1];
    my $table_header = $_[2];
    my $loglevel     = $_[3];

    my $result       = undef;
    my $db = pgsql_connect($config, $loglevel);
    if (defined $db) {
        logmessage ("Check \"$table_name\" structure:\n",$loglevel);
        my $res = $db->tables(undef, 'public', $table_name);
        if ((defined $res) && ($res == 1)) {
            my $sth = $db->column_info(undef, 'public', $table_name, undef);
            my $fields = $sth->fetchall_arrayref({});
#            print Dumper $table_header;
#            print Dumper $fields;
            foreach my $key (keys @{ $table_header }) {
                $table_header->[$key]->[0] = "\"".$table_header->[$key]->[0]."\"";
                if ($table_header->[$key]->[1] eq "bigserial PRIMARY KEY") {
                    $table_header->[$key]->[1] = "bigint";
                    $table_header->[$key]->[2] = "8";
                }
                if ($table_header->[$key]->[1] eq "boolean") {
                    $table_header->[$key]->[2] = "1";
                }
                if ($table_header->[$key]->[1] eq "numeric") {
                    $table_header->[$key]->[2] = "0,$table_header->[$key]->[2]";
                }
                if ($table_header->[$key]->[1] eq "bigint") {
                    $table_header->[$key]->[2] = "8";
                }
                if ($table_header->[$key]->[1] eq "integer") {
                    $table_header->[$key]->[2] = "4";
                }
                logmessage ("Compare field: '\"$fields->[$key]->{pg_column}\" $fields->[$key]->{TYPE_NAME} $fields->[$key]->{COLUMN_SIZE} $fields->[$key]->{IS_NULLABLE}' AND '" . join(" ", @{ $table_header->[$key] }) . "'" , $loglevel);
                if ("\"$fields->[$key]->{pg_column}\" $fields->[$key]->{TYPE_NAME} $fields->[$key]->{COLUMN_SIZE} $fields->[$key]->{IS_NULLABLE}" eq join(" ", @{ $table_header->[$key] })) {
                    $result = 1;
                    logmessage (" - OK\n", $loglevel);
                } else {
                    $result = 0;
                    logmessage (" - ERROR\n", $loglevel);
                    last;
                };
            }
        } else {
            logmessage ("Table $table_name does not exists\n", $loglevel);
        }
    }
    $db->disconnect;
    return $result;
}

sub pgsql_table_select {
    my $config   = $_[0];
    my $sql      = $_[1];
    my $loglevel = $_[2];

    my $result   = undef;
    my $db = pgsql_connect($config, $loglevel);

    if (defined $db) {
        logmessage ("SQL request: $sql\n", $loglevel);
        my $query = $db->prepare($sql);
        $query->execute() or die $DBI::errstr;
        my $fields = join(',', @{ $query->{NAME_lc} });
        my $values = undef;
        while (my @row = $query->fetchrow_array) {
            push @{ $values }, join (",", @row);
        }
        $result->{"fields"} = $fields;
        $result->{"values"} = $values;
        $query->finish();
        $db->disconnect;
    }
    return $result;
}

sub pgsql_table_drop {
    my $config   = $_[0];
    my $table    = $_[1];
    my $loglevel = $_[2];
    my $result   = undef;

    my $db = pgsql_connect($config, $loglevel);
    if (defined $db) {
        my $query   = "DROP TABLE IF EXISTS $table;";
        logmessage ("SQL request: $query\n", $loglevel);
        my $request = $db->prepare($query);
#        $request->execute() or die $DBI::errstr;
        $request->execute();
        warn "Data fetching terminated early by error: $DBI::errstr\n" if $DBI::err;

        $request->finish();
        $db->disconnect;
    }

    return $result;
}

sub pgsql_table_delete {
    my $config    = $_[0];
    my $table     = $_[1];
    my $condition = $_[2];
    my $loglevel  = $_[3];
    my $result    = undef;

#    print Dumper $condition;

    my $db = pgsql_connect($config, $loglevel);
    if (defined $db) {
        my $query   = "DELETE FROM $table";
        if (defined $condition) {
            $query .= " WHERE " . join(" AND ", @{ $condition });
        }
        $query .= ";";
        logmessage ("SQL request: $query\n", $loglevel);
        my $request = $db->prepare($query);
        $request->execute();
        warn "Data fetching terminated early by error: $DBI::errstr\n" if $DBI::err;

        $request->finish();
        $db->disconnect;
    }

    return $result;
}

sub pgsql_table_insert {
    my $config   = $_[0];
    my $table    = $_[1];
    my $fields   = $_[2];
    my $values   = $_[3];
    my $loglevel = $_[4];

    my $result   = undef;
    my $db = pgsql_connect($config, $loglevel);

    if (defined $db && defined $table && defined $fields && defined $values) {
        $fields = join("\", \"", @{ $fields });
        $values = join("'),\n ('", @{ $values });
        my $query = "INSERT INTO $table (\"$fields\") VALUES\n ('$values');";
        logmessage ("$query\n", $loglevel);
        my $request = $db->prepare($query);
        $request->execute();
        warn "Data fetching terminated early by error: $DBI::errstr\n" if $DBI::err;
#        $request->execute() or die $DBI::errstr;

        $result=$request->{pgsql_insertid};
        $request->finish();
        $db->disconnect;
    }
    return $result;
}

sub pgsql_table_insert_from {
    my $config      = $_[0];
    my $table_src   = $_[1];
    my $fields_src  = $_[2];
    my $table_dst   = $_[3];
    my $fields_dst  = $_[4];
    my $group_by    = $_[5];
    my $where       = $_[6];
    my $loglevel    = $_[7];

    my $result   = undef;
    my $db = pgsql_connect($config, $loglevel);


    if (defined $db && defined $table_src && defined $fields_src && defined $table_dst && defined $fields_dst) {
        $fields_src = join("\", \"", @{ $fields_src });

        $fields_dst = join("\", \"", @{ $fields_dst });
        $group_by = join("\", \"", @{ $group_by });

        my $query = "INSERT INTO $table_dst (\"$fields_dst\") (SELECT \"$fields_src\" FROM $table_src";
        if (defined $where) {
            $query .= " WHERE $where";
        }
        if (defined $group_by) {
            $query .= " GROUP BY \"$group_by\"";
        }
        $query .= ");";

        $query = join("sum", split("\"sum", $query));
        $query = join(")", split(/\)\"/, $query));

        logmessage ("$query\n", $loglevel);
        my $request = $db->prepare($query);
        $request->execute();
        warn "Data fetching terminated early by error: $DBI::errstr\n" if $DBI::err;
#        $request->execute() or die $DBI::errstr;

        $result=$request->{pgsql_insertid};
        $request->finish();
        $db->disconnect;
    }
    return $result;
}

1;