# All-in-one server installation guide
There is the three big steps to see netflow data on your dashboard:

1. Installing the required software on the server;

2. Installing and Configuring Netflow;

3. Routers(sensors) configuring.

## Installing the required software on the server
*You need superuser permissions to perform installation*

1. Install OS on your server;

2. Update/upgrade it's software collection:
```
sudo apt update
sudo apt upgrade -y
```

3. Install required software:
```
sudo apt install -y dialog ntpdate perl cpanminus cpanoutdated postgresql libdbd-pg-perl libdatetime-perl apache2 php8.1 php8.1-pgsql php8.1-snmp
```

4. Configure, initiate and start your local DB server:
```
echo "host netflow netflow 127.0.0.1/32 trust" | sudo tee -a /etc/postgresql/14/main/pg_hba.conf
```
*Note: This in an example for local access to database. Read more how-to grant access for remote hosts*
```
sudo service postgresql restart
```
```
sudo -u postgres psql
```
```
ALTER USER postgres with password 'yourpassword';
```
```
exit
```

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

## Installing and Configuring Netflow

### Netflow server install

1. Login as netflow user.

2. Download and unpack netflow archieve
```
cd ~/
wget https://github.com/dream-hunter/netflow/archive/refs/tags/0.1.x.tar.gz
tar -xzf 0.1.x.tar.gz
```

3. Create database:
```
cd ~/netflow-0.1.x/netflow-collector/sql/ && psql -U postgres -W -h 127.0.0.1 -a -f dbinstall.sql
```

4. Create schemas:
```
cd ~/netflow-0.1.x/netflow-collector/sql/.
psql -U netflow -h 127.0.0.1 -a -f reinstall_collector_schema.sql
psql -U netflow -h 127.0.0.1 -a -f reinstall_analyzer_schema.sql
psql -U netflow -h 127.0.0.1 -a -f reinstall_dashboard_schema.sql
```
*default password for netflow user - 'netflow'*

5. Copy configuration file:
```
cd ~/netflow-0.1.x/netflow-collector && cp config.json.orig config.json
```

### Collector's daemon configuring and launch

1. Test launch collector:
```
/usr/bin/perl ./netflow-collector.pl
```

2. If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/bin/perl ./netflow-collector.pl -daemonize
```

3. To make sure collector works, you can try the following commands:
```
ps -xjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/bin/perl ./netflow-collector.pl -daemonize
```

4. To start collector after reboot simply add into netflow user's cron (crontab -e) the following line:
```
@reboot cd /usr/home/netflow/netflow-0.1.x/netflow-collector/ && /usr/bin/perl ./netflow-collector.pl -daemonize > /dev/null 2>&1
```

### Analyzer's daemon launch

1. Launch analyzer to make sure that everything works fine:
```
cd ~/netflow-0.1.x/netflow-collector/
/usr/bin/perl ./netflow-analyzer.pl
```
If there is no error messages and it continue work press ctrl+c and start it as daemon:
```
/usr/bin/perl ./netflow-analyzer.pl -daemonize
```

2. To make sure that analyzer works, you can try the following commands:
```
ps -xjU netflow
```
If you see the following line, it works correct:
```
netflow  1069    1 1068 1068    0 I     -   0:00.03 /usr/local/bin/perl ./netflow-analyzer.pl -daemonize
```

3. To start analyzer after reboot simply add into netflow user's cron (crontab -e) the following line:
```
@reboot cd /usr/home/netflow/netflow-0.1.x/netflow-collector/ && /usr/bin/perl ./netflow-analyzer.pl -daemonize > /dev/null 2>&1
```

### Dashboard configuration
*You need a superuser permissions to perform dashboard configuration*

1. Make a copy into apache2 www-root directory
```
sudo cp -R /home/netflow/netflow-0.1.x/netflow-web /var/www/html
```

2. Create a copy netflow web interface config file:
```
cd /var/www/html/netflow-web/php && sudo cp config.php.orig config.php
```

3. Check your dashboard in browser http://your.server.address/netflow-web/
Default users/passwords:
```
admin/admin
user/user
```

**After daemon launch and sending netflow data there will appear new devices.
It will be disabled by default. You have to enable it to start gather information.
If you gather netflow v9 information, you have to enable v9templates as well.
Sensors (routers) may not send v9template instantly after enabling device, so you have to wait a few minutes before it appears.**
