# Cisco routers

## Netflow v5

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

## Netflow v9

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

##Netflow v9 flexible

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
