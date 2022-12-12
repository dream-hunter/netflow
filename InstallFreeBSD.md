# All-in-one server installation guide
There is the three big steps to see netflow data on your dashboard:

1. Installing the required software on the server;

2. Installing and Configuring Netflow;

3. Routers(sensors) configuring.

## Installing the required software on the server
*You need root permissions to perform a software install*

1. Install OS on your server;

2. Update/upgrade it's software collection:
```
pkg update
pkg upgrade
```

3. Install required software:
```
pkg install perl5 p5-App-cpanminus p5-App-cpanoutdated p5-JSON p5-DateTime p5-DBI p5-DBD-Pg postgresql13-server apache24 php81 php81-pgsql mod_php81 php81-extensions php81-snmp
```

4. Configure, initiate and start your local DB server:
```
echo postgresql_enable="YES" >> /etc/rc.conf
```

Optionally you can allow access to netflow database for remote hosts
```
echo "listen_addresses = '*'" >> /var/db/postgres/data14/postgresql.conf
echo "host netflow netflow 0.0.0.0/0 trust" >> /var/db/postgres/data13/pg_hba.conf
```
*Note: It is better to replace 0.0.0.0/0 with a specific server IP address in pg_hba.conf. For example "host netflow netflow 10.10.10.10/32 trust".*

```
/usr/local/etc/rc.d/postgresql initdb
```
```
/usr/local/etc/rc.d/postgresql start
```

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

## Installing and Configuring Netflow

### Netflow server install

1. Login as netflow user.

2. Download and unpack netflow archieve
```
cd ~/
fetch https://github.com/dream-hunter/netflow/archive/refs/tags/0.1.x.tar.gz
tar -xzf 0.1.x.tar.gz
```

3. Create database:
```
cd ~/netflow-0.1.x/netflow-collector/sql/ && psql -U postgres -a -f dbinstall.sql
```

4. Create schemas:
```
cd ~/netflow-0.1.x/netflow-collector/sql/ 
psql -U postgres -a -f reinstall_collector_schema.sql
psql -U postgres -a -f reinstall_analyzer_schema.sql
psql -U postgres -a -f reinstall_dashboard_schema.sql
```

5. Copy configuration file:
```
cd ~/netflow-0.1.x/netflow-collector && cp config.json.orig config.json
```

### Collector's daemon configuring and launch

1. Launch collector to make sure that everything works fine:
```
/usr/local/bin/perl ./netflow-collector.pl
```

2. If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/local/bin/perl ./netflow-collector.pl -daemonize
```

3. To make sure collector's daemon works, you can try the following commands:
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

4. To start collector after reboot simply add into cron the following line:
```
@reboot cd /usr/home/netflow/netflow-0.1.x/netflow-collector/ && /usr/local/bin/perl ./netflow-collector.pl -daemonize > /dev/null 2>&1
```

### Analyzer's daemon launch

1. Launch analyzer to make sure that everything works fine:
```
cd ~/netflow-0.1.x/netflow-collector/
/usr/local/bin/perl ./netflow-analyzer.pl
```
If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/local/bin/perl ./netflow-analyzer.pl -daemonize
```

2. To make sure that analyzer works, you can try the following commands:
```
ps -axjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/local/bin/perl ./netflow-analyzer.pl -daemonize
```

3. To start analyzer after reboot simply add into cron (crontab -e) the following line:
```
@reboot cd /usr/home/netflow/netflow-0.1.x/netflow-collector/ && /usr/local/bin/perl ./netflow-analyzer.pl -daemonize > /dev/null 2>&1
```

### Dashboard configuration
*You need root permissions to perform a dashboard configuration*

1. Configure and start Web-Server (make sure you installed it in step 3 the pre-installation guide). Edit file httpd.conf:
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

2. Create a copy netflow web interface config file:
```
cd /usr/home/netflow/netflow-0.1.x/netflow-web/php/ && cp config.php.orig config.php
```

3. Make symlink into www-root directory:
```
cd /usr/local/www/apache24/data && ln -s /usr/home/netflow/netflow-0.1.x/netflow-web/
```

4. Check your dashboard in browser http://your.server.address/netflow-web/
Default users/passwords:
```
admin/admin
user/user
```

**After daemon launch and sending netflow data there will appear new devices.
It will be disabled by default. You have to enable it to start gather information.
If you gather netflow v9 information, you have to enable v9templates as well.
Sensors (routers) may not send v9template instantly after enabling device, so you have to wait a few minutes before it appears.**
