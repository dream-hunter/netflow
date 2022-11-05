#!/usr/local/bin/perl

use lib '.';
use lib './lib/';

use strict;
use warnings;

use Data::Dumper;
use JSON::PP::Boolean;
use Storable qw(dclone);


use IO::Socket::INET;
use POSIX;

use threads;
use Thread;
use Thread::Queue;

use Daemon::Daemonize qw( daemonize write_pidfile );

use output          qw { logmessage };
use getconfig       qw { getconfig setconfig appendconfig };
use service_handler qw { dec2ip ip2dec table_serialise data_serialise };
use pgsql_handler   qw { pgsql_check pgsql_table_insert pgsql_table_insert_from pgsql_table_select pgsql_table_drop pgsql_table_create pgsql_table_check pgsql_table_delete pgsql_tables_list };

logmessage ("Begin programm...\n",10);
my $loglevel    = 7;
my $configfile  = 'config.json';
my $time = time();

my $globalconfig  = getconfig("config.json",$loglevel-4);
my $config        = dclone $globalconfig->{"collector"};
print Dumper $config;

my $devices       = undef;
my $templates     = undef;
my $v9thread      = undef;
my $v5thread      = undef;
my $v9queue       = undef;
my $v5queue       = undef;

my $sighup = 0;

sub sighup_handler {
   $sighup = 1;
}

sub sigusr1_handler {
}

if (defined $ARGV[0] && $ARGV[0] eq "-daemonize") {
   my $name          = "netflow";
   my $error_log_qfn = "/var/log/$name.log";
   my $pid_file_qfn  = "/var/run/name/$name-collector.pid";

   daemonize(
      close  => 'std',
      stderr => $error_log_qfn,
   );

   $SIG{HUP}  = \&sighup_handler;
   $SIG{USR1} = \&sigusr1_handler;

   write_pidfile($pid_file_qfn);

    my $res = main_proc();
    logmessage ("$res\n",10);
} else {
    my $res = main_proc();
    logmessage ("$res\n",10);
}



sub main_proc {
    my $result = pgsql_check($config, $loglevel);
    if (!defined $result || $result != 1) { exit 0; }

    $devices   = getdevices($config, $loglevel);
    $templates = gettemplates($config, $devices, $loglevel);

    my ($socket,$received_data,$peer_address,$peer_port, $version);
    #--------- Init Socket ----------------
    $socket = new IO::Socket::INET (
        LocalPort => $config->{"options"}->{"listenport"},
        Proto => 'udp',
    ) or die "ERROR in Socket Creation : $!\n";
    #--------- Reading Socket -------------
    while(!$sighup) {
        my ($received_data);
        while(!$received_data) {
            $socket->recv($received_data,0xFFFF);
        }
        $peer_address = unpack("N", $socket->peeraddr());
        if (!defined $devices->{$peer_address}) {
            my $result = pgsql_table_select($config, "*", "devices", "device_header='$peer_address'", $loglevel);
            my $device = table_serialise($result, "device_header", $loglevel);
            if (defined $device->{$peer_address}) {
                logmessage("Device $peer_address found\n", $loglevel);
                $devices->{$peer_address} = dclone $device->{$peer_address};
            } else {
                logmessage("Device $peer_address not found\n", $loglevel);
                my $fields = ["device_header","device_description","device_data","device_enabled"];
                my $values = ["$peer_address','','','false"];
                my $result = pgsql_table_insert($config,"devices", $fields, $values, $loglevel);
            }
        } elsif ($devices->{$peer_address}->{"device_enabled"}) {
            my $version = unpack("n", substr($received_data,0,2));
            if (defined $version && $version == 5) {
                fv5($config, $received_data, $peer_address, $loglevel);
            }
            if (defined $version && $version == 9) {
                fv9($config, $received_data, $peer_address, $loglevel);
            }
        }

        if (($time + $config->{"options"}->{"device_update_interval"}) < time()) {
            logmessage("Check devices for updates;\n", $loglevel);
            $time = time();
            if (defined $v9thread->{"service"}) {
                if ($v9thread->{"service"}->is_joinable || !$v9thread->{"service"}->is_running) {
                    logmessage("Service thread exists. Need restart...\n", $loglevel);
                    my $data = $v9thread->{"service"}->join;
                    $devices   = dclone $data->{"devices"};
                    $templates = dclone $data->{"templates"};
                    undef $v9thread->{"service"};
                    $v9thread->{"service"}=threads->new(\&thread_service,$config,$loglevel);
                }
            } else {
                logmessage("Service thread not exists. Starting up and sending data...\n", $loglevel);
                $v9thread->{"service"}=threads->new(\&thread_service,$config,$loglevel);
            }
        }
    }
    #Joining threads
    foreach my $thr(threads->list) {
        $thr->join;
    }

    #Closing Socket
    $socket->close();

    return "END";
}

