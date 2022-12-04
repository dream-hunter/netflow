# Juniper

## Jflow SRX320/340/345:

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
Also there are problems with sending OIF information because of internal routing engine mechanic in juniper routers.
So it's better do not use OIF filters on dashboard.*
