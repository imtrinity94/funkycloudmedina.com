---
title: "vCloud Availability - vCD Gateway creation failed"
tags: ["VMware", "vCloud", "Availability", "DRaaS"]
date: 2018-01-23
draft: false
---
After a short break over Christmas and New Year's I threw myself into the latest version of vCloud Availability for vCloud Director (2.0).

The installation of vCloud Availability for vCloud Director (vCAv) is all done through an "installer appliance", a CLI and a configuration file called a 'registry'. I opted for the 'automated' installation using a registry file and had all of my configuration and VM deployment specs in there.

I won't go into detail around the deployment of vCAv as the official VMware documentation covers the bulk of it, but I did get caught up on a number of things, which resulted in many re-deployments of vCAv components. The biggest hurdle I had is this one.

# Symptom

During deployment the vCAv installer would timeout and fail when configuring the HCS appliance. Specifically, I was getting this error from the vCAv CLI:

> "External service 'vSphereReplication' failed to respond in the specified timeout (10 SECONDS)"

My vCloud Director cells and Cloud Proxy cell were configured to the finest detail as VMware's docs listed, so I knew that wasn't the problem.

I SSH'd into the HCS appliance that was deployed and changed to the following directory: `/opt/vmware/hms/logs`. Here you'll find the HCS service logs. Mainly `hcs.log` and `hcs-stderrout.log`. It was there I found the following exception:

> Error creating bean with name 'vcdGateway' defined in class path resource

I'm ashamed to admit it but I spent quite a few days flailing around in this environment trying to find out what the problem was. I thought it was the CassandraDB cluster or the RabbitMQ server. Alas, it was not.

# Investigation

There was a log entry on either the HCS or HMS VM stating that 'hbr' had already been registered in vCloud. The message was similar to:

> 'hbr' extension already registered.

Interesting! So I jump over to the vCAv documentation, specifically the "Unregister and cleanup operations" section for Service Providers and found [these](https://docs.vmware.com/en/vCloud-Availability-for-vCloud-Director/2.0/com.vmware.vcavcd.install.config.doc/GUID-9247DC8A-5984-4552-B171-DCDD09AAA0B5.html). I was hoping there may have been a stale entry from the number of deployment retries or a user that was registered to some other component that I could cleanup and get a successful deployment. I ran through both tasks (unregister vSphere Replication users and CassandraDB solution from vSphere SSO) and restarted the vCAv deployment.

The deployment failed in the same place with the same 'hbr' messages as above. It was here that I logged a call with VMware for assistance. They made some great recommendations:

+ Check each component has appropriate comms to other components
+ Delete all vCD and HCS objects (queues, exchanges etc) from RabbitMQ. This was doable in my situation as it was a test environment. **Not recommended for production**.

These suggestions didn't fix my issue but were better than I could come up with. Until...

# Resolution

I checked the help from the **vcav** utility on the vCAv installer appliance (vcav --help). There is a command you can run that will unregister the HCS extension from vCloud Director. This is different to the unregister commands listed above. I was hesitant but had nothing to lose. With my failed deployment still there (vCAv component VMs still running and half configured) I ran the following commands on the vCAv installer appliance:

```
vcav vcd remove-vr-user --vcd={vcd-registry-name} --all --debug
vcav hcs unregister-cassandra --vcd={vcd-registry-name} --hcs-address={hcs-appliance-ip} --all --debug
vcav hcs unregister-extension --vcd={registry-name-for-vcd} --hcs-address={hcs-appliance-ip} --all --debug
```

I like to use the `--debug` switch on the vCAv tool so I can see what's going on. What we're doing here is removing the vSphere replication solution users from vCloud Director (the same ones that are imported from vSphere SSO). Then, remove the CassandraDB solution from vCD and HCS. Finally, the step that solved all of my problems, remove the HCS extension from vCloud Director. I've done this a number of times and this order is what worked for me.

The commands take a few nail-biting seconds to complete. Once they're all complete I kicked off the vCAv deployment again with the `--overwrite` and `--reconfigure` switches:

```
vcav prevalidate --overwrite --reconfigure --unregister-hms-extension --debug
```

In about 20 minutes I saw the sweetest result code I had ever seen: `RC: 0` telling me that the entire deployment was successful.

As to why this happens, I'm not sure. It's possible that HCS registers as an extension but fails to validate or perform some follow up task with vCD leaving the registration incomplete and a stale registration behind.

Good luck!