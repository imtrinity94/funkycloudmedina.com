---
title: "vcsa-deploy.exe - The system cannot execute the specified program"
tags: ["VMware", "vSphere", "VCSA", "vCenter"]
date: 2017-09-04
draft: true
---

During my vSphere 5.5U3 to vSphere 6.0U3 VCSA migrations I kept getting this message from my migration server:

>The system cannot execute the specified program.

Every. Single. Time.

Restarting the Windows server I was running it on (Windows Server 2012) wouldn't fix it. Downloading another copy of the VCSA ISO wouldn't fix it. Mounting the ISO from a Datastore instead of via the console and pointing to my desktop didn't fix it.

You know what did work? A hard reset of the VM. Not a guest shutdown, but a reset. 

I have no idea why, but it worked. I have a feeling it may have been more of a Windows problem than a VMware problem..