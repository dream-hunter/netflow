package output;

$VERSION     = 1.00;
@ISA         = qw(Exporter);
@EXPORT      = ();
@EXPORT_OK   = qw(logmessage);
%EXPORT_TAGS = ( DEFAULT => [qw(&logmessage)]);

sub logmessage {
    my $string = $_[0];
    my $loglevel = $_[1];
    if (defined $loglevel && $loglevel >= 5) { print $string; }
}

1;