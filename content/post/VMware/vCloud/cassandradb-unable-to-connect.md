---
title: "CassandraDB Shell - Unable to connect to any servers"
tags: ["VMware", "vCloud", "vCloud-Availability", "CassandraDB"]
date: 2018-01-31
---
One of the core pre-requisites for vCloud Availability for vCloud Director 2.0 is CassandraDB. This database service stores replication state and storage information and is used by the HCS (vSphere Replication Cloud Service) appliance.

As part of my strained [vCloud Availability](/post/vmware/vcloud/vcloud-availability---vcd-gateway-creation-failed) deployment I needed to build a simple CassandraDB server. VMware Docs and the vCloud Architecture blog have some great information to get you started:

+ [vCloud Architecture blog - Deploying CassandraDB](https://blogs.vmware.com/vcat/2017/11/deploying-cassandra-vcloud-availability-part-1.html)
+ [VMware Docs - vCloud Availability for vCloud Director Installation Guide](https://docs.vmware.com/en/vCloud-Availability-for-vCloud-Director/2.0/com.vmware.vcavcd.install.config.doc/GUID-D2F5D059-E61E-4EAB-AE81-DF8098E9EB7A.html)

# Symptom

I built the CassandraDB server as described in the blog post and Docs pages above, but when I would try to connect to the database using the Cassandra shell (cqlsh {ip-address} 9042) I would get the following error:

> Connection error: ('Unable to connect to any servers', {'::1': error(101, "Tried connecting to [('::1', 9042, 0, 0)]. Last error: Network is unreachable"), '{ip-address}': error(111, "Tried connecting to [('{ip-address}', 9042)]. Last error: Connection refused")})

# Investigation

Plenty of Googling later showed that this might've been a listening address vs listening interface config issue but VMware explicitly state that you should listen on the interface and not the IP you've set. I rebuilt the server a few times thinking I had stuffed the build, but I still couldn't get it working...

# Solution

There is a specific [step during the CassandraDB configuration](https://docs.vmware.com/en/vCloud-Availability-for-vCloud-Director/2.0/com.vmware.vcavcd.install.config.doc/GUID-452096DF-EBAB-4E9D-8FFE-3ADC2E186798.html) that the VMware Docs will call out as having the potential to throw a Python error. Specifically Step 1f has the following:

```
Enter Cassandra command line to verify setup:
# cqlsh
If an error regarding python occurs when running cqlsh, update Python to Python 2.7.
```

While I was not getting a Python error, I tried the Python 2.7 fix anyway as detailed in the page above:

```
# yum install -y centos-release-SCL

# yum install -y python27

# scl enable python27 bash

# echo "/usr/lib/python2.7/site-packages/" > /opt/rh/python27/root/usr/lib/python2.7/site-packages/usrlocal.pth
```

Boom! The CassandraDB shell was able to connect to the database instance.

For the record, this was on a CentOS 7 installation.