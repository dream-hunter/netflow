# All-in-one server installation guide
There is the three big steps to see netflow data on your dashboard:

1. Netflow collector installation;

2. Netflow analyzer installation;

3. Routers(sensors) configuration.

## Before start

### Netflow server pre-installation guide
*You need superuser permissions to perform installation*

1. Install OS on your server;

2. Update/upgrade it's ports/packages collection:
```
sudo apt update
sudo apt upgrade -y
```

3. Install required software:
```
sudo apt install -y dialog ntpdate git perl cpanminus cpanoutdated postgresql libdbd-pg-perl libdatetime-perl apache2 php8.1 php8.1-pgsql php8.1-snmp
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
sudo cpan-outdated -p | sudo cpanm
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
echo "d /run/netflow 2775 netflow netflow - -" | sudo tee -a /usr/lib/tmpfiles.d/netflow-common.conf
```

## System configuration

### Netflow collector guide

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
## Netflow analyzer and dashboard guide
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
cd ~/netflow/netflow-collector/ && /usr/bin/perl ./netflow-analyzer.pl -daemonize
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

11. Configure your router to send netflow data to your collector node(s).

**After daemon launch and sending netflow data there will appear new devices. It will be disabled by default. You have to enable it to start gather information.
If you gather netflow v9 information, you have to enable v9templates as well. Sensors (routers) may not send v9template instantly after enabling device, so you have to wait a few minutes before it appears.**
