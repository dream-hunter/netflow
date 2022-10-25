Warning: USE OF THIS PRODUCT IMPLIES APPROPRIATE KNOWLEDGE IN THE SERVER AND NETWORK ADMINISTRATION.

# DESCRIPTION:

Netflow project used to gather, store and process netflow data from sensors like Cisco routers. The project includes collector, analyzer and monitor.

Collector and analyzer:
This is a multithreaded application (daemon). After getting data, it transfers data to analyzer, which process it and send into database. The program based on perl language.

Monitor used for displaying processed data. It based on PHP.

# HARDWARE REQUIREMENTS:

HDD 100GB or more;
RAM 4GB or more
AMD64-architecture microprocessor;
Network interface;
Internet connection (used for software installation)

# SOFTWARE REQUIREMENTS:

1) Installed OS (*nix/Windows/MacOS)
2) Installed Perl (with threads) - http://www.perl.org
3) Installed PostgreSQL - https://www.postgresql.org/
4) Installed PHP v7.4 - http://www.php.net
5) Installed Apache - http://apache.org

# FEATURES:

- multithreading
- working with netflow v5 and v9
- processing data on fly
- storing data in PostgreSQL

WARNING:
!!! Project does not works with CiscoASA sensors !!!

If you faced with problems, send email to service@it-answer.ru

good luck!

# HOW TO INSTALL:

1. Install OS to your server;

2. Update/upgrade your ports/packages/distributions collection;

FreeBSD:
```
pkg update
pkg upgrade
```
Ubuntu:
```
sudo apt update
sudo apt upgrade
```

3. Install required software

FreeBSD:
```
pkg install perl5 p5-App-cpanminus p5-App-cpanoutdated postgresql13-server git apache24 php81 php81-pgsql mod_php81 php81-extensions
```
Ubuntu:
```
sudo apt install perl cpanminus cpanoutdated git postgresql libdbd-pg-perl apache2 php8.1 php8.1-pgsql
```

4. Configure, initiate and start your DB server.

FreeBSD:
```
echo postgresql_enable="YES" >> /etc/rc.conf
/usr/local/etc/rc.d/postgresql initdb
/usr/local/etc/rc.d/postgresql start
```
Ubuntu:
```
sudo passwd postgres
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

```
# Edit pg_hba.conf similar to this.

# Database administrative login by Unix domain socket
#local   all             postgres                                peer
local   all             postgres                                trust

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
#local   all             all                                     peer
local   all             all                                     trust

Ctrl+S
Ctrl+X
```

```
sudo service postgresql restart
```

Read more how to improve PostgreSQL security on your server

5. Update/Install Perl modules

FreeBSD:
```
cpanm App::cpanoutdated
cpan-outdated -p | cpanm
cpanm Data::Dumper DBI DBD::Pg JSON DateTime Daemon::Daemonize
```
Ubuntu
```
sudo cpanm App::cpanoutdated
sudo cpan-outdated -p | sudo cpanm
sudo cpanm Data::Dumper DBI DBD::Pg JSON DateTime Daemon::Daemonize
```

6. Configure and start Web-Server

FreeBSD:
```
echo apache24_enable="YES" >> /etc/rc.conf
Edit dir_module section:
<IfModule dir_module>
    DirectoryIndex index.html index.htm
    <FilesMatch "\.php$">
        SetHandler application/x-httpd-php
    </FilesMatch>
    <FilesMatch "\.phps$">
        SetHandler application/x-httpd-php-source
    </FilesMatch>
</IfModule>
/usr/local/etc/rc.d/apache24 restart
```

7. Install Netflow
FreeBSD
```
cd /usr/local/share/
git clone https://git.code.sf.net/p/netflow/code netflow
```
Ubuntu:
```
cd /usr/local/share/
sudo git clone https://git.code.sf.net/p/netflow/code netflow
```

8. Configure and launch collector
FreeBSD:
```
cd /usr/local/share/netflow/netflow-collector/pgsql
psql -U postgres -a -f dbinstall.sql
psql -U postgres -a -f ipfix.sql
cd ..
cp config.json.orig config.json
./netflow.pl
```
Ubuntu:
```
cd /usr/local/share/netflow/netflow-collector/pgsql
psql -U postgres -a -f dbinstall.sql
psql -U postgres -a -f ipfix.sql
cd ..
sudo cp config.json.orig config.json
./netflow.pl
```

if there is no error messages and it continue work press ctrl+c and start it as daemon

```
./netflow-collector.pl -daemonize
./netflow-analyzer.pl -daemonize
```

Automatic launch after reboot:

FreeBSD:
```
@reboot cd /usr/local/share/netflow/netflow-collector && /usr/local/bin/perl netflow-collector.pl -daemonize > /dev/null 2>&1
@reboot cd /usr/local/share/netflow/netflow-collector && /usr/local/bin/perl netflow-analyzer.pl -daemonize > /dev/null 2>&1
```
Ubuntu:
```
@reboot cd /usr/local/share/netflow/netflow-collector && /usr/bin/perl netflow-collector.pl -daemonize > /dev/null 2>&1
@reboot cd /usr/local/share/netflow/netflow-collector && /usr/bin/perl netflow-analyzer.pl -daemonize > /dev/null 2>&1
```

9. Configure Netflow Web interface

FreeBSD:
```
ln -s /usr/local/share/netflow/netflow-web /usr/local/www/apache24/data/netflow
cd /usr/local/share/netflow/netflow-web/php
cp config-orig.php config.php
```
Ubuntu:
```
sudo ln -s /usr/local/share/netflow/netflow-web /var/www/html/netflow
cd /usr/local/share/netflow/netflow-web/php
sudo cp config-orig.php config.php
```

Warning: This is a simpliest insecure example. It's better to use SSL.

10. Sending netflow data

Cisco v5:

```
!
ip flow-cache timeout active 1
ip flow-export source Loopback0
ip flow-export version 5
ip flow-export destination xxx.xxx.xxx.xxx 9998
!
interface GigabitEthernet0/x
 ip flow ingress
 ip flow egress
