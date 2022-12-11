![netflow-schema](https://user-images.githubusercontent.com/25764692/204842421-f292c9fb-72b9-4627-9a96-a5f71e133bd0.png)

# Description:

Netflow project used to gather, store and process netflow data from sensors like Cisco routers. The project includes collector, analyzer and monitor.

Collector and analyzer:
This is a multithreaded application (daemon). After getting data, it transfers data to analyzer, which process it and send into database. The program based on perl language.

Monitor used for displaying processed data. It based on PHP (API) and Javascript.

# Features:

- separated collectors nodes;

- multithreading;

- working with netflow v5 and v9;

- processing data on fly;

- storing data in PostgreSQL;

# Hardware requirements:

- HDD 100GB or more;

- RAM 4GB or more;

- AMD64-architecture microprocessor;

- Network interface;

- Internet connection (used for software installation).

# Software requirements:

- Installed OS (*nix/Windows/MacOS);

- Installed Perl (with threads) - http://www.perl.org

- Installed PostgreSQL - https://www.postgresql.org/

- Installed PHP v7.4 - http://www.php.net

- Installed Apache - http://apache.org

# Provided with:

Plotly JavaScript Open Source Graphing Library - https://plotly.com/javascript/

# Warning:

!!! USE OF THIS PRODUCT IMPLIES APPROPRIATE KNOWLEDGE IN THE SERVER AND NETWORK ADMINISTRATION !!!

!!! Project does not works with CiscoASA sensors !!!

# Support and feedback:

If you faced with problems, send email to service@it-answer.ru

# Installation guide

Read the following files for instructions:

- InstallFreeBSD.md

- InstallUbuntu.md

# Netflow sensors (routers) configuration guide

There is a few examples how-to configure routers to send netflow data to collectors:

- ConfigureCisco.md

- ConfigureJuniper.md

# Changelog:

 **0.1.4**

- 11.12.2022 - Edited ubuntu installation guides;
- 06.12.2022 - Added schemas information into dashboard tab;
- 06.12.2022 - Added statistics tab that shows tables size information in database;

 **0.1.3a**

- 01.12.2022 - Bug fixes;
- 01.12.2022 - Web interface improvements;
- 01.12.2022 - Added mac db page to resolve vendors by mac-address.

 **0.1.2a**

- 05.11.2022 - Bugfixes;
- 03.11.2022 - Added stacked area charts instead of pie charts. A lot of changes and improvements;
- 01.11.2022 - Added nodes feature that allows to implement distributed collectors network;
- 01.11.2022 - Changed database structure (using PostgreSQL schemas).

 **0.1.1a**

- 01.08.2022 - Project published on GitHub;
- 12.07.2022 - Added external links to dashboard;
- 07.07.2022 - Added charts to raw data tab;
- 04.07.2022 - Minor bugfixes;
- 17.06.2022 - Totally reworked code;
- 17.06.2022 - Fixed daemon crashes cause of new device data transfer;
- 17.06.2022 - Using PostgreSQL DB Engine instead of weak MySQL;
- 17.06.2022 - No more Cacti Plugin integration. Web interface works in standalone mode only;
- 17.06.2022 - User Authentication Support (don't forget combine with SSL);
- 17.06.2022 - Huge performance and stability increase.

 **0.0.7**

- 27.07.2016 - Added database optimization. Less detalization, but more performance;
- 27.07.2016 - Added access lists to avoid transfering from invalid sensors. (look /nflows/collector/threaded.pl -> @allowed variable that 0.0.0.0 by default);
- 27.07.2016 - Added scales for graphs;
- 27.07.2016 - Changed database structure.

 **0.0.6**

- 05.05.2015 - Separated tables for each device should increase perfomance;
- 05.05.2015 - Collector cleans old data every hour. No need to use cron - crutches;
- 05.05.2015 - No need to create any table in database. Collector creates all required tables.

 **0.0.5**

- 14.10.2014 - Collector works as daemon now (freebsd);
- 14.10.2014 - Project can be installed as a port in freebsd (see the freebsd filefolder);
- 14.10.2014 - Fixed some bugs.

 **0.0.4**

- 07.10.2013 - Integration as plugin Cacti! (http://www.cacti.net/);
- 07.10.2013 - Finished developing time intervals on the web-interface;
- 07.10.2013 - Fixed some bugs.

 **0.0.3**

- 09.09.2013 - Added interfaces discovering via SNMP;
- 09.09.2013 - Improved Netflow-monitor interface;
- 09.09.2013 - Changed database structure;
- 09.09.2013 - Changed README file.

 **0.0.2**

- 20.08.2013 - Fixed chart generator (/nflows/collector/php);
- 20.08.2013 - Changed/Corrected README.TXT;
- 20.08.2013 - Deprecated "mysql_" methods changed to "mysqli_";
- 20.08.2013 - Project moved in to "Netflow" project.

 **0.0.1**

- 19.08.2013 - Fixed a lot of bugs;
- 19.08.2013 - First release.