sub fv5 {
    my $config        = $_[0];
    my $received_data = $_[1];
    my $peer_address  = $_[2];
    my $loglevel      = $_[3];

    my $data_length   = length($received_data);
    logmessage ("Got v5 packet from " . dec2ip($peer_address) . " - $data_length bytes\n", $loglevel-2);

    if (defined $v5queue->{$peer_address}) {
        $v5queue->{$peer_address}->enqueue($received_data);
    } else {
        $v5queue->{$peer_address}=Thread::Queue->new;
        $v5queue->{$peer_address}->enqueue($received_data);
    }

    if (defined $v5thread->{$peer_address}) {
        if ($v5thread->{$peer_address}->is_joinable || !$v5thread->{$peer_address}->is_running) {
            my $v5result = $v5thread->{$peer_address}->join;
            undef $v5thread->{$peer_address};
            $v5thread->{$peer_address}=threads->new(\&v5thread,$config,$peer_address,$loglevel);
        }
    } else {
        logmessage("Thread #$peer_address not exists. Starting up and sending data...\n", $loglevel-3);
        $v5thread->{$peer_address}=threads->new(\&v5thread,$config,$peer_address,$loglevel);
    }
    return 0;
}

sub fv9 {
    my $config        = $_[0];
    my $received_data = $_[1];
    my $peer_address  = $_[2];
    my $loglevel      = $_[3];

    my $data_length   = length($received_data);
    logmessage ("Got V9 packet from " . dec2ip($peer_address) . " - $data_length bytes\n", $loglevel-2);

    if (defined $v9queue->{$peer_address}) {
        $v9queue->{$peer_address}->enqueue($received_data);
    } else {
        $v9queue->{$peer_address}=Thread::Queue->new;
        $v9queue->{$peer_address}->enqueue($received_data);
    }

    if (defined $v9thread->{$peer_address}) {
        if ($v9thread->{$peer_address}->is_joinable || !$v9thread->{$peer_address}->is_running) {
            my $template = $v9thread->{$peer_address}->join;
            foreach my $template_id (keys %{ $template }) {
                if (!defined $templates->{$peer_address}->{$template_id}) {
                    $templates->{$peer_address}->{$template_id} = dclone $template->{$template_id};
                }
            }
            undef $v9thread->{$peer_address};
            $v9thread->{$peer_address}=threads->new(\&v9thread,$config,$peer_address,$templates->{$peer_address},$loglevel);
        }
    } else {
        logmessage("Thread #$peer_address not exists. Starting up and sending data...\n", $loglevel-3);
        $v9thread->{$peer_address}=threads->new(\&v9thread,$config,$peer_address,$templates->{$peer_address},$loglevel);
    }
    return 0;
}

sub getdevices {
    my $config   = $_[0];
    my $loglevel = $_[1];

    my $result = pgsql_table_select($config,"*", "devices", undef, $loglevel+10);
    my $devices = table_serialise($result, "device_header", $loglevel);
#    print Dumper $devices;

    return $devices;
}

sub gettemplates {
    my $config   = $_[0];
    my $devices  = $_[1];
    my $loglevel = $_[2];

    my $result = pgsql_table_select($config,"*", "v9templates", undef, $loglevel+10);
    foreach my $val (values @{ $result->{"values"} }) {
        my @str = split(",", $val);
        my $device_id = $str[0];
        my $template_id = $str[1];
        if (defined $devices->{$device_id}) {
            my $template->{"fields"} = $result->{"fields"};
            push(@{ $template->{"values"} }, $val);
            $template = table_serialise($template, "template_id", $loglevel);
            $templates->{$device_id}->{$template_id} = dclone $template->{$template_id};
        }
    }
#    print Dumper $templates;

    return $templates
}

