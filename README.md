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

- separated collectors nodes
- multithreading
- working with netflow v5 and v9
- processing data on fly
- storing data in PostgreSQL

WARNING:
!!! Project does not works with CiscoASA sensors !!!

If you faced with problems, send email to service@it-answer.ru

good luck!

# INSTALLATION GUIDE
There is the three big steps to see netflow data on your dashboard:
1) Netflow collector installation;
2) Netflow analyzer installation;
3) Routers(sensors) configuration.

## Netflow server pre-installation guide
### Debian/Ubuntu
*You need superuser permissions to perform installation*
1. Install OS on your server;
2. Update/upgrade it's ports/packages collection:
```
sudo apt update
sudo apt upgrade -y
```
3. Install required software:
```
sudo apt install -y dialog ntpdate git perl cpanminus cpanoutdated postgresql libdbd-pg-perl libdatetime-perl
```
If you going install netflow-analyzer and/or netflow-web, you need also:
```
sudo apt install -y apache2 php8.1 php8.1-pgsql
```
4. Configure, initiate and start your local DB server:
```
echo "listen_addresses='*'" | sudo tee -a /etc/postgresql/14/main/postgresql.conf
echo "host netflow netflow 0.0.0.0/0 trust" | sudo tee -a /etc/postgresql/14/main/pg_hba.conf
sudo service postgresql restart
sudo -u postgres psql
ALTER USER postgres with password 'yourpassword';
exit
```
*Note: It's better to replace 0.0.0.0/0 to your analyzer server ip in pg_hba.conf. For example "host netflow netflow 10.10.10.10/32 trust*".

5. Update/Install Perl modules:
```
sudo cpanm App::cpanoutdated
sudo cpan-outdated -p | cpanm
sudo cpanm Daemon::Daemonize
```
6. Synchronize your server clock with NTP time server:
```
sudo ntpdate <your.ntp.server.address>
```
7. Create user netflow and set it's password:
```
sudo adduser netflow
```
8. To be able to start collector and/or analyzer as daemon, you need to grant access rights for log and pid files:
```
sudo touch /var/log/netflow.log
sudo chown -R netflow:netflow /var/log/netflow.log
sudo mkdir /var/run/netflow
sudo chown -R netflow:netflow /var/run/netflow
```
### FreeBSD
*You need root permissions to perform installation*
1. Install OS on your server;
2. Update/upgrade it's ports/packages collection:
```
pkg update
pkg upgrade
```
3. Install required software:
```
pkg install perl5 p5-App-cpanminus p5-App-cpanoutdated p5-JSON p5-DateTime p5-DBI p5-DBD-Pg postgresql13-server git
```
If you going install netflow-analyzer and/or netflow-web, you need also:
```
pkg install apache24 php81 php81-pgsql mod_php81 php81-extensions
```
4. Configure, initiate and start your local DB server:
```
echo postgresql_enable="YES" >> /etc/rc.conf
echo "listen_addresses = '*'" >> /var/db/postgres/data13/postgresql.conf
echo "host netflow netflow 0.0.0.0/0 trust" >> /var/db/postgres/data13/pg_hba.conf
/usr/local/etc/rc.d/postgresql initdb
/usr/local/etc/rc.d/postgresql start
```
*Note: It's better to replace 0.0.0.0/0 to your analyzer server ip in pg_hba.conf. For example "host netflow netflow 10.10.10.10/32 trust*".