!
```

Cisco v9:

```
!
ip flow-cache timeout active 1
ip flow-export source Loopback0
ip flow-export version 9
ip flow-export destination xxx.xxx.xxx.xxx 9998
!
interface GigabitEthernet0/x
 ip flow ingress
 ip flow egress
!
```

Cisco v9 flexible netflow:

```
!
flow record ipv4flow
 match ipv4 source address
 match ipv4 destination address
 match ipv4 protocol
 collect timestamp sys-uptime first
 collect timestamp sys-uptime last
 collect routing next-hop address ipv4
 collect interface input snmp
 collect interface output snmp
 collect counter bytes
 collect counter packets
 collect transport source-port
 collect transport destination-port
 collect transport tcp flags
 collect ipv4 tos
 collect routing source as
 collect routing destination as
 collect ipv4 source mask
 collect ipv4 destination mask
!
flow exporter ipv4exp1
 destination xxx.xxx.xxx.xxx
 source Loopback0
 transport udp 9998
!
flow monitor ipv4mon
 exporter ipv4exp1
 cache timeout active 60
 record ipv4flow
!
sampler ipv4sampler
 mode random 1 out-of 100
!
interface GigabitEthernet0/x
 ip flow monitor ipv4mon sampler ipv4sampler input
 ip flow monitor ipv4mon sampler ipv4sampler output
!
```

Note: This is the example with using sampling rate! Don't forget to apply same rate in the web-interface->v9templates tab!

11. Using Web-interface
If everything right, you will be able to open web interface:
http://your.server.name/netflow/

Default user/pass:
```
admin/admin
user/user
```

After daemon launch and sending netflow data there will appear new devices. It will be disabled by default. You have to enable it to start gather information.
If you gather netflow v9 information, you have to enable v9templates as well. Sensors (routers) may not send v9template instantly after enabling device, so you have to wait a few minutes before it appears.

# CHANGELOG:

 **0.1.1alpha**

- 01.08.2022 - Project published on GitHub
- 12.07.2022 - Added external links to dashboard.
- 07.07.2022 - Added charts to raw data tab.
- 04.07.2022 - Minor bugfixes.
- 17.06.2022 - Totally reworked code.
- 17.06.2022 - Fixed daemon crashes cause of new device data transfer.
- 17.06.2022 - Using PostgreSQL DB Engine instead of weak MySQL.
- 17.06.2022 - No more Cacti Plugin integration. Web interface works in standalone mode only.
- 17.06.2022 - User Authentication Support (don't forget combine with SSL).
- 17.06.2022 - Huge performance and stability increase.

 **0.0.7**

- 27.07.2016 - Added database optimization. Less detalization, but more performance.
- 27.07.2016 - Added access lists to avoid transfering from invalid sensors. (look /nflows/collector/threaded.pl -> @allowed variable that 0.0.0.0 by default)
- 27.07.2016 - Added scales for graphs.
- 27.07.2016 - Changed database structure.

 **0.0.6**

- 05.05.2015 - Separated tables for each device should increase perfomance
- 05.05.2015 - Collector cleans old data every hour. No need to use cron - crutches
- 05.05.2015 - No need to create any table in database. Collector creates all required tables

 **0.0.5**

- 14.10.2014 - Collector works as daemon now (freebsd)
- 14.10.2014 - Project can be installed as a port in freebsd (see the freebsd filefolder)
- 14.10.2014 - Fixed some bugs

 **0.0.4**

- 07.10.2013 - Integration as plugin Cacti! (http://www.cacti.net/)
- 07.10.2013 - Finished developing time intervals on the web-interface
- 07.10.2013 - Fixed some bugs

 **0.0.3**

- 09.09.2013 - Added interfaces discovering via SNMP
- 09.09.2013 - Improved Netflow-monitor interface
- 09.09.2013 - Changed database structure
- 09.09.2013 - Changed README file

 **0.0.2**

- 20.08.2013 - Fixed chart generator (/nflows/collector/php)
- 20.08.2013 - Changed/Corrected README.TXT
- 20.08.2013 - Deprecated "mysql_" methods changed to "mysqli_"
- 20.08.2013 - Project moved in to "Netflow" project

 **0.0.1**

- 19.08.2013 - Fixed a lot of bugs