sub thread_service {
    my $config    = $_[0];
    my $loglevel  = $_[1];

    my $result    = undef;
    my $data      = undef;

    $data->{"devices"}   = getdevices($config, $loglevel);
    $data->{"templates"} = gettemplates($config, $devices, $loglevel);

    logmessage ("Service thread started...\n", $loglevel);

#    $result = pgsql_table_select($config,"table_name", "information_schema.tables", "table_schema = 'public' AND table_name LIKE 'bin_%'", $loglevel-5);
    $result = pgsql_tables_list($config, "'bin_%'", $loglevel-5);
#    print Dumper $result;
    foreach my $tablename (values @{ $result->{values} }) {
        my $condition = undef;
        if (defined $config->{"options"}->{"bincleanup"}) {
            $condition = ["unixseconds < " . (time() - $config->{"options"}->{"bincleanup"})];
        } else {
            $condition = ["unixseconds < " . (time() - 86400)];
        }
        pgsql_table_delete($config, $tablename, $condition, $loglevel-5);
    }

    logmessage ("Service thread is done...\n", $loglevel);
#    print Dumper $data;
    return $data;
}

sub v5thread {
    my $config       = $_[0];
    my $peer_address = $_[1];
    my $loglevel     = $_[2];
    my ($i, $j);
    logmessage("\nStarted thread v5 for device ".dec2ip($peer_address)." with ID #$peer_address\n", $loglevel-2);
    my $data = undef;

    while (1) {
        if ($v5queue->{$peer_address}->pending) {
            my $received_data = $v5queue->{$peer_address}->dequeue;
            my $data_length   = length($received_data);
            logmessage("v5 thread #$peer_address got data ($data_length bytes). Processing...\n", $loglevel-2);
            my ($version, $count, $system_uptime, $unix_seconds, $unix_nseconds, $package_sequence, $source_type, $source_id, $sampling) = unpack("n2N4HHn", substr($received_data,0,24));
            my @records;
            for (my $i=0; substr($received_data, 24+48*$i, 48); $i++) {
                my @substr = unpack("N3n2N4n2C4n2C2n", substr($received_data, 24+48*$i, 48));
                $substr[0] = dec2ip($substr[0]);
                $substr[1] = dec2ip($substr[1]);
                $substr[2] = dec2ip($substr[2]);
                if ($sampling > 0) {
                    $substr[5] *= $sampling;
                    $substr[6] *= $sampling;
                }
                splice(@substr, 19, 1);
                splice(@substr, 11, 1);
                unshift(@substr, $unix_seconds);
                unshift(@substr, $system_uptime);
                push(@records, join("','", @substr));
                push(@{ $data->{'records'} }, @records);
            }
        } else {
            $data->{"template_header"} = [
                "sysuptime",
                "unixseconds",
                "sourceIPv4Address",
                "destinationIPv4Address",
                "ipNextHopIPv4Address",
                "ingressInterface",
                "egressInterface",
                "packetDeltaCount",
                "octetDeltaCount",
                "flowStartSysUpTime",
                "flowEndSysUpTime",
                "sourceTransportPort",
                "destinationTransportPort",
                "tcpControlBits",
                "protocolIdentifier",
                "ipClassOfService",
                "bgpSourceAsNumber",
                "bgpDestinationAsNumber",
                "sourceIPv4PrefixLength",
                "destinationIPv4PrefixLength"
            ];

            my $table_name   = "v5_" . $peer_address;
            my $table_header = [
                ["id"                          ,"bigserial PRIMARY KEY",undef,"NO"],
                ["sysuptime"                   ,"bigint"               ,undef,"NO"],
                ["unixseconds"                 ,"bigint"               ,undef,"NO"],
                ["sourceIPv4Address"           ,"inet"                 ,undef,'NO'],
                ["destinationIPv4Address"      ,"inet"                 ,undef,'NO'],
                ["ipNextHopIPv4Address"        ,"inet"                 ,undef,'NO'],
                ["ingressInterface"            ,"numeric"              ,"10" ,"NO"],
                ["egressInterface"             ,"numeric"              ,"10" ,"NO"],
                ["packetDeltaCount"            ,"numeric"              ,"20" ,"NO"],
                ["octetDeltaCount"             ,"numeric"              ,"20" ,"NO"],
                ["flowStartSysUpTime"          ,"numeric"              ,"10" ,"NO"],
                ["flowEndSysUpTime"            ,"numeric"              ,"10" ,"NO"],
                ["sourceTransportPort"         ,"numeric"              ,"5" ,"NO"],
                ["destinationTransportPort"    ,"numeric"              ,"5" ,"NO"],
                ["tcpControlBits"              ,"numeric"              ,"3" ,"NO"],
                ["protocolIdentifier"          ,"numeric"              ,"3" ,"NO"],
                ["ipClassOfService"            ,"numeric"              ,"3" ,"NO"],
                ["bgpSourceAsNumber"           ,"numeric"              ,"5" ,"NO"],
                ["bgpDestinationAsNumber"      ,"numeric"              ,"5" ,"NO"],
                ["sourceIPv4PrefixLength"      ,"numeric"              ,"3" ,"NO"],
                ["destinationIPv4PrefixLength" ,"numeric"              ,"3" ,"NO"]
            ];

            my $result = pgsql_table_check($config, $table_name, $table_header, $loglevel-5);
            if (defined $result && $result == 1) {
                logmessage("Table $table_name exists\n", $loglevel);
            } elsif (defined $result && $result == 0) {
                logmessage("Table $table_name table has the wrong structure.\n", $loglevel);
                return undef;
            } else {
                logmessage("Table '$table_name' does not exist. Attempt to create...\n", $loglevel);
                pgsql_table_create($config, $table_name, $table_header, $loglevel);
            }
            $result = pgsql_table_insert($config,$table_name,$data->{"template_header"}, $data->{"records"}, $loglevel-5);
            my $condition = undef;
            if (defined $config->{"options"}->{"bincleanup"}) {
                $condition = ["unixseconds < " . (time() - $config->{"options"}->{"bincleanup"})];
            } else {
                $condition = ["unixseconds < " . (time() - 86400)];
            }
            pgsql_table_delete($config, $table_name, $condition, $loglevel);

            logmessage("v5 thread #$peer_address have no more data. Sending records to DB and leave...\n", $loglevel-2);
            sleep(1);
            last;
        }
    }
    return 1;
}