5. Update/Install Perl modules:
```
cpanm App::cpanoutdated
cpan-outdated -p | cpanm
cpanm Daemon::Daemonize
```
6. Synchronize your server clock with NTP time server:
```
ntpdate <your.ntp.server.address>
```
7. Create user netflow and set it's password:
```
pw useradd -n netflow -d /home/netflow -m -s /bin/csh -c 'netflow user'
passwd netflow
```
8. To be able to start collector and/or analyzer as daemon, you need to grant access rights for log and pid files:
```
touch /var/log/netflow.log
chown -R netflow:netflow /var/log/netflow.log
mkdir /var/run/netflow
chown -R netflow:netflow /var/run/netflow
```
## Netflow collector guide
### Debian/Ubuntu
1. Login as netflow user.
2. Install Netflow
```
git clone https://github.com/dream-hunter/netflow.git
```
3. Create database:
```
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -W -h 127.0.0.1 -a -f dbinstall.sql
```
4. Create collector schema:
```
cd ~/netflow/netflow-collector/sql/ && psql -U netflow -W -a -f reinstall_collector_schema.sql
```
5. Configure and launch collector
```
cd ~/netflow/netflow-collector && cp config.json.orig config.json
/usr/bin/perl ./netflow-collector.pl
```
6. If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/bin/perl ./netflow-collector.pl -daemonize
```
7. To make sure collector works, you can try the following commands:
```
ps -xjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/bin/perl ./netflow-collector.pl -daemonize
```
8. To start collector after reboot simply add into cron the following line:
```
@reboot cd /usr/home/netflow/netflow/netflow-collector/ && /usr/bin/perl netflow-collector.pl -daemonize > /dev/null 2>&1
```
### FreeBSD
1. Login as netflow user.
2. Install Netflow
```
git clone https://github.com/dream-hunter/netflow.git
```
3. Create database:
```
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -a -f dbinstall.sql
```
4. Create collector schema:
```
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -a -f reinstall_collector_schema.sql
```
5. Configure and launch collector
```
cd ~/netflow/netflow-collector && cp config.json.orig config.json
/usr/local/bin/perl ./netflow-collector.pl
```
6. If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/local/bin/perl ./netflow-collector.pl -daemonize
```
7. To make sure collector works, you can try the following commands:
```
ps -axjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/local/bin/perl ./netflow-collector.pl -daemonize
```
Also you can check opened port (9998 by default):
```
netstat -an | grep 9998
```
Normal output:
```
udp4       0      0 *.9998
```
8. To start collector after reboot simply add into cron the following line:
```
@reboot cd /usr/home/netflow/netflow/netflow-collector/ && /usr/local/bin/perl netflow-collector.pl -daemonize > /dev/null 2>&1
```
## Netflow analyzer and dashboard guide
### Debian/Ubuntu
*If you going install analyzer to the same server, skip steps 2-3 and 5.*
1. Login as netflow user.
2. Install Netflow
```
git clone https://github.com/dream-hunter/netflow.git
```
3. Create database:
```
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -W -h 127.0.0.1 -a -f dbinstall.sql
```
4. Create analyzer schema:
```
cd ~/netflow/netflow-collector/sql/ && psql -U netflow -W -a -f reinstall_analyzer_schema.sql
cd ~/netflow/netflow-collector/sql/ && psql -U netflow -W -a -f reinstall_dashboard_schema.sql
```
5. Try to launch analyzer:
```
cd ~/netflow/netflow-collector/
cp config.json.orig config.json
/usr/bin/perl ./netflow-analyzer.pl
```
If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/bin/perl ./netflow-analyzer.pl -daemonize
```
6. To make sure that analyzer works, you can try the following commands:
```
ps -xjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/bin/perl ./netflow-analyzer.pl -daemonize
```
7. To start analyzer after reboot simply add into cron the following line:
```
@reboot cd /home/netflow/netflow/netflow-collector/ && /usr/bin/perl netflow-analyzer.pl -daemonize > /dev/null 2>&1
```
8. Create a copy netflow web interface config file:
```
cd /home/netflow/netflow/netflow-web/php/ && cp config.php.orig config.php
```
9. Login as ***superuser*** and make a copy into www-root directory:
```
sudo cp -R /home/netflow/netflow/netflow-web /var/www/html
```
10. Check your dashboard in browser http://your.server.address/netflow-web/
Default users/passwords:
```
admin/admin
user/user
```
### FreeBSD
*If you going install analyzer to the same server, skip steps 2-3.*
1. Login as netflow user.
2. Install Netflow
```
git clone https://github.com/dream-hunter/netflow.git
```
3. Create database:
```
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -a -f dbinstall.sql
```
4. Create analyzer schema:
```
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -a -f reinstall_analyzer_schema.sql
cd ~/netflow/netflow-collector/sql/ && psql -U postgres -a -f reinstall_dashboard_schema.sql
```
5. Try to launch analyzer:
```
cd ~/netflow/netflow-collector/
cp config.json.orig config.json
/usr/local/bin/perl ./netflow-analyzer.pl
```
If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/local/bin/perl ./netflow-analyzer.pl -daemonize
```
6. To make sure that analyzer works, you can try the following commands:
```
ps -axjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/local/bin/perl ./netflow-analyzer.pl -daemonize
```
7. To start analyzer after reboot simply add into cron the following line:
```
@reboot cd /usr/home/netflow/netflow/netflow-collector/ && /usr/local/bin/perl netflow-analyzer.pl -daemonize > /dev/null 2>&1
```
8. Configure and start Web-Server (make sure you installed it in step 3 the pre-installation guide). Edit file httpd.conf:
```
ee /usr/local/etc/apache24/httpd.conf
```
Find section <dir_module> and change it like this:
```
<IfModule dir_module>
    DirectoryIndex index.html index.htm index.php
    <FilesMatch "\.php$">
        SetHandler application/x-httpd-php
    </FilesMatch>
    <FilesMatch "\.phps$">
        SetHandler application/x-httpd-php-source
    </FilesMatch>
</IfModule>
```
For proper config add your server name/ip address into httpd.conf. For example:
```
ServerName 10.10.10.10:80
```
Enable Apache server and (re)start it.
```
echo apache24_enable="YES" >> /etc/rc.conf
/usr/local/etc/rc.d/apache24 restart
```
9. Create a copy netflow web interface config file:
```
cd /usr/home/netflow/netflow/netflow-web/php/ && cp config.php.orig config.php
```
10. Make symlink into www-root directory:
```
cd /usr/local/www/apache24/data && ln -s /usr/home/netflow/netflow/netflow-web/
```
11. Check your dashboard in browser http://your.server.address/netflow-web/
Default users/passwords:
```
admin/admin
user/user
```
## Netflow sensors (routers) configuration guide
### Cisco routers
Netflow v5
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
Netflow v9
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
Netflow v9 flexible
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
*Note: This is the example with using sampling rate! Don't forget to apply same rate in the web-interface->v9templates tab!*

