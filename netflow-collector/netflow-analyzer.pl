#!/usr/local/bin/perl

use lib '.';
use lib './lib/';

use strict;
use warnings;

use Data::Dumper;
use JSON::PP::Boolean;
use Storable qw(dclone);

use Daemon::Daemonize qw( daemonize write_pidfile );

use output          qw { logmessage };
use getconfig       qw { getconfig setconfig appendconfig };
use service_handler qw { dec2ip ip2dec table_serialise data_serialise };
use pgsql_handler   qw { pgsql_check pgsql_table_insert pgsql_table_insert_from pgsql_table_select pgsql_table_drop pgsql_table_create pgsql_table_check pgsql_table_delete pgsql_table_update };

logmessage ("Begin programm...\n",10);
my $loglevel    = 5;
my $configfile  = 'config.json';

my $globalconfig  = getconfig("config.json",$loglevel-4);
my $config        = dclone $globalconfig->{"analyzer"};
#print Dumper $config;

my $sighup = 0;

sub sighup_handler {
   $sighup = 1;
}

sub sigusr1_handler {
}

if (defined $ARGV[0] && $ARGV[0] eq "-daemonize") {
   my $name          = "netflow";
   my $error_log_qfn = "/var/log/$name.log";
   my $pid_file_qfn  = "/var/run/$name.pid";

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
    while(!$sighup) {
        binanalyze($config,$loglevel);
        datasync($config,$loglevel);

        logmessage("Sleep before start again\n", $loglevel);
        sleep 10;
    }
    return "END";
}

