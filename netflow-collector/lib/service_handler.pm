package service_handler;

$VERSION     = 1.00;
@ISA         = qw(Exporter);
@EXPORT      = ();
@EXPORT_OK   = qw(dec2ip ip2dec table_serialise data_serialise );
%EXPORT_TAGS = ( DEFAULT => [qw(&dec2ip &ip2dec&table_serialise &data_serialise )]);

use lib '.';
use output qw { logmessage };
use Data::Dumper;
use Storable qw(dclone);


sub dec2ip {
    join '.', unpack 'C4', pack 'N', shift;
}

sub ip2dec {
    unpack N => pack CCCC => split /\./ => shift;
}

sub table_serialise {
    my $table    = $_[0];
    my $index    = $_[1];
    my $loglevel = $_[2];
    my $result   = undef;

    my @field_names = split(',', $table->{"fields"});
    foreach my $record (values @{ $table->{"values"} }) {
        my @cells = split(',', $record);
        my $val = undef;
        foreach my $field_name (values @field_names) {
            $val->{$field_name} = shift @cells;
#            print "$field_name\n";
        }
        $result->{$val->{$index}} = dclone $val;
#        push(@{ $result->{$val->{$index}} }, dclone $val);
#        print Dumper $val;
    }

    return $result;
}

sub data_serialise {
    my $data     = $_[0];
    my $key      = $_[1];
    my $loglevel = $_[2];
    my $result   = undef;

    print Dumper $data;
    foreach my $value (values %{ $data }) {
        $result->{$value->{$key}} = $value;
    }

    return $result;
}

1;