### Juniper
Jflow SRX320/340/345:
```
set forwarding-options sampling input rate 100
set forwarding-options sampling family inet output flow-server 10.10.10.10 port 9998
set forwarding-options sampling family inet output flow-server 10.10.10.10 source-address 20.20.20.20
set interfaces reth2 unit 0 family inet sampling input
set interfaces reth2 unit 0 family inet sampling output
set interfaces ge-0/0/3 unit 0 family inet sampling input
set interfaces ge-0/0/3 unit 0 family inet sampling output
set interfaces ge-0/0/5 unit 0 family inet sampling input
set interfaces ge-0/0/5 unit 0 family inet sampling output
```
*Instead of Cisco routers you have to set sampling input/output on all interfaces.
Also there are problems with sending OIF information because of internal routing engine mechanic in juniper routers. So it's better do not use OIF filters on dashboard.*


**After daemon launch and sending netflow data there will appear new devices. It will be disabled by default. You have to enable it to start gather information.
If you gather netflow v9 information, you have to enable v9templates as well. Sensors (routers) may not send v9template instantly after enabling device, so you have to wait a few minutes before it appears.**

# CHANGELOG:

 **0.1.2alpha**

- 05.11.2022 - Bugfixes.
- 03.11.2022 - Added stacked area charts instead of pie charts. A lot of changes and improvements.
- 01.11.2022 - Added nodes feature that allows to implement distributed collectors network.
- 01.11.2022 - Changed database structure (using PostgreSQL schemas).

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