sub datasync {
    my $config   = $_[0];
    my $loglevel = $_[1];

    foreach my $dst (keys %{ $config->{"dstdb"}} ) {
        my $dstconf->{"options"} = dclone $config->{"options"};
        $dstconf->{"db"} = dclone $config->{"dstdb"}->{$dst};
        foreach my $src (keys %{ $config->{"srcdb"}} ) {
            my $srcconf->{"options"} = dclone $config->{"options"};
            $srcconf->{"db"} = dclone $config->{"srcdb"}->{$src};

            my $src_devices   = getdevices($srcconf, $loglevel);
            my $src_templates = gettemplates($srcconf, $src_devices, $loglevel);

            my $dst_devices   = getdevices($dstconf, $loglevel);
            my $dst_templates = gettemplates($dstconf, $dst_devices, $loglevel);

            my $devices_fields        = ["device_header","device_enabled"];
            my $templates_fields      = ["device_id", "template_id", "template_length", "template_header", "template_format", "template_sampling", "template_enabled"];
            my $src_devices_values    = undef;
            my $src_devices_enable    = undef;
            my $src_devices_disable   = undef;
            my $src_templates_values  = undef;
            my $src_templates_enable  = undef;
            my $src_templates_disable = undef;
            foreach my $src_device (keys %{ $src_devices }) {
                if (!defined $dst_devices->{$src_device}) {
                    logmessage ("Device ".$src_device."(".dec2ip($src_device).") not found in destination DB. Creating...\n", $loglevel);
                    push (@{ $src_devices_values }, $src_device."','".$src_devices->{$src_device}->{"device_enabled"});
                } elsif ($dst_devices->{$src_device}->{"device_enabled"} ne $src_devices->{$src_device}->{"device_enabled"}) {
                    if ($dst_devices->{$src_device}->{"device_enabled"} eq "1") {
                        logmessage ("Need to enable device ".$src_device."(".dec2ip($src_device).")...\n", $loglevel);
                        push (@{ $src_devices_enable }, $src_device);
                    } else {
                        logmessage ("Need to disable device ".$src_device."(".dec2ip($src_device).")...\n", $loglevel);
                        push (@{ $src_devices_disable }, $src_device);
                    }
                }
                if (defined $src_templates->{$src_device}->{"templates"}) {
                    foreach my $src_template (keys %{ $src_templates->{$src_device}->{"templates"} }) {
                        if (!defined $dst_templates->{$src_device}->{"templates"} || !defined $dst_templates->{$src_device}->{"templates"}->{$src_template}) {
                            logmessage ("Template ".$src_device."_".$src_template." not found in destination DB. Creating...\n", $loglevel);
                            push (@{ $src_templates_values }, $src_templates->{$src_device}->{"templates"}->{$src_template}->{"device_id"}."','".
                                                              $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_id"}."','".
                                                              $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_length"}."','".
                                                              $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_header"}."','".
                                                              $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_format"}."','".
                                                              $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_sampling"}."','".
                                                              $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_enabled"});
                        } elsif ($dst_templates->{$src_device}->{"templates"}->{$src_template}->{"template_enabled"} ne $src_templates->{$src_device}->{"templates"}->{$src_template}->{"template_enabled"}) {
                            if ($dst_templates->{$src_device}->{"templates"}->{$src_template}->{"template_enabled"} eq "1") {
                                logmessage ("Need to enable template ".$src_device."_".$src_template."\n", $loglevel);
                                push (@{ $src_templates_enable }, $src_device . " AND template_id=" . $src_template);
                            } else {
                                logmessage ("Need to disable template ".$src_device."_".$src_template."\n", $loglevel);
                                push (@{ $src_templates_disable }, $src_device . " AND template_id=" . $src_template);
                            }
                        }
                    }
                }
            }
            if (defined $src_devices_values && scalar $src_devices_values > 0) {
                pgsql_table_insert($dstconf,"devices", $devices_fields, $src_devices_values, $loglevel);
            }
            if (defined $src_devices_enable && scalar $src_devices_enable > 0) {
                pgsql_table_update($srcconf,"devices", "device_enabled", "true", "device_header='" . join("' OR device_header='" , @{ $src_devices_enable }) . "'", $loglevel);
            }
            if (defined $src_devices_disable && scalar $src_devices_disable > 0) {
                pgsql_table_update($srcconf,"devices", "device_enabled", "false", "device_header='" . join("' OR device_header='" , @{ $src_devices_disable }) . "'", $loglevel);
            }

            if (defined $src_templates_values && scalar $src_templates_values > 0) {
                pgsql_table_insert($dstconf,"v9templates", $templates_fields, $src_templates_values, $loglevel);
            }
            if (defined $src_templates_enable && scalar $src_templates_enable > 0) {
                pgsql_table_update($srcconf,"v9templates", "template_enabled", "true", "(device_id=" . join(") OR (device_id=" , @{ $src_templates_enable }) . ")", $loglevel);
            }
            if (defined $src_templates_disable && scalar $src_templates_disable > 0) {
                pgsql_table_update($srcconf,"v9templates", "template_enabled", "false", "(device_id=" . join(") OR (device_id=" , @{ $src_templates_disable }) . ")", $loglevel);
            }
        }
    }

    return 1;
}

sub binanalyze {
    my $config   = $_[0];
    my $loglevel = $_[1];

    my $devices   = undef;
    my $templates = undef;
    my $ipfix     = undef;
    my $export_count = 100000;

    my $conv = {
        'unsigned8'            => ['numeric', '3','NO'],
        'unsigned16'           => ['numeric', '5','NO'],
        'unsigned32'           => ['numeric', '10','NO'],
        'unsigned64'           => ['numeric', '20','NO'],
#    'basicList'            => ['', undef,'NO'],
        'dateTimeSeconds'      => ['bigint', undef,'NO'],
        'dateTimeMicroseconds' => ['', undef,'NO'],
        'dateTimeNanoseconds'  => ['bigint', undef,'NO'],
        'boolean'              => ['boolean', undef,'NO'],
        'string'               => ['text', undef,'NO'],
#    'subTemplateList'      => ['', undef,'NO'],
        'macAddress'           => ['', undef,'NO'],
        'ipv6Address'          => ['inet', undef,'NO'],
        'ipv4Address'          => ['inet', undef,'NO'],
        'dateTimeMilliseconds' => ['bigint', undef,'NO'],
        'octetArray'           => ['character varying',100,'YES'],
#    'subTemplateMultiList' => ['', undef,'NO'],
        'signed32'             => ['integer', undef,'NO'],
        'float64'              => ['', undef,'NO'],
    };

    foreach my $dst (keys %{ $config->{"dstdb"}} ) {
        my $dstconf->{"options"} = dclone $config->{"options"};
        $dstconf->{"db"} = dclone $config->{"dstdb"}->{$dst};
        foreach my $src (keys %{ $config->{"srcdb"}} ) {
            my $srcconf->{"options"} = dclone $config->{"options"};
            $srcconf->{"db"} = dclone $config->{"srcdb"}->{$src};

            $devices   = getdevices($srcconf, $loglevel);
            $templates = gettemplates($srcconf, $devices, $loglevel);


            my $result = pgsql_table_select($dstconf,"*", "ipfix", undef, $loglevel);
            $ipfix  = table_serialise($result, "id", $loglevel);

            my $time   = int(time()/$dstconf->{'options'}->{'data-interval'})*$dstconf->{'options'}->{'data-interval'} - $dstconf->{'options'}->{'data-interval'};

            foreach my $device (values %{ $templates }) {
                if ($device->{'device_enabled'} == 1 && defined $device->{'templates'}) {
                    v9binanalyze($srcconf,$dstconf,$device,$time,$ipfix,$conv,$export_count,$loglevel);
                } else {
                    v5binanalyze($srcconf,$dstconf,$device,$time,$ipfix,$conv,$export_count,$loglevel);
                }
            }
        }
    }
    return 1;
}

sub getdevices {
    my $config   = $_[0];
    my $loglevel = $_[1];

    my $result = pgsql_table_select($config,"*", "devices", undef, $loglevel);
    my $devices = table_serialise($result, "device_header", $loglevel);

    return $devices;
}

sub gettemplates {
    my $config   = $_[0];
    my $devices  = $_[1];
    my $loglevel = $_[2];

    my $templates = $devices;
    my $result = pgsql_table_select($config,"*", "v9templates", undef, $loglevel);
    foreach my $val (values @{ $result->{"values"} }) {
        my @str = split(",", $val);
        my $device_id = $str[0];
        my $template_id = $str[1];
        if (defined $devices->{$device_id}) {
            my $template->{"fields"} = $result->{"fields"};
            push(@{ $template->{"values"} }, $val);
            $template = table_serialise($template, "template_id", $loglevel);
            $templates->{$device_id} = dclone $devices->{$device_id};
            $templates->{$device_id}->{'templates'}->{$template_id} = dclone $template->{$template_id};
        }
    }

    return $templates
}

sub v9binanalyze {
    my $srcconfig    = $_[0];
    my $dstconfig    = $_[1];
    my $device       = $_[2];
    my $time         = $_[3];
    my $ipfix        = $_[4];
    my $conv         = $_[5];
    my $export_count = $_[6];
    my $loglevel     = $_[7];
        logmessage("NFv9 Device with IP ".dec2ip($device->{'device_header'}).":\n",$loglevel);
        foreach my $template (values %{ $device->{'templates'} }) {
            logmessage(" Handling template ID $template->{'template_id'}:\n",$loglevel);
            if ($template->{'template_enabled'} == 1) {
                my $data = undef;
                my $table_bin   = "bin_$device->{'device_header'}_$template->{'template_id'}";
                my $table_fields =  [
                    ["id"          ,"bigserial PRIMARY KEY",undef,"NO"],
                    ["sysuptime"   ,"bigint"               ,undef,"NO"],
                    ["unixseconds" ,"bigint"               ,undef,"NO"]
                ];
                my @header = split(";", "$template->{'template_header'}");
                foreach my $field (values @header) {
                        push @{ $table_fields } , [$field, "bytea", "", "NO"];
                }
                my $result = pgsql_table_check($srcconfig, $table_bin, $table_fields, $loglevel-5);
                if (defined $result && $result == 1) {
                    logmessage(" Binary table looks good.\n", $loglevel);
                    my $table_src = "tmp_$device->{'device_header'}_$template->{'template_id'}";
                    my $table_dst = "raw_$device->{'device_header'}_$template->{'template_id'}";
                    my $table_fields_src =  [
                        ["id"          ,"bigserial PRIMARY KEY",undef,"NO"],
                        ["unixseconds" ,"bigint"               ,undef,"NO"]
                    ];
                    my $table_fields_dst =  [
                        ["id"          ,"bigserial PRIMARY KEY",undef,"NO"],
                        ["unixseconds" ,"bigint"               ,undef,"NO"]
                    ];
                    my $fields_dst = ["unixseconds"];
                    my $fields_src = ["unixseconds"];
                    my $group_by   = ["unixseconds"];
                    my $fields_sum = {
                        "octetDeltaCount"  => "sum(\"octetDeltaCount\")",
                        "packetDeltaCount" => "sum(\"packetDeltaCount\")",
                    };
                    $result = pgsql_table_select($srcconfig,"*", $table_bin, "unixseconds>". ($time-$dstconfig->{'options'}->{'bincleanup'}), $loglevel-2, "ORDER BY id LIMIT 1");
                    my @fields = split(",", $result->{'fields'});
                    foreach my $key (keys @fields) {
                        next if ($fields[$key] eq 'id' || $fields[$key] eq 'sysuptime' || $fields[$key] eq 'unixseconds' || $fields[$key] eq '22' || $fields[$key] eq '21' || $fields[$key] eq '1' || $fields[$key] eq '2');
                        push @{ $data->{'fields'} }, $fields[$key];
                    }
                    push @{ $data->{'fields'} }, "1";
                    push @{ $data->{'fields'} }, "2";
                    foreach my $field (values @{ $data->{'fields'} }) {
                        if (defined $ipfix->{$field} && defined $conv->{$ipfix->{$field}->{'data_type'}}) {
                            my @header;
                            push @header, $ipfix->{$field}->{'name'};
                            push @header, @{ $conv->{$ipfix->{$field}->{'data_type'}} };
                            push @{ $table_fields_src }, [ @header ];
                            push @{ $table_fields_dst }, [ @header ];
                            push @{ $fields_dst }, $ipfix->{$field}->{'name'};
                            if (defined $fields_sum->{$ipfix->{$field}->{'name'}}) {
                                push @{ $fields_src }, "$fields_sum->{$ipfix->{$field}->{'name'}}";
                                } else {
                                push @{ $group_by }, "$ipfix->{$field}->{'name'}";
                                push @{ $fields_src }, "$ipfix->{$field}->{'name'}";
                            }
                        } else {
                            logmessage ("Program stop with error unknown Field with ID $field\n",10);
                            exit 0;
                        }
                    }
                    $result = pgsql_table_check($dstconfig, $table_dst, $table_fields_dst, $loglevel);
                    if (defined $result && $result == 1) {
                        logmessage(" Destination table looks good.\n", $loglevel);
                    } else {
                        pgsql_table_create($dstconfig, $table_dst, $table_fields_dst, $loglevel);
                    }
                    $result = pgsql_table_check($dstconfig, $table_src, $table_fields_src, $loglevel);
                    if (defined $result && $result == 1) {
                        logmessage(" Temp table looks good.\n", $loglevel);
                    } else {
                        pgsql_table_create($dstconfig, $table_src, $table_fields_src, $loglevel);
                    }
                    my $lastid = 1;
                    while (defined $lastid) {
                        $lastid = undef;
                        $data->{'values'} = undef;
                        $result = pgsql_table_select($srcconfig,"*", $table_bin, "unixseconds>".($time-$dstconfig->{'options'}->{'bincleanup'}), $loglevel-2, "ORDER BY id LIMIT $export_count");
                        my @fields = split(",", $result->{'fields'});
                        foreach my $record (values @{ $result->{'values'} }) {
                            my @cells = split(",",$record);
                            my @values;
                            my $sysuptime = undef;
                            my $unixseconds = undef;
                            my $octets = undef;
                            my $packets = undef;
                            my $flowstart = undef;
                            my $flowend = undef;
                            foreach my $key (keys @fields) {
                                if ($fields[$key] eq 'id') {
                                    $lastid = $cells[$key];
                                    next;
                                }
                                if ($fields[$key] eq 'sysuptime') {
                                    $sysuptime = $cells[$key];
                                    next;
                                }
                                if ($fields[$key] eq 'unixseconds') {
                                    $unixseconds = $cells[$key];
                                    next;
                                }
                                if ($fields[$key] eq '21') {
                                    $flowend = $unixseconds - int(($sysuptime - hex($cells[$key]))/1000);
                                    $flowend = int($flowend/$dstconfig->{'options'}->{'data-interval'}) * $dstconfig->{'options'}->{'data-interval'};
                                    next;
                                }
                                if ($fields[$key] eq '22') {
                                    $flowstart = $unixseconds - int(($sysuptime - hex($cells[$key]))/1000);
                                    $flowstart = int($flowstart/$dstconfig->{'options'}->{'data-interval'}) * $dstconfig->{'options'}->{'data-interval'};
                                    next;
                                }
                                if ($fields[$key] eq '1') {
                                    $octets = hex($cells[$key]);
                                    next;
                                }
                                if ($fields[$key] eq '2') {
                                    $packets = hex($cells[$key]);
                                    next;
                                }
                                if ($ipfix->{$fields[$key]}->{'data_type'} eq 'ipv4Address' ) {
                                    push @values, dec2ip(hex($cells[$key]));
                                    next;
                                }
                                push @values, hex($cells[$key]);
                            }
                            if (defined $flowstart && defined $flowend && defined $octets && defined $packets) {
                                if ($flowstart == $flowend) {
                                    unshift @values, $flowend;
                                    push @values, $octets;
                                    push @values, $packets;
                                    push @{ $data->{'values'} }, join ("','", @values);
                                } else {
                                    my $count = ($flowend - $flowstart) / $dstconfig->{'options'}->{'data-interval'};
                                    $count ++;
                                    my $sumoctets = 0;
                                    my $sumpackets = 0;
                                    for (my $i=0; $i < $count; $i++) {
                                        my @val = @values;
                                        unshift @val, $flowstart + $i * $dstconfig->{'options'}->{'data-interval'};
                                        $sumoctets += $octets/$count;
                                        $sumpackets += $packets/$count;
                                        push @val, int($sumoctets - int($octets/$count*$i));
                                        push @val, int($sumpackets - int($packets/$count*$i));
                                        push @{ $data->{'values'} }, join ("','", @val);
                                    }
                                }
                            }
                        }
                        pgsql_table_insert($dstconfig,$table_src, $fields_dst, $data->{'values'}, $loglevel-5);
                        if (defined $lastid) {
                            logmessage("LastId: $lastid\n",$loglevel);
                            my $condition  = ["id<=$lastid"];
                            pgsql_table_delete($srcconfig, $table_bin, $condition, $loglevel);
                        }
                    }
                    my $condition = "unixseconds<$time";
                    pgsql_table_insert_from($dstconfig, $table_src, $fields_src, $table_dst, $fields_dst, $group_by, $condition, $loglevel);
                    my $clear_time = (time()-$dstconfig->{'options'}->{'bincleanup'});
                    $condition  = ["unixseconds<$clear_time"];
                    pgsql_table_delete($dstconfig, $table_dst, $condition, $loglevel);
                    $condition = ["unixseconds<$time"];
                    pgsql_table_delete($dstconfig, $table_src, $condition, $loglevel);
                }
            } else {
                logmessage(" Template disabled\n", $loglevel);
            }
        }
}

sub v5binanalyze() {
    my $srcconfig    = $_[0];
    my $dstconfig    = $_[1];
    my $device       = $_[2];
    my $time         = $_[3];
    my $ipfix        = $_[4];
    my $conv         = $_[5];
    my $export_count = $_[6];
    my $loglevel     = $_[7];
    logmessage("Check for netflow v5\n", $loglevel);

    my $table_bin   = "v5_" . $device->{'device_header'};
    my $table_tmp   = "tmp_" . $device->{'device_header'};
    my $table_raw   = "raw_" . $device->{'device_header'};

    my $data = undef;
    my $fields = [
        "unixseconds",
        "sourceIPv4Address",
        "destinationIPv4Address",
        "ipNextHopIPv4Address",
        "ingressInterface",
        "egressInterface",
        "packetDeltaCount",
        "octetDeltaCount",
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

    my $table_header_bin = [
        ["id","bigserial PRIMARY KEY",undef,"NO"],
        ["sysuptime"                   ,"bigint"               ,undef,"NO"],
        ["unixseconds"                 ,"bigint"               ,undef,"NO"],
        ["sourceIPv4Address"           ,"inet"                 ,undef,"NO"],
        ["destinationIPv4Address"      ,"inet"                 ,undef,"NO"],
        ["ipNextHopIPv4Address"        ,"inet"                 ,undef,"NO"],
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

    logmessage("Check binary table:\n", $loglevel);

    my $result = pgsql_table_check($srcconfig, $table_bin, $table_header_bin, $loglevel-5);
    if (defined $result && $result == 1) {
        logmessage("Table $table_bin exists\n", $loglevel);
    } elsif (defined $result && $result == 0) {
        logmessage("Table $table_bin table has the wrong structure.\n", $loglevel);
        return undef;
    } else {
        logmessage("Table '$table_bin' does not exist. Skip...\n", $loglevel);
        return undef;
#        next;
    }

    my $table_header_tmp = [
        ["id"                          ,"bigserial PRIMARY KEY",undef,"NO"],
        ["unixseconds"                 ,"bigint"               ,undef,"NO"],
        ["sourceIPv4Address"           ,"inet"                 ,undef,"NO"],
        ["destinationIPv4Address"      ,"inet"                 ,undef,"NO"],
        ["ipNextHopIPv4Address"        ,"inet"                 ,undef,"NO"],
        ["ingressInterface"            ,"numeric"              ,"10" ,"NO"],
        ["egressInterface"             ,"numeric"              ,"10" ,"NO"],
        ["packetDeltaCount"            ,"numeric"              ,"20" ,"NO"],
        ["octetDeltaCount"             ,"numeric"              ,"20" ,"NO"],
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
    $result = pgsql_table_check($dstconfig, $table_tmp, $table_header_tmp, $loglevel-5);
    if (defined $result && $result == 1) {
        logmessage("Table $table_tmp exists\n", $loglevel);
    } elsif (defined $result && $result == 0) {
        logmessage("Table $table_tmp table has the wrong structure.\n", $loglevel);
        return undef;
    } else {
        logmessage("Table '$table_tmp' does not exist. Attempt to create...\n", $loglevel);
        pgsql_table_create($dstconfig, $table_tmp, $table_header_tmp, $loglevel);
    }
    my $lastid = 1;
    while (defined $lastid) {
        $lastid = undef;
        $data->{'values'} = undef;
        $result = pgsql_table_select($srcconfig,"*", $table_bin, "unixseconds>".($time-$dstconfig->{'options'}->{'bincleanup'}), $loglevel, " ORDER BY id LIMIT $export_count");
        my @fields = split(",", $result->{'fields'});
        foreach my $record (values @{ $result->{'values'} }) {
            my @values;
            my @cells = split(",",$record);
            $lastid = shift(@cells);
            my $sysuptime = shift(@cells);
            my $unixseconds = $cells[0];
            my $flowstart = splice(@cells, 8, 1);
            $flowstart = $unixseconds - int(($sysuptime - $flowstart) / 1000);
            $flowstart = int($flowstart / $dstconfig->{'options'}->{'data-interval'}) * $dstconfig->{'options'}->{'data-interval'};
            my $flowend = splice(@cells, 8, 1);
            $flowend = $unixseconds - int(($sysuptime - $flowend) / 1000);
            $flowend = int($flowend / $dstconfig->{'options'}->{'data-interval'}) * $dstconfig->{'options'}->{'data-interval'};
            my $octets = $cells[7];
            my $packets = $cells[6];
            if (defined $flowstart && defined $flowend && defined $octets && defined $packets) {
                if ($flowstart == $flowend) {
                    $cells[0] = $flowend;
                    push @{ $data->{'values'} }, join ("','", @cells);
#                    print " ".join ("','", @cells)."\n";
                } else {
                    my $count = ($flowend - $flowstart) / $dstconfig->{'options'}->{'data-interval'};
                    $count ++;
                    my $sumoctets = 0;
                    my $sumpackets = 0;
                    for (my $i=0; $i < $count; $i++) {
                        my @val = @cells;
                        $val[0] = $flowstart + $i * $dstconfig->{'options'}->{'data-interval'};
                        $sumoctets += $octets/$count;
                        $sumpackets += $packets/$count;
                        $val[7] =  int($sumoctets - int($octets/$count*$i));
                        $val[6] =  int($sumpackets - int($packets/$count*$i));
                        push @{ $data->{'values'} }, join ("','", @val);
#                        print "!".join ("','", @val)."\n";
                    }
                }
            }
#                print Dumper $data;
        }
        pgsql_table_insert($dstconfig,$table_tmp, $fields, $data->{'values'}, $loglevel-5);
        if (defined $lastid) {
            logmessage("$lastid\n", $loglevel);
            my $condition  = ["id<=$lastid"];
            pgsql_table_delete($srcconfig, $table_bin, $condition, $loglevel);
        }
    }
    my $table_header_raw = [
        ["id"                          ,"bigserial PRIMARY KEY",undef,"NO"],
        ["unixseconds"                 ,"bigint"               ,undef,"NO"],
        ["sourceIPv4Address"           ,"inet"                 ,undef,"NO"],
        ["destinationIPv4Address"      ,"inet"                 ,undef,"NO"],
        ["ipNextHopIPv4Address"        ,"inet"                 ,undef,"NO"],
        ["ingressInterface"            ,"numeric"              ,"10" ,"NO"],
        ["egressInterface"             ,"numeric"              ,"10" ,"NO"],
        ["packetDeltaCount"            ,"numeric"              ,"20" ,"NO"],
        ["octetDeltaCount"             ,"numeric"              ,"20" ,"NO"],
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
    $result = pgsql_table_check($dstconfig, $table_raw, $table_header_raw, $loglevel-5);
    if (defined $result && $result == 1) {
        logmessage("Table $table_raw exists\n", $loglevel);
    } elsif (defined $result && $result == 0) {
        logmessage("Table $table_raw table has the wrong structure.\n", $loglevel);
        return undef;
    } else {
        logmessage("Table '$table_raw' does not exist. Attempt to create...\n", $loglevel);
        pgsql_table_create($dstconfig, $table_raw, $table_header_raw, $loglevel);
    }

        my $fields_src = [
        "unixseconds",
        "sourceIPv4Address",
        "destinationIPv4Address",
        "ipNextHopIPv4Address",
        "ingressInterface",
        "egressInterface",
        "sum(\"packetDeltaCount\")",
        "sum(\"octetDeltaCount\")",
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
    my $group_by = [
        "unixseconds",
        "sourceIPv4Address",
        "destinationIPv4Address",
        "ipNextHopIPv4Address",
        "ingressInterface",
        "egressInterface",
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

    my $condition = "unixseconds<$time";
    pgsql_table_insert_from($dstconfig, $table_tmp, $fields_src, $table_raw, $fields, $group_by, $condition, $loglevel);
    my $clear_time = (time()-$dstconfig->{'options'}->{'bincleanup'});
    $condition  = ["unixseconds<$clear_time"];
    pgsql_table_delete($dstconfig, $table_raw, $condition, $loglevel);
    $condition = ["unixseconds<$time"];
    pgsql_table_delete($dstconfig, $table_tmp, $condition, $loglevel);
}
