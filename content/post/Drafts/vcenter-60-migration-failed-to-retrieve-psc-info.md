---
title: "vCenter 6.0 Migration - Failed to retrieve the Platform Services Controller information"
tags: ["VMware", "vSphere", "VCSA", "vCenter", "Migration", "migrate2vcsa"]
date: 2017-09-13
draft: true
---

This nugget got me right at the start of my migrations to the vCenter Server Server Appliance. I was migrating from Windows vCenter v5.5 U3e to v6.0U3 appliance. I'd get to the PSC information page and once I clicked Next I'd get this message:

```
Failed to retrieve the Platform Services Controller information"
```

Nothing else. No error codes or reason as to why the PSC couldn't be contacted. I had a look at our firewall logs and saw nothing being blocked between the vCenter server and the PSCs. As the PSCs were behind an F5 load balancer, I thought that maybe the load balancer config was not up to scratch. I went through all the configs with our networks team and the VMware KB on configuring it (link). We couldn't find a single fault. 

After a lot of time with VMware Support, I ended up just repointing the Windows vCenter instance from the LB VIP to the active node behind the LB. That was a whole endeavour in itself that you can read about here: (link).