sub v9thread {
    my $config       = $_[0];
    my $peer_address = $_[1];
    my $templates    = $_[2];
    my $loglevel     = $_[3];
    my ($i, $j);
#    print Dumper $templates;
    logmessage("\nStarted thread v9 for device ".dec2ip($peer_address)." with ID #$peer_address\n", $loglevel-2);
    my $data = undef;
    while (1) {
        if ($v9queue->{$peer_address}->pending) {
            my $received_data = $v9queue->{$peer_address}->dequeue;
            my $data_length   = length($received_data);
            logmessage("v9 thread #$peer_address got data ($data_length bytes). Processing...\n", $loglevel-2);
            my ($version, $count, $system_uptime, $unix_seconds, $package_sequence, $source_id) = unpack("n2N4", substr($received_data,0,20));
            my $marker = 20;
            for ($i=0; $i < $count; $i++) {
                my ($flowset_id, $length) = unpack("n2", substr($received_data,$marker,4));
                if ($flowset_id == 0) {
# Template processing
                    logmessage(" - got template data:\n", $loglevel-4);
                    $length += $marker;
                    $marker += 4;
                    while ($marker < $length) {
                        my ($template_id, $field_count) = unpack("n2",substr($received_data,$marker,4));
                        $marker += 4;
                        my $template_data = substr ($received_data, $marker, $field_count * 4);
                        my (@n,@l);
                        for (my $j=0; $j<$field_count;$j++) {
                            push @n, (unpack("n", substr($template_data, $j*4,2)));
                            push @l, (unpack("n", substr($template_data, $j*4+2,2))*2);
                        }
                        my $template_format = "H".join("H",@l);
                        my $template_header = join(";",@n);
                        my $template_length = 0;
                        $template_length += $_/2 foreach @l;

                        if (!defined $templates->{$template_id}) {
                            $templates->{$template_id}->{"template_format"} = $template_format;
                            $templates->{$template_id}->{"template_header"} = $template_header;
                            $templates->{$template_id}->{"template_length"} = $template_length;
                            print Dumper $templates;
                            my $fields = ["device_id","template_id","template_length","template_header","template_format","template_sampling","template_enabled"];
                            my $values = ["$peer_address','$template_id','$template_length','$template_header','$template_format','0','0"];
                                my $result = pgsql_table_insert($config,"v9templates", $fields, $values, $loglevel);
                        } else {
                            my $result;
                                $result = pgsql_table_select($config,"*", "v9templates", "device_id='$peer_address' AND template_id='$template_id'", $loglevel);
                            my $template = table_serialise($result, "template_id", $loglevel);
                            if (($template->{$template_id}->{template_length} eq $templates->{$template_id}->{template_length}) &&
                                ($template->{$template_id}->{template_format} eq $templates->{$template_id}->{template_format}) &&
                                ($template->{$template_id}->{template_header} eq $templates->{$template_id}->{template_header})) {
                                logmessage("Template looks fine\n", $loglevel);
                                $templates->{$template_id} = dclone $template->{$template_id};
                            } else {
                                logmessage("Problem with template\n", $loglevel);
                                print Dumper $template;
                                print Dumper $templates;
                                exit 0;
                            }
                        }
                        $marker += $field_count*4;
                    }
                } else {
# Netflow data processing
                    logmessage(" - got netflow data:\n", $loglevel-4);

                    if (defined $templates->{$flowset_id} && $templates->{$flowset_id}->{"template_length"} > 0) {
                        my $template = $templates->{$flowset_id};
                        logmessage("\tTIMERS: $system_uptime - $unix_seconds;\n\tROW LENGHT: $template->{\"template_length\"} bytes\n",  $loglevel-4);
                        my ($j, @records) = fv9_records(substr($received_data, $marker, $length), $length, $template->{"template_format"}, $template->{"template_length"}, $system_uptime, $unix_seconds);
                        $i += $j;
                        $marker += $template->{"template_length"}*$j+4;
                        my $msg = join("\n", @records);
                        logmessage("$msg\n", $loglevel-5);
                        @{ $data->{$flowset_id}->{"template_header"} } = split(";",$templates->{$flowset_id}->{"template_header"});
                        @{ $data->{$flowset_id}->{"template_format"} } = split("H",$templates->{$flowset_id}->{"template_format"});
                        shift (@{ $data->{$flowset_id}->{"template_format"} });
                        if (defined $templates->{$flowset_id}->{"template_enabled"} && $templates->{$flowset_id}->{"template_enabled"} == 1) {
                            push @{ $data->{$flowset_id}->{"records"} }, @records;
                        }
                    }
                }
            }
        } else {
            my $result = fv9_sql($config, $peer_address, $data, $loglevel);
            logmessage("v9 thread #$peer_address have no more data. Sending records to DB and leave...\n", $loglevel-2);
            sleep(1);
            last;
        }
    }
    if (defined $templates) { return $templates; } else { return undef; }
}

