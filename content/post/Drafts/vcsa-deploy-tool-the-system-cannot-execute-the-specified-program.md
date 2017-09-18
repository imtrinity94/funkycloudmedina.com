---
title: "vcsa-deploy.exe - The system cannot execute the specified program"
tags: ["VMware", "vSphere", "VCSA", "vCenter"]
date: 2017-09-04
draft: true
---

For my vSphere 5.5U3 to vSphere 6.0U3 migrations I was using the vcsa-deploy.exe tool included on the VCSA ISO. This tool allows you to define your current and new vCenter servers in a JSON file with all information required for a successful migration. It has saved me hours of clickng in the wizard considering the number of times the migration would fail (wrong passwords entered etc).

However, every time I would run the CLI tool I would get this:

>The system cannot execute the specified program.

Every. Single. Time.

Restarting the Windows server I was running it on (Windows Server 2012) wouldn't fix it. Downloading another copy of the VCSA ISO wouldn't fix it. Mounting the ISO from a Datastore instead of via the console and pointing to my desktop didn't fix it.

You know what did work? A hard reset of the VM. Not a guest shutdown, but a reset. 

Fun fact, this is the exact same tool used by the migration wizard GUI that is run from the VCSA ISO. So if you ever get non-descript errors or the wizard fails for an unknown reason during the migration in the GUI try running the tool manually.

I have no idea why, but resetting the VM and not just restarting it worked.