sub fv9_records {
    my $data             = $_[0];
    my $length           = $_[1];
    my $template_format  = $_[2];
    my $template_length  = $_[3];
    my $system_uptime    = $_[4];
    my $unix_seconds     = $_[5];

    my $marker = 4;
    my ($count, @substr, @records);
    while ($marker+$template_length <= $length) {
        my $substr = substr ($data, $marker, $template_length);
        @substr =  unpack ($template_format, $substr);
        unshift(@substr, $unix_seconds);
        unshift(@substr, $system_uptime);
        $marker += $template_length;
        $count ++;
        push @records, join ("','", @substr);
    }
return $count, @records;
};

sub fv9_sql {
    my $config       = $_[0];
    my $peer_address = $_[1];
    my $data         = $_[2];
    my $loglevel     = $_[3];
    my $result       = undef;

    foreach my $template_id (keys %{ $data }) {
        my $table_name = "bin_" . $peer_address . "_" . $template_id;
        my $table_header =  [
            ["id"          ,"bigserial PRIMARY KEY",undef,"NO"],
            ["sysuptime"   ,"bigint"               ,undef,"NO"],
            ["unixseconds" ,"bigint"               ,undef,"NO"]
        ];
        foreach my $key (keys @{ $data->{$template_id}->{"template_header"} }) {
            push @{ $table_header } , [$data->{$template_id}->{'template_header'}->[$key], "bytea", "", "NO"];
        }
        $result = pgsql_table_check($config, $table_name, $table_header, $loglevel-5);
        if (defined $result && $result == 1) {
            logmessage("Table $table_name exists and looks fine\n", $loglevel);
        } elsif (defined $result && $result == 0) {
            logmessage("Table $table_name table has the wrong structure.\n", $loglevel);
            return undef;
        } else {
            logmessage("Table '$table_name' does not exist. Attempt to create...\n", $loglevel);
            pgsql_table_create($config, $table_name, $table_header, $loglevel);
        }
        my $header = $data->{$template_id}->{"template_header"};
        unshift(@{ $header }, "unixseconds");
        unshift(@{ $header }, "sysuptime");
        $result = pgsql_table_insert($config,$table_name,$data->{$template_id}->{"template_header"}, $data->{$template_id}->{"records"}, $loglevel-5);
    }
    return $result;
}